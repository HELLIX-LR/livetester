const pool = require('../config/database');

/**
 * ActivityHistory Model
 * Handles database operations for tester activity history
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.6
 */
class ActivityHistory {
  /**
   * Validate activity data
   * @param {Object} activityData - Activity data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validate(activityData) {
    const errors = [];
    const { testerId, eventType, description } = activityData;

    // Check required fields
    if (!testerId) {
      errors.push({ field: 'testerId', message: 'ID тестера обязательно' });
    }
    if (!eventType || eventType.trim() === '') {
      errors.push({ field: 'eventType', message: 'Тип события обязателен' });
    }
    if (!description || description.trim() === '') {
      errors.push({ field: 'description', message: 'Описание обязательно' });
    }

    // Validate enum values (Requirements 18.1, 18.2, 18.3)
    const validEventTypes = ['registration', 'bug_found', 'status_changed'];
    if (eventType && !validEventTypes.includes(eventType)) {
      errors.push({ 
        field: 'eventType', 
        message: `Тип события должен быть одним из: ${validEventTypes.join(', ')}` 
      });
    }

    // Validate testerId is a number
    if (testerId && isNaN(parseInt(testerId))) {
      errors.push({ field: 'testerId', message: 'ID тестера должен быть числом' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create new activity record
   * @param {Object} activityData - Activity data
   * @param {number} activityData.testerId - Tester ID (required)
   * @param {string} activityData.eventType - Event type (required): registration, bug_found, status_changed
   * @param {string} activityData.description - Event description (required)
   * @param {Object} [activityData.metadata] - Additional event data (optional)
   * @returns {Promise<Object>} Created activity object
   */
  static async create(activityData) {
    try {
      // Validate input data
      const validation = this.validate(activityData);
      if (!validation.isValid) {
        const error = new Error('Validation failed');
        error.code = 'VALIDATION_ERROR';
        error.details = validation.errors;
        throw error;
      }

      const { testerId, eventType, description, metadata } = activityData;

      // Check if tester exists
      const testerCheck = await pool.query('SELECT id FROM testers WHERE id = $1', [testerId]);
      if (testerCheck.rows.length === 0) {
        const error = new Error('Tester not found');
        error.code = 'NOT_FOUND';
        error.field = 'testerId';
        throw error;
      }

      // Create activity record
      const query = `
        INSERT INTO activity_history (
          tester_id, event_type, description, metadata
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id, tester_id as "testerId", event_type as "eventType", 
                  description, metadata, created_at as "createdAt"
      `;

      const result = await pool.query(query, [
        testerId,
        eventType,
        description,
        metadata ? JSON.stringify(metadata) : null
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating activity record:', error);
      throw error;
    }
  }

  /**
   * Find activity by ID
   * @param {number} id - Activity ID
   * @returns {Promise<Object|null>} Activity object or null if not found
   */
  static async findById(id) {
    try {
      const query = `
        SELECT id, tester_id as "testerId", event_type as "eventType", 
               description, metadata, created_at as "createdAt"
        FROM activity_history
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding activity by ID:', error);
      throw error;
    }
  }

  /**
   * Get activity history by tester ID
   * @param {number} testerId - Tester ID
   * @param {Object} options - Query options
   * @param {string} [options.eventType] - Filter by event type
   * @param {number} [options.limit] - Limit number of records
   * @returns {Promise<Array>} Array of activity records
   */
  static async findByTesterId(testerId, options = {}) {
    try {
      const { eventType, limit } = options;
      const conditions = ['tester_id = $1'];
      const params = [testerId];
      let paramIndex = 2;

      // Add event type filter if provided (Requirement 18.6)
      if (eventType) {
        conditions.push(`event_type = $${paramIndex}`);
        params.push(eventType);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');
      const limitClause = limit ? `LIMIT $${paramIndex}` : '';
      if (limit) {
        params.push(limit);
      }

      // Sort by timestamp DESC for chronological order (Requirement 18.4)
      const query = `
        SELECT id, tester_id as "testerId", event_type as "eventType", 
               description, metadata, created_at as "createdAt"
        FROM activity_history
        WHERE ${whereClause}
        ORDER BY created_at DESC
        ${limitClause}
      `;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error finding activity by tester ID:', error);
      throw error;
    }
  }

  /**
   * Get all activity records with optional filtering
   * @param {Object} options - Query options
   * @param {string} [options.eventType] - Filter by event type
   * @param {number} [options.testerId] - Filter by tester ID
   * @param {number} [options.limit] - Limit number of records
   * @returns {Promise<Array>} Array of activity records
   */
  static async findAll(options = {}) {
    try {
      const { eventType, testerId, limit } = options;
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (testerId) {
        conditions.push(`tester_id = $${paramIndex}`);
        params.push(testerId);
        paramIndex++;
      }

      if (eventType) {
        conditions.push(`event_type = $${paramIndex}`);
        params.push(eventType);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const limitClause = limit ? `LIMIT $${paramIndex}` : '';
      if (limit) {
        params.push(limit);
      }

      // Sort by timestamp DESC for chronological order
      const query = `
        SELECT ah.id, ah.tester_id as "testerId", t.name as "testerName",
               ah.event_type as "eventType", ah.description, ah.metadata, 
               ah.created_at as "createdAt"
        FROM activity_history ah
        LEFT JOIN testers t ON ah.tester_id = t.id
        ${whereClause}
        ORDER BY ah.created_at DESC
        ${limitClause}
      `;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error finding all activities:', error);
      throw error;
    }
  }

  /**
   * Delete activity record
   * @param {number} id - Activity ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM activity_history WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        const error = new Error('Activity record not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting activity record:', error);
      throw error;
    }
  }

  /**
   * Get activity statistics
   * @returns {Promise<Object>} Activity statistics
   */
  static async getStatistics() {
    try {
      const queries = {
        total: 'SELECT COUNT(*) as count FROM activity_history',
        byEventType: `
          SELECT event_type, COUNT(*) as count 
          FROM activity_history 
          GROUP BY event_type
        `,
        recentActivity: `
          SELECT COUNT(*) as count 
          FROM activity_history 
          WHERE created_at >= NOW() - INTERVAL '24 hours'
        `
      };

      const [totalResult, eventTypeResult, recentResult] = await Promise.all([
        pool.query(queries.total),
        pool.query(queries.byEventType),
        pool.query(queries.recentActivity)
      ]);

      const total = parseInt(totalResult.rows[0].count);
      const recent24h = parseInt(recentResult.rows[0].count);
      
      const byEventType = {};
      eventTypeResult.rows.forEach(row => {
        byEventType[row.event_type] = parseInt(row.count);
      });

      return {
        total,
        recent24h,
        byEventType
      };
    } catch (error) {
      console.error('Error getting activity statistics:', error);
      throw error;
    }
  }
}

module.exports = ActivityHistory;