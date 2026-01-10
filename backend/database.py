import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from backend.models import Village

async def init_db():
    # Use standard MongoDB connection string
    # Default to localhost if not set
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    
    # Define database name
    db_name = os.getenv("MONGODB_DB_NAME", "indest_db")
    db = client[db_name]
    
    # Initialize Beanie with the Village document model
    await init_beanie(database=db, document_models=[Village])
