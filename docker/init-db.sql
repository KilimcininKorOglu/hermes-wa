-- Create databases for hermeswa (idempotent)
SELECT 'CREATE DATABASE whatsmeow' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'whatsmeow')\gexec
SELECT 'CREATE DATABASE hermeswa' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hermeswa')\gexec
