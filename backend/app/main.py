"""
Emulsion Backend - FastAPI Application
Film roll inventory management system
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "name": "Emulsion API",
        "version": "0.1.0",
        "status": "running"
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
