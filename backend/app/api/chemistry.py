"""Chemistry batches API endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import ChemistryBatch
from app.api.schemas.chemistry_batch import (
    ChemistryBatchCreate,
    ChemistryBatchUpdate,
    ChemistryBatchResponse,
    ChemistryBatchList,
)

router = APIRouter()


@router.get("", response_model=ChemistryBatchList)
def list_chemistry_batches(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    active_only: bool = Query(False, description="Filter to only active (non-retired) batches"),
    chemistry_type: Optional[str] = Query(None, description="Filter by chemistry type"),
    db: Session = Depends(get_db),
):
    """
    Get list of all chemistry batches with optional filtering.
    
    Includes computed fields like rolls_developed and C41 development times.
    """
    query = db.query(ChemistryBatch)
    
    if active_only:
        query = query.filter(ChemistryBatch.date_retired.is_(None))
    
    if chemistry_type:
        query = query.filter(ChemistryBatch.chemistry_type == chemistry_type.upper())
    
    total = query.count()
    batches = query.offset(skip).limit(limit).all()
    
    return ChemistryBatchList(batches=batches, total=total)


@router.post("", response_model=ChemistryBatchResponse, status_code=201)
def create_chemistry_batch(
    batch_data: ChemistryBatchCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new chemistry batch.
    
    All cost fields and rolls_offset are required.
    """
    batch = ChemistryBatch(**batch_data.model_dump())
    db.add(batch)
    db.commit()
    db.refresh(batch)
    
    return batch


@router.get("/{batch_id}", response_model=ChemistryBatchResponse)
def get_chemistry_batch(
    batch_id: str,
    db: Session = Depends(get_db),
):
    """Get a single chemistry batch by ID."""
    batch = db.query(ChemistryBatch).filter(ChemistryBatch.id == batch_id).first()
    
    if not batch:
        raise HTTPException(status_code=404, detail="Chemistry batch not found")
    
    return batch


@router.put("/{batch_id}", response_model=ChemistryBatchResponse)
def update_chemistry_batch(
    batch_id: str,
    batch_data: ChemistryBatchUpdate,
    db: Session = Depends(get_db),
):
    """
    Update an existing chemistry batch.
    
    Only provided fields will be updated.
    """
    batch = db.query(ChemistryBatch).filter(ChemistryBatch.id == batch_id).first()
    
    if not batch:
        raise HTTPException(status_code=404, detail="Chemistry batch not found")
    
    # Update fields
    update_data = batch_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(batch, field, value)
    
    db.commit()
    db.refresh(batch)
    
    return batch


@router.delete("/{batch_id}", status_code=204)
def delete_chemistry_batch(
    batch_id: str,
    db: Session = Depends(get_db),
):
    """
    Delete a chemistry batch.
    
    Warning: This will leave associated film rolls with invalid chemistry_id references.
    """
    batch = db.query(ChemistryBatch).filter(ChemistryBatch.id == batch_id).first()
    
    if not batch:
        raise HTTPException(status_code=404, detail="Chemistry batch not found")
    
    db.delete(batch)
    db.commit()
    
    return None
