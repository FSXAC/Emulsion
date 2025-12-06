"""Pydantic schemas for Chemistry Batch API."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ChemistryBatchBase(BaseModel):
    """Base schema for chemistry batch with common fields."""
    
    name: str = Field(..., min_length=1, max_length=200, description="Chemistry batch name")
    chemistry_type: str = Field(..., min_length=1, max_length=50, description="Chemistry type (C41, E6, BW, etc.)")
    date_mixed: Optional[date] = Field(None, description="Date chemistry was mixed (optional for unmixed batches)")
    date_retired: Optional[date] = Field(None, description="Date chemistry was retired")
    developer_cost: Decimal = Field(..., ge=0, description="Developer cost")
    fixer_cost: Decimal = Field(..., ge=0, description="Fixer cost")
    other_cost: Decimal = Field(default=Decimal("0.00"), ge=0, description="Other chemistry costs")
    rolls_offset: int = Field(default=0, description="Manual adjustment for roll count")


class ChemistryBatchCreate(ChemistryBatchBase):
    """Schema for creating a new chemistry batch."""
    pass


class ChemistryBatchUpdate(BaseModel):
    """Schema for updating an existing chemistry batch. All fields optional."""
    
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    chemistry_type: Optional[str] = Field(None, min_length=1, max_length=50)
    date_mixed: Optional[date] = None
    date_retired: Optional[date] = None
    developer_cost: Optional[Decimal] = Field(None, ge=0)
    fixer_cost: Optional[Decimal] = Field(None, ge=0)
    other_cost: Optional[Decimal] = Field(None, ge=0)
    rolls_offset: Optional[int] = None


class ChemistryBatchResponse(ChemistryBatchBase):
    """Schema for chemistry batch response with computed fields."""
    
    id: str
    batch_cost: Decimal = Field(..., description="Total batch cost")
    rolls_developed: int = Field(..., description="Number of rolls developed")
    cost_per_roll: Optional[Decimal] = Field(None, description="Cost per roll")
    development_time_formatted: Optional[str] = Field(None, description="C41 development time (MM:SS)")
    development_time_seconds: Optional[int] = Field(None, description="C41 development time in seconds")
    is_active: bool = Field(..., description="Whether chemistry is still active")
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ChemistryBatchList(BaseModel):
    """Schema for list of chemistry batches."""
    
    batches: list[ChemistryBatchResponse]
    total: int
