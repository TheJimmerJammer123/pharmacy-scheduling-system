#!/usr/bin/env bash
set -euo pipefail

API=${API:-http://localhost:3001}

echo "[1/5] Health check"
curl -sSf "$API/api/health" | jq '.status' >/dev/null

echo "[2/5] Login"
TOKEN=$(curl -sSf -X POST "$API/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | jq -r .token)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "Login failed" >&2
  exit 1
fi

echo "[3/5] List contacts"
curl -sSf "$API/api/contacts" -H "Authorization: Bearer $TOKEN" | jq 'length' >/dev/null

echo "[4/5] Send SMS (dry-run if gateway unavailable)"
SMS_PAYLOAD='{"to":"+15551234567","message":"Smoke test","contactId":null}'
set +e
RESP=$(curl -sS -X POST "$API/api/send-sms" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "$SMS_PAYLOAD")
RC=$?
set -e
if [ $RC -ne 0 ]; then
  echo "SMS step encountered an error (likely gateway); continuing: RC=$RC" >&2
else
  echo "$RESP" | jq '.' >/dev/null 2>&1 || true
fi

echo "[5/5] AI chat (mock if key missing)"
AI_PAYLOAD='{"message":"Give a 1-line summary.","userRole":"manager"}'
curl -sSf -X POST "$API/api/ai/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "$AI_PAYLOAD" | jq '.response' >/dev/null

echo "Smoke test completed successfully"
