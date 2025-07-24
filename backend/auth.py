from functools import wraps
from flask import jsonify, request, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import AdminModel, mongo

def admin_required(f):
    """Decorator to require admin authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            print(f"Admin required decorator called for: {f.__name__}")
            
            # Verify JWT token
            verify_jwt_in_request()
            current_admin_id = get_jwt_identity()
            print(f"JWT identity: {current_admin_id}")
            
            # Check if admin exists
            admin = AdminModel.find_by_id(current_admin_id)
            print(f"Admin found: {admin is not None}")
            
            if not admin:
                print("Admin not found in database")
                return jsonify({'error': 'Admin not found'}), 404
                
            print(f"Admin authentication successful for: {admin.get('email')}")
            return f(current_admin=admin, *args, **kwargs)
        except Exception as e:
            print(f"Admin authentication failed: {str(e)}")
            print(f"Exception type: {type(e).__name__}")
            return jsonify({'error': 'Invalid or expired token'}), 401
    
    return decorated_function

def validate_admin_credentials(email, password):
    """Validate admin login credentials."""
    admin = AdminModel.find_by_email(email)
    if admin and AdminModel.check_password(password, admin['password_hash']):
        return admin
    return None

def create_default_admin(app):
    """Create default admin if none exists."""
    with app.app_context():
        try:
            # Check if database connection is working
            if mongo.db is None:
                print("❌ MongoDB connection failed")
                return
            
            # Test the connection
            mongo.db.command('ping')
            print("✅ MongoDB connection successful")
            
            existing_admin = AdminModel.find_by_email(app.config['ADMIN_EMAIL'])
            if not existing_admin:
                AdminModel.create_admin(
                    app.config['ADMIN_EMAIL'],
                    app.config['ADMIN_PASSWORD']
                )
                print(f"✅ Default admin created with email: {app.config['ADMIN_EMAIL']}")
            else:
                print(f"✅ Admin already exists: {app.config['ADMIN_EMAIL']}")
        except Exception as e:
            print(f"❌ Error creating default admin: {str(e)}")
            print("⚠️  Continuing without default admin...")

def validate_required_fields(data, required_fields):
    """Validate that all required fields are present in data."""
    missing_fields = []
    for field in required_fields:
        if field not in data or data[field] is None or str(data[field]).strip() == '':
            missing_fields.append(field)
    
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    
    return True, None
