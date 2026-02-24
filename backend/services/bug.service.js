const Bug = require('../models/Bug.model');
const RatingService = require('./rating.service');
const ActivityHistoryService = require('./activityHistory.service');
const NotificationService = require('./notification.service');

/**
 * Bug Service
 * Handles business logic for bug management
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.7, 21.1
 */
class BugService {
  /**
   * Create a new bug
   * Validates input data and creates bug record
   * @param {Object} bugData - Bug data
   * @param {string} bugData.title - Bug title (required)
   * @param {string} bugData.description - Bug description (required)
   * @param {number} bugData.testerId - Tester ID (required)
   * @param {string} bugData.priority - Bug priority (required): low, medium, high, critical
   * @param {string} bugData.status - Bug status (required): new, in_progress, fixed, closed
   * @param {string} bugData.type - Bug type (required): ui, functionality, performance, crash, security, other
   * @returns {Promise<Object>} Created bug object or error
   */
  static async createBug(bugData) {
    try {
      // Validate required fields (Requirements 13.1)
      const validation = Bug.validate(bugData);
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

      // Create bug
      const bug = await Bug.create(bugData);

      // Record bug found activity (Requirement 18.2)
      try {
        await ActivityHistoryService.recordBugFound(
          bug.testerId, 
          bug.id, 
          bug.title, 
          bug.priority,
          {
            bugType: bug.type,
            status: bug.status
          }
        );
      } catch (activityError) {
        console.warn(`Failed to record bug found activity for tester ${bug.testerId}:`, activityError.message);
        // Don't fail bug creation if activity recording fails
      }

      // Update tester rating and bugs count (Requirements 14.1, 14.2, 14.4)
      try {
        await RatingService.onBugCreated(bug.testerId, bug.priority);
      } catch (ratingError) {
        console.error('Error updating tester rating after bug creation:', ratingError);
        // Don't fail the bug creation if rating update fails
      }

      // Create notification for critical bugs (Requirement 17.2)
      if (bug.priority === 'critical') {
        try {
          // Get tester name for notification
          const tester = await require('../models/Tester.model').findById(bug.testerId);
          const testerName = tester ? tester.name : 'Неизвестный тестер';
          
          await NotificationService.createCriticalBugNotification(bug, testerName);
        } catch (notificationError) {
          console.warn(`Failed to create critical bug notification for bug ${bug.id}:`, notificationError.message);
          // Don't fail bug creation if notification creation fails
        }
      }

      return {
        success: true,
        data: bug
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

      console.error('Error in createBug:', error);
      throw error;
    }
  }

  /**
   * Get bug by ID
   * @param {number} id - Bug ID
   * @returns {Promise<Object>} Bug object or error
   */
  static async getBugById(id) {
    try {
      const bug = await Bug.findById(id);
      
      if (!bug) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Баг не найден',
            resource: 'bug',
            id
          }
        };
      }

