// Terms and conditions page functionality
document.addEventListener('DOMContentLoaded', function() {
    const acceptTermsCheckbox = document.getElementById('acceptTerms');
    const acceptBtn = document.getElementById('acceptBtn');
    const declineBtn = document.getElementById('declineBtn');
    const declineModal = document.getElementById('declineModal');
    const confirmDeclineBtn = document.getElementById('confirmDeclineBtn');
    
    // Ensure user is authenticated
    if (!AuthUtils.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Check if terms are already accepted
    if (AuthUtils.hasAcceptedTerms()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Load user data and update UI
    const userData = AuthUtils.getUserData();
    if (userData) {
        // Could personalize the terms page with user name
        console.log('Welcome to terms page,', userData.name);
    }
    
    // Enable/disable accept button based on checkbox
    acceptTermsCheckbox.addEventListener('change', function() {
        acceptBtn.disabled = !this.checked;
        
        if (this.checked) {
            acceptBtn.style.opacity = '1';
            acceptBtn.style.cursor = 'pointer';
        } else {
            acceptBtn.style.opacity = '0.6';
            acceptBtn.style.cursor = 'not-allowed';
        }
    });
    
    // Handle accept button click
    acceptBtn.addEventListener('click', async function() {
        if (!acceptTermsCheckbox.checked) {
            showNotification('Please read and accept the terms and conditions.', 'warning');
            return;
        }
        
        showLoading('acceptBtn', 'Processing...');
        
        console.log('Attempting to accept terms...', {
            apiBase: AuthUtils.API_BASE,
            hasToken: !!AuthUtils.getToken(),
            user: AuthUtils.getUserData()
        });
        
        try {
            const response = await AuthUtils.apiRequest('/accept-terms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Update local user data
            const userData = AuthUtils.getUserData();
            if (userData) {
                userData.terms_accepted = true;
                AuthUtils.setUserData(userData);
            }
            
            // Enhanced terms acceptance notification
            const userName = userData ? userData.name : 'User';
            showNotification(`✅ Terms accepted successfully! Welcome to your dashboard, ${userName}! You now have full access to our rental system.`, 'success', 6000);
            
            // Log successful terms acceptance
            console.log('✅ Terms accepted successfully:', {
                user: userName,
                email: userData ? userData.email : 'unknown',
                timestamp: new Date().toISOString()
            });
            
            // Show redirect notification
            setTimeout(() => {
                showNotification('🏠 Redirecting to your dashboard...', 'info', 2000);
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            }, 2000);
            
        } catch (error) {
            console.error('❌ Terms acceptance error:', error);
            
            // Enhanced error handling
            let errorMessage = 'Failed to accept terms. Please try again.';
            
            if (error.message) {
                errorMessage = error.message;
            } else if (error.status === 401) {
                errorMessage = 'Session expired. Please log in again.';
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else if (error.status === 500) {
                errorMessage = 'Server error. Please try again in a few moments.';
            }
            
            showNotification(`❌ ${errorMessage}`, 'error', 6000);
        } finally {
            hideLoading('acceptBtn');
        }
    });
    
    // Handle decline button click
    declineBtn.addEventListener('click', function() {
        showModal('declineModal');
    });
    
    // Handle confirm decline
    confirmDeclineBtn.addEventListener('click', async function() {
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
        
        try {
            // Logout user
            await AuthUtils.logout();
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even if API call fails
            AuthUtils.removeToken();
            window.location.href = 'login.html';
        }
    });
    
    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal('declineModal');
        }
    });
    
    // Handle browser back button - prevent going back without accepting terms
    window.addEventListener('beforeunload', function(e) {
        if (!AuthUtils.hasAcceptedTerms()) {
            const confirmationMessage = 'You must accept the terms and conditions to continue. Are you sure you want to leave?';
            e.returnValue = confirmationMessage;
            return confirmationMessage;
        }
    });
    
    // Prevent direct navigation away from terms page
    window.addEventListener('popstate', function(e) {
        if (!AuthUtils.hasAcceptedTerms()) {
            e.preventDefault();
            showNotification('Please accept the terms and conditions to continue.', 'warning');
            history.pushState(null, null, window.location.href);
        }
    });
    
    // Push state to prevent back navigation
    history.pushState(null, null, window.location.href);
    
    // Handle ESC key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal('declineModal');
        }
    });
    
    // Scroll to top on page load
    window.scrollTo(0, 0);
    
    // Add smooth scrolling for terms sections
    const termsContent = document.querySelector('.terms-content');
    if (termsContent) {
        // Add scroll indicators
        let isScrolling = false;
        
        termsContent.addEventListener('scroll', function() {
            if (!isScrolling) {
                // Add scroll shadow effects
                if (this.scrollTop > 0) {
                    this.style.boxShadow = 'inset 0 7px 9px -7px rgba(0,0,0,0.1)';
                } else {
                    this.style.boxShadow = 'none';
                }
                
                if (this.scrollTop < this.scrollHeight - this.clientHeight) {
                    this.style.borderBottom = '1px solid #eee';
                } else {
                    this.style.borderBottom = 'none';
                }
            }
        });
    }
    
    // Add reading progress indicator
    const termsContainer = document.querySelector('.terms-content');
    if (termsContainer) {
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 3px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            z-index: 1001;
            transition: width 0.3s ease;
        `;
        document.body.appendChild(progressBar);
        
        termsContainer.addEventListener('scroll', function() {
            const scrollPercentage = (this.scrollTop / (this.scrollHeight - this.clientHeight)) * 100;
            progressBar.style.width = scrollPercentage + '%';
        });
    }
    
    // Animate terms sections on scroll
    const termsSections = document.querySelectorAll('.terms-section');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const sectionObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    termsSections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        sectionObserver.observe(section);
    });
    
    // Auto-scroll to terms after a short delay to encourage reading
    setTimeout(() => {
        const firstSection = document.querySelector('.terms-section');
        if (firstSection && termsContainer) {
            termsContainer.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, 1000);
    
    // Track reading time for analytics (optional)
    const startTime = Date.now();
    let hasScrolled = false;
    
    if (termsContainer) {
        termsContainer.addEventListener('scroll', function() {
            hasScrolled = true;
        }, { once: true });
    }
    
    // Warn users if they try to accept too quickly without reading
    acceptBtn.addEventListener('click', function(e) {
        const timeSpent = Date.now() - startTime;
        const minimumReadTime = 30000; // 30 seconds
        
        if (timeSpent < minimumReadTime && !hasScrolled) {
            e.preventDefault();
            showNotification('Please take a moment to read through the terms and conditions.', 'warning');
            
            // Scroll to encourage reading
            if (termsContainer) {
                termsContainer.scrollTo({
                    top: 100,
                    behavior: 'smooth'
                });
            }
            return false;
        }
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to accept (if checkbox is checked)
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && acceptTermsCheckbox.checked) {
            acceptBtn.click();
        }
        
        // Tab navigation enhancement
        if (e.key === 'Tab' && e.target === acceptBtn && acceptTermsCheckbox.checked) {
            // Could add additional keyboard navigation hints
        }
    });
});
