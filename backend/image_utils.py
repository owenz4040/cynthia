import os
import cloudinary
import cloudinary.uploader
from werkzeug.utils import secure_filename
from PIL import Image
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
        # Resize image if too large
        image = Image.open(file)
        
        # Convert to RGB if necessary (for PNG with transparency)
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
        
        # Resize if image is too large (max 1920x1080)
        max_size = (1920, 1080)
        if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save resized image to bytes
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG', quality=85)
        img_byte_arr.seek(0)
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            img_byte_arr,
            folder=folder,
            resource_type="image",
            format="jpg"
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
        
        # Resize and save image
        image = Image.open(file)
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
        
        max_size = (1920, 1080)
        if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        image.save(file_path, 'JPEG', quality=85)
        
        return filename
    
    except Exception as e:
        print(f"Error saving image locally: {str(e)}")
        return None
