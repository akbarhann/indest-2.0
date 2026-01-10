import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

# Add parent dir
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models import Village
from scripts.import_csv_to_mongo import import_data
from scripts.inject_demo_data import inject_demo_data
from scripts.populate_all import populate_all_demo_data

async def reset_and_import():
    print("WARNING: This will delete all village data in the database!")
    
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.getenv("MONGODB_DB_NAME", "indest_db")
    db = client[db_name]
    await init_beanie(database=db, document_models=[Village])
    
    # 1. Clear Collection
    count = await Village.count()
    print(f"Deleting {count} existing villages...")
    await Village.delete_all()
    print("Database cleared.")
    
    # 2. Re-import CSV
    print("\n--- Importing CSV ---")
    await import_data()
    
    # 3. Inject Demo Data
    print("\n--- Injecting Demo AI Data ---")
    await inject_demo_data()
    
    # 4. Populate All
    print("\n--- Populating All AI Data ---")
    await populate_all_demo_data()
    
    print("\n\nSUCCESS: Database verification reset complete!")

if __name__ == "__main__":
    asyncio.run(reset_and_import())
