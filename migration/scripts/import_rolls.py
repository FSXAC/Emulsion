#!/usr/bin/env python3
"""
Import film rolls from CSV to Emulsion database.

Usage:
    python import_rolls.py [--csv-path DATA_PATH] [--dry-run]

This script should be run AFTER import_chemistry.py since rolls reference chemistry batches.
"""

import sys
import os
import csv
from datetime import datetime
from pathlib import Path

# Add backend to Python path
backend_path = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, init_db
from app.models import Base, FilmRoll, ChemistryBatch


def parse_date(date_str):
    """Parse date string in various formats."""
    if not date_str or date_str.strip() == "":
        return None
    
    date_str = date_str.strip()
    
    # Try common date formats
    formats = [
        "%Y-%m-%d",      # 2024-12-05
        "%m/%d/%Y",      # 12/05/2024
        "%m/%d/%y",      # 12/05/24
        "%d/%m/%Y",      # 05/12/2024
        "%Y/%m/%d",      # 2024/12/05
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    
    print(f"Warning: Could not parse date '{date_str}', skipping")
    return None


def parse_decimal(value_str):
    """Parse decimal/float values."""
    if not value_str or value_str.strip() == "":
        return None
    
    value_str = value_str.strip().replace("$", "").replace(",", "")
    
    try:
        return float(value_str)
    except ValueError:
        print(f"Warning: Could not parse decimal '{value_str}', using None")
        return None


def parse_integer(value_str):
    """Parse integer values."""
    if not value_str or value_str.strip() == "":
        return None
    
    try:
        return int(float(value_str.strip()))
    except ValueError:
        print(f"Warning: Could not parse integer '{value_str}', using None")
        return None


def parse_boolean(value_str):
    """Parse boolean values."""
    if not value_str or value_str.strip() == "":
        return False
    
    value_str = value_str.strip().lower()
    return value_str in ['true', '1', 'yes', 'y']


def find_chemistry_by_name(db: Session, chemistry_name: str):
    """Find chemistry batch by name."""
    if not chemistry_name or chemistry_name.strip() == "":
        return None
    
    batch = db.query(ChemistryBatch).filter(
        ChemistryBatch.name == chemistry_name.strip()
    ).first()
    
    return batch.id if batch else None


def import_film_rolls(csv_path: str, dry_run: bool = False):
    """Import film rolls from CSV file."""
    
    print(f"{'[DRY RUN] ' if dry_run else ''}Starting film roll import from {csv_path}")
    
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        return False
    
    # Initialize database
    init_db()
    
    # Create session
    db = SessionLocal()
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            imported = 0
            skipped = 0
            chemistry_warnings = set()
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                try:
                    # Required fields
                    order_id = row.get('order_id', '').strip()
                    if not order_id:
                        print(f"Row {row_num}: Skipping - missing order_id")
                        skipped += 1
                        continue
                    
                    film_stock_name = row.get('film_stock_name', '').strip()
                    if not film_stock_name:
                        print(f"Row {row_num}: Skipping - missing film_stock_name")
                        skipped += 1
                        continue
                    
                    film_format = row.get('film_format', '35mm').strip()
                    expected_exposures = parse_integer(row.get('expected_exposures', '36'))
                    if expected_exposures is None:
                        expected_exposures = 36
                    
                    film_cost_str = row.get('film_cost', '')
                    film_cost = parse_decimal(film_cost_str)
                    if film_cost is None:
                        print(f"Row {row_num}: Skipping - missing or invalid film_cost")
                        skipped += 1
                        continue
                    
                    # Optional fields
                    actual_exposures = parse_integer(row.get('actual_exposures', ''))
                    date_loaded = parse_date(row.get('date_loaded', ''))
                    date_unloaded = parse_date(row.get('date_unloaded', ''))
                    push_pull_stops = parse_decimal(row.get('push_pull_stops', '0')) or 0.0
                    stars = parse_integer(row.get('stars', ''))
                    not_mine = parse_boolean(row.get('not_mine', 'false'))
                    notes = row.get('notes', '').strip() or None
                    
                    # Look up chemistry by name
                    chemistry_name = row.get('chemistry_name', '').strip()
                    chemistry_id = None
                    if chemistry_name:
                        chemistry_id = find_chemistry_by_name(db, chemistry_name)
                        if chemistry_id is None and chemistry_name not in chemistry_warnings:
                            print(f"Row {row_num}: Warning - chemistry batch '{chemistry_name}' not found")
                            chemistry_warnings.add(chemistry_name)
                    
                    # Create film roll object
                    roll = FilmRoll(
                        order_id=order_id,
                        film_stock_name=film_stock_name,
                        film_format=film_format,
                        expected_exposures=expected_exposures,
                        actual_exposures=actual_exposures,
                        date_loaded=date_loaded,
                        date_unloaded=date_unloaded,
                        push_pull_stops=push_pull_stops,
                        chemistry_id=chemistry_id,
                        stars=stars,
                        film_cost=film_cost,
                        not_mine=not_mine,
                        notes=notes,
                    )
                    
                    if not dry_run:
                        db.add(roll)
                        db.flush()  # Flush to get the ID
                    
                    imported += 1
                    status_preview = roll.status if not dry_run else "UNKNOWN"
                    print(f"Row {row_num}: {'Would import' if dry_run else 'Imported'} roll '{film_stock_name}' (Order: {order_id}, Status: {status_preview})")
                    
                except Exception as e:
                    print(f"Row {row_num}: Error - {str(e)}")
                    skipped += 1
                    continue
            
            if not dry_run:
                db.commit()
                print(f"\n✅ Successfully imported {imported} film rolls")
            else:
                print(f"\n[DRY RUN] Would import {imported} film rolls")
            
            if skipped > 0:
                print(f"⚠️  Skipped {skipped} rows due to errors")
            
            if chemistry_warnings:
                print(f"\n⚠️  Chemistry batches not found: {', '.join(sorted(chemistry_warnings))}")
                print("   Run import_chemistry.py first, or check chemistry names in CSV")
            
            return True
            
    except Exception as e:
        print(f"\n❌ Import failed: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Import film rolls from CSV")
    parser.add_argument(
        "--csv-path",
        default="../data/film_rolls.csv",
        help="Path to film rolls CSV file"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview import without making changes"
    )
    
    args = parser.parse_args()
    
    # Convert relative path to absolute
    csv_path = Path(__file__).parent / args.csv_path
    
    success = import_film_rolls(str(csv_path), args.dry_run)
    sys.exit(0 if success else 1)
