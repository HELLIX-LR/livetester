// LIVE RUSSIA Tester Dashboard - Bugs Management
// Handles loading, displaying, filtering, sorting, and managing bugs

// State management
const bugsState = {
    currentPage: 1,
    pageSize: 20,
    totalBugs: 0,
    bugs: [],
    testers: [],
    filters: {
        search: '',
        status: '',
        priority: '',
        type: '',
        testerId: ''
    },
    sort: {
        column: 'created_at',
        direction: 'desc'
    },
    currentBugId: null,
    currentUser: {
        id: 1, // TODO: Get from session
        name: 'Administrator'
    }
};

// Priority colors for visual indication
const priorityColors = {
    low: '#1976d2',
    medium: '#f57c00',
    high: '#e65100',
    critical: '#c62828'
};

// Initialize bugs page
document.addEventListener('DOMContentLoaded', function() {
    initializeBugsPage();
});

function initializeBugsPage() {
    // Load initial data
    loadTesters();
    loadBugs();
    
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
                bugsState.filters.search = e.target.value.trim();
                bugsState.currentPage = 1;
                loadBugs();
            }, 500);
        });
    }
    
    // Filter selects
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function(e) {
            bugsState.filters.status = e.target.value;
            bugsState.currentPage = 1;
            loadBugs();
        });
    }
    
    const priorityFilter = document.getElementById('priorityFilter');
    if (priorityFilter) {
        priorityFilter.addEventListener('change', function(e) {
            bugsState.filters.priority = e.target.value;
            bugsState.currentPage = 1;
            loadBugs();
        });
    }
    
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', function(e) {
            bugsState.filters.type = e.target.value;
            bugsState.currentPage = 1;
            loadBugs();
        });
    }
    
    const testerFilter = document.getElementById('testerFilter');
    if (testerFilter) {
        testerFilter.addEventListener('change', function(e) {
            bugsState.filters.testerId = e.target.value;
            bugsState.currentPage = 1;
            loadBugs();
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
        prevPageBtn.addEventListener('click', () => changePage(bugsState.currentPage - 1));
    }
    
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => changePage(bugsState.currentPage + 1));
    }
    
    // Table header sorting
    const tableHeaders = document.querySelectorAll('.data-table th[data-sort]');
    tableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const column = this.getAttribute('data-sort');
            sortByColumn(column);
        });
    });
    
    // Create bug button
    const createBugBtn = document.getElementById('createBugBtn');
    if (createBugBtn) {
        createBugBtn.addEventListener('click', openCreateBugModal);
    }
    
    // Create bug form
    const createBugForm = document.getElementById('createBugForm');
    if (createBugForm) {
        createBugForm.addEventListener('submit', handleCreateBug);
    }
    
    // Modal close buttons
    const closeCreateBugModal = document.getElementById('closeCreateBugModal');
    if (closeCreateBugModal) {
        closeCreateBugModal.addEventListener('click', () => closeModal('createBugModal'));
    }
    
    const cancelCreateBugBtn = document.getElementById('cancelCreateBugBtn');
    if (cancelCreateBugBtn) {
        cancelCreateBugBtn.addEventListener('click', () => closeModal('createBugModal'));
    }
    
    const closeBugDetailsModal = document.getElementById('closeBugDetailsModal');
    if (closeBugDetailsModal) {
        closeBugDetailsModal.addEventListener('click', () => closeModal('bugDetailsModal'));
    }
    
    const closeScreenshotViewer = document.getElementById('closeScreenshotViewer');
    if (closeScreenshotViewer) {
        closeScreenshotViewer.addEventListener('click', () => closeModal('screenshotViewerModal'));
    }
    
    // Close modals on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Load testers for filters and forms
async function loadTesters() {
    try {
        const response = await api.get('/api/testers', { pageSize: 1000 });
        
        if (response.success) {
            bugsState.testers = response.data.testers;
            populateTesterSelects();
        }
    } catch (error) {
        console.error('Error loading testers:', error);
    }
}

