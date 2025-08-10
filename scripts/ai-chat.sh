#!/usr/bin/env bash
set -euo pipefail

API=${API:-http://localhost:3001}
MSG=${1:-"Hello AI"}

TOKEN=${TOKEN:-}
if [ -z "$TOKEN" ]; then
  TOKEN=$(curl -sSf -X POST "$API/api/auth/login" -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}' | jq -r .token)
fi

curl -sSf -X POST "$API/api/ai/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"message\":\"$MSG\"}" | jq
