"""Pydantic schemas for PATCH operations."""

from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class LoadRollRequest(BaseModel):
    """Schema for loading a roll into camera."""
    date_loaded: date = Field(..., description="Date roll was loaded into camera")


class UnloadRollRequest(BaseModel):
    """Schema for unloading a roll from camera."""
    date_unloaded: date = Field(..., description="Date roll was unloaded from camera")


class AssignChemistryRequest(BaseModel):
    """Schema for assigning chemistry to a roll."""
    chemistry_id: Optional[str] = Field(None, description="Chemistry batch ID to associate with roll (optional if lab_dev_cost provided)")
    lab_dev_cost: Optional[float] = Field(None, description="Lab development cost (optional if chemistry_id provided)")


class RateRollRequest(BaseModel):
    """Schema for rating a scanned roll."""
    stars: int = Field(..., ge=1, le=5, description="Rating (1-5 stars)")
    actual_exposures: Optional[int] = Field(None, gt=0, description="Actual number of exposures (known after scanning)")
