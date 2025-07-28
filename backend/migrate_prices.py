#!/usr/bin/env python3
"""
Migration script to convert price_per_night to price_per_month in existing houses.
This script should be run once after deploying the new price structure.
"""

import os
import sys
from pymongo import MongoClient
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import Config

def migrate_house_prices():
    """Migrate price_per_night to price_per_month in all house records."""
    try:
        # Connect to MongoDB
        client = MongoClient(Config.MONGO_URI)
        db = client.get_default_database()
        houses_collection = db.houses
        
        print("🔄 Starting price migration...")
        
        # Find all houses with price_per_night but no price_per_month
        houses_to_migrate = houses_collection.find({
            "price_per_night": {"$exists": True},
            "price_per_month": {"$exists": False}
        })
        
        migrated_count = 0
        
        for house in houses_to_migrate:
            try:
                house_id = house['_id']
                old_price = house.get('price_per_night', 0)
                new_price = old_price * 30  # Convert daily to monthly
                
                # Update the house record
                result = houses_collection.update_one(
                    {"_id": house_id},
                    {
                        "$set": {
                            "price_per_month": new_price,
                            "updated_at": datetime.utcnow()
                        },
                        "$unset": {
                            "price_per_night": ""  # Remove old field
                        }
                    }
                )
                
                if result.modified_count > 0:
                    migrated_count += 1
                    print(f"✅ Migrated house '{house.get('name', 'Unknown')}': KSh {old_price}/night → KSh {new_price}/month")
                
            except Exception as e:
                print(f"❌ Error migrating house {house.get('name', 'Unknown')}: {str(e)}")
        
        print(f"\n🎉 Migration completed! Migrated {migrated_count} houses.")
        
        # Verify migration
        remaining_old_format = houses_collection.count_documents({
            "price_per_night": {"$exists": True}
        })
        
        new_format_count = houses_collection.count_documents({
            "price_per_month": {"$exists": True}
        })
        
        print(f"📊 Verification:")
        print(f"   - Houses with old format (price_per_night): {remaining_old_format}")
        print(f"   - Houses with new format (price_per_month): {new_format_count}")
        
        client.close()
        
    except Exception as e:
        print(f"💥 Migration failed: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    print("🏠 House Price Migration Script")
    print("=" * 40)
    
    success = migrate_house_prices()
    
    if success:
        print("\n✨ Migration completed successfully!")
    else:
        print("\n💔 Migration failed!")
        sys.exit(1)
