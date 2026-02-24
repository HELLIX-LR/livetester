const request = require('supertest');
const app = require('../server');
const pool = require('../config/database');

describe('Testers Routes', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await pool.query('DELETE FROM testers WHERE email LIKE $1', ['test%@example.com']);
  });

  describe('POST /api/testers', () => {
    test('should register new tester with valid data', async () => {
      const testerData = {
        name: 'John Doe',
        email: 'test1@example.com',
        deviceType: 'smartphone',
        os: 'Android',
        osVersion: '13.0'
      };

      const response = await request(app)
        .post('/api/testers')
        .send(testerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('John Doe');
      expect(response.body.data.email).toBe('test1@example.com');
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.bugsCount).toBe(0);
      expect(response.body.data.rating).toBe(0);
      expect(response.body.data.id).toBeDefined();
    });

    test('should return 400 for missing required fields', async () => {
      const testerData = {
        name: 'John Doe',
        email: 'test2@example.com'
        // Missing deviceType and os
      };

      const response = await request(app)
        .post('/api/testers')
        .send(testerData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'deviceType' }),
          expect.objectContaining({ field: 'os' })
        ])
      );
    });

    test('should return 400 for invalid email format', async () => {
      const testerData = {
        name: 'John Doe',
        email: 'invalid-email',
        deviceType: 'smartphone',
        os: 'Android'
      };

      const response = await request(app)
        .post('/api/testers')
        .send(testerData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContainEqual({
        field: 'email',
        message: 'Invalid email format'
      });
    });

    test('should return 409 for duplicate email', async () => {
      const testerData = {
        name: 'John Doe',
        email: 'test3@example.com',
        deviceType: 'smartphone',
        os: 'Android'
      };

      // Register first tester
      await request(app)
        .post('/api/testers')
        .send(testerData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/testers')
        .send(testerData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toBe('Email already registered');
    });

    test('should register tester with optional fields', async () => {
      const testerData = {
        name: 'Jane Smith',
        email: 'test4@example.com',
        deviceType: 'tablet',
        os: 'iOS',
        nickname: 'janesmith',
        telegram: '@janesmith',
        osVersion: '16.0'
      };

      const response = await request(app)
        .post('/api/testers')
        .send(testerData)
        .expect(201);

      expect(response.body.data.nickname).toBe('janesmith');
      expect(response.body.data.telegram).toBe('@janesmith');
      expect(response.body.data.osVersion).toBe('16.0');
    });
  });

  describe('GET /api/testers/:id', () => {
    test('should get tester by ID', async () => {
      // First create a tester
      const createResponse = await request(app)
        .post('/api/testers')
        .send({
          name: 'Test User',
          email: 'test5@example.com',
          deviceType: 'smartphone',
          os: 'Android'
        });

      const testerId = createResponse.body.data.id;

      // Then get it by ID
      const response = await request(app)
        .get(`/api/testers/${testerId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testerId);
      expect(response.body.data.email).toBe('test5@example.com');
    });

    test('should return 404 for non-existent tester', async () => {
      const response = await request(app)
        .get('/api/testers/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    test('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/api/testers/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/testers', () => {
    test('should get all testers with pagination', async () => {
      // Create test testers
      await request(app)
        .post('/api/testers')
        .send({
          name: 'User 1',
          email: 'test6@example.com',
          deviceType: 'smartphone',
          os: 'Android'
        });

      await request(app)
        .post('/api/testers')
        .send({
          name: 'User 2',
          email: 'test7@example.com',
          deviceType: 'tablet',
          os: 'iOS'
        });

      const response = await request(app)
        .get('/api/testers?page=1&pageSize=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.testers).toBeDefined();
      expect(response.body.data.testers.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data.total).toBeGreaterThanOrEqual(2);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.pageSize).toBe(10);
    });
  });

  describe('PATCH /api/testers/:id/status', () => {
    test('should update tester status', async () => {
      // First create a tester
      const createResponse = await request(app)
        .post('/api/testers')
        .send({
          name: 'Test User',
          email: 'test8@example.com',
          deviceType: 'smartphone',
          os: 'Android'
        });

      const testerId = createResponse.body.data.id;

      // Update status
      const response = await request(app)
        .patch(`/api/testers/${testerId}/status`)
        .send({ status: 'inactive' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('inactive');
    });

    test('should return 400 for invalid status', async () => {
      // First create a tester
      const createResponse = await request(app)
        .post('/api/testers')
        .send({
          name: 'Test User',
          email: 'test9@example.com',
          deviceType: 'smartphone',
          os: 'Android'
        });

      const testerId = createResponse.body.data.id;

      // Try invalid status
      const response = await request(app)
        .patch(`/api/testers/${testerId}/status`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/testers/top', () => {
    test('should get top testers by rating', async () => {
      const response = await request(app)
        .get('/api/testers/top')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    test('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/testers/top?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    test('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/testers/top?limit=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should return 400 for limit out of range', async () => {
      const response = await request(app)
        .get('/api/testers/top?limit=101')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});