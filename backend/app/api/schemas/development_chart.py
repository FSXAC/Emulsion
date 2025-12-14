"""Pydantic schemas for development chart API."""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, Field, field_validator


class DevelopmentChartBase(BaseModel):
    """Base schema for development chart entries."""
    
    film_stock: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Film stock name (e.g., 'Ilford HP5 Plus 400')",
        examples=["Ilford HP5 Plus 400", "Kodak Tri-X 400", "Kodak T-Max 400"]
    )
    developer: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Developer name (e.g., 'Ilfosol 3', 'D-76')",
        examples=["Ilfosol 3", "D-76", "HC-110", "Rodinal"]
    )
    iso_rating: int = Field(
        ...,
        gt=0,
        le=25600,
        description="ISO rating (use pushed/pulled ISO for push/pull processing)",
        examples=[400, 800, 1600]
    )
    dilution_ratio: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Dilution ratio (e.g., '1+4', '1+9', 'stock')",
        examples=["1+4", "1+9", "1+14", "1+31", "stock"]
    )
    temperature_celsius: Decimal = Field(
        ...,
        gt=0,
        le=100,
        description="Development temperature in Celsius (typically 15-30°C, up to 100°C for some processes)",
        examples=[20.0, 24.0, 38.0]
    )
    development_time_seconds: int = Field(
        ...,
        gt=0,
        description="Development time in seconds",
        examples=[390, 660, 480]
    )
    agitation_notes: Optional[str] = Field(
        None,
        max_length=500,
        description="Agitation pattern notes",
        examples=["First 30s continuous, then 10s every minute"]
    )
    notes: Optional[str] = Field(
        None,
        description="Additional notes or source references",
        examples=["From Ilford datasheet", "Personal experiment results"]
    )


class DevelopmentChartCreate(DevelopmentChartBase):
    """Schema for creating a new development chart entry."""
    pass


class DevelopmentChartUpdate(BaseModel):
    """Schema for updating an existing development chart entry."""
    
    film_stock: Optional[str] = Field(None, min_length=1, max_length=200)
    developer: Optional[str] = Field(None, min_length=1, max_length=200)
    iso_rating: Optional[int] = Field(None, gt=0, le=25600)
    dilution_ratio: Optional[str] = Field(None, min_length=1, max_length=50)
    temperature_celsius: Optional[Decimal] = Field(None, gt=0, le=100)
    development_time_seconds: Optional[int] = Field(None, gt=0)
    agitation_notes: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None


class DevelopmentChartResponse(DevelopmentChartBase):
    """Schema for development chart entry response."""
    
    id: str
    development_time_formatted: str = Field(
        ...,
        description="Formatted development time as MM:SS"
    )
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DevelopmentChartList(BaseModel):
    """Schema for list of development chart entries."""
    
    entries: List[DevelopmentChartResponse]
    total: int = Field(..., description="Total number of entries matching filters")


class DevelopmentChartLookupQuery(BaseModel):
    """Schema for development chart lookup query."""
    
    film_stock: str = Field(..., description="Film stock name (exact match)")
    developer: str = Field(..., description="Developer name (exact match)")
    iso_rating: int = Field(..., gt=0, description="ISO rating")
    dilution_ratio: Optional[str] = Field(None, description="Dilution ratio (optional)")
    temperature_celsius: Optional[Decimal] = Field(None, gt=0, description="Temperature in Celsius (optional)")


class DevelopmentChartLookupResponse(BaseModel):
    """Schema for development chart lookup response."""
    
    found: bool = Field(..., description="Whether a matching entry was found")
    entry: Optional[DevelopmentChartResponse] = Field(None, description="Matching entry if found")
    suggestions: Optional[List[DevelopmentChartResponse]] = Field(
        None, 
        description="Similar entries if exact match not found"
    )
