/**
 * Reset Password Functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('resetPasswordForm');
    const submitBtn = document.getElementById('submitBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const verifyingToken = document.getElementById('verifyingToken');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordStrength = document.getElementById('passwordStrength');
    const passwordMatch = document.getElementById('passwordMatch');
    const welcomeText = document.getElementById('welcomeText');
    const authLinks = document.getElementById('authLinks');

    let resetToken = '';
    let userEmail = '';

    // Initialize page
    init();

    async function init() {
        // Get token and email from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        resetToken = urlParams.get('token');
        userEmail = urlParams.get('email');

        if (!resetToken || !userEmail) {
            showError('Invalid reset link. Please request a new password reset.');
            verifyingToken.style.display = 'none';
            return;
        }

        // Verify the token
        await verifyResetToken();
    }

    async function verifyResetToken() {
        try {
            const response = await fetch(`${API_BASE_URL}/verify-reset-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: userEmail,
                    token: resetToken
                })
            });

            const data = await response.json();

            if (response.ok && data.valid) {
                // Token is valid, show form
                verifyingToken.style.display = 'none';
                form.style.display = 'block';
                welcomeText.textContent = `Hello ${data.user_name}, create a new password for your account.`;
                setupFormValidation();
            } else {
                // Token is invalid or expired
                verifyingToken.style.display = 'none';
                showError(data.error || 'Invalid or expired reset token. Please request a new password reset.');
            }
        } catch (error) {
            console.error('Token verification error:', error);
            verifyingToken.style.display = 'none';
            showError('Network error. Please check your connection and try again.');
        }
    }

    function setupFormValidation() {
        // Form submission
        form.addEventListener('submit', handleResetPassword);

        // Real-time password validation
        newPasswordInput.addEventListener('input', function() {
            checkPasswordStrength();
            checkPasswordMatch();
        });

        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Validation
        if (!validatePasswords(newPassword, confirmPassword)) {
            return;
        }

        // Show loading state
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: userEmail,
                    token: resetToken,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Success
                form.style.display = 'none';
                authLinks.style.display = 'none';
                showSuccess();
            } else {
                showError(data.error || 'Failed to reset password. Please try again.');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }

    function validatePasswords(newPassword, confirmPassword) {
        // Password length
        if (newPassword.length < 8) {
            showInputError('Password must be at least 8 characters long');
            newPasswordInput.focus();
            return false;
        }

        // Password match
        if (newPassword !== confirmPassword) {
            showInputError('Passwords do not match');
            confirmPasswordInput.focus();
            return false;
        }

        return true;
    }

    function checkPasswordStrength() {
        const password = newPasswordInput.value;
        const strength = calculatePasswordStrength(password);
        
        passwordStrength.innerHTML = getPasswordStrengthHTML(strength, password.length);
    }

    function checkPasswordMatch() {
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword.length > 0) {
            if (newPassword === confirmPassword) {
                passwordMatch.innerHTML = '<i class="fas fa-check" style="color: green;"></i> Passwords match';
                passwordMatch.style.color = 'green';
            } else {
                passwordMatch.innerHTML = '<i class="fas fa-times" style="color: red;"></i> Passwords do not match';
                passwordMatch.style.color = 'red';
            }
        } else {
            passwordMatch.innerHTML = '';
        }
    }

    function calculatePasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        return score;
    }

    function getPasswordStrengthHTML(score, length) {
        if (length === 0) return '';
        
        const levels = [
            { min: 0, max: 2, text: 'Weak', color: '#dc3545', width: '25%' },
            { min: 3, max: 4, text: 'Medium', color: '#ffc107', width: '50%' },
            { min: 5, max: 5, text: 'Strong', color: '#28a745', width: '75%' },
            { min: 6, max: 6, text: 'Very Strong', color: '#007bff', width: '100%' }
        ];
        
        const level = levels.find(l => score >= l.min && score <= l.max) || levels[0];
        
        return `
            <div class="password-strength-bar">
                <div class="strength-fill" style="width: ${level.width}; background-color: ${level.color};"></div>
            </div>
            <div class="strength-text" style="color: ${level.color};">${level.text}</div>
        `;
    }

    function showSuccess() {
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        
        // Add success animation
        successMessage.classList.add('fade-in');
    }

    function showError(message) {
        errorMessage.style.display = 'block';
        document.getElementById('errorText').textContent = message;
        successMessage.style.display = 'none';
        authLinks.style.display = 'block';
        
        // Add error animation
        errorMessage.classList.add('shake');
        setTimeout(() => errorMessage.classList.remove('shake'), 500);
    }

    function showInputError(message) {
        // You could implement a toast notification here
        alert(message);
    }

    function setLoading(loading) {
        if (loading) {
            loadingOverlay.style.display = 'flex';
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        } else {
            loadingOverlay.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Update Password';
        }
    }
});

// Toggle password visibility
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Add CSS for password strength indicator
const style = document.createElement('style');
style.textContent = `
    .password-input {
        position: relative;
        display: flex;
        align-items: center;
    }

    .toggle-password {
        position: absolute;
        right: 10px;
        background: none;
        border: none;
        cursor: pointer;
        color: #666;
        font-size: 16px;
        padding: 5px;
    }

    .toggle-password:hover {
        color: #333;
    }

    .password-strength {
        margin-top: 8px;
    }

    .password-strength-bar {
        width: 100%;
        height: 4px;
        background-color: #e0e0e0;
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 5px;
    }

    .strength-fill {
        height: 100%;
        transition: width 0.3s ease, background-color 0.3s ease;
    }

    .strength-text {
        font-size: 12px;
        font-weight: bold;
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

    .message.info {
        background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
        border: 1px solid #bee5eb;
        color: #0c5460;
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

    .error-actions {
        margin-top: 15px;
    }

    .error-actions .btn-secondary,
    .error-actions .btn-link {
        display: inline-block;
        margin: 5px;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 4px;
    }

    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }

    .btn-link {
        background-color: transparent;
        color: #007bff;
        border: 1px solid #007bff;
    }

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
