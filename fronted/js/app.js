// Debug function to test admin authentication
async function testAdminAuth() {
    console.log('Testing admin authentication...');
    console.log('Current authToken:', authToken);
    
    if (!authToken) {
        console.log('No token found, need to login');
        return;
    }
    
    try {
        // Test simple admin endpoint
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Admin auth test status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Admin auth test successful:', data);
        } else {
            const errorText = await response.text();
            console.log('Admin auth test failed:', errorText);
        }
    } catch (error) {
        console.error('Admin auth test error:', error);
    }
}

// Add to window for manual testing
window.testAdminAuth = testAdminAuth;

// Global variables - Use Config for API URL
const API_BASE_URL = Config.API_BASE;
let authToken = localStorage.getItem('adminToken');
let currentHouse = null;
let selectedImages = [];

// Application state
const appState = {
    currentPage: 'login',
    houses: [],
    stats: {}
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkAuthAndShowPage();
    setupEventListeners();
});

// Check authentication and show appropriate page
function checkAuthAndShowPage() {
    if (authToken) {
        showDashboard();
    } else {
        showLogin();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // House form
    const houseForm = document.getElementById('houseForm');
    if (houseForm) {
        houseForm.addEventListener('submit', handleHouseSubmit);
    }

    // Image input
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
        imageInput.addEventListener('change', handleImageSelect);
    }

    // Modal overlay click to close
    const houseModal = document.getElementById('houseModal');
    if (houseModal) {
        houseModal.addEventListener('click', function(e) {
            if (e.target === houseModal) {
                closeHouseModal();
            }
        });
    }
}

// Show login page
function showLogin() {
    hideAllPages();
    document.getElementById('loginPage').style.display = 'block';
    appState.currentPage = 'login';
}

// Show dashboard page
function showDashboard() {
    hideAllPages();
    document.getElementById('dashboardPage').style.display = 'block';
    appState.currentPage = 'dashboard';
    loadDashboardStats();
}

// Show houses page
function showHouses() {
    hideAllPages();
    document.getElementById('housesPage').style.display = 'block';
    appState.currentPage = 'houses';
    loadHouses();
}

// Hide all pages
function hideAllPages() {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.display = 'none';
    });
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginError = document.getElementById('loginError');

    // Show loading state
    loginBtn.disabled = true;
    loginBtnText.style.display = 'none';
    loginSpinner.style.display = 'inline-block';
    loginError.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.access_token;
            localStorage.setItem('adminToken', authToken);
            showToast('Login successful!', 'success');
            showDashboard();
        } else {
            throw new Error(data.error || 'Login failed');
        }
    } catch (error) {
        loginError.textContent = error.message;
        loginError.style.display = 'block';
        showToast(error.message, 'error');
    } finally {
        // Reset loading state
        loginBtn.disabled = false;
        loginBtnText.style.display = 'inline';
        loginSpinner.style.display = 'none';
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        authToken = null;
        localStorage.removeItem('adminToken');
        showToast('Logged out successfully', 'success');
        showLogin();
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            appState.stats = data;
            renderDashboardStats(data);
        } else if (response.status === 401) {
            handleAuthError();
        } else {
            throw new Error('Failed to load statistics');
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        showToast('Failed to load statistics', 'error');
    }
}

