// Landing page functionality

// Initialize landing page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Show loading screen for 2 seconds then reveal the landing page
    setTimeout(function() {
        const loadingScreen = document.getElementById('loadingScreen');
        const landingPage = document.getElementById('landingPage');
        
        if (loadingScreen && landingPage) {
            // Fade out loading screen
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.5s ease-out';
            
            setTimeout(function() {
                loadingScreen.style.display = 'none';
                landingPage.style.display = 'block';
                
                // Fade in landing page
                landingPage.style.opacity = '0';
                landingPage.style.transition = 'opacity 0.5s ease-in';
                
                setTimeout(function() {
                    landingPage.style.opacity = '1';
                }, 50);
            }, 500);
        }
    }, 2000);
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Simple notification function for landing page
function showNotification(message, type = 'info', duration = 5000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    `;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            break;
        case 'info':
        default:
            notification.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
            break;
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize landing page
    initializeLandingPage();
    setupScrollEffects();
    setupNavigationScrolling();
});

function initializeLandingPage() {
    // Show landing page after loading animation
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        const landingPage = document.getElementById('landingPage');
        
        if (loadingScreen && landingPage) {
            loadingScreen.style.display = 'none';
            landingPage.style.display = 'block';
        }
    }, 3000); // 3 seconds loading time

    // Landing page should be accessible to everyone
    // Authentication checks removed to prevent token errors
}

function setupScrollEffects() {
    // Navbar background on scroll
    const navbar = document.querySelector('.landing-nav');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    // Observe stat items
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = `all 0.5s ease ${index * 0.1}s`;
        observer.observe(item);
    });
}

function setupNavigationScrolling() {
    // Smooth scrolling for nav links
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function showGetStarted() {
    showModal('getStartedModal');
    
    // Add entrance animation to option cards
    const optionCards = document.querySelectorAll('.option-card');
    optionCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function scrollToFeatures() {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        const offsetTop = featuresSection.offsetTop - 80;
        
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Enhanced modal functionality
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modal.style.opacity = '0';
        
        // Animate modal entrance
        setTimeout(() => {
            modal.style.transition = 'opacity 0.3s ease';
            modal.style.opacity = '1';
        }, 10);
        
        document.body.style.overflow = 'hidden';
        
        // If it's the get started modal, initialize the signin form
        if (modalId === 'getStartedModal') {
            setTimeout(() => showAuthForm('signin'), 100);
        }
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modalId);
            }
        });
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Reset forms when closing
            const forms = modal.querySelectorAll('form');
            forms.forEach(form => form.reset());
            
            // Hide any messages
            const authMessage = document.getElementById('authMessage');
            if (authMessage) {
                authMessage.style.display = 'none';
            }
        }, 300);
    }
}

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    // Close modal with Escape key
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'flex') {
                const modalId = modal.id;
                closeModal(modalId);
            }
        });
    }
});

// Add hover effects to CTA buttons
document.addEventListener('DOMContentLoaded', function() {
    const ctaButtons = document.querySelectorAll('.btn-primary.large, .btn-secondary.large, .btn-outline.large');
    
    ctaButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});

// Preload critical pages
function preloadPages() {
    const criticalPages = ['register.html', 'login.html'];
    
    criticalPages.forEach(page => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = page;
        document.head.appendChild(link);
    });
}

// Call preload after page loads
window.addEventListener('load', preloadPages);

// Add typing effect to hero title (optional enhancement)
function addTypingEffect() {
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;
    
    const originalText = heroTitle.innerHTML;
    const gradientText = heroTitle.querySelector('.gradient-text');
    
    if (gradientText) {
        const gradientTextContent = gradientText.textContent;
        const beforeGradient = originalText.split(gradientTextContent)[0];
        
        heroTitle.innerHTML = beforeGradient;
        
        setTimeout(() => {
            let index = 0;
            const typeInterval = setInterval(() => {
                if (index < gradientTextContent.length) {
                    heroTitle.innerHTML = beforeGradient + '<span class="gradient-text">' + 
                                         gradientTextContent.substring(0, index + 1) + '</span>';
                    index++;
                } else {
                    clearInterval(typeInterval);
                }
            }, 100);
        }, 3500); // Start after loading animation
    }
}

// Initialize typing effect
setTimeout(addTypingEffect, 3000);

// Performance optimization: Lazy load images
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading
document.addEventListener('DOMContentLoaded', setupLazyLoading);

// Add page transition effects
window.addEventListener('beforeunload', function() {
    document.body.style.opacity = '0';
});

// Analytics and tracking (placeholder)
function trackEvent(eventName, eventData = {}) {
    // Placeholder for analytics tracking
    console.log(`Event: ${eventName}`, eventData);
}

// Track user interactions
document.addEventListener('click', function(e) {
    if (e.target.matches('.btn-primary.large')) {
        trackEvent('CTA_Click', { button: 'Get Started' });
    } else if (e.target.matches('.btn-secondary.large')) {
        trackEvent('CTA_Click', { button: 'Learn More' });
    } else if (e.target.matches('.nav-link')) {
        trackEvent('Navigation_Click', { link: e.target.textContent });
    }
});

// Easter egg: Konami code
let konamiCode = [];
const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

document.addEventListener('keydown', function(e) {
    konamiCode.push(e.code);
    
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        showNotification('🎉 Konami code activated! You found the easter egg!', 'success', 5000);
        
        // Add special effects
        document.body.style.animation = 'rainbow 2s ease-in-out';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 2000);
        
        konamiCode = [];
    }
});

// Add rainbow animation for easter egg
const rainbowStyle = document.createElement('style');
rainbowStyle.textContent = `
    @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        25% { filter: hue-rotate(90deg); }
        50% { filter: hue-rotate(180deg); }
        75% { filter: hue-rotate(270deg); }
        100% { filter: hue-rotate(360deg); }
    }
