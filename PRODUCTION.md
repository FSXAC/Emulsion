# 🚀 Quick Production Setup

Your production deployment is now configured! Here's how to use it:

## First Time Setup

### 1. Make scripts executable
```bash
chmod +x scripts/*.sh
```

### 2. Build the frontend
```bash
./scripts/build-production.sh
```

This will:
- Build an optimized production frontend
- Verify backend setup
- Create necessary directories

## Starting the Server

### Simple start (recommended)
```bash
./scripts/start-production.sh
```

The script will:
- Check if frontend is built (builds if needed)
- Start the server on port 8000
- Display your local network IP

### Manual start
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Accessing the App

Once the server is running:

- **On this computer**: http://localhost:8000
- **From other devices**: http://YOUR_LOCAL_IP:8000
  - Find your IP with: `ipconfig getifaddr en0`
  - Example: http://192.168.1.100:8000

## Database Backups

### Manual backup
```bash
./scripts/backup-database.sh
```

### Automatic daily backups (recommended)
```bash
crontab -e
```

Add this line (runs daily at 2 AM):
```
0 2 * * * /Users/YOUR_USERNAME/Dev/Emulsion/scripts/backup-database.sh
```

Replace `YOUR_USERNAME` with your actual macOS username.

## Auto-Start on Boot (Optional)

See `DEPLOY.md` for instructions on setting up launchd to start the server automatically when your Mac boots.

## Update After Code Changes

If you make changes to the code:

```bash
# Update frontend
cd frontend
npm run build

# Restart server
./scripts/start-production.sh
```

## Configuration

### Change API URL (if needed)
Edit `frontend/.env.production`:
```bash
VITE_API_BASE_URL=http://192.168.1.100:8000/api
```

Then rebuild:
```bash
cd frontend
npm run build
```

## Troubleshooting

### Port already in use
```bash
# Find process using port 8000
lsof -ti:8000

# Kill it
kill $(lsof -ti:8000)
```

### Frontend not loading
```bash
# Rebuild frontend
cd frontend
npm run build
```

### Can't access from phone
1. Check firewall settings (System Preferences → Security & Privacy → Firewall)
2. Verify both devices on same WiFi
3. Try: http://YOUR_IP:8000 (not localhost)

## What Changed

Your deployment is now configured with:

✅ **Backend** (`backend/app/main.py`):
- Serves frontend static files from `/frontend/dist`
- SPA routing support
- API available at `/api/*` routes

✅ **Frontend** (`frontend/src/services/api.js`):
- Uses relative URLs in production (`/api`)
- Falls back to `localhost:8000` in development

✅ **Vite Config** (`frontend/vite.config.js`):
- API proxy for development
- Optimized production build settings

✅ **Scripts**:
- `build-production.sh` - Build frontend
- `start-production.sh` - Start server
- `backup-database.sh` - Backup database

## Next Steps

1. Run `./scripts/build-production.sh`
2. Run `./scripts/start-production.sh`
3. Open http://localhost:8000 in your browser
4. Test from phone at http://YOUR_IP:8000
5. Add to home screen on mobile devices

Enjoy! 📷🎞️
