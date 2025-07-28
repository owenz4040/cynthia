// Authentication utility functions
class AuthUtils {
    static get API_BASE() {
        return window.Config ? window.Config.API_BASE : 'https://cynthia-api.onrender.com/api';
    }
    
    // Token management
    static getToken() {
        return localStorage.getItem('authToken');
    }
    
    static setToken(token) {
        localStorage.setItem('authToken', token);
    }
    
    static removeToken() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
    }
    
    // User data management
    static getUserData() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }
    
    static setUserData(userData) {
        localStorage.setItem('userData', JSON.stringify(userData));
    }
    
    // Check if user is authenticated and token is valid
    static isAuthenticated() {
        const token = this.getToken();
        const userData = this.getUserData();
        
        if (!token || !userData) {
            return false;
        }
        
        // Check if token is expired
        if (this.isTokenExpired(token)) {
            this.handleTokenExpiration();
            return false;
        }
        
        return true;
    }
    
    // Check if JWT token is expired
    static isTokenExpired(token) {
        try {
            if (!token) return true;
            
            // Decode JWT payload (second part of token)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            
            // Check if token is expired (with 5 minute buffer)
            return payload.exp < (currentTime + 300);
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true; // Treat invalid tokens as expired
        }
    }
    
    // Check if terms are accepted
    static hasAcceptedTerms() {
        const userData = this.getUserData();
        return userData ? userData.terms_accepted : false;
    }
    
    // Check if user has accepted site visit terms
    static hasSiteVisitTermsAccepted() {
        return localStorage.getItem('siteVisitTermsAccepted') === 'true';
    }
    
    static acceptSiteVisitTerms() {
        localStorage.setItem('siteVisitTermsAccepted', 'true');
        localStorage.setItem('siteVisitTermsAcceptedDate', new Date().toISOString());
    }
    
    static getSiteVisitTermsAcceptedDate() {
        return localStorage.getItem('siteVisitTermsAcceptedDate');
    }
    
    // API request helper with automatic logout on token expiration
    static async apiRequest(endpoint, options = {}) {
        const url = `${this.API_BASE}${endpoint}`;
        const token = this.getToken();
        
        console.log('Making API request:', { url, hasToken: !!token, endpoint });
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        
        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, finalOptions);
            
            console.log('API response:', { status: response.status, ok: response.ok, url });
            
            // Handle token expiration or unauthorized access
            if (response.status === 401) {
                console.warn('Token expired or unauthorized. Redirecting to login...');
                this.handleTokenExpiration();
                throw new Error('Token has expired. Please log in again.');
            }
            
            // Handle network or server errors
            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                
                try {
                    const data = await response.json();
                    errorMessage = data.error || errorMessage;
                } catch (jsonError) {
                    // If we can't parse JSON, use the status text
                    errorMessage = response.statusText || errorMessage;
                }
                
                console.error('API error:', { status: response.status, message: errorMessage });
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Request failed:', { error: error.message, url, options });
            
            // Provide more specific error messages
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Unable to connect to server. Please check your internet connection and try again.');
            }
            
            if (error.message.includes('ECONNREFUSED') || error.message.includes('ERR_CONNECTION_REFUSED')) {
                throw new Error('Server is not responding. Please try again later or contact support.');
            }
            
            throw error;
        }
    }
    
    // Handle token expiration
    static handleTokenExpiration() {
        this.removeToken();
        
        // Show a user-friendly message
        if (typeof showNotification === 'function') {
            showNotification('Your session has expired. Please log in again.', 'warning');
        }
        
        // Delay redirect slightly to show the message
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }
    
    // Logout user
    static async logout() {
        try {
            await this.apiRequest('/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.removeToken();
            window.location.href = 'login.html';
        }
    }
    
    // Redirect based on authentication state
    static redirectBasedOnAuth() {
        const currentPage = window.location.pathname.split('/').pop();
        const isAuthenticated = this.isAuthenticated();
        const hasAcceptedTerms = this.hasAcceptedTerms();
        
        // Public pages that don't require authentication
        const publicPages = ['login.html', 'register.html', 'otp.html', 'admin.html', 'index.html', ''];
        
        if (!isAuthenticated && !publicPages.includes(currentPage)) {
            window.location.href = 'login.html';
            return;
        }
        
        if (isAuthenticated) {
            // Redirect authenticated users away from auth pages
            if (currentPage === 'login.html' || currentPage === 'register.html') {
                if (!hasAcceptedTerms) {
                    window.location.href = 'terms.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
                return;
            }
            
            // Check terms acceptance for protected pages
            if (currentPage === 'dashboard.html' && !hasAcceptedTerms) {
                window.location.href = 'terms.html';
                return;
            }
            
            // Redirect from terms page if already accepted
            if (currentPage === 'terms.html' && hasAcceptedTerms) {
                window.location.href = 'dashboard.html';
                return;
            }
        }
    }
    
    // Initialize auth state on page load
    static init() {
        this.redirectBasedOnAuth();
        
        // Set up global logout handlers
        document.addEventListener('DOMContentLoaded', () => {
            const logoutBtns = document.querySelectorAll('[id*="logout"], [class*="logout"]');
            logoutBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            });
        });
    }
}

// Utility functions for UI interactions
function showLoading(buttonId, loadingText = 'Loading...') {
    const button = document.getElementById(buttonId);
    if (button) {
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) {
            btnLoading.style.display = 'flex';
            if (loadingText !== 'Loading...') {
                const loadingTextSpan = btnLoading.querySelector('span') || btnLoading;
                loadingTextSpan.textContent = loadingText;
            }
        }
        
        button.disabled = true;
    }
}

function hideLoading(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (btnText) btnText.style.display = 'flex';
        if (btnLoading) btnLoading.style.display = 'none';
        
        button.disabled = false;
    }
}

function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after duration
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

function getNotificationColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    return colors[type] || colors.info;
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.parentElement.querySelector('.password-toggle i');
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.classList.remove('fa-eye');
        toggle.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        toggle.classList.remove('fa-eye-slash');
        toggle.classList.add('fa-eye');
    }
}

// OTP input handling
function setupOTPInputs(container) {
    const inputs = container.querySelectorAll('.otp-input');
    
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            
            // Only allow numbers
            if (!/^\d*$/.test(value)) {
                e.target.value = '';
                return;
            }
            
            // Move to next input if current is filled
            if (value && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', (e) => {
            // Move to previous input on backspace if current is empty
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
        
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
            
            // Fill inputs with pasted data
            for (let i = 0; i < Math.min(pastedData.length, inputs.length - index); i++) {
                if (inputs[index + i]) {
                    inputs[index + i].value = pastedData[i];
                }
            }
            
            // Focus the next empty input or the last input
            const nextEmptyIndex = Array.from(inputs).findIndex((input, i) => i > index && !input.value);
            if (nextEmptyIndex !== -1) {
                inputs[nextEmptyIndex].focus();
            } else {
                inputs[inputs.length - 1].focus();
            }
        });
    });
}

function getOTPValue(container) {
    const inputs = container.querySelectorAll('.otp-input');
    return Array.from(inputs).map(input => input.value).join('');
}

function clearOTPInputs(container) {
    const inputs = container.querySelectorAll('.otp-input');
    inputs.forEach(input => input.value = '');
    if (inputs.length > 0) {
        inputs[0].focus();
    }
}

// Initialize auth utilities
AuthUtils.init();

// Add notification styles to head
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
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
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0;
            margin-left: auto;
            opacity: 0.8;
            transition: opacity 0.3s ease;
        }
        
        .notification-close:hover {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
}
