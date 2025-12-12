"""Development chart API endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.core.database import get_db
from app.models import DevelopmentChart
from app.api.schemas.development_chart import (
    DevelopmentChartCreate,
    DevelopmentChartUpdate,
    DevelopmentChartResponse,
    DevelopmentChartList,
    DevelopmentChartLookupQuery,
    DevelopmentChartLookupResponse,
)

router = APIRouter()


@router.get("", response_model=DevelopmentChartList)
def list_dev_chart_entries(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    film_stock: Optional[str] = Query(None, description="Filter by film stock (case-insensitive partial match)"),
    developer: Optional[str] = Query(None, description="Filter by developer (case-insensitive partial match)"),
    iso_rating: Optional[int] = Query(None, description="Filter by ISO rating (exact match)"),
    db: Session = Depends(get_db),
):
    """
    Get list of all development chart entries with optional filtering.
    
    Supports filtering by film stock, developer, and ISO rating.
    Film stock and developer filters are case-insensitive partial matches.
    """
    query = db.query(DevelopmentChart)
    
    # Apply filters
    if film_stock:
        query = query.filter(DevelopmentChart.film_stock.ilike(f"%{film_stock}%"))
    
    if developer:
        query = query.filter(DevelopmentChart.developer.ilike(f"%{developer}%"))
    
    if iso_rating is not None:
        query = query.filter(DevelopmentChart.iso_rating == iso_rating)
    
    # Order by film stock, then developer, then ISO rating
    query = query.order_by(
        DevelopmentChart.film_stock,
        DevelopmentChart.developer,
        DevelopmentChart.iso_rating
    )
    
    total = query.count()
    entries = query.offset(skip).limit(limit).all()
    
    return DevelopmentChartList(entries=entries, total=total)


@router.post("", response_model=DevelopmentChartResponse, status_code=201)
def create_dev_chart_entry(
    entry_data: DevelopmentChartCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new development chart entry.
    
    Adds a new timing datapoint for a specific combination of film stock,
    developer, ISO rating, dilution ratio, and temperature.
    
    Note: Database-level unique constraint prevents duplicate entries.
    """
    from sqlalchemy.exc import IntegrityError
    
    # Create new entry
    new_entry = DevelopmentChart(**entry_data.model_dump())
    db.add(new_entry)
    
    try:
        db.commit()
        db.refresh(new_entry)
        return new_entry
    except IntegrityError:
        db.rollback()
        # Entry already exists - provide helpful error message
        existing = db.query(DevelopmentChart).filter(
            and_(
                DevelopmentChart.film_stock == entry_data.film_stock,
                DevelopmentChart.developer == entry_data.developer,
                DevelopmentChart.iso_rating == entry_data.iso_rating,
                DevelopmentChart.dilution_ratio == entry_data.dilution_ratio,
                DevelopmentChart.temperature_celsius == entry_data.temperature_celsius,
            )
        ).first()
        
        entry_id = existing.id if existing else "unknown"
        raise HTTPException(
            status_code=409,
            detail=(
                f"Entry already exists for {entry_data.film_stock} + {entry_data.developer} "
                f"at ISO {entry_data.iso_rating}, {entry_data.dilution_ratio}, {entry_data.temperature_celsius}°C. "
                f"Use PUT to update existing entry (ID: {entry_id})"
            )
        )


@router.get("/{entry_id}", response_model=DevelopmentChartResponse)
def get_dev_chart_entry(
    entry_id: str,
    db: Session = Depends(get_db),
):
    """Get a specific development chart entry by ID."""
    entry = db.query(DevelopmentChart).filter(DevelopmentChart.id == entry_id).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail=f"Development chart entry {entry_id} not found")
    
    return entry


@router.put("/{entry_id}", response_model=DevelopmentChartResponse)
def update_dev_chart_entry(
    entry_id: str,
    entry_data: DevelopmentChartUpdate,
    db: Session = Depends(get_db),
):
    """
    Update an existing development chart entry.
    
    Only provided fields will be updated. Omitted fields remain unchanged.
    """
    entry = db.query(DevelopmentChart).filter(DevelopmentChart.id == entry_id).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail=f"Development chart entry {entry_id} not found")
    
    # Update only provided fields
    update_data = entry_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)
    
    db.commit()
    db.refresh(entry)
    
    return entry


@router.delete("/{entry_id}", status_code=204)
def delete_dev_chart_entry(
    entry_id: str,
    db: Session = Depends(get_db),
):
    """Delete a development chart entry."""
    entry = db.query(DevelopmentChart).filter(DevelopmentChart.id == entry_id).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail=f"Development chart entry {entry_id} not found")
    
    db.delete(entry)
    db.commit()
    
    return None


@router.post("/lookup", response_model=DevelopmentChartLookupResponse)
def lookup_dev_time(
    query: DevelopmentChartLookupQuery,
    db: Session = Depends(get_db),
):
    """
    Lookup development time for specific film/developer combination.
    
    Searches for an exact match based on film stock, developer, ISO rating,
    and optionally dilution ratio and temperature. If no exact match is found,
    returns similar entries as suggestions.
    """
    # Build query for exact match
    filters = [
        DevelopmentChart.film_stock == query.film_stock,
        DevelopmentChart.developer == query.developer,
        DevelopmentChart.iso_rating == query.iso_rating,
    ]
    
    if query.dilution_ratio:
        filters.append(DevelopmentChart.dilution_ratio == query.dilution_ratio)
    
    if query.temperature_celsius:
        filters.append(DevelopmentChart.temperature_celsius == query.temperature_celsius)
    
    # Try exact match
    entry = db.query(DevelopmentChart).filter(and_(*filters)).first()
    
    if entry:
        return DevelopmentChartLookupResponse(
            found=True,
            entry=entry,
            suggestions=None
        )
    
    # No exact match - find suggestions (same film + developer, any ISO/dilution/temp)
    suggestions_query = db.query(DevelopmentChart).filter(
        and_(
            DevelopmentChart.film_stock == query.film_stock,
            DevelopmentChart.developer == query.developer,
        )
    ).order_by(
        DevelopmentChart.iso_rating,
        DevelopmentChart.dilution_ratio,
        DevelopmentChart.temperature_celsius
    ).limit(5)
    
    suggestions = suggestions_query.all()
    
    return DevelopmentChartLookupResponse(
        found=False,
        entry=None,
        suggestions=suggestions if suggestions else None
    )


@router.get("/autocomplete/films", response_model=list[str])
def autocomplete_film_stocks(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
    db: Session = Depends(get_db),
):
    """
    Autocomplete film stock names.
    
    Returns distinct film stock names that match the query.
    """
    results = db.query(DevelopmentChart.film_stock).filter(
        DevelopmentChart.film_stock.ilike(f"%{q}%")
    ).distinct().order_by(DevelopmentChart.film_stock).limit(limit).all()
    
    return [r[0] for r in results]


@router.get("/autocomplete/developers", response_model=list[str])
def autocomplete_developers(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
    db: Session = Depends(get_db),
):
    """
    Autocomplete developer names.
    
    Returns distinct developer names that match the query.
    """
    results = db.query(DevelopmentChart.developer).filter(
        DevelopmentChart.developer.ilike(f"%{q}%")
    ).distinct().order_by(DevelopmentChart.developer).limit(limit).all()
    
    return [r[0] for r in results]
