const AuthService = require('../services/auth.service');

/**
 * Authentication Middleware
 * Protects routes by checking for valid session
 * Redirects to login page if not authenticated (for HTML requests)
 * Returns 401 error for API requests
 */

/**
 * Require authentication middleware
 * Checks if user has valid session, otherwise returns 401 or redirects
 */
const requireAuth = (req, res, next) => {
  // Check if session is valid
  if (!AuthService.isSessionValid(req)) {
    // Check if this is an API request or HTML page request
    const isApiRequest = req.path.startsWith('/api/');
    
    if (isApiRequest) {
      // For API requests, return 401 JSON response
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please log in.'
        }
      });
    } else {
      // For HTML page requests, redirect to login
      return res.redirect('/login.html');
    }
  }

  // Session is valid, proceed to next middleware
  next();
};

/**
 * Optional authentication middleware
 * Attaches admin info to request if authenticated, but doesn't block
 */
const optionalAuth = async (req, res, next) => {
  if (AuthService.isSessionValid(req)) {
    try {
      const admin = await AuthService.getCurrentAdmin(req);
      req.admin = admin;
    } catch (error) {
      console.error('Error loading admin in optionalAuth:', error);
    }
  }
  next();
};

/**
 * Check if user is already authenticated
 * Redirects to dashboard if already logged in (useful for login page)
 */
const redirectIfAuthenticated = (req, res, next) => {
  if (AuthService.isSessionValid(req)) {
    return res.redirect('/dashboard.html');
  }
  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  redirectIfAuthenticated
};
