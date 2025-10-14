"""
Custom exception classes for the application.
"""


class AppException(Exception):
    """Base exception class for application-specific errors."""
    
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code or self.__class__.__name__
        super().__init__(self.message)


class GridNotFoundException(AppException):
    """Raised when a grid is not found."""
    pass


class InvalidGridDataException(AppException):
    """Raised when grid data is invalid."""
    pass


class PathfindingException(AppException):
    """Raised when pathfinding operations fail."""
    pass


class InvalidCoordinateException(AppException):
    """Raised when coordinates are invalid."""
    pass


class ProductNotFoundException(AppException):
    """Raised when a product is not found."""
    pass


class ProductAlreadyExistsException(AppException):
    """Raised when trying to create a product that already exists."""
    pass


class ImageNotFoundException(AppException):
    """Raised when an image is not found."""
    pass


class FileTooLargeException(AppException):
    """Raised when uploaded file exceeds size limit."""
    pass


class InvalidFileTypeException(AppException):
    """Raised when uploaded file type is not supported."""
    pass


class DatabaseConnectionException(AppException):
    """Raised when database connection fails."""
    pass


class ValidationException(AppException):
    """Raised when input validation fails."""
    pass