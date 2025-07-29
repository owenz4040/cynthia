/**
 * Forgot Password Functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('forgotPasswordForm');
    const submitBtn = document.getElementById('submitBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const emailInput = document.getElementById('email');

    // Get API base URL from config
    const API_BASE = window.Config ? window.Config.API_BASE : 'http://localhost:5000/api';

    // Form submission
    form.addEventListener('submit', handleForgotPassword);

    // Real-time email validation
    emailInput.addEventListener('input', function() {
        clearMessages();
    });

    async function handleForgotPassword(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        // Basic validation
        if (!email) {
            showError('Please enter your email address');
            return;
        }

        if (!isValidEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }

        // Show loading state
        setLoading(true);
        clearMessages();

        try {
            const response = await fetch(`${API_BASE}/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                // Success - show success message
                showSuccess(data.message || 'Password reset email sent successfully!');
                form.style.display = 'none';
            } else {
                // Handle specific error cases
                if (data.requires_verification) {
                    showError('Your email is not verified. Please verify your email first before resetting your password.');
                } else {
                    showError(data.error || 'Failed to send reset email. Please try again.');
                }
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }

    function showSuccess(message) {
        successMessage.style.display = 'block';
        document.getElementById('successText').textContent = message;
        errorMessage.style.display = 'none';
        
        // Add success animation
        successMessage.classList.add('fade-in');
    }

    function showError(message) {
        errorMessage.style.display = 'block';
        document.getElementById('errorText').textContent = message;
        successMessage.style.display = 'none';
        
        // Add error animation
        errorMessage.classList.add('shake');
        setTimeout(() => errorMessage.classList.remove('shake'), 500);
    }

    function clearMessages() {
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';
    }

    function setLoading(loading) {
        if (loading) {
            loadingOverlay.style.display = 'flex';
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        } else {
            loadingOverlay.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    .fade-in {
        animation: fadeIn 0.5s ease-in;
    }

    .shake {
        animation: shake 0.5s ease-in-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }

    .message {
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
        text-align: center;
    }

    .message.success {
        background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        border: 1px solid #c3e6cb;
        color: #155724;
    }

    .message.error {
        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        border: 1px solid #f5c6cb;
        color: #721c24;
    }

    .message i {
        font-size: 24px;
        margin-bottom: 10px;
        display: block;
    }

    .message h3 {
        margin: 10px 0;
        font-size: 18px;
    }

    .input-hint {
        font-size: 12px;
        color: #666;
        margin-top: 5px;
        font-style: italic;
    }

    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        color: white;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
