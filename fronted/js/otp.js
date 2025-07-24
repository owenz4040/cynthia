// OTP Verification Page Functionality

document.addEventListener('DOMContentLoaded', function() {
    const otpForm = document.getElementById('otpForm');
    const resendBtn = document.getElementById('resendBtn');
    const userEmailEl = document.getElementById('userEmail');

    // Get email from localStorage (set during registration)
    const email = localStorage.getItem('pendingEmailVerification');
    if (!email) {
        showToast('No pending verification email found. Please register first.', 'error');
        setTimeout(() => window.location.href = 'register.html', 2000);
        return;
    }
    userEmailEl.textContent = email;

    // Handle OTP submission
    otpForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const otpInput = document.getElementById('otpInput');
        const otpValue = otpInput.value.trim();
        if (otpValue.length !== 6) {
            showToast('Please enter the 6-digit code.', 'warning');
            return;
        }

        showLoading('verifyBtn', 'Verifying...');
        try {
            await AuthUtils.apiRequest('/verify-email', {
                method: 'POST',
                body: JSON.stringify({ email, otp: otpValue })
            });
            localStorage.removeItem('pendingEmailVerification');
            showToast('Email verified successfully! Redirecting to login...', 'success');
            setTimeout(() => window.location.href = 'login.html', 2000);
        } catch (err) {
            console.error('Verification error:', err);
            showToast(err.message || 'Verification failed. Please try again.', 'error');
        } finally {
            hideLoading('verifyBtn');
        }
    });

    // Handle resend OTP
    resendBtn.addEventListener('click', async function() {
        this.disabled = true;
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        try {
            await AuthUtils.apiRequest('/resend-otp', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            showToast('Verification code resent to your email!', 'success');
        } catch (err) {
            console.error('Resend error:', err);
            showToast(err.message || 'Failed to resend code.', 'error');
        } finally {
            this.disabled = false;
            this.innerHTML = originalText;
        }
    });
});
