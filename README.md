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

## Getting Started

### Backend Server

```sh
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Backend runs at: **http://localhost:8000**
- API docs: http://localhost:8000/docs (Swagger UI)
- Health check: http://localhost:8000/health

### Frontend Server

```sh
cd frontend
npm run dev
```

Frontend runs at: **http://localhost:5173**

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

## Database

**Location:** `backend/data/emulsion.db`

**Tables:**
- `film_rolls` - Film roll tracking
- `chemistry_batches` - Chemistry batch tracking

## Status Logic

Status computed from field presence:
- **NEW**: No dates, no chemistry, no stars
- **LOADED**: Has `date_loaded`
- **EXPOSED**: Has `date_unloaded`
- **DEVELOPED**: Has `chemistry_id`
- **SCANNED**: Has `stars > 0`

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

## Testing

- Backend API: http://localhost:8000/docs (Swagger UI)
- Database: `backend/data/emulsion.db` (SQLite file)