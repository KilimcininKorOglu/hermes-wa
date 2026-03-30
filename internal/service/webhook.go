package service

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"hermeswa/internal/model"
)

// Webhook config struct with TTL
type WebhookConfig struct {
	URL       string
	Secret    string
	ExpiresAt time.Time // Expiry time for cache entry
}

// Cache for webhook config (avoid N+1 query)
var (
	webhookCache      = make(map[string]*WebhookConfig)
	webhookCacheMutex sync.RWMutex
	webhookCacheTTL   = 5 * time.Minute // Cache valid for 5 minutes
)

type WebhookPayload struct {
	Event     string      `json:"event"`
	Timestamp time.Time   `json:"timestamp"`
	Data      interface{} `json:"data"`
}

// Get webhook config with caching + TTL
func GetWebhookConfig(instanceID string) (*WebhookConfig, error) {
	// Check cache first
	webhookCacheMutex.RLock()
	config, exists := webhookCache[instanceID]
	webhookCacheMutex.RUnlock()

	// Check if cache is still valid (not expired)
	if exists && config != nil && time.Now().Before(config.ExpiresAt) {
		return config, nil
	}

	// Cache miss or expired - load from DB
	inst, err := model.GetInstanceByInstanceID(instanceID)
	if err != nil {
		return nil, err
	}

	// Create config object with expiry time
	config = &WebhookConfig{
		URL:       inst.WebhookURL.String,
		Secret:    inst.WebhookSecret.String,
		ExpiresAt: time.Now().Add(webhookCacheTTL), // Set expiry
	}

	// Save to cache
	webhookCacheMutex.Lock()
	webhookCache[instanceID] = config
	webhookCacheMutex.Unlock()

	log.Printf("✅ Webhook config cached for instance: %s (expires in %v)", instanceID, webhookCacheTTL)
	return config, nil
}

// Invalidate cache (called when webhook config is updated)
func InvalidateWebhookCache(instanceID string) {
	webhookCacheMutex.Lock()
	delete(webhookCache, instanceID)
	webhookCacheMutex.Unlock()
	log.Printf("🗑️ Webhook cache invalidated for instance: %s", instanceID)
}

// Refactored function - now uses cache
func SendIncomingMessageWebhook(instanceID string, data map[string]interface{}) {
	// Get webhook config from cache (not DB!)
	config, err := GetWebhookConfig(instanceID)
	if err != nil || config.URL == "" {
		return
	}

	payload := WebhookPayload{
		Event:     "incoming_message",
		Timestamp: time.Now().UTC(),
		Data:      data,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		log.Printf("webhook: marshal error: %v", err)
		return
	}

	req, err := http.NewRequest("POST", config.URL, bytes.NewReader(body))
	if err != nil {
		log.Printf("webhook: new request error: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	// If webhook_secret is set, add HMAC signature header
	if config.Secret != "" {
		mac := hmac.New(sha256.New, []byte(config.Secret))
		mac.Write(body)
		signature := hex.EncodeToString(mac.Sum(nil))

		req.Header.Set("X-HERMESWA-Signature", signature)
	}

	client := &http.Client{Timeout: 5 * time.Second}
	go func() {
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("webhook: send error: %v", err)
			return
		}
		_ = resp.Body.Close()
	}()
}
