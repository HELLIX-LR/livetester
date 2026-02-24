# LIVE RUSSIA Tester Dashboard - Production Guide

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# 1. Configure environment
cp production.env.example .env
nano .env  # Update with your values

# 2. Deploy with one command
chmod +x deploy-docker.sh
./deploy-docker.sh
```

### Option 2: VPS with PM2

```bash
# 1. Configure environment
cp production.env.example .env
nano .env  # Update with your values

# 2. Deploy with one command
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### Option 3: Manual Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

---

## 📋 What's Included

### Production Files

- **Dockerfile** - Container configuration for Node.js app
- **docker-compose.yml** - Multi-service orchestration (App, PostgreSQL, Redis)
- **.dockerignore** - Exclude unnecessary files from Docker build
- **nginx.conf** - Reverse proxy configuration with SSL
- **ecosystem.config.js** - PM2 process manager configuration
- **production.env.example** - Production environment template
- **deploy-docker.sh** - Automated Docker deployment script
- **deploy-vps.sh** - Automated VPS deployment script
- **DEPLOYMENT.md** - Comprehensive deployment guide
- **PRODUCTION_CHECKLIST.md** - Pre-deployment checklist

### Features

✅ **Mobile-Responsive Design**
- Viewport meta tags on all pages
- Media queries for 768px (tablet) and 480px (mobile)
- Collapsible sidebar for mobile
- Touch-friendly buttons (44px minimum)
- Responsive tables and forms

✅ **Production-Ready Security**
- Helmet security headers
- CORS configuration
- Rate limiting (API and auth routes)
- Session management with Redis
- HTTPS/SSL ready
- Secure cookie settings

✅ **Easy Deployment**
- Docker containerization
- Docker Compose orchestration
- PM2 cluster mode
- Automated deployment scripts
- Health check endpoints

✅ **Scalable Architecture**
- PostgreSQL database
- Redis session storage
- Nginx reverse proxy
- Load balancing ready
- Horizontal scaling support

---

## 🔧 Configuration

### Required Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=live_russia_testers
DB_USER=postgres
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
# Session secret (32+ characters)
openssl rand -base64 32

# Database password
openssl rand -base64 24

# Redis password
openssl rand -base64 24
```

---

## 📱 Mobile Responsiveness

The dashboard is fully responsive and tested on:

- **Desktop**: 1920px, 1440px, 1024px
- **Tablet**: 768px (iPad, Android tablets)
- **Mobile**: 480px, 375px, 320px (iPhone, Android phones)

### Responsive Features

- Collapsible sidebar with hamburger menu
- Responsive tables with horizontal scroll
- Single-column forms on mobile
- Touch-friendly buttons and inputs
- Optimized images and assets
- Fast loading on 3G/4G networks

### Testing Mobile Responsiveness

```bash
# Chrome DevTools
1. Open Chrome DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select device or set custom dimensions
4. Test all pages and interactions

# Real Device Testing
1. Connect to same network as server
2. Access http://your-server-ip:3000
3. Test all features on actual devices
```

---

## 🔒 Security Features

### Implemented Security Measures

1. **Helmet Security Headers**
   - Content Security Policy (CSP)
   - HTTP Strict Transport Security (HSTS)
   - X-Frame-Options
   - X-Content-Type-Options
   - Referrer Policy

2. **Rate Limiting**
   - API routes: 100 requests per 15 minutes
   - Auth routes: 5 attempts per 15 minutes
   - Prevents brute force attacks

3. **Session Security**
   - Redis-backed sessions in production
   - Secure cookies (HTTPS only)
   - HttpOnly cookies
   - SameSite protection

4. **CORS Protection**
   - Restricted to specific domain in production
   - Credentials support
   - Allowed methods and headers

5. **Input Validation**
   - File upload limits (10MB)
   - Request size limits
   - SQL injection prevention (parameterized queries)

---

## 📊 Monitoring

### Health Check

```bash
# Check application health
curl http://localhost:3000/api/health

# Expected response
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### PM2 Monitoring

```bash
# View status
pm2 status

# Monitor resources
pm2 monit

# View logs
pm2 logs live-russia-dashboard

# Restart application
pm2 restart live-russia-dashboard
```

### Docker Monitoring

```bash
# View container status
docker-compose ps

# View logs
docker-compose logs -f app

# View resource usage
docker stats

# Check health
docker-compose exec app node -e "require('http').get('http://localhost:3000/api/health')"
```

---

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# With Docker
git pull
docker-compose down
docker-compose up -d --build
docker-compose exec app node backend/db/run-migrations.js

# With PM2
git pull
npm install
npm run migrate
pm2 reload ecosystem.config.js
```

### Database Backup

```bash
# Manual backup
pg_dump -U postgres live_russia_testers > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U postgres live_russia_testers < backup_20240101.sql

# Docker backup
docker-compose exec postgres pg_dump -U postgres live_russia_testers > backup.sql
```

### Log Management

```bash
# PM2 logs
pm2 logs --lines 100
pm2 flush  # Clear logs

# Docker logs
docker-compose logs --tail=100 app
docker-compose logs --since 1h app
```

---

## 🌐 Deployment Platforms

### Supported Platforms

- **VPS**: Ubuntu, Debian, CentOS (with PM2 or Docker)
- **Cloud**: AWS, DigitalOcean, Linode, Vultr
- **PaaS**: Heroku, Railway, Render
- **Container**: Docker, Kubernetes

### Platform-Specific Guides

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions for:
- VPS deployment with PM2
- Docker deployment
- Heroku deployment
- Railway deployment
- Render deployment
- DigitalOcean App Platform

---

## 🆘 Troubleshooting

### Common Issues

**Application won't start**
```bash
# Check logs
pm2 logs
# or
docker-compose logs app

# Verify environment variables
cat .env

# Check port availability
netstat -tulpn | grep 3000
```

**Database connection failed**
```bash
# Test PostgreSQL connection
psql -U postgres -h localhost -d live_russia_testers

# Check PostgreSQL status
systemctl status postgresql
```

**Redis connection failed**
```bash
# Test Redis connection
redis-cli -a your_password ping

# Check Redis status
systemctl status redis-server
```

**502 Bad Gateway (Nginx)**
```bash
# Check if app is running
pm2 status
# or
docker-compose ps

# Check Nginx configuration
nginx -t

# View Nginx logs
tail -f /var/log/nginx/error.log
```

For more troubleshooting, see [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting).

---

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide
- **[PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)** - Pre-deployment checklist
- **[README.md](README.md)** - Development guide
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Initial setup instructions

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review [DEPLOYMENT.md](DEPLOYMENT.md)
3. Check application logs
4. Verify environment configuration

---

## 🎉 Success!

Your LIVE RUSSIA Tester Dashboard is production-ready with:

✅ Mobile-responsive design  
✅ Docker containerization  
✅ Security hardening  
✅ SSL/HTTPS support  
✅ Automated deployment  
✅ Monitoring and logging  
✅ Backup strategies  
✅ Scalable architecture  

**Happy deploying!** 🚀
