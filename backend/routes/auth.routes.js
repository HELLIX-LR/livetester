const express = require('express');
const router = express.Router();
const AuthService = require('../services/auth.service');

/**
 * POST /api/auth/login
 * Login endpoint - authenticates admin and creates session
 * 
 * Request body:
 * {
 *   "username": "admin",
 *   "password": "password123"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "adminId": 1,
 *     "username": "admin",
 *     "loginTime": "2024-01-15T10:30:00.000Z",
 *     "expiresIn": 86400000
 *   }
 * }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username and password are required',
          details: [
            ...(!username ? [{ field: 'username', message: 'Username is required' }] : []),
            ...(!password ? [{ field: 'password', message: 'Password is required' }] : [])
          ]
        }
      });
    }

    // Authenticate admin
    const admin = await AuthService.authenticate(username, password);

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid username or password'
        }
      });
    }

    // Create session
    const sessionData = await AuthService.createSession(req, admin);

    res.json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during login'
      }
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout endpoint - destroys session
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Logged out successfully"
 * }
 */
router.post('/logout', async (req, res) => {
  try {
    await AuthService.destroySession(req);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during logout'
      }
    });
  }
});

/**
 * GET /api/auth/session
 * Check session endpoint - verifies if user has active session
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "authenticated": true,
 *     "admin": {
 *       "id": 1,
 *       "username": "admin",
 *       "email": "admin@example.com"
 *     }
 *   }
 * }
 */
router.get('/session', async (req, res) => {
  try {
    const isValid = AuthService.isSessionValid(req);

    if (!isValid) {
      return res.json({
        success: true,
        data: {
          authenticated: false,
          admin: null
        }
      });
    }

    const admin = await AuthService.getCurrentAdmin(req);

    if (!admin) {
      return res.json({
        success: true,
        data: {
          authenticated: false,
          admin: null
        }
      });
    }

    res.json({
      success: true,
      data: {
        authenticated: true,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          lastLogin: admin.last_login
        }
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while checking session'
      }
    });
  }
});

module.exports = router;
