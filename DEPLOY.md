# 🚀 Deployment Guide

This guide will help you deploy Emulsion to your local network so you can access it from any device (phone, tablet, etc.) on the same network.

## Option 1: Development Servers (Quick Start)

### Step 1: Find Your Local IP Address

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Or use this simpler command:**
```bash
ipconfig getifaddr en0  # WiFi
ipconfig getifaddr en1  # Ethernet
```

Your local IP will look like: `192.168.1.100` or `10.0.0.50`

### Step 2: Start Backend Server

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The `--host 0.0.0.0` flag makes the server accessible from other devices on your network.

### Step 3: Configure Frontend for Network Access

Edit `frontend/vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Add this
    port: 5173,
  }
})
```

### Step 4: Update API Base URL

Edit `frontend/src/services/api.js` and update the base URL to use your local IP:

```javascript
const API_BASE_URL = 'http://YOUR_LOCAL_IP:8000/api';
// Example: const API_BASE_URL = 'http://192.168.1.100:8000/api';
```

### Step 5: Start Frontend Server

```bash
cd frontend
npm run dev
```

### Step 6: Access from Other Devices

On your phone/tablet, open the browser and navigate to:
```
http://YOUR_LOCAL_IP:5173
```

Example: `http://192.168.1.100:5173`

---

## Option 2: Production Build (Recommended)

This serves both frontend and backend from a single server on port 8000.

### Step 1: Build Frontend

```bash
cd frontend
npm run build
```

This creates optimized static files in `frontend/dist/`.

### Step 2: Configure Backend to Serve Frontend

Edit `backend/app/main.py` to add static file serving:

```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

app = FastAPI(title="Emulsion API", version="0.1.0")

# ... existing middleware and routes ...

# Serve static files from frontend build
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")
    
    @app.get("/", include_in_schema=False)
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str = ""):
        # Serve index.html for all non-API routes (SPA routing)
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc"):
            # Let FastAPI handle API routes
            return
        
        # Check if file exists in dist
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        
        # Otherwise serve index.html (SPA catch-all)
        return FileResponse(frontend_dist / "index.html")
```

### Step 3: Update Frontend API Configuration

Edit `frontend/src/services/api.js` to use relative URLs:

```javascript
const API_BASE_URL = '/api';  // Relative URL works when served from same origin
```

### Step 4: Rebuild Frontend

```bash
cd frontend
npm run build
```

### Step 5: Start Backend Server

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Step 6: Access from Any Device

Navigate to `http://YOUR_LOCAL_IP:8000` from any device on your network.

---

## Option 3: Auto-Start on macOS (Optional)

Set up the server to start automatically when your Mac boots.

### Create Launch Agent

Create file: `~/Library/LaunchAgents/com.emulsion.server.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.emulsion.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/YOUR_USERNAME/Dev/Emulsion/backend/venv/bin/uvicorn</string>
        <string>app.main:app</string>
        <string>--host</string>
        <string>0.0.0.0</string>
        <string>--port</string>
        <string>8000</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/YOUR_USERNAME/Dev/Emulsion/backend</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/YOUR_USERNAME/Dev/Emulsion/backend/logs/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/YOUR_USERNAME/Dev/Emulsion/backend/logs/stderr.log</string>
</dict>
</plist>
```

**Replace `YOUR_USERNAME` with your actual username!**

### Create Logs Directory

```bash
mkdir -p ~/Dev/Emulsion/backend/logs
```

### Load the Launch Agent

```bash
launchctl load ~/Library/LaunchAgents/com.emulsion.server.plist
```

### Control Commands

```bash
# Start the service
launchctl start com.emulsion.server

# Stop the service
launchctl stop com.emulsion.server

# Unload (disable auto-start)
launchctl unload ~/Library/LaunchAgents/com.emulsion.server.plist

# Check status
launchctl list | grep emulsion
```

---

## Add to Home Screen (Mobile)

### iOS (Safari)
1. Open `http://YOUR_LOCAL_IP:8000` in Safari
2. Tap the Share button (square with arrow)
3. Tap "Add to Home Screen"
4. Name it "Emulsion" and tap "Add"
5. The app will appear as an icon on your home screen

### Android (Chrome)
1. Open `http://YOUR_LOCAL_IP:8000` in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home screen"
4. Name it "Emulsion" and tap "Add"
5. The app will appear as an icon on your home screen

---

## Database Backup

### Manual Backup

```bash
# Copy database file with timestamp
cp backend/data/emulsion.db backend/data/backups/emulsion-$(date +%Y%m%d-%H%M%S).db
```

### Automated Backup Script

Create `backend/scripts/backup.sh`:

```bash
#!/bin/bash

# Set paths
DB_PATH="$HOME/Dev/Emulsion/backend/data/emulsion.db"
BACKUP_DIR="$HOME/Dev/Emulsion/backend/data/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/emulsion-$TIMESTAMP.db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Copy database
cp "$DB_PATH" "$BACKUP_FILE"

# Keep only last 30 backups
cd "$BACKUP_DIR"
ls -t emulsion-*.db | tail -n +31 | xargs rm -f 2>/dev/null

echo "Backup created: $BACKUP_FILE"
```

Make it executable:
```bash
chmod +x backend/scripts/backup.sh
```

### Schedule Daily Backups (cron)

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /Users/YOUR_USERNAME/Dev/Emulsion/backend/scripts/backup.sh
```

---

## Troubleshooting

### Can't Connect from Other Devices

1. **Check Firewall**: macOS Firewall may block incoming connections
   - System Preferences → Security & Privacy → Firewall
   - Click "Firewall Options"
   - Allow incoming connections for Python/uvicorn

2. **Verify Network**: Ensure both devices are on the same WiFi network

3. **Check Server Logs**: Look for errors in terminal where server is running

### CORS Errors

If you see CORS errors in browser console, verify `backend/app/main.py` has:

```python
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",
    "http://localhost:8000",
    "http://YOUR_LOCAL_IP:5173",
    "http://YOUR_LOCAL_IP:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Database Permission Issues

```bash
# Fix permissions
chmod 644 backend/data/emulsion.db
chmod 755 backend/data
```

---

## Security Notes

⚠️ **Important**: This setup is for **local network use only**. Do not expose these servers directly to the internet without:
- Adding authentication
- Using HTTPS
- Implementing rate limiting
- Adding security headers

For local network use, this setup is secure as long as you trust devices on your network.

---

## Next Steps

- ✅ Access Emulsion from any device on your network
- ✅ Add to home screen for app-like experience  
- ✅ Set up automated backups
- ✅ (Optional) Configure auto-start on boot

Enjoy tracking your film rolls! 📷🎞️
