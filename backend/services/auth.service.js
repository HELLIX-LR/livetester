const bcrypt = require('bcrypt');
const Admin = require('../models/Admin.model');

/**
 * Authentication Service
 * Handles password hashing, credential verification, and session management
 */
class AuthService {
  /**
   * Hash password using bcrypt with minimum 10 salt rounds
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    const SALT_ROUNDS = 10;
    try {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      return hash;
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} True if password matches
   */
  static async verifyPassword(password, hash) {
    try {
      const isMatch = await bcrypt.compare(password, hash);
      return isMatch;
    } catch (error) {
      console.error('Error verifying password:', error);
      throw new Error('Failed to verify password');
    }
  }

  /**
   * Authenticate admin with username and password
   * @param {string} username - Admin username
   * @param {string} password - Plain text password
   * @returns {Promise<Object|null>} Admin object (without password) if authenticated, null otherwise
   */
  static async authenticate(username, password) {
    try {
      // Find admin by username
      const admin = await Admin.findByUsername(username);
      
      if (!admin) {
        return null;
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, admin.password_hash);
      
      if (!isPasswordValid) {
        return null;
      }

      // Update last login timestamp
      await Admin.updateLastLogin(admin.id);

      // Return admin without password hash
      const { password_hash, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    } catch (error) {
      console.error('Error authenticating admin:', error);
      throw error;
    }
  }

  /**
   * Create session for authenticated admin
   * @param {Object} req - Express request object
   * @param {Object} admin - Admin object
   * @returns {Promise<Object>} Session data
   */
  static async createSession(req, admin) {
    return new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) {
          console.error('Error creating session:', err);
          return reject(new Error('Failed to create session'));
        }

        // Store admin data in session
        req.session.adminId = admin.id;
        req.session.username = admin.username;
        req.session.loginTime = new Date().toISOString();

        req.session.save((err) => {
          if (err) {
            console.error('Error saving session:', err);
            return reject(new Error('Failed to save session'));
          }

          resolve({
            adminId: admin.id,
            username: admin.username,
            loginTime: req.session.loginTime,
            expiresIn: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
          });
        });
      });
    });
  }

  /**
   * Destroy session (logout)
   * @param {Object} req - Express request object
   * @returns {Promise<boolean>} Success status
   */
  static async destroySession(req) {
    return new Promise((resolve, reject) => {
      if (!req.session) {
        return resolve(true);
      }

      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          return reject(new Error('Failed to destroy session'));
        }
        resolve(true);
      });
    });
  }

  /**
   * Check if session is valid
   * @param {Object} req - Express request object
   * @returns {boolean} True if session is valid
   */
  static isSessionValid(req) {
    return !!(req.session && req.session.adminId);
  }

  /**
   * Get current admin from session
   * @param {Object} req - Express request object
   * @returns {Promise<Object|null>} Admin object or null
   */
  static async getCurrentAdmin(req) {
    if (!this.isSessionValid(req)) {
      return null;
    }

    try {
      const admin = await Admin.findById(req.session.adminId);
      if (!admin) {
        return null;
      }

      // Return admin without password hash
      const { password_hash, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    } catch (error) {
      console.error('Error getting current admin:', error);
      return null;
    }
  }
}

module.exports = AuthService;
