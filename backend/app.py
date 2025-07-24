from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config
from models import mongo
from routes import api
from auth import create_default_admin
from image_utils import configure_cloudinary
import os

def create_app(config_name=None):
    """Application factory pattern."""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    mongo.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])
    jwt = JWTManager(app)
    
    # Configure Cloudinary
    if app.config.get('CLOUDINARY_CLOUD_NAME'):
        configure_cloudinary(app)
    
    # Register blueprints
    app.register_blueprint(api)
    
    # Create default admin within app context
    with app.app_context():
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
        return jsonify({
            'message': 'Rental System API',
            'version': '1.0',
            'database': 'MongoDB',
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
        try:
            # Test MongoDB connection
            mongo.db.command('ping')
            return jsonify({
                'status': 'healthy', 
                'message': 'API is running',
                'database': 'MongoDB connected'
            }), 200
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'message': 'Database connection failed',
                'error': str(e)
            }), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    # Create uploads directory if it doesn't exist
    upload_dir = app.config.get('UPLOAD_FOLDER', 'uploads/')
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    
    print("="*50)
    print("RENTAL SYSTEM API STARTING")
    print("="*50)
    print(f"Environment: {app.config.get('FLASK_ENV', 'development')}")
    print(f"Admin Email: {app.config.get('ADMIN_EMAIL')}")
    print(f"Database: MongoDB")
    print(f"MongoDB URI: {app.config.get('MONGODB_URI')}")
    print(f"Database Name: {app.config.get('DATABASE_NAME')}")
    print(f"Cloudinary: {app.config.get('CLOUDINARY_CLOUD_NAME')}")
    print("="*50)
    
    # Use PORT environment variable for deployment platforms like Render
    port = int(os.environ.get('PORT', 5000))
    app.run(
        host='0.0.0.0',
        port=port,
        debug=app.config.get('DEBUG', False)
    )
