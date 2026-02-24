const Tester = require('../models/Tester.model');
const googleSheetsService = require('./googleSheets.service');
const ActivityHistoryService = require('./activityHistory.service');
const NotificationService = require('./notification.service');

/**
 * Tester Service
 * Handles business logic for tester registration and management
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
class TesterService {
  /**
   * Register a new tester
   * Validates input data and creates tester record with default values
   * Integrates with Google Sheets for data synchronization
   * @param {Object} testerData - Tester registration data
   * @param {string} testerData.name - Tester name (required)
   * @param {string} testerData.email - Tester email (required)
   * @param {string} testerData.deviceType - Device type (required)
   * @param {string} testerData.os - Operating system (required)
   * @param {string} [testerData.nickname] - Nickname (optional)
   * @param {string} [testerData.telegram] - Telegram username/ID (optional)
   * @param {string} [testerData.osVersion] - OS version (optional)
   * @returns {Promise<Object>} Created tester object
   * @throws {Error} Validation error if required fields are missing or invalid
   */
  static async registerTester(testerData) {
    try {
      // Validate required fields (Requirements 1.2, 1.4)
      const validation = Tester.validate(testerData);
      if (!validation.isValid) {
        const error = new Error('Validation failed');
        error.code = 'VALIDATION_ERROR';
        error.details = validation.errors;
        throw error;
      }

      // Create tester with default values (Requirement 1.3)
      // status: 'active', bugs_count: 0, rating: 0
      const tester = await Tester.create(testerData);

      // Record registration activity (Requirement 18.1)
      try {
        await ActivityHistoryService.recordRegistration(tester.id, {
          deviceType: tester.deviceType,
          os: tester.os,
          osVersion: tester.osVersion
        });
      } catch (activityError) {
        console.warn(`Failed to record registration activity for tester ${tester.id}:`, activityError.message);
        // Don't fail registration if activity recording fails
      }

      // Sync to Google Sheets (Requirements 3.1, 3.2, 3.5)
      try {
        await googleSheetsService.appendTester(tester);
        console.log(`Tester ${tester.id} successfully synced to Google Sheets`);
      } catch (sheetsError) {
        // Log error but don't fail registration - data is queued for retry
        console.warn(`Google Sheets sync failed for tester ${tester.id}:`, sheetsError.message);
        console.log('Data has been queued for retry when Google Sheets becomes available');
      }

      // Create notification for new tester registration (Requirement 17.1)
      try {
        await NotificationService.createNewTesterNotification(tester);
      } catch (notificationError) {
        console.warn(`Failed to create notification for new tester ${tester.id}:`, notificationError.message);
        // Don't fail registration if notification creation fails
      }

      return {
        success: true,
        data: tester
      };
    } catch (error) {
      // Handle validation errors
      if (error.code === 'VALIDATION_ERROR') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.details
          }
        };
      }

      // Handle duplicate email error
      if (error.code === 'CONFLICT') {
        return {
          success: false,
          error: {
            code: 'CONFLICT',
            message: error.message,
            field: error.field
          }
        };
      }

      // Handle other errors
      console.error('Error in registerTester:', error);
      throw error;
    }
  }

  /**
   * Get tester by ID
   * @param {number} id - Tester ID
   * @returns {Promise<Object>} Tester object or error
   */
  static async getTesterById(id) {
    try {
      const tester = await Tester.findById(id);
      
      if (!tester) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tester not found',
            resource: 'tester',
            id
          }
        };
      }

      return {
        success: true,
        data: tester
      };
    } catch (error) {
      console.error('Error in getTesterById:', error);
      throw error;
    }
  }

  /**
   * Get tester by email
   * @param {string} email - Tester email
   * @returns {Promise<Object>} Tester object or error
   */
  static async getTesterByEmail(email) {
    try {
      const tester = await Tester.findByEmail(email);
      
      if (!tester) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tester not found',
            resource: 'tester',
            email
          }
        };
      }

      return {
        success: true,
        data: tester
      };
    } catch (error) {
      console.error('Error in getTesterByEmail:', error);
      throw error;
    }
  }

  /**
   * Get all testers with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Testers list with pagination info
   */
  static async getAllTesters(options = {}) {
    try {
      const result = await Tester.findAll(options);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error in getAllTesters:', error);
      throw error;
    }
  }

  /**
   * Update tester information
   * @param {number} id - Tester ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated tester object or error
   */
  static async updateTester(id, updates) {
    try {
      // If email is being updated, validate format
      if (updates.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updates.email)) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [{ field: 'email', message: 'Invalid email format' }]
            }
          };
        }
      }

      const tester = await Tester.update(id, updates);
      
      // Sync updates to Google Sheets
      try {
        await googleSheetsService.updateTester(id, updates);
        console.log(`Tester ${id} updates successfully synced to Google Sheets`);
      } catch (sheetsError) {
        console.warn(`Google Sheets sync failed for tester ${id} update:`, sheetsError.message);
      }

      return {
        success: true,
        data: tester
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
            resource: 'tester',
            id
          }
        };
      }

      // Handle duplicate email error
      if (error.code === '23505' && error.constraint === 'testers_email_key') {
        return {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Email already registered',
            field: 'email'
          }
        };
      }

      console.error('Error in updateTester:', error);
      throw error;
    }
  }

  /**
   * Update tester status
   * @param {number} id - Tester ID
   * @param {string} status - New status (active, inactive, suspended)
   * @returns {Promise<Object>} Updated tester object or error
   */
  static async updateTesterStatus(id, status) {
    try {
      // Validate status value
      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid status value',
            details: [{ field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` }]
          }
        };
      }

      // Get current tester to check old status
      const currentTesterResult = await this.getTesterById(id);
      if (!currentTesterResult.success) {
        return currentTesterResult;
      }
      
      const oldStatus = currentTesterResult.data.status;

      const tester = await Tester.update(id, { status });
      
      // Record status change activity if status actually changed (Requirement 18.3)
      if (oldStatus !== status) {
        try {
          await ActivityHistoryService.recordStatusChanged(id, oldStatus, status);
        } catch (activityError) {
          console.warn(`Failed to record status change activity for tester ${id}:`, activityError.message);
          // Don't fail status update if activity recording fails
        }
      }
      
      return {
        success: true,
        data: tester
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
            resource: 'tester',
            id
          }
        };
      }

      console.error('Error in updateTesterStatus:', error);
      throw error;
    }
  }

  /**
   * Delete tester
   * @param {number} id - Tester ID
   * @returns {Promise<Object>} Success status or error
   */
  static async deleteTester(id) {
    try {
      await Tester.delete(id);
      
      return {
        success: true,
        message: 'Tester deleted successfully'
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
            resource: 'tester',
            id
          }
        };
      }

      console.error('Error in deleteTester:', error);
      throw error;
    }
  }

  /**
   * Update tester's last activity timestamp
   * @param {number} id - Tester ID
   * @returns {Promise<boolean>} Success status
   */
  static async updateLastActivity(id) {
    try {
      await Tester.updateLastActivity(id);
      return true;
    } catch (error) {
      console.error('Error in updateLastActivity:', error);
      throw error;
    }
  }

  /**
   * Load testers from Google Sheets
   * Validates: Requirements 10.1, 10.2, 10.3
   * @returns {Promise<Object>} Testers from Google Sheets or error
   */
  static async loadTestersFromGoogleSheets() {
    try {
      const testers = await googleSheetsService.fetchTesters();
      
      return {
        success: true,
        data: testers,
        count: testers.length
      };
    } catch (error) {
      console.error('Error loading testers from Google Sheets:', error);
      
      return {
        success: false,
        error: {
          code: 'EXTERNAL_SERVICE_ERROR',
          message: 'Failed to load testers from Google Sheets',
          service: 'google_sheets',
          retryable: true,
          details: error.message
        }
      };
    }
  }

  /**
   * Sync testers from Google Sheets to local database
   * This can be used to populate the database from existing Google Sheets data
   * @returns {Promise<Object>} Sync results
   */
  static async syncTestersFromGoogleSheets() {
    try {
      const sheetsResult = await this.loadTestersFromGoogleSheets();
      
      if (!sheetsResult.success) {
        return sheetsResult;
      }

      const sheetsTesters = sheetsResult.data;
      const syncResults = {
        processed: 0,
        created: 0,
        updated: 0,
        errors: []
      };

      for (const sheetsTester of sheetsTesters) {
        try {
          syncResults.processed++;

          // Check if tester exists in database
          const existingResult = await this.getTesterByEmail(sheetsTester.email);
          
          if (existingResult.success) {
            // Update existing tester
            const updateData = {
              name: sheetsTester.name,
              nickname: sheetsTester.nickname,
              telegram: sheetsTester.telegram,
              deviceType: sheetsTester.deviceType,
              os: sheetsTester.os,
              osVersion: sheetsTester.osVersion,
              status: sheetsTester.status
            };
            
            await this.updateTester(existingResult.data.id, updateData);
            syncResults.updated++;
          } else {
            // Create new tester (without triggering Google Sheets sync)
            const tester = await Tester.create(sheetsTester);
            syncResults.created++;
          }
        } catch (error) {
          syncResults.errors.push({
            tester: sheetsTester.email || sheetsTester.name,
            error: error.message
          });
        }
      }

      return {
        success: true,
        data: syncResults
      };
    } catch (error) {
      console.error('Error syncing testers from Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Check Google Sheets connection status
   * @returns {Promise<Object>} Connection status
   */
  static async checkGoogleSheetsConnection() {
    try {
      const isConnected = await googleSheetsService.checkConnection();
      
      return {
        success: true,
        connected: isConnected,
        service: 'google_sheets'
      };
    } catch (error) {
      return {
        success: false,
        connected: false,
        service: 'google_sheets',
        error: error.message
      };
    }
  }

  /**
   * Retry failed Google Sheets operations
   * @returns {Promise<Object>} Retry results
   */
  static async retryGoogleSheetsOperations() {
    try {
      const result = await googleSheetsService.retryFailedOperations();
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error retrying Google Sheets operations:', error);
      throw error;
    }
  }
}

module.exports = TesterService;
