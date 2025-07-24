import os
import cloudinary
import cloudinary.uploader
from werkzeug.utils import secure_filename
import io

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    """Check if the file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def configure_cloudinary(app):
    """Configure Cloudinary with app settings."""
    cloudinary.config(
        cloud_name=app.config.get('CLOUDINARY_CLOUD_NAME'),
        api_key=app.config.get('CLOUDINARY_API_KEY'),
        api_secret=app.config.get('CLOUDINARY_API_SECRET')
    )

def upload_image_to_cloudinary(file, folder="rental_houses"):
    """Upload image to Cloudinary and return URL and public_id."""
    try:
        # Reset file pointer to beginning
        file.seek(0)
        
        # Upload to Cloudinary with transformation for optimization
        result = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type="image",
            format="jpg",
            quality="auto:good",
            fetch_format="auto",
            transformation=[
                {"width": 1920, "height": 1080, "crop": "limit"},
                {"quality": "auto:good"}
            ]
        )
        
        return {
            'url': result.get('secure_url'),
            'public_id': result.get('public_id')
        }
    
    except Exception as e:
        print(f"Error uploading image to Cloudinary: {str(e)}")
        return None

def delete_image_from_cloudinary(public_id):
    """Delete image from Cloudinary."""
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get('result') == 'ok'
    except Exception as e:
        print(f"Error deleting image from Cloudinary: {str(e)}")
        return False

def save_image_locally(file, upload_folder):
    """Save image locally as fallback."""
    try:
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        filename = secure_filename(file.filename)
        
        # Generate unique filename
        name, ext = os.path.splitext(filename)
        counter = 1
        while os.path.exists(os.path.join(upload_folder, filename)):
            filename = f"{name}_{counter}{ext}"
            counter += 1
        
        file_path = os.path.join(upload_folder, filename)
        
        # Reset file pointer and save directly (no resizing without Pillow)
        file.seek(0)
        file.save(file_path)
        
        return filename
    
    except Exception as e:
        print(f"Error saving image locally: {str(e)}")
        return None
