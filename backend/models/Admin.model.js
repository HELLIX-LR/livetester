const pool = require('../config/database');

/**
 * Admin Model
 * Handles database operations for admin users
 */
class Admin {
  /**
   * Find admin by username
   * @param {string} username - Admin username
   * @returns {Promise<Object|null>} Admin object or null if not found
   */
  static async findByUsername(username) {
    try {
      const query = 'SELECT * FROM admins WHERE username = $1';
      const result = await pool.query(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding admin by username:', error);
      throw error;
    }
  }

  /**
   * Find admin by ID
   * @param {number} id - Admin ID
   * @returns {Promise<Object|null>} Admin object or null if not found
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM admins WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding admin by ID:', error);
      throw error;
    }
  }

  /**
   * Create new admin
   * @param {Object} adminData - Admin data
   * @param {string} adminData.username - Username
   * @param {string} adminData.password_hash - Hashed password
   * @param {string} [adminData.email] - Email (optional)
   * @returns {Promise<Object>} Created admin object
   */
  static async create(adminData) {
    try {
      const { username, password_hash, email } = adminData;
      const query = `
        INSERT INTO admins (username, password_hash, email)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, created_at
      `;
      const result = await pool.query(query, [username, password_hash, email || null]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  }

  /**
   * Update last login timestamp
   * @param {number} id - Admin ID
   * @returns {Promise<boolean>} Success status
   */
  static async updateLastLogin(id) {
    try {
      const query = 'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
      await pool.query(query, [id]);
      return true;
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Get all admins (without password hashes)
   * @returns {Promise<Array>} Array of admin objects
   */
  static async findAll() {
    try {
      const query = 'SELECT id, username, email, created_at, last_login FROM admins ORDER BY created_at DESC';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error finding all admins:', error);
      throw error;
    }
  }
}

module.exports = Admin;
