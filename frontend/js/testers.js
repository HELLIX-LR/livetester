// LIVE RUSSIA Tester Dashboard - Testers Management
// Handles loading, displaying, filtering, sorting, and pagination of testers

// State management
const testersState = {
    currentPage: 1,
    pageSize: 20,
    totalTesters: 0,
    testers: [],
    filters: {
        search: '',
        deviceType: '',
        os: '',
        status: ''
    },
    sort: {
        column: 'registration_date',
        direction: 'desc'
    }
};

// Initialize testers page
document.addEventListener('DOMContentLoaded', function() {
    initializeTestersPage();
});

function initializeTestersPage() {
    // Load initial testers data
    loadTesters();
    
    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                testersState.filters.search = e.target.value.trim();
                testersState.currentPage = 1;
                loadTesters();
            }, 500); // Debounce search
        });
    }
    
    // Filter selects
    const deviceFilter = document.getElementById('deviceFilter');
    if (deviceFilter) {
        deviceFilter.addEventListener('change', function(e) {
            testersState.filters.deviceType = e.target.value;
            testersState.currentPage = 1;
            loadTesters();
        });
    }
    
    const osFilter = document.getElementById('osFilter');
    if (osFilter) {
        osFilter.addEventListener('change', function(e) {
            testersState.filters.os = e.target.value;
            testersState.currentPage = 1;
            loadTesters();
        });
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function(e) {
            testersState.filters.status = e.target.value;
            testersState.currentPage = 1;
            loadTesters();
        });
    }
    
    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Pagination buttons
    const prevPageBtn = document.getElementById('prevPageBtn');
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => changePage(testersState.currentPage - 1));
    }
    
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => changePage(testersState.currentPage + 1));
    }
    
    // Table header sorting
    const tableHeaders = document.querySelectorAll('.data-table th[data-sort]');
    tableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const column = this.getAttribute('data-sort');
            sortByColumn(column);
        });
    });
    
    // Modal close
    const closeTesterModal = document.getElementById('closeTesterModal');
    if (closeTesterModal) {
        closeTesterModal.addEventListener('click', closeTesterDetailsModal);
    }
    
    // Close modal on background click
    const testerModal = document.getElementById('testerModal');
    if (testerModal) {
        testerModal.addEventListener('click', function(e) {
            if (e.target === testerModal) {
                closeTesterDetailsModal();
            }
        });
    }
}

// Load testers from API
async function loadTesters() {
    try {
        // Build query parameters
        const params = new URLSearchParams({
            page: testersState.currentPage,
            pageSize: testersState.pageSize,
            sortBy: testersState.sort.column,
            sortOrder: testersState.sort.direction
        });
        
        // Add filters if set
        if (testersState.filters.search) {
            params.append('search', testersState.filters.search);
        }
        if (testersState.filters.deviceType) {
            params.append('deviceType', testersState.filters.deviceType);
        }
        if (testersState.filters.os) {
            params.append('os', testersState.filters.os);
        }
        if (testersState.filters.status) {
            params.append('status', testersState.filters.status);
        }
        
        // Make API request
        const response = await api.get(`/api/testers?${params.toString()}`);
        
        if (response.success) {
            testersState.testers = response.data.testers;
            testersState.totalTesters = response.data.total;
            
            // Render the table
            renderTestersTable(testersState.testers);
            
            // Update pagination
            updatePagination();
            
            // Update count display
            updateTestersCount();
        } else {
            showError('Failed to load testers');
        }
    } catch (error) {
        console.error('Error loading testers:', error);
        showError('Error loading testers. Please try again.');
        renderEmptyState('Error loading testers');
    }
}

// Render testers table
function renderTestersTable(testers) {
    const tbody = document.getElementById('testersTableBody');
    
    if (!tbody) {
        console.error('Testers table body not found');
        return;
    }
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Check if there are testers
    if (!testers || testers.length === 0) {
        renderEmptyState('No testers found');
        return;
    }
    
    // Render each tester row
    testers.forEach(tester => {
        const row = createTesterRow(tester);
        tbody.appendChild(row);
    });
}

