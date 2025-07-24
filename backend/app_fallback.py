from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config
import os

def create_app(config_name=None):
    """Application factory with MongoDB fallback."""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Try MongoDB first, fallback to temporary storage
    try:
        from models import mongo
        mongo.init_app(app)
        
        # Test MongoDB connection
        with app.app_context():
            mongo.db.command('ping')
        
        print("✅ Using MongoDB Atlas")
        use_mongo = True
        
    except Exception as e:
        print(f"⚠️  MongoDB connection failed: {str(e)}")
        print("🔄 Falling back to temporary in-memory storage")
        
        # Use temporary storage
        from temp_mongo import temp_mongo
        
        # Create a mock mongo object for the app
        class MockMongo:
            def __init__(self):
                self.db = temp_mongo.db
            def init_app(self, app):
                pass
        
        # Replace mongo with temp storage
        import models
        models.mongo = MockMongo()
        
        use_mongo = False
    
    # Initialize extensions
    CORS(app, origins=app.config['CORS_ORIGINS'])
    jwt = JWTManager(app)
    
    # Configure Cloudinary
    if app.config.get('CLOUDINARY_CLOUD_NAME'):
        from image_utils import configure_cloudinary
        configure_cloudinary(app)
    
    # Register blueprints
    from routes import api
    app.register_blueprint(api)
    
    # Create default admin
    from auth import create_default_admin
    create_default_admin(app)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization token is required'}), 401
    
    # Root endpoint
    @app.route('/')
    def index():
        storage_type = "MongoDB Atlas" if use_mongo else "Temporary Storage"
        return jsonify({
            'message': 'Rental System API',
            'version': '1.0',
            'database': storage_type,
            'endpoints': {
                'admin_login': '/api/admin/login',
                'houses': '/api/houses',
                'admin_houses': '/api/admin/houses',
                'admin_stats': '/api/admin/stats'
            }
        })
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        storage_type = "MongoDB Atlas" if use_mongo else "Temporary Storage"
        return jsonify({
            'status': 'healthy', 
            'message': 'API is running',
            'database': f'{storage_type} connected'
        }), 200
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    # Create uploads directory if it doesn't exist
    upload_dir = app.config.get('UPLOAD_FOLDER', 'uploads/')
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    
    print("="*50)
    print("RENTAL SYSTEM API STARTING (FALLBACK MODE)")
    print("="*50)
    print(f"Environment: {app.config.get('FLASK_ENV', 'development')}")
    print(f"Admin Email: {app.config.get('ADMIN_EMAIL')}")
    print("="*50)
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=app.config.get('DEBUG', False)
    )
