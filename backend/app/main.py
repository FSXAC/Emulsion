"""
Emulsion Backend - FastAPI Application
Film roll inventory management system
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db

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
    """Health check endpoint"""
    return {"status": "healthy"}
