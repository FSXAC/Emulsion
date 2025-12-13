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
        if ! sudo -n ufw status 2>/dev/null | grep -q "80/tcp"; then
            echo "   Ports 80/443 need to be opened:"
            echo "   sudo ufw allow 80/tcp"
            echo "   sudo ufw allow 443/tcp"
        else
            echo "✅ Ports 80/443 are allowed"
        fi
    else
        echo "✅ UFW firewall is inactive or disabled"
    fi
elif command -v firewall-cmd &> /dev/null; then
    if systemctl is-active --quiet firewalld 2>/dev/null; then
        echo "⚠️  firewalld is active"
        echo "   To allow ports 80/443:"
        echo "   sudo firewall-cmd --permanent --add-port=80/tcp"
        echo "   sudo firewall-cmd --permanent --add-port=443/tcp"
        echo "   sudo firewall-cmd --reload"
    else
        echo "✅ firewalld is inactive"
    fi
else
    echo "ℹ️  No common firewall detected (or macOS)"
fi

# Start Caddy reverse proxy
CADDY_BIN="$PROJECT_ROOT/deployment/caddy"
if [ -f "$CADDY_BIN" ]; then
    echo "🛡️  Starting Caddy reverse proxy..."
    # Start caddy in background, redirect logs
    "$CADDY_BIN" run --config "$PROJECT_ROOT/deployment/Caddyfile" --adapter caddyfile &> "$PROJECT_ROOT/backend/logs/caddy.log" &
    CADDY_PID=$!
    echo "   Caddy running (PID: $CADDY_PID)"
    
    # Setup trap to kill Caddy when script exits
    trap "kill $CADDY_PID" EXIT
else
    echo "⚠️  Caddy binary not found at $CADDY_BIN"
    echo "   Please run: curl -o deployment/caddy \"https://caddyserver.com/api/download?os=linux&arch=amd64\" && chmod +x deployment/caddy"
    exit 1
fi

echo ""
echo "Access the app at:"
echo "  - Local:   http://localhost (or https://localhost)"
echo "  - Network: http://$(hostname -I | awk '{print $1}' 2>/dev/null || ipconfig getifaddr en0 2>/dev/null || hostname -i 2>/dev/null || echo "YOUR_IP")"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server (from backend directory)
# Hardened configuration:
# - Bind to localhost only (Caddy handles external traffic)
# - Proxy headers enabled
# - Limit concurrency and keep-alive timeout
uvicorn app.main:app \
    --host 127.0.0.1 \
    --port 8200 \
    --proxy-headers \
    --forwarded-allow-ips "127.0.0.1" \
    --limit-concurrency 100 \
    --timeout-keep-alive 5