// Render dashboard statistics
function renderDashboardStats(stats) {
    const statsContainer = document.getElementById('dashboardStats');
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${stats.total_houses}</div>
            <div class="stat-label">Total Houses</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-number" style="color: #27ae60;">${stats.available_houses}</div>
            <div class="stat-label">Available</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-number" style="color: #e74c3c;">${stats.unavailable_houses}</div>
            <div class="stat-label">Unavailable</div>
        </div>
    `;
}

// Load houses
async function loadHouses() {
    const housesContainer = document.getElementById('housesContainer');
    
    // Show loading state
    housesContainer.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <span class="loading-text">Loading houses...</span>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/houses`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            appState.houses = data.houses;
            renderHouses(data.houses);
        } else {
            throw new Error('Failed to load houses');
        }
    } catch (error) {
        console.error('Error loading houses:', error);
        housesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading houses</h3>
                <p>Please try again later</p>
            </div>
        `;
        showToast('Failed to load houses', 'error');
    }
}

// Render houses
function renderHouses(houses) {
    const housesContainer = document.getElementById('housesContainer');
    
    if (houses.length === 0) {
        housesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-home"></i>
                <h3>No houses yet</h3>
                <p>Start by adding your first rental property</p>
                <button onclick="showAddHouseModal()" class="add-house-button">
                    <i class="fas fa-plus" style="margin-right: 8px;"></i>
                    Add First House
                </button>
            </div>
        `;
        return;
    }

    const housesHTML = houses.map(house => `
        <div class="house-card">
            ${house.images && house.images.length > 0 ? 
                `<img src="${house.images[0].image_url}" alt="${house.name}" class="house-image" />` :
                `<div class="house-image">
                    <i class="fas fa-home" style="font-size: 48px; color: #dbdbdb;"></i>
                </div>`
            }
            
            <div class="house-content">
                <h3 class="house-title">${house.name}</h3>
                
                <div class="house-details">
                    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 8px;">
                        <span style="display: flex; align-items: center; gap: 4px;">
                            <i class="fas fa-bed"></i>
                            ${house.bedrooms}
                        </span>
                        <span style="display: flex; align-items: center; gap: 4px;">
                            <i class="fas fa-bath"></i>
                            ${house.bathrooms}
                        </span>
                    </div>
                    
                    ${house.location ? 
                        `<div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
                            <i class="fas fa-map-marker-alt"></i>
                            ${house.location}
                        </div>` : ''
                    }
                </div>
                
                <div class="house-price">
                    <i class="fas fa-money-bill"></i>
                    KSh ${(house.price_per_night * 30).toLocaleString()}/month
                </div>
                
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                    <span class="status-badge ${house.is_available ? 'available' : 'unavailable'}">
                        ${house.is_available ? 'Available' : 'Unavailable'}
                    </span>
                </div>
                
                <div class="house-actions">
                    <button onclick="editHouse('${house.id}')" class="action-button">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button onclick="deleteHouse('${house.id}')" class="action-button delete">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    housesContainer.innerHTML = `<div class="houses-grid">${housesHTML}</div>`;
}

// Show add house modal
function showAddHouseModal() {
    currentHouse = null;
    selectedImages = [];
    document.getElementById('modalTitle').textContent = 'Add New House';
    document.getElementById('submitBtnText').textContent = 'Create House';
    resetHouseForm();
    document.getElementById('houseModal').style.display = 'flex';
}

// Show edit house modal
function editHouse(houseId) {
    const house = appState.houses.find(h => h.id === houseId);
    if (!house) return;

    currentHouse = house;
    selectedImages = [];
    document.getElementById('modalTitle').textContent = 'Edit House';
    document.getElementById('submitBtnText').textContent = 'Update House';
    
    // Fill form with house data
    document.getElementById('houseName').value = house.name;
    document.getElementById('houseDescription').value = house.description || '';
    document.getElementById('houseBedrooms').value = house.bedrooms;
    document.getElementById('houseBathrooms').value = house.bathrooms;
    // Convert daily price back to monthly rent for display
    document.getElementById('housePrice').value = Math.round(house.price_per_night * 30);
    document.getElementById('houseLocation').value = house.location || '';
    document.getElementById('houseAmenities').value = house.amenities ? house.amenities.join(', ') : '';
    document.getElementById('houseAvailable').checked = house.is_available;
    
    document.getElementById('houseModal').style.display = 'flex';
}

// Close house modal
function closeHouseModal() {
    document.getElementById('houseModal').style.display = 'none';
    resetHouseForm();
    currentHouse = null;
    selectedImages = [];
}

// Reset house form
function resetHouseForm() {
    document.getElementById('houseForm').reset();
    document.getElementById('previewImages').style.display = 'none';
    document.getElementById('previewImages').innerHTML = '';
}

// Handle image selection
function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    selectedImages = [...selectedImages, ...files];
    renderImagePreviews();
}

// Render image previews
function renderImagePreviews() {
    const previewContainer = document.getElementById('previewImages');
    
    if (selectedImages.length === 0) {
        previewContainer.style.display = 'none';
        return;
    }

    previewContainer.style.display = 'grid';
    
    const previewsHTML = selectedImages.map((image, index) => `
        <div class="preview-image">
            <img src="${URL.createObjectURL(image)}" alt="Preview ${index + 1}" />
            <button type="button" onclick="removeImage(${index})" class="remove-image">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    previewContainer.innerHTML = previewsHTML;
}

