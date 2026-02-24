#!/bin/bash

# LIVE RUSSIA Tester Dashboard - Docker Deployment Script
# This script automates the Docker deployment process

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   LIVE RUSSIA Tester Dashboard                       ║"
echo "║   Docker Deployment Script                           ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp production.env.example .env
    echo "✅ Created .env file from template"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file with your production values:"
    echo "   - DB_PASSWORD"
    echo "   - REDIS_PASSWORD"
    echo "   - SESSION_SECRET"
    echo "   - CORS_ORIGIN"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

echo "📦 Building Docker images..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "🗄️  Running database migrations..."
docker-compose exec -T app node backend/db/run-migrations.js

echo ""
echo "👤 Creating admin user..."
docker-compose exec -T app node backend/db/seed-admin.js

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 Application URLs:"
echo "   - Application: http://localhost:3000"
echo "   - Health Check: http://localhost:3000/api/health"
echo ""
echo "📝 Useful Commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart services: docker-compose restart"
echo "   - View status: docker-compose ps"
echo ""
echo "🎉 Your LIVE RUSSIA Tester Dashboard is now running!"
