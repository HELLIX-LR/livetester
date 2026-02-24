const googleSheetsService = require('./googleSheets.service');

describe('GoogleSheetsService', () => {
  // Mock data for testing
  const mockTester = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    nickname: 'testuser',
    telegram: '@testuser',
    deviceType: 'smartphone',
    os: 'Android',
    osVersion: '13.0',
    registrationDate: new Date('2024-01-15T10:30:00Z'),
    status: 'active'
  };

  describe('parseRow', () => {
    test('should parse complete row correctly', () => {
      const row = [
        '1',
        'Test User',
        'test@example.com',
        'testuser',
        '@testuser',
        'smartphone',
        'Android',
        '13.0',
        '2024-01-15T10:30:00Z',
        'active'
      ];

      const result = googleSheetsService.parseRow(row, 2);

      expect(result).toEqual({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        nickname: 'testuser',
        telegram: '@testuser',
        deviceType: 'smartphone',
        os: 'Android',
        osVersion: '13.0',
        registrationDate: new Date('2024-01-15T10:30:00Z'),
        status: 'active',
        googleSheetsRowId: 2
      });
    });

    test('should handle empty cells gracefully', () => {
      const row = [
        '1',
        'Test User',
        'test@example.com',
        '', // empty nickname
        '', // empty telegram
        'smartphone',
        'Android',
        '', // empty osVersion
        '2024-01-15T10:30:00Z',
        'active'
      ];

      const result = googleSheetsService.parseRow(row, 2);

      expect(result.nickname).toBe('');
      expect(result.telegram).toBe('');
      expect(result.osVersion).toBe('');
      expect(result.name).toBe('Test User');
      expect(result.email).toBe('test@example.com');
    });

    test('should handle missing columns', () => {
      const row = [
        '1',
        'Test User',
        'test@example.com',
        'testuser',
        '@testuser',
        'smartphone'
        // Missing OS, osVersion, registrationDate, status
      ];

      const result = googleSheetsService.parseRow(row, 2);

      expect(result.os).toBe('');
      expect(result.osVersion).toBe('');
      expect(result.status).toBe('active'); // default value
    });

    test('should throw error for missing required fields', () => {
      const row = [
        '', // missing ID
        'Test User',
        'test@example.com'
      ];

      expect(() => {
        googleSheetsService.parseRow(row, 2);
      }).toThrow('Missing required fields in row 2');
    });

    test('should return null for empty row', () => {
      const result = googleSheetsService.parseRow([], 2);
      expect(result).toBeNull();
    });
  });

  describe('isHeaderRow', () => {
    test('should identify header row with "ID"', () => {
      const row = ['ID', 'Name', 'Email', 'Nickname'];
      expect(googleSheetsService.isHeaderRow(row)).toBe(true);
    });

    test('should identify header row with "id" (lowercase)', () => {
      const row = ['id', 'name', 'email'];
      expect(googleSheetsService.isHeaderRow(row)).toBe(true);
    });

    test('should not identify data row as header', () => {
      const row = ['1', 'John Doe', 'john@example.com'];
      expect(googleSheetsService.isHeaderRow(row)).toBe(false);
    });

    test('should handle empty row', () => {
      expect(googleSheetsService.isHeaderRow([])).toBe(false);
    });
  });

  describe('parseDate', () => {
    test('should parse valid ISO date string', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const result = googleSheetsService.parseDate(dateString);
      expect(result).toEqual(new Date('2024-01-15T10:30:00Z'));
    });

    test('should handle invalid date string', () => {
      const dateString = 'invalid-date';
      const result = googleSheetsService.parseDate(dateString);
      expect(result).toBeInstanceOf(Date);
      // Should return current date for invalid input
    });

    test('should handle empty date string', () => {
      const result = googleSheetsService.parseDate('');
      expect(result).toBeInstanceOf(Date);
    });

    test('should handle null date', () => {
      const result = googleSheetsService.parseDate(null);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('queueForRetry', () => {
    beforeEach(() => {
      // Clear retry queue before each test
      googleSheetsService.retryQueue = [];
    });

    test('should add operation to retry queue', async () => {
      await googleSheetsService.queueForRetry('append', mockTester);

      expect(googleSheetsService.retryQueue).toHaveLength(1);
      expect(googleSheetsService.retryQueue[0]).toMatchObject({
        operationType: 'append',
        data: mockTester,
        retryCount: 0,
        maxRetries: 3
      });
    });

    test('should generate unique queue item IDs', async () => {
      await googleSheetsService.queueForRetry('append', mockTester);
      await googleSheetsService.queueForRetry('append', mockTester);

      expect(googleSheetsService.retryQueue).toHaveLength(2);
      expect(googleSheetsService.retryQueue[0].id).not.toBe(googleSheetsService.retryQueue[1].id);
    });
  });

  describe('Column mapping', () => {
    test('should have correct column mapping', () => {
      const expectedMapping = {
        ID: 'A',
        NAME: 'B',
        EMAIL: 'C',
        NICKNAME: 'D',
        TELEGRAM: 'E',
        DEVICE_TYPE: 'F',
        OS: 'G',
        OS_VERSION: 'H',
        REGISTRATION_DATE: 'I',
        STATUS: 'J'
      };

      expect(googleSheetsService.SHEET_COLUMNS).toEqual(expectedMapping);
    });
  });

  describe('loadCredentials', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    test('should load credentials from environment variables', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.GOOGLE_REFRESH_TOKEN = 'test-refresh-token';

      const credentials = await googleSheetsService.loadCredentials();

      expect(credentials).toEqual({
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
        refresh_token: 'test-refresh-token'
      });
    });

    test('should throw error when no credentials found', async () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      await expect(googleSheetsService.loadCredentials()).rejects.toThrow(
        'Google credentials not found'
      );
    });
  });
});

// Integration tests (require actual Google Sheets setup)
describe('GoogleSheetsService Integration', () => {
  // These tests require actual Google Sheets credentials and spreadsheet
  // Skip them if credentials are not available
  const hasCredentials = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  describe.skipIf(!hasCredentials)('Real Google Sheets operations', () => {
    test('should check connection', async () => {
      const isConnected = await googleSheetsService.checkConnection();
      expect(typeof isConnected).toBe('boolean');
    });

    test('should fetch testers from spreadsheet', async () => {
      const testers = await googleSheetsService.fetchTesters();
      expect(Array.isArray(testers)).toBe(true);
    });
  });
});