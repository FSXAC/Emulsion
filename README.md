# 📷 Emulsion - Film Roll Inventory Management

A web-based application for tracking analog film rolls through their lifecycle: from purchase → loading → shooting → developing → scanning.

## Tech Stack

**Backend:**
- Python 3.x + FastAPI
- SQLAlchemy 2.0 + SQLite
- Uvicorn ASGI server

**Frontend:**
- React 19 + Vite 7
- React Router DOM 7
- dnd-kit (drag & drop)
- Tailwind CSS 3
- Framer Motion 11
- axios 1.7

## 🚀 Quick Start

### First Time Setup

1. **Make scripts executable:**
```bash
chmod +x scripts/*.sh
```

2. **Set up Python virtual environment (backend):**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

3. **Install frontend dependencies:**
```bash
cd frontend
npm install
cd ..
```

### Development Mode (Two Servers)

Use this for active development with hot-reload:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Access at: **http://localhost:5173** (Vite proxies API requests to backend on port 8200)

### Production Mode (Single Server)

Use this for local network access from mobile devices:

```bash
# Build frontend (first time or after changes)
./scripts/build-production.sh

# Start server
./scripts/start-production.sh
```

Access at:
- **Local:** http://localhost:8200
- **Network:** http://YOUR_IP:8200 (shown in terminal when server starts)

The production server serves both frontend and backend from port **8200**

## Features

### Film Roll Management
- **Kanban-style board** with drag-and-drop status transitions
- Track rolls from NEW → LOADED → EXPOSED → DEVELOPED → SCANNED
- Film stock metadata (name, format, exposures, order ID)
- Push/pull processing tracking
- Cost calculations (film cost, dev cost, per-shot cost)
- 5-star rating system
- Notes and custom fields
- "Not mine" flag for friend's rolls
- Duplicate functionality for quick entry

### Chemistry Batch Management
- Track chemistry batches with mix and retirement dates
- Automatic roll counter and cost-per-roll calculation
- **C41 development time calculator** (3:30 base + 2% per roll)
- Manual offset adjustment for chemistry usage
- Active/retired batch organization with pagination
- Link to view all rolls using each batch
- Duplicate and retire batch actions

### User Experience
- **Touch-friendly** mobile-responsive design
- **Drag-and-drop** with visual feedback
- **Modal dialogs** for date/chemistry/rating entry
- **Autocomplete** for film stock names and order IDs
- **Loading states** with skeleton screens
- **Toast notifications** for user actions
- **Error handling** with retry options
- **Pagination** for large datasets

## Current Progress

### ✅ Completed (MVP Ready!)

**Backend (Phases 1-4):**
- SQLAlchemy models with computed properties (status, costs, C41 dev time)
- CRUD endpoints for film rolls and chemistry batches
- PATCH endpoints for status transitions (load, unload, assign chemistry, rate)
- Automatic chemistry roll count updates
- Comprehensive validation and error handling
- All endpoints tested and working

**Frontend (Phases 5-11):**
- React + Vite with Tailwind CSS styling
- Drag-and-drop Kanban board with dnd-kit
- Film roll and chemistry CRUD operations
- Status transition modals (date picker, chemistry picker, rating)
- Autocomplete for film stocks and order IDs
- Duplicate functionality for quick data entry
- Chemistry page with active/retired sections
- Pagination for NEW and SCANNED rolls, active/retired batches
- Data migration scripts from spreadsheet
- Loading states with skeleton screens
- Comprehensive error handling and validation

### 🎯 Polish & Launch (Phase 12)

- [X] **12.1** Loading states and skeleton screens
- [X] **12.2** Error handling and validation
- [ ] **12.3** Keyboard shortcuts (optional)
- [ ] **12.4** Basic user documentation
- [ ] **12.5** Auto-start on macOS (optional)
- [ ] **12.6** Database backup script
- [ ] **12.7** 🎬 Start using the app!

## API Endpoints

### Film Rolls
- `GET /api/rolls` - List rolls (filter: `?status=NEW&order_id=42`)
- `POST /api/rolls` - Create roll
- `GET /api/rolls/{id}` - Get roll
- `PUT /api/rolls/{id}` - Update roll
- `DELETE /api/rolls/{id}` - Delete roll
- `PATCH /api/rolls/{id}/load` - Set date_loaded
- `PATCH /api/rolls/{id}/unload` - Set date_unloaded
- `PATCH /api/rolls/{id}/chemistry` - Assign chemistry
- `PATCH /api/rolls/{id}/rating` - Set stars (1-5)

### Chemistry Batches
- `GET /api/chemistry` - List batches (filter: `?active_only=true&chemistry_type=C41`)
- `POST /api/chemistry` - Create batch
- `GET /api/chemistry/{id}` - Get batch
- `PUT /api/chemistry/{id}` - Update batch
- `DELETE /api/chemistry/{id}` - Delete batch

## 🗄️ Database

**Location:** `backend/data/emulsion.db` (SQLite)

**Tables:**
- `film_rolls` - Film roll tracking with computed status
- `chemistry_batches` - Chemistry batch tracking with C41 dev time calculation

