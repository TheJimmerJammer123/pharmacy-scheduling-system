#!/bin/bash

# Pharmacy Scheduling System - New Architecture Startup Script
# This script helps you start the simplified architecture

echo "🚀 Starting Pharmacy Scheduling System - New Architecture"
echo "========================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from env.example..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ Created .env from env.example"
        echo "⚠️  Please edit .env with your actual values before continuing"
        echo "   - Set POSTGRES_PASSWORD"
        echo "   - Set CAPCOM6_USERNAME, CAPCOM6_PASSWORD, CAPCOM6_PHONE_NUMBER (optional: CAPCOM6_API_KEY/ACCOUNT_ID)"
        echo "   - Set JWT_SECRET"
        echo "   - Set OPENROUTER_API_KEY"
        echo ""
        read -p "Press Enter after editing .env file..."
    else
        echo "❌ env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose down

# Remove old volumes (this will clear existing data)
echo "🗑️  Removing old volumes..."
docker compose down -v --remove-orphans

# Build and start services
echo "🔨 Building and starting services..."
docker compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
echo "📊 Service Status:"
docker compose ps

# Check backend health
echo "🏥 Checking backend health..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    echo "📋 Backend logs:"
    docker compose logs backend --tail=20
fi

# Check database connection
echo "🗄️  Checking database connection..."
if docker compose exec db pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ Database is ready"
else
    echo "❌ Database connection failed"
fi

echo ""
echo "🎉 Setup complete! Your services are running:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Database: localhost:5432"
echo "   N8N:      http://localhost:5678"
echo ""
echo "📋 Useful commands:"
echo "   View logs:     docker compose logs -f [service_name]"
echo "   Stop services: docker compose down"
echo "   Restart:       docker compose restart"
echo "   Status:        docker compose ps"
