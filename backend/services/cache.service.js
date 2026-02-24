const { cache, CACHE_TTL } = require('../config/redis');

/**
 * Cache Service
 * Provides caching functions for statistics with appropriate TTL values
 */

class CacheService {
  /**
   * Get dashboard statistics from cache
   * @returns {Promise<Object|null>} Cached dashboard stats or null
   */
  static async getDashboardStats() {
    return await cache.get('stats:dashboard');
  }

  /**
   * Set dashboard statistics in cache
   * TTL: 30 seconds
   * @param {Object} stats - Dashboard statistics object
   * @returns {Promise<boolean>} Success status
   */
  static async setDashboardStats(stats) {
    return await cache.set('stats:dashboard', stats, CACHE_TTL.DASHBOARD);
  }

  /**
   * Get server statistics from cache
   * @returns {Promise<Array|null>} Cached server stats or null
   */
  static async getServerStats() {
    return await cache.get('stats:servers');
  }

  /**
   * Set server statistics in cache
   * TTL: 15 seconds
   * @param {Array} servers - Array of server objects
   * @returns {Promise<boolean>} Success status
   */
  static async setServerStats(servers) {
    return await cache.set('stats:servers', servers, CACHE_TTL.SERVERS);
  }

  /**
   * Get online players data from cache
   * @param {string} period - Time period (1h, 6h, 24h, 7d)
   * @returns {Promise<Object|null>} Cached online players data or null
   */
  static async getOnlinePlayersData(period) {
    return await cache.get(`stats:online:${period}`);
  }

  /**
   * Set online players data in cache
   * TTL: 60 seconds
   * @param {string} period - Time period (1h, 6h, 24h, 7d)
   * @param {Object} data - Online players data object
   * @returns {Promise<boolean>} Success status
   */
  static async setOnlinePlayersData(period, data) {
    return await cache.set(`stats:online:${period}`, data, CACHE_TTL.ONLINE_PLAYERS);
  }

  /**
   * Invalidate dashboard statistics cache
   * Use when tester or bug data changes
   * @returns {Promise<boolean>} Success status
   */
  static async invalidateDashboardStats() {
    return await cache.del('stats:dashboard');
  }

  /**
   * Invalidate server statistics cache
   * Use when server data is updated
   * @returns {Promise<boolean>} Success status
   */
  static async invalidateServerStats() {
    return await cache.del('stats:servers');
  }

  /**
   * Invalidate online players cache for specific period
   * @param {string} period - Time period (1h, 6h, 24h, 7d)
   * @returns {Promise<boolean>} Success status
   */
  static async invalidateOnlinePlayersData(period) {
    return await cache.del(`stats:online:${period}`);
  }

  /**
   * Invalidate all online players cache
   * Use when player data is updated
   * @returns {Promise<number>} Number of keys deleted
   */
  static async invalidateAllOnlinePlayersData() {
    return await cache.delPattern('stats:online:*');
  }

  /**
   * Invalidate all statistics cache
   * Use for complete cache refresh
   * @returns {Promise<number>} Number of keys deleted
   */
  static async invalidateAllStats() {
    return await cache.delPattern('stats:*');
  }

  /**
   * Get tester details from cache
   * @param {number} testerId - Tester ID
   * @returns {Promise<Object|null>} Cached tester data or null
   */
  static async getTesterDetails(testerId) {
    return await cache.get(`tester:${testerId}`);
  }

  /**
   * Set tester details in cache
   * TTL: 60 seconds
   * @param {number} testerId - Tester ID
   * @param {Object} testerData - Tester data object
   * @returns {Promise<boolean>} Success status
   */
  static async setTesterDetails(testerId, testerData) {
    return await cache.set(`tester:${testerId}`, testerData, 60);
  }

  /**
   * Invalidate tester details cache
   * @param {number} testerId - Tester ID
   * @returns {Promise<boolean>} Success status
   */
  static async invalidateTesterDetails(testerId) {
    return await cache.del(`tester:${testerId}`);
  }

  /**
   * Get bug details from cache
   * @param {number} bugId - Bug ID
   * @returns {Promise<Object|null>} Cached bug data or null
   */
  static async getBugDetails(bugId) {
    return await cache.get(`bug:${bugId}`);
  }

  /**
   * Set bug details in cache
   * TTL: 60 seconds
   * @param {number} bugId - Bug ID
   * @param {Object} bugData - Bug data object
   * @returns {Promise<boolean>} Success status
   */
  static async setBugDetails(bugId, bugData) {
    return await cache.set(`bug:${bugId}`, bugData, 60);
  }

  /**
   * Invalidate bug details cache
   * @param {number} bugId - Bug ID
   * @returns {Promise<boolean>} Success status
   */
  static async invalidateBugDetails(bugId) {
    return await cache.del(`bug:${bugId}`);
  }
}

module.exports = CacheService;