// Create a table row for a tester
function createTesterRow(tester) {
    const row = document.createElement('tr');
    row.classList.add('tester-row');
    row.dataset.testerId = tester.id;
    
    // Add click handler to show details
    row.addEventListener('click', () => showTesterDetails(tester.id));
    
    // ID
    const idCell = document.createElement('td');
    idCell.textContent = tester.id;
    row.appendChild(idCell);
    
    // Name
    const nameCell = document.createElement('td');
    nameCell.textContent = tester.name || '-';
    row.appendChild(nameCell);
    
    // Email
    const emailCell = document.createElement('td');
    emailCell.textContent = tester.email || '-';
    row.appendChild(emailCell);
    
    // Nickname
    const nicknameCell = document.createElement('td');
    nicknameCell.textContent = tester.nickname || '-';
    row.appendChild(nicknameCell);
    
    // Telegram
    const telegramCell = document.createElement('td');
    telegramCell.textContent = tester.telegram || '-';
    row.appendChild(telegramCell);
    
    // Device Type
    const deviceCell = document.createElement('td');
    deviceCell.textContent = tester.device_type || tester.deviceType || '-';
    row.appendChild(deviceCell);
    
    // OS
    const osCell = document.createElement('td');
    const osText = tester.os || '-';
    const osVersion = tester.os_version || tester.osVersion;
    osCell.textContent = osVersion ? `${osText} ${osVersion}` : osText;
    row.appendChild(osCell);
    
    // Bugs Count
    const bugsCell = document.createElement('td');
    const bugsCount = tester.bugs_count || tester.bugsCount || 0;
    const bugsBadge = document.createElement('span');
    bugsBadge.classList.add('count-badge');
    if (bugsCount === 0) {
        bugsBadge.classList.add('zero');
    }
    bugsBadge.textContent = bugsCount;
    bugsCell.appendChild(bugsBadge);
    row.appendChild(bugsCell);
    
    // Rating
    const ratingCell = document.createElement('td');
    const rating = tester.rating || 0;
    const ratingDisplay = document.createElement('div');
    ratingDisplay.classList.add('rating-display');
    const ratingValue = document.createElement('span');
    ratingValue.classList.add('rating-value');
    ratingValue.textContent = rating;
    ratingDisplay.appendChild(ratingValue);
    ratingCell.appendChild(ratingDisplay);
    row.appendChild(ratingCell);
    
    // Status
    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.classList.add('status-badge', tester.status || 'active');
    statusBadge.textContent = tester.status || 'active';
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);
    
    // Registration Date
    const dateCell = document.createElement('td');
    const regDate = tester.registration_date || tester.registrationDate;
    dateCell.textContent = regDate ? formatDate(regDate) : '-';
    row.appendChild(dateCell);
    
    return row;
}

