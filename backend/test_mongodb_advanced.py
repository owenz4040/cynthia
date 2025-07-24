#!/usr/bin/env python3
"""Advanced MongoDB connection test with multiple connection options."""

import os
from dotenv import load_dotenv
from pymongo import MongoClient
import urllib.parse

# Load environment variables
load_dotenv()

def test_connection_variations():
    """Test different MongoDB connection string variations."""
    
    # Original connection string
    original_uri = "mongodb+srv://owenzcolin:owenzcolin@cluster0.vwthypp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    
    # Connection string variations to try
    variations = [
        # With database name
        "mongodb+srv://owenzcolin:owenzcolin@cluster0.vwthypp.mongodb.net/rental_system?retryWrites=true&w=majority",
        
        # URL encoded credentials (in case of special characters)
        f"mongodb+srv://{urllib.parse.quote('owenzcolin')}:{urllib.parse.quote('owenzcolin')}@cluster0.vwthypp.mongodb.net/rental_system?retryWrites=true&w=majority",
        
        # Without app name
        "mongodb+srv://owenzcolin:owenzcolin@cluster0.vwthypp.mongodb.net/rental_system?retryWrites=true&w=majority",
        
        # Simplified version
        "mongodb+srv://owenzcolin:owenzcolin@cluster0.vwthypp.mongodb.net/rental_system",
        
        # Original
        original_uri
    ]
    
    for i, uri in enumerate(variations, 1):
        print(f"\n🔗 Testing variation {i}:")
        print(f"   URI: {uri[:60]}...")
        
        try:
            client = MongoClient(uri, serverSelectionTimeoutMS=5000)
            client.admin.command('ping')
            print(f"   ✅ Connection successful!")
            
            # Test database access
            db = client.rental_system
            collections = db.list_collection_names()
            print(f"   📊 Collections: {collections}")
            
            client.close()
            return uri  # Return the working URI
            
        except Exception as e:
            print(f"   ❌ Failed: {str(e)}")
    
    return None

def create_simple_test_data(working_uri):
    """Create simple test data if connection works."""
    try:
        client = MongoClient(working_uri)
        db = client.rental_system
        
        # Test creating a simple document
        test_collection = db.test
        result = test_collection.insert_one({"test": "connection", "timestamp": "2025-07-23"})
        print(f"✅ Test document created with ID: {result.inserted_id}")
        
        # Clean up test document
        test_collection.delete_one({"_id": result.inserted_id})
        print("✅ Test document cleaned up")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Test data creation failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Advanced MongoDB Connection Test")
    print("=" * 60)
    
    working_uri = test_connection_variations()
    
    if working_uri:
        print(f"\n🎉 Found working connection!")
        print(f"✅ Working URI: {working_uri}")
        
        # Update .env file with working URI
        env_content = []
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('MONGODB_URI='):
                    env_content.append(f'MONGODB_URI={working_uri}\n')
                else:
                    env_content.append(line)
        
        with open('.env', 'w') as f:
            f.writelines(env_content)
        
        print("✅ Updated .env file with working URI")
        
        # Test data operations
        if create_simple_test_data(working_uri):
            print("✅ Database operations work correctly!")
        
    else:
        print("\n❌ No working connection found!")
        print("\n🔧 Troubleshooting suggestions:")
        print("1. Check if your MongoDB Atlas cluster is running")
        print("2. Verify your username and password")
        print("3. Check if your IP address is whitelisted")
        print("4. Try resetting your MongoDB Atlas password")
        print("5. Check if the cluster name is correct")
