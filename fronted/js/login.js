// Login page functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const verificationRequiredModal = document.getElementById('verificationRequiredModal');
    const resendVerificationForm = document.getElementById('resendVerificationForm');
    const quickVerificationForm = document.getElementById('quickVerificationForm');
    
    let pendingEmail = '';
    
    // Setup OTP inputs for quick verification
    const quickOtpContainer = document.querySelector('#quickVerificationForm .otp-input-container');
    if (quickOtpContainer) {
        setupOTPInputs(quickOtpContainer);
    }
    
    // Handle login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Validate form data
        if (!validateLoginForm(data)) {
            return;
        }
        showLoading('loginBtn', 'Signing in...');
        try {
            // Attempt login
            const response = await AuthUtils.apiRequest('/login', {
                method: 'POST',
                body: JSON.stringify({ email: data.email, password: data.password })
            });
            // Store authentication data
            AuthUtils.setToken(response.token);
            AuthUtils.setUserData(response.user);
            
            // Enhanced login success notification
            showNotification(`🎉 Login successful! Welcome back, ${response.user.name}!`, 'success', 5000);
            
            // Log successful login
            console.log('✅ User logged in successfully:', {
                email: response.user.email,
                name: response.user.name,
                termsAccepted: response.user.terms_accepted,
                timestamp: new Date().toISOString()
            });
            
            // Show redirect notification
            if (response.user.terms_accepted) {
                showNotification('🏠 Redirecting to dashboard...', 'info', 2000);
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                showNotification('📋 Please accept our terms and conditions to continue...', 'info', 2000);
                setTimeout(() => {
                    window.location.href = 'terms.html';
                }, 2000);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Handle email verification required
            if (error.message.includes('Email not verified') || error.message.includes('requires_verification')) {
                pendingEmail = data.email;
                document.getElementById('userEmailForResend').value = pendingEmail;
                showModal('verificationRequiredModal');
                showNotification('Please verify your email address first.', 'warning');
            } else {
                showNotification(error.message || 'Login failed. Please check your credentials.', 'error');
            }
        } finally {
            hideLoading('loginBtn');
        }
    });
    
    // Handle resend verification
    resendVerificationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!pendingEmail) {
            showNotification('No email address found.', 'error');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        try {
            await AuthUtils.apiRequest('/resend-otp', {
                method: 'POST',
                body: JSON.stringify({ email: pendingEmail })
            });
            
            showNotification('Verification code sent to your email!', 'success');
            
            // Show verification form
            document.querySelector('.verification-form').style.display = 'block';
            
            // Focus first OTP input
            const firstOtpInput = quickOtpContainer.querySelector('.otp-input');
            if (firstOtpInput) {
                firstOtpInput.focus();
            }
            
        } catch (error) {
            console.error('Resend error:', error);
            showNotification(error.message || 'Failed to send verification code.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
    
    // Handle quick verification
    quickVerificationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const otpValue = getOTPValue(quickOtpContainer);
        
        if (otpValue.length !== 6) {
            showNotification('Please enter the complete 6-digit verification code.', 'warning');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        showLoading(submitBtn.closest('button').id || 'quickVerifyBtn', 'Verifying...');
        
        try {
            // Verify OTP
            await AuthUtils.apiRequest('/verify-email', {
                method: 'POST',
                body: JSON.stringify({
                    email: pendingEmail,
                    otp: otpValue
                })
            });
            showNotification('Email verified successfully! Please login again.', 'success');
            closeModal('verificationRequiredModal');
            
            // Auto-fill email field
            document.getElementById('email').value = pendingEmail;
            document.getElementById('password').focus();
            
        } catch (error) {
            console.error('Quick verification error:', error);
            showNotification(error.message || 'Verification failed. Please try again.', 'error');
            clearOTPInputs(quickOtpContainer);
        } finally {
            hideLoading(submitBtn.closest('button').id || 'quickVerifyBtn');
        }
    });
    
    // Remember me functionality
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const emailInput = document.getElementById('email');
    
    // Load saved email if remember me was checked
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberMeCheckbox.checked = true;
    }
    
    // Save/remove email based on remember me
    rememberMeCheckbox.addEventListener('change', function() {
        if (this.checked) {
            localStorage.setItem('savedEmail', emailInput.value);
        } else {
            localStorage.removeItem('savedEmail');
        }
    });
    
    // Update saved email when email changes and remember me is checked
    emailInput.addEventListener('input', function() {
        if (rememberMeCheckbox.checked) {
            localStorage.setItem('savedEmail', this.value);
        }
    });
    
    function validateLoginForm(data) {
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showNotification('Please enter a valid email address.', 'warning');
            document.getElementById('email').focus();
            return false;
        }
        
        // Password validation
        if (!data.password || data.password.length < 1) {
            showNotification('Please enter your password.', 'warning');
            document.getElementById('password').focus();
            return false;
        }
        
        return true;
    }
    
    // Auto-focus email field if empty
    window.addEventListener('load', function() {
        const emailField = document.getElementById('email');
        if (!emailField.value) {
            emailField.focus();
        } else {
            document.getElementById('password').focus();
        }
    });
    
    // Form field enhancements
    const formInputs = document.querySelectorAll('input');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.borderColor = '#667eea';
            this.style.background = 'white';
        });
        
        input.addEventListener('blur', function() {
            this.style.borderColor = '#e1e5e9';
            this.style.background = '#f8f9fa';
        });
        
        // Enter key navigation
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const inputs = Array.from(formInputs);
                const currentIndex = inputs.indexOf(this);
                
                if (currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                } else {
                    loginForm.dispatchEvent(new Event('submit'));
                }
            }
        });
    });
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Forgot password functionality (placeholder)
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Password reset functionality coming soon!', 'info');
        });
    }
    
    // Show/hide password strength on focus
    const passwordInput = document.getElementById('password');
    passwordInput.addEventListener('focus', function() {
        // Could add password strength indicator here if needed
    });
    
    // Clear error states on form change
    loginForm.addEventListener('input', function() {
        // Clear any error styling
        const inputs = this.querySelectorAll('input');
        inputs.forEach(input => {
            input.style.borderColor = '#e1e5e9';
            input.style.background = '#f8f9fa';
        });
    });
    
    // Handle browser back button
    window.addEventListener('popstate', function() {
        // Close any open modals
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    });
    
    // Auto-detect if user is already logged in
    if (AuthUtils.isAuthenticated()) {
        if (AuthUtils.hasAcceptedTerms()) {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'terms.html';
        }
    }
});
