"""Film rolls API endpoints."""

from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.core.database import get_db
from app.models import FilmRoll, ChemistryBatch
from app.api.schemas.film_roll import (
    FilmRollCreate,
    FilmRollUpdate,
    FilmRollResponse,
    FilmRollList,
)
from app.api.schemas.actions import (
    LoadRollRequest,
    UnloadRollRequest,
    AssignChemistryRequest,
    RateRollRequest,
)
from app.api.search import SearchParser

router = APIRouter()


@router.get("", response_model=FilmRollList)
def list_film_rolls(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    status: Optional[str] = Query(None, description="Filter by status (legacy, use search instead)"),
    order_id: Optional[str] = Query(None, description="Filter by order ID (legacy, use search instead)"),
    search: Optional[str] = Query(None, description="Search query with syntax support (e.g., 'format:120 status:loaded' or 'portra')"),
    db: Session = Depends(get_db),
):
    """
    Get list of all film rolls with optional filtering.
    
    Supports two filtering modes:
    1. Legacy filters (status, order_id) - for backward compatibility
    2. Search syntax - powerful query language with field-specific filters
    
    Search syntax examples:
    - Simple text: "portra" (searches across stock name, order ID, notes)
    - Field-specific: "format:120 status:loaded"
    - Comparisons: "stars:>=4 cost:<10"
    - Chemistry: "chemistry:c41"
    - Date ranges: "date:2024-12"
    
    When search is active, pagination limits are removed to show all matching results.
    Status is computed on-the-fly from field presence.
    """
    query = db.query(FilmRoll)
    computed_filters = []
    
    # Use search parser if search query provided
    if search:
        parser = SearchParser(db)
        
        try:
            # Parse search query
            tokens = parser.parse(search)
            
            # Build filters
            sql_filters, computed_filters = parser.build_filters(tokens)
            
            # Apply SQL filters
            if sql_filters:
                query = query.filter(and_(*sql_filters))
            
            # When searching, fetch all results (no pagination)
            total = query.count()
            rolls = query.all()
            
            # Apply computed filters (status, cost)
            if computed_filters:
                rolls = parser.apply_computed_filters(rolls, computed_filters)
                total = len(rolls)  # Update total after filtering
        
        except Exception as e:
            # If search parsing fails, return error
            raise HTTPException(
                status_code=400,
                detail=f"Invalid search query: {str(e)}"
            )
    
    else:
        # Legacy filtering (for backward compatibility)
        # Note: Status filtering is tricky since it's computed. 
        # For MVP, we'll fetch all and filter in Python if status is requested
        if order_id:
            query = query.filter(FilmRoll.order_id == order_id)
        
        total = query.count()
        rolls = query.offset(skip).limit(limit).all()
        
        # Filter by status in Python if requested
        if status:
            rolls = [r for r in rolls if r.status == status.upper()]
    
    return FilmRollList(rolls=rolls, total=total)


