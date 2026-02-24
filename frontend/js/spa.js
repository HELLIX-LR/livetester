// SPA Navigation
const pages = {
    dashboard: `
        <header class="content-header">
            <h1>Dashboard</h1>
            <p class="subtitle">Platform overview and real-time statistics</p>
        </header>
        <div class="content-body">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue"><i class="fas fa-users"></i></div>
                    <div class="stat-info">
                        <h3 id="totalTesters">0</h3>
                        <p>Total Testers</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fas fa-user-check"></i></div>
                    <div class="stat-info">
                        <h3 id="activeTesters">0</h3>
                        <p>Active Today</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red"><i class="fas fa-bug"></i></div>
                    <div class="stat-info">
                        <h3 id="totalBugs">0</h3>
                        <p>Total Bugs</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    users: `
        <header class="content-header">
            <h1>Users</h1>
            <p class="subtitle">Manage testers and their accounts</p>
        </header>
        <div class="content-body">
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr><td colspan="5" style="text-align:center;padding:2rem;">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `,
    babylon: `
        <header class="content-header">
            <h1>BABYLON Server</h1>
            <p class="subtitle">Server statistics and management</p>
        </header>
        <div class="content-body">
            <div class="server-card">
                <h3>Server Status: <span class="status-badge online">Online</span></h3>
                <p>Players: 428 / 173565</p>
                <p>Money: $584,984,652</p>
            </div>
        </div>
    `
};

function loadPage(pageName) {
    const content = pages[pageName] || pages.dashboard;
    document.getElementById('app-content').innerHTML = content;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
    
    // Load data for specific pages
    if (pageName === 'dashboard') loadDashboardData();
    if (pageName === 'users') loadUsersData();
}

async function loadDashboardData() {
    try {
        const response = await api.get('/statistics/dashboard');
        if (response.success) {
            document.getElementById('totalTesters').textContent = response.data.totalTesters || 0;
            document.getElementById('activeTesters').textContent = response.data.activeToday || 0;
            document.getElementById('totalBugs').textContent = response.data.totalBugs || 0;
        }
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

async function loadUsersData() {
    try {
        const response = await api.get('/testers');
        if (response.success) {
            const tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = response.data.testers.map(t => `
                <tr>
                    <td>${t.id}</td>
                    <td>${t.name}</td>
                    <td>${t.email}</td>
                    <td><span class="role-badge">${t.status}</span></td>
                    <td>${new Date(t.registration_date).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

// Navigation
document.addEventListener('DOMContentLoaded', () => {
    // Load initial page
    const hash = window.location.hash.slice(1) || 'dashboard';
    loadPage(hash);
    
    // Handle navigation clicks
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            window.location.hash = page;
            loadPage(page);
        });
    });
    
    // Handle hash changes
    window.addEventListener('hashchange', () => {
        const page = window.location.hash.slice(1) || 'dashboard';
        loadPage(page);
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/logout');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    });
});