"""
Enhanced database connection and operations.
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional, List, Dict, Any
from config.settings import settings
from config.logging_config import get_logger
import asyncio

logger = get_logger(__name__)


class DatabaseManager:
    """Manages database connections and operations."""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.database: Optional[AsyncIOMotorDatabase] = None
        
    async def connect(self):
        """Establish database connection."""
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                maxPoolSize=10,
                minPoolSize=1,
                maxIdleTimeMS=30000,
                waitQueueMultiple=10,
                serverSelectionTimeoutMS=5000
            )
            
            # Test the connection
            await self.client.admin.command('ping')
            self.database = self.client[settings.DATABASE_NAME]
            
            # Create indexes for better performance
            await self._create_indexes()
            
            logger.info(f"Successfully connected to MongoDB: {settings.DATABASE_NAME}")
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    async def disconnect(self):
        """Close database connection."""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def _create_indexes(self):
        """Create database indexes for better performance."""
        try:
            # Index for grids collection
            await self.database.grids.create_index("timestamp")
            await self.database.grids.create_index("image_id")
            
            # Index for images collection
            await self.database.images.create_index("timestamp")
            await self.database.images.create_index("filename")
            
            # Index for products collection
            await self.database.products.create_index("grid_id")
            await self.database.products.create_index("product_id")
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.warning(f"Failed to create some database indexes: {e}")
    
    def get_collection(self, collection_name: str):
        """Get a database collection."""
        if not self.database:
            raise RuntimeError("Database not connected")
        return self.database[collection_name]


# Global database manager instance
db_manager = DatabaseManager()


async def get_database() -> AsyncIOMotorDatabase:
    """Get database instance for dependency injection."""
    if db_manager.database is None:
        raise RuntimeError("Database not connected. Application may not have started properly.")
    return db_manager.database


# Convenience properties for backward compatibility
@property
def db():
    """Get database instance (for backward compatibility)."""
    if db_manager.database is None:
        # This is a synchronous property, so we can't await here
        # The connection should be established during startup
        raise RuntimeError("Database not connected. Call await db_manager.connect() first.")
    return db_manager.database