# Production Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment

### Environment Configuration
- [ ] Copy `production.env.example` to `.env`
- [ ] Set strong `DB_PASSWORD` (min 16 characters)
- [ ] Set strong `REDIS_PASSWORD` (min 16 characters)
- [ ] Generate secure `SESSION_SECRET` (min 32 characters)
- [ ] Set `CORS_ORIGIN` to your domain (not `*`)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `APP_URL` with your domain
- [ ] Update `ADMIN_EMAIL` if needed

### Security
- [ ] All passwords are strong and unique
- [ ] No sensitive data in `.env.example` or committed files
- [ ] `.env` is in `.gitignore`
- [ ] Rate limiting is configured
- [ ] Helmet security headers are enabled
- [ ] CORS is restricted to your domain
- [ ] File upload limits are set

### Database
- [ ] PostgreSQL is installed and running
- [ ] Database is created
- [ ] Database user has proper permissions
- [ ] Migrations are ready to run
- [ ] Backup strategy is planned

### Redis
- [ ] Redis is installed and running
- [ ] Redis password is set
- [ ] Redis is configured for session storage

### SSL/HTTPS
- [ ] Domain is pointed to server
- [ ] SSL certificate is obtained (Let's Encrypt or other)
- [ ] Nginx is configured for HTTPS
- [ ] HTTP redirects to HTTPS
- [ ] SSL certificate auto-renewal is configured

### Server
- [ ] Server meets minimum requirements (2GB RAM, 2 CPU cores)
- [ ] Firewall is configured (ports 80, 443, 22)
- [ ] SSH key authentication is enabled
- [ ] Root login is disabled
- [ ] Fail2ban or similar is installed
- [ ] Automatic security updates are enabled

## Deployment

### Application Setup
- [ ] Code is cloned/deployed to server
- [ ] Dependencies are installed (`npm ci --only=production`)
- [ ] Environment variables are set
- [ ] Migrations are run successfully
- [ ] Admin user is created
- [ ] Uploads directory exists and has proper permissions

### Process Management
- [ ] PM2 is installed (or Docker is running)
- [ ] Application starts without errors
- [ ] PM2 startup script is configured
- [ ] Application auto-restarts on crash
- [ ] Cluster mode is enabled (if using PM2)

### Web Server
- [ ] Nginx is installed and configured
- [ ] Nginx configuration is tested (`nginx -t`)
- [ ] Static files are served correctly
- [ ] API proxy is working
- [ ] Gzip compression is enabled
- [ ] File upload size limit is set

### Testing
- [ ] Health check endpoint responds: `/api/health`
- [ ] Login page loads correctly
- [ ] Can log in with admin credentials
- [ ] Dashboard loads after login
- [ ] API endpoints are accessible
- [ ] File uploads work
- [ ] Database queries are working
- [ ] Redis sessions are working

## Post-Deployment

### Monitoring
- [ ] Application logs are accessible
- [ ] Error logs are being written
- [ ] PM2 monitoring is working (`pm2 monit`)
- [ ] Health check is monitored
- [ ] Disk space monitoring is set up
- [ ] Memory usage monitoring is set up

### Backups
- [ ] Database backup script is created
- [ ] Automated daily backups are scheduled
- [ ] Backup restoration is tested
- [ ] Uploaded files are backed up
- [ ] Backup retention policy is defined

### Performance
- [ ] Application responds quickly
- [ ] Database queries are optimized
- [ ] Static files are cached
- [ ] Gzip compression is working
- [ ] CDN is configured (if needed)

### Security
- [ ] Security headers are present (check with securityheaders.com)
- [ ] SSL is working correctly (check with ssllabs.com)
- [ ] No sensitive data in logs
- [ ] File permissions are correct
- [ ] Unnecessary services are disabled

### Documentation
- [ ] Deployment process is documented
- [ ] Environment variables are documented
- [ ] Backup/restore process is documented
- [ ] Troubleshooting guide is available
- [ ] Team has access to credentials (securely stored)

## Maintenance

### Regular Tasks
- [ ] Monitor application logs daily
- [ ] Check disk space weekly
- [ ] Review security updates weekly
- [ ] Test backups monthly
- [ ] Update dependencies monthly
- [ ] Review and rotate logs monthly
- [ ] Check SSL certificate expiry monthly

### Emergency Procedures
- [ ] Rollback procedure is documented
- [ ] Emergency contacts are defined
- [ ] Incident response plan exists
- [ ] Backup restoration is tested

## Mobile Responsiveness Verification

### Viewport Configuration
- [ ] All HTML files have viewport meta tag
- [ ] Viewport is set to `width=device-width, initial-scale=1.0`

### CSS Media Queries
- [ ] Breakpoints at 768px (tablet)
- [ ] Breakpoints at 480px (mobile)
- [ ] Sidebar is collapsible on mobile
- [ ] Tables are scrollable on mobile
- [ ] Forms are single-column on mobile
- [ ] Buttons are touch-friendly (min 44px)

### Testing
- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Test on tablet (iPad)
- [ ] Test landscape and portrait modes
- [ ] Test touch interactions
- [ ] Test hamburger menu
- [ ] Test form inputs on mobile keyboard

### Performance
- [ ] Images are optimized
- [ ] CSS is minified (if applicable)
- [ ] JavaScript is minified (if applicable)
- [ ] Fonts are optimized
- [ ] Page load time < 3 seconds on 3G

## Sign-Off

- [ ] Development team approves
- [ ] QA testing completed
- [ ] Security review completed
- [ ] Performance testing completed
- [ ] Documentation is complete
- [ ] Stakeholders are notified

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Version**: _______________

**Notes**: 
_______________________________________________
_______________________________________________
_______________________________________________