// Render empty state
function renderEmptyState(message) {
    const tbody = document.getElementById('testersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="11" class="table-empty">
                <div class="table-empty-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="table-empty-text">${message}</div>
                <div class="table-empty-subtext">Try adjusting your filters or search query</div>
            </td>
        </tr>
    `;
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(testersState.totalTesters / testersState.pageSize);
    const currentPage = testersState.currentPage;
    
    // Update page display
    const currentPageDisplay = document.getElementById('currentPageDisplay');
    if (currentPageDisplay) {
        currentPageDisplay.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    }
    
    // Update pagination info
    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
        const start = (currentPage - 1) * testersState.pageSize + 1;
        const end = Math.min(currentPage * testersState.pageSize, testersState.totalTesters);
        paginationInfo.textContent = `Showing ${start}-${end} of ${testersState.totalTesters}`;
    }
    
    // Enable/disable buttons
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
    }
}

// Update testers count display
function updateTestersCount() {
    const testersCount = document.getElementById('testersCount');
    if (testersCount) {
        const count = testersState.totalTesters;
        testersCount.textContent = `${count} tester${count !== 1 ? 's' : ''}`;
    }
}

// Change page
function changePage(newPage) {
    const totalPages = Math.ceil(testersState.totalTesters / testersState.pageSize);
    
    if (newPage < 1 || newPage > totalPages) {
        return;
    }
    
    testersState.currentPage = newPage;
    loadTesters();
}

// Sort by column
function sortByColumn(column) {
    // Toggle direction if same column, otherwise default to ascending
    if (testersState.sort.column === column) {
        testersState.sort.direction = testersState.sort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        testersState.sort.column = column;
        testersState.sort.direction = 'asc';
    }
    
    // Update UI to show sort direction
    updateSortIndicators();
    
    // Reload data
    testersState.currentPage = 1;
    loadTesters();
}

// Update sort indicators in table headers
function updateSortIndicators() {
    const headers = document.querySelectorAll('.data-table th[data-sort]');
    
    headers.forEach(header => {
        const column = header.getAttribute('data-sort');
        header.classList.remove('sort-asc', 'sort-desc');
        
        if (column === testersState.sort.column) {
            header.classList.add(`sort-${testersState.sort.direction}`);
        }
    });
}

// Clear all filters
function clearFilters() {
    // Reset filter state
    testersState.filters = {
        search: '',
        deviceType: '',
        os: '',
        status: ''
    };
    
    // Reset form inputs
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    const deviceFilter = document.getElementById('deviceFilter');
    if (deviceFilter) deviceFilter.value = '';
    
    const osFilter = document.getElementById('osFilter');
    if (osFilter) osFilter.value = '';
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) statusFilter.value = '';
    
    // Reset to first page and reload
    testersState.currentPage = 1;
    loadTesters();
}

// Show tester details in modal
async function showTesterDetails(testerId) {
    try {
        const modal = document.getElementById('testerModal');
        const modalBody = document.getElementById('testerModalBody');
        
        if (!modal || !modalBody) return;
        
        // Show modal with loading state
        modalBody.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        modal.classList.add('show');
        
        // Fetch tester details
        const response = await api.get(`/api/testers/${testerId}`);
        
        if (response.success) {
            const tester = response.data.tester;
            renderTesterDetails(tester);
        } else {
            modalBody.innerHTML = '<p class="text-center">Failed to load tester details</p>';
        }
    } catch (error) {
        console.error('Error loading tester details:', error);
        const modalBody = document.getElementById('testerModalBody');
        if (modalBody) {
            modalBody.innerHTML = '<p class="text-center">Error loading tester details</p>';
        }
    }
}

// Render tester details in modal
function renderTesterDetails(tester) {
    const modalBody = document.getElementById('testerModalBody');
    if (!modalBody) return;
    
    modalBody.innerHTML = `
        <div class="tester-details">
            <div class="details-section">
                <h3><i class="fas fa-user"></i> Personal Information</h3>
                <div class="details-grid">
                    <div class="detail-item">
                        <label>ID:</label>
                        <span>${tester.id}</span>
                    </div>
                    <div class="detail-item">
                        <label>Name:</label>
                        <span>${tester.name || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Email:</label>
                        <span>${tester.email || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Nickname:</label>
                        <span>${tester.nickname || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Telegram:</label>
                        <span>${tester.telegram || '-'}</span>
                    </div>
                </div>
            </div>
            
            <div class="details-section">
                <h3><i class="fas fa-mobile-alt"></i> Device Information</h3>
                <div class="details-grid">
                    <div class="detail-item">
                        <label>Device Type:</label>
                        <span>${tester.device_type || tester.deviceType || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Operating System:</label>
                        <span>${tester.os || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>OS Version:</label>
                        <span>${tester.os_version || tester.osVersion || '-'}</span>
                    </div>
                </div>
            </div>
            
            <div class="details-section">
                <h3><i class="fas fa-chart-line"></i> Statistics</h3>
                <div class="details-grid">
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge ${tester.status || 'active'}">${tester.status || 'active'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Bugs Found:</label>
                        <span class="count-badge">${tester.bugs_count || tester.bugsCount || 0}</span>
                    </div>
                    <div class="detail-item">
                        <label>Rating:</label>
                        <span class="rating-value">${tester.rating || 0}</span>
                    </div>
                    <div class="detail-item">
                        <label>Registration Date:</label>
                        <span>${formatDate(tester.registration_date || tester.registrationDate)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Last Activity:</label>
                        <span>${formatDate(tester.last_activity_date || tester.lastActivityDate) || 'Never'}</span>
                    </div>
                </div>
            </div>
            
            <div class="details-section">
                <h3><i class="fas fa-cog"></i> Actions</h3>
                <div class="details-actions">
                    <select id="statusChangeSelect" class="status-select">
                        <option value="active" ${tester.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${tester.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="suspended" ${tester.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                    </select>
                    <button class="btn btn-primary" onclick="updateTesterStatus(${tester.id})">
                        <i class="fas fa-save"></i> Update Status
                    </button>
                </div>
            </div>
            
            <div class="details-section" id="testerBugsSection">
                <h3><i class="fas fa-bug"></i> Bugs Found</h3>
                <div id="testerBugsList">
                    <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading bugs...</div>
                </div>
            </div>
        </div>
    `;
    
    // Load tester's bugs
    loadTesterBugs(tester.id);
}

// Load bugs for a specific tester
async function loadTesterBugs(testerId) {
    try {
        const response = await api.get(`/api/testers/${testerId}/bugs`);
        
        const bugsList = document.getElementById('testerBugsList');
        if (!bugsList) return;
        
        if (response.success && response.data.bugs && response.data.bugs.length > 0) {
            const bugs = response.data.bugs;
            bugsList.innerHTML = `
                <div class="bugs-list">
                    ${bugs.map(bug => `
                        <div class="bug-item">
                            <div class="bug-header">
                                <span class="bug-title">${bug.title}</span>
                                <span class="priority-badge ${bug.priority}">${bug.priority}</span>
                            </div>
                            <div class="bug-meta">
                                <span class="status-badge ${bug.status}">${bug.status}</span>
                                <span class="bug-date">${formatDate(bug.created_at || bug.createdAt)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            bugsList.innerHTML = '<p class="text-muted">No bugs found by this tester</p>';
        }
    } catch (error) {
        console.error('Error loading tester bugs:', error);
        const bugsList = document.getElementById('testerBugsList');
        if (bugsList) {
            bugsList.innerHTML = '<p class="text-muted">Error loading bugs</p>';
        }
    }
}

// Update tester status
async function updateTesterStatus(testerId) {
    try {
        const statusSelect = document.getElementById('statusChangeSelect');
        if (!statusSelect) return;
        
        const newStatus = statusSelect.value;
        
        const response = await api.patch(`/api/testers/${testerId}`, {
            status: newStatus
        });
        
        if (response.success) {
            showSuccess('Tester status updated successfully');
            closeTesterDetailsModal();
            loadTesters(); // Reload the table
        } else {
            showError('Failed to update tester status');
        }
    } catch (error) {
        console.error('Error updating tester status:', error);
        showError('Error updating tester status');
    }
}

// Close tester details modal
function closeTesterDetailsModal() {
    const modal = document.getElementById('testerModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-US', options);
}

// Helper functions for notifications
function showError(message) {
    console.error(message);
    // TODO: Integrate with notification system
    alert(message);
}

function showSuccess(message) {
    console.log(message);
    // TODO: Integrate with notification system
    alert(message);
}
