const Screenshot = require('../models/Screenshot.model');
const path = require('path');

/**
 * Screenshot Service
 * Handles business logic for screenshot management
 * Requirements: 20.1, 20.6, 20.7
 */
class ScreenshotService {
  /**
   * Create a new screenshot record
   * Validates input data and creates screenshot record with metadata
   * @param {Object} screenshotData - Screenshot data
   * @param {number} screenshotData.bugId - Bug ID (required)
   * @param {string} screenshotData.filename - Original filename (required)
   * @param {string} screenshotData.filePath - File path on server (required)
   * @param {number} screenshotData.fileSize - File size in bytes (required)
   * @param {string} screenshotData.mimeType - MIME type (required)
   * @returns {Promise<Object>} Created screenshot object or error
   */
  static async createScreenshot(screenshotData) {
    try {
      // Validate required fields
      const validation = Screenshot.validate(screenshotData);
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

      // Check if bug has reached screenshot limit (Requirement 20.6)
      const hasReachedLimit = await Screenshot.hasReachedLimit(screenshotData.bugId);
      if (hasReachedLimit) {
        return {
          success: false,
          error: {
            code: 'LIMIT_EXCEEDED',
            message: 'Достигнуто максимальное количество скриншотов для этого бага (10)',
            details: [{ field: 'bugId', message: 'Максимум 10 скриншотов на баг' }]
          }
        };
      }

      // Create screenshot
      const screenshot = await Screenshot.create(screenshotData);

      return {
        success: true,
        data: screenshot
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

      // Handle bug not found error
      if (error.code === 'NOT_FOUND') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Баг не найден',
            field: error.field
          }
        };
      }

      // Handle limit exceeded error
      if (error.code === 'LIMIT_EXCEEDED') {
        return {
          success: false,
          error: {
            code: 'LIMIT_EXCEEDED',
            message: error.message,
            details: [{ field: 'bugId', message: 'Максимум 10 скриншотов на баг' }]
          }
        };
      }

      console.error('Error in createScreenshot:', error);
      throw error;
    }
  }

  /**
   * Create screenshot from uploaded file
   * Processes multer file object and creates screenshot record
   * @param {number} bugId - Bug ID
   * @param {Object} file - Multer file object
   * @returns {Promise<Object>} Created screenshot object or error
   */
  static async createScreenshotFromFile(bugId, file) {
    try {
      if (!file) {
        return {
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'Файл не был загружен',
            details: [{ field: 'screenshot', message: 'Необходимо выбрать файл для загрузки' }]
          }
        };
      }

      const screenshotData = {
        bugId: parseInt(bugId),
        filename: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype
      };

      return await this.createScreenshot(screenshotData);
    } catch (error) {
      console.error('Error in createScreenshotFromFile:', error);
      throw error;
    }
  }

  /**
   * Get screenshot by ID
   * @param {number} id - Screenshot ID
   * @returns {Promise<Object>} Screenshot object or error
   */
  static async getScreenshotById(id) {
    try {
      const screenshot = await Screenshot.findById(id);
      
      if (!screenshot) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Скриншот не найден',
            resource: 'screenshot',
            id
          }
        };
      }

      return {
        success: true,
        data: screenshot
      };
    } catch (error) {
      console.error('Error in getScreenshotById:', error);
      throw error;
    }
  }

  /**
   * Get all screenshots for a bug
   * @param {number} bugId - Bug ID
   * @returns {Promise<Object>} Screenshots list or error
   */
  static async getScreenshotsByBugId(bugId) {
    try {
      const screenshots = await Screenshot.findByBugId(bugId);
      const count = screenshots.length;
      
      // Add URL for each screenshot for frontend access
      const screenshotsWithUrls = screenshots.map(screenshot => ({
        ...screenshot,
        url: `/uploads/screenshots/${path.basename(screenshot.filePath)}`,
        thumbnailUrl: `/uploads/screenshots/${path.basename(screenshot.filePath)}` // Could be enhanced with actual thumbnails
      }));

      return {
        success: true,
        data: screenshotsWithUrls,
        count,
        limit: 10,
        remaining: Math.max(0, 10 - count)
      };
    } catch (error) {
      console.error('Error in getScreenshotsByBugId:', error);
      throw error;
    }
  }

  /**
   * Delete screenshot (both file and database record)
   * @param {number} id - Screenshot ID
   * @returns {Promise<Object>} Success status or error
   */
  static async deleteScreenshot(id) {
    try {
      await Screenshot.delete(id);
      
      return {
        success: true,
        message: 'Скриншот успешно удален'
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Скриншот не найден',
            resource: 'screenshot',
            id
          }
        };
      }

      console.error('Error in deleteScreenshot:', error);
      throw error;
    }
  }

  /**
   * Check if bug can accept more screenshots
   * @param {number} bugId - Bug ID
   * @returns {Promise<Object>} Limit status
   */
  static async checkScreenshotLimit(bugId) {
    try {
      const count = await Screenshot.getCountByBugId(bugId);
      const hasReachedLimit = count >= 10;
      
      return {
        success: true,
        data: {
          current: count,
          limit: 10,
          remaining: Math.max(0, 10 - count),
          canUpload: !hasReachedLimit
        }
      };
    } catch (error) {
      console.error('Error in checkScreenshotLimit:', error);
      throw error;
    }
  }

  /**
   * Get screenshot statistics for a bug
   * @param {number} bugId - Bug ID
   * @returns {Promise<Object>} Screenshot statistics
   */
  static async getScreenshotStatistics(bugId) {
    try {
      const count = await Screenshot.getCountByBugId(bugId);
      const totalSize = await Screenshot.getTotalSizeByBugId(bugId);
      
      return {
        success: true,
        data: {
          count,
          totalSize,
          totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
          limit: 10,
          remaining: Math.max(0, 10 - count)
        }
      };
    } catch (error) {
      console.error('Error in getScreenshotStatistics:', error);
      throw error;
    }
  }

  /**
   * Validate screenshot data for creation
   * @param {Object} screenshotData - Screenshot data to validate
   * @returns {Object} Validation result
   */
  static validateScreenshotData(screenshotData) {
    return Screenshot.validate(screenshotData);
  }

  /**
   * Delete all screenshots for a bug (used when bug is deleted)
   * @param {number} bugId - Bug ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteScreenshotsByBugId(bugId) {
    try {
      const deletedCount = await Screenshot.deleteByBugId(bugId);
      
      return {
        success: true,
        message: `Удалено ${deletedCount} скриншотов`,
        deletedCount
      };
    } catch (error) {
      console.error('Error in deleteScreenshotsByBugId:', error);
      throw error;
    }
  }
}

module.exports = ScreenshotService;