#!/bin/bash

# Emulsion Production Deployment Checklist
# Run this to verify your production setup

echo "🎬 Emulsion Production Deployment Checklist"
echo "============================================"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Check if scripts are executable
echo "Checking scripts..."
if [ -x "scripts/build-production.sh" ] && [ -x "scripts/start-production.sh" ] && [ -x "scripts/backup-database.sh" ]; then
    check_pass "Scripts are executable"
else
    check_fail "Scripts need to be made executable"
    echo "   Run: chmod +x scripts/*.sh"
fi

# 2. Check if backend venv exists
echo ""
echo "Checking backend setup..."
if [ -d "backend/venv" ]; then
    check_pass "Virtual environment exists"
else
    check_fail "Virtual environment not found"
    echo "   Run: cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
fi

# 3. Check if frontend node_modules exists
echo ""
echo "Checking frontend setup..."
if [ -d "frontend/node_modules" ]; then
    check_pass "Node modules installed"
else
    check_fail "Node modules not found"
    echo "   Run: cd frontend && npm install"
fi

# 4. Check if frontend is built
echo ""
echo "Checking production build..."
if [ -d "frontend/dist" ]; then
    check_pass "Frontend built for production"
    BUILD_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "frontend/dist" 2>/dev/null || stat -c "%y" "frontend/dist" 2>/dev/null | cut -d' ' -f1-2)
    echo "   Built: $BUILD_TIME"
else
    check_warn "Frontend not built yet"
    echo "   Run: ./scripts/build-production.sh"
fi

# 5. Check if database exists
echo ""
echo "Checking database..."
if [ -f "backend/data/emulsion.db" ]; then
    check_pass "Database exists"
    DB_SIZE=$(du -h "backend/data/emulsion.db" | cut -f1)
    echo "   Size: $DB_SIZE"
else
    check_warn "Database will be created on first run"
fi

# 6. Check if backup directory exists
echo ""
echo "Checking backup setup..."
if [ -d "backend/data/backups" ]; then
    BACKUP_COUNT=$(ls -1 backend/data/backups/emulsion-*.db 2>/dev/null | wc -l | xargs)
    check_pass "Backup directory exists ($BACKUP_COUNT backups)"
else
    check_warn "Backup directory will be created"
fi

# 7. Check network interface
echo ""
echo "Checking network configuration..."
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null)
if [ -n "$LOCAL_IP" ]; then
    check_pass "Network interface found"
    echo "   Local IP: $LOCAL_IP"
    echo "   Access URL: http://$LOCAL_IP:8000"
else
    check_warn "Could not determine local IP"
    echo "   Try: ipconfig getifaddr en1 (ethernet)"
fi

# 8. Check if port 8000 is available
echo ""
echo "Checking port availability..."
PORT_CHECK=$(lsof -ti:8000 2>/dev/null)
if [ -z "$PORT_CHECK" ]; then
    check_pass "Port 8000 is available"
else
    check_warn "Port 8000 is in use"
    echo "   Process ID: $PORT_CHECK"
    echo "   Kill with: kill $PORT_CHECK"
fi

# Summary
echo ""
echo "============================================"
echo "📊 Summary"
echo "============================================"

# Count checks
TOTAL_CHECKS=8
# This is a simplified summary - in a real script you'd track pass/fail counts

echo ""
echo "Next steps:"
echo ""
echo "1. If any checks failed, fix them first"
echo "2. Run: ./scripts/build-production.sh"
echo "3. Run: ./scripts/start-production.sh"
echo "4. Access at: http://localhost:8000"
if [ -n "$LOCAL_IP" ]; then
    echo "5. From phone: http://$LOCAL_IP:8000"
fi
echo ""
echo "📚 See QUICKSTART.md for detailed instructions"
