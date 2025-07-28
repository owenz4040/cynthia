# Rental House Booking System - Backend

A robust Flask backend API for a rental house booking system with Instagram-inspired admin panel, MongoDB database, and Cloudinary image hosting.

## Features

- **Admin Authentication**: JWT-based secure admin login
- **House Management**: CRUD operations for rental properties
- **Image Upload**: Multiple image upload with Cloudinary integration
- **MongoDB Integration**: NoSQL database for scalability
- **RESTful API**: Clean API endpoints for frontend integration
- **Security**: Password hashing, CORS protection, JWT validation
- **Environment Configuration**: Secure credential management

## Tech Stack

- **Flask**: Python web framework
- **MongoDB**: NoSQL database with PyMongo
- **Cloudinary**: Cloud-based image storage and management
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing
- **python-dotenv**: Environment variable management
- **Flask-CORS**: Cross-origin resource sharing

## Prerequisites

- Python 3.8 or higher
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account for image hosting

## Installation

### 1. Clone and Navigate

```bash
cd backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Configuration

Create a `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGO_URI=mongodb+srv://owenzcolin:owenzcolin@cluster0.vwthypp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dyltquwth
CLOUDINARY_API_KEY=374873756457832
CLOUDINARY_API_SECRET=oOilcziDyMXHZtTvywbgVgEsrl8

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
```

**Important**: Replace `JWT_SECRET_KEY` with a secure random string for production!

### 5. Run the Application

```bash
python app.py
```

The server will start on `http://localhost:5000`

### 3. Run the Application

```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- `GET /api/admin/profile` - Get admin profile (requires authentication)

### House Management
- `GET /api/houses` - Get all houses (public)
- `GET /api/houses/<id>` - Get specific house (public)
- `POST /api/admin/houses` - Create new house (admin only)
- `PUT /api/admin/houses/<id>` - Update house (admin only)
- `DELETE /api/admin/houses/<id>` - Delete house (admin only)
- `DELETE /api/admin/houses/<house_id>/images/<image_id>` - Delete house image (admin only)

### Dashboard
- `GET /api/admin/stats` - Get dashboard statistics (admin only)

### Utility
- `GET /` - API information
- `GET /health` - Health check

## Database Models

### Admin
- id, email, password_hash, created_at, updated_at

### House
- id, name, description, bedrooms, bathrooms, price_per_month, location, amenities, is_available, created_at, updated_at

### HouseImage
- id, house_id, image_url, public_id, is_primary, created_at

### Customer
- id, name, email, phone, created_at

### Booking
- id, house_id, customer_id, check_in_date, check_out_date, total_price, guests_count, status, special_requests, created_at, updated_at

## Default Admin Account

When the application starts for the first time, it creates a default admin account:
- **Email**: admin@rentalsystem.com
- **Password**: admin123

**Important**: Change these credentials in production!

## Image Upload

The system supports multiple image uploads per house with the following features:
- **Cloudinary Integration**: Automatic upload to Cloudinary (if configured)
- **Local Fallback**: Local file storage as backup
- **Image Optimization**: Automatic resizing and compression
- **Multiple Formats**: Supports PNG, JPG, JPEG, GIF, WebP

## Environment Configuration

The application supports different environments:
- **Development**: Debug enabled, verbose logging
- **Production**: Optimized for production deployment
- **Testing**: Separate database for testing

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Comprehensive input validation and sanitization
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Environment Variables**: Sensitive data stored in environment variables

## Frontend Integration

The backend is designed to work with a React-based frontend. CORS is configured to allow requests from common development ports (3000, 5173).

## Production Deployment

For production deployment:

1. Update environment variables in `.env`
2. Change `FLASK_ENV=production`
3. Use a production-grade database (PostgreSQL, MySQL)
4. Configure proper SMTP settings for email notifications
5. Set up Cloudinary for image storage
6. Use a production WSGI server like Gunicorn

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```