      return {
        success: true,
        data: bug
      };
    } catch (error) {
      console.error('Error in getBugById:', error);
      throw error;
    }
  }

  /**
   * Get all bugs with filtering and pagination
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.pageSize=20] - Items per page
   * @param {string} [options.search] - Search query for title or description
   * @param {string} [options.status] - Filter by status
   * @param {string} [options.priority] - Filter by priority
   * @param {string} [options.type] - Filter by type
   * @param {number} [options.testerId] - Filter by tester ID
   * @param {string} [options.sortBy='created_at'] - Sort field
   * @param {string} [options.sortOrder='DESC'] - Sort order (ASC or DESC)
   * @returns {Promise<Object>} Bugs list with pagination info
   */
  static async getAllBugs(options = {}) {
    try {
      const result = await Bug.findAll(options);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error in getAllBugs:', error);
      throw error;
    }
  }

  /**
   * Update bug information
   * @param {number} id - Bug ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated bug object or error
   */
  static async updateBug(id, updates) {
    try {
      // Validate enum values if they are being updated
      if (updates.status) {
        const validStatuses = ['new', 'in_progress', 'fixed', 'closed'];
        if (!validStatuses.includes(updates.status)) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Ошибка валидации',
              details: [{ 
                field: 'status', 
                message: `Статус должен быть одним из: ${validStatuses.join(', ')}` 
              }]
            }
          };
        }
      }

      if (updates.priority) {
        const validPriorities = ['low', 'medium', 'high', 'critical'];
        if (!validPriorities.includes(updates.priority)) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Ошибка валидации',
              details: [{ 
                field: 'priority', 
                message: `Приоритет должен быть одним из: ${validPriorities.join(', ')}` 
              }]
            }
          };
        }
      }

      if (updates.type) {
        const validTypes = ['ui', 'functionality', 'performance', 'crash', 'security', 'other'];
        if (!validTypes.includes(updates.type)) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Ошибка валидации',
              details: [{ 
                field: 'type', 
                message: `Тип должен быть одним из: ${validTypes.join(', ')}` 
              }]
            }
          };
        }
      }

      // Validate title length if being updated
      if (updates.title && updates.title.length > 500) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Ошибка валидации',
            details: [{ field: 'title', message: 'Название не может быть длиннее 500 символов' }]
          }
        };
      }

      const bug = await Bug.update(id, updates);
      
      return {
        success: true,
        data: bug
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Баг не найден',
            resource: 'bug',
            id
          }
        };
      }

      console.error('Error in updateBug:', error);
      throw error;
    }
  }

  /**
   * Update bug status
   * @param {number} id - Bug ID
   * @param {string} status - New status (new, in_progress, fixed, closed)
   * @returns {Promise<Object>} Updated bug object or error
   */
  static async updateBugStatus(id, status) {
    try {
      // Validate status value
      const validStatuses = ['new', 'in_progress', 'fixed', 'closed'];
      if (!validStatuses.includes(status)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Неверное значение статуса',
            details: [{ 
              field: 'status', 
              message: `Статус должен быть одним из: ${validStatuses.join(', ')}` 
            }]
          }
        };
      }

      const bug = await Bug.update(id, { status });
      
      return {
        success: true,
        data: bug
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Баг не найден',
            resource: 'bug',
            id
          }
        };
      }

      console.error('Error in updateBugStatus:', error);
      throw error;
    }
  }

  /**
   * Update bug priority
   * @param {number} id - Bug ID
   * @param {string} priority - New priority (low, medium, high, critical)
   * @returns {Promise<Object>} Updated bug object or error
   */
  static async updateBugPriority(id, priority) {
    try {
      // Validate priority value
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(priority)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Неверное значение приоритета',
            details: [{ 
              field: 'priority', 
              message: `Приоритет должен быть одним из: ${validPriorities.join(', ')}` 
            }]
          }
        };
      }

      // Get current bug to check old priority
      const currentBugResult = await this.getBugById(id);
      if (!currentBugResult.success) {
        return currentBugResult;
      }
      
      const oldPriority = currentBugResult.data.priority;
      const testerId = currentBugResult.data.testerId;

      const bug = await Bug.update(id, { priority });
      
      // Update tester rating if priority changed (Requirements 14.4)
      if (oldPriority !== priority) {
        try {
          await RatingService.onBugPriorityChanged(testerId, oldPriority, priority);
        } catch (ratingError) {
          console.error('Error updating tester rating after priority change:', ratingError);
          // Don't fail the bug update if rating update fails
        }
      }
      
      return {
        success: true,
        data: bug
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Баг не найден',
            resource: 'bug',
            id
          }
        };
      }

      console.error('Error in updateBugPriority:', error);
      throw error;
    }
  }

  /**
   * Delete bug
   * @param {number} id - Bug ID
   * @returns {Promise<Object>} Success status or error
   */
  static async deleteBug(id) {
    try {
      // Get bug details before deletion for rating update
      const bugResult = await this.getBugById(id);
      if (!bugResult.success) {
        return bugResult;
      }
      
      const bug = bugResult.data;
      const testerId = bug.testerId;
      const priority = bug.priority;

      await Bug.delete(id);
      
      // Update tester rating after bug deletion (Requirements 14.1, 14.2, 14.4)
      try {
        await RatingService.onBugDeleted(testerId, priority);
      } catch (ratingError) {
        console.error('Error updating tester rating after bug deletion:', ratingError);
        // Don't fail the bug deletion if rating update fails
      }
      
      return {
        success: true,
        message: 'Баг успешно удален'
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Баг не найден',
            resource: 'bug',
            id
          }
        };
      }

      console.error('Error in deleteBug:', error);
      throw error;
    }
  }

  /**
   * Get bugs by tester ID
   * @param {number} testerId - Tester ID
   * @returns {Promise<Object>} Array of bugs or error
   */
  static async getBugsByTesterId(testerId) {
    try {
      const bugs = await Bug.findByTesterId(testerId);
      
      return {
        success: true,
        data: bugs,
        count: bugs.length
      };
    } catch (error) {
      console.error('Error in getBugsByTesterId:', error);
      throw error;
    }
  }

  /**
   * Get bug statistics
   * @returns {Promise<Object>} Bug statistics or error
   */
  static async getBugStatistics() {
    try {
      const statistics = await Bug.getStatistics();
      
      return {
        success: true,
        data: statistics
      };
    } catch (error) {
      console.error('Error in getBugStatistics:', error);
      throw error;
    }
  }

  /**
   * Validate bug data for creation/update
   * @param {Object} bugData - Bug data to validate
   * @returns {Object} Validation result
   */
  static validateBugData(bugData) {
    return Bug.validate(bugData);
  }
}

module.exports = BugService;