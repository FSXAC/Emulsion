#!/bin/bash

# Emulsion Production Server Startup Script

set -e  # Exit on error

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT/backend"

# Activate virtual environment
source venv/bin/activate

# Check if frontend is built
FRONTEND_DIST="$PROJECT_ROOT/frontend/dist"
if [ ! -d "$FRONTEND_DIST" ]; then
    echo "⚠️  Frontend not built. Building now..."
    cd "$PROJECT_ROOT/frontend"
    npm run build
    cd "$PROJECT_ROOT/backend"
fi

echo "🚀 Starting Emulsion server..."
echo ""
echo "📍 Current directory: $(pwd)"
echo "💾 Database location: $PROJECT_ROOT/backend/data/emulsion.db"
if [ -f "$PROJECT_ROOT/backend/data/emulsion.db" ]; then
    echo "✅ Database file found"
else
    echo "⚠️  Database file not found - will be created on first run"
fi
echo ""
echo "Access the app at:"
echo "  - Local:   http://localhost:8200"
echo "  - Network: http://$(ipconfig getifaddr en0 2>/dev/null || echo "192.168.1.244"):8200"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server (from backend directory)
uvicorn app.main:app --host 0.0.0.0 --port 8200
