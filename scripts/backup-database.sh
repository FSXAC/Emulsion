#!/bin/bash

# Database Backup Script for Emulsion

set -e  # Exit on error

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Set paths
DB_PATH="$PROJECT_ROOT/backend/data/emulsion.db"
BACKUP_DIR="$PROJECT_ROOT/backend/data/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/emulsion-$TIMESTAMP.db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found at: $DB_PATH"
    exit 1
fi

# Copy database
echo "💾 Backing up database..."
cp "$DB_PATH" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Keep only last 30 backups
echo "🧹 Cleaning old backups (keeping last 30)..."
cd "$BACKUP_DIR"
ls -t emulsion-*.db | tail -n +31 | xargs rm -f 2>/dev/null || true

# Show backup info
BACKUP_COUNT=$(ls -1 emulsion-*.db 2>/dev/null | wc -l | xargs)
BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo ""
echo "📊 Backup Statistics:"
echo "   Total backups: $BACKUP_COUNT"
echo "   Latest size:   $BACKUP_SIZE"
echo "   Location:      $BACKUP_DIR"
