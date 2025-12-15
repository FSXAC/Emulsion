# Tech Context

## Technology Stack

### Backend
- **Language**: Python 3.x
- **Framework**: FastAPI (Async, Type-safe)
- **Database**: SQLite (via SQLAlchemy 2.0 ORM)
- **Validation**: Pydantic v2
- **Server**: Uvicorn (ASGI)

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3
- **DnD**: @dnd-kit (Sortable/Core)
- **HTTP**: Axios
- **Charts**: Recharts

### Deployment
- **Proxy**: Caddy (Production) / Vite Proxy (Development)
- **Process**: Shell scripts in `scripts/`
- **Updates**: Git pull + build script

## Development Setup

### Dependencies
- **Backend**: `backend/requirements.txt` (install in venv)
- **Frontend**: `frontend/package.json` (npm install)

### Running Locally
1. **Backend**: `uvicorn app.main:app --reload` (Port 8200)
2. **Frontend**: `npm run dev` (Port 5173 - Proxies to 8200)

### Production Build
- `scripts/build-production.sh`: Builds React app to `backend/static`.
- `scripts/start-production.sh`: Runs FastAPI serving static files + API on port 8200.

## Technical Constraints
1. **Local Network Use**: Security model assumes trusted local network (no auth currently).
2. **Single User**: No multi-tenant support.
3. **Database**: SQLite is used for simplicity; concurrent writes are rare in single-user usage.
4. **Mobile Performance**: Large lists of images (Canister previews) need optimization (virtualization or pagination) to maintain smooth scrolling on mobile.
