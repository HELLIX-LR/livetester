const pool = require('../config/database');

/**
 * Comment Model
 * Handles database operations for bug comments
 * Requirements: 19.1, 19.4, 19.5
 */
class Comment {
  /**
   * Validate comment data
   * @param {Object} commentData - Comment data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validate(commentData) {
    const errors = [];
    const { content, authorId, authorName } = commentData;

    // Check required fields (Requirements 19.1)
    if (!content || content.trim() === '') {
      errors.push({ field: 'content', message: 'Содержание комментария обязательно' });
    }
    if (!authorId) {
      errors.push({ field: 'authorId', message: 'ID автора обязательно' });
    }
    if (!authorName || authorName.trim() === '') {
      errors.push({ field: 'authorName', message: 'Имя автора обязательно' });
    }

    // Validate content length
    if (content && content.length > 5000) {
      errors.push({ field: 'content', message: 'Комментарий не может быть длиннее 5000 символов' });
    }

    // Validate authorId is a number
    if (authorId && isNaN(parseInt(authorId))) {
      errors.push({ field: 'authorId', message: 'ID автора должен быть числом' });
    }

    // Validate authorName length
    if (authorName && authorName.length > 255) {
      errors.push({ field: 'authorName', message: 'Имя автора не может быть длиннее 255 символов' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create new comment
   * @param {Object} commentData - Comment data
   * @param {number} commentData.bugId - Bug ID (required)
   * @param {number} commentData.authorId - Author ID (required)
   * @param {string} commentData.authorName - Author name (required)
   * @param {string} commentData.content - Comment content (required)
   * @returns {Promise<Object>} Created comment object
   */
  static async create(commentData) {
    try {
      // Validate input data
      const validation = this.validate(commentData);
      if (!validation.isValid) {
        const error = new Error('Validation failed');
        error.code = 'VALIDATION_ERROR';
        error.details = validation.errors;
        throw error;
      }

      const { bugId, authorId, authorName, content } = commentData;

      // Check if bug exists
      const bugCheck = await pool.query('SELECT id FROM bugs WHERE id = $1', [bugId]);
      if (bugCheck.rows.length === 0) {
        const error = new Error('Bug not found');
        error.code = 'NOT_FOUND';
        error.field = 'bugId';
        throw error;
      }

      // Create comment (Requirement 19.1)
      const query = `
        INSERT INTO comments (
          bug_id, author_id, author_name, content
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id, bug_id as "bugId", author_id as "authorId", author_name as "authorName", 
                  content, created_at as "createdAt", updated_at as "updatedAt", is_edited as "isEdited"
      `;

      const result = await pool.query(query, [
        bugId,
        authorId,
        authorName,
        content
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Find comment by ID
   * @param {number} id - Comment ID
   * @returns {Promise<Object|null>} Comment object or null if not found
   */
  static async findById(id) {
    try {
      const query = `
        SELECT id, bug_id as "bugId", author_id as "authorId", author_name as "authorName",
               content, created_at as "createdAt", updated_at as "updatedAt", is_edited as "isEdited"
        FROM comments
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding comment by ID:', error);
      throw error;
    }
  }

  /**
   * Get comments by bug ID
   * @param {number} bugId - Bug ID
   * @returns {Promise<Array>} Array of comments sorted by created_at
   */
  static async findByBugId(bugId) {
    try {
      const query = `
        SELECT id, bug_id as "bugId", author_id as "authorId", author_name as "authorName",
               content, created_at as "createdAt", updated_at as "updatedAt", is_edited as "isEdited"
        FROM comments
        WHERE bug_id = $1
        ORDER BY created_at ASC
      `;
      const result = await pool.query(query, [bugId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding comments by bug ID:', error);
      throw error;
    }
  }

  /**
   * Update comment (only within 15 minutes of creation)
   * @param {number} id - Comment ID
   * @param {string} content - New content
   * @param {number} authorId - Author ID (for authorization check)
   * @returns {Promise<Object>} Updated comment object
   */
  static async update(id, content, authorId) {
    try {
      // First, get the comment to check if it exists and can be edited
      const comment = await this.findById(id);
      if (!comment) {
        const error = new Error('Comment not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Check if the author is the same (Requirements 19.4)
      if (comment.authorId !== authorId) {
        const error = new Error('Unauthorized to edit this comment');
        error.code = 'UNAUTHORIZED';
        throw error;
      }

      // Check if comment is within 15-minute edit window (Requirements 19.4)
      const now = new Date();
      const createdAt = new Date(comment.createdAt);
      const timeDiff = (now - createdAt) / (1000 * 60); // difference in minutes

      if (timeDiff > 15) {
        const error = new Error('Comment can only be edited within 15 minutes of creation');
        error.code = 'EDIT_WINDOW_EXPIRED';
        throw error;
      }

      // Validate new content
      if (!content || content.trim() === '') {
        const error = new Error('Content cannot be empty');
        error.code = 'VALIDATION_ERROR';
        error.details = [{ field: 'content', message: 'Содержание комментария обязательно' }];
        throw error;
      }

      if (content.length > 5000) {
        const error = new Error('Content too long');
        error.code = 'VALIDATION_ERROR';
        error.details = [{ field: 'content', message: 'Комментарий не может быть длиннее 5000 символов' }];
        throw error;
      }

      // Update comment (Requirements 19.4, 19.5)
      const query = `
        UPDATE comments
        SET content = $1, updated_at = CURRENT_TIMESTAMP, is_edited = TRUE
        WHERE id = $2
        RETURNING id, bug_id as "bugId", author_id as "authorId", author_name as "authorName",
                  content, created_at as "createdAt", updated_at as "updatedAt", is_edited as "isEdited"
      `;

      const result = await pool.query(query, [content, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete comment
   * @param {number} id - Comment ID
   * @param {number} authorId - Author ID (for authorization check)
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id, authorId) {
    try {
      // First, get the comment to check if it exists and can be deleted
      const comment = await this.findById(id);
      if (!comment) {
        const error = new Error('Comment not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Check if the author is the same (Requirements 19.5)
      if (comment.authorId !== authorId) {
        const error = new Error('Unauthorized to delete this comment');
        error.code = 'UNAUTHORIZED';
        throw error;
      }

      // Delete comment
      const query = 'DELETE FROM comments WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Check if comment can be edited (within 15 minutes)
   * @param {number} id - Comment ID
   * @returns {Promise<boolean>} Whether comment can be edited
   */
  static async canEdit(id) {
    try {
      const comment = await this.findById(id);
      if (!comment) {
        return false;
      }

      const now = new Date();
      const createdAt = new Date(comment.createdAt);
      const timeDiff = (now - createdAt) / (1000 * 60); // difference in minutes

      return timeDiff <= 15;
    } catch (error) {
      console.error('Error checking if comment can be edited:', error);
      return false;
    }
  }

  /**
   * Get comment count for a bug
   * @param {number} bugId - Bug ID
   * @returns {Promise<number>} Number of comments
   */
  static async getCountByBugId(bugId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM comments WHERE bug_id = $1';
      const result = await pool.query(query, [bugId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting comment count:', error);
      throw error;
    }
  }
}

module.exports = Comment;