const pool = require('../config/database');

/**
 * Notification Model
 * Handles database operations for notifications
 * Requirements: 17.1, 17.2, 17.6, 17.7
 */
class Notification {
  /**
   * Validate notification data
   * @param {Object} notificationData - Notification data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validate(notificationData) {
    const errors = [];
    const { type, title, message } = notificationData;

    // Check required fields
    if (!type || type.trim() === '') {
      errors.push({ field: 'type', message: 'Тип уведомления обязателен' });
    }
    if (!title || title.trim() === '') {
      errors.push({ field: 'title', message: 'Заголовок уведомления обязателен' });
    }
    if (!message || message.trim() === '') {
      errors.push({ field: 'message', message: 'Сообщение уведомления обязательно' });
    }

    // Validate type enum
    const validTypes = ['new_tester', 'critical_bug', 'server_down', 'info'];
    if (type && !validTypes.includes(type)) {
      errors.push({ 
        field: 'type', 
        message: `Недопустимый тип уведомления. Допустимые: ${validTypes.join(', ')}` 
      });
    }

    // Validate field lengths
    if (title && title.length > 255) {
      errors.push({ field: 'title', message: 'Заголовок не может быть длиннее 255 символов' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create new notification
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.type - Notification type (new_tester, critical_bug, server_down, info)
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {Object} [notificationData.metadata] - Additional metadata
   * @returns {Promise<Object>} Created notification object
   */
  static async create(notificationData) {
    const { type, title, message, metadata = null } = notificationData;
    
    const query = `
      INSERT INTO notifications (type, title, message, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING id, type, title, message, is_read, created_at, metadata
    `;
    
    const values = [type, title, message, metadata ? JSON.stringify(metadata) : null];
    const result = await pool.query(query, values);
    
    const notification = result.rows[0];
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.is_read,
      createdAt: notification.created_at,
      metadata: notification.metadata ? JSON.parse(notification.metadata) : null
    };
  }

  /**
   * Get all notifications with optional filtering
   * @param {Object} options - Query options
   * @param {boolean} [options.unreadOnly] - Filter only unread notifications
   * @param {number} [options.limit] - Limit number of results
   * @param {number} [options.offset] - Offset for pagination
   * @returns {Promise<Object>} Object with notifications array and total count
   */
  static async findAll(options = {}) {
    const { unreadOnly = false, limit = 50, offset = 0 } = options;
    
    let whereClause = '';
    let values = [];
    let paramIndex = 1;
    
    if (unreadOnly) {
      whereClause = 'WHERE is_read = FALSE';
    }
    
    const query = `
      SELECT id, type, title, message, is_read, created_at, metadata
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].total);
    
    const notifications = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      isRead: row.is_read,
      createdAt: row.created_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
    
    return {
      notifications,
      total,
      unreadCount: unreadOnly ? total : await this.getUnreadCount()
    };
  }

  /**
   * Get notification by ID
   * @param {number} id - Notification ID
   * @returns {Promise<Object|null>} Notification object or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT id, type, title, message, is_read, created_at, metadata
      FROM notifications
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      isRead: row.is_read,
      createdAt: row.created_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    };
  }

  /**
   * Mark notification as read
   * @param {number} id - Notification ID
   * @returns {Promise<Object|null>} Updated notification object or null if not found
   */
  static async markAsRead(id) {
    const query = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
      RETURNING id, type, title, message, is_read, created_at, metadata
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      isRead: row.is_read,
      createdAt: row.created_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    };
  }

  /**
   * Delete notification by ID
   * @param {number} id - Notification ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    const query = 'DELETE FROM notifications WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Get count of unread notifications
   * @returns {Promise<number>} Count of unread notifications
   */
  static async getUnreadCount() {
    const query = 'SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }

  /**
   * Delete old notifications (older than specified days)
   * @param {number} days - Number of days to keep notifications
   * @returns {Promise<number>} Number of deleted notifications
   */
  static async deleteOld(days = 30) {
    const query = `
      DELETE FROM notifications
      WHERE created_at < NOW() - INTERVAL '${days} days'
    `;
    const result = await pool.query(query);
    return result.rowCount;
  }
}

module.exports = Notification;