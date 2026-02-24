const pool = require('../config/database');

/**
 * Rating Service
 * Handles tester rating calculations and updates
 * Requirements: 14.1, 14.2, 14.4
 */
class RatingService {
  /**
   * Priority weights for rating calculation
   * Requirements: 14.1, 14.2
   */
  static PRIORITY_WEIGHTS = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  /**
   * Calculate rating for a tester based on their bugs
   * @param {number} testerId - Tester ID
   * @returns {Promise<Object>} Rating calculation result
   */
  static async calculateRating(testerId) {
    try {
      // Get all bugs for the tester with their priorities
      const query = `
        SELECT priority, COUNT(*) as count
        FROM bugs
        WHERE tester_id = $1
        GROUP BY priority
      `;
      
      const result = await pool.query(query, [testerId]);
      
      let totalRating = 0;
      let totalBugs = 0;
      
      // Calculate weighted rating
      for (const row of result.rows) {
        const priority = row.priority;
        const count = parseInt(row.count);
        const weight = this.PRIORITY_WEIGHTS[priority] || 0;
        
        totalRating += count * weight;
        totalBugs += count;
      }
      
      return {
        testerId,
        rating: totalRating,
        bugsCount: totalBugs,
        breakdown: result.rows.reduce((acc, row) => {
          acc[row.priority] = parseInt(row.count);
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error calculating rating for tester:', testerId, error);
      throw error;
    }
  }

  /**
   * Update tester's rating and bugs count in database
   * @param {number} testerId - Tester ID
   * @returns {Promise<Object>} Updated tester data
   */
  static async updateTesterRating(testerId) {
    try {
      // Calculate new rating
      const ratingData = await this.calculateRating(testerId);
      
      // Update tester record
      const updateQuery = `
        UPDATE testers
        SET rating = $1, bugs_count = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id, name, rating, bugs_count as "bugsCount"
      `;
      
      const result = await pool.query(updateQuery, [
        ratingData.rating,
        ratingData.bugsCount,
        testerId
      ]);
      
      if (result.rows.length === 0) {
        const error = new Error('Tester not found');
        error.code = 'NOT_FOUND';
        throw error;
      }
      
      const updatedTester = result.rows[0];
      
      console.log(`Updated rating for tester ${testerId}: rating=${updatedTester.rating}, bugs=${updatedTester.bugsCount}`);
      
      return {
        success: true,
        data: {
          ...updatedTester,
          breakdown: ratingData.breakdown
        }
      };
    } catch (error) {
      console.error('Error updating tester rating:', testerId, error);
      
      if (error.code === 'NOT_FOUND') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Тестер не найден',
            testerId
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * Update ratings for multiple testers
   * @param {Array<number>} testerIds - Array of tester IDs
   * @returns {Promise<Object>} Batch update results
   */
  static async updateMultipleTesterRatings(testerIds) {
    try {
      const results = {
        updated: [],
        errors: []
      };
      
      for (const testerId of testerIds) {
        try {
          const result = await this.updateTesterRating(testerId);
          if (result.success) {
            results.updated.push(result.data);
          } else {
            results.errors.push({
              testerId,
              error: result.error
            });
          }
        } catch (error) {
          results.errors.push({
            testerId,
            error: {
              code: 'INTERNAL_ERROR',
              message: error.message
            }
          });
        }
      }
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Error updating multiple tester ratings:', error);
      throw error;
    }
  }

  /**
   * Automatically update tester rating when a bug is created
   * @param {number} testerId - Tester ID
   * @param {string} priority - Bug priority
   * @returns {Promise<Object>} Update result
   */
  static async onBugCreated(testerId, priority) {
    try {
      console.log(`Bug created for tester ${testerId} with priority ${priority}, updating rating...`);
      
      const result = await this.updateTesterRating(testerId);
      
      // Record activity if rating was updated successfully
      if (result.success) {
        await this.recordRatingActivity(testerId, 'bug_created', {
          priority,
          newRating: result.data.rating,
          newBugsCount: result.data.bugsCount
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error handling bug creation for rating update:', error);
      throw error;
    }
  }

  /**
   * Automatically update tester rating when a bug priority is changed
   * @param {number} testerId - Tester ID
   * @param {string} oldPriority - Old bug priority
   * @param {string} newPriority - New bug priority
   * @returns {Promise<Object>} Update result
   */
  static async onBugPriorityChanged(testerId, oldPriority, newPriority) {
    try {
      console.log(`Bug priority changed for tester ${testerId} from ${oldPriority} to ${newPriority}, updating rating...`);
      
      const result = await this.updateTesterRating(testerId);
      
      // Record activity if rating was updated successfully
      if (result.success) {
        await this.recordRatingActivity(testerId, 'priority_changed', {
          oldPriority,
          newPriority,
          newRating: result.data.rating,
          newBugsCount: result.data.bugsCount
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error handling bug priority change for rating update:', error);
      throw error;
    }
  }

  /**
   * Automatically update tester rating when a bug is deleted
   * @param {number} testerId - Tester ID
   * @param {string} priority - Deleted bug priority
   * @returns {Promise<Object>} Update result
   */
  static async onBugDeleted(testerId, priority) {
    try {
      console.log(`Bug deleted for tester ${testerId} with priority ${priority}, updating rating...`);
      
      const result = await this.updateTesterRating(testerId);
      
      // Record activity if rating was updated successfully
      if (result.success) {
        await this.recordRatingActivity(testerId, 'bug_deleted', {
          priority,
          newRating: result.data.rating,
          newBugsCount: result.data.bugsCount
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error handling bug deletion for rating update:', error);
      throw error;
    }
  }

  /**
   * Get top testers by rating
   * @param {number} limit - Number of top testers to return (default: 10)
   * @returns {Promise<Object>} Top testers list
   */
  static async getTopTesters(limit = 10) {
    try {
      const query = `
        SELECT id, name, email, nickname, telegram, rating, bugs_count as "bugsCount",
               device_type as "deviceType", os, status, registration_date as "registrationDate"
        FROM testers
        WHERE rating > 0
        ORDER BY rating DESC, bugs_count DESC, registration_date ASC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('Error getting top testers:', error);
      throw error;
    }
  }

  /**
   * Get rating statistics
   * @returns {Promise<Object>} Rating statistics
   */
  static async getRatingStatistics() {
    try {
      const queries = {
        totalTesters: 'SELECT COUNT(*) as count FROM testers WHERE rating > 0',
        averageRating: 'SELECT AVG(rating) as average FROM testers WHERE rating > 0',
        maxRating: 'SELECT MAX(rating) as max FROM testers',
        ratingDistribution: `
          SELECT 
            CASE 
              WHEN rating = 0 THEN '0'
              WHEN rating BETWEEN 1 AND 10 THEN '1-10'
              WHEN rating BETWEEN 11 AND 25 THEN '11-25'
              WHEN rating BETWEEN 26 AND 50 THEN '26-50'
              WHEN rating > 50 THEN '50+'
            END as range,
            COUNT(*) as count
          FROM testers
          GROUP BY range
          ORDER BY 
            CASE range
              WHEN '0' THEN 0
              WHEN '1-10' THEN 1
              WHEN '11-25' THEN 2
              WHEN '26-50' THEN 3
              WHEN '50+' THEN 4
            END
        `
      };
      
      const [totalResult, avgResult, maxResult, distributionResult] = await Promise.all([
        pool.query(queries.totalTesters),
        pool.query(queries.averageRating),
        pool.query(queries.maxRating),
        pool.query(queries.ratingDistribution)
      ]);
      
      const distribution = {};
      distributionResult.rows.forEach(row => {
        distribution[row.range] = parseInt(row.count);
      });
      
      return {
        success: true,
        data: {
          totalActiveTesters: parseInt(totalResult.rows[0].count),
          averageRating: parseFloat(avgResult.rows[0].average) || 0,
          maxRating: parseInt(maxResult.rows[0].max) || 0,
          distribution
        }
      };
    } catch (error) {
      console.error('Error getting rating statistics:', error);
      throw error;
    }
  }

  /**
   * Record rating-related activity in activity history
   * @param {number} testerId - Tester ID
   * @param {string} eventType - Type of event
   * @param {Object} metadata - Additional event data
   * @returns {Promise<void>}
   */
  static async recordRatingActivity(testerId, eventType, metadata) {
    try {
      const query = `
        INSERT INTO activity_history (tester_id, event_type, description, metadata)
        VALUES ($1, 'rating_updated', $2, $3)
      `;
      
      const description = this.generateActivityDescription(eventType, metadata);
      
      await pool.query(query, [testerId, description, JSON.stringify(metadata)]);
    } catch (error) {
      // Don't throw error for activity logging - it's not critical
      console.warn('Failed to record rating activity:', error);
    }
  }

  /**
   * Generate human-readable description for rating activity
   * @param {string} eventType - Type of event
   * @param {Object} metadata - Event metadata
   * @returns {string} Description
   */
  static generateActivityDescription(eventType, metadata) {
    switch (eventType) {
      case 'bug_created':
        return `Рейтинг обновлен после создания бага с приоритетом ${metadata.priority}. Новый рейтинг: ${metadata.newRating}`;
      case 'priority_changed':
        return `Рейтинг обновлен после изменения приоритета бага с ${metadata.oldPriority} на ${metadata.newPriority}. Новый рейтинг: ${metadata.newRating}`;
      case 'bug_deleted':
        return `Рейтинг обновлен после удаления бага с приоритетом ${metadata.priority}. Новый рейтинг: ${metadata.newRating}`;
      default:
        return `Рейтинг обновлен. Новый рейтинг: ${metadata.newRating}`;
    }
  }

  /**
   * Recalculate all tester ratings (maintenance function)
   * @returns {Promise<Object>} Recalculation results
   */
  static async recalculateAllRatings() {
    try {
      console.log('Starting recalculation of all tester ratings...');
      
      // Get all tester IDs
      const testersQuery = 'SELECT id FROM testers ORDER BY id';
      const testersResult = await pool.query(testersQuery);
      const testerIds = testersResult.rows.map(row => row.id);
      
      console.log(`Found ${testerIds.length} testers to recalculate`);
      
      // Update ratings in batches
      const batchSize = 50;
      const results = {
        processed: 0,
        updated: 0,
        errors: 0
      };
      
      for (let i = 0; i < testerIds.length; i += batchSize) {
        const batch = testerIds.slice(i, i + batchSize);
        const batchResult = await this.updateMultipleTesterRatings(batch);
        
        results.processed += batch.length;
        results.updated += batchResult.data.updated.length;
        results.errors += batchResult.data.errors.length;
        
        console.log(`Processed batch ${Math.floor(i / batchSize) + 1}: ${batch.length} testers`);
      }
      
      console.log('Rating recalculation completed:', results);
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Error recalculating all ratings:', error);
      throw error;
    }
  }
}

module.exports = RatingService;