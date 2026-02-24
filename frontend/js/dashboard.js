/**
 * LIVE RUSSIA Tester Dashboard - Dashboard Module
 * Handles dashboard statistics, charts, and data visualization
 */

const dashboard = {
  // Refresh intervals
  statsRefreshInterval: null,
  chartsRefreshInterval: null,
  
  // Chart instances
  charts: {
    bugStatus: null,
    bugPriority: null,
    deviceChart: null
  },
  
  // Current data
  currentStats: null,

  /**
   * Initialize dashboard
   */
  init() {
    this.loadDashboardStats();
    this.setupAutoRefresh();
    this.setupCharts();
  },

  /**
   * Load dashboard statistics
   */
  async loadDashboardStats() {
    try {
      const response = await api.get(endpoints.stats.dashboard);
      this.currentStats = response.data || response;
      
      this.updateStatCards();
      this.loadTopTesters();
      this.updateCharts();
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      this.showStatsError();
    }
  },

  /**
   * Update stat cards
   */
  updateStatCards() {
    if (!this.currentStats) return;
    
    const stats = this.currentStats;
    
    // Update stat values
    this.updateStatCard('totalTesters', stats.totalTesters || 0);
    this.updateStatCard('activeTesters', stats.activeTesters24h || 0);
    this.updateStatCard('totalBugs', stats.totalBugs || 0);
    this.updateStatCard('criticalBugs', stats.bugsByPriority?.critical || 0);
  },

  /**
   * Update individual stat card
   */
  updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      // Animate number change
      this.animateNumber(element, parseInt(element.textContent) || 0, value);
    }
  },

  /**
   * Animate number change
   */
  animateNumber(element, from, to, duration = 1000) {
    const startTime = performance.now();
    const difference = to - from;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(from + (difference * easeOutQuart));
      
      element.textContent = utils.formatNumber(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  },

  /**
   * Load top testers
   */
  async loadTopTesters() {
    try {
      const response = await api.get(endpoints.stats.topTesters, { limit: 10 });
      const topTesters = response.topTesters || response.data || [];
      
      this.renderTopTestersTable(topTesters);
    } catch (error) {
      console.error('Failed to load top testers:', error);
      this.showTopTestersError();
    }
  },

  /**
   * Render top testers table
   */
  renderTopTestersTable(testers) {
    const container = document.getElementById('topTestersTable');
    if (!container) return;
    
    if (testers.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">Нет данных о тестерах</p>';
      return;
    }
    
    container.innerHTML = '';
    
    testers.forEach((tester, index) => {
      const row = utils.createElement('div', {
        className: 'tester-row'
      });
      
      // Rank
      const rank = utils.createElement('div', {
        className: 'tester-rank',
        textContent: (index + 1).toString()
      });
      
      // Info
      const info = utils.createElement('div', {
        className: 'tester-info'
      });
      
      const name = utils.createElement('div', {
        className: 'tester-name',
        textContent: tester.name || 'Неизвестный тестер'
      });
      
      const stats = utils.createElement('div', {
        className: 'tester-stats',
        textContent: `${tester.bugsCount || 0} багов • ${tester.deviceType || 'Неизвестно'}`
      });
      
      info.appendChild(name);
      info.appendChild(stats);
      
      // Rating
      const rating = utils.createElement('div', {
        className: 'tester-rating',
        textContent: tester.rating || 0
      });
      
      row.appendChild(rank);
      row.appendChild(info);
      row.appendChild(rating);
      
      // Click handler to view tester details
      row.addEventListener('click', () => {
        this.showTesterDetails(tester.id);
      });
      
      container.appendChild(row);
    });
  },

  /**
   * Setup charts
   */
  setupCharts() {
    this.setupBugStatusChart();
    this.setupBugPriorityChart();
    this.setupDeviceChart();
  },

  /**
   * Setup bug status chart
   */
  setupBugStatusChart() {
    const canvas = document.getElementById('bugStatusChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    this.charts.bugStatus = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Новые', 'В работе', 'Исправлены', 'Закрытые'],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: [
            '#17a2b8', // info
            '#f39c12', // warning
            '#27ae60', // success
            '#6c757d'  // secondary
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  },

  /**
   * Setup bug priority chart
   */
  setupBugPriorityChart() {
    const canvas = document.getElementById('bugPriorityChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    this.charts.bugPriority = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Низкий', 'Средний', 'Высокий', 'Критический'],
        datasets: [{
          label: 'Количество багов',
          data: [0, 0, 0, 0],
          backgroundColor: [
            '#6c757d', // low
            '#17a2b8', // medium
            '#f39c12', // high
            '#dc143c'  // critical
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  },

  /**
   * Setup device chart
   */
  setupDeviceChart() {
    const canvas = document.getElementById('deviceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    this.charts.deviceChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Смартфоны', 'Планшеты'],
        datasets: [{
          data: [0, 0],
          backgroundColor: [
            '#dc143c', // primary red
            '#0039a6'  // primary blue
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  },

  /**
   * Update charts with current data
   */
  updateCharts() {
    if (!this.currentStats) return;
    
    const stats = this.currentStats;
    
    // Update bug status chart
    if (this.charts.bugStatus && stats.bugsByStatus) {
      const statusData = [
        stats.bugsByStatus.new || 0,
        stats.bugsByStatus.in_progress || 0,
        stats.bugsByStatus.fixed || 0,
        stats.bugsByStatus.closed || 0
      ];
      
      this.charts.bugStatus.data.datasets[0].data = statusData;
      this.charts.bugStatus.update('active');
    }
    
    // Update bug priority chart
    if (this.charts.bugPriority && stats.bugsByPriority) {
      const priorityData = [
        stats.bugsByPriority.low || 0,
        stats.bugsByPriority.medium || 0,
        stats.bugsByPriority.high || 0,
        stats.bugsByPriority.critical || 0
      ];
      
      this.charts.bugPriority.data.datasets[0].data = priorityData;
      this.charts.bugPriority.update('active');
    }
    
    // Update device chart
    if (this.charts.deviceChart && stats.testersByDevice) {
      const deviceData = [
        stats.testersByDevice.smartphone || 0,
        stats.testersByDevice.tablet || 0
      ];
      
      this.charts.deviceChart.data.datasets[0].data = deviceData;
      this.charts.deviceChart.update('active');
    }
  },

  /**
   * Setup auto refresh
   */
  setupAutoRefresh() {
    // Refresh stats every 30 seconds
    this.statsRefreshInterval = setInterval(() => {
      this.loadDashboardStats();
    }, 30000);
    
    // Refresh charts every 60 seconds
    this.chartsRefreshInterval = setInterval(() => {
      this.updateCharts();
    }, 60000);
  },

  /**
   * Show stats error
   */
  showStatsError() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
      const statInfo = card.querySelector('.stat-info h3');
      if (statInfo) {
        statInfo.textContent = '-';
      }
    });
    
    utils.showError('Не удалось загрузить статистику дашборда');
  },

  /**
   * Show top testers error
   */
  showTopTestersError() {
    const container = document.getElementById('topTestersTable');
    if (container) {
      container.innerHTML = '<p class="text-center text-danger">Ошибка загрузки данных</p>';
    }
  },

  /**
   * Show tester details
   */
  showTesterDetails(testerId) {
    // Navigate to testers section and show specific tester
    if (window.sidebar) {
      sidebar.navigateToSection('testers');
    }
    
    // Highlight specific tester (will be implemented in testers module)
    if (window.testers && testers.showTesterDetails) {
      setTimeout(() => {
        testers.showTesterDetails(testerId);
      }, 500);
    }
  },

  /**
   * Refresh dashboard data
   */
  refresh() {
    this.loadDashboardStats();
  },

  /**
   * Destroy dashboard (cleanup)
   */
  destroy() {
    // Clear intervals
    if (this.statsRefreshInterval) {
      clearInterval(this.statsRefreshInterval);
      this.statsRefreshInterval = null;
    }
    
    if (this.chartsRefreshInterval) {
      clearInterval(this.chartsRefreshInterval);
      this.chartsRefreshInterval = null;
    }
    
    // Destroy charts
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    
    this.charts = {
      bugStatus: null,
      bugPriority: null,
      deviceChart: null
    };
  }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if we're on the dashboard page
  if (document.getElementById('dashboardContent')) {
    dashboard.init();
  }
});

// Cleanup when page is unloaded
window.addEventListener('beforeunload', () => {
  dashboard.destroy();
});

// Export for use in other modules
window.dashboard = dashboard;
