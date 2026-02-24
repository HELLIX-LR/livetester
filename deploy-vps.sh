#!/bin/bash

# LIVE RUSSIA Tester Dashboard - VPS Deployment Script
# This script automates the VPS deployment process with PM2

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   LIVE RUSSIA Tester Dashboard                       ║"
echo "║   VPS Deployment Script (PM2)                        ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) is installed"
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 is not installed. Installing PM2..."
    npm install -g pm2
    echo "✅ PM2 installed successfully"
fi

echo "✅ PM2 is installed"
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

# Check if PostgreSQL is accessible
echo "🔍 Checking PostgreSQL connection..."
source .env
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; then
    echo "⚠️  Cannot connect to PostgreSQL. Please ensure:"
    echo "   - PostgreSQL is installed and running"
    echo "   - Database credentials in .env are correct"
    echo "   - Database '$DB_NAME' exists"
    exit 1
fi
echo "✅ PostgreSQL connection successful"
echo ""

# Check if Redis is accessible
echo "🔍 Checking Redis connection..."
if ! redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping &>/dev/null; then
    echo "⚠️  Cannot connect to Redis. Please ensure:"
    echo "   - Redis is installed and running"
    echo "   - Redis credentials in .env are correct"
    exit 1
fi
echo "✅ Redis connection successful"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

echo ""
echo "🗄️  Running database migrations..."
npm run migrate

echo ""
echo "👤 Creating admin user..."
npm run seed

echo ""
echo "🚀 Starting application with PM2..."
pm2 delete live-russia-dashboard 2>/dev/null || true
pm2 start ecosystem.config.js --env production

echo ""
echo "💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "🔧 Setting up PM2 startup script..."
pm2 startup systemd -u $USER --hp $HOME

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Application Status:"
pm2 status

echo ""
echo "🌐 Application URLs:"
echo "   - Application: http://localhost:3000"
echo "   - Health Check: http://localhost:3000/api/health"
echo ""
echo "📝 Useful Commands:"
echo "   - View logs: pm2 logs live-russia-dashboard"
echo "   - Monitor: pm2 monit"
echo "   - Restart: pm2 restart live-russia-dashboard"
echo "   - Stop: pm2 stop live-russia-dashboard"
echo "   - Status: pm2 status"
echo ""
echo "⚠️  Next Steps:"
echo "   1. Configure Nginx as reverse proxy (see DEPLOYMENT.md)"
echo "   2. Set up SSL certificate with Let's Encrypt"
echo "   3. Configure firewall (UFW or iptables)"
echo "   4. Set up automated backups"
echo ""
echo "🎉 Your LIVE RUSSIA Tester Dashboard is now running!"
