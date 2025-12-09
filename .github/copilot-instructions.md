# Emulsion - AI Coding Agent Instructions

## Project Overview
Emulsion is a single-user film roll inventory tracker with a FastAPI backend and React frontend. It manages film rolls through a lifecycle from NEW → LOADED → EXPOSED → DEVELOPED → SCANNED using a Kanban-style drag-and-drop interface.

## Architecture

### Status Derivation Pattern (Critical!)
**Status is computed, not stored**. The `FilmRoll.status` property derives status from field presence:
- NEW: no dates, no chemistry, no stars
- LOADED: has `date_loaded`, no `date_unloaded`
- EXPOSED: has `date_unloaded`, no `chemistry_id`
- DEVELOPED: has `chemistry_id`, no `stars`
- SCANNED: has `stars` rating

This flexible approach avoids rigid state machines. See `backend/app/models/film_roll.py` lines 64-78.

### Computed Properties Pattern
Both models use `@property` decorators for calculations:
- **FilmRoll**: `status`, `dev_cost`, `total_cost`, `cost_per_shot`, `duration_days`
- **ChemistryBatch**: `batch_cost`, `rolls_developed`, `cost_per_roll`, `development_time_formatted`
- C41 development time formula: 3:30 base + 2% per roll used

Never store computed values in database - always calculate on-the-fly from source fields.

### API Structure
All routes prefixed with `/api`:
- `/api/rolls` - CRUD plus action endpoints: `/load`, `/unload`, `/assign-chemistry`, `/rate`
- `/api/chemistry` - CRUD with filtering by `active_only` and `chemistry_type`

Frontend services in `src/services/` mirror backend endpoints with axios interceptors for error handling.

## Development Workflows

### Dev Mode (Two Servers)
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```
Access at http://localhost:5173 (Vite proxies `/api` to port 8200)

### Production Mode (Single Server)
```bash
./scripts/build-production.sh    # Build frontend
./scripts/start-production.sh    # Serve from FastAPI on port 8200
```
Backend serves frontend static files with SPA routing fallback (see `main.py` lines 43-67).

### Database Location
SQLite at `backend/data/emulsion.db` (configurable via `database_url` in `config.py`). Use provided backup script for safety.

## Project-Specific Conventions

### Frontend: Drag-and-Drop Status Transitions
- Uses `@dnd-kit` with `<StatusColumn>` drop zones in header (not card area!)
- Drop triggers modal dialogs (DatePickerModal, ChemistryPickerModal, RatingModal)
- Status columns show pagination for NEW/SCANNED only
- See `frontend/src/pages/RollsPage.jsx` and `frontend/src/components/StatusColumn.jsx`

### Frontend: API Configuration
`api.js` auto-switches between dev/prod using `import.meta.env.MODE`:
- Production: empty base URL (relative routes)
- Development: `http://localhost:8200`

Always use `/api` prefix in service files - handled by Vite proxy in dev, backend routing in prod.

### Backend: PATCH Endpoints for Transitions
Status changes use specialized PATCH endpoints instead of generic PUT:
- `PATCH /api/rolls/{id}/load` - Sets `date_loaded`
- `PATCH /api/rolls/{id}/unload` - Sets `date_unloaded`
- `PATCH /api/rolls/{id}/assign-chemistry` - Sets `chemistry_id` (auto-increments batch roll count)
- `PATCH /api/rolls/{id}/rate` - Sets `stars` and optionally `actual_exposures`

This enforces business logic and maintains data integrity (see `rolls.py` lines 160-268).

### Cost Calculations for "Not Mine" Rolls
When `not_mine=true`, `total_cost` only includes `dev_cost` (user doesn't pay for friend's film). See `film_roll.py` lines 94-111.

### Chemistry Roll Count with Offset
`ChemistryBatch.rolls_offset` allows manual adjustment to simulate stale chemistry. `rolls_developed = len(rolls) + rolls_offset` (see `chemistry_batch.py` lines 66-78).

## Key Files
- `backend/app/models/` - SQLAlchemy models with computed properties
- `backend/app/api/schemas/` - Pydantic schemas (separate from models!)
- `backend/app/api/rolls.py` - Film roll endpoints with action PATCHes
- `frontend/src/pages/RollsPage.jsx` - Main Kanban board with drag-and-drop
- `frontend/src/components/StatusColumn.jsx` - Drop zone implementation
- `scripts/` - Production build, start, and backup utilities

## Testing Changes
Always test both dev and production modes when modifying:
1. API routing (check `/api` prefix handling)
2. Static file serving (verify `frontend/dist` after build)
3. Drag-and-drop status transitions (ensure modals appear correctly)
4. Computed properties (validate in API responses)

## Migration & Data
CSV import scripts in `migration/scripts/` for Numbers spreadsheet → SQLite. Import chemistry batches before film rolls (FK dependency).