`;
document.head.appendChild(rainbowStyle);

// ============================================
// ENHANCED PROPERTY CAROUSEL FUNCTIONALITY
// ============================================

let currentSlide = 0;
let carouselProperties = [];
let carouselInterval;
let isAutoSlideActive = true;
let progressInterval;

// API Base URL
const API_BASE = window.Config ? window.Config.API_BASE : 'http://localhost:5000/api';

// Initialize carousel when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add a flag to prevent multiple loading
    if (!window.carouselLoaded) {
        window.carouselLoaded = true;
        console.log('Initializing enhanced carousel for the first time...');
        loadCarouselProperties();
        startAutoSlide();
    } else {
        console.log('Carousel already loaded, skipping...');
    }
});

// Load properties for carousel
async function loadCarouselProperties() {
    try {
        console.log('Loading carousel properties...');
        
        // Make API call to public endpoint (no authentication required)
        const response = await fetch(`${API_BASE}/houses/public?per_page=6`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
                // No Authorization header needed for public endpoint
            }
        });
        
        console.log('API Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Properties data:', data);
            
            if (data.houses && data.houses.length > 0) {
                carouselProperties = data.houses;
                renderCarousel();
                setupCarouselIndicators();
                updateCarouselCounter();
                console.log(`Loaded ${carouselProperties.length} real properties for carousel`);
            } else {
                console.log('No properties found in database, showing demo properties');
                showDemoProperties();
            }
        } else {
            console.log('API call failed with status:', response.status);
            const errorData = await response.json().catch(() => ({}));
            console.log('Error response:', errorData);
            showDemoProperties();
        }
    } catch (error) {
        console.error('Error loading carousel properties:', error);
        console.log('Network error, falling back to demo properties');
        showDemoProperties();
    }
}

// Show demo properties when API is not available
function showDemoProperties() {
    carouselProperties = [
        {
            _id: 'demo1',
            name: 'Modern Downtown Apartment',
            location: 'Westlands, Nairobi',
            price_per_month: 4500, // KSh 4,500/month
            bedrooms: 2,
            bathrooms: 1,
            images: []
        },
        {
            _id: 'demo2',
            name: 'Luxury Garden Villa',
            location: 'Karen, Nairobi',
            price_per_month: 15000, // KSh 15,000/month
            bedrooms: 4,
            bathrooms: 3,
            images: []
        },
        {
            _id: 'demo3',
            name: 'Cozy Studio Apartment',
            location: 'Kilimani, Nairobi',
            price_per_month: 3000, // KSh 3,000/month
            bedrooms: 1,
            bathrooms: 1,
            images: []
        },
        {
            _id: 'demo4',
            name: 'Executive Penthouse',
            location: 'Upperhill, Nairobi',
            price_per_month: 24000, // KSh 24,000/month
            bedrooms: 3,
            bathrooms: 2,
            images: []
        }
    ];
    
    renderCarousel();
    setupCarouselIndicators();
    updateCarouselCounter();
    console.log('Demo properties loaded for carousel');
}

// Render carousel with properties
function renderCarousel() {
    const carouselTrack = document.getElementById('carouselTrack');
    console.log('renderCarousel called, carouselTrack found:', !!carouselTrack);
    console.log('carouselProperties:', carouselProperties);
    
    if (!carouselTrack) {
        console.error('carouselTrack element not found!');
        return;
    }
    
    if (!carouselProperties || carouselProperties.length === 0) {
        console.warn('No properties to render');
        return;
    }
    
    const html = carouselProperties.map((property, index) => {
        console.log(`Rendering property ${index}:`, property);
        
        return `
            <div class="property-card-demo ${index === 0 ? 'active' : ''}" data-slide="${index}">
                <div class="property-image-demo">
                    ${property.images && property.images.length > 0 ? 
                        `<img src="${property.images[0].image_url}" alt="${property.name}" 
                              onerror="console.log('Image failed to load:', this.src); this.style.display='none'; this.nextElementSibling.style.display='flex';">
                         <div class="image-placeholder" style="display: none;">
                             <i class="fas fa-home"></i>
                         </div>` :
                        `<div class="image-placeholder">
                             <i class="fas fa-home"></i>
                         </div>`
                    }
                    <div class="property-price">KSh ${property.price_per_month.toLocaleString()}/month</div>
                </div>
                <div class="property-info-demo">
                    <h4>${property.name || 'Beautiful Property'}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${property.location || 'Prime Location'}</p>
                    <div class="property-features-demo">
                        <span><i class="fas fa-bed"></i> ${property.bedrooms || 1} bed${property.bedrooms !== 1 ? 's' : ''}</span>
                        <span><i class="fas fa-bath"></i> ${property.bathrooms || 1} bath${property.bathrooms !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="property-actions-demo">
                        <button class="btn-primary small" onclick="redirectToSignup()">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('Generated HTML length:', html.length);
    carouselTrack.innerHTML = html;
    console.log('HTML injected into carouselTrack');
    
    updateCarouselPosition();
}

