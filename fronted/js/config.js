// Environment configuration
const Config = {
    // Determine if we're in development or production
    isDevelopment: window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname === '',
    
    // API Base URL - automatically switches between dev and prod
    get API_BASE() {
        if (this.isDevelopment) {
            return 'http://localhost:5000/api';
        } else {
            // In production, using your actual Render backend URL
            return 'https://cynthia-api.onrender.com/api';
        }
    },
    
    // Frontend URL for redirects
    get FRONTEND_URL() {
        if (this.isDevelopment) {
            return 'http://localhost:8000';
        } else {
            // In production, using your actual Render frontend URL
            return 'https://cynthia-frontend.onrender.com';
        }
    },
    
    // Environment name
    get ENVIRONMENT() {
        return this.isDevelopment ? 'development' : 'production';
    }
};

// Export for use in other files
window.Config = Config;

// Log current environment
console.log(`🌍 Environment: ${Config.ENVIRONMENT}`);
console.log(`🔗 API Base: ${Config.API_BASE}`);
console.log(`🌐 Frontend URL: ${Config.FRONTEND_URL}`);
