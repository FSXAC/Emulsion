#!/bin/bash
# Quick fix for stale data: Update rolls with stars=0 to NULL

cd backend

sqlite3 data/emulsion.db << 'EOF'
-- Show current rolls with stars=0
SELECT id, film_stock_name, stars FROM film_rolls WHERE stars = 0;

-- Update stars=0 to NULL (unrated)
UPDATE film_rolls SET stars = NULL WHERE stars = 0;

-- Verify update
SELECT COUNT(*) as updated_count FROM film_rolls WHERE stars IS NULL;

EOF

echo "✓ Database updated: stars=0 changed to NULL"
