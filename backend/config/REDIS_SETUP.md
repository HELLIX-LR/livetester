# Redis Configuration Guide

## Overview

Redis is configured for two main purposes in the LIVE RUSSIA Tester Dashboard:
1. **Session Management** - Storing user sessions with 24-hour TTL
2. **Statistics Caching** - Caching frequently accessed statistics with appropriate TTLs

## Configuration

### Environment Variables

Add to your `.env` file:

```env
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your_secure_session_secret_here
```

### Connection Settings

The Redis client is configured with:
- Automatic reconnection with exponential backoff
- Maximum 10 reconnection attempts
- Connection monitoring and error logging

## Session Management

### Configuration

Sessions are stored in Redis with the following settings:

- **Store Prefix**: `sess:`
- **TTL**: 86400 seconds (24 hours)
- **Cookie Settings**:
  - `httpOnly`: true (prevents XSS attacks)
  - `secure`: true in production (HTTPS only)
  - `sameSite`: 'lax' (CSRF protection)
  - `maxAge`: 24 hours

### Session Data Structure

```
Key: sess:{sessionId}
Value: {
  userId: number,
  username: string,
  loginTime: timestamp,
  ...
}
TTL: 86400 seconds
```

## Statistics Caching

### Cache TTL Values

Different statistics have different refresh rates based on requirements:

| Cache Type | TTL | Requirement |
|------------|-----|-------------|
| Dashboard Statistics | 30 seconds | Req 5.5 |
| Server Statistics | 15 seconds | Req 6.4 |
| Online Players Data | 60 seconds | Req 7.4 |

### Cache Keys

#### Dashboard Statistics
```
Key: stats:dashboard
Value: {
  totalTesters: number,
  activeTesters24h: number,
  totalBugs: number,
  bugsByStatus: object,
  bugsByPriority: object,
  bugsByType: object,
  testersByDevice: object,
  testersByOS: object
}
TTL: 30 seconds
```

#### Server Statistics
```
Key: stats:servers
Value: [
  {
    id: number,
    name: string,
    status: string,
    loadPercentage: number,
    responseTimeMs: number,
    lastCheck: timestamp
  },
  ...
]
TTL: 15 seconds
```

#### Online Players Data
```
Key: stats:online:{period}
Value: {
  data: [
    { timestamp: date, count: number },
    ...
  ],
  peak: { count: number, timestamp: date }
}
TTL: 60 seconds
```

Where `{period}` can be: `1h`, `6h`, `24h`, `7d`

#### Tester Details
```
Key: tester:{testerId}
Value: { tester object with all fields }
TTL: 60 seconds
```

#### Bug Details
```
Key: bug:{bugId}
Value: { bug object with all fields }
TTL: 60 seconds
```

## Using the Cache Service

### Import

```javascript
const CacheService = require('./services/cache.service');
```

### Dashboard Statistics

```javascript
// Get from cache
const stats = await CacheService.getDashboardStats();

if (!stats) {
  // Cache miss - fetch from database
  const freshStats = await fetchDashboardStatsFromDB();
  
  // Store in cache
  await CacheService.setDashboardStats(freshStats);
  
  return freshStats;
}

return stats;
```

### Server Statistics

```javascript
// Get from cache
const servers = await CacheService.getServerStats();

if (!servers) {
  // Cache miss - fetch from database or external service
  const freshServers = await fetchServerStatsFromDB();
  
  // Store in cache
  await CacheService.setServerStats(freshServers);
  
  return freshServers;
}

return servers;
```

### Online Players Data

```javascript
// Get from cache
const period = '24h';
const data = await CacheService.getOnlinePlayersData(period);

if (!data) {
  // Cache miss - fetch from database
  const freshData = await fetchOnlinePlayersFromDB(period);
  
  // Store in cache
  await CacheService.setOnlinePlayersData(period, freshData);
  
  return freshData;
}

return data;
```

### Cache Invalidation

Invalidate cache when data changes:

```javascript
// After creating/updating a tester
await CacheService.invalidateDashboardStats();

// After updating server status
await CacheService.invalidateServerStats();

// After recording new player data
await CacheService.invalidateAllOnlinePlayersData();

// Complete cache refresh
await CacheService.invalidateAllStats();
```

## Testing

Run the Redis connection test:

```bash
node backend/test-redis.js
```

This will verify:
- Redis connection
- Cache set/get operations
- TTL functionality
- Cache deletion
- Pattern-based deletion

## Production Considerations

### Redis Configuration

For production, consider:

1. **Persistence**: Enable RDB or AOF persistence
2. **Memory Limits**: Set `maxmemory` and `maxmemory-policy`
3. **Security**: Use password authentication
4. **Monitoring**: Set up Redis monitoring and alerts

### Connection URL Format

```env
# Local development
REDIS_URL=redis://localhost:6379

# With password
REDIS_URL=redis://:password@localhost:6379

# Remote server
REDIS_URL=redis://username:password@redis-server:6379

# Redis Cloud / TLS
REDIS_URL=rediss://username:password@redis-server:6380
```

### Error Handling

The cache service handles errors gracefully:
- Returns `null` on cache miss or error
- Logs errors for debugging
- Application continues to work even if Redis is down

### Performance Tips

1. **Cache Warming**: Pre-populate cache on server start
2. **Batch Operations**: Use pipelines for multiple operations
3. **Monitor Hit Rate**: Track cache hit/miss ratio
4. **Adjust TTLs**: Fine-tune based on actual usage patterns

## Troubleshooting

### Connection Issues

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Check Redis info
redis-cli info

# Monitor Redis commands
redis-cli monitor
```

### View Cached Data

```bash
# List all keys
redis-cli keys "*"

# Get specific key
redis-cli get "stats:dashboard"

# Check TTL
redis-cli ttl "stats:dashboard"

# Delete specific key
redis-cli del "stats:dashboard"

# Flush all data (CAUTION!)
redis-cli flushall
```

### Common Issues

1. **Connection Refused**: Redis not running or wrong URL
2. **Authentication Failed**: Check password in REDIS_URL
3. **Memory Issues**: Check `maxmemory` setting
4. **Slow Performance**: Check network latency or Redis load

## References

- [Redis Documentation](https://redis.io/documentation)
- [node-redis Client](https://github.com/redis/node-redis)
- [connect-redis](https://github.com/tj/connect-redis)
- [express-session](https://github.com/expressjs/session)
