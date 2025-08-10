# SMS Integration (Capcom6)

Capcom6 Android SMS Gateway is used for two-way SMS. We use Basic Authentication against the device/local server.

## Modes
- Local Server (Device) [our setup]: `http://100.126.232.47:8080` (Tailscale IP of Android device)
- Cloud Server (Proxy): `https://api.sms-gate.app/3rdparty/v1`

## Outbound SMS (Backend → Capcom6)
- Endpoint: `${CAPCOM6_API_URL}/message`
- Auth: Basic (`CAPCOM6_USERNAME` / `CAPCOM6_PASSWORD`)
- JSON Body:
```json
{
  "textMessage": { "text": "Hello" },
  "phoneNumbers": ["+15551234567"]
}
```
- Notes:
  - We send one message to one or more phone numbers.
  - The backend stores Capcom6 `id`/`messageId` for delivery tracking.

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

## CLI Test
Use the helper script (requires backend running and valid JWT in script flow):

```bash
scripts/utilities/send-test-sms.sh "+15555550100" "CLI smoke test via Capcom6"

## References
- GitHub (Capcom6 Android SMS Gateway): https://github.com/capcom6/android-sms-gateway
- API Specification: https://capcom6.github.io/android-sms-gateway/
```
