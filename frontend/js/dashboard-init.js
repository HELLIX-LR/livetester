// Temporary auth bypass for testing
sessionStorage.setItem('authToken', 'test-token');

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Mock data for testing
    const mockStats = {
        totalTesters: 15,
        activeTesters24h: 8,
        totalBugs: 42,
        bugsByPriority: {
            low: 10,
            medium: 18,
            high: 12,
            critical: 2
        },
        bugsByStatus: {
            new: 15,
            in_progress: 12,
            fixed: 10,
            closed: 5
        },
        testersByDevice: {
            smartphone: 12,
            tablet: 3
        }
    };

    const mockTopTesters = [
        { id: 1, name: 'Иван Петров', bugsCount: 25, deviceType: 'Smartphone', rating: 95 },
        { id: 2, name: 'Мария Сидорова', bugsCount: 22, deviceType: 'Tablet', rating: 92 },
        { id: 3, name: 'Алексей Иванов', bugsCount: 18, deviceType: 'Smartphone', rating: 88 },
        { id: 4, name: 'Елена Смирнова', bugsCount: 15, deviceType: 'Smartphone', rating: 85 },
        { id: 5, name: 'Дмитрий Козлов', bugsCount: 12, deviceType: 'Tablet', rating: 82 }
    ];

    // Override API calls with mock data
    const originalGet = api.get;
    api.get = async function(endpoint, params) {
        if (endpoint === endpoints.stats.dashboard) {
            return Promise.resolve(mockStats);
        }
        if (endpoint === endpoints.stats.topTesters) {
            return Promise.resolve({ topTesters: mockTopTesters });
        }
        return originalGet.call(this, endpoint, params);
    };

    // Initialize dashboard
    if (dashboard && typeof dashboard.init === 'function') {
        dashboard.init();
    }
});
