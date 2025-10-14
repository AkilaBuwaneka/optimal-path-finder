"""
Enhanced Pydantic models with validation and documentation.
"""
from pydantic import BaseModel, Field, validator
from typing import List, Tuple, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class Point(BaseModel):
    """Represents a coordinate point in the grid."""
    x: int = Field(..., ge=0, description="X coordinate (row)")
    y: int = Field(..., ge=0, description="Y coordinate (column)")
    
    model_config = {
        "json_schema_extra": {
            "example": {"x": 5, "y": 10}
        }
    }


class GridData(BaseModel):
    """Grid data structure with validation."""
    grid: List[List[int]] = Field(..., description="2D grid where 0=free space, 1=obstacle")
    rows: int = Field(..., gt=0, le=1000, description="Number of rows")
    columns: int = Field(..., gt=0, le=1000, description="Number of columns")
    actual_width: float = Field(..., gt=0, description="Real-world width in meters")
    actual_length: float = Field(..., gt=0, description="Real-world length in meters")
    image_id: Optional[str] = Field(None, description="Associated image ID")
    
    @validator('grid')
    def validate_grid_dimensions(cls, v, values):
        if 'rows' in values and 'columns' in values:
            if len(v) != values['rows']:
                raise ValueError("Grid rows must match rows field")
            if any(len(row) != values['columns'] for row in v):
                raise ValueError("All grid rows must have the same number of columns")
        return v
    
    @validator('grid')
    def validate_grid_values(cls, v):
        for row in v:
            for cell in row:
                if cell not in [0, 1]:
                    raise ValueError("Grid cells must be 0 (free) or 1 (obstacle)")
        return v


class GridResponse(BaseModel):
    """Grid response with metadata."""
    id: str
    grid: List[List[int]]
    rows: int
    columns: int
    actual_width: float
    actual_length: float
    image_id: Optional[str]
    timestamp: datetime
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "grid": [[0, 1, 0], [0, 0, 0], [1, 0, 0]],
                "rows": 3,
                "columns": 3,
                "actual_width": 10.5,
                "actual_length": 8.2,
                "image_id": "507f1f77bcf86cd799439012",
                "timestamp": "2023-10-13T10:30:00Z"
            }
        }
    }


class PathfindingRequest(BaseModel):
    """Request for pathfinding operation."""
    grid_id: str = Field(..., description="ID of the grid to use")
    start: Point = Field(..., description="Starting point")
    end: Point = Field(..., description="Ending point")
    pickup_points: List[Point] = Field(default=[], max_items=50, description="Points to visit")
    algorithm: Optional[str] = Field("optimal", description="Pathfinding algorithm to use")
    
    @validator('pickup_points')
    def validate_unique_points(cls, v):
        seen = set()
        for point in v:
            point_tuple = (point.x, point.y)
            if point_tuple in seen:
                raise ValueError("Pickup points must be unique")
            seen.add(point_tuple)
        return v


class PathfindingResponse(BaseModel):
    """Response from pathfinding operation."""
    path: List[Point] = Field(..., description="The calculated path")
    total_distance: float = Field(..., description="Total path distance")
    computation_time: Optional[float] = Field(None, description="Time taken to compute path")
    algorithm_used: str = Field(..., description="Algorithm used for pathfinding")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "path": [{"x": 0, "y": 0}, {"x": 1, "y": 0}, {"x": 2, "y": 0}],
                "total_distance": 2.0,
                "computation_time": 0.025,
                "algorithm_used": "A*"
            }
        }
    }


class Product(BaseModel):
    """Product information with location."""
    product_name: str = Field(..., min_length=1, max_length=100, description="Product name")
    product_id: str = Field(..., min_length=1, max_length=50, description="Unique product ID")
    weight: float = Field(..., gt=0, description="Weight in kg")
    height: float = Field(..., gt=0, description="Height in cm")
    width: float = Field(..., gt=0, description="Width in cm")
    length: float = Field(..., gt=0, description="Length in cm")
    x_coord: int = Field(..., ge=0, description="X coordinate in grid")
    y_coord: int = Field(..., ge=0, description="Y coordinate in grid")
    grid_id: str = Field(..., description="Associated grid ID")
    
    # Legacy field mapping for backward compatibility
    @validator('product_name', pre=True)
    def handle_legacy_product_name(cls, v):
        return v
    
    model_config = {
        # Allow both snake_case and camelCase for backward compatibility
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "product_name": "Widget A",
                "product_id": "WDG001",
                "weight": 2.5,
                "height": 15.0,
                "width": 10.0,
                "length": 8.0,
                "x_coord": 5,
                "y_coord": 10,
                "grid_id": "507f1f77bcf86cd799439011"
            }
        }
    }


class ImageUploadResponse(BaseModel):
    """Response for image upload."""
    image_id: str = Field(..., description="Unique ID of uploaded image")
    filename: str = Field(..., description="Original filename")
    message: str = Field(..., description="Success message")


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "error": "ValidationError",
                "message": "Grid dimensions are invalid",
                "details": {"field": "rows", "value": -1}
            }
        }
    }