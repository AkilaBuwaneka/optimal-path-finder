"""
Pathfinding API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import time

from app.core.models import PathfindingRequest, PathfindingResponse
from app.core.database import get_database
from app.services.pathfinding_service import PathfindingService
from config.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/pathfinding", tags=["pathfinding"])


@router.post("/", response_model=PathfindingResponse)
async def find_path(
    request: PathfindingRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Find optimal path through grid with pickup points."""
    try:
        start_time = time.time()
        
        logger.info(f"Finding path for grid {request.grid_id} with {len(request.pickup_points)} pickup points")
        
        # Validate grid ID format
        if not ObjectId.is_valid(request.grid_id):
            raise HTTPException(status_code=400, detail="Invalid grid ID format")
        
        # Get grid from database
        grid_data = await db.grids.find_one({"_id": ObjectId(request.grid_id)})
        if not grid_data:
            raise HTTPException(status_code=404, detail="Grid not found")
        
        # Validate coordinates are within grid bounds
        def validate_point(point, name):
            if point.x < 0 or point.x >= grid_data["rows"] or point.y < 0 or point.y >= grid_data["columns"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"{name} point ({point.x}, {point.y}) is outside grid bounds"
                )
            if grid_data["grid"][point.x][point.y] == 1:
                raise HTTPException(
                    status_code=400,
                    detail=f"{name} point ({point.x}, {point.y}) is on an obstacle"
                )
        
        validate_point(request.start, "Start")
        validate_point(request.end, "End")
        for i, point in enumerate(request.pickup_points):
            validate_point(point, f"Pickup point {i+1}")
        
        # Find optimal path using service
        pathfinding_service = PathfindingService()
        path = pathfinding_service.find_optimal_path(
            grid_data["grid"],
            request.start,
            request.end,
            request.pickup_points,
            algorithm=request.algorithm
        )
        
        if not path:
            raise HTTPException(status_code=400, detail="No valid path found")
        
        computation_time = time.time() - start_time
        total_distance = len(path) - 1
        
        logger.info(f"Path found successfully: {total_distance} steps in {computation_time:.3f}s")
        
        return PathfindingResponse(
            path=path,
            total_distance=float(total_distance),
            computation_time=computation_time,
            algorithm_used=request.algorithm or "optimal"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to find path: {e}")
        raise HTTPException(status_code=500, detail=f"Pathfinding failed: {str(e)}")