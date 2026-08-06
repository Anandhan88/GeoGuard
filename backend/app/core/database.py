"""
GeoGuard AI - Database Configuration (MongoDB Atlas / Motor & Beanie)
Provides asynchronous connection to MongoDB Atlas and initializes Beanie Document models.
"""
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.models import all_models

logger = logging.getLogger("geoguard.db")

client: AsyncIOMotorClient = None


async def init_db():
    """Initializes connection to MongoDB Atlas / Motor and configures Beanie document models."""
    global client
    logger.info(f"Connecting to MongoDB Atlas at {settings.MONGODB_URL.split('@')[-1]}...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    await init_beanie(database=db, document_models=all_models)
    logger.info(f"Successfully initialized Beanie ODM for MongoDB Atlas database: {settings.MONGODB_DB_NAME}")


async def get_db():
    """Dependency injection placeholder for MongoDB database instance."""
    if client is None:
        db = AsyncIOMotorClient(settings.MONGODB_URL)[settings.MONGODB_DB_NAME]
        yield db
    else:
        yield client[settings.MONGODB_DB_NAME]
