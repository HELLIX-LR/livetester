// Server Statistics Module
let refreshInterval = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadServerStats();
    startAutoRefresh();
});

// Load server statistics
async function loadServerStats() {
    try {
        const response = await api.get('/api/servers');
        
        if (response.success) {
            renderServerCards(response.data);
            updateLastUpdateTime();
        } else {
            showError('Failed to load server statistics');
        }
    } catch (error) {
        console.error('Error loading server stats:', error);
        showError('Error loading server statistics');
    }
}

// Render server cards
function renderServerCards(servers) {
    const serversGrid = document.getElementById('serversGrid');
    
    if (!servers || servers.length === 0) {
        serversGrid.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-server"></i>
                <p>No servers found</p>
            </div>
        `;
        return;
    }

    serversGrid.innerHTML = servers.map(server => `
        <div class="server-card ${server.status}">
            <div class="server-header">
                <div class="server-name">
                    <i class="fas fa-server"></i>
                    ${server.name}
                </div>
                <div class="server-status ${server.status}">
                    <i class="fas fa-circle"></i>
                    ${getStatusText(server.status)}
                </div>
            </div>

            <div class="server-metrics">
                <div class="metric">
                    <div class="metric-label">
                        <i class="fas fa-tachometer-alt"></i>
                        Load
                    </div>
                    <div class="metric-value ${getLoadClass(server.load_percentage)}">
                        ${server.load_percentage}%
                    </div>
                </div>

                <div class="metric">
                    <div class="metric-label">
                        <i class="fas fa-clock"></i>
                        Response Time
                    </div>
                    <div class="metric-value ${getResponseTimeClass(server.response_time_ms)}">
                        ${server.response_time_ms}ms
                    </div>
                </div>
            </div>

            <div class="server-info">
                <div class="info-row">
                    <span class="info-label">
                        <i class="fas fa-users"></i> Players Online
                    </span>
                    <span class="info-value">${server.players_online || 0}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">
                        <i class="fas fa-clock"></i> Last Check
                    </span>
                    <span class="info-value">${formatLastCheck(server.last_check)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Get status text
function getStatusText(status) {
    const statusMap = {
        'online': 'Online',
        'warning': 'Warning',
        'offline': 'Offline'
    };
    return statusMap[status] || status;
}

// Get load class based on percentage
function getLoadClass(load) {
    if (load < 50) return 'good';
    if (load < 80) return 'warning';
    return 'critical';
}

// Get response time class
function getResponseTimeClass(responseTime) {
    if (responseTime < 100) return 'good';
    if (responseTime < 300) return 'warning';
    return 'critical';
}

// Format last check time
function formatLastCheck(timestamp) {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffSecs < 60) {
        return `${diffSecs} seconds ago`;
    } else if (diffMins < 60) {
        return `${diffMins} minutes ago`;
    } else {
        return date.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
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

// Start auto-refresh every 15 seconds
function startAutoRefresh() {
    // Clear existing interval if any
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Set new interval for 15 seconds
    refreshInterval = setInterval(() => {
        loadServerStats();
    }, 15000);
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
    const serversGrid = document.getElementById('serversGrid');
    serversGrid.innerHTML = `
        <div class="loading-message">
            <i class="fas fa-exclamation-triangle" style="color: var(--danger-color);"></i>
            <p>${message}</p>
        </div>
    `;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});
