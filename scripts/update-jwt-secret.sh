#!/bin/bash

# Update JWT Secret Script
echo "🔑 Updating JWT Secret..."

# Generate new JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "Generated JWT_SECRET: $JWT_SECRET"

# Create a backup of the current .env file
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update the JWT_SECRET in .env file
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env

echo "✅ JWT_SECRET updated in .env file"
echo "📝 Next steps:"
echo "1. Restart Supabase services:"
echo "   docker compose restart auth"
echo "2. Test API authentication" 