// Setup carousel indicators
function setupCarouselIndicators() {
    const indicatorsContainer = document.getElementById('carouselIndicators');
    if (!indicatorsContainer || carouselProperties.length <= 1) return;
    
    const indicators = carouselProperties.map((_, index) => 
        `<div class="indicator ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})" title="Property ${index + 1}"></div>`
    ).join('');
    
    indicatorsContainer.innerHTML = indicators;
}

// Update carousel counter
function updateCarouselCounter() {
    const currentSlideNumber = document.getElementById('currentSlideNumber');
    const totalSlides = document.getElementById('totalSlides');
    
    if (currentSlideNumber && totalSlides) {
        currentSlideNumber.textContent = currentSlide + 1;
        totalSlides.textContent = carouselProperties.length;
    }
}

// Carousel navigation functions
function nextSlide() {
    if (carouselProperties.length <= 1) return;
    
    currentSlide = (currentSlide + 1) % carouselProperties.length;
    updateCarouselPosition();
    updateIndicators();
    updateCarouselCounter();
    resetProgressBar();
}

function previousSlide() {
    if (carouselProperties.length <= 1) return;
    
    currentSlide = currentSlide === 0 ? carouselProperties.length - 1 : currentSlide - 1;
    updateCarouselPosition();
    updateIndicators();
    updateCarouselCounter();
    resetProgressBar();
}

function goToSlide(index) {
    if (carouselProperties.length <= 1) return;
    
    currentSlide = index;
    updateCarouselPosition();
    updateIndicators();
    updateCarouselCounter();
    resetProgressBar();
}

