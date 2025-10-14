"""
Utility functions for the pathfinding application.
"""
import os
import hashlib
import json
from typing import Any, Dict, List
from datetime import datetime


def create_directories(*paths: str) -> None:
    """Create directories if they don't exist."""
    for path in paths:
        os.makedirs(path, exist_ok=True)


def hash_data(data: Any) -> str:
    """Create a hash of arbitrary data for caching."""
    json_str = json.dumps(data, sort_keys=True, default=str)
    return hashlib.md5(json_str.encode()).hexdigest()


def validate_grid_bounds(x: int, y: int, rows: int, cols: int) -> bool:
    """Check if coordinates are within grid bounds."""
    return 0 <= x < rows and 0 <= y < cols


def format_file_size(size_bytes: int) -> str:
    """Format file size in human-readable format."""
    if size_bytes == 0:
        return "0B"
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    return f"{size_bytes:.1f}{size_names[i]}"


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage."""
    import re
    # Remove potentially dangerous characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:255-len(ext)] + ext
    return filename


class PerformanceTimer:
    """Context manager for measuring execution time."""
    
    def __init__(self, name: str = "Operation"):
        self.name = name
        self.start_time = None
        
    def __enter__(self):
        self.start_time = datetime.now()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        end_time = datetime.now()
        duration = (end_time - self.start_time).total_seconds()
        print(f"{self.name} took {duration:.3f} seconds")
        
    @property
    def elapsed(self) -> float:
        """Get elapsed time in seconds."""
        if self.start_time:
            return (datetime.now() - self.start_time).total_seconds()
        return 0.0