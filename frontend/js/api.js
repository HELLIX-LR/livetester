/**
 * LIVE RUSSIA Tester Dashboard - API Module
 * Handles all HTTP requests to the backend API
 */

const API_BASE_URL = '/api';

class APIError extends Error {
  constructor(message, status, code, details = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const api = {
  /**
   * Base request method with error handling and authentication
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add authentication token if available
    const token = sessionStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      headers,
      credentials: 'include', // Include cookies for session-based auth
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType && contentType.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.blob();
      }

      if (!response.ok) {
        // Handle different error types
        if (response.status === 401) {
          // Unauthorized - redirect to login
          auth.redirectToLogin();
          throw new APIError('Unauthorized', 401, 'UNAUTHORIZED');
        }
        
        if (response.status === 403) {
          throw new APIError('Forbidden', 403, 'FORBIDDEN');
        }
        
        if (response.status === 404) {
          throw new APIError('Not Found', 404, 'NOT_FOUND');
        }
        
        if (response.status >= 500) {
          throw new APIError('Server Error', response.status, 'SERVER_ERROR');
        }

        // Extract error details from response
        const errorMessage = data?.error?.message || data?.message || 'Request failed';
        const errorCode = data?.error?.code || 'REQUEST_FAILED';
        const errorDetails = data?.error?.details || null;
        
        throw new APIError(errorMessage, response.status, errorCode, errorDetails);
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      // Network or other errors
      console.error('API request failed:', error);
      throw new APIError('Network error', 0, 'NETWORK_ERROR');
    }
  },

  /**
   * GET request
   */
  get(endpoint, params = {}, options = {}) {
    const searchParams = new URLSearchParams(params);
    const url = searchParams.toString() ? `${endpoint}?${searchParams}` : endpoint;
    
    return this.request(url, { 
      ...options, 
      method: 'GET' 
    });
  },

  /**
   * POST request
   */
  post(endpoint, body = null, options = {}) {
    const config = { 
      ...options, 
      method: 'POST' 
    };
    
    if (body !== null) {
      if (body instanceof FormData) {
        // Don't set Content-Type for FormData, let browser set it
        delete config.headers?.['Content-Type'];
        config.body = body;
      } else {
        config.body = JSON.stringify(body);
      }
    }
    
    return this.request(endpoint, config);
  },

  /**
   * PUT request
   */
  put(endpoint, body = null, options = {}) {
    const config = { 
      ...options, 
      method: 'PUT' 
    };
    
    if (body !== null) {
      config.body = JSON.stringify(body);
    }
    
    return this.request(endpoint, config);
  },

  /**
   * PATCH request
   */
  patch(endpoint, body = null, options = {}) {
    const config = { 
      ...options, 
      method: 'PATCH' 
    };
    
    if (body !== null) {
      config.body = JSON.stringify(body);
    }
    
    return this.request(endpoint, config);
  },

  /**
   * DELETE request
   */
  delete(endpoint, body = null, options = {}) {
    const config = { 
      ...options, 
      method: 'DELETE' 
    };
    
    if (body !== null) {
      config.body = JSON.stringify(body);
    }
    
    return this.request(endpoint, config);
  },

  /**
   * Upload file
   */
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional form data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });
    
    return this.post(endpoint, formData);
  },

  /**
   * Download file
   */
  async downloadFile(endpoint, filename = null) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }
};

// API endpoints organized by feature
const endpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    session: '/auth/session'
  },
  
  // Testers
  testers: {
    list: '/testers',
    create: '/testers',
    get: (id) => `/testers/${id}`,
    update: (id) => `/testers/${id}`,
    delete: (id) => `/testers/${id}`,
    bugs: (id) => `/testers/${id}/bugs`,
    activity: (id) => `/testers/${id}/activity`,
    top: '/testers/top'
  },
  
  // Bugs
  bugs: {
    list: '/bugs',
    create: '/bugs',
    get: (id) => `/bugs/${id}`,
    update: (id) => `/bugs/${id}`,
    delete: (id) => `/bugs/${id}`,
    updateStatus: (id) => `/bugs/${id}/status`,
    updatePriority: (id) => `/bugs/${id}/priority`,
    comments: (id) => `/bugs/${id}/comments`,
    addComment: (id) => `/bugs/${id}/comments`,
    updateComment: (id, commentId) => `/bugs/${id}/comments/${commentId}`,
    deleteComment: (id, commentId) => `/bugs/${id}/comments/${commentId}`,
    screenshots: (id) => `/bugs/${id}/screenshots`,
    uploadScreenshot: (id) => `/bugs/${id}/screenshots`,
    deleteScreenshot: (id, screenshotId) => `/bugs/${id}/screenshots/${screenshotId}`
  },
  
  // Statistics
  stats: {
    dashboard: '/statistics/dashboard',
    servers: '/servers',
    onlinePlayers: '/online-players',
    bugs: '/statistics/bugs',
    topTesters: '/statistics/testers/top',
    averageFixTime: '/statistics/bugs/average-fix-time'
  },
  
  // Export
  export: {
    testersCSV: '/export/testers',
    testersPDF: '/export/testers',
    bugsCSV: '/export/bugs',
    bugsPDF: '/export/bugs'
  },
  
  // Notifications
  notifications: {
    list: '/notifications',
    unread: '/notifications/unread',
    markRead: (id) => `/notifications/${id}/read`,
    delete: (id) => `/notifications/${id}`
  }
};

// Export for use in other modules
window.api = api;
window.endpoints = endpoints;
window.APIError = APIError;
