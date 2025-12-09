#!/bin/bash

# Emulsion Production Build Script
# This builds the frontend and prepares for deployment

set -e  # Exit on error

echo "🎬 Building Emulsion for production..."

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Step 1: Build Frontend
echo ""
echo "📦 Building frontend..."
cd frontend
npm run build
echo "✅ Frontend built successfully"

# Step 2: Verify backend is ready
echo ""
echo "🔍 Verifying backend setup..."
cd "$PROJECT_ROOT/backend"

if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Creating..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    echo "✅ Virtual environment exists"
fi

# Step 3: Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p data/backups
mkdir -p logs

echo ""
echo "✅ Production build complete!"
echo ""
echo "To start the server, run:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --host 0.0.0.0 --port 8200"
echo ""
echo "Then access at: http://YOUR_LOCAL_IP:8200"
