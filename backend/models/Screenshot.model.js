const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Screenshot Model
 * Handles database operations for bug screenshots
 * Requirements: 20.1, 20.6, 20.7
 */
class Screenshot {
  /**
   * Validate screenshot data
   * @param {Object} screenshotData - Screenshot data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validate(screenshotData) {
    const errors = [];
    const { bugId, filename, filePath, fileSize, mimeType } = screenshotData;

    // Check required fields
    if (!bugId) {
      errors.push({ field: 'bugId', message: 'ID бага обязательно' });
    }
    if (!filename || filename.trim() === '') {
      errors.push({ field: 'filename', message: 'Имя файла обязательно' });
    }
    if (!filePath || filePath.trim() === '') {
      errors.push({ field: 'filePath', message: 'Путь к файлу обязателен' });
    }
    if (!fileSize || fileSize <= 0) {
      errors.push({ field: 'fileSize', message: 'Размер файла должен быть больше 0' });
    }
    if (!mimeType || mimeType.trim() === '') {
      errors.push({ field: 'mimeType', message: 'MIME тип обязателен' });
    }

    // Validate file size limit (5 MB = 5242880 bytes)
    if (fileSize && fileSize > 5242880) {
      errors.push({ field: 'fileSize', message: 'Размер файла не может превышать 5 МБ' });
    }

    // Validate MIME type
    const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (mimeType && !validMimeTypes.includes(mimeType)) {
      errors.push({ 
        field: 'mimeType', 
        message: `MIME тип должен быть одним из: ${validMimeTypes.join(', ')}` 
      });
    }

    // Validate bugId is a number
    if (bugId && isNaN(parseInt(bugId))) {
      errors.push({ field: 'bugId', message: 'ID бага должен быть числом' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create new screenshot record
   * @param {Object} screenshotData - Screenshot data
   * @param {number} screenshotData.bugId - Bug ID (required)
   * @param {string} screenshotData.filename - Original filename (required)
   * @param {string} screenshotData.filePath - File path on server (required)
   * @param {number} screenshotData.fileSize - File size in bytes (required)
   * @param {string} screenshotData.mimeType - MIME type (required)
   * @returns {Promise<Object>} Created screenshot object
   */
  static async create(screenshotData) {
    try {
      // Validate input data
      const validation = this.validate(screenshotData);
      if (!validation.isValid) {
        const error = new Error('Validation failed');
        error.code = 'VALIDATION_ERROR';
        error.details = validation.errors;
        throw error;
      }

      const { bugId, filename, filePath, fileSize, mimeType } = screenshotData;

      // Check if bug exists
      const bugCheck = await pool.query('SELECT id FROM bugs WHERE id = $1', [bugId]);
      if (bugCheck.rows.length === 0) {
        const error = new Error('Bug not found');
        error.code = 'NOT_FOUND';
        error.field = 'bugId';
        throw error;
      }

      // Check screenshot limit (max 10 per bug) - Requirement 20.6
      const countQuery = 'SELECT COUNT(*) as count FROM screenshots WHERE bug_id = $1';
      const countResult = await pool.query(countQuery, [bugId]);
      const currentCount = parseInt(countResult.rows[0].count);

      if (currentCount >= 10) {
        const error = new Error('Screenshot limit exceeded');
        error.code = 'LIMIT_EXCEEDED';
        error.message = 'Максимальное количество скриншотов для бага: 10';
        throw error;
      }

      // Create screenshot record
      const query = `
        INSERT INTO screenshots (
          bug_id, filename, file_path, file_size, mime_type
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, bug_id as "bugId", filename, file_path as "filePath", 
                  file_size as "fileSize", mime_type as "mimeType", 
                  uploaded_at as "uploadedAt"
      `;

      const result = await pool.query(query, [
        bugId,
        filename,
        filePath,
        fileSize,
        mimeType
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating screenshot:', error);
      throw error;
    }
  }

  /**
   * Find screenshot by ID
   * @param {number} id - Screenshot ID
   * @returns {Promise<Object|null>} Screenshot object or null if not found
   */
  static async findById(id) {
    try {
      const query = `
        SELECT id, bug_id as "bugId", filename, file_path as "filePath", 
               file_size as "fileSize", mime_type as "mimeType", 
               uploaded_at as "uploadedAt"
        FROM screenshots
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding screenshot by ID:', error);
      throw error;
    }
  }

  /**
   * Get all screenshots for a bug
   * @param {number} bugId - Bug ID
   * @returns {Promise<Array>} Array of screenshot objects
   */
  static async findByBugId(bugId) {
    try {
      const query = `
        SELECT id, bug_id as "bugId", filename, file_path as "filePath", 
               file_size as "fileSize", mime_type as "mimeType", 
               uploaded_at as "uploadedAt"
        FROM screenshots
        WHERE bug_id = $1
        ORDER BY uploaded_at DESC
      `;
      const result = await pool.query(query, [bugId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding screenshots by bug ID:', error);
      throw error;
    }
  }

  /**
   * Delete screenshot (both file and database record)
   * @param {number} id - Screenshot ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      // First get the screenshot to get file path
      const screenshot = await this.findById(id);
      if (!screenshot) {
        const error = new Error('Screenshot not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Delete from database first
      const query = 'DELETE FROM screenshots WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        const error = new Error('Screenshot not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Delete physical file (Requirement 20.7)
      try {
        const fullPath = path.resolve(screenshot.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`Deleted file: ${fullPath}`);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Don't throw error for file deletion failure - database record is already deleted
      }

      return true;
    } catch (error) {
      console.error('Error deleting screenshot:', error);
      throw error;
    }
  }

  /**
   * Get screenshot count for a bug
   * @param {number} bugId - Bug ID
   * @returns {Promise<number>} Number of screenshots
   */
  static async getCountByBugId(bugId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM screenshots WHERE bug_id = $1';
      const result = await pool.query(query, [bugId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting screenshot count:', error);
      throw error;
    }
  }

  /**
   * Check if bug has reached screenshot limit
   * @param {number} bugId - Bug ID
   * @returns {Promise<boolean>} True if limit reached
   */
  static async hasReachedLimit(bugId) {
    try {
      const count = await this.getCountByBugId(bugId);
      return count >= 10; // Requirement 20.6
    } catch (error) {
      console.error('Error checking screenshot limit:', error);
      throw error;
    }
  }

  /**
   * Get total file size for all screenshots of a bug
   * @param {number} bugId - Bug ID
   * @returns {Promise<number>} Total size in bytes
   */
  static async getTotalSizeByBugId(bugId) {
    try {
      const query = 'SELECT COALESCE(SUM(file_size), 0) as total_size FROM screenshots WHERE bug_id = $1';
      const result = await pool.query(query, [bugId]);
      return parseInt(result.rows[0].total_size);
    } catch (error) {
      console.error('Error getting total screenshot size:', error);
      throw error;
    }
  }

  /**
   * Delete all screenshots for a bug (used when bug is deleted)
   * @param {number} bugId - Bug ID
   * @returns {Promise<number>} Number of deleted screenshots
   */
  static async deleteByBugId(bugId) {
    try {
      // Get all screenshots for the bug
      const screenshots = await this.findByBugId(bugId);
      
      // Delete database records
      const query = 'DELETE FROM screenshots WHERE bug_id = $1 RETURNING id';
      const result = await pool.query(query, [bugId]);
      
      // Delete physical files
      for (const screenshot of screenshots) {
        try {
          const fullPath = path.resolve(screenshot.filePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`Deleted file: ${fullPath}`);
          }
        } catch (fileError) {
          console.error('Error deleting file:', fileError);
          // Continue with other files
        }
      }

      return result.rows.length;
    } catch (error) {
      console.error('Error deleting screenshots by bug ID:', error);
      throw error;
    }
  }
}

module.exports = Screenshot;