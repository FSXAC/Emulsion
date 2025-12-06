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

# Serve frontend static files (production mode)
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    # Mount static assets with specific path
    assets_path = frontend_dist / "assets"
    if assets_path.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_path)), name="assets")
    
    from fastapi import HTTPException, Request
    from fastapi.responses import JSONResponse
    from starlette.exceptions import HTTPException as StarletteHTTPException
    
    @app.get("/", include_in_schema=False)
    async def serve_root():
        """Serve the frontend index.html for root path"""
        return FileResponse(frontend_dist / "index.html")
    
    @app.exception_handler(404)
    async def custom_404_handler(request: Request, exc: HTTPException):
        """Handle 404 errors - serve frontend for non-API routes, otherwise return 404"""
        path = request.url.path
        
        # If it's an API route, return proper 404 JSON
        if path.startswith("/api/") or path.startswith("/docs") or path.startswith("/redoc") or path.startswith("/openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        
        # For all other routes, serve the frontend (SPA routing)
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
