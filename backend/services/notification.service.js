const Notification = require('../models/Notification.model');

/**
 * Notification Service
 * Handles business logic for notification management
 * Requirements: 17.1, 17.2, 17.6, 17.7
 */
class NotificationService {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.type - Notification type
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {Object} [notificationData.metadata] - Additional metadata
   * @returns {Promise<Object>} Created notification object
   * @throws {Error} Validation error if data is invalid
   */
  static async createNotification(notificationData) {
    try {
      // Validate notification data
      const validation = Notification.validate(notificationData);
      if (!validation.isValid) {
        const error = new Error('Ошибка валидации данных уведомления');
        error.code = 'VALIDATION_ERROR';
        error.details = validation.errors;
        throw error;
      }

      // Create notification
      const notification = await Notification.create(notificationData);
      
      console.log(`Создано уведомление: ${notification.type} - ${notification.title}`);
      
      return notification;
    } catch (error) {
      console.error('Ошибка создания уведомления:', error);
      throw error;
    }
  }

  /**
   * Create notification for new tester registration
   * Requirement 17.1: Automatically create notification when new tester registers
   * @param {Object} tester - Tester object
   * @returns {Promise<Object>} Created notification object
   */
  static async createNewTesterNotification(tester) {
    const notificationData = {
      type: 'new_tester',
      title: 'Новый тестер зарегистрирован',
      message: `Тестер ${tester.name} (${tester.email}) зарегистрировался в системе`,
      metadata: {
        testerId: tester.id,
        testerName: tester.name,
        testerEmail: tester.email,
        deviceType: tester.deviceType,
        os: tester.os,
        registrationDate: tester.registrationDate
      }
    };

    return await this.createNotification(notificationData);
  }

  /**
   * Create notification for critical bug
   * Requirement 17.2: Automatically create notification when critical bug is created
   * @param {Object} bug - Bug object
   * @param {string} testerName - Name of tester who found the bug
   * @returns {Promise<Object>} Created notification object
   */
  static async createCriticalBugNotification(bug, testerName) {
    const notificationData = {
      type: 'critical_bug',
      title: 'Обнаружен критический баг',
      message: `Тестер ${testerName} обнаружил критический баг: "${bug.title}"`,
      metadata: {
        bugId: bug.id,
        bugTitle: bug.title,
        bugDescription: bug.description,
        testerId: bug.testerId,
        testerName: testerName,
        priority: bug.priority,
        type: bug.type,
        createdAt: bug.createdAt
      }
    };

    return await this.createNotification(notificationData);
  }

  /**
   * Create notification for server down
   * @param {Object} server - Server object
   * @returns {Promise<Object>} Created notification object
   */
  static async createServerDownNotification(server) {
    const notificationData = {
      type: 'server_down',
      title: 'Сервер недоступен',
      message: `Сервер "${server.name}" перешел в статус "offline"`,
      metadata: {
        serverId: server.id,
        serverName: server.name,
        previousStatus: server.previousStatus,
        currentStatus: server.status,
        lastCheck: server.lastCheck
      }
    };

    return await this.createNotification(notificationData);
  }

  /**
   * Create general info notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} [metadata] - Additional metadata
   * @returns {Promise<Object>} Created notification object
   */
  static async createInfoNotification(title, message, metadata = null) {
    const notificationData = {
      type: 'info',
      title,
      message,
      metadata
    };

    return await this.createNotification(notificationData);
  }

  /**
   * Get all notifications with optional filtering
   * @param {Object} options - Query options
   * @param {boolean} [options.unreadOnly] - Filter only unread notifications
   * @param {number} [options.limit] - Limit number of results
   * @param {number} [options.offset] - Offset for pagination
   * @returns {Promise<Object>} Object with notifications array and counts
   */
  static async getNotifications(options = {}) {
    try {
      return await Notification.findAll(options);
    } catch (error) {
      console.error('Ошибка получения уведомлений:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications only
   * @param {number} [limit] - Limit number of results
   * @returns {Promise<Object>} Object with unread notifications
   */
  static async getUnreadNotifications(limit = 50) {
    return await this.getNotifications({ unreadOnly: true, limit });
  }

  /**
   * Mark notification as read
   * @param {number} id - Notification ID
   * @returns {Promise<Object|null>} Updated notification or null if not found
   * @throws {Error} If notification not found
   */
  static async markAsRead(id) {
    try {
      const notification = await Notification.markAsRead(id);
      
      if (!notification) {
        const error = new Error('Уведомление не найдено');
        error.code = 'NOT_FOUND';
        throw error;
      }

      console.log(`Уведомление ${id} отмечено как прочитанное`);
      return notification;
    } catch (error) {
      console.error(`Ошибка отметки уведомления ${id} как прочитанного:`, error);
      throw error;
    }
  }

  /**
   * Delete notification
   * @param {number} id - Notification ID
   * @returns {Promise<boolean>} True if deleted successfully
   * @throws {Error} If notification not found
   */
  static async deleteNotification(id) {
    try {
      const deleted = await Notification.delete(id);
      
      if (!deleted) {
        const error = new Error('Уведомление не найдено');
        error.code = 'NOT_FOUND';
        throw error;
      }

      console.log(`Уведомление ${id} удалено`);
      return true;
    } catch (error) {
      console.error(`Ошибка удаления уведомления ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get notification by ID
   * @param {number} id - Notification ID
   * @returns {Promise<Object|null>} Notification object or null if not found
   */
  static async getNotificationById(id) {
    try {
      return await Notification.findById(id);
    } catch (error) {
      console.error(`Ошибка получения уведомления ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get count of unread notifications
   * @returns {Promise<number>} Count of unread notifications
   */
  static async getUnreadCount() {
    try {
      return await Notification.getUnreadCount();
    } catch (error) {
      console.error('Ошибка получения количества непрочитанных уведомлений:', error);
      throw error;
    }
  }

  /**
   * Clean up old notifications
   * @param {number} [days=30] - Number of days to keep notifications
   * @returns {Promise<number>} Number of deleted notifications
   */
  static async cleanupOldNotifications(days = 30) {
    try {
      const deletedCount = await Notification.deleteOld(days);
      console.log(`Удалено ${deletedCount} старых уведомлений (старше ${days} дней)`);
      return deletedCount;
    } catch (error) {
      console.error('Ошибка очистки старых уведомлений:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;