const Tester = require('./Tester.model');
const pool = require('../config/database');

describe('Tester Model', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await pool.query('DELETE FROM testers WHERE email LIKE $1', ['test%@example.com']);
  });

  describe('validate', () => {
    test('should pass validation with all required fields', () => {
      const testerData = {
        name: 'Test User',
        email: 'test@example.com',
        deviceType: 'smartphone',
        os: 'Android'
      };

      const result = Tester.validate(testerData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail validation when name is missing', () => {
      const testerData = {
        email: 'test@example.com',
        deviceType: 'smartphone',
        os: 'Android'
      };

      const result = Tester.validate(testerData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Name is required'
      });
    });

    test('should fail validation when email is missing', () => {
      const testerData = {
        name: 'Test User',
        deviceType: 'smartphone',
        os: 'Android'
      };

      const result = Tester.validate(testerData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Email is required'
      });
    });

    test('should fail validation when deviceType is missing', () => {
      const testerData = {
        name: 'Test User',
        email: 'test@example.com',
        os: 'Android'
      };

      const result = Tester.validate(testerData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'deviceType',
        message: 'Device type is required'
      });
    });

    test('should fail validation when os is missing', () => {
      const testerData = {
        name: 'Test User',
        email: 'test@example.com',
        deviceType: 'smartphone'
      };

      const result = Tester.validate(testerData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'os',
        message: 'Operating system is required'
      });
    });

    test('should fail validation with invalid email format', () => {
      const testerData = {
        name: 'Test User',
        email: 'invalid-email',
        deviceType: 'smartphone',
        os: 'Android'
      };

      const result = Tester.validate(testerData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Invalid email format'
      });
    });

    test('should fail validation with multiple missing fields', () => {
      const testerData = {
        name: 'Test User'
      };

      const result = Tester.validate(testerData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('create', () => {
    test('should create tester with required fields and default values', async () => {
      const testerData = {
        name: 'Test User',
        email: 'test1@example.com',
        deviceType: 'smartphone',
        os: 'Android'
      };

      const tester = await Tester.create(testerData);
      
      expect(tester).toBeDefined();
      expect(tester.id).toBeDefined();
      expect(tester.name).toBe('Test User');
      expect(tester.email).toBe('test1@example.com');
      expect(tester.deviceType).toBe('smartphone');
      expect(tester.os).toBe('Android');
      expect(tester.status).toBe('active');
      expect(tester.bugsCount).toBe(0);
      expect(tester.rating).toBe(0);
      expect(tester.registrationDate).toBeDefined();
    });

    test('should create tester with optional fields', async () => {
      const testerData = {
        name: 'Test User',
        email: 'test2@example.com',
        deviceType: 'tablet',
        os: 'iOS',
        nickname: 'testuser',
        telegram: '@testuser',
        osVersion: '16.0'
      };

      const tester = await Tester.create(testerData);
      
      expect(tester.nickname).toBe('testuser');
      expect(tester.telegram).toBe('@testuser');
      expect(tester.osVersion).toBe('16.0');
    });

    test('should throw validation error for missing required fields', async () => {
      const testerData = {
        name: 'Test User',
        email: 'test3@example.com'
      };

      await expect(Tester.create(testerData)).rejects.toThrow('Validation failed');
    });

    test('should throw validation error for invalid email', async () => {
      const testerData = {
        name: 'Test User',
        email: 'invalid-email',
        deviceType: 'smartphone',
        os: 'Android'
      };

      await expect(Tester.create(testerData)).rejects.toThrow('Validation failed');
    });

    test('should throw conflict error for duplicate email', async () => {
      const testerData = {
        name: 'Test User',
        email: 'test4@example.com',
        deviceType: 'smartphone',
        os: 'Android'
      };

      await Tester.create(testerData);
      
      await expect(Tester.create(testerData)).rejects.toThrow('Email already registered');
    });
  });

  describe('findById', () => {
    test('should find tester by ID', async () => {
      const created = await Tester.create({
        name: 'Test User',
        email: 'test5@example.com',
        deviceType: 'smartphone',
        os: 'Android'
      });

      const found = await Tester.findById(created.id);
      
      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
      expect(found.email).toBe('test5@example.com');
    });

    test('should return null for non-existent ID', async () => {
      const found = await Tester.findById(999999);
      
      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    test('should find tester by email', async () => {
      await Tester.create({
        name: 'Test User',
        email: 'test6@example.com',
        deviceType: 'smartphone',
        os: 'Android'
      });

      const found = await Tester.findByEmail('test6@example.com');
      
      expect(found).toBeDefined();
      expect(found.email).toBe('test6@example.com');
    });

    test('should return null for non-existent email', async () => {
      const found = await Tester.findByEmail('nonexistent@example.com');
      
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    test('should update tester fields', async () => {
      const created = await Tester.create({
        name: 'Test User',
        email: 'test7@example.com',
        deviceType: 'smartphone',
        os: 'Android'
      });

      const updated = await Tester.update(created.id, {
        name: 'Updated Name',
        nickname: 'newnick'
      });
      
      expect(updated.name).toBe('Updated Name');
      expect(updated.nickname).toBe('newnick');
      expect(updated.email).toBe('test7@example.com');
    });

    test('should throw error for non-existent tester', async () => {
      await expect(Tester.update(999999, { name: 'Test' })).rejects.toThrow('Tester not found');
    });
  });
});
