# SMS Integration (Capcom6)

Capcom6 Android SMS Gateway is used for two-way SMS. We use Basic Authentication against the device/local server.

## Modes
- Local Server (Device) [our setup]: `http://100.126.232.47:8080` (Tailscale IP of Android device)
- Cloud Server (Proxy): `https://api.sms-gate.app/3rdparty/v1`

## Phone Number Format Requirements

**IMPORTANT**: SMS requires proper phone number formatting for reliable delivery.

### Supported Formats
1. **E.164 International Format (Recommended)**:
   - Format: `+[country code][national number]`
   - Examples: `+15551234567` (US), `+447911123456` (UK), `+8613800138000` (China)
   - Length: 7-17 characters (including +)

2. **US Domestic Format (Auto-converted to +1)**:
   - Format: `[area code][7-digit number]`
   - Examples: `5551234567`, `2125551234`
   - Length: 10 digits, no spaces or punctuation
   - **Note**: Automatically converted to `+1` format

### Invalid Formats (Will be Rejected)
- Missing country code: `5551234567` without +1 prefix (except US domestic)
- Non-numeric characters: `555-123-4567`, `(555) 123-4567`
- Too short: `+1555123`
- Too long: `+15551234567890123`
- Invalid characters: `555abc1234`, `+1-555-123-4567`

## Outbound SMS (Backend → Capcom6)
- Endpoint: `${CAPCOM6_API_URL}/message`
- Auth: Basic (`CAPCOM6_USERNAME` / `CAPCOM6_PASSWORD`)
- JSON Body:
```json
{
  "textMessage": { "text": "Hello from pharmacy system" },
  "phoneNumbers": ["+15551234567", "+447911123456"]
}
```
- Notes:
  - Phone numbers are automatically normalized to E.164 format
  - US domestic numbers (10 digits) are auto-prefixed with +1
  - The backend stores Capcom6 `id`/`messageId` for delivery tracking
  - Validation occurs before sending to prevent gateway errors

References:
- GitHub: https://github.com/capcom6/android-sms-gateway
- Docs: https://capcom6.github.io/android-sms-gateway/

## Inbound SMS (Capcom6 → Backend)
- Webhook: `POST /api/webhooks/capcom6`
- Register on device (example):
```json
{"id":"capcom6-inbound","url":"http://100.120.219.68:3001/api/webhooks/capcom6","event":"sms:received"}
```

## Environment
```
CAPCOM6_API_URL=http://100.126.232.47:8080
CAPCOM6_USERNAME=sms
CAPCOM6_PASSWORD=REDACTED
# Optional if needed
CAPCOM6_API_KEY=
CAPCOM6_ACCOUNT_ID=
CAPCOM6_PHONE_NUMBER=
```

## Testing SMS Functionality

### CLI Test Script
Use the helper script (requires backend running and valid JWT in script flow):

```bash
# Valid E.164 format
scripts/utilities/send-test-sms.sh "+15555550100" "Test message"

# Valid US domestic format (auto-converted to +15555550100)
scripts/utilities/send-test-sms.sh "5555550100" "Test message"

# Invalid format (will fail validation)
scripts/utilities/send-test-sms.sh "555-123-4567" "Test message"
```

### API Testing Examples
```bash
# Get auth token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r .token)

# Send SMS with proper E.164 format
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"+15551234567","message":"Hello from API","contactId":"optional-uuid"}' \
  http://localhost:3001/api/send-sms

# Send SMS with US domestic format (auto-normalized)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"5551234567","message":"Hello from API"}' \
  http://localhost:3001/api/send-sms
```

### Expected Validation Errors
```json
{
  "error": "SMS validation failed",
  "code": "SMS_VALIDATION_ERROR", 
  "validation_errors": ["Invalid phone number format"]
}
```

## References
- GitHub (Capcom6 Android SMS Gateway): https://github.com/capcom6/android-sms-gateway
- API Specification: https://capcom6.github.io/android-sms-gateway/
```
