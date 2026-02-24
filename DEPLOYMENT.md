# LIVE RUSSIA Tester Dashboard - Deployment Guide

Complete guide for deploying the LIVE RUSSIA Tester Dashboard to production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker)
- [VPS Deployment (Ubuntu/Debian)](#vps-deployment-ubuntudebian)
- [Cloud Platform Deployment](#cloud-platform-deployment)
- [Environment Configuration](#environment-configuration)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Domain Configuration](#domain-configuration)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+, Debian 11+, or any Linux distribution
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: 10GB minimum
- **CPU**: 2 cores minimum

### Software Requirements
- Node.js 18.x or higher
- PostgreSQL 13+ or Docker
- Redis 6+ or Docker
- Nginx (for reverse proxy)
- PM2 (for process management without Docker)

---

## Quick Start with Docker

### 1. Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Configure Environment

```bash
# Copy production environment template
cp production.env.example .env

# Edit with your production values
nano .env
```

**Important**: Update these values in `.env`:
- `DB_PASSWORD` - Strong database password
- `REDIS_PASSWORD` - Strong Redis password
- `SESSION_SECRET` - Random 32+ character string
- `CORS_ORIGIN` - Your domain (e.g., https://yourdomain.com)

### 3. Build and Start Services

```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f app
```

### 4. Run Database Migrations

```bash
# Run migrations inside the container
docker-compose exec app node backend/db/run-migrations.js

# Create admin user
docker-compose exec app node backend/db/seed-admin.js
```

### 5. Access Your Application

- Application: http://localhost:3000
- Health Check: http://localhost:3000/api/health

### Docker Management Commands

```bash
# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f [service_name]

# Update and rebuild
git pull
docker-compose down
docker-compose up -d --build

# Backup database
docker-compose exec postgres pg_dump -U postgres live_russia_testers > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres live_russia_testers < backup.sql
```

---

## VPS Deployment (Ubuntu/Debian)

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git build-essential

# Create application user
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG sudo deploy
```

### 2. Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE live_russia_testers;
CREATE USER liverussia WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE live_russia_testers TO liverussia;
\q
EOF
```

### 4. Install Redis

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis password
sudo nano /etc/redis/redis.conf
# Uncomment and set: requirepass your_redis_password

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### 5. Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup script
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

### 6. Deploy Application

```bash
# Switch to deploy user
su - deploy

# Clone repository
cd /var/www
git clone <your-repo-url> live-russia
cd live-russia

# Install dependencies
npm ci --only=production

# Configure environment
cp production.env.example .env
nano .env

# Run migrations
npm run migrate

# Create admin user
npm run seed

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
```

### 7. Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/live-russia

# Update domain in configuration
sudo nano /etc/nginx/sites-available/live-russia
# Replace 'your-domain.com' with your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/live-russia /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Cloud Platform Deployment

### Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Add Redis
heroku addons:create heroku-redis:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate

# Create admin
heroku run npm run seed
```

### Railway

1. Visit [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add PostgreSQL and Redis services
5. Set environment variables in Railway dashboard
6. Deploy automatically on push

### Render

1. Visit [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your repository
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add PostgreSQL and Redis services
6. Set environment variables
7. Deploy

### DigitalOcean App Platform

1. Visit [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App" → "GitHub"
3. Select repository
4. Add PostgreSQL and Redis databases
5. Configure environment variables
6. Deploy

---

## Environment Configuration

### Required Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=live_russia_testers
DB_USER=liverussia
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Session
SESSION_SECRET=your_32_char_random_secret

# CORS
CORS_ORIGIN=https://yourdomain.com
```

### Generate Secure Secrets

```bash
# Generate session secret
openssl rand -base64 32

# Generate random password
openssl rand -base64 24
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run

# Auto-renewal is configured automatically via cron
```

### Manual SSL Certificate

If you have your own SSL certificate:

```bash
# Copy certificates
sudo cp fullchain.pem /etc/ssl/certs/live-russia-fullchain.pem
sudo cp privkey.pem /etc/ssl/private/live-russia-privkey.pem

# Update Nginx configuration
sudo nano /etc/nginx/sites-available/live-russia
# Update ssl_certificate and ssl_certificate_key paths

# Restart Nginx
sudo systemctl restart nginx
```

---

## Domain Configuration

### DNS Settings

Add these DNS records at your domain registrar:

```
Type    Name    Value               TTL
A       @       your_server_ip      3600
A       www     your_server_ip      3600
```

### Verify DNS Propagation

```bash
# Check DNS
dig yourdomain.com
nslookup yourdomain.com

# Test from different locations
# https://www.whatsmydns.net/
```

---

## Monitoring & Maintenance

### PM2 Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit

# Restart application
pm2 restart live-russia-dashboard

# Reload without downtime
pm2 reload live-russia-dashboard
```

### Docker Monitoring

```bash
# View container stats
docker stats

# Check logs
docker-compose logs -f

# Health check
curl http://localhost:3000/api/health
```

### Database Backup

```bash
# Manual backup
pg_dump -U liverussia -h localhost live_russia_testers > backup_$(date +%Y%m%d).sql

# Automated daily backup (cron)
0 2 * * * pg_dump -U liverussia live_russia_testers > /backups/db_$(date +\%Y\%m\%d).sql
```

### Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/live-russia

# Add configuration:
/var/www/live-russia/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs
# or
docker-compose logs app

# Verify environment variables
cat .env

# Check port availability
sudo netstat -tulpn | grep 3000

# Verify database connection
psql -U liverussia -h localhost -d live_russia_testers
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify credentials
psql -U liverussia -h localhost -d live_russia_testers

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Redis Connection Issues

```bash
# Check Redis status
sudo systemctl status redis-server

# Test connection
redis-cli -a your_redis_password ping

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test SSL configuration
curl -vI https://yourdomain.com
```

### High Memory Usage

```bash
# Check memory usage
free -h
pm2 monit

# Restart application
pm2 restart live-russia-dashboard

# Adjust PM2 memory limit
# Edit ecosystem.config.js: max_memory_restart: '500M'
```

### Performance Issues

```bash
# Enable PM2 cluster mode
# Edit ecosystem.config.js: instances: 'max'

# Monitor performance
pm2 monit

# Check database performance
psql -U liverussia -d live_russia_testers -c "SELECT * FROM pg_stat_activity;"

# Optimize database
psql -U liverussia -d live_russia_testers -c "VACUUM ANALYZE;"
```

---

## Security Checklist

- [ ] Strong passwords for database and Redis
- [ ] SESSION_SECRET is random and secure
- [ ] CORS_ORIGIN is set to your domain only
- [ ] SSL/HTTPS is enabled
- [ ] Firewall is configured (UFW or iptables)
- [ ] Regular security updates
- [ ] Database backups are automated
- [ ] File upload limits are configured
- [ ] Rate limiting is enabled
- [ ] Logs are monitored

---

## Support

For issues or questions:
- Check logs: `pm2 logs` or `docker-compose logs`
- Review this guide's troubleshooting section
- Check application health: `/api/health`

---

## Updates and Maintenance

### Updating the Application

```bash
# With PM2
cd /var/www/live-russia
git pull
npm install
npm run migrate
pm2 reload ecosystem.config.js

# With Docker
cd /var/www/live-russia
git pull
docker-compose down
docker-compose up -d --build
docker-compose exec app node backend/db/run-migrations.js
```

### System Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js (if needed)
sudo npm install -g n
sudo n lts

# Update PM2
sudo npm install -g pm2
pm2 update
```

---

**Deployment Complete!** 🚀

Your LIVE RUSSIA Tester Dashboard is now ready for production use.
