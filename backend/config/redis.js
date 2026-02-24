const redis = require('redis');

let redisClient = null;
let isRedisAvailable = false;

// Create Redis client only if REDIS_URL is provided
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis: Max reconnection attempts reached');
          return new Error('Max reconnection attempts reached');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });

  redisClient.on('connect', () => {
    console.log(' Connected to Redis');
    isRedisAvailable = true;
  });

  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
    isRedisAvailable = false;
  });

  redisClient.on('reconnecting', () => {
    console.log('Redis: Reconnecting...');
  });

  // Connect to Redis (non-blocking)
  (async () => {
    try {
      await redisClient.connect();
    } catch (err) {
      console.warn(' Redis not available - running without cache:', err.message);
      isRedisAvailable = false;
    }
  })();
} else {
  console.log('ℹ Redis disabled - running without cache');
}

// Cache helper functions with TTL support
const cache = {
  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {Promise<any>} Parsed JSON value or null
   */
  async get(key) {
    if (!isRedisAvailable || !redisClient) return null;
    
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      console.error(`Cache get error for key ${key}:`, err);
      return null;
    }
  },

  /**
   * Set cached value with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache (will be JSON stringified)
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl) {
    if (!isRedisAvailable || !redisClient) return false;
    
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`Cache set error for key ${key}:`, err);
      return false;
    }
  },

  /**
   * Delete cached value
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    if (!isRedisAvailable || !redisClient) return false;
    
    try {
      await redisClient.del(key);
      return true;
    } catch (err) {
      console.error(`Cache delete error for key ${key}:`, err);
      return false;
    }
  },

  /**
   * Delete all keys matching pattern
   * @param {string} pattern - Key pattern (e.g., 'stats:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  async delPattern(pattern) {
    if (!isRedisAvailable || !redisClient) return 0;
    
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
        return keys.length;
      }
      return 0;
    } catch (err) {
      console.error(`Cache delete pattern error for ${pattern}:`, err);
      return 0;
    }
  }
};

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  DASHBOARD: 30,      // Dashboard statistics: 30 seconds
  SERVERS: 15,        // Server statistics: 15 seconds
  ONLINE_PLAYERS: 60  // Online players data: 60 seconds
};

module.exports = {
  redisClient,
  cache,
  CACHE_TTL,
  isRedisAvailable: () => isRedisAvailable
};