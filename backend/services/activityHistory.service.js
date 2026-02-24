const ActivityHistory = require('../models/ActivityHistory.model');

/**
 * ActivityHistory Service
 * Handles business logic for tester activity history
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.6
 */
class ActivityHistoryService {
  /**
   * Record a new activity event
   * @param {Object} activityData - Activity data
   * @param {number} activityData.testerId - Tester ID (required)
   * @param {string} activityData.eventType - Event type (required): registration, bug_found, status_changed
   * @param {string} activityData.description - Event description (required)
   * @param {Object} [activityData.metadata] - Additional event data (optional)
   * @returns {Promise<Object>} Created activity object or error
   */
  static async recordActivity(activityData) {
    try {
      // Validate required fields
      const validation = ActivityHistory.validate(activityData);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Ошибка валидации',
            details: validation.errors
          }
        };
      }

      // Create activity record
      const activity = await ActivityHistory.create(activityData);

      return {
        success: true,
        data: activity
      };
    } catch (error) {
      // Handle validation errors
      if (error.code === 'VALIDATION_ERROR') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Ошибка валидации',
            details: error.details
          }
        };
      }

      // Handle tester not found error
      if (error.code === 'NOT_FOUND') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Тестер не найден',
            field: error.field
          }
        };
      }

      console.error('Error in recordActivity:', error);
      throw error;
    }
  }

  /**
   * Record tester registration event (Requirement 18.1)
   * @param {number} testerId - Tester ID
   * @param {Object} [metadata] - Additional registration data
   * @returns {Promise<Object>} Created activity object or error
   */
  static async recordRegistration(testerId, metadata = {}) {
    try {
      const activityData = {
        testerId,
        eventType: 'registration',
        description: 'Тестер зарегистрировался в системе',
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        }
      };

      return await this.recordActivity(activityData);
    } catch (error) {
      console.error('Error recording registration activity:', error);
      throw error;
    }
  }

  /**
   * Record bug found event (Requirement 18.2)
   * @param {number} testerId - Tester ID
   * @param {number} bugId - Bug ID
   * @param {string} bugTitle - Bug title
   * @param {string} priority - Bug priority
   * @param {Object} [metadata] - Additional bug data
   * @returns {Promise<Object>} Created activity object or error
   */
  static async recordBugFound(testerId, bugId, bugTitle, priority, metadata = {}) {
    try {
      const activityData = {
        testerId,
        eventType: 'bug_found',
        description: `Найден баг: ${bugTitle}`,
        metadata: {
          bugId,
          bugTitle,
          priority,
          ...metadata,
          timestamp: new Date().toISOString()
        }
      };

      return await this.recordActivity(activityData);
    } catch (error) {
      console.error('Error recording bug found activity:', error);
      throw error;
    }
  }

  /**
   * Record status change event (Requirement 18.3)
   * @param {number} testerId - Tester ID
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @param {Object} [metadata] - Additional status change data
   * @returns {Promise<Object>} Created activity object or error
   */
  static async recordStatusChanged(testerId, oldStatus, newStatus, metadata = {}) {
    try {
      const activityData = {
        testerId,
        eventType: 'status_changed',
        description: `Статус изменен с "${oldStatus}" на "${newStatus}"`,
        metadata: {
          oldStatus,
          newStatus,
          ...metadata,
          timestamp: new Date().toISOString()
        }
      };

      return await this.recordActivity(activityData);
    } catch (error) {
      console.error('Error recording status change activity:', error);
      throw error;
    }
  }

  /**
   * Get activity history by tester ID (Requirement 18.4)
   * @param {number} testerId - Tester ID
   * @param {Object} options - Query options
   * @param {string} [options.eventType] - Filter by event type (Requirement 18.6)
   * @param {number} [options.limit] - Limit number of records
   * @returns {Promise<Object>} Activity history or error
   */
  static async getTesterActivity(testerId, options = {}) {
    try {
      // Validate testerId
      if (!testerId || isNaN(parseInt(testerId))) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Неверный ID тестера',
            details: [{ field: 'testerId', message: 'ID тестера должен быть числом' }]
          }
        };
      }

      // Validate eventType if provided
      if (options.eventType) {
        const validEventTypes = ['registration', 'bug_found', 'status_changed'];
        if (!validEventTypes.includes(options.eventType)) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Неверный тип события',
              details: [{ 
                field: 'eventType', 
                message: `Тип события должен быть одним из: ${validEventTypes.join(', ')}` 
              }]
            }
          };
        }
      }

      const activities = await ActivityHistory.findByTesterId(parseInt(testerId), options);

      return {
        success: true,
        data: activities,
        count: activities.length
      };
    } catch (error) {
      console.error('Error in getTesterActivity:', error);
      throw error;
    }
  }

  /**
   * Get all activity records with optional filtering
   * @param {Object} options - Query options
   * @param {string} [options.eventType] - Filter by event type
   * @param {number} [options.testerId] - Filter by tester ID
   * @param {number} [options.limit] - Limit number of records
   * @returns {Promise<Object>} Activity records or error
   */
  static async getAllActivity(options = {}) {
    try {
      // Validate eventType if provided
      if (options.eventType) {
        const validEventTypes = ['registration', 'bug_found', 'status_changed'];
        if (!validEventTypes.includes(options.eventType)) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Неверный тип события',
              details: [{ 
                field: 'eventType', 
                message: `Тип события должен быть одним из: ${validEventTypes.join(', ')}` 
              }]
            }
          };
        }
      }

      // Validate testerId if provided
      if (options.testerId && isNaN(parseInt(options.testerId))) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Неверный ID тестера',
            details: [{ field: 'testerId', message: 'ID тестера должен быть числом' }]
          }
        };
      }

      const activities = await ActivityHistory.findAll(options);

      return {
        success: true,
        data: activities,
        count: activities.length
      };
    } catch (error) {
      console.error('Error in getAllActivity:', error);
      throw error;
    }
  }

  /**
   * Get activity by ID
   * @param {number} id - Activity ID
   * @returns {Promise<Object>} Activity object or error
   */
  static async getActivityById(id) {
    try {
      // Validate ID
      if (!id || isNaN(parseInt(id))) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Неверный ID активности',
            details: [{ field: 'id', message: 'ID должен быть числом' }]
          }
        };
      }

      const activity = await ActivityHistory.findById(parseInt(id));
      
      if (!activity) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Запись активности не найдена',
            resource: 'activity',
            id
          }
        };
      }

      return {
        success: true,
        data: activity
      };
    } catch (error) {
      console.error('Error in getActivityById:', error);
      throw error;
    }
  }

  /**
   * Delete activity record
   * @param {number} id - Activity ID
   * @returns {Promise<Object>} Success status or error
   */
  static async deleteActivity(id) {
    try {
      // Validate ID
      if (!id || isNaN(parseInt(id))) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Неверный ID активности',
            details: [{ field: 'id', message: 'ID должен быть числом' }]
          }
        };
      }

      await ActivityHistory.delete(parseInt(id));
      
      return {
        success: true,
        message: 'Запись активности успешно удалена'
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Запись активности не найдена',
            resource: 'activity',
            id
          }
        };
      }

      console.error('Error in deleteActivity:', error);
      throw error;
    }
  }

  /**
   * Get activity statistics
   * @returns {Promise<Object>} Activity statistics or error
   */
  static async getActivityStatistics() {
    try {
      const statistics = await ActivityHistory.getStatistics();
      
      return {
        success: true,
        data: statistics
      };
    } catch (error) {
      console.error('Error in getActivityStatistics:', error);
      throw error;
    }
  }
}

module.exports = ActivityHistoryService;