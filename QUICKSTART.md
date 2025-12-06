# 🎬 Production Deployment - Quick Start

## What I Just Configured

Your Emulsion app is now ready for production deployment on your local network!

### Files Modified:
1. ✅ `backend/app/main.py` - Added static file serving for frontend
2. ✅ `frontend/src/services/api.js` - Smart API URL handling (dev vs prod)
3. ✅ `frontend/vite.config.js` - Added proxy and build optimization

### Files Created:
1. ✅ `scripts/build-production.sh` - Build script
2. ✅ `scripts/start-production.sh` - Startup script
3. ✅ `scripts/backup-database.sh` - Backup script
4. ✅ `PRODUCTION.md` - Quick reference guide
5. ✅ `DEPLOY.md` - Comprehensive deployment guide

---

## 🚀 Get Started in 3 Steps

### Step 1: Make scripts executable
```bash
chmod +x scripts/*.sh
```

### Step 2: Build for production
```bash
./scripts/build-production.sh
```

### Step 3: Start the server
```bash
./scripts/start-production.sh
```

**That's it!** 🎉

---

## 📱 Access Your App

The server will show you the URLs when it starts:

```
Access the app at:
  - Local:   http://localhost:8000
  - Network: http://192.168.1.XXX:8000
```

### On Your Phone/Tablet:
1. Open Safari/Chrome
2. Go to `http://YOUR_IP:8000` (shown in terminal)
3. Tap "Add to Home Screen"
4. Enjoy! 📷

---

## 🔄 How It Works

### Production Mode (Recommended)
```
Browser → Port 8000 → FastAPI Server
                    ├── /api/* → Backend API
                    └── /* → Frontend (React SPA)
```

All requests go through one server on port 8000. This is the simplest and most reliable setup.

### Development Mode
```
Browser → Port 5173 → Vite Dev Server → Proxy → Port 8000 → FastAPI
```

Frontend and backend run separately. Vite proxies API requests to backend.

---

## 💾 Daily Backups (Recommended)

Set up automatic daily backups:

```bash
crontab -e
```

Add this line:
```
0 2 * * * /Users/YOUR_USERNAME/Dev/Emulsion/scripts/backup-database.sh
```

Replace `YOUR_USERNAME` with your actual username!

---

## 🔧 Common Commands

### Build frontend only
```bash
cd frontend
npm run build
```

### Start backend manually
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Backup database
```bash
./scripts/backup-database.sh
```

### Check what's using port 8000
```bash
lsof -ti:8000
```

### Kill process on port 8000
```bash
kill $(lsof -ti:8000)
```

---

## 🏠 Auto-Start on Boot

Want the server to start automatically when your Mac starts?

See `DEPLOY.md` for complete launchd setup instructions.

Quick version:
1. Create `~/Library/LaunchAgents/com.emulsion.server.plist`
2. Update paths in the plist file
3. Run: `launchctl load ~/Library/LaunchAgents/com.emulsion.server.plist`

---

## 📚 Documentation

- **PRODUCTION.md** - Quick reference for daily use
- **DEPLOY.md** - Complete deployment guide with all options
- **README.md** - Project overview and API docs
- **plan.md** - Full architecture and development plan

---

## 🎯 What's Different from Development

| Aspect | Development | Production |
|--------|-------------|------------|
| **Ports** | Backend: 8000<br>Frontend: 5173 | Single port: 8000 |
| **API URL** | `http://localhost:8000/api` | `/api` (relative) |
| **Frontend** | Hot-reload, source maps | Optimized, minified |
| **Access** | localhost only | Network accessible |
| **Speed** | Slower (dev builds) | Fast (optimized) |

---

## ✅ Verification Checklist

After running the scripts, verify:

- [ ] Frontend builds successfully
- [ ] Server starts without errors
- [ ] Can access http://localhost:8000
- [ ] Can access from phone (http://YOUR_IP:8000)
- [ ] Can create/edit film rolls
- [ ] Can create/edit chemistry batches
- [ ] Drag-and-drop works
- [ ] Data persists after restart

---

## 🆘 Troubleshooting

### "Frontend not built" error
```bash
./scripts/build-production.sh
```

### Can't access from phone
1. Check both devices on same WiFi
2. Check Mac firewall (System Prefs → Security → Firewall)
3. Use IP shown in terminal, not "localhost"

### Changes not showing
```bash
cd frontend
npm run build
# Restart server
```

### Database locked error
Only run one server instance at a time. Kill any existing processes:
```bash
kill $(lsof -ti:8000)
```

---

## 🎉 You're All Set!

Your Emulsion app is production-ready and accessible on your local network!

**Next steps:**
1. Run the scripts
2. Access from your phone
3. Add to home screen
4. Start tracking your film! 📷🎞️

For more details, see `PRODUCTION.md` and `DEPLOY.md`.
