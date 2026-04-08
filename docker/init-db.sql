-- Create databases for charon (idempotent)
SELECT 'CREATE DATABASE whatsmeow' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'whatsmeow')\gexec
SELECT 'CREATE DATABASE charon' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'charon')\gexec
