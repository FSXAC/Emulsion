"""Pydantic schemas for Film Roll API."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class FilmRollBase(BaseModel):
    """Base schema for film roll with common fields."""
    
    order_id: str = Field(..., min_length=1, max_length=100, description="Order/purchase identifier")
    film_stock_name: str = Field(..., min_length=1, max_length=200, description="Film stock name (e.g., 'Kodak Portra 400')")
    film_format: str = Field(..., min_length=1, max_length=50, description="Film format (e.g., '35mm', '120')")
    expected_exposures: int = Field(..., gt=0, description="Expected number of exposures")
    actual_exposures: Optional[int] = Field(None, gt=0, description="Actual number of exposures taken")
    date_loaded: Optional[date] = Field(None, description="Date roll was loaded into camera")
    date_unloaded: Optional[date] = Field(None, description="Date roll was unloaded from camera")
    push_pull_stops: Optional[Decimal] = Field(None, ge=-3, le=3, description="Push/pull stops (e.g., +1, -0.5)")
    chemistry_id: Optional[str] = Field(None, description="Associated chemistry batch ID")
    stars: Optional[int] = Field(None, ge=0, le=5, description="Rating (0-5 stars)")
    film_cost: Decimal = Field(..., ge=0, description="Film purchase cost")
    not_mine: bool = Field(False, description="Flag for friend's rolls")
    notes: Optional[str] = Field(None, description="Additional notes")


class FilmRollCreate(FilmRollBase):
    """Schema for creating a new film roll."""
    pass


class FilmRollUpdate(BaseModel):
    """Schema for updating an existing film roll. All fields optional."""
    
    order_id: Optional[str] = Field(None, min_length=1, max_length=100)
    film_stock_name: Optional[str] = Field(None, min_length=1, max_length=200)
    film_format: Optional[str] = Field(None, min_length=1, max_length=50)
    expected_exposures: Optional[int] = Field(None, gt=0)
    actual_exposures: Optional[int] = Field(None, gt=0)
    date_loaded: Optional[date] = None
    date_unloaded: Optional[date] = None
    push_pull_stops: Optional[Decimal] = Field(None, ge=-3, le=3)
    chemistry_id: Optional[str] = None
    stars: Optional[int] = Field(None, ge=0, le=5)
    film_cost: Optional[Decimal] = Field(None, ge=0)
    not_mine: Optional[bool] = None
    notes: Optional[str] = None


class FilmRollResponse(FilmRollBase):
    """Schema for film roll response with computed fields."""
    
    id: str
    status: str = Field(..., description="Derived status (NEW, LOADED, EXPOSED, DEVELOPED, SCANNED)")
    dev_cost: Optional[Decimal] = Field(None, description="Development cost from chemistry")
    total_cost: Optional[Decimal] = Field(None, description="Total cost (film + dev)")
    cost_per_shot: Optional[Decimal] = Field(None, description="Cost per exposure")
    duration_days: Optional[int] = Field(None, description="Days roll was loaded")
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class FilmRollList(BaseModel):
    """Schema for list of film rolls."""
    
    rolls: list[FilmRollResponse]
    total: int
