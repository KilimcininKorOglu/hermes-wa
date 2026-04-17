package database

import (
	"database/sql"
	"log"
	"time"

	_ "github.com/lib/pq"
)

var AppDB *sql.DB
var OutboxDB *sql.DB

// applyPoolLimits sets conservative defaults so connections never grow
// unbounded under load and stale connections are recycled.
func applyPoolLimits(db *sql.DB) {
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(2 * time.Minute)
}

// Initialize connection to custom database (not whatsmeow)
func InitAppDB(appDbURL string) {
	db, err := sql.Open("postgres", appDbURL)
	if err != nil {
		log.Fatal("Failed to connect app DB:", err)
	}
	applyPoolLimits(db)
	AppDB = db
	err = AppDB.Ping()
	if err != nil {
		log.Fatal("Failed to ping app DB:", err)
	}
	log.Println("App DB (custom) connected successfully")
}

// InitOutboxDB initializes connection to outbox database (can be same or different from AppDB)
func InitOutboxDB(outboxURL string) {
	if outboxURL == "" {
		log.Println("OUTBOX_DATABASE_URL not set, falling back to AppDB for outbox features")
		OutboxDB = AppDB
		return
	}

	db, err := sql.Open("postgres", outboxURL)
	if err != nil {
		log.Printf("⚠️ Warning: Failed to open Outbox DB: %v", err)
		OutboxDB = AppDB
		return
	}

	if err := db.Ping(); err != nil {
		log.Printf("⚠️ Warning: Failed to ping Outbox DB: %v. Falling back to AppDB.", err)
		OutboxDB = AppDB
		return
	}

	applyPoolLimits(db)
	OutboxDB = db
	log.Println("Outbox DB connected successfully")
}
