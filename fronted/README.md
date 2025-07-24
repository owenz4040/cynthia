# Rental System - Complete User Authentication & Property Management

A full-stack rental property management system with comprehensive user authentication, email verification, and admin panel.

## 🚀 NEW: Complete User Registration System

The system now includes a complete user-facing registration and authentication system with:

### User Features
- **Registration**: `register.html` - Complete user registration with email verification
- **Login**: `login.html` - User authentication with session management  
- **Email Verification**: OTP-based email verification using Gmail SMTP
- **Terms & Conditions**: `terms.html` - Mandatory terms acceptance for new users
- **User Dashboard**: `dashboard.html` - Property browsing and profile management

### Email Integration
- **SMTP Email Service**: owenzcolin@gmail.com with app password
- **OTP Verification**: 6-digit codes with 10-minute expiration
- **Welcome Emails**: Professional HTML templates

### Authentication Flow
```
register.html → email verification → login.html → terms.html → dashboard.html
```

### API Endpoints Added
- `POST /api/register` - User registration
- `POST /api/verify-email` - Email verification with OTP
- `POST /api/login` - User login
- `POST /api/accept-terms` - Terms acceptance
- `GET /api/profile` - User profile
- `GET /api/houses` - Properties for users (auth required)

### Security Features
- bcrypt password hashing
- JWT authentication
- Session management
- Route protection
- Email verification requirement

---

# Original Frontend Documentation

A modern vanilla HTML/CSS/JavaScript admin panel for the rental house booking system with Instagram-inspired design.

## Features

- **Instagram-inspired Login Page**: Beautiful, modern login interface
- **Admin Dashboard**: Overview with statistics and quick actions
- **House Management**: Add, edit, and delete rental properties
- **Image Upload**: Multiple image upload with preview
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Notifications**: Toast notifications for user feedback
- **Secure Authentication**: JWT-based authentication with route protection

## Tech Stack

- **HTML5**: Modern semantic HTML
- **CSS3**: Instagram-inspired design with gradients and animations
- **Vanilla JavaScript**: No frameworks, pure ES6+ JavaScript
- **Font Awesome**: Beautiful icon library
- **Fetch API**: Modern HTTP client for API calls

## Setup Instructions

### 1. Start the Frontend

Simply open `index.html` in your browser or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using Live Server extension in VS Code
# Right-click index.html and select "Open with Live Server"
```

### 2. Access the Application

Open your browser and navigate to:
- Local file: `file:///path/to/index.html`
- Local server: `http://localhost:8000`

### 3. Default Admin Credentials

For initial setup, use these credentials:
- **Email**: admin@rentalsystem.com
- **Password**: admin123

**Important**: Change these credentials after first login!

## Features Overview

### 🔐 Login Page
- Instagram-inspired design with gradient backgrounds
- Phone mockup for visual appeal
- Form validation and error handling
- Loading states with spinners
- Responsive layout

### 📊 Dashboard
- Statistics cards showing house counts
- Quick action buttons
- Modern card-based layout
- Welcome message with gradient background
- Navigation to house management

### 🏠 House Management
- Grid layout for house cards
- Add new houses with comprehensive form
- Edit existing houses
- Delete houses with confirmation
- Image upload with preview
- Form validation
- Status indicators (Available/Unavailable)

### 📱 Responsive Design
- Mobile-first approach
- Breakpoints for different screen sizes
- Touch-friendly interface
- Optimized for all devices

## File Structure

```
fronted/
├── index.html          # Main HTML file with all pages
├── css/
│   └── style.css      # Instagram-inspired styles
├── js/
│   └── app.js         # Application logic and API calls
└── README.md          # This file
```

## Styling

The application uses Instagram-inspired design with:
- **Gradient backgrounds**: Instagram's signature gradient colors
- **Card-based layouts**: Clean, modern card designs
- **Typography**: System fonts for consistency
- **Color scheme**: Instagram's color palette
- **Animations**: Smooth hover effects and transitions
- **Icons**: Font Awesome for consistent iconography

## API Integration

The frontend communicates with the Flask backend through:
- **Authentication**: JWT token-based auth
- **CRUD Operations**: Full house management
- **File Uploads**: Image upload with FormData
- **Error Handling**: Comprehensive error handling
- **Token Management**: Automatic token storage and validation

## JavaScript Features

### Modern ES6+ Syntax
- Arrow functions
- Async/await for API calls
- Template literals for dynamic HTML
- Destructuring and spread operators

### State Management
- Simple application state object
- Local storage for authentication
- Dynamic page switching

### Event Handling
- Form submissions
- Image selection and preview
- Modal interactions
- Navigation

### API Communication
- Fetch API for HTTP requests
- FormData for file uploads
- JWT token management
- Error handling and user feedback

## Configuration

The frontend is configured to work with:
- **Backend API**: http://localhost:5000 (Flask backend)
- **CORS**: Backend configured for cross-origin requests
- **File Uploads**: Image upload with preview functionality

## Security Features

- **Client-side Validation**: Form validation before submission
- **Token Storage**: Secure JWT token storage in localStorage
- **Session Management**: Automatic logout on token expiration
- **XSS Protection**: Input sanitization and safe HTML rendering

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **ES6+ Features**: Requires modern browser support
- **Fetch API**: Native support in all modern browsers

## Development

### Running Locally
1. Ensure the backend is running on http://localhost:5000
2. Open `index.html` in a browser or local server
3. Login with admin credentials
4. Start managing rental properties

### Making Changes
- **HTML**: Edit `index.html` for structure changes
- **CSS**: Modify `css/style.css` for styling
- **JavaScript**: Update `js/app.js` for functionality

### Testing
- Test all CRUD operations
- Verify responsive design on different screen sizes
- Check image upload functionality
- Validate form submissions and error handling

## Customization

### Colors
Update the CSS custom properties for color scheme changes:

```css
:root {
  --instagram-gradient: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
  --primary-color: #262626;
  --secondary-color: #8e8e8e;
  --border-color: #dbdbdb;
}
```

### Layout
- Modify grid layouts in CSS for different responsive behavior
- Adjust breakpoints for mobile/tablet/desktop
- Update spacing and sizing variables

### Functionality
- Add new pages by creating page elements and navigation
- Extend API calls for additional backend features
- Customize form validation rules

## Performance Optimization

- **Minimal Dependencies**: Only Font Awesome for icons
- **Optimized Images**: Client-side image preview
- **Lazy Loading**: Load data only when needed
- **Efficient DOM Updates**: Minimal DOM manipulation

## Production Deployment

For production deployment:

1. Update API endpoint in `js/app.js`
2. Optimize and minify CSS/JavaScript
3. Configure proper HTTPS
4. Set up CDN for Font Awesome
5. Enable gzip compression on server

## Troubleshooting

### Common Issues
- **CORS Errors**: Ensure backend CORS is configured correctly
- **API Connection**: Verify backend is running on correct port
- **Authentication**: Check token storage and expiration
- **Image Upload**: Ensure file size limits and formats

### Debug Mode
- Open browser developer tools
- Check console for JavaScript errors
- Monitor network tab for API calls
- Verify local storage for authentication token
