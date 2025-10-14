"""
Application settings and configuration management.
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Database settings
    MONGODB_URL: str = "mongodb://localhost:27017/"
    DATABASE_NAME: str = "floorplan_db"
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # Security settings
    SECRET_KEY: str = "your-secret-key-change-this"
    ALLOWED_HOSTS: list = ["*"]
    
    # File upload settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"
    
    # Performance settings
    ENABLE_CACHING: bool = True
    CACHE_TTL: int = 300  # 5 minutes
    
    # Pathfinding settings
    MAX_GRID_SIZE: int = 1000
    MAX_PICKUP_POINTS: int = 50
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True
    }


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings."""
    return settings