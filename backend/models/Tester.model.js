const pool = require('../config/database');

/**
 * Tester Model
 * Handles database operations for testers
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
class Tester {
  /**
   * Validate tester data
   * @param {Object} testerData - Tester data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validate(testerData) {
    const errors = [];
    const { name, email, deviceType, os } = testerData;

    // Check required fields (Requirements 1.2, 1.4)
    if (!name || name.trim() === '') {
      errors.push({ field: 'name', message: 'Name is required' });
    }
    if (!email || email.trim() === '') {
      errors.push({ field: 'email', message: 'Email is required' });
    }
    if (!deviceType || deviceType.trim() === '') {
      errors.push({ field: 'deviceType', message: 'Device type is required' });
    }
    if (!os || os.trim() === '') {
      errors.push({ field: 'os', message: 'Operating system is required' });
    }

    // Validate email format (Requirement 1.5)
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create new tester
   * @param {Object} testerData - Tester data
   * @param {string} testerData.name - Tester name (required)
   * @param {string} testerData.email - Tester email (required)
   * @param {string} testerData.deviceType - Device type (required)
   * @param {string} testerData.os - Operating system (required)
   * @param {string} [testerData.nickname] - Nickname (optional)
   * @param {string} [testerData.telegram] - Telegram username/ID (optional)
   * @param {string} [testerData.osVersion] - OS version (optional)
   * @returns {Promise<Object>} Created tester object
   */
  static async create(testerData) {
    try {
      // Validate input data
      const validation = this.validate(testerData);
      if (!validation.isValid) {
        const error = new Error('Validation failed');
        error.code = 'VALIDATION_ERROR';
        error.details = validation.errors;
        throw error;
      }

      const { name, email, nickname, telegram, deviceType, os, osVersion } = testerData;

      // Create tester with default values (Requirement 1.3)
      // status: 'active', bugs_count: 0, rating: 0
      const query = `
        INSERT INTO testers (
          name, email, nickname, telegram, device_type, os, os_version,
          status, bugs_count, rating
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', 0, 0)
        RETURNING id, name, email, nickname, telegram, device_type as "deviceType",
                  os, os_version as "osVersion", status, registration_date as "registrationDate",
                  bugs_count as "bugsCount", rating, created_at as "createdAt"
      `;

      const result = await pool.query(query, [
        name,
        email,
        nickname || null,
        telegram || null,
        deviceType,
        os,
        osVersion || null
      ]);

      return result.rows[0];
    } catch (error) {
      // Handle duplicate email error
      if (error.code === '23505' && error.constraint === 'testers_email_key') {
        const duplicateError = new Error('Email already registered');
        duplicateError.code = 'CONFLICT';
        duplicateError.field = 'email';
        throw duplicateError;
      }

      console.error('Error creating tester:', error);
      throw error;
    }
  }

  /**
   * Find tester by ID
   * @param {number} id - Tester ID
   * @returns {Promise<Object|null>} Tester object or null if not found
   */
  static async findById(id) {
    try {
      const query = `
        SELECT id, name, email, nickname, telegram, device_type as "deviceType",
               os, os_version as "osVersion", status, registration_date as "registrationDate",
               last_activity_date as "lastActivityDate", bugs_count as "bugsCount",
               rating, created_at as "createdAt", updated_at as "updatedAt"
        FROM testers
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding tester by ID:', error);
      throw error;
    }
  }

  /**
   * Find tester by email
   * @param {string} email - Tester email
   * @returns {Promise<Object|null>} Tester object or null if not found
   */
  static async findByEmail(email) {
    try {
      const query = `
        SELECT id, name, email, nickname, telegram, device_type as "deviceType",
               os, os_version as "osVersion", status, registration_date as "registrationDate",
               last_activity_date as "lastActivityDate", bugs_count as "bugsCount",
               rating, created_at as "createdAt", updated_at as "updatedAt"
        FROM testers
        WHERE email = $1
      `;
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding tester by email:', error);
      throw error;
    }
  }

  /**
   * Get all testers with optional filtering and pagination
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.pageSize=20] - Items per page
   * @param {string} [options.search] - Search query for name or email
   * @param {string} [options.deviceType] - Filter by device type
   * @param {string} [options.os] - Filter by operating system
   * @param {string} [options.status] - Filter by status
   * @param {string} [options.sortBy='registration_date'] - Sort field
   * @param {string} [options.sortOrder='DESC'] - Sort order (ASC or DESC)
   * @returns {Promise<Object>} Object with testers array, total count, and pagination info
   */
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search,
        deviceType,
        os,
        status,
        sortBy = 'registration_date',
        sortOrder = 'DESC'
      } = options;

      const offset = (page - 1) * pageSize;
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (search) {
        conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (deviceType) {
        conditions.push(`device_type = $${paramIndex}`);
        params.push(deviceType);
        paramIndex++;
      }

      if (os) {
        conditions.push(`os = $${paramIndex}`);
        params.push(os);
        paramIndex++;
      }

      if (status) {
        conditions.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Map sortBy to actual column names
      const sortColumnMap = {
        'registration_date': 'registration_date',
        'registrationDate': 'registration_date',
        'name': 'name',
        'email': 'email',
        'rating': 'rating',
        'bugsCount': 'bugs_count',
        'bugs_count': 'bugs_count'
      };

      const sortColumn = sortColumnMap[sortBy] || 'registration_date';
      const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM testers ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Get testers
      const query = `
        SELECT id, name, email, nickname, telegram, device_type as "deviceType",
               os, os_version as "osVersion", status, registration_date as "registrationDate",
               last_activity_date as "lastActivityDate", bugs_count as "bugsCount",
               rating, created_at as "createdAt", updated_at as "updatedAt"
        FROM testers
        ${whereClause}
        ORDER BY ${sortColumn} ${order}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(pageSize, offset);
      const result = await pool.query(query, params);

      return {
        testers: result.rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
    } catch (error) {
      console.error('Error finding all testers:', error);
      throw error;
    }
  }

  /**
   * Update tester
   * @param {number} id - Tester ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated tester object
   */
  static async update(id, updates) {
    try {
      const allowedFields = ['name', 'email', 'nickname', 'telegram', 'device_type', 'os', 'os_version', 'status'];
      const setClause = [];
      const params = [];
      let paramIndex = 1;

      // Build SET clause
      for (const [key, value] of Object.entries(updates)) {
        const dbField = key === 'deviceType' ? 'device_type' :
                       key === 'osVersion' ? 'os_version' : key;
        
        if (allowedFields.includes(dbField)) {
          setClause.push(`${dbField} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }

      if (setClause.length === 0) {
        throw new Error('No valid fields to update');
      }

      // Add updated_at timestamp
      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id);

      const query = `
        UPDATE testers
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, email, nickname, telegram, device_type as "deviceType",
                  os, os_version as "osVersion", status, registration_date as "registrationDate",
                  last_activity_date as "lastActivityDate", bugs_count as "bugsCount",
                  rating, created_at as "createdAt", updated_at as "updatedAt"
      `;

      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        const error = new Error('Tester not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating tester:', error);
      throw error;
    }
  }

  /**
   * Delete tester
   * @param {number} id - Tester ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM testers WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        const error = new Error('Tester not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting tester:', error);
      throw error;
    }
  }

  /**
   * Update last activity date
   * @param {number} id - Tester ID
   * @returns {Promise<boolean>} Success status
   */
  static async updateLastActivity(id) {
    try {
      const query = 'UPDATE testers SET last_activity_date = CURRENT_TIMESTAMP WHERE id = $1';
      await pool.query(query, [id]);
      return true;
    } catch (error) {
      console.error('Error updating last activity:', error);
      throw error;
    }
  }
}

module.exports = Tester;
