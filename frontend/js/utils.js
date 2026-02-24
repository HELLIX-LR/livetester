/**
 * LIVE RUSSIA Tester Dashboard - Utility Functions
 * Common utility functions used throughout the application
 */

const utils = {
  /**
   * Date and Time Formatting
   */
  formatDate(date, options = {}) {
    if (!date) return '-';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    return dateObj.toLocaleDateString('ru-RU', { ...defaultOptions, ...options });
  },

  formatDateTime(date, options = {}) {
    if (!date) return '-';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return dateObj.toLocaleString('ru-RU', { ...defaultOptions, ...options });
  },

  formatTime(date) {
    if (!date) return '-';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    
    return dateObj.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatRelativeTime(date) {
    if (!date) return '-';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    
    const now = new Date();
    const diffMs = now - dateObj;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'только что';
    if (diffMinutes < 60) return `${diffMinutes} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    
    return this.formatDate(date);
  },

  /**
   * Number Formatting
   */
  formatNumber(number, options = {}) {
    if (typeof number !== 'number' || isNaN(number)) return '0';
    
    return number.toLocaleString('ru-RU', options);
  },

  formatPercent(value, total) {
    if (!total || total === 0) return '0%';
    const percent = (value / total) * 100;
    return `${Math.round(percent)}%`;
  },

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Б';
    
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  /**
   * String Utilities
   */
  truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
  },

  capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  },

  /**
   * Validation
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * DOM Utilities
   */
  createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.keys(attributes).forEach(key => {
      if (key === 'className') {
        element.className = attributes[key];
      } else if (key === 'innerHTML') {
        element.innerHTML = attributes[key];
      } else if (key === 'textContent') {
        element.textContent = attributes[key];
      } else {
        element.setAttribute(key, attributes[key]);
      }
    });
    
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });
    
    return element;
  },

  show(element) {
    if (element) {
      element.style.display = '';
      element.classList.remove('d-none');
    }
  },

  hide(element) {
    if (element) {
      element.style.display = 'none';
      element.classList.add('d-none');
    }
  },

  toggle(element) {
    if (element) {
      if (element.style.display === 'none' || element.classList.contains('d-none')) {
        this.show(element);
      } else {
        this.hide(element);
      }
    }
  },

  /**
   * Array Utilities
   */
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  sortBy(array, key, direction = 'asc') {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  },

  /**
   * Local Storage Utilities
   */
  setLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  },

  getLocalStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return defaultValue;
    }
  },

  removeLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
      return false;
    }
  },

  /**
   * URL Utilities
   */
  getUrlParams() {
    return new URLSearchParams(window.location.search);
  },

  setUrlParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.replaceState({}, '', url);
  },

  removeUrlParam(key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.replaceState({}, '', url);
  },

  /**
   * Debounce and Throttle
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Status and Priority Helpers
   */
  getStatusBadgeClass(status) {
    const statusClasses = {
      'active': 'status-badge active',
      'inactive': 'status-badge inactive',
      'suspended': 'status-badge suspended',
      'new': 'status-badge new',
      'in_progress': 'status-badge in_progress',
      'fixed': 'status-badge fixed',
      'closed': 'status-badge closed'
    };
    return statusClasses[status] || 'status-badge';
  },

  getPriorityBadgeClass(priority) {
    const priorityClasses = {
      'low': 'priority-badge low',
      'medium': 'priority-badge medium',
      'high': 'priority-badge high',
      'critical': 'priority-badge critical'
    };
    return priorityClasses[priority] || 'priority-badge';
  },

  getStatusText(status) {
    const statusTexts = {
      'active': 'Активный',
      'inactive': 'Неактивный',
      'suspended': 'Заблокирован',
      'new': 'Новый',
      'in_progress': 'В работе',
      'fixed': 'Исправлен',
      'closed': 'Закрыт'
    };
    return statusTexts[status] || status;
  },

  getPriorityText(priority) {
    const priorityTexts = {
      'low': 'Низкий',
      'medium': 'Средний',
      'high': 'Высокий',
      'critical': 'Критический'
    };
    return priorityTexts[priority] || priority;
  },

  getTypeText(type) {
    const typeTexts = {
      'ui': 'UI',
      'functionality': 'Функциональность',
      'performance': 'Производительность',
      'crash': 'Краш',
      'security': 'Безопасность',
      'other': 'Другое'
    };
    return typeTexts[type] || type;
  },

  /**
   * Error Handling
   */
  showError(message, title = 'Ошибка') {
    console.error(`${title}: ${message}`);
    if (window.notifications) {
      notifications.show(title, message, 'error');
    } else {
      alert(`${title}: ${message}`);
    }
  },

  showSuccess(message, title = 'Успешно') {
    console.log(`${title}: ${message}`);
    if (window.notifications) {
      notifications.show(title, message, 'success');
    }
  },

  showWarning(message, title = 'Предупреждение') {
    console.warn(`${title}: ${message}`);
    if (window.notifications) {
      notifications.show(title, message, 'warning');
    }
  },

  showInfo(message, title = 'Информация') {
    console.info(`${title}: ${message}`);
    if (window.notifications) {
      notifications.show(title, message, 'info');
    }
  },

  /**
   * Loading States
   */
  showLoading(element, text = 'Загрузка...') {
    if (!element) return;
    
    const spinner = this.createElement('div', {
      className: 'loading-spinner'
    });
    
    const loadingText = this.createElement('div', {
      className: 'loading-text',
      textContent: text
    });
    
    const loadingContainer = this.createElement('div', {
      className: 'loading-container'
    }, [spinner, loadingText]);
    
    element.innerHTML = '';
    element.appendChild(loadingContainer);
  },

  hideLoading(element) {
    if (!element) return;
    
    const loadingContainer = element.querySelector('.loading-container');
    if (loadingContainer) {
      loadingContainer.remove();
    }
  },

  /**
   * Copy to Clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showSuccess('Скопировано в буфер обмена');
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      this.showError('Не удалось скопировать в буфер обмена');
      return false;
    }
  }
};

// Export for use in other modules
window.utils = utils;
