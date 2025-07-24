# 🏠 Rental House Booking System

A modern, full-stack rental house booking system with Instagram-inspired design, MongoDB database, and Cloudinary image hosting.

![Instagram Design](https://img.shields.io/badge/Design-Instagram%20Inspired-E4405F)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248)
![Cloudinary](https://img.shields.io/badge/Images-Cloudinary-3448C5)
![Flask](https://img.shields.io/badge/Backend-Flask-000000)
![Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla%20JS-F7DF1E)

## 🌟 Features

### 🎨 Instagram-Inspired Design
- **Gradient Backgrounds**: Instagram's signature gradient colors
- **Modern UI**: Clean, card-based layouts
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Smooth Animations**: Hover effects and transitions

### 🔐 Admin Panel
- **Secure Authentication**: JWT-based admin login
- **Dashboard Overview**: Statistics and quick actions
- **House Management**: Add, edit, and delete rental properties
- **Image Upload**: Multiple image upload with preview
- **Real-time Feedback**: Toast notifications for all actions

### 🏠 House Management
- **Complete CRUD**: Create, Read, Update, Delete operations
- **Rich Details**: Name, description, location, pricing, amenities
- **Image Galleries**: Multiple images per property
- **Availability Control**: Enable/disable properties
- **Search & Filter**: Easy property discovery

### 🛡️ Security & Performance
- **Password Hashing**: bcrypt for secure password storage
- **JWT Tokens**: Stateless authentication
- **CORS Protection**: Secure cross-origin requests
- **Input Validation**: Comprehensive data validation
- **Cloud Storage**: Reliable image hosting with Cloudinary

## 🏗️ Architecture

```
Rental Booking System
├── Frontend (Vanilla HTML/CSS/JS)
│   ├── Instagram-inspired Login Page
│   ├── Admin Dashboard
│   └── House Management Interface
├── Backend (Flask API)
│   ├── Authentication System
│   ├── House CRUD Operations
│   └── Image Upload Service
├── Database (MongoDB Atlas)
│   ├── Admin Collection
│   ├── Houses Collection
│   ├── Customers Collection
│   └── Bookings Collection
└── Cloud Services
    └── Cloudinary (Image Storage)
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- MongoDB Atlas account (configured)
- Cloudinary account (configured)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cynthia
```

### 2. Start the System (One Click!)
```batch
start.bat
```

**That's it!** The script will:
- ✅ Create Python virtual environment
- ✅ Install all dependencies
- ✅ Start Flask backend (http://localhost:5000)
- ✅ Start frontend server (http://localhost:3000)
- ✅ Open your browser automatically

### 3. Login to Admin Panel
Navigate to http://localhost:3000 and login with:
- **Email**: `admin@rentalsystem.com`
- **Password**: `admin123`

**🔒 Important**: Change these credentials after first login!
- **Route Protection**: Secure admin-only access

## 🛠️ Quick Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend will be available at `http://localhost:5000`

### 2. Frontend Setup

```bash
cd fronted
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 3. Default Admin Access

- **Email**: admin@rentalsystem.com
- **Password**: admin123

**⚠️ Important**: Change these credentials after first login!

## 📋 Detailed Setup Instructions

### Backend Configuration

1. **Environment Variables**: Update `backend/.env` with your settings:
   ```env
   # Database
   DATABASE_URL=sqlite:///rental_system.db
   
   # JWT Secret
   JWT_SECRET_KEY=your-super-secret-key
   
   # Admin Credentials
   ADMIN_EMAIL=your-admin@email.com
   ADMIN_PASSWORD=your-secure-password
   
   # Cloudinary (Optional)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

2. **Database**: The SQLite database is created automatically on first run

3. **Dependencies**: All required packages are listed in `requirements.txt`

### Frontend Configuration

1. **API Endpoint**: Update the API base URL in components if needed
2. **Dependencies**: All required packages are in `package.json`
3. **Build**: Run `npm run build` for production

## 🎨 Design Features

### Instagram-Inspired UI
- **Gradient Backgrounds**: Instagram's signature gradient colors
- **Card Layouts**: Modern card-based design
- **Typography**: Clean, readable fonts
- **Icons**: Consistent icon usage throughout
- **Animations**: Smooth hover effects and transitions

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Flexible Grids**: Adaptive layouts for all screen sizes
- **Touch-Friendly**: Large touch targets for mobile

## 🔧 API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- `GET /api/admin/profile` - Get admin profile

### House Management
- `GET /api/houses` - Get all houses (public)
- `GET /api/houses/<id>` - Get specific house
- `POST /api/admin/houses` - Create house (admin)
- `PUT /api/admin/houses/<id>` - Update house (admin)
- `DELETE /api/admin/houses/<id>` - Delete house (admin)

### Dashboard
- `GET /api/admin/stats` - Get dashboard statistics

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Comprehensive validation and sanitization
- **CORS Configuration**: Configurable cross-origin requests
- **Route Protection**: Admin-only routes in frontend
- **File Upload Security**: Image validation and processing

## 📦 Database Models

### Admin
- Email, password hash, timestamps

### House
- Name, description, bedrooms, bathrooms, price, location, amenities, availability

### HouseImage
- Image URL, public ID (Cloudinary), primary flag

### Customer (Future)
- Name, email, phone for booking system

### Booking (Future)
- House, customer, dates, price, status

## 🚀 Production Deployment

### Backend
1. Use PostgreSQL or MySQL for production database
2. Configure environment variables
3. Use Gunicorn or similar WSGI server
4. Set up Cloudinary for image storage
5. Configure SMTP for email notifications

### Frontend
1. Build with `npm run build`
2. Serve static files with nginx or similar
3. Configure HTTPS
4. Set up CDN for better performance

## 🔮 Future Enhancements

### Phase 1 (Current)
- ✅ Admin authentication
- ✅ House CRUD operations
- ✅ Image upload
- ✅ Instagram-inspired design

### Phase 2 (Planned)
- [ ] Customer booking system
- [ ] Payment integration
- [ ] Email notifications
- [ ] Booking calendar
- [ ] Advanced search and filtering

### Phase 3 (Future)
- [ ] Customer mobile app
- [ ] Real-time chat
- [ ] Reviews and ratings
- [ ] Analytics dashboard
- [ ] Multi-admin support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the README files in backend/ and fronted/ directories
2. Review the API documentation
3. Check the issues section
4. Contact the development team

## 🙏 Acknowledgments

- Instagram for design inspiration
- Flask and React communities
- Cloudinary for image hosting
- All contributors and testers
