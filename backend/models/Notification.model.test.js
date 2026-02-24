const Notification = require('./Notification.model');
const pool = require('../config/database');

describe('Notification Model', () => {
  beforeAll(async () => {
    // Clean up notifications table before tests
    await pool.query('DELETE FROM notifications');
  });

  afterAll(async () => {
    // Clean up after tests
    await pool.query('DELETE FROM notifications');
  });

  describe('validate', () => {
    test('should validate required fields', () => {
      const result = Notification.validate({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors.map(e => e.field)).toContain('type');
      expect(result.errors.map(e => e.field)).toContain('title');
      expect(result.errors.map(e => e.field)).toContain('message');
    });

    test('should validate type enum', () => {
      const result = Notification.validate({
        type: 'invalid_type',
        title: 'Test',
        message: 'Test message'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('type');
    });

    test('should validate title length', () => {
      const longTitle = 'a'.repeat(256);
      const result = Notification.validate({
        type: 'info',
        title: longTitle,
        message: 'Test message'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('title');
    });

    test('should pass validation with valid data', () => {
      const result = Notification.validate({
        type: 'new_tester',
        title: 'Test Notification',
        message: 'Test message'
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('create', () => {
    test('should create notification with valid data', async () => {
      const notificationData = {
        type: 'new_tester',
        title: 'Test Notification',
        message: 'Test message',
        metadata: { testerId: 1 }
      };

      const notification = await Notification.create(notificationData);

      expect(notification).toHaveProperty('id');
      expect(notification.type).toBe('new_tester');
      expect(notification.title).toBe('Test Notification');
      expect(notification.message).toBe('Test message');
      expect(notification.isRead).toBe(false);
      expect(notification.metadata).toEqual({ testerId: 1 });
      expect(notification.createdAt).toBeInstanceOf(Date);
    });

    test('should create notification without metadata', async () => {
      const notificationData = {
        type: 'info',
        title: 'Simple Notification',
        message: 'Simple message'
      };

      const notification = await Notification.create(notificationData);

      expect(notification).toHaveProperty('id');
      expect(notification.metadata).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Clean up and create test data
      await pool.query('DELETE FROM notifications');
      
      // Create test notifications
      await Notification.create({
        type: 'new_tester',
        title: 'Unread Notification 1',
        message: 'Message 1'
      });
      
      await Notification.create({
        type: 'critical_bug',
        title: 'Unread Notification 2',
        message: 'Message 2'
      });
      
      // Create read notification
      const readNotification = await Notification.create({
        type: 'info',
        title: 'Read Notification',
        message: 'Message 3'
      });
      
      await Notification.markAsRead(readNotification.id);
    });

    test('should return all notifications', async () => {
      const result = await Notification.findAll();
      
      expect(result.notifications).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.unreadCount).toBe(2);
    });

    test('should filter unread notifications only', async () => {
      const result = await Notification.findAll({ unreadOnly: true });
      
      expect(result.notifications).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.notifications.every(n => !n.isRead)).toBe(true);
    });

    test('should respect limit and offset', async () => {
      const result = await Notification.findAll({ limit: 1, offset: 1 });
      
      expect(result.notifications).toHaveLength(1);
      expect(result.total).toBe(3);
    });
  });

  describe('markAsRead', () => {
    test('should mark notification as read', async () => {
      const notification = await Notification.create({
        type: 'info',
        title: 'Test',
        message: 'Test message'
      });

      const updated = await Notification.markAsRead(notification.id);
      
      expect(updated.isRead).toBe(true);
      expect(updated.id).toBe(notification.id);
    });

    test('should return null for non-existent notification', async () => {
      const result = await Notification.markAsRead(99999);
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    test('should delete existing notification', async () => {
      const notification = await Notification.create({
        type: 'info',
        title: 'Test',
        message: 'Test message'
      });

      const deleted = await Notification.delete(notification.id);
      expect(deleted).toBe(true);

      const found = await Notification.findById(notification.id);
      expect(found).toBeNull();
    });

    test('should return false for non-existent notification', async () => {
      const deleted = await Notification.delete(99999);
      expect(deleted).toBe(false);
    });
  });

  describe('getUnreadCount', () => {
    test('should return correct unread count', async () => {
      await pool.query('DELETE FROM notifications');
      
      // Create unread notifications
      await Notification.create({
        type: 'new_tester',
        title: 'Unread 1',
        message: 'Message 1'
      });
      
      await Notification.create({
        type: 'critical_bug',
        title: 'Unread 2',
        message: 'Message 2'
      });
      
      // Create read notification
      const readNotification = await Notification.create({
        type: 'info',
        title: 'Read',
        message: 'Message 3'
      });
      await Notification.markAsRead(readNotification.id);

      const count = await Notification.getUnreadCount();
      expect(count).toBe(2);
    });
  });
});