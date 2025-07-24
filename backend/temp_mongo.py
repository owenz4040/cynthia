"""
Temporary in-memory data store for testing without MongoDB.
This allows the app to run while we fix the MongoDB connection.
"""

from datetime import datetime
import bcrypt
import json

# In-memory storage
_data_store = {
    'admins': [],
    'houses': [],
    'customers': [],
    'bookings': []
}

class TempMongo:
    """Temporary MongoDB replacement for testing."""
    
    def __init__(self):
        self.db = self
        
    def command(self, cmd):
        """Mock MongoDB command."""
        if cmd == 'ping':
            return {'ok': 1}
        return {'ok': 1}
    
    @property
    def admins(self):
        return TempCollection('admins')
    
    @property
    def houses(self):
        return TempCollection('houses')
    
    @property
    def customers(self):
        return TempCollection('customers')
    
    @property
    def bookings(self):
        return TempCollection('bookings')

class TempCollection:
    """Temporary collection replacement."""
    
    def __init__(self, name):
        self.name = name
    
    def find_one(self, query):
        """Find one document."""
        for item in _data_store[self.name]:
            if self._matches_query(item, query):
                return item
        return None
    
    def find(self, query=None):
        """Find documents."""
        if query is None:
            return _data_store[self.name]
        return [item for item in _data_store[self.name] if self._matches_query(item, query)]
    
    def insert_one(self, document):
        """Insert one document."""
        document['_id'] = f"temp_{len(_data_store[self.name])}"
        document['created_at'] = datetime.utcnow()
        _data_store[self.name].append(document)
        return type('InsertResult', (), {'inserted_id': document['_id']})()
    
    def update_one(self, query, update):
        """Update one document."""
        for item in _data_store[self.name]:
            if self._matches_query(item, query):
                if '$set' in update:
                    item.update(update['$set'])
                item['updated_at'] = datetime.utcnow()
                return type('UpdateResult', (), {'modified_count': 1})()
        return type('UpdateResult', (), {'modified_count': 0})()
    
    def delete_one(self, query):
        """Delete one document."""
        for i, item in enumerate(_data_store[self.name]):
            if self._matches_query(item, query):
                del _data_store[self.name][i]
                return type('DeleteResult', (), {'deleted_count': 1})()
        return type('DeleteResult', (), {'deleted_count': 0})()
    
    def count_documents(self, query=None):
        """Count documents."""
        if query is None:
            return len(_data_store[self.name])
        return len([item for item in _data_store[self.name] if self._matches_query(item, query)])
    
    def _matches_query(self, item, query):
        """Simple query matching."""
        for key, value in query.items():
            if key not in item or item[key] != value:
                return False
        return True

# Create temporary mongo instance
temp_mongo = TempMongo()

# Initialize with default admin
def init_temp_data():
    """Initialize temporary data with default admin."""
    if not _data_store['admins']:
        admin_data = {
            '_id': 'temp_admin_1',
            'email': 'admin@rentalsystem.com',
            'password_hash': bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            'created_at': datetime.utcnow()
        }
        _data_store['admins'].append(admin_data)
        print("✅ Temporary admin created: admin@rentalsystem.com / admin123")

init_temp_data()
