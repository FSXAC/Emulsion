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
# Check firewall status (optional, non-blocking)
echo ""
echo "🔥 Firewall Check:"
if command -v ufw &> /dev/null; then
    if sudo -n ufw status 2>/dev/null | grep -q "Status: active"; then
        echo "⚠️  UFW firewall is active"
        if ! sudo -n ufw status 2>/dev/null | grep -q "8200"; then
            echo "   Port 8200 may need to be opened:"
            echo "   sudo ufw allow 8200/tcp"
        else
            echo "✅ Port 8200 is allowed"
        fi
    else
        echo "✅ UFW firewall is inactive or disabled"
    fi
elif command -v firewall-cmd &> /dev/null; then
    if systemctl is-active --quiet firewalld 2>/dev/null; then
        echo "⚠️  firewalld is active"
        echo "   To allow port 8200:"
        echo "   sudo firewall-cmd --permanent --add-port=8200/tcp"
        echo "   sudo firewall-cmd --reload"
    else
        echo "✅ firewalld is inactive"
    fi
elif [ -f /usr/libexec/ApplicationFirewall/socketfilterfw ]; then
    # macOS firewall
    FW_STATUS=$(/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null | grep -i "enabled")
    if [ -n "$FW_STATUS" ]; then
        echo "⚠️  macOS firewall is enabled"
        echo "   Allow Python in: System Settings → Network → Firewall"
    else
        echo "✅ macOS firewall is disabled"
    fi
else
    echo "ℹ️  No common firewall detected"
fi

echo ""
echo "Access the app at:"
echo "  - Local:   http://localhost:8200"
echo "  - Network: http://$(hostname -I | awk '{print $1}' 2>/dev/null || ipconfig getifaddr en0 2>/dev/null || hostname -i 2>/dev/null || echo "YOUR_IP"):8200"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server (from backend directory)
uvicorn app.main:app --host 0.0.0.0 --port 8200
