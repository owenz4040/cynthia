from flask_pymongo import PyMongo
from datetime import datetime, timedelta
import bcrypt
from bson import ObjectId
import json
import random
import string

mongo = PyMongo()

class UserModel:
    """User model for customer registration and authentication."""
    
    @staticmethod
    def create_user(name, email, age, gender, password, profile_image=None):
        """Create a new user."""
        user_data = {
            'name': name,
            'email': email,
            'age': age,
            'gender': gender,
            'password_hash': UserModel.hash_password(password),
            'profile_image': profile_image,
            'is_verified': False,
            'terms_accepted': False,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = mongo.db.users.insert_one(user_data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_by_email(email):
        """Find user by email."""
        return mongo.db.users.find_one({'email': email})
    
    @staticmethod
    def find_by_id(user_id):
        """Find user by ID."""
        return mongo.db.users.find_one({'_id': ObjectId(user_id)})
    
    @staticmethod
    def update_user(user_id, update_data):
        """Update user data."""
        update_data['updated_at'] = datetime.utcnow()
        result = mongo.db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    def verify_user(user_id):
        """Mark user as verified."""
        result = mongo.db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'is_verified': True, 'updated_at': datetime.utcnow()}}
        )
        return result.modified_count > 0
    
    @staticmethod
    def accept_terms(user_id):
        """Mark terms as accepted."""
        result = mongo.db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'terms_accepted': True, 'updated_at': datetime.utcnow()}}
        )
        return result.modified_count > 0
    
    @staticmethod
    def hash_password(password):
        """Hash password with bcrypt."""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    @staticmethod
    def check_password(password, password_hash):
        """Check password against hash."""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

class OTPModel:
    """OTP model for email verification."""
    
    @staticmethod
    def generate_otp():
        """Generate a 6-digit OTP."""
        return ''.join(random.choices(string.digits, k=6))
    
    @staticmethod
    def create_otp(email, otp_type='email_verification'):
        """Create and store OTP for email verification."""
        otp_code = OTPModel.generate_otp()
        otp_data = {
            'email': email,
            'otp_code': otp_code,
            'otp_type': otp_type,
            'created_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + timedelta(minutes=10),  # OTP expires in 10 minutes
            'is_used': False
        }
        
        # Remove any existing OTPs for this email
        mongo.db.otps.delete_many({'email': email, 'otp_type': otp_type})
        
        result = mongo.db.otps.insert_one(otp_data)
        return otp_code
    
    @staticmethod
    def verify_otp(email, otp_code, otp_type='email_verification'):
        """Verify OTP code."""
        otp_record = mongo.db.otps.find_one({
            'email': email,
            'otp_code': otp_code,
            'otp_type': otp_type,
            'is_used': False,
            'expires_at': {'$gt': datetime.utcnow()}
        })
        
        if otp_record:
            # Mark OTP as used
            mongo.db.otps.update_one(
                {'_id': otp_record['_id']},
                {'$set': {'is_used': True}}
            )
            return True
        return False
    
    @staticmethod
    def cleanup_expired_otps():
        """Remove expired OTPs."""
        mongo.db.otps.delete_many({'expires_at': {'$lt': datetime.utcnow()}})