// Remove image from selection
function removeImage(index) {
    selectedImages.splice(index, 1);
    renderImagePreviews();
}

// Handle house form submission
async function handleHouseSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const submitSpinner = document.getElementById('submitSpinner');

    // Show loading state
    submitBtn.disabled = true;
    submitBtnText.style.display = 'none';
    submitSpinner.style.display = 'inline-block';

    try {
        const formData = new FormData();
        
        // Add form fields
        formData.append('name', document.getElementById('houseName').value);
        formData.append('description', document.getElementById('houseDescription').value);
        formData.append('bedrooms', document.getElementById('houseBedrooms').value);
        formData.append('bathrooms', document.getElementById('houseBathrooms').value);
        
        // Convert monthly rent to daily price for backend storage
        const monthlyRent = parseFloat(document.getElementById('housePrice').value);
        const dailyPrice = monthlyRent / 30;
        formData.append('price_per_night', dailyPrice.toFixed(2));
        
        formData.append('location', document.getElementById('houseLocation').value);
        formData.append('amenities', document.getElementById('houseAmenities').value);
        formData.append('is_available', document.getElementById('houseAvailable').checked);

        // Add images
        selectedImages.forEach(image => {
            formData.append('images', image);
        });

        const url = currentHouse ? 
            `${API_BASE_URL}/admin/houses/${currentHouse.id}` : 
            `${API_BASE_URL}/admin/houses`;
        
        const method = currentHouse ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            showToast(data.message, 'success');
            closeHouseModal();
            
            // Refresh the current view
            if (appState.currentPage === 'houses') {
                loadHouses();
            } else if (appState.currentPage === 'dashboard') {
                loadDashboardStats();
            }
        } else if (response.status === 401) {
            handleAuthError();
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to save house');
        }
    } catch (error) {
        console.error('Error saving house:', error);
        showToast(error.message, 'error');
    } finally {
        // Reset loading state
        submitBtn.disabled = false;
        submitBtnText.style.display = 'inline';
        submitSpinner.style.display = 'none';
    }
}

// Delete house
async function deleteHouse(houseId) {
    if (!confirm('Are you sure you want to delete this house?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/houses/${houseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            showToast(data.message, 'success');
            loadHouses();
        } else if (response.status === 401) {
            handleAuthError();
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete house');
        }
    } catch (error) {
        console.error('Error deleting house:', error);
        showToast(error.message, 'error');
    }
}

