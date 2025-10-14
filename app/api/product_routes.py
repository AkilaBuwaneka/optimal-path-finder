"""
Product management API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import List

from app.core.models import Product, ErrorResponse
from app.core.database import get_database
from config.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api", tags=["products"])


@router.post("/save_product")
async def save_product(
    product: Product,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Save a new product."""
    try:
        # Validate grid exists
        if not ObjectId.is_valid(product.grid_id):
            raise HTTPException(status_code=400, detail="Invalid grid ID format")
        
        grid = await db.grids.find_one({"_id": ObjectId(product.grid_id)})
        if not grid:
            raise HTTPException(status_code=404, detail="Grid not found")
        
        # Validate coordinates are within grid bounds
        if (product.x_coord < 0 or product.x_coord >= grid["rows"] or 
            product.y_coord < 0 or product.y_coord >= grid["columns"]):
            raise HTTPException(
                status_code=400,
                detail=f"Coordinates ({product.x_coord}, {product.y_coord}) are outside grid bounds"
            )
        
        # Check if product ID already exists
        existing = await db.products.find_one({"product_id": product.product_id})
        if existing:
            raise HTTPException(status_code=409, detail="Product ID already exists")
        
        logger.info(f"Saving product: {product.product_name} ({product.product_id})")
        
        product_dict = product.dict()
        result = await db.products.insert_one(product_dict)
        
        logger.info(f"Product saved successfully with ID: {result.inserted_id}")
        
        return {
            "message": "Product saved successfully",
            "product_id": product.product_id,
            "db_id": str(result.inserted_id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save product: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save product: {str(e)}")


@router.get("/products/{grid_id}", response_model=List[Product])
async def get_products_by_grid(
    grid_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all products for a specific grid."""
    try:
        if not ObjectId.is_valid(grid_id):
            raise HTTPException(status_code=400, detail="Invalid grid ID format")
        
        cursor = db.products.find({"grid_id": grid_id})
        products = []
        
        async for product in cursor:
            product["id"] = str(product["_id"])
            del product["_id"]
            products.append(Product(**product))
        
        logger.info(f"Retrieved {len(products)} products for grid {grid_id}")
        return products
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve products: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve products: {str(e)}")


@router.get("/product/{product_id}", response_model=Product)
async def get_product(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific product by ID."""
    try:
        product = await db.products.find_one({"product_id": product_id})
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product["id"] = str(product["_id"])
        del product["_id"]
        
        return Product(**product)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve product: {str(e)}")


@router.put("/product/{product_id}")
async def update_product(
    product_id: str,
    product: Product,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update an existing product."""
    try:
        if product.product_id != product_id:
            raise HTTPException(status_code=400, detail="Product ID mismatch")
        
        result = await db.products.update_one(
            {"product_id": product_id},
            {"$set": product.dict()}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        logger.info(f"Product {product_id} updated successfully")
        return {"message": "Product updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update product: {str(e)}")


@router.delete("/product/{product_id}")
async def delete_product(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a product."""
    try:
        result = await db.products.delete_one({"product_id": product_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        logger.info(f"Product {product_id} deleted successfully")
        return {"message": "Product deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete product: {str(e)}")