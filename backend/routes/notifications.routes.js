const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notification.service');

/**
 * GET /api/notifications
 * Get all notifications with optional filtering
 * 
 * Query parameters:
 * - unreadOnly: boolean - Filter only unread notifications
 * - limit: number - Limit number of results (default: 50)
 * - offset: number - Offset for pagination (default: 0)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "notifications": [...],
 *     "total": 100,
 *     "unreadCount": 15
 *   }
 * }
 * 
 * Requirements: 17.6
 */
router.get('/', async (req, res) => {
  try {
    const { unreadOnly, limit, offset } = req.query;
    
    const options = {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    };

    // Validate limit and offset
    if (options.limit < 1 || options.limit > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Лимит должен быть от 1 до 100'
        }
      });
    }

    if (options.offset < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Смещение не может быть отрицательным'
        }
      });
    }

    const result = await NotificationService.getNotifications(options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка получения уведомлений'
      }
    });
  }
});

/**
 * GET /api/notifications/unread
 * Get only unread notifications
 * 
 * Query parameters:
 * - limit: number - Limit number of results (default: 50)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "notifications": [...],
 *     "total": 15,
 *     "unreadCount": 15
 *   }
 * }
 * 
 * Requirements: 17.7
 */
router.get('/unread', async (req, res) => {
  try {
    const { limit } = req.query;
    const limitValue = limit ? parseInt(limit) : 50;

    // Validate limit
    if (limitValue < 1 || limitValue > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Лимит должен быть от 1 до 100'
        }
      });
    }

    const result = await NotificationService.getUnreadNotifications(limitValue);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in GET /api/notifications/unread:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка получения непрочитанных уведомлений'
      }
    });
  }
});

/**
 * GET /api/notifications/:id
 * Get notification by ID
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "type": "new_tester",
 *     "title": "Новый тестер зарегистрирован",
 *     "message": "...",
 *     "isRead": false,
 *     "createdAt": "2024-01-15T10:30:00.000Z",
 *     "metadata": {...}
 *   }
 * }
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notificationId = parseInt(id);

    // Validate ID
    if (isNaN(notificationId) || notificationId < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Недопустимый ID уведомления'
        }
      });
    }

    const notification = await NotificationService.getNotificationById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Уведомление не найдено'
        }
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error(`Error in GET /api/notifications/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка получения уведомления'
      }
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "type": "new_tester",
 *     "title": "Новый тестер зарегистрирован",
 *     "message": "...",
 *     "isRead": true,
 *     "createdAt": "2024-01-15T10:30:00.000Z",
 *     "metadata": {...}
 *   }
 * }
 * 
 * Requirements: 17.6
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const notificationId = parseInt(id);

    // Validate ID
    if (isNaN(notificationId) || notificationId < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Недопустимый ID уведомления'
        }
      });
    }

    const notification = await NotificationService.markAsRead(notificationId);

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Уведомление не найдено'
        }
      });
    }

    console.error(`Error in PATCH /api/notifications/${req.params.id}/read:`, error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка отметки уведомления как прочитанного'
      }
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete notification
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Уведомление удалено"
 * }
 * 
 * Requirements: 17.7
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notificationId = parseInt(id);

    // Validate ID
    if (isNaN(notificationId) || notificationId < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Недопустимый ID уведомления'
        }
      });
    }

    await NotificationService.deleteNotification(notificationId);

    res.json({
      success: true,
      message: 'Уведомление удалено'
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Уведомление не найдено'
        }
      });
    }

    console.error(`Error in DELETE /api/notifications/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка удаления уведомления'
      }
    });
  }
});

/**
 * GET /api/notifications/count/unread
 * Get count of unread notifications
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "unreadCount": 15
 *   }
 * }
 */
router.get('/count/unread', async (req, res) => {
  try {
    const unreadCount = await NotificationService.getUnreadCount();

    res.json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error in GET /api/notifications/count/unread:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка получения количества непрочитанных уведомлений'
      }
    });
  }
});

module.exports = router;