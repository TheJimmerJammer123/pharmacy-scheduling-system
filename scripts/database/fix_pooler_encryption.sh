#!/bin/bash
# Fix Supavisor Connection Pooler Encryption Issue
# Generated from performance audit on 2025-08-02

echo "=' Fixing Supabase Connection Pooler Encryption Configuration..."

# Generate a proper 32-character encryption key for AES-256
NEW_VAULT_KEY=$(openssl rand -hex 32)

echo "=Ý Generated new 32-byte encryption key: ${NEW_VAULT_KEY:0:8}..."

# Update the .env file with the new key
sed -i "s/^VAULT_ENC_KEY=.*/VAULT_ENC_KEY=${NEW_VAULT_KEY}/" .env

echo " Updated VAULT_ENC_KEY in .env file"

# Also update the SECRET_KEY_BASE to match
sed -i "s/^SECRET_KEY_BASE=.*/SECRET_KEY_BASE=${NEW_VAULT_KEY}/" .env

echo " Updated SECRET_KEY_BASE in .env file"

# Restart the pooler service
echo "= Restarting connection pooler service..."
docker compose restart supavisor

# Wait a moment for service to start
sleep 5

# Check the status
echo "=Ê Checking service status..."
docker compose ps supavisor

# Show logs to verify fix
echo "=Ë Recent pooler logs:"
docker compose logs supavisor --tail=10

echo "<‰ Connection pooler encryption fix completed!"
echo "=¡ Monitor the service for a few minutes to ensure it stays healthy."