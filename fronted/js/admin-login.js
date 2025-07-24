// Admin login functionality

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginError = document.getElementById('loginError');

    // Use Render backend API endpoint
    const API_BASE = 'https://cynthia-api.onrender.com/api';

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        loginError.style.display = 'none';
        loginBtn.disabled = true;
        loginBtnText.style.display = 'none';
        loginSpinner.style.display = 'inline-block';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_BASE}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();
            if (response.ok && result.token) {
                // Store token and admin info
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('userData', JSON.stringify(result.admin));
                // Redirect to admin dashboard
                window.location.href = 'dashboard.html';
            } else {
                throw new Error(result.error || 'Login failed');
            }
        } catch (error) {
            loginError.textContent = error.message;
            loginError.style.display = 'block';
        } finally {
            loginBtn.disabled = false;
            loginBtnText.style.display = 'inline-block';
            loginSpinner.style.display = 'none';
            loginForm.reset();
        }
    });
});