**Changing Database Location:**

Edit `backend/app/core/config.py`:
```python
database_url: str = "sqlite:///path/to/your/emulsion.db"
```

## 📊 Data Migration

Import existing data from CSV files (e.g., from Numbers spreadsheet):

```bash
cd migration/scripts

# Import chemistry batches first (required before rolls)
python import_chemistry.py --db-path ../../backend/data/emulsion.db

# Import film rolls
python import_rolls.py --db-path ../../backend/data/emulsion.db

# Validate imported data
python validate.py --db-path ../../backend/data/emulsion.db
```

See `migration/README.md` for CSV format requirements.

## 🏗️ Architecture

### How It Works

**Development Mode:**
```
Browser → Port 5173 (Vite) → Proxy → Port 8200 (FastAPI)
```
- Frontend dev server with hot-reload
- API requests automatically proxied to backend
- Best for active development

**Production Mode:**
```
Browser → Port 8200 (FastAPI)
            ├── /api/* → Backend API
            └── /* → Frontend (React SPA)
```
- Single server serves both frontend and backend
- FastAPI serves built frontend static files
- SPA routing support with fallback to index.html
- Best for local network access (mobile devices)

### Status Derivation Pattern

**Status is computed, not stored.** The `FilmRoll.status` property derives status from field presence:
- **NEW**: No dates, no chemistry, no stars
- **LOADED**: Has `date_loaded`
- **EXPOSED**: Has `date_unloaded`
- **DEVELOPED**: Has `chemistry_id`
- **SCANNED**: Has `stars > 0`

This flexible approach avoids rigid state machines and allows data corrections.

### Computed Properties

Both models use `@property` decorators for on-the-fly calculations (never stored):
- **FilmRoll**: `status`, `dev_cost`, `total_cost`, `cost_per_shot`, `duration_days`
- **ChemistryBatch**: `batch_cost`, `rolls_developed`, `cost_per_roll`, `development_time_formatted`
- **C41 development time:** Base 3:30 + 2% per roll used

## Project Structure

```
emulsion/
├── backend/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Config & database
│   │   ├── models/        # SQLAlchemy models
│   │   └── main.py        # FastAPI app
│   ├── data/              # SQLite database
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # RollsPage, ChemistryPage
│   │   ├── services/      # API clients
│   │   ├── utils/         # Helpers
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── migration/             # Data migration scripts
├── plan.md               # Full architecture plan
└── README.md
```

## Key Components

**Frontend:**
- `FilmRollCard` - Drag-and-drop film roll display
- `StatusColumn` - Kanban column with drop zones
- `AddRollForm` / `EditRollForm` - Roll management
- `AddChemistryForm` / `EditChemistryForm` - Chemistry management
- `SkeletonCard` - Loading state placeholder
- `ErrorMessage` - Consistent error display

**Backend:**
- `FilmRoll` model - Status, cost, duration calculated properties
- `ChemistryBatch` model - Roll count, C41 dev time calculation
- CRUD + PATCH endpoints for all operations

## 📱 Mobile Access (Add to Home Screen)

### iOS (Safari)
1. Open `http://YOUR_IP:8200` in Safari
2. Tap the Share button (square with arrow)
3. Tap "Add to Home Screen"
4. Name it "Emulsion" and tap "Add"

### Android (Chrome)
1. Open `http://YOUR_IP:8200` in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home screen"
4. Name it "Emulsion" and tap "Add"

## 💾 Database Backups

### Manual Backup
```bash
./scripts/backup-database.sh
```

Backups are stored in: `backend/data/backups/`

### Automatic Daily Backups (Optional)

Set up a cron job to run daily at 2 AM:

```bash
crontab -e
```

Add this line (replace `YOUR_PATH` with actual path):
```bash
0 2 * * * /YOUR_PATH/Emulsion/scripts/backup-database.sh
```

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find what's using port 8200
lsof -ti:8200

# Kill the process
kill $(lsof -ti:8200)
```

### Can't Access from Phone
1. Check firewall settings (allow incoming connections for Python/uvicorn)
2. Verify both devices are on same WiFi network
3. Use IP address (not localhost) when accessing from phone
4. Try: `http://YOUR_IP:8200` (find IP with `ipconfig getifaddr en0` on macOS)

### Frontend Not Loading in Production
```bash
# Rebuild frontend
cd frontend
npm run build

# Restart server
cd ..
./scripts/start-production.sh
```

### CORS Errors
Backend is configured to allow all local network origins. If you see CORS errors:
- Check `backend/app/core/config.py` for `cors_origins` settings
- Verify API requests use `/api` prefix

## 🔐 Security Notes

⚠️ **Important**: This setup is for **local network use only**. Do not expose port 8200 directly to the internet without:
- Adding authentication
- Using HTTPS
- Implementing rate limiting
- Adding security headers

## 📚 Documentation

- **[plan.md](plan.md)** - Complete architecture and development plan
- **Backend API:** http://localhost:8200/docs (Swagger UI when running)