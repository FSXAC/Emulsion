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

## Current Progress

### ✅ Completed (Phases 1-5)

**Backend:**
- SQLAlchemy models with computed properties (status, costs, C41 dev time)
- CRUD endpoints for film rolls and chemistry batches
- PATCH endpoints for status transitions (load, unload, assign chemistry, rate)
- Automatic chemistry roll count updates
- All endpoints tested and working

**Frontend:**
- Vite + React project initialized
- Dependencies installed (dnd-kit, axios, tailwindcss, framer-motion, react-router-dom)
- Tailwind CSS configured with custom film photography palette
- React Router configured with Layout, RollsPage, ChemistryPage
- API client services created (`services/api.js`, `services/rolls.js`, `services/chemistry.js`)

### 🚧 Next Steps (Phase 6: Kanban Board UI)

**Task 6.1:** Create FilmRollCard component
- Display film stock name, format, exposures, dates, costs, chemistry, rating
- Touch-friendly card design with Tailwind classes

**Task 6.2:** Create StatusColumn component
- Column for each status (NEW, LOADED, EXPOSED, DEVELOPED, SCANNED)
- Drop zone visual feedback

**Task 6.3-6.6:** Implement drag-and-drop with dnd-kit
- Set up DndContext with sensors
- Handle drag events and trigger PATCH endpoints
- Fetch and display rolls grouped by status

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

## Resuming Development

1. **Start servers** (see commands above)
2. **Current focus:** Phase 6 - Kanban Board UI
3. **Next task:** Create FilmRollCard component
4. **Reference:** See `plan.md` for full architecture and task list

## Testing

- Backend API: http://localhost:8000/docs (Swagger UI)
- Database: `backend/data/emulsion.db` (SQLite file)