// Populate tester select dropdowns
function populateTesterSelects() {
    const testerFilter = document.getElementById('testerFilter');
    const bugTester = document.getElementById('bugTester');
    
    const options = bugsState.testers.map(tester => 
        `<option value="${tester.id}">${tester.name} (${tester.email})</option>`
    ).join('');
    
    if (testerFilter) {
        testerFilter.innerHTML = '<option value="">All Testers</option>' + options;
    }
    
    if (bugTester) {
        bugTester.innerHTML = '<option value="">Select Tester</option>' + options;
    }
}

// Load bugs from API
async function loadBugs() {
    try {
        // Build query parameters
        const params = new URLSearchParams({
            page: bugsState.currentPage,
            pageSize: bugsState.pageSize,
            sortBy: bugsState.sort.column,
            sortOrder: bugsState.sort.direction.toUpperCase()
        });
        
        // Add filters if set
        if (bugsState.filters.search) {
            params.append('search', bugsState.filters.search);
        }
        if (bugsState.filters.status) {
            params.append('status', bugsState.filters.status);
        }
        if (bugsState.filters.priority) {
            params.append('priority', bugsState.filters.priority);
        }
        if (bugsState.filters.type) {
            params.append('type', bugsState.filters.type);
        }
        if (bugsState.filters.testerId) {
            params.append('testerId', bugsState.filters.testerId);
        }
        
        // Make API request
        const response = await api.get(`/api/bugs?${params.toString()}`);
        
        if (response.success) {
            bugsState.bugs = response.data.bugs;
            bugsState.totalBugs = response.data.total;
            
            // Render the table
            renderBugsTable(bugsState.bugs);
            
            // Update pagination
            updatePagination();
            
            // Update count display
            updateBugsCount();
        } else {
            showError('Failed to load bugs');
        }
    } catch (error) {
        console.error('Error loading bugs:', error);
        showError('Error loading bugs. Please try again.');
        renderEmptyState('Error loading bugs');
    }
}

// Render bugs table
function renderBugsTable(bugs) {
    const tbody = document.getElementById('bugsTableBody');
    
    if (!tbody) {
        console.error('Bugs table body not found');
        return;
    }
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Check if there are bugs
    if (!bugs || bugs.length === 0) {
        renderEmptyState('No bugs found');
        return;
    }
    
    // Render each bug row
    bugs.forEach(bug => {
        const row = createBugRow(bug);
        tbody.appendChild(row);
    });
}

// Create a table row for a bug with color indication
function createBugRow(bug) {
    const row = document.createElement('tr');
    row.classList.add('bug-row');
    row.dataset.bugId = bug.id;
    
    // Add priority color indication
    row.style.borderLeft = `4px solid ${priorityColors[bug.priority] || '#999'}`;
    
    // Add click handler to show details
    row.addEventListener('click', () => showBugDetails(bug.id));
    
    // ID
    const idCell = document.createElement('td');
    idCell.textContent = bug.id;
    row.appendChild(idCell);
    
    // Title
    const titleCell = document.createElement('td');
    titleCell.textContent = bug.title || '-';
    titleCell.style.maxWidth = '300px';
    titleCell.style.overflow = 'hidden';
    titleCell.style.textOverflow = 'ellipsis';
    titleCell.style.whiteSpace = 'nowrap';
    row.appendChild(titleCell);
    
    // Tester
    const testerCell = document.createElement('td');
    testerCell.textContent = bug.tester_name || bug.testerName || '-';
    row.appendChild(testerCell);
    
    // Priority
    const priorityCell = document.createElement('td');
    const priorityBadge = document.createElement('span');
    priorityBadge.classList.add('priority-badge', bug.priority);
    priorityBadge.textContent = bug.priority;
    priorityCell.appendChild(priorityBadge);
    row.appendChild(priorityCell);
    
    // Status
    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.classList.add('status-badge', bug.status);
    statusBadge.textContent = bug.status.replace('_', ' ');
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);
    
    // Type
    const typeCell = document.createElement('td');
    const typeBadge = document.createElement('span');
    typeBadge.classList.add('type-badge');
    typeBadge.textContent = bug.type;
    typeCell.appendChild(typeBadge);
    row.appendChild(typeCell);
    
    // Created date
    const dateCell = document.createElement('td');
    dateCell.textContent = formatDate(bug.created_at || bug.createdAt);
    row.appendChild(dateCell);
    
    // Comments count
    const commentsCell = document.createElement('td');
    const commentsCount = bug.comments_count || bug.commentsCount || 0;
    const commentsBadge = document.createElement('span');
    commentsBadge.classList.add('count-badge');
    if (commentsCount === 0) {
        commentsBadge.classList.add('zero');
    }
    commentsBadge.innerHTML = `<i class="fas fa-comment"></i> ${commentsCount}`;
    commentsCell.appendChild(commentsBadge);
    row.appendChild(commentsCell);
    
    // Screenshots count
    const screenshotsCell = document.createElement('td');
    const screenshotsCount = bug.screenshots_count || bug.screenshotsCount || 0;
    const screenshotsBadge = document.createElement('span');
    screenshotsBadge.classList.add('count-badge');
    if (screenshotsCount === 0) {
        screenshotsBadge.classList.add('zero');
    }
    screenshotsBadge.innerHTML = `<i class="fas fa-image"></i> ${screenshotsCount}`;
    screenshotsCell.appendChild(screenshotsBadge);
    row.appendChild(screenshotsCell);
    
    return row;
}

