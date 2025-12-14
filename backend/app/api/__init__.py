"""API routes package."""

from fastapi import APIRouter

# Create main API router
api_router = APIRouter(prefix="/api")

# Import and include route modules
from app.api import rolls, chemistry, dev_chart

api_router.include_router(rolls.router, prefix="/rolls", tags=["Film Rolls"])
api_router.include_router(chemistry.router, prefix="/chemistry", tags=["Chemistry"])
api_router.include_router(dev_chart.router, prefix="/dev-chart", tags=["Development Chart"])

__all__ = ["api_router"]
