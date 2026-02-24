// PM2 Ecosystem Configuration for Production
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'live-russia-dashboard',
    script: './backend/server.js',
    
    // Instances
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster', // Cluster mode for load balancing
    
    // Environment
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Restart behavior
    watch: false, // Don't watch files in production
    max_memory_restart: '500M', // Restart if memory exceeds 500MB
    min_uptime: '10s', // Minimum uptime before considering app stable
    max_restarts: 10, // Max restarts within 1 minute
    autorestart: true, // Auto restart on crash
    
    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true, // Prefix logs with timestamp
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true, // Merge logs from all instances
    
    // Advanced features
    listen_timeout: 10000, // Time to wait for app to be ready
    kill_timeout: 5000, // Time to wait before force killing
    wait_ready: true, // Wait for process.send('ready')
    
    // Source map support
    source_map_support: true,
    
    // Graceful shutdown
    shutdown_with_message: true,
    
    // Monitoring
    instance_var: 'INSTANCE_ID',
    
    // Cron restart (optional - restart daily at 3 AM)
    // cron_restart: '0 3 * * *',
    
    // Post-deploy hooks
    post_update: ['npm install', 'npm run migrate'],
  }],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:username/live-russia-dashboard.git',
      path: '/var/www/live-russia',
      'post-deploy': 'npm install && npm run migrate && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Deploying to production..."',
      'post-deploy-local': 'echo "Deployment complete!"'
    }
  }
};