// Handle authentication errors
function handleAuthError() {
    authToken = null;
    localStorage.removeItem('adminToken');
    showToast('Session expired. Please login again.', 'error');
    showLogin();
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Utility function to capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// User Management Functions

function showUsers() {
    hideAllPages();
    document.getElementById('usersPage').style.display = 'block';
    loadUsers();
}

async function loadUsers() {
    const loadingHtml = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 40px;">
                <div class="loading-spinner"></div>
                <p>Loading users...</p>
            </td>
        </tr>
    `;
    
    document.getElementById('usersTableBody').innerHTML = loadingHtml;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            renderUsers(data.users);
            updateUserStats(data.users);
        } else {
            throw new Error('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTableBody').innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Failed to load users. Please try again.</p>
                </td>
            </tr>
        `;
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <i class="fas fa-users" style="font-size: 48px; color: #bdc3c7; margin-bottom: 15px;"></i>
                    <p>No users registered yet.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div class="user-info">
                    <div class="user-avatar">
                        ${user.profile_image 
                            ? `<img src="${user.profile_image}" alt="${user.name}">` 
                            : `<div class="avatar-placeholder">${user.name.charAt(0).toUpperCase()}</div>`
                        }
                    </div>
                    <div class="user-details">
                        <div class="user-name">${user.name}</div>
                        <div class="user-id">ID: ${user._id.substring(0, 8)}...</div>
                    </div>
                </div>
            </td>
            <td>${user.email}</td>
            <td>${user.age}</td>
            <td>${user.gender}</td>
            <td>
                <span class="status-badge ${user.is_verified ? 'verified' : 'unverified'}">
                    <i class="fas fa-${user.is_verified ? 'check-circle' : 'times-circle'}"></i>
                    ${user.is_verified ? 'Verified' : 'Unverified'}
                </span>
            </td>
            <td>
                <span class="status-badge ${user.is_active !== false ? 'active' : 'inactive'}">
                    <i class="fas fa-${user.is_active !== false ? 'user-check' : 'user-times'}"></i>
                    ${user.is_active !== false ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="toggleUserStatus('${user._id}', ${user.is_active !== false})" 
                            class="btn-sm ${user.is_active !== false ? 'btn-warning' : 'btn-success'}"
                            title="${user.is_active !== false ? 'Deactivate User' : 'Activate User'}">
                        <i class="fas fa-${user.is_active !== false ? 'user-slash' : 'user-check'}"></i>
                    </button>
                    <button onclick="viewUserDetails('${user._id}')" 
                            class="btn-sm btn-info" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="deleteUser('${user._id}', '${user.name}')" 
                            class="btn-sm btn-danger" title="Delete User">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateUserStats(users) {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.is_active !== false).length;
    const verifiedUsers = users.filter(user => user.is_verified).length;
    
    document.getElementById('totalUsersCount').textContent = totalUsers;
    document.getElementById('activeUsersCount').textContent = activeUsers;
    document.getElementById('verifiedUsersCount').textContent = verifiedUsers;
}

async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: !currentStatus })
        });

        if (response.ok) {
            showNotification(`User ${action}d successfully!`, 'success');
            loadUsers(); // Reload users table
        } else {
            throw new Error(`Failed to ${action} user`);
        }
    } catch (error) {
        console.error(`Error ${action}ing user:`, error);
        showNotification(`Failed to ${action} user. Please try again.`, 'error');
    }
}

async function deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showToast(`User "${userName}" deleted successfully!`, 'success');
            loadUsers(); // Reload users table
        } else {
            throw new Error('Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Failed to delete user. Please try again.', 'error');
    }
}

async function viewUserDetails(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            showUserDetailsModal(data.user);
        } else {
            throw new Error('Failed to load user details');
        }
    } catch (error) {
        console.error('Error loading user details:', error);
        showNotification('Failed to load user details. Please try again.', 'error');
    }
}

