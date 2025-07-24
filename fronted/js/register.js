// Registration page functionality
document.addEventListener('DOMContentLoaded', function() {
    // (Using single-field OTP input with id 'otpInput')
    // Fallback: Show OTP modal if registration was successful but not verified
    if (localStorage.getItem('pendingEmailVerification')) {
        currentEmail = localStorage.getItem('pendingEmailVerification');
        document.getElementById('userEmail').textContent = currentEmail;
        showModal('verificationModal');
        // Focus the single OTP input
        const otpField = document.getElementById('otpInput');
        if (otpField) otpField.focus();
    }
    const registerForm = document.getElementById('registerForm');
    const verificationModal = document.getElementById('verificationModal');
    const verificationForm = document.getElementById('verificationForm');
    const successModal = document.getElementById('successModal');
    const resendBtn = document.getElementById('resendBtn');
    
    let currentEmail = '';
    let currentUserName = '';
    
    
    // Handle registration form submission
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Validate form data
        if (!validateRegistrationForm(data)) {
            return;
        }
        
        showLoading('registerBtn', 'Creating Account...');
        
        try {
            const response = await fetch(`${AuthUtils.API_BASE_URL}/register`, {
                method: 'POST',
                body: formData  // Send FormData directly for file upload
            });
            
            const result = await response.json();
            
            if (response.ok && result.otp_sent) {
                currentEmail = data.email;
                currentUserName = data.name;
                // Store pending verification in localStorage for fallback
                localStorage.setItem('pendingEmailVerification', currentEmail);
                // Redirect to OTP verification page
                showNotification(`🎉 Registration successful! Redirecting to verification page...`, 'success', 5000);
                setTimeout(() => {
                    window.location.href = 'otp.html';
                }, 2000);

                // Success notification
                showNotification(`🎉 Registration successful! Welcome ${currentUserName}! Please check your email (${currentEmail}) for the 6-digit verification code.`, 'success', 8000);
                // Log successful registration for debugging
                console.log('✅ User registered successfully:', {
                    email: currentEmail,
                    name: currentUserName,
                    timestamp: new Date().toISOString()
                });
            } else {
                // Show error if OTP not sent
                let errorMsg = result.error || 'Registration failed. Could not send verification email.';
                showNotification(`❌ ${errorMsg}`, 'error', 8000);
                throw new Error(errorMsg);
            }
            
        } catch (error) {
            console.error('❌ Registration error:', error);
            
            // Enhanced error handling with specific messages
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.message) {
                errorMessage = error.message;
            } else if (error.status === 400) {
                errorMessage = 'Invalid registration data. Please check your information.';
            } else if (error.status === 409) {
                errorMessage = 'An account with this email already exists. Please try logging in instead.';
            } else if (error.status === 500) {
                errorMessage = 'Server error. Please try again in a few moments.';
            }
            
            showNotification(`❌ ${errorMessage}`, 'error', 6000);
        } finally {
            hideLoading('registerBtn');
        }
    });
    
    // Handle email verification
    verificationForm.addEventListener('submit', async function(e) {
        // Clear pending verification after successful verification
        localStorage.removeItem('pendingEmailVerification');
        e.preventDefault();
        
        const otpValue = document.getElementById('otpInput').value.trim();
        
        if (!otpValue || otpValue.length !== 6) {
            showNotification('Please enter the complete 6-digit verification code.', 'warning');
            return;
        }
        
        showLoading('verifyBtn', 'Verifying...');
        
        try {
            const response = await AuthUtils.apiRequest('/verify-email', {
                method: 'POST',
                body: JSON.stringify({ email: currentEmail, otp: otpValue })
            });
            
            // Close verification modal and show success modal
            closeModal('verificationModal');
            showModal('successModal');
            
            // Enhanced verification success notification
            showNotification(`✅ Email verified successfully! Welcome to the Rental System, ${currentUserName}! You can now sign in with your credentials.`, 'success', 8000);
            
            // Log successful verification
            console.log('✅ Email verified successfully:', {
                email: currentEmail,
                name: currentUserName,
                timestamp: new Date().toISOString()
            });
            
            // Auto-redirect to login after 3 seconds
            setTimeout(() => {
                showNotification('🔄 Redirecting to login page...', 'info', 2000);
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }, 3000);
            
        } catch (error) {
            console.error('❌ Verification error:', error);
            
            // Enhanced error handling for verification
            let errorMessage = 'Verification failed. Please try again.';
            
            if (error.message) {
                errorMessage = error.message;
            } else if (error.status === 400) {
                errorMessage = 'Invalid verification code. Please check and try again.';
            } else if (error.status === 404) {
                errorMessage = 'Verification code expired. Please request a new one.';
            } else if (error.status === 429) {
                errorMessage = 'Too many attempts. Please wait before trying again.';
            }
            
            showNotification(`❌ ${errorMessage}`, 'error', 6000);
            clearOTPInputs(otpContainer);
        } finally {
            hideLoading('verifyBtn');
        }
    });
    
    // Handle OTP resend
    resendBtn.addEventListener('click', async function() {
        if (!currentEmail) {
            showNotification('No email address found. Please register again.', 'error');
            return;
        }
        
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        try {
            await AuthUtils.apiRequest('/resend-otp', {
                method: 'POST',
                body: JSON.stringify({ email: currentEmail })
            });
            
            showNotification('Verification code sent successfully!', 'success');
            clearOTPInputs(otpContainer);
            
            // Start countdown
            startResendCountdown();
            
        } catch (error) {
            console.error('Resend error:', error);
            showNotification(error.message || 'Failed to send verification code.', 'error');
        } finally {
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-refresh"></i> Resend Code';
        }
    });
    
    // Profile image preview
    const profileImageInput = document.getElementById('profileImage');
    profileImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showNotification('Please select a valid image file.', 'warning');
                this.value = '';
                return;
            }
            
            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                showNotification('Image file must be less than 5MB.', 'warning');
                this.value = '';
                return;
            }
            
            const fileText = document.querySelector('.file-text');
            fileText.textContent = file.name;
            fileText.style.color = '#667eea';
            
            // Create image preview
            const reader = new FileReader();
            reader.onload = function(event) {
                // Remove existing preview
                const existingPreview = document.querySelector('.profile-image-preview');
                if (existingPreview) {
                    existingPreview.remove();
                }
                
                // Create new preview
                const preview = document.createElement('div');
                preview.className = 'profile-image-preview';
                preview.innerHTML = `
                    <img src="${event.target.result}" alt="Profile Preview" style="
                        width: 60px; 
                        height: 60px; 
                        border-radius: 50%; 
                        object-fit: cover; 
                        border: 2px solid #667eea;
                        margin-top: 10px;
                    ">
                    <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Profile Preview</p>
                `;
                
                // Insert preview after the file upload area
                const fileUploadArea = document.querySelector('.file-upload-area');
                fileUploadArea.parentNode.insertBefore(preview, fileUploadArea.nextSibling);
            };
            reader.readAsDataURL(file);
        }
    });
    
    function validateRegistrationForm(data) {
        // Name validation
        if (!data.name || data.name.trim().length < 2) {
            showNotification('Name must be at least 2 characters long.', 'warning');
            document.getElementById('name').focus();
            return false;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showNotification('Please enter a valid email address.', 'warning');
            document.getElementById('email').focus();
            return false;
        }
        
        // Age validation
        const age = parseInt(data.age);
        if (isNaN(age) || age < 18 || age > 120) {
            showNotification('Age must be between 18 and 120.', 'warning');
            document.getElementById('age').focus();
            return false;
        }
        
        // Gender validation
        if (!data.gender) {
            showNotification('Please select your gender.', 'warning');
            document.getElementById('gender').focus();
            return false;
        }
        
        // Password validation
        if (data.password.length < 8) {
            showNotification('Password must be at least 8 characters long.', 'warning');
            document.getElementById('password').focus();
            return false;
        }
        
        // Password confirmation
        if (data.password !== data.confirmPassword) {
            showNotification('Passwords do not match.', 'warning');
            document.getElementById('confirmPassword').focus();
            return false;
        }
        
        return true;
    }
    
    function startResendCountdown() {
        let timeLeft = 60;
        const resendBtn = document.getElementById('resendBtn');
        
        const countdown = setInterval(() => {
            resendBtn.disabled = true;
            resendBtn.innerHTML = `<i class="fas fa-clock"></i> Resend in ${timeLeft}s`;
            timeLeft--;
            
            if (timeLeft < 0) {
                clearInterval(countdown);
                resendBtn.disabled = false;
                resendBtn.innerHTML = '<i class="fas fa-refresh"></i> Resend Code';
            }
        }, 1000);
    }
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Form field enhancements
    const formInputs = document.querySelectorAll('input, select');
    formInputs.forEach(input => {
        // Remove error styling on focus
        input.addEventListener('focus', function() {
            this.style.borderColor = '#667eea';
            this.style.background = 'white';
        });
        
        // Add real-time validation feedback
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
    
    function validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        switch (field.id) {
            case 'name':
                isValid = value.length >= 2;
                errorMessage = 'Name must be at least 2 characters long.';
                break;
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(value);
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'age':
                const age = parseInt(value);
                isValid = !isNaN(age) && age >= 18 && age <= 120;
                errorMessage = 'Age must be between 18 and 120.';
                break;
            case 'password':
                isValid = value.length >= 8;
                errorMessage = 'Password must be at least 8 characters long.';
                break;
            case 'confirmPassword':
                const password = document.getElementById('password').value;
                isValid = value === password;
                errorMessage = 'Passwords do not match.';
                break;
        }
        
        if (!isValid && value) {
            field.style.borderColor = '#ef4444';
            field.style.background = '#fef2f2';
            
            // Show inline error
            let errorElement = field.parentElement.querySelector('.field-error');
            if (!errorElement) {
                errorElement = document.createElement('small');
                errorElement.className = 'field-error';
                errorElement.style.cssText = 'color: #ef4444; font-size: 0.8rem; margin-top: 5px; display: block;';
                field.parentElement.appendChild(errorElement);
            }
            errorElement.textContent = errorMessage;
        } else {
            field.style.borderColor = '#e1e5e9';
            field.style.background = '#f8f9fa';
            
            // Remove inline error
            const errorElement = field.parentElement.querySelector('.field-error');
            if (errorElement) {
                errorElement.remove();
            }
        }
        
        return isValid;
    }
    
    // Auto-capitalize name field
    document.getElementById('name').addEventListener('input', function(e) {
        const words = e.target.value.split(' ');
        const capitalizedWords = words.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        );
        e.target.value = capitalizedWords.join(' ');
    });
    
    // Password strength indicator
    const passwordInput = document.getElementById('password');
    passwordInput.addEventListener('input', function(e) {
        const password = e.target.value;
        const strength = calculatePasswordStrength(password);
        showPasswordStrength(strength);
    });
    
    function calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (password.match(/[a-z]/)) score++;
        if (password.match(/[A-Z]/)) score++;
        if (password.match(/[0-9]/)) score++;
        if (password.match(/[^a-zA-Z0-9]/)) score++;
        
        return {
            score: score,
            label: ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][score] || 'Very Weak',
            color: ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#16a34a'][score] || '#ef4444'
        };
    }
    
    function showPasswordStrength(strength) {
        let strengthElement = document.querySelector('.password-strength');
        if (!strengthElement) {
            strengthElement = document.createElement('div');
            strengthElement.className = 'password-strength';
            strengthElement.style.cssText = 'margin-top: 5px; font-size: 0.8rem; font-weight: 500;';
            passwordInput.parentElement.parentElement.appendChild(strengthElement);
        }
        
        strengthElement.textContent = `Password Strength: ${strength.label}`;
        strengthElement.style.color = strength.color;
    }
});