class AdminModel:
    """Admin model for system administrators."""
    
    @staticmethod
    def create_admin(email, password):
        """Create a new admin."""
        admin_data = {
            'email': email,
            'password_hash': AdminModel.hash_password(password),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = mongo.db.admins.insert_one(admin_data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_by_email(email):
        """Find admin by email."""
        return mongo.db.admins.find_one({'email': email})
    
    @staticmethod
    def find_by_id(admin_id):
        """Find admin by ID."""
        return mongo.db.admins.find_one({'_id': ObjectId(admin_id)})
    
    @staticmethod
    def hash_password(password):
        """Hash password."""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    @staticmethod
    def check_password(password, password_hash):
        """Check if password matches hash."""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    
    @staticmethod
    def to_dict(admin):
        """Convert admin document to dictionary."""
        if not admin:
            return None
        return {
            'id': str(admin['_id']),
            'email': admin['email'],
            'created_at': admin['created_at'].isoformat(),
            'updated_at': admin['updated_at'].isoformat()
        }

class HouseModel:
    """House model for rental properties."""
    
    @staticmethod
    def create_house(data):
        """Create a new house."""
        house_data = {
            'name': data['name'],
            'description': data.get('description', ''),
            'bedrooms': int(data['bedrooms']),
            'bathrooms': int(data.get('bathrooms', 1)),
            'price_per_night': float(data['price_per_night']),
            'location': data.get('location', ''),
            'amenities': data.get('amenities', []),
            'is_available': data.get('is_available', True),
            'images': [],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = mongo.db.houses.insert_one(house_data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_all(page=1, per_page=10):
        """Find all houses with pagination."""
        skip = (page - 1) * per_page
        houses = list(mongo.db.houses.find().skip(skip).limit(per_page))
        total = mongo.db.houses.count_documents({})
        return houses, total
    
    @staticmethod
    def find_by_id(house_id):
        """Find house by ID."""
        return mongo.db.houses.find_one({'_id': ObjectId(house_id)})
    
    @staticmethod
    def update_house(house_id, data):
        """Update house."""
        update_data = {'updated_at': datetime.utcnow()}
        
        if 'name' in data:
            update_data['name'] = data['name']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'bedrooms' in data:
            update_data['bedrooms'] = int(data['bedrooms'])
        if 'bathrooms' in data:
            update_data['bathrooms'] = int(data['bathrooms'])
        if 'price_per_night' in data:
            update_data['price_per_night'] = float(data['price_per_night'])
        if 'location' in data:
            update_data['location'] = data['location']
        if 'amenities' in data:
            update_data['amenities'] = data['amenities']
        if 'is_available' in data:
            update_data['is_available'] = data['is_available']
        
        result = mongo.db.houses.update_one(
            {'_id': ObjectId(house_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    def delete_house(house_id):
        """Delete house."""
        result = mongo.db.houses.delete_one({'_id': ObjectId(house_id)})
        return result.deleted_count > 0
    
    @staticmethod
    def add_image(house_id, image_data):
        """Add image to house."""
        image_data['created_at'] = datetime.utcnow()
        result = mongo.db.houses.update_one(
            {'_id': ObjectId(house_id)},
            {'$push': {'images': image_data}}
        )
        return result.modified_count > 0
    
    @staticmethod
    def remove_image(house_id, image_id):
        """Remove image from house."""
        result = mongo.db.houses.update_one(
            {'_id': ObjectId(house_id)},
            {'$pull': {'images': {'id': image_id}}}
        )
        return result.modified_count > 0
    
    @staticmethod
    def count_total():
        """Count total houses."""
        return mongo.db.houses.count_documents({})
    
    @staticmethod
    def count_available():
        """Count available houses."""
        return mongo.db.houses.count_documents({'is_available': True})
    
    @staticmethod
    def to_dict(house):
        """Convert house document to dictionary."""
        if not house:
            return None
        return {
            'id': str(house['_id']),
            'name': house['name'],
            'description': house.get('description', ''),
            'bedrooms': house['bedrooms'],
            'bathrooms': house['bathrooms'],
            'price_per_night': house['price_per_night'],
            'location': house.get('location', ''),
            'amenities': house.get('amenities', []),
            'is_available': house.get('is_available', True),
            'images': house.get('images', []),
            'created_at': house['created_at'].isoformat(),
            'updated_at': house['updated_at'].isoformat()
        }

class CustomerModel:
    """Customer model for people booking houses."""
    
    @staticmethod
    def create_customer(data):
        """Create a new customer."""
        customer_data = {
            'name': data['name'],
            'email': data['email'],
            'phone': data.get('phone', ''),
            'created_at': datetime.utcnow()
        }
        result = mongo.db.customers.insert_one(customer_data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_by_email(email):
        """Find customer by email."""
        return mongo.db.customers.find_one({'email': email})
    
    @staticmethod
    def find_by_id(customer_id):
        """Find customer by ID."""
        return mongo.db.customers.find_one({'_id': ObjectId(customer_id)})
    
    @staticmethod
    def to_dict(customer):
        """Convert customer document to dictionary."""
        if not customer:
            return None
        return {
            'id': str(customer['_id']),
            'name': customer['name'],
            'email': customer['email'],
            'phone': customer.get('phone', ''),
            'created_at': customer['created_at'].isoformat()
        }

class BookingModel:
    """Booking model for house reservations."""
    
    @staticmethod
    def create_booking(data):
        """Create a new booking."""
        booking_data = {
            'house_id': ObjectId(data['house_id']),
            'customer_id': ObjectId(data['customer_id']),
            'check_in_date': data['check_in_date'],
            'check_out_date': data['check_out_date'],
            'total_price': float(data['total_price']),
            'guests_count': int(data.get('guests_count', 1)),
            'status': data.get('status', 'pending'),
            'special_requests': data.get('special_requests', ''),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = mongo.db.bookings.insert_one(booking_data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_all():
        """Find all bookings."""
        return list(mongo.db.bookings.find())
    
    @staticmethod
    def find_by_id(booking_id):
        """Find booking by ID."""
        return mongo.db.bookings.find_one({'_id': ObjectId(booking_id)})
    
    @staticmethod
    def to_dict(booking):
        """Convert booking document to dictionary."""
        if not booking:
            return None
        return {
            'id': str(booking['_id']),
            'house_id': str(booking['house_id']),
            'customer_id': str(booking['customer_id']),
            'check_in_date': booking['check_in_date'].isoformat() if isinstance(booking['check_in_date'], datetime) else booking['check_in_date'],
            'check_out_date': booking['check_out_date'].isoformat() if isinstance(booking['check_out_date'], datetime) else booking['check_out_date'],
            'total_price': booking['total_price'],
            'guests_count': booking['guests_count'],
            'status': booking['status'],
            'special_requests': booking.get('special_requests', ''),
            'created_at': booking['created_at'].isoformat(),
            'updated_at': booking['updated_at'].isoformat()
        }

class BookingModel:
    """Model for handling property bookings and site reviews."""
    
    @staticmethod
    def create_booking(user_id, house_id, preferred_date, preferred_time, special_requests=None):
        """Create a new booking request."""
        booking_data = {
            'user_id': ObjectId(user_id),
            'house_id': ObjectId(house_id),
            'preferred_date': preferred_date,
            'preferred_time': preferred_time,
            'special_requests': special_requests or '',
            'status': 'pending',  # pending, approved, rejected, completed, cancelled
            'admin_notes': '',
            'confirmed_date': None,
            'confirmed_time': None,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = mongo.db.bookings.insert_one(booking_data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_by_id(booking_id):
        """Find booking by ID."""
        return mongo.db.bookings.find_one({'_id': ObjectId(booking_id)})
    
    @staticmethod
    def find_by_user(user_id, page=1, per_page=10, status=None):
        """Find bookings by user ID with pagination and optional status filter."""
        skip = (page - 1) * per_page
        
        # Build match filter
        match_filter = {'user_id': ObjectId(user_id)}
        if status:
            match_filter['status'] = status
        
        pipeline = [
            {'$match': match_filter},
            {'$lookup': {
                'from': 'houses',
                'localField': 'house_id',
                'foreignField': '_id',
                'as': 'house'
            }},
            {'$unwind': '$house'},
            {'$sort': {'created_at': -1}},
            {'$skip': skip},
            {'$limit': per_page}
        ]
        
        bookings = list(mongo.db.bookings.aggregate(pipeline))
        total = mongo.db.bookings.count_documents(match_filter)
        
        return bookings, total
    
    @staticmethod
    def find_all_bookings(page=1, per_page=10, status=None):
        """Find all bookings for admin with optional status filter."""
        skip = (page - 1) * per_page
        match_filter = {}
        
        if status:
            match_filter['status'] = status
        
        pipeline = [
            {'$match': match_filter},
            {'$lookup': {
                'from': 'houses',
                'localField': 'house_id',
                'foreignField': '_id',
                'as': 'house'
            }},
            {'$unwind': '$house'},
            {'$lookup': {
                'from': 'users',
                'localField': 'user_id',
                'foreignField': '_id',
                'as': 'user'
            }},
            {'$unwind': '$user'},
            {'$sort': {'created_at': -1}},
            {'$skip': skip},
            {'$limit': per_page}
        ]
        
        bookings = list(mongo.db.bookings.aggregate(pipeline))
        total = mongo.db.bookings.count_documents(match_filter)
        
        return bookings, total
    
    @staticmethod
    def update_booking_status(booking_id, status, admin_notes='', confirmed_date=None, confirmed_time=None):
        """Update booking status and details."""
        update_data = {
            'status': status,
            'admin_notes': admin_notes,
            'updated_at': datetime.utcnow()
        }
        
        if confirmed_date:
            update_data['confirmed_date'] = confirmed_date
        if confirmed_time:
            update_data['confirmed_time'] = confirmed_time
        
        result = mongo.db.bookings.update_one(
            {'_id': ObjectId(booking_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    def get_booking_stats():
        """Get booking statistics for admin dashboard."""
        pipeline = [
            {
                '$group': {
                    '_id': '$status',
                    'count': {'$sum': 1}
                }
            }
        ]
        
        stats = list(mongo.db.bookings.aggregate(pipeline))
        result = {
            'pending': 0,
            'approved': 0,
            'rejected': 0,
            'completed': 0,
            'cancelled': 0,
            'total': 0
        }
        
        for stat in stats:
            result[stat['_id']] = stat['count']
            result['total'] += stat['count']
        
        return result
    
    @staticmethod
    def delete_booking(booking_id):
        """Delete a booking by ID."""
        try:
            result = mongo.db.bookings.delete_one({'_id': ObjectId(booking_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting booking: {str(e)}")
            return False
    
    @staticmethod
    def to_dict(booking):
        """Convert booking document to dictionary."""
        return {
            'id': str(booking['_id']),
            'user_id': str(booking['user_id']),
            'house_id': str(booking['house_id']),
            'preferred_date': booking['preferred_date'],
            'preferred_time': booking['preferred_time'],
            'confirmed_date': booking.get('confirmed_date'),
            'confirmed_time': booking.get('confirmed_time'),
            'status': booking['status'],
            'special_requests': booking.get('special_requests', ''),
            'admin_notes': booking.get('admin_notes', ''),
            'created_at': booking['created_at'].isoformat(),
            'updated_at': booking['updated_at'].isoformat()
        }
