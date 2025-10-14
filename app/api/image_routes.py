"""
Image upload and processing API endpoints.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
import base64
import cv2
import numpy as np
import os
from typing import Dict, Any

from app.core.models import ImageUploadResponse, ErrorResponse
from app.core.database import get_database
from config.settings import settings
from config.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api", tags=["images"])


@router.post("/upload-image/", response_model=ImageUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Upload and store an image."""
    try:
        # Validate file size
        contents = await file.read()
        if len(contents) > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE} bytes"
            )
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        logger.info(f"Uploading image: {file.filename}, size: {len(contents)} bytes")
        
        result = await db.images.insert_one({
            "filename": file.filename,
            "content": base64.b64encode(contents).decode(),
            "content_type": file.content_type,
            "size": len(contents),
            "timestamp": datetime.utcnow()
        })
        
        logger.info(f"Image uploaded successfully with ID: {result.inserted_id}")
        
        return ImageUploadResponse(
            image_id=str(result.inserted_id),
            filename=file.filename or "unknown",
            message="Image uploaded successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload image: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")


@router.get("/image/{image_id}")
async def get_image(
    image_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Retrieve an image by ID."""
    try:
        if not ObjectId.is_valid(image_id):
            raise HTTPException(status_code=400, detail="Invalid image ID format")
        
        image = await db.images.find_one({"_id": ObjectId(image_id)})
        
        if image is None:
            raise HTTPException(status_code=404, detail="Image not found")
        
        return {
            "content": image["content"],
            "content_type": image.get("content_type", "image/jpeg"),
            "filename": image.get("filename")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve image {image_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve image: {str(e)}")


@router.get("/images/{image_id}")
async def get_image_plural(image_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Alias for /api/image/{image_id} for compatibility."""
    return await get_image(image_id, db)


@router.post("/upload_floor_plan/")
async def upload_floor_plan(file: UploadFile = File(...)):
    """Upload a floor plan image for processing."""
    try:
        # Ensure upload directory exists
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        contents = await file.read()
        if len(contents) > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE} bytes"
            )
        
        file_path = os.path.join(settings.UPLOAD_DIR, file.filename or "unknown")
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        logger.info(f"Floor plan uploaded: {file_path}")
        return {"filename": file.filename}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload floor plan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload floor plan: {str(e)}")


def process_image(image_path: str) -> list:
    """Process an image to extract grid data."""
    try:
        image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if image is None:
            raise ValueError("Could not read image file")
        
        _, binary_image = cv2.threshold(image, 128, 255, cv2.THRESH_BINARY)
        grid = (binary_image == 0).astype(int)  # 0 for free space, 1 for obstacles
        return grid.tolist()
        
    except Exception as e:
        logger.error(f"Failed to process image {image_path}: {e}")
        raise


@router.get("/process_image/{filename}")
async def process_image_endpoint(filename: str):
    """Process an uploaded image to extract grid data."""
    try:
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        grid = process_image(file_path)
        logger.info(f"Image processed successfully: {filename}")
        
        return {"grid": grid}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process image {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")