// Update carousel position
function updateCarouselPosition() {
    const carouselTrack = document.getElementById('carouselTrack');
    if (!carouselTrack) return;
    
    const translateX = -currentSlide * 100;
    carouselTrack.style.transform = `translateX(${translateX}%)`;
    
    // Update active class
    const cards = carouselTrack.querySelectorAll('.property-card-demo');
    cards.forEach((card, index) => {
        card.classList.toggle('active', index === currentSlide);
    });
}

// Update indicators
function updateIndicators() {
    const indicators = document.querySelectorAll('.indicator');
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide);
    });
}

// Enhanced Auto-slide functionality with 2-second interval
function startAutoSlide() {
    if (carouselInterval) clearInterval(carouselInterval);
    if (progressInterval) clearInterval(progressInterval);
    
    if (!isAutoSlideActive || carouselProperties.length <= 1) return;
    
    // Auto-slide every 2 seconds
    carouselInterval = setInterval(() => {
        nextSlide();
    }, 2000);
    
    // Update progress bar
    startProgressBar();
    
    console.log('Auto-slide started with 2-second interval');
}

function stopAutoSlide() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = '0%';
    }
    
    console.log('Auto-slide stopped');
}

function toggleAutoSlide() {
    isAutoSlideActive = !isAutoSlideActive;
    const playPauseIcon = document.getElementById('playPauseIcon');
    
    if (isAutoSlideActive) {
        startAutoSlide();
        if (playPauseIcon) playPauseIcon.className = 'fas fa-pause';
    } else {
        stopAutoSlide();
        if (playPauseIcon) playPauseIcon.className = 'fas fa-play';
    }
}

// Progress bar functionality
function startProgressBar() {
    if (progressInterval) clearInterval(progressInterval);
    
    const progressBar = document.getElementById('progressBar');
    if (!progressBar) return;
    
    let progress = 0;
    const duration = 2000; // 2 seconds
    const updateInterval = 20; // Update every 20ms for smooth animation
    const increment = (100 / duration) * updateInterval;
    
    progressInterval = setInterval(() => {
        progress += increment;
        progressBar.style.width = `${Math.min(progress, 100)}%`;
        
        if (progress >= 100) {
            clearInterval(progressInterval);
        }
    }, updateInterval);
}

function resetProgressBar() {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = '0%';
    }
    
    if (isAutoSlideActive && carouselProperties.length > 1) {
        setTimeout(startProgressBar, 50);
    }
}

// Enhanced hover functionality
document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.modern-carousel-container');
    if (carousel) {
        carousel.addEventListener('mouseenter', () => {
            if (isAutoSlideActive) {
                stopAutoSlide();
                console.log('Auto-slide paused on hover');
            }
        });
        
        carousel.addEventListener('mouseleave', () => {
            if (isAutoSlideActive) {
                startAutoSlide();
                console.log('Auto-slide resumed after hover');
            }
        });
    }
});

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return; // Don't interfere with form inputs
    }
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            previousSlide();
            break;
        case 'ArrowRight':
            e.preventDefault();
            nextSlide();
            break;
        case ' ': // Spacebar
            e.preventDefault();
            toggleAutoSlide();
            break;
    }
});

// Touch/swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
            previousSlide(); // Swipe right
        } else {
            nextSlide(); // Swipe left
        }
    }
}

// Redirect to signup when user wants to view details
function redirectToSignup() {
    showNotification('Please create an account to view detailed property information and schedule site visits!', 'info', 3000);
    setTimeout(() => {
        window.location.href = 'register.html';
    }, 2000);
}

// Mobile Menu Functions
function toggleMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobileNavMenu');
    
    if (toggle && mobileMenu) {
        toggle.classList.toggle('active');
        
        if (mobileMenu.style.display === 'block') {
            mobileMenu.style.display = 'none';
        } else {
            mobileMenu.style.display = 'block';
        }
    }
}

function closeMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobileNavMenu');
    
    if (toggle && mobileMenu) {
        toggle.classList.remove('active');
        mobileMenu.style.display = 'none';
    }
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobileNavMenu');
    
    if (toggle && mobileMenu && !toggle.contains(event.target) && !mobileMenu.contains(event.target)) {
        toggle.classList.remove('active');
        mobileMenu.style.display = 'none';
    }
});