function showUserDetailsModal(user) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>User Details</h2>
                <button onclick="this.closest('.modal-overlay').remove()" class="close-button">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="user-profile">
                    <div class="profile-image">
                        ${user.profile_image 
                            ? `<img src="${user.profile_image}" alt="${user.name}">` 
                            : `<div class="avatar-placeholder large">${user.name.charAt(0).toUpperCase()}</div>`
                        }
                    </div>
                    <div class="profile-info">
                        <h3>${user.name}</h3>
                        <p class="email">${user.email}</p>
                        <div class="badges">
                            <span class="status-badge ${user.email_verified ? 'verified' : 'unverified'}">
                                <i class="fas fa-${user.email_verified ? 'check-circle' : 'times-circle'}"></i>
                                ${user.email_verified ? 'Email Verified' : 'Email Not Verified'}
                            </span>
                            <span class="status-badge ${user.is_active !== false ? 'active' : 'inactive'}">
                                <i class="fas fa-${user.is_active !== false ? 'user-check' : 'user-times'}"></i>
                                ${user.is_active !== false ? 'Active Account' : 'Inactive Account'}
                            </span>
                            ${user.terms_accepted ? '<span class="status-badge verified"><i class="fas fa-file-check"></i> Terms Accepted</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="details-grid">
                    <div class="detail-item">
                        <label>Age:</label>
                        <span>${user.age} years old</span>
                    </div>
                    <div class="detail-item">
                        <label>Gender:</label>
                        <span>${user.gender}</span>
                    </div>
                    <div class="detail-item">
                        <label>User ID:</label>
                        <span>${user._id}</span>
                    </div>
                    <div class="detail-item">
                        <label>Joined:</label>
                        <span>${formatDate(user.created_at)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

function formatDate(dateString) {
    if (!dateString || dateString === 'Unknown') return 'Unknown';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
}

function loadUserStats() {
    showNotification('Loading user statistics...', 'info');
    loadUsers(); // This will also update the stats
}

// ============================================
// BOOKING MANAGEMENT FUNCTIONS
// ============================================

let currentBookingFilter = 'all';
let bookingsData = [];

function showBookings() {
    // Update current page state
    appState.currentPage = 'bookings';
    
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.style.display = 'none');
    
    // Show bookings page
    const bookingsPage = document.getElementById('bookingsPage');
    if (bookingsPage) {
        bookingsPage.style.display = 'block';
        loadBookings();
        loadBookingStats();
    } else {
        showToast('Bookings page not found', 'error');
    }
}

async function loadBookings(status = currentBookingFilter) {
    try {
        showLoadingState('bookingsGrid');
        
        // Debug authentication
        console.log('Admin token exists:', !!authToken);
        console.log('Token preview:', authToken ? authToken.substring(0, 20) + '...' : 'No token');
        
        if (!authToken) {
            console.error('No admin token found');
            showToast('Admin authentication required. Please log in.', 'error');
            showLogin();
            return;
        }
        
        // Try to decode JWT token to check if it's valid format
        try {
            const tokenParts = authToken.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                console.log('Token payload:', payload);
                console.log('Token expires at:', new Date(payload.exp * 1000));
                console.log('Current time:', new Date());
                console.log('Token still valid:', payload.exp * 1000 > Date.now());
            }
        } catch (decodeError) {
            console.error('Failed to decode token:', decodeError);
        }
        
        let url = `${API_BASE_URL}/admin/bookings?per_page=50`;
        if (status && status !== 'all') {
            url += `&status=${status}`;
        }
        
        console.log('Making request to:', url);
        console.log('Authorization header:', `Bearer ${authToken.substring(0, 20)}...`);
        
        // First, let's test if the backend is reachable
        try {
            const healthCheck = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
            console.log('Health check status:', healthCheck.status);
            if (healthCheck.ok) {
                const healthData = await healthCheck.json();
                console.log('Backend health:', healthData);
            }
        } catch (healthError) {
            console.error('Backend server seems to be down:', healthError);
            showToast('Backend server is not responding. Please start the server.', 'error');
            return;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (response.ok) {
            const data = await response.json();
            bookingsData = data.bookings || [];
            renderBookings(bookingsData);
        } else if (response.status === 401) {
            console.error('Authentication failed - invalid or expired token');
            
            // Get response text to see the exact error
            const errorText = await response.text();
            console.error('Error response:', errorText);
            
            showToast('Admin session expired. Please log in again.', 'error');
            authToken = null;
            localStorage.removeItem('adminToken');
            showLogin();
        } else {
            const data = await response.json();
            console.error('API error:', data);
            throw new Error(data.error || 'Failed to load bookings');
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        showToast('Failed to load bookings: ' + error.message, 'error');
        hideLoadingState('bookingsGrid');
    }
}

async function loadBookingStats() {
    try {
        if (!authToken) {
            console.error('No admin token for stats request');
            return;
        }
        
        console.log('Loading booking stats...');
        
        const response = await fetch(`${API_BASE_URL}/admin/bookings/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Stats response status:', response.status);
        
        if (response.ok) {
            const stats = await response.json();
            console.log('Booking stats loaded:', stats);
            updateBookingStats(stats);
        } else if (response.status === 401) {
            console.error('Authentication failed for stats');
            showToast('Admin session expired. Please log in again.', 'error');
            authToken = null;
            localStorage.removeItem('adminToken');
            showLogin();
        } else {
            console.error('Failed to load booking stats:', response.status);
        }
    } catch (error) {
        console.error('Error loading booking stats:', error);
    }
}

function updateBookingStats(stats) {
    // Update stat cards
    const statElements = {
        'pendingBookingsCount': stats.pending || 0,
        'approvedBookingsCount': stats.approved || 0,
        'totalBookingsCount': stats.total || 0
    };
    
    // Calculate today's bookings (this would need backend enhancement)
    const todayBookings = bookingsData.filter(booking => {
        const bookingDate = new Date(booking.preferred_date);
        const today = new Date();
        return bookingDate.toDateString() === today.toDateString();
    });
    statElements['todayBookingsCount'] = todayBookings.length;
    
    Object.entries(statElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            // Animate the number
            animateNumber(element, parseInt(element.textContent) || 0, value, 1000);
        }
    });
}

function renderBookings(bookings) {
    const container = document.getElementById('bookingsGrid');
    hideLoadingState('bookingsGrid');
    
    if (!bookings || bookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No Bookings Found</h3>
                <p>No site review bookings match your current filter.</p>
            </div>
        `;
        return;
    }
    
    const html = bookings.map(booking => `
        <div class="booking-card admin-booking-card">
            <div class="booking-header">
                <div class="booking-status status-${booking.status}">
                    ${getBookingStatusIcon(booking.status)} ${booking.status.toUpperCase()}
                </div>
                <div class="booking-id">#${booking.id.substring(0, 8)}</div>
            </div>
            
            <div class="booking-customer-info">
                <div class="customer-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="customer-details">
                    <h4>${booking.user.name}</h4>
                    <p>${booking.user.email}</p>
                    <small>Booking Date: ${formatBookingDate(booking.created_at)}</small>
                </div>
            </div>
            
            <div class="booking-property-info">
                <div class="property-thumbnail">
                    <img src="${booking.house.images && booking.house.images[0] ? booking.house.images[0].image_url : 'https://via.placeholder.com/60x40'}" 
                         alt="${booking.house.name}" 
                         onerror="this.src='https://via.placeholder.com/60x40'">
                </div>
                <div class="property-info">
                    <h5>${booking.house.name}</h5>
                    <p><i class="fas fa-map-marker-alt"></i> ${booking.house.location}</p>
                    <p><strong>KSh ${(booking.house.price_per_night * 30).toLocaleString()}/month</strong></p>
                </div>
            </div>
            
            <div class="booking-schedule">
                <div class="schedule-item">
                    <i class="fas fa-calendar"></i>
                    <div>
                        <strong>Preferred:</strong><br>
                        ${formatBookingDate(booking.preferred_date)} at ${booking.preferred_time}
                    </div>
                </div>
                ${booking.confirmed_date ? `
                    <div class="schedule-item confirmed">
                        <i class="fas fa-check-circle"></i>
                        <div>
                            <strong>Confirmed:</strong><br>
                            ${formatBookingDate(booking.confirmed_date)} at ${booking.confirmed_time}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            ${booking.special_requests ? `
                <div class="booking-requests">
                    <i class="fas fa-comment"></i>
                    <p><strong>Special Requests:</strong> ${booking.special_requests}</p>
                </div>
            ` : ''}
            
            <div class="booking-actions">
                <button class="btn-outline btn-sm" onclick="viewBookingDetails('${booking.id}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
                ${booking.status === 'pending' ? `
                    <button class="btn-success btn-sm" onclick="approveBooking('${booking.id}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn-danger btn-sm" onclick="rejectBooking('${booking.id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                ` : ''}
                ${booking.status === 'approved' ? `
                    <button class="btn-info btn-sm" onclick="markCompleted('${booking.id}')">
                        <i class="fas fa-check-double"></i> Mark Complete
                    </button>
                ` : ''}
                <button class="btn-danger btn-sm" onclick="deleteBooking('${booking.id}')" style="background: #dc3545;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function getBookingStatusIcon(status) {
    const icons = {
        'pending': '<i class="fas fa-clock"></i>',
        'approved': '<i class="fas fa-check-circle"></i>',
        'rejected': '<i class="fas fa-times-circle"></i>',
        'completed': '<i class="fas fa-check-double"></i>',
        'cancelled': '<i class="fas fa-ban"></i>'
    };
    return icons[status] || '<i class="fas fa-question"></i>';
}

function formatBookingDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function filterBookings(status) {
    currentBookingFilter = status;
    
    // Update active filter button
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.status === status) {
            btn.classList.add('active');
        }
    });
    
    // Reload bookings with filter
    loadBookings(status);
}

async function approveBooking(bookingId) {
    const booking = bookingsData.find(b => b.id === bookingId);
    if (!booking) {
        showToast('Booking not found', 'error');
        return;
    }
    
    // Create approval modal content
    const modalContent = `
        <div class="booking-approval-form">
            <h3>Approve Booking Request</h3>
            <div class="customer-info">
                <p><strong>Customer:</strong> ${booking.user.name} (${booking.user.email})</p>
                <p><strong>Property:</strong> ${booking.house.name}</p>
                <p><strong>Preferred Date:</strong> ${formatBookingDate(booking.preferred_date)} at ${booking.preferred_time}</p>
            </div>
            
            <div class="form-group">
                <label for="confirmedDate">Confirmed Date:</label>
                <input type="date" id="confirmedDate" value="${booking.preferred_date}" class="form-input">
            </div>
            
            <div class="form-group">
                <label for="confirmedTime">Confirmed Time:</label>
                <select id="confirmedTime" class="form-input">
                    <option value="09:00" ${booking.preferred_time === '09:00' ? 'selected' : ''}>9:00 AM</option>
                    <option value="10:00" ${booking.preferred_time === '10:00' ? 'selected' : ''}>10:00 AM</option>
                    <option value="11:00" ${booking.preferred_time === '11:00' ? 'selected' : ''}>11:00 AM</option>
                    <option value="12:00" ${booking.preferred_time === '12:00' ? 'selected' : ''}>12:00 PM</option>
                    <option value="13:00" ${booking.preferred_time === '13:00' ? 'selected' : ''}>1:00 PM</option>
                    <option value="14:00" ${booking.preferred_time === '14:00' ? 'selected' : ''}>2:00 PM</option>
                    <option value="15:00" ${booking.preferred_time === '15:00' ? 'selected' : ''}>3:00 PM</option>
                    <option value="16:00" ${booking.preferred_time === '16:00' ? 'selected' : ''}>4:00 PM</option>
                    <option value="17:00" ${booking.preferred_time === '17:00' ? 'selected' : ''}>5:00 PM</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="adminNotes">Admin Notes (Optional):</label>
                <textarea id="adminNotes" placeholder="Any special instructions or notes for the customer..." class="form-input" rows="3"></textarea>
            </div>
        </div>
    `;
    
    // Show modal with approval form
    document.getElementById('bookingDetailsContent').innerHTML = modalContent;
    document.getElementById('bookingActionButtons').innerHTML = `
        <button class="btn-secondary" onclick="closeBookingModal()">Cancel</button>
        <button class="btn-success" onclick="confirmApproval('${bookingId}')">
            <i class="fas fa-check"></i> Approve Booking
        </button>
    `;
    
    document.getElementById('bookingDetailsModal').style.display = 'flex';
}

async function confirmApproval(bookingId) {
    const confirmedDate = document.getElementById('confirmedDate').value;
    const confirmedTime = document.getElementById('confirmedTime').value;
    const adminNotes = document.getElementById('adminNotes').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                confirmed_date: confirmedDate,
                confirmed_time: confirmedTime,
                admin_notes: adminNotes
            })
        });
        
        if (response.ok) {
            showToast('Booking approved successfully! Email sent to customer.', 'success');
            closeBookingModal();
            loadBookings(); // Refresh the list
            loadBookingStats(); // Refresh stats
        } else if (response.status === 401) {
            handleAuthError();
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to approve booking');
        }
    } catch (error) {
        console.error('Error approving booking:', error);
        showToast('Failed to approve booking: ' + error.message, 'error');
    }
}

