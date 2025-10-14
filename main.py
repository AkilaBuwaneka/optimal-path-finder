"""
FastAPI application factory and main entry point.
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

# Import API routers
from app.api.grid_routes import router as grid_router
from app.api.image_routes import router as image_router
from app.api.pathfinding_routes import router as pathfinding_router
from app.api.product_routes import router as product_router

# Import core components
from app.core.database import db_manager
from app.core.models import ErrorResponse
from config.settings import settings
from config.logging_config import setup_logging, get_logger

# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting OptimalPath application")
    
    # Connect to database
    try:
        await db_manager.connect()
        logger.info("Database connection established")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise
    
    # Create upload directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(f"Upload directory ready: {settings.UPLOAD_DIR}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down OptimalPath application")
    await db_manager.disconnect()


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="OptimalPath API",
        description="A FastAPI-based pathfinding application for warehouse/floor plan optimization",
        version="1.0.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_HOSTS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Mount static files
    app.mount("/static", StaticFiles(directory="static"), name="static")
    
    # Setup templates
    templates = Jinja2Templates(directory="templates")
    
    # Include API routers
    app.include_router(grid_router)
    app.include_router(image_router)
    app.include_router(pathfinding_router)
    app.include_router(product_router)
    
    # Web page routes
    @app.get("/", response_class=HTMLResponse)
    async def read_root(request: Request):
        """Serve the main page."""
        return templates.TemplateResponse("index.html", {"request": request})
    
    @app.get("/pathfinding/", response_class=HTMLResponse)
    async def pathfinding_page(request: Request):
        """Serve the pathfinding page."""
        return templates.TemplateResponse("pathfinding.html", {"request": request})
    
    @app.get("/product_coordinates/", response_class=HTMLResponse)
    async def product_coordinates_page(request: Request):
        """Serve the product coordinates page."""
        return templates.TemplateResponse("product_coordinates.html", {"request": request})
    
    # Health check endpoint
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "version": "1.0.0"}
    
    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Global exception handler for better error responses."""
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                error="InternalServerError",
                message="An internal server error occurred",
                details={"path": str(request.url.path)} if settings.DEBUG else None
            ).dict()
        )
    
    # HTTP exception handler
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle HTTP exceptions with consistent error format."""
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                error=exc.__class__.__name__,
                message=exc.detail,
                details={"path": str(request.url.path)} if settings.DEBUG else None
            ).dict()
        )
    
    return app


# Create the app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting server on {settings.HOST}:{settings.PORT}")
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info"
    )