@router.post("", response_model=FilmRollResponse, status_code=201)
def create_film_roll(
    roll_data: FilmRollCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new film roll.
    
    Validates chemistry_id if provided.
    """
    # Validate chemistry exists if provided
    if roll_data.chemistry_id:
        chemistry = db.query(ChemistryBatch).filter(
            ChemistryBatch.id == roll_data.chemistry_id
        ).first()
        if not chemistry:
            raise HTTPException(
                status_code=404,
                detail=f"Chemistry batch with id {roll_data.chemistry_id} not found"
            )
    
    # Create new roll
    roll = FilmRoll(**roll_data.model_dump())
    db.add(roll)
    db.commit()
    db.refresh(roll)
    
    return roll


@router.get("/{roll_id}", response_model=FilmRollResponse)
def get_film_roll(
    roll_id: str,
    db: Session = Depends(get_db),
):
    """Get a single film roll by ID."""
    roll = db.query(FilmRoll).filter(FilmRoll.id == roll_id).first()
    
    if not roll:
        raise HTTPException(status_code=404, detail="Film roll not found")
    
    return roll


@router.put("/{roll_id}", response_model=FilmRollResponse)
def update_film_roll(
    roll_id: str,
    roll_data: FilmRollUpdate,
    db: Session = Depends(get_db),
):
    """
    Update an existing film roll.
    
    Only provided fields will be updated.
    """
    roll = db.query(FilmRoll).filter(FilmRoll.id == roll_id).first()
    
    if not roll:
        raise HTTPException(status_code=404, detail="Film roll not found")
    
    # Validate chemistry exists if provided
    if roll_data.chemistry_id:
        chemistry = db.query(ChemistryBatch).filter(
            ChemistryBatch.id == roll_data.chemistry_id
        ).first()
        if not chemistry:
            raise HTTPException(
                status_code=404,
                detail=f"Chemistry batch with id {roll_data.chemistry_id} not found"
            )
    
    # Update fields
    update_data = roll_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(roll, field, value)
    
    db.commit()
    db.refresh(roll)
    
    return roll


@router.delete("/{roll_id}", status_code=204)
def delete_film_roll(
    roll_id: str,
    db: Session = Depends(get_db),
):
    """Delete a film roll."""
    roll = db.query(FilmRoll).filter(FilmRoll.id == roll_id).first()
    
    if not roll:
        raise HTTPException(status_code=404, detail="Film roll not found")
    
    db.delete(roll)
    db.commit()
    
    return None
@router.patch("/{roll_id}/load", response_model=FilmRollResponse)
def load_roll(
    roll_id: str,
    data: LoadRollRequest,
    db: Session = Depends(get_db),
):
    """
    Load a film roll into camera (set date_loaded).
    
    This transitions the roll from NEW → LOADED status.
    Triggered when dragging roll to LOADED column.
    """
    roll = db.query(FilmRoll).filter(FilmRoll.id == roll_id).first()
    
    if not roll:
        raise HTTPException(status_code=404, detail="Film roll not found")
    
    roll.date_loaded = data.date_loaded
    
    db.commit()
    db.refresh(roll)
    
    return roll


@router.patch("/{roll_id}/unload", response_model=FilmRollResponse)
def unload_roll(
    roll_id: str,
    data: UnloadRollRequest,
    db: Session = Depends(get_db),
):
    """
    Unload a film roll from camera (set date_unloaded).
    
    This transitions the roll from LOADED -> EXPOSED status.
    Triggered when dragging roll to EXPOSED column.
    
    Note: actual_exposures is set later when rating after scanning.
    """
    roll = db.query(FilmRoll).filter(FilmRoll.id == roll_id).first()
    if not roll:
        raise HTTPException(status_code=404, detail="Film roll not found")
    
    roll.date_unloaded = data.date_unloaded
    
    db.commit()
    db.refresh(roll)
    
    return roll


@router.patch("/{roll_id}/chemistry", response_model=FilmRollResponse)
def assign_chemistry(
    roll_id: str,
    data: AssignChemistryRequest,
    db: Session = Depends(get_db),
):
    """
    Assign chemistry batch OR lab cost to a roll.
    
    This transitions the roll from EXPOSED -> DEVELOPED status.
    Triggered when dragging roll to DEVELOPED column or selecting chemistry.
    
    Note: The roll count for chemistry batch is automatically calculated
    via the relationship, no manual increment needed.
    """
    roll = db.query(FilmRoll).filter(FilmRoll.id == roll_id).first()
    
    if not roll:
        raise HTTPException(status_code=404, detail="Film roll not found")

    if data.chemistry_id:
        # Validate chemistry exists
        chemistry = db.query(ChemistryBatch).filter(
            ChemistryBatch.id == data.chemistry_id
        ).first()
        if not chemistry:
            raise HTTPException(
                status_code=404,
                detail=f"Chemistry batch with id {data.chemistry_id} not found"
            )
        roll.chemistry_id = data.chemistry_id
        roll.lab_dev_cost = None
    elif data.lab_dev_cost is not None:
        # Assign lab cost
        roll.chemistry_id = None
        roll.lab_dev_cost = Decimal(str(data.lab_dev_cost))
    else:
        raise HTTPException(
            status_code=400,
            detail="Either chemistry_id or lab_dev_cost must be provided"
        )
    
    db.commit()
    db.refresh(roll)
    
    return roll


@router.patch("/{roll_id}/rating", response_model=FilmRollResponse)
def rate_roll(
    roll_id: str,
    data: RateRollRequest,
    db: Session = Depends(get_db),
):
    """
    Rate a film roll (set stars and actual_exposures).
    
    This transitions the roll from DEVELOPED -> SCANNED status.
    Triggered when dragging roll to SCANNED column or clicking star rating.
    
    Note: This is when actual_exposures is typically set, after scanning
    reveals how many frames were successfully processed.
    """
    roll = db.query(FilmRoll).filter(FilmRoll.id == roll_id).first()
    
    if not roll:
        raise HTTPException(status_code=404, detail="Film roll not found")
    
    roll.stars = data.stars
    if data.actual_exposures is not None:
        roll.actual_exposures = data.actual_exposures
    
    db.commit()
    db.refresh(roll)
    
    return roll