async function rejectBooking(bookingId) {
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}/reject`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                admin_notes: reason || 'Booking request rejected'
            })
        });
        
        if (response.ok) {
            showToast('Booking rejected. Email sent to customer.', 'success');
            loadBookings(); // Refresh the list
            loadBookingStats(); // Refresh stats
        } else if (response.status === 401) {
            handleAuthError();
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to reject booking');
        }
    } catch (error) {
        console.error('Error rejecting booking:', error);
        showToast('Failed to reject booking: ' + error.message, 'error');
    }
}

function viewBookingDetails(bookingId) {
    const booking = bookingsData.find(b => b.id === bookingId);
    if (!booking) {
        showToast('Booking not found', 'error');
        return;
    }
    
    const modalContent = `
        <div class="booking-details-view">
            <div class="booking-overview">
                <div class="status-badge status-${booking.status}">
                    ${getBookingStatusIcon(booking.status)} ${booking.status.toUpperCase()}
                </div>
                <p><strong>Booking ID:</strong> ${booking.id}</p>
                <p><strong>Created:</strong> ${formatBookingDate(booking.created_at)}</p>
            </div>
            
            <div class="customer-section">
                <h4><i class="fas fa-user"></i> Customer Information</h4>
                <p><strong>Name:</strong> ${booking.user.name}</p>
                <p><strong>Email:</strong> ${booking.user.email}</p>
            </div>
            
            <div class="property-section">
                <h4><i class="fas fa-home"></i> Property Information</h4>
                <p><strong>Name:</strong> ${booking.house.name}</p>
                <p><strong>Location:</strong> ${booking.house.location}</p>
                <p><strong>Price:</strong> KSh ${(booking.house.price_per_night * 30).toLocaleString()}/month</p>
            </div>
            
            <div class="schedule-section">
                <h4><i class="fas fa-calendar"></i> Schedule Information</h4>
                <p><strong>Preferred Date:</strong> ${formatBookingDate(booking.preferred_date)}</p>
                <p><strong>Preferred Time:</strong> ${booking.preferred_time}</p>
                ${booking.confirmed_date ? `
                    <p><strong>Confirmed Date:</strong> ${formatBookingDate(booking.confirmed_date)}</p>
                    <p><strong>Confirmed Time:</strong> ${booking.confirmed_time}</p>
                ` : ''}
            </div>
            
            ${booking.special_requests ? `
                <div class="requests-section">
                    <h4><i class="fas fa-comment"></i> Special Requests</h4>
                    <p>${booking.special_requests}</p>
                </div>
            ` : ''}
            
            ${booking.admin_notes ? `
                <div class="notes-section">
                    <h4><i class="fas fa-sticky-note"></i> Admin Notes</h4>
                    <p>${booking.admin_notes}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('bookingDetailsContent').innerHTML = modalContent;
    document.getElementById('bookingActionButtons').innerHTML = `
        <button class="btn-secondary" onclick="closeBookingModal()">Close</button>
        ${booking.status === 'pending' ? `
            <button class="btn-success" onclick="closeBookingModal(); approveBooking('${booking.id}')">
                <i class="fas fa-check"></i> Approve
            </button>
            <button class="btn-danger" onclick="closeBookingModal(); rejectBooking('${booking.id}')">
                <i class="fas fa-times"></i> Reject
            </button>
        ` : ''}
    `;
    
    document.getElementById('bookingDetailsModal').style.display = 'flex';
}

function closeBookingModal() {
    document.getElementById('bookingDetailsModal').style.display = 'none';
}

function showLoadingState(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }
}

function hideLoadingState(containerId) {
    const container = document.getElementById(containerId);
    if (container && container.querySelector('.loading-state')) {
        // Loading will be replaced by actual content
    }
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    const difference = end - start;
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (difference * easeOut));
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

async function markCompleted(bookingId) {
    if (!confirm('Mark this booking as completed?')) {
        return;
    }
    
    try {
        // Note: You would need to implement this endpoint
        const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}/complete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            showToast('Booking marked as completed', 'success');
            loadBookings(); // Refresh the list
            loadBookingStats(); // Refresh stats
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to mark booking as completed');
        }
    } catch (error) {
        console.error('Error marking booking as completed:', error);
        showToast('Failed to update booking status', 'error');
    }
}

async function deleteBooking(bookingId) {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            showToast('Booking deleted successfully', 'success');
            loadBookings(); // Refresh the list
            loadBookingStats(); // Refresh stats
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete booking');
        }
    } catch (error) {
        console.error('Error deleting booking:', error);
        showToast('Failed to delete booking: ' + error.message, 'error');
    }
}