// Render empty state
function renderEmptyState(message) {
    const tbody = document.getElementById('bugsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="9" class="table-empty">
                <div class="table-empty-icon">
                    <i class="fas fa-bug"></i>
                </div>
                <div class="table-empty-text">${message}</div>
                <div class="table-empty-subtext">Try adjusting your filters or search query</div>
            </td>
        </tr>
    `;
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(bugsState.totalBugs / bugsState.pageSize);
    const currentPage = bugsState.currentPage;
    
    // Update page display
    const currentPageDisplay = document.getElementById('currentPageDisplay');
    if (currentPageDisplay) {
        currentPageDisplay.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    }
    
    // Update pagination info
    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
        const start = (currentPage - 1) * bugsState.pageSize + 1;
        const end = Math.min(currentPage * bugsState.pageSize, bugsState.totalBugs);
        paginationInfo.textContent = `Showing ${start}-${end} of ${bugsState.totalBugs}`;
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

// Update bugs count display
function updateBugsCount() {
    const bugsCount = document.getElementById('bugsCount');
    if (bugsCount) {
        const count = bugsState.totalBugs;
        bugsCount.textContent = `${count} bug${count !== 1 ? 's' : ''}`;
    }
}

// Change page
function changePage(newPage) {
    const totalPages = Math.ceil(bugsState.totalBugs / bugsState.pageSize);
    
    if (newPage < 1 || newPage > totalPages) {
        return;
    }
    
    bugsState.currentPage = newPage;
    loadBugs();
}

// Sort by column
function sortByColumn(column) {
    // Toggle direction if same column, otherwise default to descending
    if (bugsState.sort.column === column) {
        bugsState.sort.direction = bugsState.sort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        bugsState.sort.column = column;
        bugsState.sort.direction = 'desc';
    }
    
    // Update UI to show sort direction
    updateSortIndicators();
    
    // Reload data
    bugsState.currentPage = 1;
    loadBugs();
}

// Update sort indicators in table headers
function updateSortIndicators() {
    const headers = document.querySelectorAll('.data-table th[data-sort]');
    
    headers.forEach(header => {
        const column = header.getAttribute('data-sort');
        header.classList.remove('sort-asc', 'sort-desc');
        
        if (column === bugsState.sort.column) {
            header.classList.add(`sort-${bugsState.sort.direction}`);
        }
    });
}

// Clear all filters
function clearFilters() {
    // Reset filter state
    bugsState.filters = {
        search: '',
        status: '',
        priority: '',
        type: '',
        testerId: ''
    };
    
    // Reset form inputs
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) statusFilter.value = '';
    
    const priorityFilter = document.getElementById('priorityFilter');
    if (priorityFilter) priorityFilter.value = '';
    
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) typeFilter.value = '';
    
    const testerFilter = document.getElementById('testerFilter');
    if (testerFilter) testerFilter.value = '';
    
    // Reset to first page and reload
    bugsState.currentPage = 1;
    loadBugs();
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

// Helper functions for modals
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
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


// Open create bug modal
function openCreateBugModal() {
    const modal = document.getElementById('createBugModal');
    const form = document.getElementById('createBugForm');
    
    if (form) {
        form.reset();
        clearFormErrors();
    }
    
    openModal('createBugModal');
}

// Handle create bug form submission
async function handleCreateBug(e) {
    e.preventDefault();
    
    // Clear previous errors
    clearFormErrors();
    
    // Get form data
    const formData = {
        title: document.getElementById('bugTitle').value.trim(),
        description: document.getElementById('bugDescription').value.trim(),
        testerId: parseInt(document.getElementById('bugTester').value),
        priority: document.getElementById('bugPriority').value,
        status: document.getElementById('bugStatus').value,
        type: document.getElementById('bugType').value
    };
    
    // Validate form
    if (!validateBugForm(formData)) {
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        
        // Make API request
        const response = await api.post('/api/bugs', formData);
        
        if (response.success) {
            showSuccess('Bug created successfully');
            closeModal('createBugModal');
            loadBugs(); // Reload the bugs list
        } else {
            showError(response.error?.message || 'Failed to create bug');
            displayFormErrors(response.error?.details);
        }
        
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    } catch (error) {
        console.error('Error creating bug:', error);
        showError('Error creating bug. Please try again.');
        
        // Restore button state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Create Bug';
        }
    }
}

// Validate bug form
function validateBugForm(data) {
    let isValid = true;
    
    // Title validation
    if (!data.title || data.title.length < 5) {
        showFieldError('bugTitle', 'Title must be at least 5 characters');
        isValid = false;
    } else if (data.title.length > 500) {
        showFieldError('bugTitle', 'Title must not exceed 500 characters');
        isValid = false;
    }
    
    // Description validation
    if (!data.description || data.description.length < 10) {
        showFieldError('bugDescription', 'Description must be at least 10 characters');
        isValid = false;
    } else if (data.description.length > 5000) {
        showFieldError('bugDescription', 'Description must not exceed 5000 characters');
        isValid = false;
    }
    
    // Tester validation
    if (!data.testerId || isNaN(data.testerId)) {
        showFieldError('bugTester', 'Please select a tester');
        isValid = false;
    }
    
    // Priority validation
    if (!data.priority) {
        showFieldError('bugPriority', 'Please select a priority');
        isValid = false;
    }
    
    // Status validation
    if (!data.status) {
        showFieldError('bugStatus', 'Please select a status');
        isValid = false;
    }
    
    // Type validation
    if (!data.type) {
        showFieldError('bugType', 'Please select a type');
        isValid = false;
    }
    
    return isValid;
}

// Show field error
function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
    
    const field = document.getElementById(fieldId);
    if (field) {
        field.style.borderColor = '#c62828';
    }
}

// Clear form errors
function clearFormErrors() {
    document.querySelectorAll('.form-error').forEach(error => {
        error.textContent = '';
        error.classList.remove('show');
    });
    
    document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(field => {
        field.style.borderColor = '';
    });
}

// Display form errors from API response
function displayFormErrors(details) {
    if (!details || !Array.isArray(details)) return;
    
    details.forEach(error => {
        const fieldId = error.field;
        const message = error.message;
        
        // Map field names to form field IDs
        const fieldMap = {
            'title': 'bugTitle',
            'description': 'bugDescription',
            'testerId': 'bugTester',
            'priority': 'bugPriority',
            'status': 'bugStatus',
            'type': 'bugType'
        };
        
        const formFieldId = fieldMap[fieldId];
        if (formFieldId) {
            showFieldError(formFieldId, message);
        }
    });
}


// Show bug details in modal
async function showBugDetails(bugId) {
    try {
        bugsState.currentBugId = bugId;
        
        const modal = document.getElementById('bugDetailsModal');
        const modalBody = document.getElementById('bugDetailsBody');
        
        if (!modal || !modalBody) return;
        
        // Show modal with loading state
        modalBody.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        openModal('bugDetailsModal');
        
        // Fetch bug details
        const response = await api.get(`/api/bugs/${bugId}`);
        
        if (response.success) {
            const bug = response.data;
            await renderBugDetails(bug);
        } else {
            modalBody.innerHTML = '<p class="text-center">Failed to load bug details</p>';
        }
    } catch (error) {
        console.error('Error loading bug details:', error);
        const modalBody = document.getElementById('bugDetailsBody');
        if (modalBody) {
            modalBody.innerHTML = '<p class="text-center">Error loading bug details</p>';
        }
    }
}

// Render bug details in modal
async function renderBugDetails(bug) {
    const modalBody = document.getElementById('bugDetailsBody');
    if (!modalBody) return;
    
    modalBody.innerHTML = `
        <div class="bug-details-container">
            <div class="bug-details-header">
                <div class="bug-details-title">
                    <h3>${bug.title}</h3>
                    <div class="bug-details-meta">
                        <span class="priority-badge ${bug.priority}">${bug.priority}</span>
                        <span class="status-badge ${bug.status}">${bug.status.replace('_', ' ')}</span>
                        <span class="type-badge">${bug.type}</span>
                    </div>
                </div>
                <div class="bug-details-actions">
                    <button class="btn btn-secondary btn-sm" onclick="closeBugDetailsAndReload()">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
            
            <div class="bug-details-section">
                <h4><i class="fas fa-info-circle"></i> Information</h4>
                <div class="bug-details-grid">
                    <div class="bug-detail-item">
                        <label>Bug ID:</label>
                        <span>#${bug.id}</span>
                    </div>
                    <div class="bug-detail-item">
                        <label>Tester:</label>
                        <span>${bug.tester_name || bug.testerName || '-'}</span>
                    </div>
                    <div class="bug-detail-item">
                        <label>Created:</label>
                        <span>${formatDate(bug.created_at || bug.createdAt)}</span>
                    </div>
                    <div class="bug-detail-item">
                        <label>Updated:</label>
                        <span>${formatDate(bug.updated_at || bug.updatedAt)}</span>
                    </div>
                    ${bug.fixed_at || bug.fixedAt ? `
                    <div class="bug-detail-item">
                        <label>Fixed:</label>
                        <span>${formatDate(bug.fixed_at || bug.fixedAt)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="bug-details-section">
                <h4><i class="fas fa-align-left"></i> Description</h4>
                <div class="bug-description">${bug.description}</div>
            </div>
            
            <div class="bug-details-section">
                <h4><i class="fas fa-edit"></i> Edit Status & Priority</h4>
                <div class="inline-editor">
                    <div>
                        <label>Status:</label>
                        <select id="editBugStatus">
                            <option value="new" ${bug.status === 'new' ? 'selected' : ''}>New</option>
                            <option value="in_progress" ${bug.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                            <option value="fixed" ${bug.status === 'fixed' ? 'selected' : ''}>Fixed</option>
                            <option value="closed" ${bug.status === 'closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    </div>
                    <div>
                        <label>Priority:</label>
                        <select id="editBugPriority">
                            <option value="low" ${bug.priority === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${bug.priority === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${bug.priority === 'high' ? 'selected' : ''}>High</option>
                            <option value="critical" ${bug.priority === 'critical' ? 'selected' : ''}>Critical</option>
                        </select>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="updateBugStatusAndPriority(${bug.id})">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </div>
            
            <div class="bug-details-section" id="screenshotsSection">
                <h4><i class="fas fa-images"></i> Screenshots</h4>
                <div id="screenshotsContainer">
                    <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading screenshots...</div>
                </div>
            </div>
            
            <div class="bug-details-section" id="commentsSection">
                <h4><i class="fas fa-comments"></i> Comments</h4>
                <div id="commentsContainer">
                    <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading comments...</div>
                </div>
            </div>
        </div>
    `;
    
    // Load screenshots and comments
    loadBugScreenshots(bug.id);
    loadBugComments(bug.id);
}

// Update bug status and priority
async function updateBugStatusAndPriority(bugId) {
    try {
        const status = document.getElementById('editBugStatus').value;
        const priority = document.getElementById('editBugPriority').value;
        
        const response = await api.put(`/api/bugs/${bugId}`, {
            status,
            priority
        });
        
        if (response.success) {
            showSuccess('Bug updated successfully');
            // Refresh bug details
            showBugDetails(bugId);
        } else {
            showError('Failed to update bug');
        }
    } catch (error) {
        console.error('Error updating bug:', error);
        showError('Error updating bug');
    }
}

// Close bug details modal and reload bugs list
function closeBugDetailsAndReload() {
    closeModal('bugDetailsModal');
    loadBugs();
}

// Make function available globally
window.updateBugStatusAndPriority = updateBugStatusAndPriority;
window.closeBugDetailsAndReload = closeBugDetailsAndReload;


// Load bug screenshots
async function loadBugScreenshots(bugId) {
    try {
        const response = await api.get(`/api/bugs/${bugId}/screenshots`);
        
        const container = document.getElementById('screenshotsContainer');
        if (!container) return;
        
        if (response.success) {
            const screenshots = response.data;
            const remaining = response.remaining || 0;
            const limit = response.limit || 10;
            
            renderScreenshots(screenshots, bugId, remaining, limit);
        } else {
            container.innerHTML = '<p class="text-muted">Failed to load screenshots</p>';
        }
    } catch (error) {
        console.error('Error loading screenshots:', error);
        const container = document.getElementById('screenshotsContainer');
        if (container) {
            container.innerHTML = '<p class="text-muted">Error loading screenshots</p>';
        }
    }
}

// Render screenshots
function renderScreenshots(screenshots, bugId, remaining, limit) {
    const container = document.getElementById('screenshotsContainer');
    if (!container) return;
    
    let html = '<div class="screenshots-grid">';
    
    // Render existing screenshots
    screenshots.forEach(screenshot => {
        html += `
            <div class="screenshot-item">
                <img src="${screenshot.url || screenshot.filePath || screenshot.file_path}" 
                     alt="${screenshot.filename}" 
                     onclick="viewScreenshot('${screenshot.url || screenshot.filePath || screenshot.file_path}')">
                <button class="screenshot-delete" onclick="deleteScreenshot(${bugId}, ${screenshot.id})" title="Delete screenshot">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
    
    // Add upload button if not at limit
    if (remaining > 0) {
        html += `
            <div class="screenshot-upload-area" onclick="triggerScreenshotUpload(${bugId})">
                <i class="fas fa-plus"></i>
                <p>Upload Screenshot</p>
                <input type="file" id="screenshotUpload_${bugId}" accept="image/png,image/jpg,image/jpeg,image/gif" style="display:none" onchange="handleScreenshotUpload(${bugId}, this)">
            </div>
        `;
    }
    
    html += '</div>';
    
    // Add info text
    html += `<p class="screenshots-info">
        ${screenshots.length} of ${limit} screenshots uploaded. 
        ${remaining > 0 ? `You can upload ${remaining} more.` : 'Maximum limit reached.'}
        <br>Supported formats: PNG, JPG, JPEG, GIF. Max size: 5MB.
    </p>`;
    
    container.innerHTML = html;
}

// Trigger screenshot upload
function triggerScreenshotUpload(bugId) {
    const input = document.getElementById(`screenshotUpload_${bugId}`);
    if (input) {
        input.click();
    }
}

// Handle screenshot upload
async function handleScreenshotUpload(bugId, input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showError('Invalid file type. Please upload PNG, JPG, JPEG, or GIF images.');
        input.value = '';
        return;
    }
    
    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        showError('File size exceeds 5MB limit. Please choose a smaller file.');
        input.value = '';
        return;
    }
    
    try {
        // Show loading state
        const container = document.getElementById('screenshotsContainer');
        if (container) {
            container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Uploading screenshot...</div>';
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('screenshot', file);
        
        // Upload screenshot
        const response = await api.post(`/api/bugs/${bugId}/screenshots`, formData);
        
        if (response.success) {
            showSuccess('Screenshot uploaded successfully');
            // Reload screenshots
            loadBugScreenshots(bugId);
        } else {
            showError(response.error?.message || 'Failed to upload screenshot');
            loadBugScreenshots(bugId);
        }
    } catch (error) {
        console.error('Error uploading screenshot:', error);
        showError('Error uploading screenshot');
        loadBugScreenshots(bugId);
    }
    
    // Clear input
    input.value = '';
}

// View screenshot in full size
function viewScreenshot(url) {
    const modal = document.getElementById('screenshotViewerModal');
    const img = document.getElementById('screenshotViewerImage');
    
    if (modal && img) {
        img.src = url;
        openModal('screenshotViewerModal');
    }
}

// Delete screenshot
async function deleteScreenshot(bugId, screenshotId) {
    if (!confirm('Are you sure you want to delete this screenshot?')) {
        return;
    }
    
    try {
        const response = await api.delete(`/api/bugs/${bugId}/screenshots/${screenshotId}`);
        
        if (response.success) {
            showSuccess('Screenshot deleted successfully');
            // Reload screenshots
            loadBugScreenshots(bugId);
        } else {
            showError('Failed to delete screenshot');
        }
    } catch (error) {
        console.error('Error deleting screenshot:', error);
        showError('Error deleting screenshot');
    }
}

// Make functions available globally
window.triggerScreenshotUpload = triggerScreenshotUpload;
window.handleScreenshotUpload = handleScreenshotUpload;
window.viewScreenshot = viewScreenshot;
window.deleteScreenshot = deleteScreenshot;


// Load bug comments
async function loadBugComments(bugId) {
    try {
        const response = await api.get(`/api/bugs/${bugId}/comments`);
        
        const container = document.getElementById('commentsContainer');
        if (!container) return;
        
        if (response.success) {
            const comments = response.data;
            renderComments(comments, bugId);
        } else {
            container.innerHTML = '<p class="text-muted">Failed to load comments</p>';
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        const container = document.getElementById('commentsContainer');
        if (container) {
            container.innerHTML = '<p class="text-muted">Error loading comments</p>';
        }
    }
}

// Render comments
function renderComments(comments, bugId) {
    const container = document.getElementById('commentsContainer');
    if (!container) return;
    
    let html = '<div class="comments-container">';
    
    // Add comment form
    html += `
        <div class="comment-form">
            <textarea id="newCommentText" placeholder="Write a comment..." rows="3"></textarea>
            <div class="comment-form-actions">
                <button class="btn btn-primary btn-sm" onclick="addComment(${bugId})">
                    <i class="fas fa-paper-plane"></i> Post Comment
                </button>
            </div>
        </div>
    `;
    
    // Render comments list
    if (comments && comments.length > 0) {
        html += '<div class="comments-list">';
        
        comments.forEach(comment => {
            const isOwn = comment.author_id === bugsState.currentUser.id || comment.authorId === bugsState.currentUser.id;
            const createdAt = new Date(comment.created_at || comment.createdAt);
            const now = new Date();
            const minutesSinceCreation = (now - createdAt) / (1000 * 60);
            const canEdit = isOwn && minutesSinceCreation <= 15;
            
            html += `
                <div class="comment-item" id="comment_${comment.id}">
                    <div class="comment-header">
                        <span class="comment-author">
                            <i class="fas fa-user-circle"></i> ${comment.author_name || comment.authorName}
                        </span>
                        <div class="comment-meta">
                            <span>${formatDate(comment.created_at || comment.createdAt)}</span>
                            ${comment.is_edited || comment.isEdited ? '<span class="comment-edited">(edited)</span>' : ''}
                        </div>
                    </div>
                    <div class="comment-content" id="commentContent_${comment.id}">${comment.content}</div>
                    ${isOwn ? `
                        <div class="comment-actions">
                            ${canEdit ? `
                                <button class="btn btn-secondary btn-sm" onclick="editComment(${bugId}, ${comment.id})">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                            ` : ''}
                            <button class="btn btn-danger btn-sm" onclick="deleteComment(${bugId}, ${comment.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
    } else {
        html += `
            <div class="comments-empty">
                <i class="fas fa-comments"></i>
                <p>No comments yet. Be the first to comment!</p>
            </div>
        `;
    }
    
    html += '</div>';
    
    container.innerHTML = html;
}

// Add comment
async function addComment(bugId) {
    const textarea = document.getElementById('newCommentText');
    if (!textarea) return;
    
    const content = textarea.value.trim();
    
    if (!content) {
        showError('Comment cannot be empty');
        return;
    }
    
    if (content.length > 2000) {
        showError('Comment must not exceed 2000 characters');
        return;
    }
    
    try {
        const response = await api.post(`/api/bugs/${bugId}/comments`, {
            content,
            authorId: bugsState.currentUser.id,
            authorName: bugsState.currentUser.name
        });
        
        if (response.success) {
            showSuccess('Comment added successfully');
            textarea.value = '';
            // Reload comments
            loadBugComments(bugId);
        } else {
            showError(response.error?.message || 'Failed to add comment');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        showError('Error adding comment');
    }
}

// Edit comment
function editComment(bugId, commentId) {
    const commentContent = document.getElementById(`commentContent_${commentId}`);
    if (!commentContent) return;
    
    const currentContent = commentContent.textContent;
    
    // Replace content with textarea
    commentContent.innerHTML = `
        <div class="comment-edit-form">
            <textarea id="editCommentText_${commentId}" rows="3">${currentContent}</textarea>
            <div class="comment-edit-actions">
                <button class="btn btn-primary btn-sm" onclick="saveCommentEdit(${bugId}, ${commentId})">
                    <i class="fas fa-save"></i> Save
                </button>
                <button class="btn btn-secondary btn-sm" onclick="cancelCommentEdit(${bugId}, ${commentId}, '${currentContent.replace(/'/g, "\\'")}')">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        </div>
    `;
}

// Save comment edit
async function saveCommentEdit(bugId, commentId) {
    const textarea = document.getElementById(`editCommentText_${commentId}`);
    if (!textarea) return;
    
    const content = textarea.value.trim();
    
    if (!content) {
        showError('Comment cannot be empty');
        return;
    }
    
    if (content.length > 2000) {
        showError('Comment must not exceed 2000 characters');
        return;
    }
    
    try {
        const response = await api.put(`/api/bugs/${bugId}/comments/${commentId}`, {
            content,
            authorId: bugsState.currentUser.id
        });
        
        if (response.success) {
            showSuccess('Comment updated successfully');
            // Reload comments
            loadBugComments(bugId);
        } else {
            showError(response.error?.message || 'Failed to update comment');
        }
    } catch (error) {
        console.error('Error updating comment:', error);
        showError('Error updating comment');
    }
}

// Cancel comment edit
function cancelCommentEdit(bugId, commentId, originalContent) {
    const commentContent = document.getElementById(`commentContent_${commentId}`);
    if (commentContent) {
        commentContent.textContent = originalContent;
    }
}

// Delete comment
async function deleteComment(bugId, commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }
    
    try {
        const response = await api.delete(`/api/bugs/${bugId}/comments/${commentId}`, {
            authorId: bugsState.currentUser.id
        });
        
        if (response.success) {
            showSuccess('Comment deleted successfully');
            // Reload comments
            loadBugComments(bugId);
        } else {
            showError(response.error?.message || 'Failed to delete comment');
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        showError('Error deleting comment');
    }
}

// Make functions available globally
window.addComment = addComment;
window.editComment = editComment;
window.saveCommentEdit = saveCommentEdit;
window.cancelCommentEdit = cancelCommentEdit;
window.deleteComment = deleteComment;
