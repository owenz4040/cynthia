"""
Intelligent Chatbot for Rental Property Management System
Provides comprehensive assistance and information about the system
"""

import re
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from models import HouseModel, UserModel, BookingModel, mongo
from bson import ObjectId

class RentalSystemChatbot:
    def __init__(self):
        self.name = "Cynthia Assistant"
        self.version = "1.0"
        self.system_info = {
            "name": "Rental Property Management System",
            "features": [
                "Property browsing and search",
                "User registration and authentication", 
                "Property booking and management",
                "Admin dashboard for property management",
                "Email notifications and OTP verification",
                "Image upload with Cloudinary integration",
                "Real-time property availability",
                "User profiles and preferences"
            ],
            "tech_stack": {
                "backend": "Flask (Python)",
                "frontend": "Vanilla JavaScript/HTML/CSS",
                "database": "MongoDB",
                "image_storage": "Cloudinary",
                "authentication": "JWT tokens",
                "email": "SMTP integration"
            }
        }
        
        # Initialize conversation patterns and responses
        self.patterns = self._initialize_patterns()
        self.context = {}  # Store conversation context
        
    def _initialize_patterns(self) -> Dict[str, Dict]:
        """Initialize conversation patterns and responses"""
        return {
            # Greetings
            "greeting": {
                "patterns": [
                    r"\b(hi|hello|hey|good morning|good afternoon|good evening)\b",
                    r"\b(what's up|howdy|greetings)\b"
                ],
                "responses": [
                    f"Hello! I'm {self.name}, your rental system assistant. How can I help you today?",
                    f"Hi there! Welcome to our rental system. I'm {self.name} and I'm here to assist you.",
                    "Hello! I'm here to help you with anything about our rental property system."
                ]
            },
            
            # System overview
            "system_overview": {
                "patterns": [
                    r"\b(what is this|what does this do|system overview|about system)\b",
                    r"\b(tell me about|explain|overview)\b.*\b(system|platform|website)\b"
                ],
                "responses": [
                    "This is a comprehensive rental property management system that allows users to browse, book, and manage rental properties. It features user authentication, property search, booking management, and an admin dashboard."
                ]
            },
            
            # Features
            "features": {
                "patterns": [
                    r"\b(features|what can.*do|capabilities|functionality)\b",
                    r"\b(services|offerings|benefits)\b"
                ],
                "responses": [
                    "Our system offers: 🏠 Property browsing & search, 👤 User registration & profiles, 📅 Booking management, 🔐 Secure authentication, 📧 Email notifications, 📸 Property image galleries, 📊 Admin dashboard, and 💳 Payment integration."
                ]
            },
            
            # Registration and authentication
            "registration": {
                "patterns": [
                    r"\b(register|sign up|create account|registration)\b",
                    r"\b(how to.*register|how to.*sign up)\b"
                ],
                "responses": [
                    "To register: 1) Go to the registration page, 2) Fill in your details (name, email, age, gender), 3) Upload a profile image (optional), 4) Create a password, 5) Verify your email with the OTP sent to you. You must be 18+ to register."
                ]
            },
            
            "login": {
                "patterns": [
                    r"\b(login|log in|sign in|authentication)\b",
                    r"\b(how to.*login|how to.*sign in)\b"
                ],
                "responses": [
                    "To login: 1) Go to the login page, 2) Enter your email and password, 3) Your email must be verified first. If you haven't verified, check your email for the OTP code."
                ]
            },
            
            # Property-related queries
            "properties": {
                "patterns": [
                    r"\b(properties|houses|listings|rentals)\b",
                    r"\b(search.*property|find.*house|browse.*rental)\b"
                ],
                "responses": [
                    "You can browse available properties on our main dashboard. Each property includes details like location, price, bedrooms, bathrooms, amenities, and image galleries. Use filters to find properties that match your preferences."
                ]
            },
            
            "booking": {
                "patterns": [
                    r"\b(book|booking|reserve|rent)\b.*\b(property|house)\b",
                    r"\b(how to.*book|booking process)\b"
                ],
                "responses": [
                    "To book a property: 1) Browse available properties, 2) Select your desired property, 3) Choose your dates, 4) Review terms and conditions, 5) Confirm your booking. You'll receive email confirmation and booking details."
                ]
            },
            
            # Pricing
            "pricing": {
                "patterns": [
                    r"\b(price|cost|pricing|rates|fees)\b",
                    r"\b(how much|payment|charges)\b"
                ],
                "responses": [
                    "Property prices vary by location, size, and amenities. All prices are shown per month in KSh (Kenyan Shillings). Check individual property listings for specific pricing."
                ]
            },
            
            # Technical support
            "technical_issues": {
                "patterns": [
                    r"\b(error|bug|problem|issue|not working)\b",
                    r"\b(technical|support|help|troubleshoot)\b"
                ],
                "responses": [
                    "For technical issues: 1) Try refreshing the page, 2) Clear your browser cache, 3) Check your internet connection, 4) Ensure JavaScript is enabled. If problems persist, contact support with details about the error."
                ]
            },
            
            # Admin features
            "admin": {
                "patterns": [
                    r"\b(admin|administrator|dashboard|management)\b",
                    r"\b(add property|manage.*property)\b"
                ],
                "responses": [
                    "Admin features include: 📊 Dashboard with statistics, 🏠 Property management (add/edit/delete), 📸 Image upload and management, 👥 User management, 📈 Booking analytics, and 🔧 System configuration."
                ]
            },
            
            # Email and notifications
            "email": {
                "patterns": [
                    r"\b(email|notification|otp|verification)\b",
                    r"\b(didn't receive|resend)\b.*\b(email|otp)\b"
                ],
                "responses": [
                    "Email features: ✉️ OTP verification for registration, 📧 Booking confirmations, 🎉 Welcome emails, 📋 Booking receipts. If you don't receive emails, check spam folder or request a resend."
                ]
            },
            
            # Payment and security
            "security": {
                "patterns": [
                    r"\b(security|safe|secure|privacy|data protection)\b",
                    r"\b(password|encryption|jwt|token)\b"
                ],
                "responses": [
                    "Security measures: 🔐 Password hashing with bcrypt, 🎫 JWT token authentication, 🛡️ CORS protection, ✅ Input validation, 🔒 Secure image storage with Cloudinary, and 📧 Email verification."
                ]
            },
            
            # Mobile and compatibility
            "mobile": {
                "patterns": [
                    r"\b(mobile|phone|tablet|responsive)\b",
                    r"\b(android|ios|iphone|ipad)\b"
                ],
                "responses": [
                    "Our system is fully responsive and works on all devices: 📱 Mobile phones, 📱 Tablets, 💻 Desktop computers. The design adapts to your screen size for optimal experience."
                ]
            },
            
            # Help and support
            "help": {
                "patterns": [
                    r"\b(help|support|assistance|guide)\b",
                    r"\b(how to|tutorial|instructions)\b"
                ],
                "responses": [
                    "I can help you with: Registration & login, Property browsing, Booking process, Technical issues, Admin features, Email verification, System features, and General questions. What specific help do you need?"
                ]
            }
        }
    
    def get_response(self, user_input: str, user_context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Generate response based on user input
        """
        user_input = user_input.lower().strip()
        
        # Update context if provided
        if user_context:
            self.context.update(user_context)
        
        # Check for specific data requests
        if self._is_data_request(user_input):
            return self._handle_data_request(user_input)
        
        # Find matching pattern
        matched_category = self._find_matching_pattern(user_input)
        
        if matched_category:
            response = self._get_category_response(matched_category, user_input)
        else:
            response = self._get_default_response(user_input)
        
        return {
            "response": response,
            "category": matched_category or "general",
            "timestamp": datetime.utcnow().isoformat(),
            "confidence": self._calculate_confidence(user_input, matched_category)
        }
    
    def _find_matching_pattern(self, user_input: str) -> Optional[str]:
        """Find the best matching pattern category"""
        for category, data in self.patterns.items():
            for pattern in data["patterns"]:
                if re.search(pattern, user_input, re.IGNORECASE):
                    return category
        return None
    
    def _get_category_response(self, category: str, user_input: str) -> str:
        """Get response for a specific category"""
        responses = self.patterns[category]["responses"]
        
        # For some categories, provide more specific information
        if category == "features":
            return self._get_detailed_features()
        elif category == "pricing":
            return self._get_pricing_info()
        elif category == "registration":
            return self._get_registration_guide()
        
        # Return first response for now (can be randomized)
        return responses[0]
    
    def _get_detailed_features(self) -> str:
        """Get detailed features list"""
        features = self.system_info["features"]
        tech_stack = self.system_info["tech_stack"]
        
        response = "🌟 **Our System Features:**\n\n"
        for i, feature in enumerate(features, 1):
            response += f"{i}. {feature}\n"
        
        response += "\n🛠️ **Technology Stack:**\n"
        response += f"• Backend: {tech_stack['backend']}\n"
        response += f"• Frontend: {tech_stack['frontend']}\n"
        response += f"• Database: {tech_stack['database']}\n"
        response += f"• Images: {tech_stack['image_storage']}\n"
        response += f"• Auth: {tech_stack['authentication']}\n"
        
        return response
    
    def _get_pricing_info(self) -> str:
        """Get pricing information with current data"""
        try:
            # Get sample pricing from database
            sample_properties = list(mongo.db.houses.find({"is_available": True}).limit(3))
            
            response = "💰 **Pricing Information:**\n\n"
            
            if sample_properties:
                response += "Here are some current property prices:\n\n"
                for prop in sample_properties:
                    response += f"🏠 **{prop.get('name', 'Property')}**\n"
                    response += f"📍 {prop.get('location', 'Location')}\n"
                    response += f"💳 KSh {prop.get('price_per_month', 0):,}/month\n"
                    response += f"🛏️ {prop.get('bedrooms', 0)} bed(s), 🚿 {prop.get('bathrooms', 0)} bath(s)\n\n"
            else:
                response += "Sample pricing ranges:\n"
                response += "• Studio: KSh 3,000 - 8,000/month\n"
                response += "• 1-2 Bedroom: KSh 8,000 - 20,000/month\n"
                response += "• 3+ Bedroom: KSh 20,000 - 50,000+/month\n\n"
            
            response += "💡 Prices vary by location, amenities, and property size."
            return response
            
        except Exception as e:
            return "Pricing varies by property. Please browse our listings to see current rates in KSh (Kenyan Shillings)."
    
    def _get_registration_guide(self) -> str:
        """Get detailed registration guide"""
        return """📝 **Registration Guide:**

**Step 1: Access Registration**
• Go to register.html or click "Sign Up"

**Step 2: Fill Your Details**
• Full Name (required)
• Email Address (required)
• Age (must be 18+)
• Gender (Male/Female/Other)
• Strong Password (8+ characters)
• Confirm Password

**Step 3: Profile Image (Optional)**
• Upload a profile picture
• Supported: JPG, PNG, GIF
• Images stored securely on Cloudinary

**Step 4: Email Verification**
• Check your email for 6-digit OTP
• Enter OTP to verify your account
• OTP expires in 10 minutes
• Can request resend if needed

**Step 5: Accept Terms**
• Review terms and conditions
• Accept to complete registration

✅ **After Registration:**
• Login with your credentials
• Browse available properties
• Start booking process"""
    
    def _is_data_request(self, user_input: str) -> bool:
        """Check if user is requesting specific data"""
        data_keywords = [
            "show me", "list", "count", "how many", "statistics", "stats",
            "available properties", "users", "bookings"
        ]
        return any(keyword in user_input for keyword in data_keywords)
    
    def _handle_data_request(self, user_input: str) -> Dict[str, Any]:
        """Handle requests for specific data"""
        try:
            if "properties" in user_input or "houses" in user_input:
                return self._get_property_stats()
            elif "users" in user_input:
                return self._get_user_stats()
            elif "bookings" in user_input:
                return self._get_booking_stats()
            elif "statistics" in user_input or "stats" in user_input:
                return self._get_system_stats()
        except Exception as e:
            pass
        
        return self._get_default_response(user_input)
    
    def _get_property_stats(self) -> Dict[str, Any]:
        """Get property statistics"""
        try:
            total_properties = mongo.db.houses.count_documents({})
            available_properties = mongo.db.houses.count_documents({"is_available": True})
            
            # Get price range
            price_stats = list(mongo.db.houses.aggregate([
                {"$group": {
                    "_id": None,
                    "min_price": {"$min": "$price_per_month"},
                    "max_price": {"$max": "$price_per_month"},
                    "avg_price": {"$avg": "$price_per_month"}
                }}
            ]))
            
            response = f"🏠 **Property Statistics:**\n\n"
            response += f"• Total Properties: {total_properties}\n"
            response += f"• Available: {available_properties}\n"
            response += f"• Occupied: {total_properties - available_properties}\n"
            
            if price_stats:
                stats = price_stats[0]
                response += f"\n💰 **Pricing:**\n"
                response += f"• Lowest: KSh {stats.get('min_price', 0):,.0f}/month\n"
                response += f"• Highest: KSh {stats.get('max_price', 0):,.0f}/month\n"
                response += f"• Average: KSh {stats.get('avg_price', 0):,.0f}/month\n"
            
            return {
                "response": response,
                "category": "data_request",
                "timestamp": datetime.utcnow().isoformat(),
                "confidence": 0.95
            }
            
        except Exception as e:
            return {
                "response": "Unable to retrieve property statistics at the moment.",
                "category": "error",
                "timestamp": datetime.utcnow().isoformat(),
                "confidence": 0.5
            }
    
    def _get_user_stats(self) -> Dict[str, Any]:
        """Get user statistics"""
        try:
            total_users = mongo.db.users.count_documents({})
            verified_users = mongo.db.users.count_documents({"is_verified": True})
            
            response = f"👥 **User Statistics:**\n\n"
            response += f"• Total Registered Users: {total_users}\n"
            response += f"• Verified Users: {verified_users}\n"
            response += f"• Pending Verification: {total_users - verified_users}\n"
            
            return {
                "response": response,
                "category": "data_request", 
                "timestamp": datetime.utcnow().isoformat(),
                "confidence": 0.95
            }
            
        except Exception as e:
            return {
                "response": "Unable to retrieve user statistics at the moment.",
                "category": "error",
                "timestamp": datetime.utcnow().isoformat(),
                "confidence": 0.5
            }
    
    def _get_system_stats(self) -> Dict[str, Any]:
        """Get comprehensive system statistics"""
        try:
            # Get all stats
            total_properties = mongo.db.houses.count_documents({})
            available_properties = mongo.db.houses.count_documents({"is_available": True})
            total_users = mongo.db.users.count_documents({})
            verified_users = mongo.db.users.count_documents({"is_verified": True})
            
            response = f"📊 **System Overview:**\n\n"
            response += f"🏠 **Properties:**\n"
            response += f"• Total: {total_properties}\n"
            response += f"• Available: {available_properties}\n\n"
            response += f"👥 **Users:**\n"
            response += f"• Registered: {total_users}\n"
            response += f"• Verified: {verified_users}\n\n"
            response += f"🛠️ **System Status:** ✅ Operational\n"
            response += f"📅 **Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            
            return {
                "response": response,
                "category": "data_request",
                "timestamp": datetime.utcnow().isoformat(),
                "confidence": 0.95
            }
            
        except Exception as e:
            return {
                "response": "Unable to retrieve system statistics at the moment.",
                "category": "error",
                "timestamp": datetime.utcnow().isoformat(),
                "confidence": 0.5
            }
    
    def _get_default_response(self, user_input: str) -> str:
        """Get default response for unmatched queries"""
        if "?" in user_input:
            return f"I understand you're asking about '{user_input}'. I can help you with property rentals, user registration, system features, booking process, pricing, and technical support. Could you please be more specific about what you'd like to know?"
        
        return f"I'm here to help with our rental system! I can assist you with:\n\n• Property browsing and booking\n• User registration and login\n• System features and pricing\n• Technical support\n• Admin functions\n\nWhat would you like to know more about?"
    
    def _calculate_confidence(self, user_input: str, matched_category: Optional[str]) -> float:
        """Calculate confidence score for the response"""
        if matched_category:
            return 0.85
        elif any(keyword in user_input for keyword in ["help", "what", "how", "?"]):
            return 0.6
        else:
            return 0.3

# Initialize chatbot instance
chatbot = RentalSystemChatbot()
