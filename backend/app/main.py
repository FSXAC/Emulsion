"""
Emulsion Backend - FastAPI Application
Film roll inventory management system
"""
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.database import init_db
from app.api import api_router

app = FastAPI(
    title="Emulsion API",
    description="Film roll inventory management and tracking system",
    version="0.1.0"
)


@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup."""
    init_db()


# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes FIRST (before catch-all routes)
app.include_router(api_router)

# Production mode: serve frontend static files and handle SPA routing
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    from fastapi import HTTPException, Request
    from fastapi.responses import JSONResponse
    
    # Mount static assets (CSS, JS, images, etc.)
    assets_path = frontend_dist / "assets"
    if assets_path.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_path)), name="assets")
    
    @app.get("/", include_in_schema=False)
    async def serve_root():
        """Serve the frontend index.html for root path"""
        return FileResponse(frontend_dist / "index.html")
    
    @app.exception_handler(404)
    async def custom_404_handler(request: Request, exc: HTTPException):
        """
        Custom 404 handler that supports SPA routing.
        
        - API routes get JSON 404 responses
        - All other routes serve index.html (for client-side routing)
        """
        path = request.url.path
        
        # Return JSON 404 for API and documentation routes
        if path.startswith("/api/") or path.startswith("/docs") or path.startswith("/redoc") or path.startswith("/openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        
        # Serve index.html for all other routes (SPA client-side routing)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    async def root():
        """Root endpoint - API information (dev mode)"""
        return {
            "name": "Emulsion API",
            "version": "0.1.0",
            "status": "running",
            "message": "Frontend not built. Run 'npm run build' in frontend directory."
        }


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns basic application health status and database connectivity.
    """
    from sqlalchemy import text
    from app.core.database import engine
    
    # Check database connectivity
    db_connected = False
    db_error = None
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_connected = True
    except Exception as e:
        db_error = str(e)
    
    response = {
        "status": "healthy" if db_connected else "degraded",
        "database": "connected" if db_connected else "disconnected",
        "version": "0.1.0"
    }
    
    # Include error in debug mode
    if not db_connected and settings.debug and db_error:
        response["error"] = db_error
    
    return response