// Close mobile menu on window resize
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobileNavMenu');
        
        if (toggle && mobileMenu) {
            toggle.classList.remove('active');
            mobileMenu.style.display = 'none';
        }
    }
});

// Auth Modal Toggle Functions
function showAuthForm(formType) {
    const signinForm = document.getElementById('signinForm');
    const registerForm = document.getElementById('registerForm');
    const signinToggle = document.getElementById('signInToggle');
    const createAccountToggle = document.getElementById('createAccountToggle');
    const toggleSlider = document.getElementById('toggleSlider');
    
    // Clear any previous messages
    const authMessage = document.getElementById('authMessage');
    if (authMessage) {
        authMessage.style.display = 'none';
    }
    
    if (formType === 'signin') {
        signinForm.classList.add('active');
        registerForm.classList.remove('active');
        signinToggle.classList.add('active');
        createAccountToggle.classList.remove('active');
        toggleSlider.classList.remove('register');
    } else {
        registerForm.classList.add('active');
        signinForm.classList.remove('active');
        createAccountToggle.classList.add('active');
        signinToggle.classList.remove('active');
        toggleSlider.classList.add('register');
    }
}

// Initialize auth modal when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up form event listeners
    const modalSigninForm = document.getElementById('modalSigninForm');
    const modalRegisterForm = document.getElementById('modalRegisterForm');
    
    if (modalSigninForm) {
        modalSigninForm.addEventListener('submit', handleModalSignin);
    }
    
    if (modalRegisterForm) {
        modalRegisterForm.addEventListener('submit', handleModalRegister);
    }
});

// Handle signin form submission
async function handleModalSignin(e) {
    e.preventDefault();
    
    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;
    const btnText = document.getElementById('signinBtnText');
    const spinner = document.getElementById('signinSpinner');
    const submitBtn = e.target.querySelector('.auth-submit-btn');
    
    // Show loading state
    btnText.style.display = 'none';
    spinner.style.display = 'block';
    submitBtn.disabled = true;
    
    try {
        const apiBase = window.Config ? window.Config.API_BASE : 'https://cynthia-api.onrender.com/api';
        
        const response = await fetch(`${apiBase}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showAuthMessage('Sign in successful! Redirecting...', 'success');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showAuthMessage(data.error || 'Sign in failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Sign in error:', error);
        showAuthMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        // Reset loading state
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Handle register form submission
async function handleModalRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const age = document.getElementById('registerAge').value;
    const email = document.getElementById('registerEmail').value;
    const gender = document.getElementById('registerGender').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    const btnText = document.getElementById('registerBtnText');
    const spinner = document.getElementById('registerSpinner');
    const submitBtn = e.target.querySelector('.auth-submit-btn');
    
    // Validation
    if (password !== confirmPassword) {
        showAuthMessage('Passwords do not match!', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showAuthMessage('Please agree to the Terms & Conditions!', 'error');
        return;
    }
    
    if (parseInt(age) < 18) {
        showAuthMessage('You must be at least 18 years old to register!', 'error');
        return;
    }
    
    // Show loading state
    btnText.style.display = 'none';
    spinner.style.display = 'block';
    submitBtn.disabled = true;
    
    try {
        const apiBase = window.Config ? window.Config.API_BASE : 'https://cynthia-api.onrender.com/api';
        
        const response = await fetch(`${apiBase}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                age: parseInt(age),
                email,
                gender,
                password,
                confirmPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAuthMessage('Account created successfully! Please check your email to verify your account.', 'success');
            
            // Reset form
            e.target.reset();
            
            // Switch to signin form after delay
            setTimeout(() => {
                showAuthForm('signin');
            }, 3000);
        } else {
            showAuthMessage(data.error || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAuthMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        // Reset loading state
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Show auth message
function showAuthMessage(message, type) {
    const authMessage = document.getElementById('authMessage');
    if (authMessage) {
        authMessage.textContent = message;
        authMessage.className = `auth-message ${type}`;
        authMessage.style.display = 'block';
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                authMessage.style.display = 'none';
            }, 5000);
        }
    }
}
