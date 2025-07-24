#!/usr/bin/env python3
"""Test MongoDB connection before starting the app."""

import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()

def test_mongodb_connection():
    """Test if MongoDB connection works."""
    try:
        # Get MongoDB URI from environment
        mongodb_uri = os.environ.get('MONGODB_URI')
        
        if not mongodb_uri:
            print("❌ MONGODB_URI not found in environment variables")
            return False
            
        print(f"🔗 Testing connection to: {mongodb_uri[:50]}...")
        
        # Create MongoDB client
        client = MongoClient(mongodb_uri)
        
        # Test connection with ping
        client.admin.command('ping')
        print("✅ MongoDB connection successful!")
        
        # Test database access
        db = client.rental_system
        collections = db.list_collection_names()
        print(f"📊 Available collections: {collections}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Testing MongoDB Connection...")
    print("=" * 50)
    
    if test_mongodb_connection():
        print("✅ MongoDB test passed! Ready to start the app.")
    else:
        print("❌ MongoDB test failed! Check your connection.")
        print("💡 Make sure your .env file has the correct MONGODB_URI")
