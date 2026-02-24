const Comment = require('../models/Comment.model');
const pool = require('../config/database');

/**
 * Comment Service
 * Handles business logic for comment management
 * Requirements: 19.1, 19.3, 19.4, 19.5, 19.7
 */
class CommentService {
  /**
   * Create a new comment
   * Validates input data and creates comment record
   * Also updates the parent bug's updated_at timestamp
   * @param {Object} commentData - Comment data
   * @param {number} commentData.bugId - Bug ID (required)
   * @param {number} commentData.authorId - Author ID (required)
   * @param {string} commentData.authorName - Author name (required)
   * @param {string} commentData.content - Comment content (required)
   * @returns {Promise<Object>} Created comment object or error
   */
  static async createComment(commentData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validate required fields (Requirements 19.1)
      const validation = Comment.validate(commentData);
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

      // Create comment
      const comment = await Comment.create(commentData);

      // Update parent bug's updated_at timestamp (Requirements 19.7)
      await client.query(
        'UPDATE bugs SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [commentData.bugId]
      );

      await client.query('COMMIT');

      return {
        success: true,
        data: comment
      };
    } catch (error) {
      await client.query('ROLLBACK');

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

      console.error('Error in createComment:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get comment by ID
   * @param {number} id - Comment ID
   * @returns {Promise<Object>} Comment object or error
   */
  static async getCommentById(id) {
    try {
      const comment = await Comment.findById(id);
      
      if (!comment) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Комментарий не найден',
            resource: 'comment',
            id
          }
        };
      }

      return {
        success: true,
        data: comment
      };
    } catch (error) {
      console.error('Error in getCommentById:', error);
      throw error;
    }
  }

  /**
   * Get all comments for a bug
   * Returns comments sorted by created_at in chronological order
   * @param {number} bugId - Bug ID
   * @returns {Promise<Object>} Comments array or error
   */
  static async getCommentsByBugId(bugId) {
    try {
      // First check if bug exists
      const bugCheck = await pool.query('SELECT id FROM bugs WHERE id = $1', [bugId]);
      if (bugCheck.rows.length === 0) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Баг не найден',
            resource: 'bug',
            id: bugId
          }
        };
      }

      const comments = await Comment.findByBugId(bugId);
      
      return {
        success: true,
        data: comments,
        count: comments.length
      };
    } catch (error) {
      console.error('Error in getCommentsByBugId:', error);
      throw error;
    }
  }

  /**
   * Update comment content (only within 15 minutes of creation)
   * @param {number} id - Comment ID
   * @param {string} content - New content
   * @param {number} authorId - Author ID (for authorization)
   * @returns {Promise<Object>} Updated comment object or error
   */
  static async updateComment(id, content, authorId) {
    try {
      // Validate content
      if (!content || content.trim() === '') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Ошибка валидации',
            details: [{ field: 'content', message: 'Содержание комментария обязательно' }]
          }
        };
      }

      if (content.length > 5000) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Ошибка валидации',
            details: [{ field: 'content', message: 'Комментарий не может быть длиннее 5000 символов' }]
          }
        };
      }

      const comment = await Comment.update(id, content, authorId);
      
      return {
        success: true,
        data: comment
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Комментарий не найден',
            resource: 'comment',
            id
          }
        };
      }

      if (error.code === 'UNAUTHORIZED') {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Нет прав для редактирования этого комментария'
          }
        };
      }

      if (error.code === 'EDIT_WINDOW_EXPIRED') {
        return {
          success: false,
          error: {
            code: 'EDIT_WINDOW_EXPIRED',
            message: 'Комментарий можно редактировать только в течение 15 минут после создания'
          }
        };
      }

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

      console.error('Error in updateComment:', error);
      throw error;
    }
  }

  /**
   * Delete comment
   * @param {number} id - Comment ID
   * @param {number} authorId - Author ID (for authorization)
   * @returns {Promise<Object>} Success status or error
   */
  static async deleteComment(id, authorId) {
    try {
      const success = await Comment.delete(id, authorId);
      
      if (!success) {
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Не удалось удалить комментарий'
          }
        };
      }

      return {
        success: true,
        message: 'Комментарий успешно удален'
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Комментарий не найден',
            resource: 'comment',
            id
          }
        };
      }

      if (error.code === 'UNAUTHORIZED') {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Нет прав для удаления этого комментария'
          }
        };
      }

      console.error('Error in deleteComment:', error);
      throw error;
    }
  }

  /**
   * Check if comment can be edited
   * @param {number} id - Comment ID
   * @returns {Promise<Object>} Edit status
   */
  static async canEditComment(id) {
    try {
      const canEdit = await Comment.canEdit(id);
      
      return {
        success: true,
        data: {
          canEdit,
          timeLimit: '15 minutes'
        }
      };
    } catch (error) {
      console.error('Error in canEditComment:', error);
      throw error;
    }
  }

  /**
   * Get comment count for a bug
   * @param {number} bugId - Bug ID
   * @returns {Promise<Object>} Comment count
   */
  static async getCommentCount(bugId) {
    try {
      const count = await Comment.getCountByBugId(bugId);
      
      return {
        success: true,
        data: {
          bugId,
          count
        }
      };
    } catch (error) {
      console.error('Error in getCommentCount:', error);
      throw error;
    }
  }

  /**
   * Validate comment data for creation/update
   * @param {Object} commentData - Comment data to validate
   * @returns {Object} Validation result
   */
  static validateCommentData(commentData) {
    return Comment.validate(commentData);
  }
}

module.exports = CommentService;