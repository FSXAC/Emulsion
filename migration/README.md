# Data Migration

This directory contains scripts and data for migrating from the Numbers spreadsheet to the Emulsion database.

## Directory Structure

```
migration/
├── data/              # CSV exports from Numbers spreadsheet
│   ├── film_rolls.csv        # Export of film rolls data
│   └── chemistry_batches.csv # Export of chemistry batches data
├── scripts/           # Python migration scripts
│   ├── import_rolls.py       # Import film rolls from CSV
│   ├── import_chemistry.py   # Import chemistry batches from CSV
│   └── validate.py           # Validate imported data
└── README.md          # This file
```

## Migration Process

### Phase 11.1: Export Data from Numbers
1. Open your Numbers spreadsheet
2. Export film rolls sheet to CSV → save as `data/film_rolls.csv`
3. Export chemistry batches sheet to CSV → save as `data/chemistry_batches.csv`

### Phase 11.2: Import Film Rolls
```bash
cd migration/scripts
python import_rolls.py
```

### Phase 11.3: Import Chemistry Batches
```bash
cd migration/scripts
python import_chemistry.py
```

### Phase 11.4: Validate Data
```bash
cd migration/scripts
python validate.py
```

## CSV Format Requirements

### film_rolls.csv
Expected columns:
- `order_id` - String (grouping identifier)
- `film_stock_name` - String (e.g., "Kodak Portra 400")
- `film_format` - String (e.g., "35mm", "120")
- `expected_exposures` - Integer (e.g., 36)
- `actual_exposures` - Integer (optional, nullable)
- `date_loaded` - Date (optional, format: YYYY-MM-DD)
- `date_unloaded` - Date (optional, format: YYYY-MM-DD)
- `push_pull_stops` - Decimal (optional, e.g., +1.0, -0.5)
- `chemistry_id` - String (optional, will be mapped during import)
- `stars` - Integer (optional, 1-5)
- `film_cost` - Decimal (e.g., 12.99)
- `not_mine` - Boolean (optional, "true"/"false" or 1/0)
- `notes` - Text (optional)

### chemistry_batches.csv
Expected columns:
- `name` - String (e.g., "C41 Batch #3")
- `chemistry_type` - String (C41, E6, BW, ECN2, OTHER)
- `date_mixed` - Date (format: YYYY-MM-DD)
- `date_retired` - Date (optional, format: YYYY-MM-DD)
- `developer_cost` - Decimal (e.g., 15.00)
- `fixer_cost` - Decimal (e.g., 8.00)
- `other_cost` - Decimal (e.g., 5.00)
- `rolls_offset` - Integer (optional, default 0)
- `notes` - Text (optional)

## Notes

- The import scripts will create UUIDs for all records
- Chemistry batches should be imported before film rolls (for FK relationships)
- The validation script will check:
  - All required fields are present
  - Status calculations match expected values
  - Cost calculations are correct
  - C41 development times are accurate
  - No duplicate records exist

## Backup

Before running migration:
```bash
# Backup existing database (if any)
cp ../backend/data/emulsion.db ../backend/data/emulsion.db.backup
```

After successful migration:
```bash
# Create a clean backup
cp ../backend/data/emulsion.db ../backend/data/emulsion.db.migrated
```
