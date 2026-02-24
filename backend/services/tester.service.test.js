const TesterService = require('./tester.service');
const pool = require('../config/database');

describe('TesterService', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await pool.query('DELETE FROM testers WHERE email LIKE $1', ['test%@example.com']);
  });

  describe('registerTester', () => {
    test('should successfully register tester with valid data', async () => {
      const testerData = {
        name: 'John Doe',
        email: 'test1@example.com',
        deviceType: 'smartphone',
        os: 'Android',
        osVersion: '13.0'
      };

      const result = await TesterService.registerTester(testerData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe('John Doe');
      expect(result.data.email).toBe('test1@example.com');
      expect(result.data.status).toBe('active');
      expect(result.data.bugsCount).toBe(0);
      expect(result.data.rating).toBe(0);
    });

    test('should return validation error for missing name', async () => {
      const testerData = {
        email: 'test2@example.com',
        deviceType: 'smartphone',
        os: 'Android'
      };

      const result = await TesterService.registerTester(testerData);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.details).toContainEqual({
        field: 'name',
        message: 'Name is required'
      });
    });

    test('should return validation error for missing email', async () => {
      const testerData = {
        name: 'John Doe',
        deviceType: 'smartphone',
        os: 'Android'
      };

      const result = await TesterService.registerTester(testerData);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.details).toContainEqual({
        field: 'email',
        message: 'Email is required'
      });
    });

    test('should return validation error for missing deviceType', async () => {
      const testerData = {
        name: 'John Doe',
        email: 'test3@example.com',
        os: 'Android'
      };

      const result = await TesterService.registerTester(testerData);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.details).toContainEqual({
        field: 'deviceType',
        message: 'Device type is required'
      });
    });

    test('should return validation error for missing os', async () => {
      const testerData = {
        name: 'John Doe',
        email: 'test4@example.com',
        deviceType: 'smartphone'
      };

      const result = await TesterService.registerTester(testerData);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.details).toContainEqual({
        field: 'os',
        message: 'Operating system is required'
      });
    });

    test('should return validation error for invalid email format', async () => {
      const testerData = {
        name: 'John Doe',
        email: 'invalid-email',
        deviceType: 'smartphone',
        os: 'Android'
      };

      const result = await TesterService.registerTester(testerData);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.details).toContainEqual({
        field: 'email',
        message: 'Invalid email format'
      });
    });

    test('should return conflict error for duplicate email', async () => {
      const testerData = {
        name: 'John Doe',
        email: 'test5@example.com',
        deviceType: 'smartphone',
        os: 'Android'
      };

      await TesterService.registerTester(testerData);
      const result = await TesterService.registerTester(testerData);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CONFLICT');
      expect(result.error.message).toBe('Email already registered');
    });

    test('should register tester with optional fields', async () => {
      const testerData = {
        name: 'Jane Smith',
        email: 'test6@example.com',
        deviceType: 'tablet',
        os: 'iOS',
        nickname: 'janesmith',
        telegram: '@janesmith',
        osVersion: '16.0'
      };

      const result = await TesterService.registerTester(testerData);
      
      expect(result.success).toBe(true);
      expect(result.data.nickname).toBe('janesmith');
      expect(result.data.telegram).toBe('@janesmith');
      expect(result.data.osVersion).toBe('16.0');
    });
  });

  describe('getTesterById', () => {
    test('should get tester by ID', async () => {
      const registered = await TesterService.registerTester({
        name: 'Test User',
        email: 'test7@example.com',
        deviceType: 'smartphone',
        os: 'Android'
      });

      const result = await TesterService.getTesterById(registered.data.id);
      
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(registered.data.id);
      expect(result.data.email).toBe('test7@example.com');
    });

    test('should return not found error for non-existent ID', async () => {
      const result = await TesterService.getTesterById(999999);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
    });
  });

  describe('updateTesterStatus', () => {
    test('should update tester status to inactive', async () => {
      const registered = await TesterService.registerTester({
        name: 'Test User',
        email: 'test8@example.com',
        deviceType: 'smartphone',
        os: 'Android'
      });

      const result = await TesterService.updateTesterStatus(registered.data.id, 'inactive');
      
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('inactive');
    });

    test('should update tester status to suspended', async () => {
      const registered = await TesterService.registerTester({
        name: 'Test User',
        email: 'test9@example.com',
        deviceType: 'smartphone',
        os: 'Android'
      });

      const result = await TesterService.updateTesterStatus(registered.data.id, 'suspended');
      
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('suspended');
    });

    test('should return validation error for invalid status', async () => {
      const registered = await TesterService.registerTester({
        name: 'Test User',
        email: 'test10@example.com',
        deviceType: 'smartphone',
        os: 'Android'
      });

      const result = await TesterService.updateTesterStatus(registered.data.id, 'invalid_status');
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('getAllTesters', () => {
    test('should get all testers with pagination', async () => {
      await TesterService.registerTester({
        name: 'User 1',
        email: 'test11@example.com',
        deviceType: 'smartphone',
        os: 'Android'
      });

      await TesterService.registerTester({
        name: 'User 2',
        email: 'test12@example.com',
        deviceType: 'tablet',
        os: 'iOS'
      });

      const result = await TesterService.getAllTesters({ page: 1, pageSize: 10 });
      
      expect(result.success).toBe(true);
      expect(result.data.testers).toBeDefined();
      expect(result.data.testers.length).toBeGreaterThanOrEqual(2);
      expect(result.data.total).toBeGreaterThanOrEqual(2);
    });
  });
});
