// Debug authentication issues
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== AUTHENTICATION DEBUG ===');
    
    // Check token existence
    const token = AuthUtils.getToken();
    console.log('Token exists:', !!token);
    console.log('Token value:', token ? token.substring(0, 50) + '...' : 'null');
    
    // Check user data
    const userData = AuthUtils.getUserData();
    console.log('User data exists:', !!userData);
    console.log('User data:', userData);
    
    // Check authentication status
    console.log('Is authenticated:', AuthUtils.isAuthenticated());
    console.log('Has accepted terms:', AuthUtils.hasAcceptedTerms());
    
    // Test token validity
    if (token) {
        testTokenValidity();
    }
    
    // Add debug button for manual testing
    const debugBtn = document.createElement('button');
    debugBtn.textContent = 'Debug Token';
    debugBtn.style.position = 'fixed';
    debugBtn.style.top = '10px';
    debugBtn.style.right = '10px';
    debugBtn.style.zIndex = '9999';
    debugBtn.style.padding = '10px';
    debugBtn.style.backgroundColor = '#007bff';
    debugBtn.style.color = 'white';
    debugBtn.style.border = 'none';
    debugBtn.style.borderRadius = '5px';
    debugBtn.style.cursor = 'pointer';
    
    debugBtn.addEventListener('click', function() {
        console.clear();
        testTokenValidity();
    });
    
    document.body.appendChild(debugBtn);
});

async function testTokenValidity() {
    const token = AuthUtils.getToken();
    
    if (!token) {
        console.error('No token found!');
        return;
    }
    
    console.log('Testing token validity...');
    
    try {
        // Test with a simple protected endpoint
        const response = await fetch(`${window.Config ? window.Config.API_BASE : 'http://localhost:5000/api'}/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.text();
        console.log('Response data:', data);
        
        if (response.status === 401) {
            console.error('Token is invalid or expired!');
            
            // Try to parse the error
            try {
                const errorData = JSON.parse(data);
                console.error('Error details:', errorData);
            } catch (e) {
                console.error('Could not parse error response');
            }
            
            // Clear invalid token
            AuthUtils.removeToken();
            console.log('Cleared invalid token from localStorage');
        } else if (response.ok) {
            console.log('Token is valid!');
        } else {
            console.error('Unexpected response status:', response.status);
        }
        
    } catch (error) {
        console.error('Token test failed:', error);
    }
}

// Test accept-terms endpoint specifically
async function testAcceptTerms() {
    const token = AuthUtils.getToken();
    
    if (!token) {
        console.error('No token found!');
        return;
    }
    
    console.log('Testing accept-terms endpoint...');
    
    try {
        const response = await fetch(`${window.Config ? window.Config.API_BASE : 'http://localhost:5000/api'}/accept-terms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Accept-terms response status:', response.status);
        
        const data = await response.text();
        console.log('Accept-terms response data:', data);
        
        if (response.status === 401) {
            console.error('Token invalid for accept-terms!');
            
            // Decode the token to see what's inside
            try {
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    console.log('Token payload:', payload);
                    console.log('Token expires at:', new Date(payload.exp * 1000));
                    console.log('Current time:', new Date());
                    console.log('Token expired?', Date.now() / 1000 > payload.exp);
                }
            } catch (e) {
                console.error('Could not decode token:', e);
            }
        }
        
    } catch (error) {
        console.error('Accept-terms test failed:', error);
    }
}

// Add test button for accept-terms
setTimeout(() => {
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Test Accept Terms';
    testBtn.style.position = 'fixed';
    testBtn.style.top = '50px';
    testBtn.style.right = '10px';
    testBtn.style.zIndex = '9999';
    testBtn.style.padding = '10px';
    testBtn.style.backgroundColor = '#28a745';
    testBtn.style.color = 'white';
    testBtn.style.border = 'none';
    testBtn.style.borderRadius = '5px';
    testBtn.style.cursor = 'pointer';
    
    testBtn.addEventListener('click', testAcceptTerms);
    document.body.appendChild(testBtn);
}, 1000);
