const pool = require('../config/database');

/**
 * Bug Model
 * Handles database operations for bugs
 * Requirements: 13.1, 13.2, 13.3, 13.5, 13.7, 21.1
 */
class Bug {
  /**
   * Validate bug data
   * @param {Object} bugData - Bug data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validate(bugData) {
    const errors = [];
    const { title, description, testerId, priority, status, type } = bugData;

    // Check required fields (Requirements 13.1)
    if (!title || title.trim() === '') {
      errors.push({ field: 'title', message: 'Название обязательно' });
    }
    if (!description || description.trim() === '') {
      errors.push({ field: 'description', message: 'Описание обязательно' });
    }
    if (!testerId) {
      errors.push({ field: 'testerId', message: 'ID тестера обязательно' });
    }
    if (!priority || priority.trim() === '') {
      errors.push({ field: 'priority', message: 'Приоритет обязателен' });
    }
    if (!status || status.trim() === '') {
      errors.push({ field: 'status', message: 'Статус обязателен' });
    }
    if (!type || type.trim() === '') {
      errors.push({ field: 'type', message: 'Тип обязателен' });
    }

    // Validate enum values (Requirements 13.2, 13.3, 21.1)
    const validStatuses = ['new', 'in_progress', 'fixed', 'closed'];
    if (status && !validStatuses.includes(status)) {
      errors.push({ 
        field: 'status', 
        message: `Статус должен быть одним из: ${validStatuses.join(', ')}` 
      });
    }

    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (priority && !validPriorities.includes(priority)) {
      errors.push({ 
        field: 'priority', 
        message: `Приоритет должен быть одним из: ${validPriorities.join(', ')}` 
      });
    }

    const validTypes = ['ui', 'functionality', 'performance', 'crash', 'security', 'other'];
    if (type && !validTypes.includes(type)) {
      errors.push({ 
        field: 'type', 
        message: `Тип должен быть одним из: ${validTypes.join(', ')}` 
      });
    }

    // Validate title length
    if (title && title.length > 500) {
      errors.push({ field: 'title', message: 'Название не может быть длиннее 500 символов' });
    }

    // Validate testerId is a number
    if (testerId && isNaN(parseInt(testerId))) {
      errors.push({ field: 'testerId', message: 'ID тестера должен быть числом' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create new bug
   * @param {Object} bugData - Bug data
   * @param {string} bugData.title - Bug title (required)
   * @param {string} bugData.description - Bug description (required)
   * @param {number} bugData.testerId - Tester ID (required)
   * @param {string} bugData.priority - Bug priority (required): low, medium, high, critical
   * @param {string} bugData.status - Bug status (required): new, in_progress, fixed, closed
   * @param {string} bugData.type - Bug type (required): ui, functionality, performance, crash, security, other
   * @returns {Promise<Object>} Created bug object
   */
  static async create(bugData) {
    try {
      // Validate input data
      const validation = this.validate(bugData);
      if (!validation.isValid) {
        const error = new Error('Validation failed');
        error.code = 'VALIDATION_ERROR';
        error.details = validation.errors;
        throw error;
      }

      const { title, description, testerId, priority, status, type } = bugData;

      // Check if tester exists
      const testerCheck = await pool.query('SELECT id FROM testers WHERE id = $1', [testerId]);
      if (testerCheck.rows.length === 0) {
        const error = new Error('Tester not found');
        error.code = 'NOT_FOUND';
        error.field = 'testerId';
        throw error;
      }

      // Create bug (Requirement 13.1)
      const query = `
        INSERT INTO bugs (
          title, description, tester_id, priority, status, type
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, title, description, tester_id as "testerId", priority, status, type,
                  created_at as "createdAt", updated_at as "updatedAt", fixed_at as "fixedAt"
      `;

      const result = await pool.query(query, [
        title,
        description,
        testerId,
        priority,
        status,
        type
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating bug:', error);
      throw error;
    }
  }

  /**
   * Find bug by ID
   * @param {number} id - Bug ID
   * @returns {Promise<Object|null>} Bug object or null if not found
   */
  static async findById(id) {
    try {
      const query = `
        SELECT b.id, b.title, b.description, b.tester_id as "testerId", 
               t.name as "testerName", b.priority, b.status, b.type,
               b.created_at as "createdAt", b.updated_at as "updatedAt", 
               b.fixed_at as "fixedAt"
        FROM bugs b
        LEFT JOIN testers t ON b.tester_id = t.id
        WHERE b.id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding bug by ID:', error);
      throw error;
    }
  }

  /**
   * Get all bugs with optional filtering and pagination
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.pageSize=20] - Items per page
   * @param {string} [options.search] - Search query for title or description
   * @param {string} [options.status] - Filter by status
   * @param {string} [options.priority] - Filter by priority
   * @param {string} [options.type] - Filter by type
   * @param {number} [options.testerId] - Filter by tester ID
   * @param {string} [options.sortBy='created_at'] - Sort field
   * @param {string} [options.sortOrder='DESC'] - Sort order (ASC or DESC)
   * @returns {Promise<Object>} Object with bugs array, total count, and pagination info
   */
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search,
        status,
        priority,
        type,
        testerId,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      const offset = (page - 1) * pageSize;
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (search) {
        conditions.push(`(b.title ILIKE $${paramIndex} OR b.description ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (status) {
        conditions.push(`b.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (priority) {
        conditions.push(`b.priority = $${paramIndex}`);
        params.push(priority);
        paramIndex++;
      }

      if (type) {
        conditions.push(`b.type = $${paramIndex}`);
        params.push(type);
        paramIndex++;
      }

      if (testerId) {
        conditions.push(`b.tester_id = $${paramIndex}`);
        params.push(testerId);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Map sortBy to actual column names
      const sortColumnMap = {
        'created_at': 'b.created_at',
        'createdAt': 'b.created_at',
        'updated_at': 'b.updated_at',
        'updatedAt': 'b.updated_at',
        'title': 'b.title',
        'priority': 'b.priority',
        'status': 'b.status',
        'type': 'b.type',
        'testerName': 't.name'
      };

      const sortColumn = sortColumnMap[sortBy] || 'b.created_at';
      const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) 
        FROM bugs b
        LEFT JOIN testers t ON b.tester_id = t.id
        ${whereClause}
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Get bugs
      const query = `
        SELECT b.id, b.title, b.description, b.tester_id as "testerId", 
               t.name as "testerName", b.priority, b.status, b.type,
               b.created_at as "createdAt", b.updated_at as "updatedAt", 
               b.fixed_at as "fixedAt"
        FROM bugs b
        LEFT JOIN testers t ON b.tester_id = t.id
        ${whereClause}
        ORDER BY ${sortColumn} ${order}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(pageSize, offset);
      const result = await pool.query(query, params);

      return {
        bugs: result.rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
    } catch (error) {
      console.error('Error finding all bugs:', error);
      throw error;
    }
  }

  /**
   * Update bug
   * @param {number} id - Bug ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated bug object
   */
  static async update(id, updates) {
    try {
      const allowedFields = ['title', 'description', 'priority', 'status', 'type'];
      const setClause = [];
      const params = [];
      let paramIndex = 1;

      // Build SET clause
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          setClause.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }

      if (setClause.length === 0) {
        throw new Error('No valid fields to update');
      }

      // Add updated_at timestamp (Requirement 13.7)
      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Add fixed_at timestamp if status is being changed to 'fixed'
      if (updates.status === 'fixed') {
        setClause.push(`fixed_at = CURRENT_TIMESTAMP`);
      } else if (updates.status && updates.status !== 'fixed') {
        setClause.push(`fixed_at = NULL`);
      }

      params.push(id);

      const query = `
        UPDATE bugs
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, title, description, tester_id as "testerId", priority, status, type,
                  created_at as "createdAt", updated_at as "updatedAt", fixed_at as "fixedAt"
      `;

      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        const error = new Error('Bug not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating bug:', error);
      throw error;
    }
  }

  /**
   * Delete bug
   * @param {number} id - Bug ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM bugs WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        const error = new Error('Bug not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting bug:', error);
      throw error;
    }
  }

  /**
   * Get bugs by tester ID
   * @param {number} testerId - Tester ID
   * @returns {Promise<Array>} Array of bugs
   */
  static async findByTesterId(testerId) {
    try {
      const query = `
        SELECT id, title, description, tester_id as "testerId", priority, status, type,
               created_at as "createdAt", updated_at as "updatedAt", fixed_at as "fixedAt"
        FROM bugs
        WHERE tester_id = $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [testerId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding bugs by tester ID:', error);
      throw error;
    }
  }

  /**
   * Get bug statistics
   * @returns {Promise<Object>} Bug statistics
   */
  static async getStatistics() {
    try {
      const queries = {
        total: 'SELECT COUNT(*) as count FROM bugs',
        byStatus: `
          SELECT status, COUNT(*) as count 
          FROM bugs 
          GROUP BY status
        `,
        byPriority: `
          SELECT priority, COUNT(*) as count 
          FROM bugs 
          GROUP BY priority
        `,
        byType: `
          SELECT type, COUNT(*) as count 
          FROM bugs 
          GROUP BY type
        `
      };

      const [totalResult, statusResult, priorityResult, typeResult] = await Promise.all([
        pool.query(queries.total),
        pool.query(queries.byStatus),
        pool.query(queries.byPriority),
        pool.query(queries.byType)
      ]);

      const total = parseInt(totalResult.rows[0].count);
      
      const byStatus = {};
      statusResult.rows.forEach(row => {
        byStatus[row.status] = parseInt(row.count);
      });

      const byPriority = {};
      priorityResult.rows.forEach(row => {
        byPriority[row.priority] = parseInt(row.count);
      });

      const byType = {};
      typeResult.rows.forEach(row => {
        byType[row.type] = parseInt(row.count);
      });

      return {
        total,
        byStatus,
        byPriority,
        byType
      };
    } catch (error) {
      console.error('Error getting bug statistics:', error);
      throw error;
    }
  }
}

module.exports = Bug;