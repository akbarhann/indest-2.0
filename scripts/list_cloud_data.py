import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def list_data():
    # Load .env explicitly
    env_path = os.path.join(os.getcwd(), "backend", ".env")
    load_dotenv(env_path)
    
    mongo_url = os.getenv("MONGODB_URL")
    if not mongo_url:
        print("Error: MONGODB_URL not found in env")
        return

    print(f"Connecting to: {mongo_url.split('@')[-1]}")
    client = AsyncIOMotorClient(mongo_url)
    
    try:
        dbs = await client.list_database_names()
        print(f"Databases: {dbs}")
        
        target_db = "indest_db"
        if target_db in dbs:
             print(f"\nFOUND {target_db}!")
             db = client[target_db]
             cols = await db.list_collection_names()
             print(f"Collections: {cols}")
             for col in cols:
                count = await db[col].count_documents({})
                print(f"  - {col}: {count}")
        else:
             print(f"\n{target_db} NOT FOUND in cluster.")
             
             # Search for any DB with 400+ docs in any collection
             print("Searching for candidate database...")
             for db_name in dbs:
                if db_name in ['admin', 'local', 'config', 'sample_mflix']: continue
                db = client[db_name]
                cols = await db.list_collection_names()
                print(f"Checking {db_name}...")
                for col in cols:
                    count = await db[col].count_documents({})
                    print(f"  {db_name}.{col}: {count}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(list_data())
