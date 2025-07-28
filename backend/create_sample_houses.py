from models import HouseModel, mongo
from datetime import datetime
import uuid

# Sample houses with proper Cloudinary image structure
sample_houses = [
    {
        'name': 'Modern Downtown Apartment',
        'description': 'Beautiful modern apartment in the heart of downtown.',
        'bedrooms': 2,
        'bathrooms': 1,
        'price_per_month': 120,
        'location': 'Downtown',
        'amenities': ['WiFi', 'Air Conditioning', 'Kitchen', 'TV'],
        'is_available': True,
        'images': [
            {
                'id': str(uuid.uuid4()),
                'image_url': 'https://res.cloudinary.com/dyltquwth/image/upload/v1/sample',
                'public_id': 'sample',
                'is_primary': True
            },
            {
                'id': str(uuid.uuid4()),
                'image_url': 'https://res.cloudinary.com/dyltquwth/image/upload/c_fill,w_400,h_300/sample',
                'public_id': 'sample_transformed',
                'is_primary': False
            }
        ],
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    },
    {
        'name': 'Cozy Beach House',
        'description': 'Relaxing beach house with ocean views.',
        'bedrooms': 3,
        'bathrooms': 2,
        'price_per_month': 180,
        'location': 'Beach Front',
        'amenities': ['WiFi', 'Ocean View', 'Kitchen', 'Parking'],
        'is_available': True,
        'images': [
            {
                'id': str(uuid.uuid4()),
                'image_url': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop',
                'public_id': 'unsplash_house_1',
                'is_primary': True
            }
        ],
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    },
    {
        'name': 'Urban Studio Loft',
        'description': 'Stylish studio loft in trendy neighborhood.',
        'bedrooms': 1,
        'bathrooms': 1,
        'price_per_month': 85,
        'location': 'Arts District',
        'amenities': ['WiFi', 'Modern Design', 'Kitchen', 'Workspace'],
        'is_available': True,
        'images': [
            {
                'id': str(uuid.uuid4()),
                'image_url': 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop',
                'public_id': 'unsplash_house_2',
                'is_primary': True
            }
        ],
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
]

# Insert sample houses
try:
    for house in sample_houses:
        result = mongo.db.houses.insert_one(house)
        print(f"Created house: {house['name']} (ID: {result.inserted_id})")
    
    print(f"\n✅ Successfully created {len(sample_houses)} sample houses")
    
    # Verify the houses were created
    total_houses = mongo.db.houses.count_documents({})
    print(f"📊 Total houses in database: {total_houses}")
    
except Exception as e:
    print(f"❌ Error creating sample houses: {e}")
