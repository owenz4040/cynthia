// Dashboard functionality
// Global app state
const appState = {
    currentPage: 'dashboard',
    currentUser: null,
    currentBookings: []
};

// Global activity tracking function
window.trackActivity = function(icon, text) {
    try {
        // Get stored activities from localStorage
        const storedActivities = localStorage.getItem('userActivities');
        let activities = storedActivities ? JSON.parse(storedActivities) : [];
        
        const newActivity = {
            icon: icon,
            text: text,
            time: 'Just now',
            timestamp: new Date().toISOString()
        };
        
        // Add new activity to the beginning
        activities.unshift(newActivity);
        
        // Keep only the latest 10 activities
        const trimmedActivities = activities.slice(0, 10);
        
        // Save to localStorage
        localStorage.setItem('userActivities', JSON.stringify(trimmedActivities));
        
        console.log('Activity tracked:', text);
        
        // Update display if on dashboard and function exists
        if (appState.currentPage === 'dashboard' && typeof loadActivity === 'function') {
            loadActivity();
        }
    } catch (error) {
        console.log('Activity tracking error:', error.message);
        console.log('Activity:', icon, text);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Ensure user is authenticated and has accepted terms
    if (!AuthUtils.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    if (!AuthUtils.hasAcceptedTerms()) {
        window.location.href = 'terms.html';
        return;
    }
    // Detect admin user
    const userData = AuthUtils.getUserData();
    const isAdmin = userData && (userData.role === 'admin' || userData.is_admin);
    if (isAdmin) {
        document.getElementById('admin-panel-section').style.display = 'block';
    }
    // Initialize dashboard
    initializeDashboard();
    setupNavigation();
    setupUserMenu();
    loadUserProfile();
    loadDashboardData();
    setupProfileImageUpload();
    // Check if returning from terms acceptance with property booking
    checkForPendingBooking();
    // Admin panel event listeners
    if (isAdmin) {
        document.getElementById('loadAdminUsersBtn').onclick = loadAdminUsers;
        document.getElementById('loadAdminHousesBtn').onclick = loadAdminHouses;
        document.getElementById('loadAdminBookingsBtn').onclick = loadAdminBookings;
    }
    // Admin panel loaders
    async function loadAdminUsers() {
        const list = document.getElementById('adminUsersList');
        list.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading users...';
        try {
            const response = await AuthUtils.apiRequest('/admin/users');
            if (response.users && response.users.length) {
                list.innerHTML = response.users.map(u => `<div><b>${u.name}</b> (${u.email}) - ${u.is_active ? 'Active' : 'Inactive'} <button onclick="alert('Not implemented')">Delete</button></div>`).join('');
            } else {
                list.innerHTML = 'No users found.';
            }
        } catch (e) {
            list.innerHTML = 'Error loading users.';
        }
    }
    async function loadAdminHouses() {
        const list = document.getElementById('adminHousesList');
        list.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading houses...';
        try {
            const response = await AuthUtils.apiRequest('/admin/houses');
            if (response.houses && response.houses.length) {
                list.innerHTML = response.houses.map(h => `<div><b>${h.name}</b> (${h.location}) - ${h.is_available ? 'Available' : 'Unavailable'} <button onclick="alert('Not implemented')">Delete</button></div>`).join('');
            } else {
                list.innerHTML = 'No houses found.';
            }
        } catch (e) {
            list.innerHTML = 'Error loading houses.';
        }
    }
    async function loadAdminBookings() {
        const list = document.getElementById('adminBookingsList');
        list.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading bookings...';
        try {
            const response = await AuthUtils.apiRequest('/admin/bookings');
            if (response.bookings && response.bookings.length) {
                list.innerHTML = response.bookings.map(b => `<div><b>${b.house.name}</b> - ${b.user.name} (${b.status}) <button onclick="alert('Approve/Reject not implemented')">Manage</button></div>`).join('');
            } else {
                list.innerHTML = 'No bookings found.';
            }
        } catch (e) {
            list.innerHTML = 'Error loading bookings.';
        }
    }
    
    function checkForPendingBooking() {
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('property');
        const fromBooking = urlParams.get('from') === 'booking';
        
        if (propertyId && fromBooking && AuthUtils.hasSiteVisitTermsAccepted()) {
            // Track terms acceptance activity if just accepted
            const termsDate = AuthUtils.getSiteVisitTermsAcceptedDate();
            if (termsDate) {
                const termsAcceptedTime = new Date(termsDate);
                const now = new Date();
                const timeDiff = now - termsAcceptedTime;
                
                // If terms were accepted within the last 5 minutes, it's likely from this session
                if (timeDiff < 5 * 60 * 1000) {
                    trackActivity('fa-file-signature', 'You accepted the Site Visit Terms & Conditions');
                }
            }
            
            // Small delay to ensure page is fully loaded
            setTimeout(() => {
                openBookingModal(propertyId);
                // Clean up URL parameters
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 500);
        }
    }
    
    function setupProfileImageUpload() {
        const profileImageInput = document.getElementById('profileImageInput');
        if (profileImageInput) {
            profileImageInput.addEventListener('change', handleProfileImageUpload);
        }
    }
    
    async function handleProfileImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Please select a valid image file.', 'error');
            return;
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            showNotification('Image file must be less than 5MB.', 'error');
            return;
        }
        
        try {
            // Debug: Check if token exists
            const token = AuthUtils.getToken();
            console.log('Token exists:', !!token);
            if (token) {
                console.log('Token preview:', token.substring(0, 20) + '...');
            }
            
            // Show loading state
            const profileAvatar = document.getElementById('profileAvatar');
            const changeAvatarBtn = document.querySelector('.change-avatar-btn');
            
            if (changeAvatarBtn) {
                changeAvatarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                changeAvatarBtn.disabled = true;
            }
            
            // Create FormData and upload
            const formData = new FormData();
            formData.append('profileImage', file);
            
            const response = await fetch(`${AuthUtils.API_BASE}/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${AuthUtils.getToken()}`
                },
                body: formData
            });
            
            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                console.error('JSON parsing error:', jsonError);
                throw new Error('Invalid response from server');
            }
            
            if (response.ok) {
                // Update profile avatar immediately
                if (profileAvatar && result.user.profile_image) {
                    profileAvatar.src = result.user.profile_image;
                }
                
                // Update user avatar in navigation
                const userAvatar = document.getElementById('userAvatar');
                if (userAvatar && result.user.profile_image) {
                    userAvatar.src = result.user.profile_image;
                }
                
                // Update stored user data
                const userData = AuthUtils.getUserData();
                if (userData) {
                    userData.profile_image = result.user.profile_image;
                    localStorage.setItem('userData', JSON.stringify(userData));
                }
                
                // Track profile update activity
                trackActivity('fa-user-edit', 'You updated your profile picture');
                
                showNotification('Profile picture updated successfully!', 'success');
            } else {
                throw new Error(result.error || 'Failed to upload profile picture');
            }
            
        } catch (error) {
            console.error('Profile picture upload error:', error);
            showNotification(error.message || 'Failed to upload profile picture.', 'error');
        } finally {
            // Reset button state
            const changeAvatarBtn = document.querySelector('.change-avatar-btn');
            if (changeAvatarBtn) {
                changeAvatarBtn.innerHTML = '<i class="fas fa-camera"></i>';
                changeAvatarBtn.disabled = false;
            }
            
            // Clear file input
            event.target.value = '';
        }
    }
    
    function initializeDashboard() {
        const userData = AuthUtils.getUserData();
        if (userData) {
            // Update user name in navigation
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = userData.name;
            }
            
            // Update user avatar
            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar && userData.profile_image) {
                userAvatar.src = userData.profile_image;
            }
        }
    }
    
    function setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        const sections = document.querySelectorAll('.content-section');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetSection = this.dataset.section;
                
                // Update app state
                appState.currentPage = targetSection;
                
                // Update active nav link
                navLinks.forEach(nl => nl.classList.remove('active'));
                this.classList.add('active');
                
                // Show target section
                sections.forEach(section => {
                    section.classList.remove('active');
                    section.style.display = 'none'; // Ensure hidden
                });
                
                const targetElement = document.getElementById(`${targetSection}-section`);
                if (targetElement) {
                    targetElement.classList.add('active');
                    targetElement.style.display = 'block'; // Override inline styles
                    
                    // Track section visit activity
                    const sectionNames = {
                        'dashboard': 'Dashboard',
                        'properties': 'Properties',
                        'bookings': 'My Bookings',
                        'profile': 'Profile',
                        'settings': 'Settings'
                    };
                    
                    if (targetSection !== 'dashboard') {
                        trackActivity('fa-eye', `You visited the ${sectionNames[targetSection]} section`);
                    }
                    
                    // Load section-specific data
                    loadSectionData(targetSection);
                }
            });
        });
        
        // Handle view-all links
        const viewAllLinks = document.querySelectorAll('.view-all[data-section]');
        viewAllLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetSection = this.dataset.section;
                
                // Trigger nav link click
                const navLink = document.querySelector(`.nav-link[data-section="${targetSection}"]`);
                if (navLink) {
                    navLink.click();
                }
            });
        });
    }
    
    function setupUserMenu() {
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function() {
                userDropdown.classList.remove('show');
            });
            
            // Handle dropdown item clicks
            const dropdownItems = userDropdown.querySelectorAll('.dropdown-item[data-section]');
            dropdownItems.forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    const section = this.dataset.section;
                    const navLink = document.querySelector(`.nav-link[data-section="${section}"]`);
                    if (navLink) {
                        navLink.click();
                    }
                    userDropdown.classList.remove('show');
                });
            });
        }
        
        // Handle logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                AuthUtils.logout();
            });
        }
    }
    
    async function loadUserProfile() {
        try {
            const response = await AuthUtils.apiRequest('/profile');
            const user = response.user;
            
            // Update profile section
            updateProfileSection(user);
            
        } catch (error) {
            console.error('Failed to load profile:', error);
            showNotification('Failed to load profile data.', 'error');
        }
    }
    
    function updateProfileSection(user) {
        // Update profile elements
        const elements = {
            'profileName': user.name,
            'profileEmail': user.email,
            'detailName': user.name,
            'detailEmail': user.email,
            'detailAge': user.age,
            'detailGender': user.gender
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Update profile avatar
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar && user.profile_image) {
            profileAvatar.src = user.profile_image;
        }
        
        // Update member since date
        const memberSince = document.getElementById('memberSince');
        if (memberSince && user.created_at) {
            const date = new Date(user.created_at);
            memberSince.textContent = date.getFullYear();
        }
        
        // Update verification badge
        const verifiedBadge = document.getElementById('verifiedBadge');
        if (verifiedBadge) {
            if (user.is_verified) {
                verifiedBadge.style.display = 'inline-flex';
            } else {
                verifiedBadge.style.display = 'none';
            }
        }
        
        // Update site visit terms badge
        const siteVisitTermsBadge = document.getElementById('siteVisitTermsBadge');
        if (siteVisitTermsBadge) {
            if (AuthUtils.hasSiteVisitTermsAccepted()) {
                siteVisitTermsBadge.style.display = 'inline-flex';
                const acceptedDate = AuthUtils.getSiteVisitTermsAcceptedDate();
                if (acceptedDate) {
                    const date = new Date(acceptedDate);
                    siteVisitTermsBadge.title = `Accepted on ${date.toLocaleDateString()}`;
                }
            } else {
                siteVisitTermsBadge.style.display = 'none';
            }
        }
    }
    
    async function loadDashboardData() {
        await Promise.all([
            loadProperties(),
            loadStats(),
            loadActivity()
        ]);
    }
    
    async function loadProperties() {
        try {
            showLoadingState('featuredProperties');
            
            const response = await AuthUtils.apiRequest('/houses?per_page=6');
            const houses = response.houses || [];
            
            displayFeaturedProperties(houses);
            
        } catch (error) {
            console.error('Failed to load properties:', error);
            showEmptyState('featuredProperties', 'No properties available');
        }
    }
    
    function displayFeaturedProperties(properties) {
        const container = document.getElementById('featuredProperties');
        if (!container) return;
        
        if (properties.length === 0) {
            showEmptyState(container, 'No properties available');
            return;
        }
        
        // Create carousel wrapper
        const carouselHTML = `
            <div class="featured-carousel">
                <div class="carousel-container">
                    <div class="carousel-track" id="featuredCarouselTrack">
                        ${properties.map((property, index) => `
                            <div class="property-card carousel-slide ${index === 0 ? 'active' : ''}" onclick="viewProperty('${property._id}')">
                                <div class="property-image">
                                    <img src="${property.images && property.images[0] ? property.images[0].image_url : 'https://via.placeholder.com/300x200'}" 
                                         alt="${property.name}" 
                                         onerror="this.src='https://via.placeholder.com/300x200'">
                                    <div class="property-price">KSh ${property.price_per_month.toLocaleString()}/month</div>
                                </div>
                                <div class="property-info">
                                    <h4 class="property-title">${property.name}</h4>
                                    <p class="property-location">
                                        <i class="fas fa-map-marker-alt"></i>
                                        ${property.location || 'Location not specified'}
                                    </p>
                                    <div class="property-features">
                                        <span class="feature">
                                            <i class="fas fa-bed"></i>
                                            ${property.bedrooms} bed${property.bedrooms !== 1 ? 's' : ''}
                                        </span>
                                        <span class="feature">
                                            <i class="fas fa-bath"></i>
                                            ${property.bathrooms} bath${property.bathrooms !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div class="property-actions">
                                        <button class="btn-primary" onclick="event.stopPropagation(); bookProperty('${property._id}')">
                                            Book Now
                                        </button>
                                        <button class="btn-heart" onclick="event.stopPropagation(); toggleFavorite('${property._id}')">
                                            <i class="fas fa-heart"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Carousel controls -->
                <div class="carousel-controls">
                    <button class="carousel-btn prev-btn" data-action="previous">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="carousel-btn next-btn" data-action="next">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    <button class="carousel-btn play-pause-btn" data-action="toggle">
                        <i class="fas fa-pause" id="playPauseIcon"></i>
                    </button>
                </div>
                
                <!-- Carousel indicators -->
                <div class="carousel-indicators">
                    ${properties.map((_, index) => `
                        <span class="indicator ${index === 0 ? 'active' : ''}" data-slide="${index}"></span>
                    `).join('')}
                </div>
                
                <!-- Progress bar -->
                <div class="carousel-progress">
                    <div class="progress-bar" id="featuredProgressBar"></div>
                </div>
            </div>
        `;
        
        container.innerHTML = carouselHTML;
        
        // Initialize carousel
        initializeFeaturedCarousel(properties.length);
    }

    // Featured Properties Carousel - Make it globally accessible
    window.featuredCarousel = {
        currentSlide: 0,
        totalSlides: 0,
        autoPlayInterval: null,
        isAutoPlaying: true,
        autoPlayDelay: 2000, // 2 seconds

        init: function(slideCount) {
            this.totalSlides = slideCount;
            this.currentSlide = 0;
            this.startAutoPlay();
            this.updateProgressBar();
        },

        next: function() {
            this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
            this.updateSlides();
            this.restartAutoPlay();
        },

        previous: function() {
            this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
            this.updateSlides();
            this.restartAutoPlay();
        },

        goToSlide: function(slideIndex) {
            this.currentSlide = slideIndex;
            this.updateSlides();
            this.restartAutoPlay();
        },

        updateSlides: function() {
            const slides = document.querySelectorAll('.featured-carousel .carousel-slide');
            const indicators = document.querySelectorAll('.featured-carousel .indicator');
            
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === this.currentSlide);
            });
            
            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === this.currentSlide);
            });

            this.updateProgressBar();
        },

        startAutoPlay: function() {
            this.stopAutoPlay(); // Clear any existing interval first
            
            if (this.isAutoPlaying && this.totalSlides > 1) {
                this.autoPlayInterval = setInterval(() => {
                    this.next();
                }, this.autoPlayDelay);
            }
        },

        stopAutoPlay: function() {
            if (this.autoPlayInterval) {
                clearInterval(this.autoPlayInterval);
                this.autoPlayInterval = null;
            }
        },

        restartAutoPlay: function() {
            if (this.isAutoPlaying) {
                this.startAutoPlay(); // startAutoPlay already calls stopAutoPlay
            }
        },

        toggleAutoPlay: function() {
            this.isAutoPlaying = !this.isAutoPlaying;
            const icon = document.getElementById('playPauseIcon');
            
            if (this.isAutoPlaying) {
                icon.className = 'fas fa-pause';
                this.startAutoPlay();
            } else {
                icon.className = 'fas fa-play';
                this.stopAutoPlay();
            }
        },

        updateProgressBar: function() {
            const progressBar = document.getElementById('featuredProgressBar');
            if (progressBar && this.totalSlides > 0) {
                const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
                progressBar.style.width = `${progress}%`;
            }
        }
    };

    function initializeFeaturedCarousel(slideCount) {
        window.featuredCarousel.init(slideCount);
        
        // Add click handlers for carousel controls
        const carouselControls = document.querySelector('.carousel-controls');
        if (carouselControls) {
            carouselControls.addEventListener('click', function(e) {
                const button = e.target.closest('button[data-action]');
                if (button) {
                    const action = button.dataset.action;
                    switch(action) {
                        case 'previous':
                            window.featuredCarousel.previous();
                            break;
                        case 'next':
                            window.featuredCarousel.next();
                            break;
                        case 'toggle':
                            window.featuredCarousel.toggleAutoPlay();
                            break;
                    }
                }
            });
        }
        
        // Add click handlers for indicators
        const indicators = document.querySelector('.carousel-indicators');
        if (indicators) {
            indicators.addEventListener('click', function(e) {
                const indicator = e.target.closest('.indicator[data-slide]');
                if (indicator) {
                    const slideIndex = parseInt(indicator.dataset.slide);
                    window.featuredCarousel.goToSlide(slideIndex);
                }
            });
        }
        
        // Add keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') {
                window.featuredCarousel.previous();
            } else if (e.key === 'ArrowRight') {
                window.featuredCarousel.next();
            } else if (e.key === ' ') {
                e.preventDefault();
                window.featuredCarousel.toggleAutoPlay();
            }
        });

        // Pause autoplay on hover
        const carouselContainer = document.querySelector('.featured-carousel');
        if (carouselContainer) {
            carouselContainer.addEventListener('mouseenter', () => {
                window.featuredCarousel.stopAutoPlay();
            });
            
            carouselContainer.addEventListener('mouseleave', () => {
                if (window.featuredCarousel.isAutoPlaying) {
                    window.featuredCarousel.startAutoPlay();
                }
            });
        }
    }

    async function loadStats() {
        try {
            // Simulate stats loading - in real app, these would come from API
            const stats = {
                totalProperties: 0,
                savedProperties: 0,
                activeBookings: 0,
                pendingRequests: 0
            };
            
            // Get actual property count
            const response = await AuthUtils.apiRequest('/houses?per_page=1');
            stats.totalProperties = response.total || 0;
            
            updateStats(stats);
            
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }
    
    function updateStats(stats) {
        const elements = {
            'totalProperties': stats.totalProperties,
            'savedProperties': stats.savedProperties,
            'activeBookings': stats.activeBookings,
            'pendingRequests': stats.pendingRequests
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                // Animate number change
                animateNumber(element, value);
            }
        });
    }
    
    function animateNumber(element, targetValue) {
        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const startTime = Date.now();
        
        function update() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        update();
    }
    
    function loadActivity() {
        // Get real user activities from localStorage
        const activities = getUserActivities();
        displayActivity(activities);
    }
    
    function getUserActivities() {
        // Get stored activities from localStorage
        const storedActivities = localStorage.getItem('userActivities');
        let activities = storedActivities ? JSON.parse(storedActivities) : [];
        
        // If no activities exist, add welcome message
        if (activities.length === 0) {
            activities.push({
                icon: 'fa-user-plus',
                text: 'Welcome! You successfully joined our rental platform',
                time: getTimeAgo(new Date()),
                timestamp: new Date().toISOString()
            });
            
            // Check if site visit terms were accepted
            if (AuthUtils.hasSiteVisitTermsAccepted()) {
                const termsDate = AuthUtils.getSiteVisitTermsAcceptedDate();
                if (termsDate) {
                    activities.push({
                        icon: 'fa-file-contract',
                        text: 'You accepted the Site Visit Terms & Conditions',
                        time: getTimeAgo(new Date(termsDate)),
                        timestamp: termsDate
                    });
                }
            }
        }
        
        // Sort by timestamp (newest first) and limit to 6 items
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return activities.slice(0, 6);
    }
    
    function getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        } else {
            const weeks = Math.floor(diffInSeconds / 604800);
            return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
        }
    }
    
    // Function to track user activities
    function trackActivity(icon, text) {
        const activities = getUserActivities();
        const newActivity = {
            icon: icon,
            text: text,
            time: 'Just now',
            timestamp: new Date().toISOString()
        };
        
        // Add new activity to the beginning
        activities.unshift(newActivity);
        
        // Keep only the latest 10 activities
        const trimmedActivities = activities.slice(0, 10);
        
        // Save to localStorage
        localStorage.setItem('userActivities', JSON.stringify(trimmedActivities));
        
        // Update display if on dashboard
        if (appState.currentPage === 'dashboard') {
            loadActivity();
        }
    }
    
    function displayActivity(activities) {
        const container = document.getElementById('activityList');
        if (!container) return;
        
        const html = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.text}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    async function loadSectionData(section) {
        // Store current page for reference
        window.appState = window.appState || {};
        window.appState.currentPage = section;
        
        switch (section) {
            case 'properties':
                await loadAllProperties();
                break;
            case 'bookings':
                await loadUserBookings();
                setupBookingFilters();
                break;
            case 'profile':
                await loadUserProfile();
                break;
            case 'settings':
                loadSettings();
                break;
        }
    }
    
    async function loadAllProperties() {
        try {
            showLoadingState('propertiesGrid');
            
            const response = await AuthUtils.apiRequest('/houses?per_page=12');
            const properties = response.houses || [];
            
            displayPropertiesGrid(properties);
            setupPropertyFilters();
            
        } catch (error) {
            console.error('Failed to load all properties:', error);
            showEmptyState('propertiesGrid', 'Failed to load properties');
        }
    }
    
    function displayPropertiesGrid(properties) {
        const container = document.getElementById('propertiesGrid');
        if (!container) return;
        
        if (properties.length === 0) {
            showEmptyState(container, 'No properties found');
            return;
        }
        
        const html = properties.map(property => `
            <div class="property-card" onclick="viewProperty('${property._id}')">
                <div class="property-image">
                    <img src="${property.images && property.images[0] ? property.images[0].image_url : 'https://via.placeholder.com/300x200'}" 
                         alt="${property.name}"
                         onerror="this.src='https://via.placeholder.com/300x200'">
                    <div class="property-price">KSh ${property.price_per_month.toLocaleString()}/month</div>
                </div>
                <div class="property-info">
                    <h4 class="property-title">${property.name}</h4>
                    <p class="property-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${property.location || 'Location not specified'}
                    </p>
                    <div class="property-features">
                        <span class="feature">
                            <i class="fas fa-bed"></i>
                            ${property.bedrooms} bed${property.bedrooms !== 1 ? 's' : ''}
                        </span>
                        <span class="feature">
                            <i class="fas fa-bath"></i>
                            ${property.bathrooms} bath${property.bathrooms !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div class="property-actions">
                        <button class="btn-primary" onclick="event.stopPropagation(); bookProperty('${property._id}')">
                            Book Now
                        </button>
                        <button class="btn-heart" onclick="event.stopPropagation(); toggleFavorite('${property._id}')">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    function setupPropertyFilters() {
        const searchInput = document.getElementById('searchInput');
        const bedroomFilter = document.getElementById('bedroomFilter');
        const priceFilter = document.getElementById('priceFilter');
        const clearFilters = document.getElementById('clearFilters');
        
        // Implement filter functionality
        if (searchInput) {
            searchInput.addEventListener('input', debounce(filterProperties, 300));
        }
        
        if (bedroomFilter) {
            bedroomFilter.addEventListener('change', filterProperties);
        }
        
        if (priceFilter) {
            priceFilter.addEventListener('change', filterProperties);
        }
        
        if (clearFilters) {
            clearFilters.addEventListener('click', function() {
                if (searchInput) searchInput.value = '';
                if (bedroomFilter) bedroomFilter.value = '';
                if (priceFilter) priceFilter.value = '';
                
                // Track clear filters activity
                trackActivity('fa-eraser', 'You cleared all property filters');
                
                filterProperties();
            });
        }
    }
    
    function filterProperties() {
        // Track search/filter activity
        const searchInput = document.getElementById('searchInput');
        const bedroomFilter = document.getElementById('bedroomFilter');
        const priceFilter = document.getElementById('priceFilter');
        
        let filterDescription = '';
        
        if (searchInput && searchInput.value.trim()) {
            filterDescription = `You searched for "${searchInput.value.trim()}"`;
        } else if (bedroomFilter && bedroomFilter.value) {
            const bedroomText = bedroomFilter.value === '4' ? '4+ bedrooms' : `${bedroomFilter.value} bedroom${bedroomFilter.value !== '1' ? 's' : ''}`;
            filterDescription = `You filtered properties by ${bedroomText}`;
        } else if (priceFilter && priceFilter.value) {
            // Convert price filter value to descriptive text
            const priceRanges = {
                '0-15000': 'KSh 0 - 15,000/month',
                '15000-30000': 'KSh 15,000 - 30,000/month',
                '30000-50000': 'KSh 30,000 - 50,000/month',
                '50000-75000': 'KSh 50,000 - 75,000/month',
                '75000+': 'KSh 75,000+/month'
            };
            const priceRange = priceRanges[priceFilter.value] || 'price range';
            filterDescription = `You filtered properties by ${priceRange}`;
        }
        
        if (filterDescription) {
            trackActivity('fa-search', filterDescription);
        }
        
        // In a real application, this would make API calls with filter parameters
        console.log('Filtering properties...');
        loadAllProperties(); // For now, just reload
    }
    
    function loadSettings() {
        // Load user settings
        console.log('Loading settings...');
    }
    
    function showLoadingState(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    Loading...
                </div>
            `;
        }
    }
    
    function showEmptyState(containerId, message) {
        const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-home"></i>
                    <h3>No Properties Found</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    }
    
    // Utility function for debouncing
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
});

// Global functions for property interactions
function viewProperty(propertyId) {
    console.log('Viewing property:', propertyId);
    
    // Track property view activity
    const property = getCurrentProperty(propertyId);
    const propertyName = property ? property.name : 'a property';
    trackActivity('fa-home', `You viewed "${propertyName}"`);
    
    showNotification('Property details feature coming soon!', 'info');
}

// ============================================
// BOOKING FUNCTIONALITY
// ============================================

function scheduleReview(propertyId) {
    console.log('Scheduling review for property:', propertyId);
    console.trace('scheduleReview called from:'); // Add stack trace to see where this is called from
    
    // Check if user has accepted site visit terms
    if (!AuthUtils.hasSiteVisitTermsAccepted()) {
        if (confirm('You need to accept our Site Visit Terms & Conditions before scheduling a property visit. Would you like to review them now?')) {
            // Redirect to terms page with return URL
            window.location.href = `site-visit-terms.html?from=booking&return=${encodeURIComponent(window.location.href)}&property=${propertyId}`;
        }
        return;
    }
    
    openBookingModal(propertyId);
}

function openBookingModal(propertyId) {
    // Get property details first
    const property = getCurrentProperty(propertyId);
    if (!property) {
        showNotification('Property not found', 'error');
        return;
    }
    
    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    document.getElementById('preferredDate').min = minDate;
    
    // Populate property info in modal
    const propertyInfo = document.getElementById('bookingPropertyInfo');
    propertyInfo.innerHTML = `
        <div class="booking-property-card">
            <div class="property-image-small">
                <img src="${property.images && property.images[0] ? property.images[0].image_url : 'https://via.placeholder.com/80x60'}" 
                     alt="${property.name}" 
                     onerror="this.src='https://via.placeholder.com/80x60'">
            </div>
            <div class="property-details-small">
                <h4>${property.name}</h4>
                <p><i class="fas fa-map-marker-alt"></i> ${property.location}</p>
                <p><strong>KSh ${property.price_per_month.toLocaleString()}/month</strong></p>
            </div>
        </div>
    `;
    
    // Store property ID for form submission
    document.getElementById('bookingForm').dataset.propertyId = propertyId;
    
    // Reset form
    document.getElementById('bookingForm').reset();
    
    // Show modal
    showModal('bookingModal');
}

function getCurrentProperty(propertyId) {
    // This is a simplified version - in a real app, you might need to fetch from API
    // For now, we'll assume the property data is available from the current view
    const propertyCards = document.querySelectorAll('.property-card');
    for (let card of propertyCards) {
        if (card.onclick && card.onclick.toString().includes(propertyId)) {
            // Extract property data from the card (this is a workaround)
            // In a real implementation, you'd fetch from API or store in a data structure
            return {
                _id: propertyId,
                name: card.querySelector('.property-title')?.textContent || 'Property',
                location: card.querySelector('.property-location')?.textContent?.replace('📍', '').trim() || 'Location',
                price_per_month: card.querySelector('.property-price')?.textContent?.match(/\d+/)?.[0] || '0',
                images: [{
                    image_url: card.querySelector('.property-image img')?.src || ''
                }]
            };
        }
    }
    return null;
}

// Initialize booking form handling
document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
    }
});

async function handleBookingSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBookingBtn');
    const btnText = document.getElementById('bookingBtnText');
    const spinner = document.getElementById('bookingSpinner');
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    
    try {
        // Check authentication before making request
        if (!AuthUtils.isAuthenticated()) {
            console.warn('User not authenticated, redirecting to login');
            showNotification('Please log in to book a site visit', 'error');
            return;
        }
        
        // Check if terms are accepted
        if (!AuthUtils.hasSiteVisitTermsAccepted()) {
            console.warn('Site visit terms not accepted');
            showNotification('Please accept the site visit terms before booking', 'error');
            return;
        }
        
        const formData = new FormData(e.target);
        const propertyId = e.target.dataset.propertyId;
        
        if (!propertyId) {
            throw new Error('Property ID is missing');
        }
        
        const bookingData = {
            house_id: propertyId,
            preferred_date: formData.get('preferredDate'),
            preferred_time: formData.get('preferredTime'),
            special_requests: formData.get('specialRequests') || '',
            terms_accepted: true,
            terms_accepted_date: AuthUtils.getSiteVisitTermsAcceptedDate()
        };
        
        // Validate booking data
        if (!bookingData.preferred_date || !bookingData.preferred_time) {
            throw new Error('Please select both a preferred date and time');
        }
        
        console.log('Submitting booking data:', bookingData);
        
        const result = await AuthUtils.apiRequest('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
        
        // Track booking activity
        try {
            const property = getCurrentProperty(propertyId);
            const propertyName = property ? property.name : 'a property';
            trackActivity('fa-calendar-plus', `You scheduled a site visit for "${propertyName}"`);
        } catch (activityError) {
            console.log('Could not track activity:', activityError.message);
        }
        
        showNotification('Site review booking submitted successfully! Please remember to bring valid Kenyan ID and arrive on time. You will receive an email confirmation once approved.', 'success');
        closeModal('bookingModal');
        
        // Refresh bookings if on bookings page
        if (appState.currentPage === 'bookings') {
            loadUserBookings();
        }
        
    } catch (error) {
        console.error('Booking submission error:', error);
        
        // Don't show error notification if it's a token expiration (handled by AuthUtils)
        if (!error.message.includes('Token has expired')) {
            showNotification(error.message || 'Failed to submit booking request', 'error');
        }
    } finally {
        // Reset loading state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

// ============================================
// BOOKINGS MANAGEMENT
// ============================================

async function loadUserBookings(page = 1, status = null) {
    console.log('Loading user bookings - page:', page, 'status:', status);
    
    try {
        // Check authentication before making request
        if (!AuthUtils.isAuthenticated()) {
            console.warn('User not authenticated, redirecting to login');
            return;
        }
        
        let endpoint = `/bookings?page=${page}&per_page=10`;
        if (status && status !== 'all') {
            endpoint += `&status=${status}`;
        }
        
        console.log('Fetching bookings from endpoint:', endpoint);
        const result = await AuthUtils.apiRequest(endpoint);
        
        console.log('Bookings loaded successfully:', result.bookings.length, 'bookings');
        appState.currentBookings = result.bookings;
        renderBookings(result.bookings);
        renderBookingsPagination(result);
        
    } catch (error) {
        console.error('Failed to load bookings:', error);
        
        // Don't show error notification if it's a token expiration (handled by AuthUtils)
        if (!error.message.includes('Token has expired')) {
            showNotification('Failed to load bookings', 'error');
        }
    }
}

function renderBookings(bookings) {
    const container = document.getElementById('bookingsGrid');
    
    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No Bookings Yet</h3>
                <p>You haven't scheduled any site reviews yet. Browse properties and schedule your first viewing!</p>
                <a href="#" class="btn-primary" onclick="showSection('properties')">Browse Properties</a>
            </div>
        `;
        return;
    }
    
    const html = bookings.map(booking => `
        <div class="booking-card">
            <div class="booking-header">
                <div class="booking-status status-${booking.status}">
                    ${getStatusIcon(booking.status)} ${booking.status.toUpperCase()}
                </div>
                <div class="booking-date-small">
                    Booked: ${formatDate(booking.created_at)}
                </div>
            </div>
            
            <div class="booking-property">
                <div class="property-image-small">
                    <img src="${booking.house.images && booking.house.images[0] ? booking.house.images[0].image_url : 'https://via.placeholder.com/80x60'}" 
                         alt="${booking.house.name}" 
                         onerror="this.src='https://via.placeholder.com/80x60'">
                </div>
                <div class="property-details-small">
                    <h4>${booking.house.name}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${booking.house.location}</p>
                    <p><strong>KSh ${booking.house.price_per_month.toLocaleString()}/month</strong></p>
                </div>
            </div>
            
            <div class="booking-details">
                <div class="booking-time">
                    <i class="fas fa-calendar"></i>
                    <div>
                        <strong>Preferred Date:</strong> ${formatDate(booking.preferred_date)} at ${booking.preferred_time}
                        ${booking.confirmed_date ? `<br><strong>Confirmed Date:</strong> ${formatDate(booking.confirmed_date)} at ${booking.confirmed_time}` : ''}
                    </div>
                </div>
                
                ${getStatusMessage(booking)}
                
                ${booking.special_requests ? `
                    <div class="booking-requests">
                        <i class="fas fa-comment"></i>
                        <div><strong>Special Requests:</strong> ${booking.special_requests}</div>
                    </div>
                ` : ''}
                
                ${booking.admin_notes ? `
                    <div class="booking-notes">
                        <i class="fas fa-sticky-note"></i>
                        <div><strong>Admin Notes:</strong> ${booking.admin_notes}</div>
                    </div>
                ` : ''}
            </div>
            
            <div class="booking-actions">
                ${booking.status === 'pending' || booking.status === 'approved' ? `
                    <button class="btn-secondary btn-sm" onclick="cancelBooking('${booking.id}')">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                ` : ''}
                <button class="btn-outline btn-sm" onclick="viewBookingDetails('${booking.id}')">
                    <i class="fas fa-eye"></i> Details
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function getStatusIcon(status) {
    const icons = {
        'pending': '<i class="fas fa-clock"></i>',
        'approved': '<i class="fas fa-check-circle"></i>',
        'rejected': '<i class="fas fa-times-circle"></i>',
        'completed': '<i class="fas fa-check-double"></i>',
        'cancelled': '<i class="fas fa-ban"></i>'
    };
    return icons[status] || '<i class="fas fa-question"></i>';
}

function getStatusMessage(booking) {
    const messages = {
        'pending': `
            <div class="booking-status-message" style="background: #fff3cd; color: #856404; padding: 10px; border-radius: 8px; margin: 10px 0;">
                <i class="fas fa-hourglass-half"></i> 
                <strong>Awaiting Review:</strong> Your booking request is being reviewed by our admin team. You'll receive an email notification once it's processed.
            </div>
        `,
        'approved': `
            <div class="booking-status-message" style="background: #d4edda; color: #155724; padding: 10px; border-radius: 8px; margin: 10px 0;">
                <i class="fas fa-thumbs-up"></i> 
                <strong>Approved!</strong> Your site review has been confirmed. ${booking.confirmed_date ? `Visit on ${formatDate(booking.confirmed_date)} at ${booking.confirmed_time}.` : 'Check your email for confirmation details.'}
            </div>
        `,
        'rejected': `
            <div class="booking-status-message" style="background: #f8d7da; color: #721c24; padding: 10px; border-radius: 8px; margin: 10px 0;">
                <i class="fas fa-exclamation-triangle"></i> 
                <strong>Not Approved:</strong> This booking request was not approved. ${booking.admin_notes ? 'See admin notes below for details.' : 'Please contact support if you have questions.'}
            </div>
        `,
        'completed': `
            <div class="booking-status-message" style="background: #d1ecf1; color: #0c5460; padding: 10px; border-radius: 8px; margin: 10px 0;">
                <i class="fas fa-medal"></i> 
                <strong>Visit Completed:</strong> Your site review has been completed. Thank you for visiting our property!
            </div>
        `,
        'cancelled': `
            <div class="booking-status-message" style="background: #f5f5f5; color: #6c757d; padding: 10px; border-radius: 8px; margin: 10px 0;">
                <i class="fas fa-info-circle"></i> 
                <strong>Cancelled:</strong> This booking has been cancelled.
            </div>
        `
    };
    return messages[booking.status] || '';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function renderBookingsPagination(data) {
    const container = document.getElementById('bookingsPagination');
    if (data.total_pages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination-controls">';
    
    for (let i = 1; i <= data.total_pages; i++) {
        html += `
            <button class="page-btn ${i === data.page ? 'active' : ''}" 
                    onclick="loadUserBookings(${i})">
                ${i}
            </button>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function viewBookingDetails(bookingId) {
    showNotification('Booking details feature coming soon!', 'info');
}

async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }
    
    try {
        // Check authentication before making request
        if (!AuthUtils.isAuthenticated()) {
            console.warn('User not authenticated, redirecting to login');
            return;
        }
        
        const result = await AuthUtils.apiRequest(`/bookings/${bookingId}/cancel`, {
            method: 'POST'
        });
        
        // Track cancellation activity
        trackActivity('fa-calendar-times', 'You cancelled a site visit booking');
        
        showNotification('Booking cancelled successfully', 'success');
        loadUserBookings(); // Refresh the list
        
    } catch (error) {
        console.error('Failed to cancel booking:', error);
        
        // Don't show error notification if it's a token expiration (handled by AuthUtils)
        if (!error.message.includes('Token has expired')) {
            showNotification('Failed to cancel booking', 'error');
        }
    }
}

function bookProperty(propertyId) {
    // Check if user has accepted site visit terms
    if (!AuthUtils.hasSiteVisitTermsAccepted()) {
        if (confirm('You need to accept our Site Visit Terms & Conditions before scheduling a property visit. Would you like to review them now?')) {
            // Redirect to terms page with return URL
            window.location.href = `site-visit-terms.html?from=booking&return=${encodeURIComponent(window.location.href)}&property=${propertyId}`;
        }
        return;
    }
    
    // Redirect to the new scheduling function
    scheduleReview(propertyId);
}

function toggleFavorite(propertyId) {
    const heartBtn = event.target.closest('.btn-heart');
    if (heartBtn) {
        heartBtn.classList.toggle('liked');
        const isLiked = heartBtn.classList.contains('liked');
        
        // Track favorite activity
        const property = getCurrentProperty(propertyId);
        const propertyName = property ? property.name : 'a property';
        
        if (isLiked) {
            trackActivity('fa-heart', `You saved "${propertyName}" to your favorites`);
        } else {
            trackActivity('fa-heart-broken', `You removed "${propertyName}" from your favorites`);
        }
        
        showNotification(
            isLiked ? 'Property saved to favorites!' : 'Property removed from favorites!',
            'success'
        );
    }
}

function setupBookingFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            filterTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Filter bookings by status
            const status = this.dataset.status;
            filterBookingsByStatus(status);
        });
    });
}

