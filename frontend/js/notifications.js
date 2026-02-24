/**
 * LIVE RUSSIA Tester Dashboard - Notifications Module
 * Handles in-app notifications and notification history
 */

const notifications = {
  // Notification container
  container: null,
  
  // Active notifications
  activeNotifications: new Map(),
  
  // Notification counter
  notificationCounter: 0,
  
  // Auto-dismiss timeout
  defaultTimeout: 10000, // 10 seconds

  /**
   * Initialize notifications module
   */
  init() {
    this.createContainer();
    this.setupNotificationBell();
    this.loadUnreadCount();
  },

  /**
   * Create notification container
   */
  createContainer() {
    this.container = document.getElementById('notificationContainer');
    if (!this.container) {
      this.container = utils.createElement('div', {
        id: 'notificationContainer',
        className: 'notification-container'
      });
      document.body.appendChild(this.container);
    }
  },

  /**
   * Show notification
   */
  show(title, message, type = 'info', options = {}) {
    const id = `notification-${++this.notificationCounter}`;
    const timeout = options.timeout !== undefined ? options.timeout : this.defaultTimeout;
    const persistent = options.persistent || false;
    
    // Create notification element
    const notification = this.createNotificationElement(id, title, message, type, persistent);
    
    // Add to container
    this.container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Store reference
    this.activeNotifications.set(id, {
      element: notification,
      type,
      title,
      message,
      timestamp: new Date()
    });
    
    // Auto-dismiss if not persistent
    if (!persistent && timeout > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, timeout);
    }
    
    // Play notification sound (optional)
    if (options.sound) {
      this.playNotificationSound(type);
    }
    
    return id;
  },

  /**
   * Create notification element
   */
  createNotificationElement(id, title, message, type, persistent) {
    const notification = utils.createElement('div', {
      id: id,
      className: `notification ${type}`
    });
    
    // Notification content
    const content = utils.createElement('div', {
      className: 'notification-content'
    });
    
    // Title
    if (title) {
      const titleElement = utils.createElement('div', {
        className: 'notification-title',
        textContent: title
      });
      content.appendChild(titleElement);
    }
    
    // Message
    if (message) {
      const messageElement = utils.createElement('div', {
        className: 'notification-message',
        textContent: message
      });
      content.appendChild(messageElement);
    }
    
    // Timestamp
    const timestamp = utils.createElement('div', {
      className: 'notification-timestamp',
      textContent: utils.formatTime(new Date())
    });
    content.appendChild(timestamp);
    
    notification.appendChild(content);
    
    // Close button (always show for persistent notifications)
    if (persistent || true) {
      const closeBtn = utils.createElement('button', {
        className: 'notification-close',
        innerHTML: '×',
        'aria-label': 'Закрыть уведомление'
      });
      
      closeBtn.addEventListener('click', () => {
        this.dismiss(id);
      });
      
      notification.appendChild(closeBtn);
    }
    
    return notification;
  },

  /**
   * Dismiss notification
   */
  dismiss(id) {
    const notificationData = this.activeNotifications.get(id);
    if (!notificationData) return;
    
    const { element } = notificationData;
    
    // Animate out
    element.classList.add('dismissing');
    
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.activeNotifications.delete(id);
    }, 300);
  },

  /**
   * Dismiss all notifications
   */
  dismissAll() {
    this.activeNotifications.forEach((_, id) => {
      this.dismiss(id);
    });
  },

  /**
   * Show success notification
   */
  success(title, message, options = {}) {
    return this.show(title, message, 'success', options);
  },

  /**
   * Show error notification
   */
  error(title, message, options = {}) {
    return this.show(title, message, 'error', { 
      persistent: true, 
      ...options 
    });
  },

  /**
   * Show warning notification
   */
  warning(title, message, options = {}) {
    return this.show(title, message, 'warning', options);
  },

  /**
   * Show info notification
   */
  info(title, message, options = {}) {
    return this.show(title, message, 'info', options);
  },

  /**
   * Setup notification bell
   */
  setupNotificationBell() {
    const notificationBell = document.getElementById('notificationBell');
    if (!notificationBell) return;
    
    notificationBell.addEventListener('click', () => {
      this.showNotificationHistory();
    });
  },

  /**
   * Load unread notification count
   */
  async loadUnreadCount() {
    try {
      const response = await api.get(endpoints.notifications.unread);
      this.updateNotificationCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  },

  /**
   * Update notification count in UI
   */
  updateNotificationCount(count) {
    const countElement = document.getElementById('notificationCount');
    if (countElement) {
      countElement.textContent = count;
      countElement.style.display = count > 0 ? 'block' : 'none';
    }
  },

  /**
   * Show notification history modal
   */
  async showNotificationHistory() {
    try {
      const response = await api.get(endpoints.notifications.list);
      const notifications = response.notifications || [];
      
      this.createHistoryModal(notifications);
    } catch (error) {
      console.error('Failed to load notification history:', error);
      this.error('Ошибка', 'Не удалось загрузить историю уведомлений');
    }
  },

  /**
   * Create notification history modal
   */
  createHistoryModal(notifications) {
    // Create modal
    const modal = utils.createElement('div', {
      className: 'modal-container show'
    });
    
    const modalDialog = utils.createElement('div', {
      className: 'modal'
    });
    
    // Modal header
    const modalHeader = utils.createElement('div', {
      className: 'modal-header'
    });
    
    const modalTitle = utils.createElement('h3', {
      className: 'modal-title',
      textContent: 'История уведомлений'
    });
    
    const closeBtn = utils.createElement('button', {
      className: 'modal-close',
      innerHTML: '×'
    });
    
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeBtn);
    
    // Modal body
    const modalBody = utils.createElement('div', {
      className: 'modal-body'
    });
    
    if (notifications.length === 0) {
      modalBody.appendChild(utils.createElement('p', {
        textContent: 'Нет уведомлений',
        className: 'text-center text-muted'
      }));
    } else {
      const notificationsList = utils.createElement('div', {
        className: 'notifications-history'
      });
      
      notifications.forEach(notification => {
        const item = this.createHistoryItem(notification);
        notificationsList.appendChild(item);
      });
      
      modalBody.appendChild(notificationsList);
    }
    
    // Modal footer
    const modalFooter = utils.createElement('div', {
      className: 'modal-footer'
    });
    
    const markAllReadBtn = utils.createElement('button', {
      className: 'btn btn-secondary',
      textContent: 'Отметить все как прочитанные'
    });
    
    markAllReadBtn.addEventListener('click', async () => {
      await this.markAllAsRead();
      modal.remove();
    });
    
    modalFooter.appendChild(markAllReadBtn);
    
    // Assemble modal
    modalDialog.appendChild(modalHeader);
    modalDialog.appendChild(modalBody);
    modalDialog.appendChild(modalFooter);
    modal.appendChild(modalDialog);
    
    // Add to page
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  },

  /**
   * Create history item
   */
  createHistoryItem(notification) {
    const item = utils.createElement('div', {
      className: `notification-history-item ${notification.isRead ? 'read' : 'unread'}`
    });
    
    const content = utils.createElement('div', {
      className: 'notification-history-content'
    });
    
    const title = utils.createElement('div', {
      className: 'notification-history-title',
      textContent: notification.title
    });
    
    const message = utils.createElement('div', {
      className: 'notification-history-message',
      textContent: notification.message
    });
    
    const timestamp = utils.createElement('div', {
      className: 'notification-history-timestamp',
      textContent: utils.formatRelativeTime(notification.createdAt)
    });
    
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(timestamp);
    
    const actions = utils.createElement('div', {
      className: 'notification-history-actions'
    });
    
    if (!notification.isRead) {
      const markReadBtn = utils.createElement('button', {
        className: 'btn btn-sm btn-secondary',
        textContent: 'Прочитано'
      });
      
      markReadBtn.addEventListener('click', async () => {
        await this.markAsRead(notification.id);
        item.classList.add('read');
        item.classList.remove('unread');
        markReadBtn.remove();
      });
      
      actions.appendChild(markReadBtn);
    }
    
    const deleteBtn = utils.createElement('button', {
      className: 'btn btn-sm btn-danger',
      textContent: 'Удалить'
    });
    
    deleteBtn.addEventListener('click', async () => {
      await this.deleteNotification(notification.id);
      item.remove();
    });
    
    actions.appendChild(deleteBtn);
    
    item.appendChild(content);
    item.appendChild(actions);
    
    return item;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      await api.patch(endpoints.notifications.markRead(notificationId));
      await this.loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const response = await api.get(endpoints.notifications.unread);
      const unreadNotifications = response.notifications || [];
      
      await Promise.all(
        unreadNotifications.map(notification => 
          this.markAsRead(notification.id)
        )
      );
      
      this.updateNotificationCount(0);
      this.success('Успешно', 'Все уведомления отмечены как прочитанные');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      this.error('Ошибка', 'Не удалось отметить уведомления как прочитанные');
    }
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    try {
      await api.delete(endpoints.notifications.delete(notificationId));
      await this.loadUnreadCount();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      this.error('Ошибка', 'Не удалось удалить уведомление');
    }
  },

  /**
   * Play notification sound
   */
  playNotificationSound(type) {
    // Create audio context if supported
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      try {
        const audioContext = new (AudioContext || webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Different frequencies for different types
        const frequencies = {
          success: 800,
          error: 400,
          warning: 600,
          info: 500
        };
        
        oscillator.frequency.setValueAtTime(frequencies[type] || 500, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        console.warn('Could not play notification sound:', error);
      }
    }
  },

  /**
   * Request notification permission
   */
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  /**
   * Show browser notification
   */
  showBrowserNotification(title, message, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: '/assets/favicon.ico',
        badge: '/assets/favicon.ico',
        ...options
      });
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
      
      return notification;
    }
    return null;
  }
};

// Initialize notifications when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  notifications.init();
});

// Export for use in other modules
window.notifications = notifications;
