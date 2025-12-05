"""Film rolls API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import FilmRoll, ChemistryBatch
from app.api.schemas.film_roll import (
    FilmRollCreate,
    FilmRollUpdate,
    FilmRollResponse,
    FilmRollList,
)

router = APIRouter()


@router.get("", response_model=FilmRollList)
def list_film_rolls(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    status: Optional[str] = Query(None, description="Filter by status"),
    order_id: Optional[str] = Query(None, description="Filter by order ID"),
    db: Session = Depends(get_db),
):
    """
    Get list of all film rolls with optional filtering.
    
    Status is computed on-the-fly from field presence.
    """
    query = db.query(FilmRoll)
    
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
