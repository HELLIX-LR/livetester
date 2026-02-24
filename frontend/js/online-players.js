// Online Players Chart Module
let chart = null;
let currentPeriod = '24h';
let refreshInterval = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializePeriodButtons();
    loadOnlinePlayersData(currentPeriod);
    startAutoRefresh();
});

// Initialize period filter buttons
function initializePeriodButtons() {
    const periodButtons = document.querySelectorAll('.period-btn');
    
    periodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            periodButtons.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Update current period and reload data
            currentPeriod = btn.dataset.period;
            loadOnlinePlayersData(currentPeriod);
        });
    });
}

// Load online players data
async function loadOnlinePlayersData(period) {
    try {
        const response = await api.get(`/api/online-players?period=${period}`);
        
        if (response.success) {
            renderChart(response.data.data, period);
            updateStatistics(response.data);
            updateLastUpdateTime();
        } else {
            showError('Failed to load online players data');
        }
    } catch (error) {
        console.error('Error loading online players data:', error);
        showError('Error loading online players data');
    }
}

// Render chart with Chart.js
function renderChart(data, period) {
    const ctx = document.getElementById('onlinePlayersChart');
    
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (chart) {
        chart.destroy();
    }
    
    // Prepare data for chart
    const labels = data.map(item => formatTimestamp(item.timestamp, period));
    const values = data.map(item => item.count);
    
    // Create gradient
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(52, 152, 219, 0.5)');
    gradient.addColorStop(1, 'rgba(52, 152, 219, 0.0)');
    
    // Create chart
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Players Online',
                data: values,
                borderColor: '#3498db',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: '#3498db',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-primary').trim(),
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#3498db',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `Players: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-secondary').trim(),
                        maxRotation: 45,
                        minRotation: 0
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-secondary').trim(),
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Format timestamp based on period
function formatTimestamp(timestamp, period) {
    const date = new Date(timestamp);
    
    if (period === '1h' || period === '6h') {
        // Show time only for short periods
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (period === '24h') {
        // Show time for 24h period
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else {
        // Show date and time for 7d period
        return date.toLocaleDateString('ru-RU', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit'
        });
    }
}

// Update statistics cards
function updateStatistics(data) {
    const { data: playerData, peak, current, average } = data;
    
    // Update current players
    const currentPlayersEl = document.getElementById('currentPlayers');
    if (currentPlayersEl && current !== undefined) {
        currentPlayersEl.textContent = current.toLocaleString();
    }
    
    // Update peak players
    const peakPlayersEl = document.getElementById('peakPlayers');
    if (peakPlayersEl && peak) {
        peakPlayersEl.textContent = peak.count.toLocaleString();
    }
    
    // Update peak time
    const peakTimeEl = document.getElementById('peakTime');
    if (peakTimeEl && peak) {
        const peakDate = new Date(peak.timestamp);
        peakTimeEl.textContent = peakDate.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Update average players
    const avgPlayersEl = document.getElementById('avgPlayers');
    if (avgPlayersEl && average !== undefined) {
        avgPlayersEl.textContent = Math.round(average).toLocaleString();
    }
}

// Update last update time
function updateLastUpdateTime() {
    const lastUpdateEl = document.getElementById('lastUpdate');
    if (lastUpdateEl) {
        const now = new Date();
        lastUpdateEl.textContent = now.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

// Start auto-refresh every 60 seconds
function startAutoRefresh() {
    // Clear existing interval if any
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Set new interval for 60 seconds
    refreshInterval = setInterval(() => {
        loadOnlinePlayersData(currentPeriod);
    }, 60000);
}

// Stop auto-refresh (cleanup)
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Show error message
function showError(message) {
    const chartBody = document.querySelector('.chart-body');
    if (chartBody) {
        chartBody.innerHTML = `
            <div class="chart-loading">
                <i class="fas fa-exclamation-triangle" style="color: var(--danger-color);"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
    if (chart) {
        chart.destroy();
    }
});
