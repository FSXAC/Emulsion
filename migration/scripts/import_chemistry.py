#!/usr/bin/env python3
"""
Import chemistry batches from CSV to Emulsion database.

Usage:
    python import_chemistry.py [--csv-path DATA_PATH] [--dry-run]

This script should be run BEFORE import_rolls.py since rolls reference chemistry batches.
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
from app.models import Base, ChemistryBatch


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
        return 0.0
    
    value_str = value_str.strip().replace("$", "").replace(",", "")
    
    try:
        return float(value_str)
    except ValueError:
        print(f"Warning: Could not parse decimal '{value_str}', using 0.0")
        return 0.0


def parse_integer(value_str):
    """Parse integer values."""
    if not value_str or value_str.strip() == "":
        return 0
    
    try:
        return int(float(value_str.strip()))
    except ValueError:
        print(f"Warning: Could not parse integer '{value_str}', using 0")
        return 0


def import_chemistry_batches(csv_path: str, dry_run: bool = False):
    """Import chemistry batches from CSV file."""
    
    print(f"{'[DRY RUN] ' if dry_run else ''}Starting chemistry batch import from {csv_path}")
    
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
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                try:
                    # Required fields
                    name = row.get('name', '').strip()
                    if not name:
                        print(f"Row {row_num}: Skipping - missing name")
                        skipped += 1
                        continue
                    
                    chemistry_type = row.get('chemistry_type', 'OTHER').strip().upper()
                    if chemistry_type not in ['C41', 'E6', 'BW', 'ECN2', 'OTHER']:
                        print(f"Row {row_num}: Invalid chemistry_type '{chemistry_type}', using 'OTHER'")
                        chemistry_type = 'OTHER'
                    
                    date_mixed = parse_date(row.get('date_mixed', ''))
                    if not date_mixed:
                        print(f"Row {row_num}: Skipping - missing or invalid date_mixed")
                        skipped += 1
                        continue
                    
                    # Optional fields
                    date_retired = parse_date(row.get('date_retired', ''))
                    developer_cost = parse_decimal(row.get('developer_cost', '0'))
                    fixer_cost = parse_decimal(row.get('fixer_cost', '0'))
                    other_cost = parse_decimal(row.get('other_cost', '0'))
                    rolls_offset = parse_integer(row.get('rolls_offset', '0'))
                    notes = row.get('notes', '').strip() or None
                    
                    # Validate at least one cost is provided
                    total_cost = developer_cost + fixer_cost + other_cost
                    if total_cost <= 0:
                        print(f"Row {row_num}: Warning - all costs are 0 for batch '{name}'")
                    
                    # Create chemistry batch object
                    batch = ChemistryBatch(
                        name=name,
                        chemistry_type=chemistry_type,
                        date_mixed=date_mixed,
                        date_retired=date_retired,
                        developer_cost=developer_cost,
                        fixer_cost=fixer_cost,
                        other_cost=other_cost,
                        rolls_offset=rolls_offset,
                        notes=notes,
                    )
                    
                    if not dry_run:
                        db.add(batch)
                        db.flush()  # Flush to get the ID
                    
                    imported += 1
                    print(f"Row {row_num}: {'Would import' if dry_run else 'Imported'} batch '{name}' ({chemistry_type})")
                    
                except Exception as e:
                    print(f"Row {row_num}: Error - {str(e)}")
                    skipped += 1
                    continue
            
            if not dry_run:
                db.commit()
                print(f"\n✅ Successfully imported {imported} chemistry batches")
            else:
                print(f"\n[DRY RUN] Would import {imported} chemistry batches")
            
            if skipped > 0:
                print(f"⚠️  Skipped {skipped} rows due to errors")
            
            return True
            
    except Exception as e:
        print(f"\n❌ Import failed: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Import chemistry batches from CSV")
    parser.add_argument(
        "--csv-path",
        default="../data/chemistry_batches.csv",
        help="Path to chemistry batches CSV file"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview import without making changes"
    )
    
    args = parser.parse_args()
    
    # Convert relative path to absolute
    csv_path = Path(__file__).parent / args.csv_path
    
    success = import_chemistry_batches(str(csv_path), args.dry_run)
    sys.exit(0 if success else 1)
