#!/bin/bash

# Supabase JWT Signing Keys Setup Script
# Based on https://supabase.com/docs/guides/auth/signing-keys

set -e

echo "🔑 Setting up Supabase JWT Signing Keys..."

# Generate JWT secret (for legacy compatibility)
JWT_SECRET=$(openssl rand -base64 32)
echo "Generated JWT_SECRET: $JWT_SECRET"

# Generate asymmetric signing key (ES256 - NIST P-256 Curve)
echo "Generating asymmetric signing key (ES256)..."
openssl ecparam -genkey -name prime256v1 -noout -out private_key.pem
openssl ec -in private_key.pem -pubout -out public_key.pem

# Convert private key to JWK format
echo "Converting private key to JWK format..."
PRIVATE_KEY_JWK=$(cat private_key.pem | openssl ec -pubout -outform DER | base64 -w 0)
PUBLIC_KEY_JWK=$(cat public_key.pem | openssl ec -pubout -outform DER | base64 -w 0)

# Create JWT configuration
cat > jwt_config.json << EOF
{
  "jwt_secret": "$JWT_SECRET",
  "jwt_expiry": 3600,
  "signing_keys": [
    {
      "id": "primary",
      "algorithm": "ES256",
      "private_key": "$PRIVATE_KEY_JWK",
      "public_key": "$PUBLIC_KEY_JWK",
      "status": "active"
    }
  ]
}
EOF

echo "✅ JWT configuration created:"
echo "   - JWT_SECRET: $JWT_SECRET"
echo "   - Private key: private_key.pem"
echo "   - Public key: public_key.pem"
echo "   - Configuration: jwt_config.json"

echo ""
echo "📝 Next steps:"
echo "1. Update your .env file with:"
echo "   JWT_SECRET=$JWT_SECRET"
echo "2. Restart Supabase services:"
echo "   docker compose restart auth"
echo "3. Test JWT functionality" 