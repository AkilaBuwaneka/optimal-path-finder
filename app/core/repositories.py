"""
Repository pattern implementations for database operations.
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

from app.core.models import GridData, GridResponse, Product, Point
from config.logging_config import get_logger

logger = get_logger(__name__)


class BaseRepository(ABC):
    """Base repository with common operations."""
    
    def __init__(self, database: AsyncIOMotorDatabase, collection_name: str):
        self.db = database
        self.collection = database[collection_name]
    
    async def find_by_id(self, obj_id: str) -> Optional[Dict[str, Any]]:
        """Find document by ObjectId."""
        if not ObjectId.is_valid(obj_id):
            return None
        
        doc = await self.collection.find_one({"_id": ObjectId(obj_id)})
        if doc:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
        return doc
    
    async def delete_by_id(self, obj_id: str) -> bool:
        """Delete document by ObjectId."""
        if not ObjectId.is_valid(obj_id):
            return False
        
        result = await self.collection.delete_one({"_id": ObjectId(obj_id)})
        return result.deleted_count > 0


class GridRepository(BaseRepository):
    """Repository for grid operations."""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        super().__init__(database, "grids")
    
    async def create_grid(self, grid_data: GridData) -> GridResponse:
        """Create a new grid."""
        try:
            grid_doc = {
                "grid": grid_data.grid,
                "rows": grid_data.rows,
                "columns": grid_data.columns,
                "actual_width": grid_data.actual_width,
                "actual_length": grid_data.actual_length,
                "image_id": grid_data.image_id,
                "timestamp": datetime.utcnow()
            }
            
            result = await self.collection.insert_one(grid_doc)
            grid_doc["id"] = str(result.inserted_id)
            
            logger.info(f"Grid created with ID: {grid_doc['id']}")
            return GridResponse(**grid_doc)
            
        except Exception as e:
            logger.error(f"Failed to create grid: {e}")
            raise
    
    async def get_grid(self, grid_id: str) -> Optional[GridResponse]:
        """Get grid by ID."""
        try:
            doc = await self.find_by_id(grid_id)
            return GridResponse(**doc) if doc else None
            
        except Exception as e:
            logger.error(f"Failed to get grid {grid_id}: {e}")
            raise
    
    async def list_grids(self, limit: int = 100, offset: int = 0) -> List[GridResponse]:
        """List grids with pagination."""
        try:
            cursor = self.collection.find().sort("timestamp", -1).skip(offset).limit(limit)
            grids = []
            
            async for grid in cursor:
                grid["id"] = str(grid["_id"])
                del grid["_id"]
                grids.append(GridResponse(**grid))
            
            logger.info(f"Retrieved {len(grids)} grids")
            return grids
            
        except Exception as e:
            logger.error(f"Failed to list grids: {e}")
            raise
    
    async def update_grid(self, grid_id: str, grid_data: GridData) -> bool:
        """Update an existing grid."""
        try:
            if not ObjectId.is_valid(grid_id):
                return False
            
            update_doc = {
                "grid": grid_data.grid,
                "rows": grid_data.rows,
                "columns": grid_data.columns,
                "actual_width": grid_data.actual_width,
                "actual_length": grid_data.actual_length,
                "image_id": grid_data.image_id,
                "updated_at": datetime.utcnow()
            }
            
            result = await self.collection.update_one(
                {"_id": ObjectId(grid_id)},
                {"$set": update_doc}
            )
            
            success = result.matched_count > 0
            if success:
                logger.info(f"Grid {grid_id} updated successfully")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to update grid {grid_id}: {e}")
            raise


class ProductRepository(BaseRepository):
    """Repository for product operations."""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        super().__init__(database, "products")
    
    async def create_product(self, product: Product) -> str:
        """Create a new product."""
        try:
            # Check if product ID already exists
            existing = await self.collection.find_one({"product_id": product.product_id})
            if existing:
                raise ValueError("Product ID already exists")
            
            product_dict = product.dict()
            product_dict["created_at"] = datetime.utcnow()
            
            result = await self.collection.insert_one(product_dict)
            
            logger.info(f"Product created: {product.product_name} ({product.product_id})")
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Failed to create product: {e}")
            raise
    
    async def get_product_by_id(self, product_id: str) -> Optional[Product]:
        """Get product by product_id."""
        try:
            doc = await self.collection.find_one({"product_id": product_id})
            if doc:
                doc["id"] = str(doc["_id"])
                del doc["_id"]
                return Product(**doc)
            return None
            
        except Exception as e:
            logger.error(f"Failed to get product {product_id}: {e}")
            raise
    
    async def get_products_by_grid(self, grid_id: str) -> List[Product]:
        """Get all products for a specific grid."""
        try:
            cursor = self.collection.find({"grid_id": grid_id})
            products = []
            
            async for product in cursor:
                product["id"] = str(product["_id"])
                del product["_id"]
                products.append(Product(**product))
            
            logger.info(f"Retrieved {len(products)} products for grid {grid_id}")
            return products
            
        except Exception as e:
            logger.error(f"Failed to get products for grid {grid_id}: {e}")
            raise
    
    async def update_product(self, product_id: str, product: Product) -> bool:
        """Update an existing product."""
        try:
            update_doc = product.dict()
            update_doc["updated_at"] = datetime.utcnow()
            
            result = await self.collection.update_one(
                {"product_id": product_id},
                {"$set": update_doc}
            )
            
            success = result.matched_count > 0
            if success:
                logger.info(f"Product {product_id} updated successfully")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to update product {product_id}: {e}")
            raise
    
    async def delete_product(self, product_id: str) -> bool:
        """Delete product by product_id."""
        try:
            result = await self.collection.delete_one({"product_id": product_id})
            success = result.deleted_count > 0
            
            if success:
                logger.info(f"Product {product_id} deleted successfully")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to delete product {product_id}: {e}")
            raise


class ImageRepository(BaseRepository):
    """Repository for image operations."""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        super().__init__(database, "images")
    
    async def create_image(self, filename: str, content: str, content_type: str, size: int) -> str:
        """Create a new image record."""
        try:
            image_doc = {
                "filename": filename,
                "content": content,
                "content_type": content_type,
                "size": size,
                "timestamp": datetime.utcnow()
            }
            
            result = await self.collection.insert_one(image_doc)
            
            logger.info(f"Image created with ID: {result.inserted_id}")
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Failed to create image: {e}")
            raise
    
    async def get_image(self, image_id: str) -> Optional[Dict[str, Any]]:
        """Get image by ID."""
        try:
            return await self.find_by_id(image_id)
            
        except Exception as e:
            logger.error(f"Failed to get image {image_id}: {e}")
            raise


class RepositoryManager:
    """Manager for all repositories."""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.grids = GridRepository(database)
        self.products = ProductRepository(database)
        self.images = ImageRepository(database)