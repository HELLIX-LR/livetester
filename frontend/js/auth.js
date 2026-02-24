/**
 * LIVE RUSSIA Tester Dashboard - Authentication Module
 * Handles user authentication and session management
 */

const auth = {
  // Current user data
  currentUser: null,
  
  // Session check interval
  sessionCheckInterval: null,

  /**
   * Initialize authentication module
   */
  init() {
    this.checkSession();
    this.setupSessionCheck();
    this.setupLoginForm();
  },

  /**
   * Login with username and password
   */
  async login(username, password) {
    try {
      // Show loading state
      this.setLoginLoading(true);
      this.clearLoginError();

      const response = await api.post(endpoints.auth.login, {
        username: username.trim(),
        password: password
      });

      if (response.success) {
        // Store authentication data
        if (response.token) {
          sessionStorage.setItem('authToken', response.token);
        }
        
        if (response.user) {
          this.currentUser = response.user;
          sessionStorage.setItem('currentUser', JSON.stringify(response.user));
        }

        // Show success message
        notifications.show('Успешный вход', 'Добро пожаловать в панель управления!', 'success');

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);

        return { success: true };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      
      let errorMessage = 'Произошла ошибка при входе в систему';
      
      if (error instanceof APIError) {
        switch (error.code) {
          case 'UNAUTHORIZED':
            errorMessage = 'Неверное имя пользователя или пароль';
            break;
          case 'VALIDATION_ERROR':
            errorMessage = 'Пожалуйста, заполните все поля';
            break;
          case 'NETWORK_ERROR':
            errorMessage = 'Ошибка сети. Проверьте подключение к интернету';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }

      this.showLoginError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      this.setLoginLoading(false);
    }
  },

  /**
   * Logout current user
   */
  async logout() {
    try {
      // Call logout API
      await api.post(endpoints.auth.logout);
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    }

    // Clear local session data
    this.clearSession();

    // Show logout message
    notifications.show('Выход выполнен', 'Вы успешно вышли из системы', 'info');

    // Redirect to login
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
  },

  /**
   * Check if user session is valid
   */
  async checkSession() {
    try {
      const response = await api.get(endpoints.auth.session);
      
      if (response.valid && response.user) {
        this.currentUser = response.user;
        sessionStorage.setItem('currentUser', JSON.stringify(response.user));
        return true;
      } else {
        this.clearSession();
        return false;
      }
    } catch (error) {
      console.error('Session check failed:', error);
      this.clearSession();
      return false;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!(sessionStorage.getItem('authToken') || this.currentUser);
  },

  /**
   * Get current user data
   */
  getCurrentUser() {
    if (!this.currentUser) {
      const userData = sessionStorage.getItem('currentUser');
      if (userData) {
        try {
          this.currentUser = JSON.parse(userData);
        } catch (error) {
          console.error('Failed to parse user data:', error);
        }
      }
    }
    return this.currentUser;
  },

  /**
   * Clear session data
   */
  clearSession() {
    this.currentUser = null;
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  },

  /**
   * Redirect to login page
   */
  redirectToLogin() {
    this.clearSession();
    
    // Don't redirect if already on login page
    if (!window.location.pathname.includes('login.html')) {
      window.location.href = 'login.html';
    }
  },

  /**
   * Require authentication for current page
   */
  async requireAuth() {
    if (!this.isAuthenticated()) {
      this.redirectToLogin();
      return false;
    }

    const isValid = await this.checkSession();
    if (!isValid) {
      this.redirectToLogin();
      return false;
    }

    return true;
  },

  /**
   * Setup periodic session checking
   */
  setupSessionCheck() {
    // Check session every 5 minutes
    this.sessionCheckInterval = setInterval(async () => {
      const isValid = await this.checkSession();
      if (!isValid && this.isAuthenticated()) {
        notifications.show(
          'Сессия истекла', 
          'Ваша сессия истекла. Пожалуйста, войдите снова.', 
          'warning'
        );
        setTimeout(() => this.redirectToLogin(), 2000);
      }
    }, 5 * 60 * 1000); // 5 minutes
  },

  /**
   * Setup login form handling
   */
  setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      if (!username.trim() || !password.trim()) {
        this.showLoginError('Пожалуйста, заполните все поля');
        return;
      }

      await this.login(username, password);
    });

    // Setup logout button if present
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  },

  /**
   * Show login loading state
   */
  setLoginLoading(loading) {
    const submitBtn = document.querySelector('.btn-login');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoading = submitBtn?.querySelector('.btn-loading');
    
    if (submitBtn) {
      submitBtn.disabled = loading;
      
      if (btnText && btnLoading) {
        if (loading) {
          btnText.style.display = 'none';
          btnLoading.style.display = 'flex';
        } else {
          btnText.style.display = 'block';
          btnLoading.style.display = 'none';
        }
      }
    }
  },

  /**
   * Show login error message
   */
  showLoginError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.clearLoginError();
      }, 5000);
    }
  },

  /**
   * Clear login error message
   */
  clearLoginError() {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  },

  /**
   * Update user display in header
   */
  updateUserDisplay() {
    const user = this.getCurrentUser();
    const userNameElement = document.getElementById('currentUser');
    
    if (userNameElement && user) {
      userNameElement.textContent = user.username || 'Администратор';
    }
  }
};

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  auth.init();
  
  // Check authentication for dashboard pages
  if (window.location.pathname.includes('dashboard.html')) {
    auth.requireAuth().then(isAuthenticated => {
      if (isAuthenticated) {
        auth.updateUserDisplay();
      }
    });
  }
});

// Export for use in other modules
window.auth = auth;
