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

# Include API routes
app.include_router(api_router)

# Serve frontend static files (production mode)
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    # Mount static assets
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")
    
    @app.get("/", include_in_schema=False)
    async def serve_root():
        """Serve the frontend index.html for root path"""
        return FileResponse(frontend_dist / "index.html")
    
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        """Serve frontend files or index.html for SPA routing"""
        # Don't interfere with API routes
        if full_path.startswith("api") or full_path.startswith("health"):
            return
        
        # Check if file exists in dist
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        
        # Otherwise serve index.html (SPA catch-all)
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
