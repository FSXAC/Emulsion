#!/usr/bin/env python3
"""
Validate imported data against expected values.

Usage:
    python validate.py

This script checks:
- All required fields are present
- Status calculations match expected values
- Cost calculations are correct
- C41 development times are accurate
- No unexpected NULL values
- Chemistry relationships are valid
"""

import sys
from pathlib import Path
from decimal import Decimal

# Add backend to Python path
backend_path = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy import func
from app.core.database import SessionLocal, init_db
from app.models import FilmRoll, ChemistryBatch


def validate_chemistry_batches(db):
    """Validate chemistry batch data."""
    print("\n=== Validating Chemistry Batches ===")
    
    batches = db.query(ChemistryBatch).all()
    print(f"Total batches: {len(batches)}")
    
    errors = []
    warnings = []
    
    for batch in batches:
        # Check required fields
        if not batch.name:
            errors.append(f"Batch {batch.id}: Missing name")
        
        # Check costs
        if batch.batch_cost <= 0:
            warnings.append(f"Batch '{batch.name}': Total cost is 0")
        
        # Check C41 development time calculation
        if batch.chemistry_type == 'C41':
            expected_base = 210
            rolls = batch.rolls_developed
            expected_time = expected_base + (rolls * 0.02 * expected_base)
            
            if batch.development_time_seconds is not None:
                diff = abs(batch.development_time_seconds - expected_time)
                if diff > 1:  # Allow 1 second rounding error
                    warnings.append(
                        f"Batch '{batch.name}': C41 dev time mismatch "
                        f"(expected ~{expected_time:.0f}s, got {batch.development_time_seconds}s)"
                    )
        
        # Check if retired but has recent date_mixed
        if batch.date_retired and batch.date_mixed:
            if batch.date_retired < batch.date_mixed:
                errors.append(f"Batch '{batch.name}': date_retired before date_mixed")
    
    if errors:
        print("\n❌ Errors found:")
        for error in errors:
            print(f"  - {error}")
    
    if warnings:
        print("\n⚠️  Warnings:")
        for warning in warnings:
            print(f"  - {warning}")
    
    if not errors and not warnings:
        print("✅ All chemistry batches validated successfully")
    
    return len(errors) == 0


def validate_film_rolls(db):
    """Validate film roll data."""
    print("\n=== Validating Film Rolls ===")
    
    rolls = db.query(FilmRoll).all()
    print(f"Total rolls: {len(rolls)}")
    
    errors = []
    warnings = []
    
    # Count by status
    status_counts = {}
    for roll in rolls:
        status = roll.status
        status_counts[status] = status_counts.get(status, 0) + 1
    
    print(f"\nStatus breakdown:")
    for status, count in sorted(status_counts.items()):
        print(f"  {status}: {count}")
    
    for roll in rolls:
        # Check required fields
        if not roll.order_id:
            errors.append(f"Roll {roll.id}: Missing order_id")
        if not roll.film_stock_name:
            errors.append(f"Roll {roll.id}: Missing film_stock_name")
        if roll.film_cost is None:
            errors.append(f"Roll {roll.id}: Missing film_cost")
        
        # Validate status logic
        status = roll.status
        if status == 'LOADED' and not roll.date_loaded:
            errors.append(f"Roll {roll.id}: Status is LOADED but no date_loaded")
        if status == 'EXPOSED' and not roll.date_unloaded:
            errors.append(f"Roll {roll.id}: Status is EXPOSED but no date_unloaded")
        if status == 'DEVELOPED' and not roll.chemistry_id:
            errors.append(f"Roll {roll.id}: Status is DEVELOPED but no chemistry_id")
        if status == 'SCANNED' and not roll.stars:
            errors.append(f"Roll {roll.id}: Status is SCANNED but no stars")
        
        # Check date logic
        if roll.date_loaded and roll.date_unloaded:
            if roll.date_unloaded < roll.date_loaded:
                errors.append(f"Roll {roll.id}: date_unloaded before date_loaded")
        
        # Check chemistry relationship
        if roll.chemistry_id:
            batch = db.query(ChemistryBatch).filter(
                ChemistryBatch.id == roll.chemistry_id
            ).first()
            if not batch:
                errors.append(f"Roll {roll.id}: References non-existent chemistry batch")
        
        # Check cost calculations (if chemistry is assigned)
        if roll.chemistry_id and roll.dev_cost is None:
            warnings.append(f"Roll {roll.id}: Has chemistry but dev_cost is None")
        
        # Check "not mine" flag with costs
        if roll.not_mine and roll.total_cost is not None:
            # For "not mine" rolls, total_cost should only include dev_cost
            if roll.dev_cost is not None:
                expected_total = roll.dev_cost
                if abs(roll.total_cost - expected_total) > 0.01:
                    warnings.append(
                        f"Roll {roll.id}: 'Not mine' roll total_cost mismatch "
                        f"(expected {expected_total}, got {roll.total_cost})"
                    )
        
        # Check stars range
        if roll.stars is not None and (roll.stars < 1 or roll.stars > 5):
            errors.append(f"Roll {roll.id}: Invalid stars value {roll.stars} (must be 1-5)")
    
    if errors:
        print("\n❌ Errors found:")
        for error in errors:
            print(f"  - {error}")
    
    if warnings:
        print("\n⚠️  Warnings:")
        for warning in warnings:
            print(f"  - {warning}")
    
    if not errors and not warnings:
        print("✅ All film rolls validated successfully")
    
    return len(errors) == 0


def print_summary_stats(db):
    """Print summary statistics."""
    print("\n=== Summary Statistics ===")
    
    # Chemistry stats
    total_batches = db.query(ChemistryBatch).count()
    active_batches = db.query(ChemistryBatch).filter(
        ChemistryBatch.date_retired == None
    ).count()
    
    print(f"\nChemistry Batches:")
    print(f"  Total: {total_batches}")
    print(f"  Active: {active_batches}")
    print(f"  Retired: {total_batches - active_batches}")
    
    # Roll stats
    total_rolls = db.query(FilmRoll).count()
    friend_rolls = db.query(FilmRoll).filter(FilmRoll.not_mine == True).count()
    
    print(f"\nFilm Rolls:")
    print(f"  Total: {total_rolls}")
    print(f"  Yours: {total_rolls - friend_rolls}")
    print(f"  Friends': {friend_rolls}")
    
    # Cost stats
    total_film_cost = db.query(func.sum(FilmRoll.film_cost)).filter(
        FilmRoll.not_mine == False
    ).scalar() or 0
    
    print(f"\nCosts:")
    print(f"  Total film cost (yours): ${total_film_cost:.2f}")


def validate_all():
    """Run all validation checks."""
    print("Starting data validation...")
    
    # Initialize database
    init_db()
    
    # Create session
    db = SessionLocal()
    
    try:
        chemistry_valid = validate_chemistry_batches(db)
        rolls_valid = validate_film_rolls(db)
        
        print_summary_stats(db)
        
        print("\n" + "="*50)
        if chemistry_valid and rolls_valid:
            print("✅ All validations passed!")
            return True
        else:
            print("❌ Validation failed - please review errors above")
            return False
            
    except Exception as e:
        print(f"\n❌ Validation error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = validate_all()
    sys.exit(0 if success else 1)
