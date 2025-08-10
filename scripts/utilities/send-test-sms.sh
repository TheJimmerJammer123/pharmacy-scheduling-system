#!/usr/bin/env bash
set -euo pipefail

# Send a test SMS via backend → Capcom6
# Usage: scripts/utilities/send-test-sms.sh "+15555550100" "Hello from CLI"

BASE_URL=${BASE_URL:-http://localhost:3001}
PHONE_NUMBER=${1:-"+15555550100"}
MESSAGE=${2:-"Test SMS from CLI"}

echo "Obtaining token..."
TOKEN=$(curl -sS -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r .token)

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "No admin user; registering..."
  curl -sS -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","email":"admin@example.com","password":"admin123","role":"admin"}' >/dev/null || true
  TOKEN=$(curl -sS -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' | jq -r .token)
fi

echo "Finding or creating contact $PHONE_NUMBER..."
CONTACT_ID=$(curl -sS "$BASE_URL/api/contacts?search=$(printf %s "$PHONE_NUMBER" | sed 's/+/%2B/')" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

if [[ -z "$CONTACT_ID" || "$CONTACT_ID" == "null" ]]; then
  CONTACT_ID=$(curl -sS -X POST "$BASE_URL/api/contacts" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"name\":\"Test Recipient\",\"phone\":\"$PHONE_NUMBER\",\"priority\":\"high\",\"status\":\"active\"}" | jq -r .id)
fi

echo "Sending SMS to $PHONE_NUMBER (contact $CONTACT_ID)..."
curl -sS -X POST "$BASE_URL/api/send-sms" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"to\":\"$PHONE_NUMBER\",\"message\":\"$MESSAGE\",\"contactId\":\"$CONTACT_ID\"}" | jq .



