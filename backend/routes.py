from flask import Blueprint, request, jsonify, session, url_for
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import AdminModel, HouseModel, UserModel, OTPModel, BookingModel, mongo
from auth import admin_required, validate_admin_credentials, validate_required_fields
from image_utils import upload_image_to_cloudinary, delete_image_from_cloudinary, allowed_file
from email_utils import send_otp_email, send_welcome_email, send_booking_receipt_email, send_booking_update_email
from chatbot import chatbot
from bson import ObjectId
import uuid
from datetime import datetime

api = Blueprint('api', __name__, url_prefix='/api')

# Global OPTIONS handler for CORS preflight requests
@api.route('/', methods=['OPTIONS'])
@api.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path=None):
    """Handle CORS preflight requests for all API endpoints."""
    from flask import make_response
    response = make_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Health check endpoint
@api.route('/health', methods=['GET'])
def health_check():
    """Comprehensive health check endpoint."""
    try:
        # Test MongoDB connection
        mongo.db.command('ping')
        return jsonify({
            'status': 'healthy',
            'service': 'Rental House Booking API',
            'version': '1.0.0',
            'database': 'MongoDB connected',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'service': 'Rental House Booking API',
            'database': 'MongoDB connection failed',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

# Test endpoint for authenticated requests
@api.route('/test-auth', methods=['GET'])
@jwt_required()
def test_auth():
    """Test endpoint for checking authentication."""
    user_id = get_jwt_identity()
    return jsonify({'status': 'ok', 'user_id': user_id, 'message': 'Authentication working'}), 200

# User Registration and Authentication Routes

@api.route('/register', methods=['POST'])
def register_user():
    """Register a new user with email verification."""
    try:
        # Handle both JSON and form data
        if request.content_type and 'application/json' in request.content_type:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        # Validate required fields
        required_fields = ['name', 'email', 'age', 'gender', 'password', 'confirmPassword']
        is_valid, error_message = validate_required_fields(data, required_fields)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        # Validate password confirmation
        if data['password'] != data['confirmPassword']:
            return jsonify({'error': 'Passwords do not match'}), 400
        
        # Check if user already exists
        existing_user = UserModel.find_by_email(data['email'])
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 400
        
        # Validate age
        try:
            age = int(data['age'])
            if age < 18 or age > 120:
                return jsonify({'error': 'Age must be between 18 and 120'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid age format'}), 400
        
        # Validate gender
        if data['gender'].lower() not in ['male', 'female', 'other']:
            return jsonify({'error': 'Gender must be Male, Female, or Other'}), 400
        
        # Validate password strength
        password = data['password']
        if len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
        # Handle profile image upload to Cloudinary if provided
        profile_image_url = None
        if 'profileImage' in request.files:
            profile_image_file = request.files['profileImage']
            if profile_image_file and profile_image_file.filename != '' and allowed_file(profile_image_file.filename):
                # Upload to Cloudinary
                upload_result = upload_image_to_cloudinary(profile_image_file, f"user_profiles/{data['email']}")
                if upload_result:
                    profile_image_url = upload_result['url']
        
        # Create user account (unverified)
        user_id = UserModel.create_user(
            name=data['name'],
            email=data['email'],
            age=age,
            gender=data['gender'].title(),
            password=password,
            profile_image=profile_image_url
        )
        
        # Generate OTP and create verification link
        otp_code = OTPModel.create_otp(data['email'])
        verification_link = url_for('api.verify_email_link', email=data['email'], otp_code=otp_code, _external=True)
        # Send OTP email (with link)
        email_sent = send_otp_email(data['email'], otp_code, data['name'])
        # Respond with link regardless of email success
        if not email_sent:
            return jsonify({
                'message': 'Registration successful, but email delivery failed.',
                'user_id': user_id,
                'email': data['email'],
                'otp_sent': False,
                'verification_link': verification_link
            }), 201
        return jsonify({
            'message': 'Registration successful! Verification email sent.',
            'user_id': user_id,
            'email': data['email'],
            'otp_sent': True,
            'verification_link': verification_link
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@api.route('/verify-email', methods=['POST'])
def verify_email():
    """Verify user email with OTP."""
    try:
        data = request.get_json()
        
        required_fields = ['email', 'otp']
        is_valid, error_message = validate_required_fields(data, required_fields)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        # Verify OTP
        is_valid = OTPModel.verify_otp(data['email'], data['otp'])
        if not is_valid:
            return jsonify({'error': 'Invalid or expired verification code'}), 400
        
        # Find user and mark as verified
        user = UserModel.find_by_email(data['email'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update user verification status
        UserModel.verify_user(str(user['_id']))
        
        # Send welcome email
        send_welcome_email(data['email'], user['name'])
        
        # Clean up expired OTPs
        OTPModel.cleanup_expired_otps()
        
        return jsonify({
            'message': 'Email verified successfully! You can now login.',
            'verified': True
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Verification failed: {str(e)}'}), 500

@api.route('/verify-email/<email>/<otp_code>', methods=['GET'])
def verify_email_link(email, otp_code):
    """Verify user email via link click."""
    try:
        # Verify OTP
        is_valid = OTPModel.verify_otp(email, otp_code)
        if not is_valid:
            return ("<h1>Invalid or expired verification link.</h1>"), 400
        # Mark user as verified
        user = UserModel.find_by_email(email)
        if user:
            UserModel.verify_user(str(user['_id']))
            # Send welcome email
            send_welcome_email(email, user['name'])
        # Clean up OTPs
        OTPModel.cleanup_expired_otps()
        # Show confirmation HTML
        return ("""
        <!DOCTYPE html>
        <html>
        <head><title>Email Verified</title></head>
        <body style=\"font-family:Arial,sans-serif;text-align:center;padding:50px;\">
            <h1>✅ Email Verified!</h1>
            <p>Your email has been successfully verified.</p>
            <p><a href=\"/login.html\" style=\"display:inline-block;margin-top:20px;padding:10px 20px;background:#28a745;color:#fff;text-decoration:none;border-radius:5px;\">Go to Login</a></p>
        </body>
        </html>
        """), 200
    except Exception as e:
        return (f"<h1>Verification error: {str(e)}</h1>"), 500

@api.route('/resend-otp', methods=['POST'])
def resend_otp():
    """Resend OTP for email verification."""
    try:
        data = request.get_json()
        
        if 'email' not in data:
            return jsonify({'error': 'Email is required'}), 400
        
        # Check if user exists
        user = UserModel.find_by_email(data['email'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.get('is_verified', False):
            return jsonify({'error': 'Email already verified'}), 400
        
        # Generate and send new OTP
        otp_code = OTPModel.create_otp(data['email'])
        email_sent = send_otp_email(data['email'], otp_code, user['name'])
        
        if not email_sent:
            return jsonify({'error': 'Failed to send verification email'}), 500
        
        return jsonify({
            'message': 'Verification code sent successfully!'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to resend OTP: {str(e)}'}), 500

@api.route('/login', methods=['POST'])
def login_user():
    """User login with session management."""
    try:
        data = request.get_json()
        
        required_fields = ['email', 'password']
        is_valid, error_message = validate_required_fields(data, required_fields)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        # Find user
        user = UserModel.find_by_email(data['email'])
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check if email is verified
        if not user.get('is_verified', False):
            return jsonify({
                'error': 'Your email is not verified. Please check your inbox for the OTP and verify your account before logging in.',
                'requires_verification': True
            }), 401
        
        # Check password
        if not UserModel.check_password(data['password'], user['password_hash']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create JWT token
        access_token = create_access_token(
            identity=str(user['_id']),
            additional_claims={
                'user_type': 'customer',
                'email': user['email'],
                'name': user['name']
            }
        )
        
        # Create session data
        session['user_id'] = str(user['_id'])
        session['user_email'] = user['email']
        session['user_name'] = user['name']
        session['is_authenticated'] = True
        
        return jsonify({
            'message': 'Login successful',
            'token': access_token,
            'user': {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'age': user['age'],
                'gender': user['gender'],
                'profile_image': user.get('profile_image'),
                'terms_accepted': user.get('terms_accepted', False)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@api.route('/accept-terms', methods=['POST'])
@jwt_required()
def accept_terms():
    """Accept terms and conditions."""
    try:
        user_id = get_jwt_identity()
        
        # Update user terms acceptance
        success = UserModel.accept_terms(user_id)
        if not success:
            return jsonify({'error': 'Failed to update terms acceptance'}), 500
        
        # Update session
        session['terms_accepted'] = True
        
        return jsonify({
            'message': 'Terms and conditions accepted successfully',
            'terms_accepted': True
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to accept terms: {str(e)}'}), 500

@api.route('/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Get user profile information."""
    try:
        user_id = get_jwt_identity()
        user = UserModel.find_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'age': user['age'],
                'gender': user['gender'],
                'profile_image': user.get('profile_image'),
                'is_verified': user.get('is_verified', False),
                'terms_accepted': user.get('terms_accepted', False),
                'created_at': user['created_at'].isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get profile: {str(e)}'}), 500

@api.route('/profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    """Update user profile information including profile picture."""
    try:
        user_id = get_jwt_identity()
        user = UserModel.find_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get form data
        data = request.form.to_dict()
        update_data = {}

        # Update basic info if provided
        if 'name' in data and data['name'].strip():
            if len(data['name'].strip()) < 2:
                return jsonify({'error': 'Name must be at least 2 characters long'}), 400
            update_data['name'] = data['name'].strip()

        if 'age' in data and data['age']:
            try:
                age = int(data['age'])
                if age < 13 or age > 120:
                    return jsonify({'error': 'Age must be between 13 and 120'}), 400
                update_data['age'] = age
            except ValueError:
                return jsonify({'error': 'Invalid age format'}), 400

        if 'gender' in data and data['gender']:
            if data['gender'].lower() not in ['male', 'female', 'other']:
                return jsonify({'error': 'Gender must be Male, Female, or Other'}), 400
            update_data['gender'] = data['gender'].title()

        # Handle profile image upload to Cloudinary
        if 'profileImage' in request.files:
            profile_image_file = request.files['profileImage']
            if profile_image_file and profile_image_file.filename != '' and allowed_file(profile_image_file.filename):
                # Delete old profile image from Cloudinary if exists
                old_profile_image = user.get('profile_image')
                if old_profile_image:
                    # Extract public_id from the old URL and delete it
                    try:
                        # Get public_id from URL (assuming Cloudinary URL structure)
                        public_id = old_profile_image.split('/')[-1].split('.')[0]
                        delete_image_from_cloudinary(f"user_profiles/{public_id}")
                    except:
                        pass  # Continue even if deletion fails

                # Upload new profile image
                upload_result = upload_image_to_cloudinary(profile_image_file, f"user_profiles/{user['email']}")
                if upload_result:
                    update_data['profile_image'] = upload_result['url']
                else:
                    return jsonify({'error': 'Failed to upload profile image'}), 500

        # Update user in database
        if update_data:
            UserModel.update_user(user_id, update_data)

        # Get updated user data
        updated_user = UserModel.find_by_id(user_id)
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': str(updated_user['_id']),
                'name': updated_user['name'],
                'email': updated_user['email'],
                'age': updated_user['age'],
                'gender': updated_user['gender'],
                'profile_image': updated_user.get('profile_image'),
                'is_verified': updated_user.get('is_verified', False),
                'terms_accepted': updated_user.get('terms_accepted', False),
                'created_at': updated_user['created_at'].isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500

@api.route('/logout', methods=['POST'])
@jwt_required()
def logout_user():
    """User logout with session cleanup."""
    try:
        # Clear session data
        session.clear()
        
        return jsonify({
            'message': 'Logged out successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Logout failed: {str(e)}'}), 500

# Public route to get houses (for authenticated users)
@api.route('/houses', methods=['GET'])
@jwt_required()
def get_houses_for_users():
    """Get houses for authenticated users."""
    try:
        # Check if user accepted terms
        user_id = get_jwt_identity()
        user = UserModel.find_by_id(user_id)
        
        if not user or not user.get('terms_accepted', False):
            return jsonify({
                'error': 'Terms and conditions must be accepted first',
                'requires_terms': True
            }), 403
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Get only available houses for users
        houses, total = HouseModel.find_all(page=page, per_page=per_page)
        
        # Filter only available houses and convert to dict format
        available_houses = []
        for house in houses:
            if house.get('is_available', True):
                house_dict = HouseModel.to_dict(house)
                if house_dict:  # Only add if conversion successful
                    available_houses.append(house_dict)
        
        return jsonify({
            'houses': available_houses,
            'total': len(available_houses),
            'page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get houses: {str(e)}'}), 500

# Public route to get houses (no authentication required for landing page)
@api.route('/houses/public', methods=['GET'])
def get_houses_public():
    """Get houses for public access (landing page)."""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 6))  # Default to 6 for carousel
        
        # Get only available houses for public viewing
        houses, total = HouseModel.find_all(page=page, per_page=per_page)
        
        # Filter only available houses and convert to dict format
        available_houses = []
        for house in houses:
            if house.get('is_available', True):
                house_dict = HouseModel.to_dict(house)
                if house_dict:  # Only add if conversion successful
                    available_houses.append(house_dict)
        
        return jsonify({
            'houses': available_houses,
            'total': len(available_houses),
            'page': page,
            'per_page': per_page,
            'total_pages': (len(available_houses) + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get houses: {str(e)}'}), 500

# Admin Authentication Routes
@api.route('/admin/login', methods=['POST'])
def admin_login():
    """Admin login endpoint."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        admin = validate_admin_credentials(email, password)
        if not admin:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        access_token = create_access_token(identity=str(admin['_id']))
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'admin': AdminModel.to_dict(admin)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/admin/profile', methods=['GET'])
@admin_required
def get_admin_profile(current_admin):
    """Get current admin profile."""
    return jsonify({'admin': AdminModel.to_dict(current_admin)}), 200

@api.route('/admin/debug', methods=['GET'])
def debug_admin_auth():
    """Debug endpoint to check admin authentication."""
    try:
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        
        # Try to get JWT without requiring admin
        verify_jwt_in_request()
        current_id = get_jwt_identity()
        
        # Check if this ID exists in admins collection
        admin = AdminModel.find_by_id(current_id)
        
        return jsonify({
            'jwt_identity': current_id,
            'is_admin': admin is not None,
            'admin_details': AdminModel.to_dict(admin) if admin else None
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'jwt_identity': None,
            'is_admin': False
        }), 200

# House Management Routes (Admin)
@api.route('/admin/houses', methods=['GET'])
@admin_required
def get_all_houses_admin(current_admin):
    """Get all houses for admin."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        houses, total = HouseModel.find_all(page, per_page)
        pages = (total + per_page - 1) // per_page
        
        return jsonify({
            'houses': [HouseModel.to_dict(house) for house in houses],
            'total': total,
            'pages': pages,
            'current_page': page,
            'per_page': per_page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/admin/houses/<house_id>', methods=['GET'])
@admin_required
def get_house_admin(house_id, current_admin):
    """Get a specific house by ID for admin."""
    try:
        house = HouseModel.find_by_id(house_id)
        if not house:
            return jsonify({'error': 'House not found'}), 404
        
        return jsonify({'house': HouseModel.to_dict(house)}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/admin/houses', methods=['POST'])
@admin_required
def create_house(current_admin):
    """Create a new house (Admin only)."""
    try:
        # Get form data
        data = request.form.to_dict()
        
        # Validate required fields
        required_fields = ['name', 'bedrooms', 'price_per_month']
        is_valid, error_message = validate_required_fields(data, required_fields)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        # Process amenities
        amenities_str = data.get('amenities', '')
        if amenities_str:
            amenities_list = [amenity.strip() for amenity in amenities_str.split(',') if amenity.strip()]
        else:
            amenities_list = []
        
        # Prepare house data
        house_data = {
            'name': data['name'],
            'description': data.get('description', ''),
            'bedrooms': int(data['bedrooms']),
            'bathrooms': int(data.get('bathrooms', 1)),
            'price_per_month': float(data['price_per_month']),
            'location': data.get('location', ''),
            'amenities': amenities_list,
            'is_available': data.get('is_available', 'true').lower() == 'true'
        }
        
        # Create house
        house_id = HouseModel.create_house(house_data)
        
        # Handle image uploads
        uploaded_images = []
        files = request.files.getlist('images')
        
        for i, file in enumerate(files):
            if file and file.filename != '' and allowed_file(file.filename):
                # Upload to Cloudinary
                upload_result = upload_image_to_cloudinary(file, f"rental_houses/{house_id}")
                
                if upload_result:
                    image_data = {
                        'id': str(uuid.uuid4()),
                        'image_url': upload_result['url'],
                        'public_id': upload_result['public_id'],
                        'is_primary': (i == 0)  # First image is primary
                    }
                    HouseModel.add_image(house_id, image_data)
                    uploaded_images.append(upload_result['url'])
        
        # Get the created house
        house = HouseModel.find_by_id(house_id)
        
        return jsonify({
            'message': 'House created successfully',
            'house': HouseModel.to_dict(house),
            'uploaded_images': uploaded_images
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/admin/houses/<house_id>', methods=['PUT'])
@admin_required
def update_house(current_admin, house_id):
    """Update a house (Admin only)."""
    try:
        house = HouseModel.find_by_id(house_id)
        if not house:
            return jsonify({'error': 'House not found'}), 404
        
        data = request.form.to_dict()
        
        # Process amenities
        if 'amenities' in data:
            amenities_list = [amenity.strip() for amenity in data['amenities'].split(',') if amenity.strip()]
            data['amenities'] = amenities_list
        
        # Convert boolean
        if 'is_available' in data:
            data['is_available'] = data['is_available'].lower() == 'true'
        
        # Update house
        HouseModel.update_house(house_id, data)
        
        # Handle new image uploads
        files = request.files.getlist('images')
        uploaded_images = []
        
        for file in files:
            if file and file.filename != '' and allowed_file(file.filename):
                upload_result = upload_image_to_cloudinary(file, f"rental_houses/{house_id}")
                
                if upload_result:
                    image_data = {
                        'id': str(uuid.uuid4()),
                        'image_url': upload_result['url'],
                        'public_id': upload_result['public_id'],
                        'is_primary': False
                    }
                    HouseModel.add_image(house_id, image_data)
                    uploaded_images.append(upload_result['url'])
        
        # Get updated house
        updated_house = HouseModel.find_by_id(house_id)
        
        return jsonify({
            'message': 'House updated successfully',
            'house': HouseModel.to_dict(updated_house),
            'new_images': uploaded_images
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/admin/houses/<house_id>', methods=['DELETE'])
@admin_required
def delete_house(current_admin, house_id):
    """Delete a house (Admin only)."""
    try:
        house = HouseModel.find_by_id(house_id)
        if not house:
            return jsonify({'error': 'House not found'}), 404
        
        # Delete images from Cloudinary
        for image in house.get('images', []):
            if image.get('public_id'):
                delete_image_from_cloudinary(image['public_id'])
        
        # Delete house
        HouseModel.delete_house(house_id)
        
        return jsonify({'message': 'House deleted successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/admin/houses/<house_id>/images/<image_id>', methods=['DELETE'])
@admin_required
def delete_house_image(current_admin, house_id, image_id):
    """Delete a specific house image (Admin only)."""
    try:
        house = HouseModel.find_by_id(house_id)
        if not house:
            return jsonify({'error': 'House not found'}), 404
        
        # Find the image
        image_to_delete = None
        for image in house.get('images', []):
            if image.get('id') == image_id:
                image_to_delete = image
                break
        
        if not image_to_delete:
            return jsonify({'error': 'Image not found'}), 404
        
        # Delete from Cloudinary
        if image_to_delete.get('public_id'):
            delete_image_from_cloudinary(image_to_delete['public_id'])
        
        # Remove from database
        HouseModel.remove_image(house_id, image_id)
        
        return jsonify({'message': 'Image deleted successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Dashboard Stats
@api.route('/admin/stats', methods=['GET'])
@admin_required
def get_dashboard_stats(current_admin):
    """Get dashboard statistics (Admin only)."""
    try:
        total_houses = HouseModel.count_total()
        available_houses = HouseModel.count_available()
        
        return jsonify({
            'total_houses': total_houses,
            'available_houses': available_houses,
            'unavailable_houses': total_houses - available_houses
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Admin User Management Routes

@api.route('/admin/users', methods=['GET'])
@admin_required
def get_all_users(current_admin):
    """Get all users for admin management."""
    try:
        # Get all users from database
        users_collection = mongo.db.users
        users = list(users_collection.find(
            {},
            {
                'password_hash': 0,  # Don't return password hashes
                'profile_image': 0   # Don't return large image data
            }
        ))
        
        # Convert ObjectId to string and format data
        formatted_users = []
        for user in users:
            user['_id'] = str(user['_id'])
            user['created_at'] = user.get('created_at', 'Unknown')
            formatted_users.append(user)
        
        return jsonify({
            'users': formatted_users,
            'total_count': len(formatted_users)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/admin/users/<user_id>', methods=['GET'])
@admin_required
def get_user_details(current_admin, user_id):
    """Get detailed information about a specific user."""
    try:
        user = UserModel.find_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Remove sensitive information
        user_data = dict(user)
        user_data.pop('password_hash', None)
        user_data['_id'] = str(user_data['_id'])
        
        return jsonify({'user': user_data}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/admin/users/<user_id>/status', methods=['PUT'])
@admin_required
def update_user_status(current_admin, user_id):
    """Update user status (active/inactive)."""
    try:
        data = request.get_json()
        new_status = data.get('is_active')
        
        if new_status is None:
            return jsonify({'error': 'Status is required'}), 400
        
        # Update user status
        users_collection = mongo.db.users
        result = users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'is_active': new_status}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'User not found or status unchanged'}), 404
        
        return jsonify({
            'message': f'User status updated to {"active" if new_status else "inactive"}',
            'user_id': user_id,
            'new_status': new_status
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/admin/users/<user_id>', methods=['DELETE'])
@admin_required
def delete_user(current_admin, user_id):
    """Delete a user account (admin only)."""
    try:
        # Check if user exists
        user = UserModel.find_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete user from database
        users_collection = mongo.db.users
        result = users_collection.delete_one({'_id': ObjectId(user_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Failed to delete user'}), 500
        
        # Also delete any OTP records for this user
        otps_collection = mongo.db.otps
        otps_collection.delete_many({'email': user['email']})
        
        return jsonify({
            'message': 'User deleted successfully',
            'deleted_user_id': user_id,
            'deleted_email': user['email']
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================
# BOOKING ROUTES (User Site Review Booking)
# ============================================

@api.route('/bookings', methods=['POST'])
@jwt_required()
def create_booking():
    """Create a new site review booking."""
    try:
        user_id = get_jwt_identity()
        user = UserModel.find_by_id(user_id)
        
        if not user or not user.get('is_verified', False):
            return jsonify({'error': 'Account must be verified to book site reviews'}), 403
        
        if not user.get('terms_accepted', False):
            return jsonify({'error': 'Terms and conditions must be accepted'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['house_id', 'preferred_date', 'preferred_time']
        is_valid, error_message = validate_required_fields(data, required_fields)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        # Validate house exists and is available
        house = HouseModel.find_by_id(data['house_id'])
        if not house:
            return jsonify({'error': 'Property not found'}), 404
        
        if not house.get('is_available', True):
            return jsonify({'error': 'Property is not available for viewing'}), 400
        
        # Validate date and time format
        try:
            preferred_date = datetime.strptime(data['preferred_date'], '%Y-%m-%d').date()
            preferred_time = data['preferred_time']
            
            # Check if date is in the future
            from datetime import date
            if preferred_date <= date.today():
                return jsonify({'error': 'Preferred date must be in the future'}), 400
                
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Create booking
        booking_id = BookingModel.create_booking(
            user_id=user_id,
            house_id=data['house_id'],
            preferred_date=data['preferred_date'],
            preferred_time=preferred_time,
            special_requests=data.get('special_requests', '')
        )
        
        # Get created booking with house details
        booking = BookingModel.find_by_id(booking_id)
        
        return jsonify({
            'message': 'Site review booking request submitted successfully!',
            'booking': BookingModel.to_dict(booking),
            'next_steps': 'You will receive an email confirmation once the admin reviews your request.'
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to create booking: {str(e)}'}), 500

@api.route('/bookings', methods=['GET'])
@jwt_required()
def get_user_bookings():
    """Get user's bookings with pagination and optional status filter."""
    try:
        user_id = get_jwt_identity()
        
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 10)), 50)
        status = request.args.get('status')  # Add status filter
        
        bookings, total = BookingModel.find_by_user(user_id, page, per_page, status)
        
        # Format bookings for response
        formatted_bookings = []
        for booking in bookings:
            booking_dict = BookingModel.to_dict(booking)
            booking_dict['house'] = {
                'id': str(booking['house']['_id']),
                'name': booking['house']['name'],
                'location': booking['house']['location'],
                'price_per_month': booking['house']['price_per_month'],
                'images': booking['house'].get('images', [])
            }
            formatted_bookings.append(booking_dict)
        
        return jsonify({
            'bookings': formatted_bookings,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get bookings: {str(e)}'}), 500

@api.route('/bookings/<booking_id>', methods=['GET'])
@jwt_required()
def get_booking_details(booking_id):
    """Get specific booking details."""
    try:
        user_id = get_jwt_identity()
        booking = BookingModel.find_by_id(booking_id)
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Ensure user owns this booking
        if str(booking['user_id']) != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({
            'booking': BookingModel.to_dict(booking)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get booking: {str(e)}'}), 500

@api.route('/bookings/<booking_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_booking(booking_id):
    """Cancel a booking (user only)."""
    try:
        user_id = get_jwt_identity()
        booking = BookingModel.find_by_id(booking_id)
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Ensure user owns this booking
        if str(booking['user_id']) != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Only allow cancelling pending or approved bookings
        if booking['status'] not in ['pending', 'approved']:
            return jsonify({'error': f'Cannot cancel booking with status: {booking["status"]}'}), 400
        
        # Update booking status to cancelled
        success = BookingModel.update_booking_status(
            booking_id=booking_id,
            status='cancelled'
        )
        
        if not success:
            return jsonify({'error': 'Failed to cancel booking'}), 500
        
        # Get updated booking details
        updated_booking = BookingModel.find_by_id(booking_id)
        
        return jsonify({
            'message': 'Booking cancelled successfully',
            'booking': BookingModel.to_dict(updated_booking)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to cancel booking: {str(e)}'}), 500

# ============================================
# ADMIN BOOKING ROUTES
# ============================================

@api.route('/admin/bookings', methods=['GET'])
@admin_required
def get_all_bookings(current_admin):
    """Get all bookings for admin with optional status filter."""
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 10)), 50)
        status = request.args.get('status')
        
        bookings, total = BookingModel.find_all_bookings(page, per_page, status)
        
        # Format bookings for response
        formatted_bookings = []
        for booking in bookings:
            booking_dict = BookingModel.to_dict(booking)
            booking_dict['house'] = {
                'id': str(booking['house']['_id']),
                'name': booking['house']['name'],
                'location': booking['house']['location'],
                'price_per_month': booking['house']['price_per_month'],
                'images': booking['house'].get('images', [])
            }
            booking_dict['user'] = {
                'id': str(booking['user']['_id']),
                'name': booking['user']['name'],
                'email': booking['user']['email']
            }
            formatted_bookings.append(booking_dict)
        
        return jsonify({
            'bookings': formatted_bookings,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get bookings: {str(e)}'}), 500

@api.route('/admin/bookings/<booking_id>/approve', methods=['POST'])
@admin_required
def approve_booking(current_admin, booking_id):
    """Approve a booking request."""
    try:
        data = request.get_json()
        booking = BookingModel.find_by_id(booking_id)
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        if booking['status'] != 'pending':
            return jsonify({'error': 'Only pending bookings can be approved'}), 400
        
        # Get confirmed date and time from admin
        confirmed_date = data.get('confirmed_date', booking['preferred_date'])
        confirmed_time = data.get('confirmed_time', booking['preferred_time'])
        admin_notes = data.get('admin_notes', '')
        
        # Update booking status
        success = BookingModel.update_booking_status(
            booking_id=booking_id,
            status='approved',
            admin_notes=admin_notes,
            confirmed_date=confirmed_date,
            confirmed_time=confirmed_time
        )
        
        if not success:
            return jsonify({'error': 'Failed to update booking'}), 500
        
        # Get updated booking with user and house details
        updated_booking = BookingModel.find_by_id(booking_id)
        user = UserModel.find_by_id(str(booking['user_id']))
        house = HouseModel.find_by_id(str(booking['house_id']))
        
        # Send email receipt to user
        try:
            send_booking_receipt_email(
                user_email=user['email'],
                user_name=user['name'],
                house_name=house['name'],
                house_location=house['location'],
                booking_date=confirmed_date,
                booking_time=confirmed_time,
                admin_notes=admin_notes
            )
        except Exception as email_error:
            print(f"Failed to send booking receipt email: {email_error}")
        
        return jsonify({
            'message': 'Booking approved successfully',
            'booking': BookingModel.to_dict(updated_booking)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to approve booking: {str(e)}'}), 500

@api.route('/admin/bookings/<booking_id>/reject', methods=['POST'])
@admin_required
def reject_booking(current_admin, booking_id):
    """Reject a booking request."""
    try:
        data = request.get_json()
        booking = BookingModel.find_by_id(booking_id)
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        if booking['status'] != 'pending':
            return jsonify({'error': 'Only pending bookings can be rejected'}), 400
        
        admin_notes = data.get('admin_notes', 'Booking request rejected')
        
        # Update booking status
        success = BookingModel.update_booking_status(
            booking_id=booking_id,
            status='rejected',
            admin_notes=admin_notes
        )
        
        if not success:
            return jsonify({'error': 'Failed to update booking'}), 500
        
        # Get updated booking with user and house details
        updated_booking = BookingModel.find_by_id(booking_id)
        user = UserModel.find_by_id(str(booking['user_id']))
        house = HouseModel.find_by_id(str(booking['house_id']))
        
        # Send rejection email to user
        try:
            send_booking_update_email(
                user_email=user['email'],
                user_name=user['name'],
                house_name=house['name'],
                status='rejected',
                admin_notes=admin_notes
            )
        except Exception as email_error:
            print(f"Failed to send booking rejection email: {email_error}")
        
        return jsonify({
            'message': 'Booking rejected',
            'booking': BookingModel.to_dict(updated_booking)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to reject booking: {str(e)}'}), 500

@api.route('/admin/bookings/stats', methods=['GET'])
@admin_required
def get_booking_stats(current_admin):
    """Get booking statistics for admin dashboard."""
    try:
        stats = BookingModel.get_booking_stats()
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get booking stats: {str(e)}'}), 500

@api.route('/admin/bookings/<booking_id>/complete', methods=['POST'])
@admin_required
def complete_booking(current_admin, booking_id):
    """Mark a booking as completed."""
    try:
        booking = BookingModel.find_by_id(booking_id)
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        if booking['status'] != 'approved':
            return jsonify({'error': 'Only approved bookings can be marked as completed'}), 400
        
        # Update booking status
        success = BookingModel.update_booking_status(
            booking_id=booking_id,
            status='completed'
        )
        
        if not success:
            return jsonify({'error': 'Failed to update booking'}), 500
        
        # Get updated booking details
        updated_booking = BookingModel.find_by_id(booking_id)
        user = UserModel.find_by_id(str(booking['user_id']))
        house = HouseModel.find_by_id(str(booking['house_id']))
        
        # Send completion email to user
        try:
            send_booking_update_email(
                user_email=user['email'],
                user_name=user['name'],
                house_name=house['name'],
                status='completed'
            )
        except Exception as email_error:
            print(f"Failed to send booking completion email: {email_error}")
        
        return jsonify({
            'message': 'Booking marked as completed',
            'booking': BookingModel.to_dict(updated_booking)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to complete booking: {str(e)}'}), 500

@api.route('/admin/bookings/<booking_id>', methods=['DELETE'])
@admin_required
def delete_booking(current_admin, booking_id):
    """Delete a booking (admin only)."""
    try:
        # Check if booking exists
        booking = BookingModel.find_by_id(booking_id)
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Get user and house details for potential notification
        user = UserModel.find_by_id(str(booking['user_id']))
        house = HouseModel.find_by_id(str(booking['house_id']))
        
        # Delete the booking
        success = BookingModel.delete_booking(booking_id)
        
        if not success:
            return jsonify({'error': 'Failed to delete booking'}), 500
        
        # Optionally send notification email to user if booking was not cancelled/rejected
        if booking['status'] in ['pending', 'approved'] and user:
            try:
                send_booking_update_email(
                    user_email=user['email'],
                    user_name=user['name'],
                    house_name=house['name'] if house else 'Property',
                    status='cancelled',
                    admin_message=f"Your booking has been cancelled by admin."
                )
            except Exception as email_error:
                print(f"Failed to send booking cancellation email: {email_error}")
        
        return jsonify({
            'message': 'Booking deleted successfully',
            'booking_id': booking_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete booking: {str(e)}'}), 500

# ============================================
# CHATBOT ROUTES
# ============================================

@api.route('/chatbot/message', methods=['POST'])
def chatbot_message():
    """Handle chatbot conversation."""
    try:
        data = request.get_json()
        
        if 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        user_message = data['message'].strip()
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        # Get user context if provided
        user_context = data.get('context', {})
        
        # Add user authentication context if available
        from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
        try:
            verify_jwt_in_request(optional=True)
            current_user_id = get_jwt_identity()
            if current_user_id:
                user_context['user_id'] = current_user_id
                user_context['authenticated'] = True
        except:
            user_context['authenticated'] = False
        
        # Get chatbot response
        response_data = chatbot.get_response(user_message, user_context)
        
        # Log conversation (optional)
        conversation_log = {
            'user_message': user_message,
            'bot_response': response_data['response'],
            'category': response_data['category'],
            'confidence': response_data['confidence'],
            'user_context': user_context,
            'timestamp': datetime.utcnow()
        }
        
        # Store conversation in database (optional)
        try:
            mongo.db.chatbot_logs.insert_one(conversation_log)
        except:
            pass  # Continue even if logging fails
        
        return jsonify({
            'success': True,
            'response': response_data['response'],
            'category': response_data['category'],
            'confidence': response_data['confidence'],
            'timestamp': response_data['timestamp']
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Chatbot error: {str(e)}',
            'response': "I'm sorry, I'm experiencing some technical difficulties. Please try again or contact support."
        }), 500

@api.route('/chatbot/suggestions', methods=['GET'])
def chatbot_suggestions():
    """Get conversation suggestions for users."""
    try:
        suggestions = [
            "What features does this system have?",
            "How do I register for an account?",
            "How can I book a property?",
            "What are the pricing options?",
            "Show me available properties",
            "How do I verify my email?",
            "What payment methods are accepted?",
            "How do I contact support?",
            "Is the system mobile-friendly?",
            "What security measures are in place?"
        ]
        
        return jsonify({
            'success': True,
            'suggestions': suggestions
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get suggestions: {str(e)}'
        }), 500

@api.route('/chatbot/quick-info', methods=['GET'])
def chatbot_quick_info():
    """Get quick system information."""
    try:
        # Get basic system stats
        total_properties = mongo.db.houses.count_documents({})
        available_properties = mongo.db.houses.count_documents({"is_available": True})
        total_users = mongo.db.users.count_documents({})
        
        quick_info = {
            'system_name': 'Rental Property Management System',
            'version': '1.0',
            'status': 'Operational',
            'stats': {
                'total_properties': total_properties,
                'available_properties': available_properties,
                'total_users': total_users
            },
            'key_features': [
                'Property browsing and search',
                'User registration with email verification',
                'Secure booking system',
                'Admin property management',
                'Real-time availability updates'
            ],
            'support_topics': [
                'Registration & Login',
                'Property Booking',
                'System Features',
                'Technical Support',
                'Pricing Information'
            ]
        }
        
        return jsonify({
            'success': True,
            'info': quick_info
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get quick info: {str(e)}'
        }), 500

@api.route('/chatbot/conversation-history', methods=['GET'])
@jwt_required()
def chatbot_conversation_history():
    """Get user's chatbot conversation history."""
    try:
        current_user_id = get_jwt_identity()
        
        # Get recent conversations for this user
        conversations = list(mongo.db.chatbot_logs.find(
            {'user_context.user_id': current_user_id}
        ).sort('timestamp', -1).limit(50))
        
        # Format conversations
        formatted_conversations = []
        for conv in conversations:
            formatted_conversations.append({
                'user_message': conv.get('user_message'),
                'bot_response': conv.get('bot_response'),
                'category': conv.get('category'),
                'confidence': conv.get('confidence'),
                'timestamp': conv.get('timestamp').isoformat() if conv.get('timestamp') else None
            })
        
        return jsonify({
            'success': True,
            'conversations': formatted_conversations,
            'total': len(formatted_conversations)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get conversation history: {str(e)}'
        }), 500
