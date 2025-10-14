"""
Grid-related API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List

from app.core.models import GridData, GridResponse, ErrorResponse
from app.core.database import get_database
from config.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/grid", tags=["grid"])


@router.post("/", response_model=GridResponse)
async def save_grid(
    grid_data: GridData,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Save a new grid to the database."""
    try:
        logger.info(f"Saving grid with dimensions {grid_data.rows}x{grid_data.columns}")
        
        grid_doc = {
            "grid": grid_data.grid,
            "rows": grid_data.rows,
            "columns": grid_data.columns,
            "actual_width": grid_data.actual_width,
            "actual_length": grid_data.actual_length,
            "image_id": grid_data.image_id,
            "timestamp": datetime.utcnow()
        }
        
        result = await db.grids.insert_one(grid_doc)
        grid_doc["id"] = str(result.inserted_id)
        
        logger.info(f"Grid saved successfully with ID: {grid_doc['id']}")
        return GridResponse(**grid_doc)
        
    except Exception as e:
        logger.error(f"Failed to save grid: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save grid: {str(e)}")


@router.get("/{grid_id}", response_model=GridResponse)
async def get_grid(
    grid_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Retrieve a grid by ID."""
    try:
        if not ObjectId.is_valid(grid_id):
            raise HTTPException(status_code=400, detail="Invalid grid ID format")
        
        grid = await db.grids.find_one({"_id": ObjectId(grid_id)})
        
        if grid is None:
            raise HTTPException(status_code=404, detail="Grid not found")
        
        grid["id"] = str(grid["_id"])
        del grid["_id"]
        return GridResponse(**grid)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve grid {grid_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve grid: {str(e)}")


@router.get("/", response_model=List[GridResponse])
async def get_all_grids(
    limit: int = 100,
    offset: int = 0,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Retrieve all grids with pagination."""
    try:
        cursor = db.grids.find().sort("timestamp", -1).skip(offset).limit(limit)
        grids = []
        
        async for grid in cursor:
            grid["id"] = str(grid["_id"])
            del grid["_id"]
            grids.append(GridResponse(**grid))
        
        logger.info(f"Retrieved {len(grids)} grids")
        return grids
        
    except Exception as e:
        logger.error(f"Failed to retrieve grids: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve grids: {str(e)}")


@router.delete("/{grid_id}")
async def delete_grid(
    grid_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a grid by ID."""
    try:
        if not ObjectId.is_valid(grid_id):
            raise HTTPException(status_code=400, detail="Invalid grid ID format")
        
        result = await db.grids.delete_one({"_id": ObjectId(grid_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Grid not found")
        
        logger.info(f"Grid {grid_id} deleted successfully")
        return {"message": "Grid deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete grid {grid_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete grid: {str(e)}")