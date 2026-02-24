const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.auth = null;
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    this.retryQueue = [];
    this.isProcessingQueue = false;
    
    // Column mapping as per design document
    this.SHEET_COLUMNS = {
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
  }

  /**
   * Initialize OAuth 2.0 authentication
   */
  async authenticate() {
    try {
      // Load credentials from environment or file
      const credentials = await this.loadCredentials();
      
      this.auth = new google.auth.OAuth2(
        credentials.client_id,
        credentials.client_secret,
        credentials.redirect_uri
      );

      // Set refresh token if available
      if (credentials.refresh_token) {
        this.auth.setCredentials({
          refresh_token: credentials.refresh_token
        });
      }

      // Initialize Sheets API
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      console.log('Google Sheets authentication successful');
      return true;
    } catch (error) {
      console.error('Google Sheets authentication failed:', error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Load OAuth 2.0 credentials from environment variables or file
   */
  async loadCredentials() {
    // Try environment variables first
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      return {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob',
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      };
    }

    // Fallback to credentials file
    try {
      const credentialsPath = path.join(__dirname, '../config/google-credentials.json');
      const credentialsFile = await fs.readFile(credentialsPath, 'utf8');
      return JSON.parse(credentialsFile);
    } catch (error) {
      throw new Error('Google credentials not found. Set environment variables or create config/google-credentials.json');
    }
  }

  /**
   * Check if Google Sheets API is available
   */
  async checkConnection() {
    try {
      if (!this.sheets) {
        await this.authenticate();
      }

      // Test connection by getting spreadsheet metadata
      await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      
      return true;
    } catch (error) {
      console.error('Google Sheets connection check failed:', error.message);
      return false;
    }
  }

  /**
   * Append tester data to Google Sheets
   * Validates: Requirements 3.1, 3.2, 3.5
   */
  async appendTester(tester) {
    try {
      if (!this.sheets) {
        await this.authenticate();
      }

      // Map tester data to spreadsheet columns
      const values = [
        tester.id,
        tester.name,
        tester.email,
        tester.nickname || '',
        tester.telegram || '',
        tester.deviceType,
        tester.os,
        tester.osVersion || '',
        tester.registrationDate ? new Date(tester.registrationDate).toISOString() : new Date().toISOString(),
        tester.status || 'active'
      ];

      const request = {
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:J',
        valueInputOption: 'RAW',
        resource: {
          values: [values]
        }
      };

      const response = await this.sheets.spreadsheets.values.append(request);
      
      // Log successful operation with timestamp
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Google Sheets: Successfully appended tester ${tester.id} (${tester.name})`);
      
      return {
        success: true,
        updatedRows: response.data.updates.updatedRows,
        updatedRange: response.data.updates.updatedRange
      };

    } catch (error) {
      console.error('Failed to append tester to Google Sheets:', error.message);
      
      // Add to retry queue if API is unavailable
      await this.queueForRetry('append', tester);
      
      throw new Error(`Google Sheets append failed: ${error.message}`);
    }
  }

  /**
   * Fetch all testers from Google Sheets
   * Validates: Requirements 10.1, 10.2, 10.3
   */
  async fetchTesters() {
    try {
      if (!this.sheets) {
        await this.authenticate();
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:J'
      });

      const rows = response.data.values || [];
      
      // Skip header row if present
      const dataRows = rows.length > 0 && this.isHeaderRow(rows[0]) ? rows.slice(1) : rows;
      
      const testers = [];
      
      for (let i = 0; i < dataRows.length; i++) {
        try {
          const tester = this.parseRow(dataRows[i], i + 2); // +2 for header and 1-based indexing
          if (tester) {
            testers.push(tester);
          }
        } catch (error) {
          console.warn(`Failed to parse row ${i + 2}:`, error.message);
          // Continue processing other rows
        }
      }

      console.log(`Google Sheets: Successfully fetched ${testers.length} testers`);
      return testers;

    } catch (error) {
      console.error('Failed to fetch testers from Google Sheets:', error.message);
      throw new Error(`Google Sheets fetch failed: ${error.message}`);
    }
  }

  /**
   * Parse a spreadsheet row into a tester object
   * Handles empty cells gracefully
   */
  parseRow(row, rowNumber = null) {
    if (!row || row.length === 0) {
      return null;
    }

    // Handle empty cells by providing default values
    const getValue = (index, defaultValue = '') => {
      return row[index] !== undefined && row[index] !== null && row[index] !== '' 
        ? row[index] 
        : defaultValue;
    };

    try {
      const tester = {
        id: getValue(0),
        name: getValue(1),
        email: getValue(2),
        nickname: getValue(3),
        telegram: getValue(4),
        deviceType: getValue(5),
        os: getValue(6),
        osVersion: getValue(7),
        registrationDate: this.parseDate(getValue(8)),
        status: getValue(9, 'active'),
        googleSheetsRowId: rowNumber
      };

      // Validate required fields
      if (!tester.id || !tester.name || !tester.deviceType || !tester.os) {
        throw new Error(`Missing required fields in row ${rowNumber}`);
      }

      return tester;
    } catch (error) {
      throw new Error(`Failed to parse row ${rowNumber}: ${error.message}`);
    }
  }

  /**
   * Check if a row appears to be a header row
   */
  isHeaderRow(row) {
    if (!row || row.length === 0) return false;
    
    const firstCell = row[0].toString().toLowerCase();
    return firstCell === 'id' || firstCell === 'identifier' || firstCell === 'тестер';
  }

  /**
   * Parse date string, handling various formats
   */
  parseDate(dateString) {
    if (!dateString) return new Date();
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? new Date() : date;
    } catch (error) {
      return new Date();
    }
  }

  /**
   * Add failed operation to retry queue
   */
  async queueForRetry(operationType, data) {
    const queueItem = {
      id: Date.now() + Math.random(),
      operationType,
      data,
      retryCount: 0,
      createdAt: new Date(),
      maxRetries: 3
    };

    this.retryQueue.push(queueItem);
    console.log(`Queued ${operationType} operation for retry:`, queueItem.id);

    // Start processing queue if not already running
    if (!this.isProcessingQueue) {
      setTimeout(() => this.processRetryQueue(), 60000); // Retry after 60 seconds
    }
  }

  /**
   * Process retry queue with exponential backoff
   */
  async processRetryQueue() {
    if (this.isProcessingQueue || this.retryQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    console.log(`Processing retry queue: ${this.retryQueue.length} items`);

    const itemsToRetry = [...this.retryQueue];
    this.retryQueue = [];

    for (const item of itemsToRetry) {
      try {
        if (item.retryCount >= item.maxRetries) {
          console.error(`Max retries exceeded for operation ${item.id}`);
          continue;
        }

        // Check if API is available
        const isAvailable = await this.checkConnection();
        if (!isAvailable) {
          // Re-queue with incremented retry count
          item.retryCount++;
          this.retryQueue.push(item);
          continue;
        }

        // Retry the operation
        if (item.operationType === 'append') {
          await this.appendTester(item.data);
          console.log(`Successfully retried operation ${item.id}`);
        }

      } catch (error) {
        console.error(`Retry failed for operation ${item.id}:`, error.message);
        
        // Re-queue with incremented retry count
        item.retryCount++;
        if (item.retryCount < item.maxRetries) {
          this.retryQueue.push(item);
        }
      }
    }

    this.isProcessingQueue = false;

    // Schedule next retry if there are still items in queue
    if (this.retryQueue.length > 0) {
      const delay = Math.min(60000 * Math.pow(2, Math.max(...this.retryQueue.map(i => i.retryCount))), 300000); // Max 5 minutes
      setTimeout(() => this.processRetryQueue(), delay);
    }
  }

  /**
   * Manually trigger retry of failed operations
   */
  async retryFailedOperations() {
    if (this.retryQueue.length === 0) {
      console.log('No failed operations to retry');
      return { success: true, retriedCount: 0 };
    }

    const initialCount = this.retryQueue.length;
    await this.processRetryQueue();
    
    return {
      success: true,
      retriedCount: initialCount - this.retryQueue.length,
      remainingCount: this.retryQueue.length
    };
  }

  /**
   * Update tester data in Google Sheets
   */
  async updateTester(testerId, data) {
    try {
      // First, find the row containing this tester
      const testers = await this.fetchTesters();
      const testerIndex = testers.findIndex(t => t.id.toString() === testerId.toString());
      
      if (testerIndex === -1) {
        throw new Error(`Tester ${testerId} not found in Google Sheets`);
      }

      const rowNumber = testerIndex + 2; // +1 for header, +1 for 1-based indexing
      
      // Prepare update values
      const currentTester = testers[testerIndex];
      const updatedTester = { ...currentTester, ...data };
      
      const values = [
        updatedTester.id,
        updatedTester.name,
        updatedTester.email,
        updatedTester.nickname || '',
        updatedTester.telegram || '',
        updatedTester.deviceType,
        updatedTester.os,
        updatedTester.osVersion || '',
        updatedTester.registrationDate ? new Date(updatedTester.registrationDate).toISOString() : new Date().toISOString(),
        updatedTester.status || 'active'
      ];

      const request = {
        spreadsheetId: this.spreadsheetId,
        range: `Sheet1!A${rowNumber}:J${rowNumber}`,
        valueInputOption: 'RAW',
        resource: {
          values: [values]
        }
      };

      await this.sheets.spreadsheets.values.update(request);
      
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Google Sheets: Successfully updated tester ${testerId}`);
      
      return { success: true };

    } catch (error) {
      console.error('Failed to update tester in Google Sheets:', error.message);
      throw new Error(`Google Sheets update failed: ${error.message}`);
    }
  }
}

module.exports = new GoogleSheetsService();