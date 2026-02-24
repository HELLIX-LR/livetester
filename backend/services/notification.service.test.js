const NotificationService = require('./notification.service');
const pool = require('../config/database');

describe('NotificationService', () => {
  beforeAll(async () => {
    // Clean up notifications table before tests
    await pool.query('DELETE FROM notifications');
  });

  afterEach(async () => {
    // Clean up after each test
    await pool.query('DELETE FROM notifications');
  });

  afterAll(async () => {
    // Clean up after all tests
    await pool.query('DELETE FROM notifications');
  });

  describe('createNotification', () => {
    test('should create notification with valid data', async () => {
      const notificationData = {
        type: 'info',
        title: 'Test Notification',
        message: 'Test message',
        metadata: { key: 'value' }
      };

      const notification = await NotificationService.createNotification(notificationData);

      expect(notification).toHaveProperty('id');
      expect(notification.type).toBe('info');
      expect(notification.title).toBe('Test Notification');
      expect(notification.message).toBe('Test message');
      expect(notification.isRead).toBe(false);
      expect(notification.metadata).toEqual({ key: 'value' });
    });

    test('should throw validation error for invalid data', async () => {
      const invalidData = {
        type: 'invalid_type',
        title: '',
        message: ''
      };

      await expect(NotificationService.createNotification(invalidData))
        .rejects.toThrow('Ошибка валидации данных уведомления');
    });
  });

  describe('createNewTesterNotification', () => {
    test('should create new tester notification', async () => {
      const tester = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        deviceType: 'smartphone',
        os: 'Android',
        registrationDate: new Date()
      };

      const notification = await NotificationService.createNewTesterNotification(tester);

      expect(notification.type).toBe('new_tester');
      expect(notification.title).toBe('Новый тестер зарегистрирован');
      expect(notification.message).toContain('John Doe');
      expect(notification.message).toContain('john@example.com');
      expect(notification.metadata.testerId).toBe(1);
      expect(notification.metadata.testerName).toBe('John Doe');
    });
  });

  describe('createCriticalBugNotification', () => {
    test('should create critical bug notification', async () => {
      const bug = {
        id: 1,
        title: 'Critical Bug',
        description: 'This is a critical bug',
        testerId: 1,
        priority: 'critical',
        type: 'crash',
        createdAt: new Date()
      };

      const testerName = 'John Doe';

      const notification = await NotificationService.createCriticalBugNotification(bug, testerName);

      expect(notification.type).toBe('critical_bug');
      expect(notification.title).toBe('Обнаружен критический баг');
      expect(notification.message).toContain('John Doe');
      expect(notification.message).toContain('Critical Bug');
      expect(notification.metadata.bugId).toBe(1);
      expect(notification.metadata.testerName).toBe('John Doe');
      expect(notification.metadata.priority).toBe('critical');
    });
  });

  describe('createServerDownNotification', () => {
    test('should create server down notification', async () => {
      const server = {
        id: 1,
        name: 'Main Server',
        previousStatus: 'online',
        status: 'offline',
        lastCheck: new Date()
      };

      const notification = await NotificationService.createServerDownNotification(server);

      expect(notification.type).toBe('server_down');
      expect(notification.title).toBe('Сервер недоступен');
      expect(notification.message).toContain('Main Server');
      expect(notification.metadata.serverId).toBe(1);
      expect(notification.metadata.serverName).toBe('Main Server');
      expect(notification.metadata.currentStatus).toBe('offline');
    });
  });

  describe('getNotifications', () => {
    beforeEach(async () => {
      // Create test notifications
      await NotificationService.createNotification({
        type: 'new_tester',
        title: 'Notification 1',
        message: 'Message 1'
      });

      await NotificationService.createNotification({
        type: 'critical_bug',
        title: 'Notification 2',
        message: 'Message 2'
      });

      // Create and mark one as read
      const notification = await NotificationService.createNotification({
        type: 'info',
        title: 'Notification 3',
        message: 'Message 3'
      });
      await NotificationService.markAsRead(notification.id);
    });

    test('should return all notifications', async () => {
      const result = await NotificationService.getNotifications();

      expect(result.notifications).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.unreadCount).toBe(2);
    });

    test('should return only unread notifications', async () => {
      const result = await NotificationService.getNotifications({ unreadOnly: true });

      expect(result.notifications).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.notifications.every(n => !n.isRead)).toBe(true);
    });
  });

  describe('markAsRead', () => {
    test('should mark notification as read', async () => {
      const notification = await NotificationService.createNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message'
      });

      const updated = await NotificationService.markAsRead(notification.id);

      expect(updated.isRead).toBe(true);
      expect(updated.id).toBe(notification.id);
    });

    test('should throw error for non-existent notification', async () => {
      await expect(NotificationService.markAsRead(99999))
        .rejects.toThrow('Уведомление не найдено');
    });
  });

  describe('deleteNotification', () => {
    test('should delete existing notification', async () => {
      const notification = await NotificationService.createNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message'
      });

      const result = await NotificationService.deleteNotification(notification.id);
      expect(result).toBe(true);

      const found = await NotificationService.getNotificationById(notification.id);
      expect(found).toBeNull();
    });

    test('should throw error for non-existent notification', async () => {
      await expect(NotificationService.deleteNotification(99999))
        .rejects.toThrow('Уведомление не найдено');
    });
  });

  describe('getUnreadCount', () => {
    test('should return correct unread count', async () => {
      // Create unread notifications
      await NotificationService.createNotification({
        type: 'new_tester',
        title: 'Unread 1',
        message: 'Message 1'
      });

      await NotificationService.createNotification({
        type: 'critical_bug',
        title: 'Unread 2',
        message: 'Message 2'
      });

      // Create and mark one as read
      const readNotification = await NotificationService.createNotification({
        type: 'info',
        title: 'Read',
        message: 'Message 3'
      });
      await NotificationService.markAsRead(readNotification.id);

      const count = await NotificationService.getUnreadCount();
      expect(count).toBe(2);
    });
  });
});