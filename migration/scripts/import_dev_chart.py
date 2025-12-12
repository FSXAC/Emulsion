#!/usr/bin/env python3
"""
Import development chart data from CSV file.

CSV format:
film_stock,developer,iso_rating,dilution_ratio,temperature_celsius,development_time_seconds,agitation_notes,notes

Example:
Ilford HP5 Plus 400,Ilfosol 3,400,1+4,20.0,390,First 30s continuous then 10s every minute,From Ilford datasheet
"""

import sys
import csv
import argparse
from pathlib import Path
from decimal import Decimal

# Add backend to path
backend_path = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models.development_chart import DevelopmentChart


def parse_time_to_seconds(time_str: str) -> int:
    """
    Parse time string to seconds.
    
    Supports formats:
    - "6:30" -> 390 seconds
    - "390" -> 390 seconds
    - "11:00" -> 660 seconds
    
    Args:
        time_str: Time string to parse
        
    Returns:
        Time in seconds
    """
    time_str = time_str.strip()
    
    # If it's just a number, return it as-is
    if time_str.isdigit():
        return int(time_str)
    
    # If it's in MM:SS format
    if ":" in time_str:
        parts = time_str.split(":")
        minutes = int(parts[0])
        seconds = int(parts[1]) if len(parts) > 1 else 0
        return minutes * 60 + seconds
    
    raise ValueError(f"Invalid time format: {time_str}")


def import_from_csv(csv_path: Path, db_path: Path, skip_duplicates: bool = True):
    """
    Import development chart entries from CSV file.
    
    Args:
        csv_path: Path to CSV file
        db_path: Path to SQLite database
        skip_duplicates: If True, skip entries that already exist
    """
    # Create database engine
    engine = create_engine(f"sqlite:///{db_path}")
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Create session
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            added = 0
            skipped = 0
            errors = 0
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (1 is header)
                try:
                    # Parse development time if it's in MM:SS format
                    dev_time = row['development_time_seconds'].strip()
                    if ':' in dev_time:
                        dev_time_seconds = parse_time_to_seconds(dev_time)
                    else:
                        dev_time_seconds = int(dev_time)
                    
                    # Check if entry already exists
                    existing = session.query(DevelopmentChart).filter(
                        DevelopmentChart.film_stock == row['film_stock'].strip(),
                        DevelopmentChart.developer == row['developer'].strip(),
                        DevelopmentChart.iso_rating == int(row['iso_rating']),
                        DevelopmentChart.dilution_ratio == row['dilution_ratio'].strip(),
                        DevelopmentChart.temperature_celsius == Decimal(row['temperature_celsius']),
                    ).first()
                    
                    if existing:
                        if skip_duplicates:
                            print(f"Row {row_num}: Skipping duplicate entry for {row['film_stock']} + {row['developer']} (ISO {row['iso_rating']})")
                            skipped += 1
                            continue
                        else:
                            print(f"Row {row_num}: Updating existing entry for {row['film_stock']} + {row['developer']} (ISO {row['iso_rating']})")
                            existing.development_time_seconds = dev_time_seconds
                            existing.agitation_notes = row.get('agitation_notes', '').strip() or None
                            existing.notes = row.get('notes', '').strip() or None
                            added += 1
                            continue
                    
                    # Create new entry
                    entry = DevelopmentChart(
                        film_stock=row['film_stock'].strip(),
                        developer=row['developer'].strip(),
                        iso_rating=int(row['iso_rating']),
                        dilution_ratio=row['dilution_ratio'].strip(),
                        temperature_celsius=Decimal(row['temperature_celsius']),
                        development_time_seconds=dev_time_seconds,
                        agitation_notes=row.get('agitation_notes', '').strip() or None,
                        notes=row.get('notes', '').strip() or None,
                    )
                    
                    session.add(entry)
                    print(f"Row {row_num}: Added {row['film_stock']} + {row['developer']} (ISO {row['iso_rating']}, {row['dilution_ratio']}, {row['temperature_celsius']}°C) -> {entry.development_time_formatted}")
                    added += 1
                    
                except Exception as e:
                    print(f"Row {row_num}: Error - {e}")
                    errors += 1
            
            # Commit all changes
            session.commit()
            
            print("\n" + "=" * 60)
            print(f"Import complete!")
            print(f"  Added: {added}")
            print(f"  Skipped: {skipped}")
            print(f"  Errors: {errors}")
            print(f"  Total in database: {session.query(DevelopmentChart).count()}")
            
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        session.rollback()
        return False
    finally:
        session.close()
    
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Import development chart data from CSV file",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
CSV Format:
  film_stock,developer,iso_rating,dilution_ratio,temperature_celsius,development_time_seconds,agitation_notes,notes

Example:
  Ilford HP5 Plus 400,Ilfosol 3,400,1+4,20.0,6:30,First 30s continuous then 10s every minute,From Ilford datasheet
  
Note: development_time_seconds can be in seconds (390) or MM:SS format (6:30)
        """
    )
    
    parser.add_argument(
        "csv_file",
        type=Path,
        help="Path to CSV file with development chart data"
    )
    
    parser.add_argument(
        "--db-path",
        type=Path,
        default=Path(__file__).parent.parent.parent / "backend" / "data" / "emulsion.db",
        help="Path to SQLite database (default: backend/data/emulsion.db)"
    )
    
    parser.add_argument(
        "--update-duplicates",
        action="store_true",
        help="Update existing entries instead of skipping them"
    )
    
    args = parser.parse_args()
    
    # Validate paths
    if not args.csv_file.exists():
        print(f"Error: CSV file not found: {args.csv_file}")
        return 1
    
    # Import data
    success = import_from_csv(
        args.csv_file,
        args.db_path,
        skip_duplicates=not args.update_duplicates
    )
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