function filterBookingsByStatus(status) {
    // Track booking filter activity
    const statusNames = {
        'all': 'all bookings',
        'pending': 'pending bookings',
        'approved': 'approved bookings',
        'rejected': 'rejected bookings',
        'completed': 'completed bookings',
        'cancelled': 'cancelled bookings'
    };
    
    const statusName = statusNames[status] || 'bookings';
    trackActivity('fa-filter', `You filtered to view ${statusName}`);
    
    // Reload bookings with status filter
    loadUserBookings(1, status);
}

// ============================================
// MODAL UTILITIES
// ============================================

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modalId);
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal(modalId);
            }
        });
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ============================================
// NOTIFICATION UTILITIES
// ============================================

function showNotification(message, type = 'info') {
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll('.dashboard-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `dashboard-notification notification-${type}`;
    
    // Set basic styles and content
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        display: flex;
        align-items: center;
        justify-content: space-between;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Set colors based on type
    const colors = {
        'success': { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
        'error': { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
        'warning': { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
        'info': { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' }
    };
    
    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.border = `1px solid ${color.border}`;
    notification.style.color = color.text;
    
    // Add content
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" style="background: none; border: none; cursor: pointer; margin-left: 10px; opacity: 0.7; color: inherit;">
            ×
        </button>
    `;
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.onclick = function() {
        notification.remove();
    };
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Add CSS for notification animation if not already present
if (!document.querySelector('#dashboard-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'dashboard-notification-styles';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .notification-close {
            background: none;
            border: none;
            cursor: pointer;
            margin-left: 10px;
            opacity: 0.7;
        }
        
        .notification-close:hover {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
}

// Navigation helper function for manual section switching
function showSection(sectionName) {
    const navLink = document.querySelector(`.nav-link[data-section="${sectionName}"]`);
    if (navLink) {
        navLink.click();
    } else {
        console.error(`Section not found: ${sectionName}`);
    }
}
