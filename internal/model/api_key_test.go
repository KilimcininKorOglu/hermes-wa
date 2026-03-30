package model

import (
	"testing"
)

func TestGenerateRawKey(t *testing.T) {
	key, err := generateRawKey()
	if err != nil {
		t.Fatalf("generateRawKey() failed: %v", err)
	}

	// Key must start with hwa_ prefix
	if len(key) < 4 || key[:4] != "hwa_" {
		t.Errorf("key should start with 'hwa_', got: %s", key[:4])
	}

	// Key length: "hwa_" (4) + 32 hex chars = 36
	if len(key) != 36 {
		t.Errorf("expected key length 36, got %d", len(key))
	}

	// Keys should be unique
	key2, _ := generateRawKey()
	if key == key2 {
		t.Error("two generated keys should be different")
	}
}

func TestHashKey(t *testing.T) {
	hash := hashKey("hwa_test123")

	// SHA-256 produces 64 hex chars
	if len(hash) != 64 {
		t.Errorf("expected hash length 64, got %d", len(hash))
	}

	// Same input should produce same hash
	hash2 := hashKey("hwa_test123")
	if hash != hash2 {
		t.Error("same input should produce same hash")
	}

	// Different input should produce different hash
	hash3 := hashKey("hwa_different")
	if hash == hash3 {
		t.Error("different inputs should produce different hashes")
	}
}

func TestHashKeyConsistency(t *testing.T) {
	// Generate a key and verify hash matches
	key, _ := generateRawKey()
	h1 := hashKey(key)
	h2 := hashKey(key)
	if h1 != h2 {
		t.Error("hashing the same key twice should produce identical results")
	}
}
