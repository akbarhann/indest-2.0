import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from backend.models import Village
from dotenv import load_dotenv

async def check_db():
    # Load .env explicitly from backend directory
    env_path = os.path.join(os.getcwd(), "backend", ".env")
    load_dotenv(env_path)
    
    print("Connecting to DB...")
    # Use standard MongoDB connection string
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "indest_db")
    
    print(f"DB Name: {db_name}")
    safe_url = mongo_url.split("@")[-1] if "@" in mongo_url else mongo_url
    print(f"Target Host (Masked): {safe_url}")

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    # List Databases
    dbs = await client.list_database_names()
    print(f"\n--- Scanning Cluster ---")
    print(f"Available Databases: {dbs}")
    
    found_data = False
    
    for db_name_iter in dbs:
        if db_name_iter in ['admin', 'local', 'config']:
            continue
            
        current_db = client[db_name_iter]
        cols = await current_db.list_collection_names()
        
        print(f"\nScanning DB: '{db_name_iter}'")
        for col_name in cols:
            count = await current_db[col_name].count_documents({})
            print(f"  - Collection '{col_name}': {count} documents")
            if count > 400:
                print(f"    !!! FOUND CANDIDATE: {db_name_iter}.{col_name} has {count} docs !!!")
                found_data = True

    print("\n--- Current Configuration Check ---")
    # Initialize Beanie with the Village document model
    await init_beanie(database=db, document_models=[Village])
    
    count = await Village.count()
    print(f"Current Config ({db_name}.villages): {count} villages")
    
    if count > 0:
        v = await Village.find_one()
        print(f"Sample Village: {v.name} ({v.id})")
        print(f"Has AI Analysis: {bool(v.ai_analysis)}")

if __name__ == "__main__":
    asyncio.run(check_db())
