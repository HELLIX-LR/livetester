# Quick Deployment Guide

## 🚀 Deploy in 5 Minutes

### Prerequisites
- Server with Ubuntu/Debian or Docker installed
- Domain name (optional, can use IP)
- SSH access to server

---

## Option 1: Docker (Easiest)

```bash
# 1. Clone repository
git clone <your-repo-url>
cd live-russia-dashboard

# 2. Configure environment
cp production.env.example .env
nano .env  # Update: DB_PASSWORD, REDIS_PASSWORD, SESSION_SECRET, CORS_ORIGIN

# 3. Deploy
chmod +x deploy-docker.sh
./deploy-docker.sh

# Done! Access at http://your-server-ip:3000
```

---

## Option 2: VPS with PM2

```bash
# 1. Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Install PostgreSQL & Redis
sudo apt install -y postgresql redis-server

# 3. Clone and configure
git clone <your-repo-url>
cd live-russia-dashboard
cp production.env.example .env
nano .env  # Update values

# 4. Deploy
chmod +x deploy-vps.sh
./deploy-vps.sh

# Done! Access at http://your-server-ip:3000
```

---

## Option 3: Cloud Platforms

### Heroku
```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)
git push heroku main
heroku run npm run migrate
heroku run npm run seed
```

### Railway
1. Visit railway.app
2. "New Project" → "Deploy from GitHub"
3. Add PostgreSQL and Redis services
4. Set environment variables
5. Deploy automatically

### Render
1. Visit render.com
2. "New +" → "Web Service"
3. Connect repository
4. Add PostgreSQL and Redis
5. Set environment variables
6. Deploy

---

## 🔒 Essential Configuration

### Generate Secure Secrets
```bash
# Session secret (32+ chars)
openssl rand -base64 32

# Database password
openssl rand -base64 24

# Redis password
openssl rand -base64 24
```

### Minimum .env Configuration
```bash
NODE_ENV=production
PORT=3000
DB_PASSWORD=<generated-password>
REDIS_PASSWORD=<generated-password>
SESSION_SECRET=<generated-secret>
CORS_ORIGIN=https://yourdomain.com
```

---

## 🌐 Add SSL/HTTPS (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

---

## ✅ Verify Deployment

```bash
# Check health
curl http://localhost:3000/api/health

# Expected response
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}

# Check services (Docker)
docker-compose ps

# Check services (PM2)
pm2 status
```

---

## 📱 Access Your Dashboard

1. **Login Page**: http://your-server-ip:3000/login.html
2. **Default Admin**:
   - Username: `admin`
   - Password: `admin123` (change immediately!)

---

## 🔧 Common Commands

### Docker
```bash
docker-compose logs -f        # View logs
docker-compose restart        # Restart services
docker-compose down           # Stop services
docker-compose up -d          # Start services
```

### PM2
```bash
pm2 logs                      # View logs
pm2 restart live-russia-dashboard  # Restart app
pm2 stop live-russia-dashboard     # Stop app
pm2 monit                     # Monitor resources
```

---

## 🆘 Troubleshooting

### Can't connect to database
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U postgres -h localhost
```

### Can't connect to Redis
```bash
# Check Redis is running
sudo systemctl status redis-server

# Test connection
redis-cli ping
```

### Port 3000 already in use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

### Application won't start
```bash
# Check logs
pm2 logs
# or
docker-compose logs app

# Verify .env file
cat .env
```

---

## 📚 Need More Help?

- **Full Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Checklist**: [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)
- **Mobile**: [MOBILE_RESPONSIVENESS.md](MOBILE_RESPONSIVENESS.md)
- **Production**: [PRODUCTION_README.md](PRODUCTION_README.md)

---

## 🎉 You're Done!

Your LIVE RUSSIA Tester Dashboard is now live and ready to use!

**Next Steps:**
1. Change default admin password
2. Configure domain and SSL
3. Set up automated backups
4. Configure monitoring

**Happy testing!** 🚀
