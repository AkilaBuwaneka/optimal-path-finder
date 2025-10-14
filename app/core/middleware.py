"""
Middleware for the application.
"""
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
import time
import uuid

from config.logging_config import get_logger

logger = get_logger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests and responses."""
    
    async def dispatch(self, request: Request, call_next):
        # Generate request ID
        request_id = str(uuid.uuid4())[:8]
        
        # Log request
        start_time = time.time()
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} - "
            f"Client: {request.client.host if request.client else 'unknown'}"
        )
        
        # Process request
        response = await call_next(request)
        
        # Log response
        duration = time.time() - start_time
        logger.info(
            f"[{request_id}] {response.status_code} - "
            f"Duration: {duration:.3f}s"
        )
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers."""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting middleware."""
    
    def __init__(self, app, calls_per_minute: int = 60):
        super().__init__(app)
        self.calls_per_minute = calls_per_minute
        self.clients = {}  # In production, use Redis or similar
    
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Clean old entries (older than 1 minute)
        cutoff_time = current_time - 60
        self.clients = {
            ip: calls for ip, calls in self.clients.items()
            if any(call_time > cutoff_time for call_time in calls)
        }
        
        # Update client calls
        if client_ip not in self.clients:
            self.clients[client_ip] = []
        
        # Remove old calls for this client
        self.clients[client_ip] = [
            call_time for call_time in self.clients[client_ip]
            if call_time > cutoff_time
        ]
        
        # Check rate limit
        if len(self.clients[client_ip]) >= self.calls_per_minute:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            return Response(
                content="Rate limit exceeded",
                status_code=429,
                headers={"Retry-After": "60"}
            )
        
        # Record this call
        self.clients[client_ip].append(current_time)
        
        return await call_next(request)