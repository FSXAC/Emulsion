# Film Roll Inventory Management System - Architecture Plan

## Project Overview
A web-based application for tracking analog film rolls through their lifecycle: from purchase → loading → shooting → developing → scanning. The system will manage film roll metadata, chemistry history, and automated calculations for costs and development times.

**Key User**: Single user (you)  
**Access Pattern**: Browser-based (desktop + mobile)  
**Current State**: Migrating from Numbers spreadsheet with ~2 years of data

---

## Core Requirements

### 1. Film Roll Management
- Track lifecycle: new → loaded → exposed → developed → scanned
- Metadata: dates (loaded/unloaded), film stock details, format, order ID
- Exposure tracking: expected vs actual exposures
- Push/pull processing records
- Cost calculations: film cost, dev cost, total, per-shot
- Rating system (stars)
- Chemistry lookup and association
- Notes field
- "Not mine" flag for friend's rolls

### 2. Chemistry History Management
- Track chemistry batches (developer, fixer, other chemicals)
- Lifecycle: date mixed → date retired
- Cost tracking per batch and per roll
- Roll counter (how many rolls used this batch)
- **Critical**: C41 development time calculation (base 3:30 + 2% per roll used)
- Offset adjustment capability
- Link to film rolls that used this chemistry

### 3. Automation Goals
- Auto-update chemistry roll count when associating with film
- Auto-calculate C41 development time based on chemistry usage (other types: future lookup table)
- **Status derivation**: Inferred from field presence (dates, chemistry_id, stars) - flexible, no strict state machine
- Cost calculations (dev cost, total cost, cost per shot) - **nice-to-have metrics for quick glancing**
- Duration calculations (days loaded)

---

## Recommended Technology Stack

### Architecture: **Full-Stack Web Application (SPA + REST API)**

#### **Backend**
**Selected: Python + FastAPI**
- **FastAPI**: Modern, fast, auto-generated API docs
- **Python**: Your preferred language, excellent for rapid development
- **Pydantic**: Built-in data validation and serialization
- **SQLAlchemy**: Mature, powerful ORM
- **Alembic**: Database migrations

**Why FastAPI**:
- Intuitive Python syntax
- Auto-generated interactive API docs (Swagger UI)
- Async support for better performance
- Excellent type hints and validation
- Easy to test and maintain

#### **Frontend**
**Recommendation: React + Vite (JavaScript or TypeScript)**
- **React**: Component-based, perfect for drag-and-drop UI
- **Vite**: Fast development experience
- **Drag & Drop Libraries**:
  - **dnd-kit**: Modern, accessible, touch-friendly (RECOMMENDED)
  - **react-beautiful-dnd**: Smooth animations
  - **react-dnd**: More low-level control
- **UI Styling**:
  - **Tailwind CSS + Framer Motion**: For playful animations
  - **CSS custom properties**: For tactile interactions

**UX Focus**:
- Kanban-style board with status columns
- Draggable film roll cards
- Drop zones with visual feedback (camera icon for loading)
- Touch-friendly for mobile
- Smooth animations and transitions
- Modal dialogs for date/data entry on drop

#### **Database**
**Selected: SQLite (Local deployment)**
- ✅ Zero configuration, single file
- ✅ Perfect for single-user apps
- ✅ Easy backups (just copy the .db file)
- ✅ Excellent Python support via `sqlite3` or SQLAlchemy
- ✅ No separate database server needed

#### **ORM**
**Selected: SQLAlchemy 2.0**
- Industry standard for Python
- Excellent query capabilities
- Type hints support
- Works seamlessly with FastAPI
- Alembic for migrations

---

## System Architecture

```
┌─────────────────────────────────────────┐
│           Browser (Desktop/Mobile)       │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │   React Frontend (SPA)             │ │
│  │   - Film Roll Management UI        │ │
│  │   - Chemistry Tracking UI          │ │
│  │   - Dashboard/Stats                │ │
│  │   - Mobile-responsive layouts      │ │
```
┌─────────────────────────────────────────────┐
│       Browser (Desktop/Mobile)               │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │   React Frontend (Vite)                │ │
│  │                                        │ │
│  │   Kanban Board UI (dnd-kit)           │ │
│  │   ┌──────┬──────┬──────┬──────────┐   │ │
│  │   │ New  │Loaded│Exposd│Developed │   │ │
│  │   │ 🎞️   │ 📷   │ ✅   │ 🧪       │   │ │
│  │   │ 🎞️   │      │ ✅   │ 🧪       │   │ │
│  │   │ 🎞️   │      │      │          │   │ │
│  │   └──────┴──────┴──────┴──────────┘   │ │
│  │                                        │ │
│  │   - Drag & drop film roll cards       │ │
│  │   - Chemistry management page         │ │
│  │   - Shot metadata integration         │ │
│  │   - Stats dashboard                   │ │
│  └────────────────────────────────────────┘ │
└─────────────────┬──────────────────────────┘
                  │ REST API / HTTP
                  │ http://localhost:8000
┌─────────────────▼──────────────────────────┐
│     Backend Server (FastAPI + Python)      │
│                                             │
│  ┌────────────────────────────────────────┐│
│  │  API Routes (FastAPI)                  ││
│  │  - GET/POST/PUT/DELETE /api/rolls      ││
│  │  - GET/POST/PUT/DELETE /api/chemistry  ││
│  │  - PATCH /api/rolls/{id}/status        ││
│  │  - GET /api/stats                      ││
│  │  - GET /api/shots (future)             ││
│  └────────────────────────────────────────┘│
│                                             │
│  ┌────────────────────────────────────────┐│
│  │  Business Logic (Python)               ││
│  │  - Auto-status transitions             ││
│  │  - Cost calculations                   ││
│  │  - C41 development time (3:30 + 2%)    ││
│  │  - Chemistry roll counter updates      ││
│  │  - Shot metadata parser (future)       ││
│  └────────────────────────────────────────┘│
│                                             │
│  ┌────────────────────────────────────────┐│
│  │  Data Access (SQLAlchemy 2.0)         ││
│  └────────────────────────────────────────┘│
└─────────────────┬──────────────────────────┘
                  │
┌─────────────────▼──────────────────────────┐
│        SQLite Database (local file)        │
│        ~/emulsion_data/emulsion.db         │
### Table: `film_rolls`
```sql
id                 : UUID (PK)
order_id           : String (group related purchases)
film_stock_name    : String
film_format        : String (35mm, 120, etc.)
expected_exposures : Integer
actual_exposures   : Integer (nullable)
date_loaded        : Date (nullable)
date_unloaded      : Date (nullable)
push_pull_stops    : Decimal (nullable, e.g., +1, -0.5)
chemistry_id       : UUID (FK → chemistry_batches, nullable)
stars              : Integer (0-5, nullable)
film_cost          : Decimal
not_mine           : Boolean (default false)
notes              : Text (nullable)
created_at         : Timestamp
updated_at         : Timestamp

# Calculated/derived fields:
- status: Inferred from field presence (flexible, not enforced):
  * NEW: no dates, no chemistry, no stars
  * LOADED: has date_loaded, no date_unloaded
  * EXPOSED: has date_unloaded, no chemistry_id
  * DEVELOPED: has chemistry_id, no stars
  * SCANNED: has stars rating
- dev_cost: chemistry.cost_per_roll (nullable if no chemistry or division-by-zero)
- total_cost: film_cost + dev_cost (nullable if dev_cost is null)
- cost_per_shot: total_cost / actual_exposures (nullable if null total_cost or zero exposures)
- duration_days: date_unloaded - date_loaded (nullable if either date missing)
```

### Table: `chemistry_batches`
```sql
id              : UUID (PK)
name            : String (e.g., "Cinestill C41 Batch 3")
chemistry_type  : String (C41, E6, BW, etc.) -- for future expansion
date_mixed      : Date
date_retired    : Date (nullable)
developer_cost  : Decimal
fixer_cost      : Decimal
other_cost      : Decimal
rolls_offset    : Integer (default 0, for manual adjustments)
created_at      : Timestamp
updated_at      : Timestamp

# Calculated fields:
- batch_cost: developer_cost + fixer_cost + other_cost
- rolls_developed: COUNT(film_rolls where chemistry_id = this.id) + rolls_offset
- cost_per_roll: batch_cost / rolls_developed
- development_time_seconds: 210 + ((rolls_developed + rolls_offset) * 0.02 * 210) # ONLY for C41
- development_time_formatted: "3:30" → "3:43" etc.

Note: rolls_offset allows manual adjustment (e.g., to simulate stale chemistry usage)
```

**C41 Development Time Calculation**:
```python
def calc_c41_dev_time(rolls_developed: int) -> str:
    base_seconds = 210  # 3 min 30 sec
    additional = rolls_developed * 0.02 * base_seconds
    total_seconds = base_seconds + additional
    minutes = int(total_seconds // 60)
    seconds = int(total_seconds % 60)
    return f"{minutes}:{seconds:02d}"
### Table: `shots_metadata` (Future Integration)
```sql
id              : UUID (PK)
roll_id         : UUID (FK → film_rolls)
frame_number    : Integer
date_taken      : Timestamp
## Key Features & UI Flows

### 1. Film Roll Kanban Board (Main View)
**Layout**: Drag-and-drop columns for each status
```
┌─────────┬─────────┬─────────┬───────────┬─────────┐
│   NEW   │ LOADED  │ EXPOSED │DEVELOPED  │ SCANNED │
│   🎞️    │   📷    │   ✅    │   🧪      │   ⭐    │
├─────────┼─────────┼─────────┼───────────┼─────────┤
│ [Roll1] │ [Roll5] │ [Roll8] │ [Roll12]  │[Roll15] │
│ Portra  │ HP5     │ Ektar   │ Gold 200  │ Portra  │
│ 400 36  │ 400 36  │ 100 36  │ 36exp     │ 400 36  │
│         │         │         │ C41 #3    │ ⭐⭐⭐⭐ │
├─────────┼─────────┼─────────┼───────────┼─────────┤
│ [Roll2] │         │ [Roll9] │ [Roll13]  │[Roll16] │
│ ...     │         │ ...     │ ...       │ ...     │
└─────────┴─────────┴─────────┴───────────┴─────────┘
```

**Interactions** (Trello-style drag-and-drop):
- **Drag Roll → LOADED column**: Auto-prompts date picker if no `date_loaded` → sets `date_loaded`
- **Drag Roll → EXPOSED column**: Auto-prompts date picker if no `date_unloaded` → sets `date_unloaded`
- **Drag Roll → DEVELOPED column**: Auto-prompts chemistry picker if no `chemistry_id` → sets `chemistry_id` (auto-increments roll count)
- **Drag Roll → SCANNED column**: Auto-prompts rating dialog if no `stars` → sets `stars`
- **Drag anywhere**: If required fields present, transition succeeds without prompt
- **Click card**: Opens detail view/edit modal
- **Add button (+)**: Create new roll (opens form modal)

**"Not Mine" Rolls**:
- Display with friend icon overlay
- **Count toward chemistry roll counter** (they use chemistry)
- **Exclude film_cost from total_cost** (user doesn't pay for friend's film)
- Show dev_cost only in cost calculations

**Visual Feedback**:
- Drop zones highlight on drag-over
- Cards have smooth animations (Framer Motion)
- Haptic feedback on mobile (if supported)
- Toast notifications for actions ("Roll loaded on 2024-12-04")

### 2. Film Roll Card (Component)
```
┌─────────────────────┐
│ Kodak Portra 400    │ ← Film stock name
│ 35mm • 36 exp       │ ← Format & exposures
│ Order #42           │ ← Order ID
├─────────────────────┤
│ 📅 Nov 28 → Dec 3   │ ← Dates (if loaded/unloaded)
│ 💰 $12 • $0.33/shot │ ← Costs
│ 🧪 C41 Batch #3     │ ← Chemistry (if developed)
│ ⭐⭐⭐⭐            │ ← Rating (if scanned)
└─────────────────────┘
```

**Touch-friendly**: Cards are 150px+ wide for easy dragging on mobile

### 3. Add/Edit Film Roll Modal
- Film stock name (autocomplete from existing)
- Format dropdown (35mm, 120, etc.)
- Expected exposures
- Order ID (autocomplete)
- Film cost
- Push/pull stops
- "Not mine" checkbox
- Notes textarea
- **Live cost preview** at bottom

### 4. Chemistry Management Page
- **Simple form-based UI** (no drag-and-drop for chemistry)
- List of chemistry batches (active highlighted)
- Show C41 dev time based on rolls_developed + rolls_offset
- Display cost per roll (handle division-by-zero gracefully)
- Retire chemistry action
- Link to view rolls that used each batch
## Deployment (Local Only)

### Selected: Local Development Server

**Setup**:
- Backend: `uvicorn main:app --reload` (FastAPI dev server)
- Frontend: `npm run dev` (Vite dev server)
- Access: `http://localhost:5173` (frontend) → `http://localhost:8000` (backend API)
- Database: SQLite file in `~/emulsion_data/emulsion.db`

**Production-style Local Setup** (optional):
- Use `systemd` service (Linux) or `launchd` (macOS) to auto-start on boot
- Backend: Serve via Gunicorn/Uvicorn
- Frontend: Build production bundle, serve via backend static files
- Single port access: `http://localhost:8000`

**Backup Strategy**:
- SQLite database is a single file - easy to backup
- Cron job or manual copy to cloud storage (Dropbox, iCloud, etc.)
- Git repo for code + database file (if you want versioning)

**Mobile Access on Local Network**:
- Find your computer's local IP (e.g., `192.168.1.100`)
- Access from phone: `http://192.168.1.100:5173`
- Make responsive for mobile browser
- Optional: Add to home screen as PWA0 + (rolls_developed * 0.02 * 210) # for C41
```

### Table: `film_stocks` (Optional reference data)
```sql
id              : UUID (PK)
name            : String (e.g., "Kodak Portra 400")
format          : String (35mm, 120)
manufacturer    : String
default_exposures: Integer
is_color        : Boolean
notes           : Text
```

### Relationships
- `film_rolls.chemistry_id` → `chemistry_batches.id` (many-to-one)
- Potential: `film_rolls.film_stock_id` → `film_stocks.id` (optional normalization)

---

## Frontend Framework Considerations

Since you're not familiar with Node/TS, you have options:

### Option 1: React (JavaScript, minimal TypeScript)
**Pros**: 
- Most popular, tons of resources
- Great drag-and-drop libraries (dnd-kit)
- You can write mostly JS, minimal TS
- Excellent mobile support

**Learning curve**: Moderate (JSX, hooks, state management)

### Option 2: Python-based Frontend (Streamlit, Gradio, Reflex)
**Pros**:
- Pure Python, no JavaScript needed
- Rapid prototyping

**Cons**:
- Limited drag-and-drop UX capabilities
- Less tactile/playful interactions
- Not ideal for Kanban board UX you want

**Verdict**: Not recommended for your playful drag-drop UX

### Option 3: HTMX + Alpine.js (minimal JS)
**Pros**:
- Mostly server-side rendered (Python templates)
- Very minimal JavaScript
- FastAPI serves HTML directly

**Cons**:
- Drag-and-drop is harder to implement
- Less smooth animations

**Verdict**: Could work but limits the tactile UX

### **Recommendation**: Stick with React (JavaScript)
- You can learn just enough React for this project
- Copy/paste drag-drop examples from dnd-kit docs
- Focus on Python backend (your comfort zone)
- Frontend can be simple: just drag-drop + formsing spreadsheet data
- [ ] Search and filtering
- [ ] Sorting on all columns
- [ ] Notes and editing history
- [ ] Backup/export functionality

### Phase 4: Enhancement
- [ ] PWA support (offline access)
- [ ] Statistics dashboard
- [ ] Photo gallery integration (link scanned images?)
- [ ] Push notifications (chemistry expiring?)
- [ ] Batch operations (mark multiple rolls)

---

## Deployment Options

### For Single User:

**Option 1: Self-hosted (Recommended)**
- Run on personal computer/NAS/Raspberry Pi
- Access via local network (http://192.168.x.x:3000)
- Use ngrok or Tailscale for remote access
- **Pros**: Free, full control, data privacy
- **Cons**: Requires keeping server running

**Option 2: Cloud VPS (DigitalOcean, Linode)**
- Small $5-6/month droplet
- Deploy with Docker
- Set up domain + SSL
- **Pros**: Always accessible, professional
- **Cons**: Monthly cost, slight overkill for single user

**Option 3: Platform as a Service (Fly.io, Railway, Render)**
- Free tier available for small apps
- Automatic deployments from Git
- **Pros**: Easy deployment, free/cheap
- **Cons**: Cold starts on free tier, potential costs

**Option 4: Hybrid - Frontend on Vercel/Netlify + Backend self-hosted**
- Free frontend hosting
- Backend on home network
- **Pros**: Best of both worlds
- **Cons**: More complex setup

---

## Alternative Architectures (Considered)

### Local-First App (Electron/Tauri + SQLite)
**Pros**: 
- Truly offline-first
- No server needed
- Desktop-native experience

**Cons**:
## Recommended Next Steps

1. ✅ **Architecture validated** - Python + FastAPI + React + SQLite + Local
2. **Set up backend**:
   - Create Python virtual environment
   - Install FastAPI, SQLAlchemy, Uvicorn, Alembic
   - Set up project structure
   - Define SQLAlchemy models (film_rolls, chemistry_batches)
   - Create Alembic migrations
   - Build basic CRUD endpoints
3. **Set up frontend**:
   - Initialize Vite + React project
   - Install dnd-kit, Tailwind CSS, Framer Motion
   - Create basic kanban board layout
   - Test drag-and-drop functionality
4. **Implement core backend logic**:
   - Status calculation function
   - C41 development time calculator
## Questions Answered

1. ✅ **Tech preference**: Python (FastAPI)
2. ✅ **Deployment**: Local only
3. ✅ **C41 calculation**: Only for C41, other chemistry types will use lookup table (future)
4. ✅ **Image storage**: No images, but future shot metadata integration from mobile app
5. ✅ **UX style**: Trello-style drag-and-drop Kanban board with auto-prompts
6. ✅ **Status logic**: Flexible, inferred from field presence (not strict state machine)
7. ✅ **Cost calculations**: Nice-to-have metrics, gracefully handle edge cases (show null/"N/A")
8. ✅ **"Not mine" rolls**: Count toward chemistry usage, exclude film cost, show friend icon
9. ✅ **rolls_offset**: Adjusts effective roll count for dev time calculation (stale chemistry)
10. ✅ **Future features**: Out of scope for MVP (offline, sharing, advanced stats, PWA)

## Phase 1 Scope (MVP - Keep It Simple)

**In Scope**:
- ✅ Film roll CRUD operations
- ✅ Chemistry batch management
- ✅ Drag-and-drop Kanban board UI
- ✅ Auto-status calculation
- ✅ C41 development time calculator
- ✅ Cost calculations
- ✅ Import existing spreadsheet data

**Out of Scope (Future)**:
- ❌ Shot metadata integration
- ❌ Camera tracking
- ❌ Historical audit logs
- ❌ Advanced statistics dashboard
- ❌ Order management views

**Tech Comfort**:
- ✅ You have JavaScript experience → React will be manageable
- ✅ Focus on Python backend (your strength)
- ✅ Copy/adapt React drag-drop examples

---

## Development Todo List

### Phase 1: Backend Foundation
- [X] 1.1 Set up Python virtual environment (venv)
- [X] 1.2 Verify backend project structure (backend/ already exists)
- [X] 1.3 Install core dependencies: FastAPI, SQLAlchemy, Uvicorn, Pydantic, Alembic
- [X] 1.4 Create database models (film_rolls, chemistry_batches)
- [X] 1.5 Set up SQLite database connection
- [X] 1.6 Create basic FastAPI app with health check endpoint
- [X] 1.7 Test backend server runs successfully

### Phase 2: Backend API - Film Rolls
- [X] 2.1 Implement GET /api/rolls (list all rolls)
- [X] 2.2 Implement POST /api/rolls (create new roll)
- [X] 2.3 Implement GET /api/rolls/{id} (get single roll)
- [X] 2.4 Implement PUT /api/rolls/{id} (update roll)
- [X] 2.5 Implement DELETE /api/rolls/{id} (delete roll)
- [X] 2.6 Add status calculation logic (computed property)
- [X] 2.7 Add cost calculation helpers (dev_cost, total_cost, cost_per_shot)
- [ ] 2.8 Test all endpoints with sample data **← NEXT**

### Phase 3: Backend API - Chemistry
- [ ] 3.1 Implement GET /api/chemistry (list all batches)
- [ ] 3.2 Implement POST /api/chemistry (create batch)
- [ ] 3.3 Implement PUT /api/chemistry/{id} (update batch)
- [ ] 3.4 Implement DELETE /api/chemistry/{id} (delete batch)
- [ ] 3.5 Add rolls_developed calculation
- [ ] 3.6 Add C41 development time calculator function
- [ ] 3.7 Test chemistry endpoints

### Phase 4: Backend - Roll/Chemistry Integration
- [ ] 4.1 Add PATCH /api/rolls/{id}/load endpoint (set date_loaded)
- [ ] 4.2 Add PATCH /api/rolls/{id}/unload endpoint (set date_unloaded)
- [ ] 4.3 Add PATCH /api/rolls/{id}/chemistry endpoint (associate chemistry)
- [ ] 4.4 Auto-increment chemistry roll count when associated
- [ ] 4.5 Add PATCH /api/rolls/{id}/rating endpoint (set stars)
- [ ] 4.6 Test status transitions work correctly

### Phase 5: Frontend Foundation
- [ ] 5.1 Initialize Vite + React project (frontend/)
- [ ] 5.2 Install dependencies: dnd-kit, axios, tailwindcss, framer-motion
- [ ] 5.3 Configure Tailwind CSS
- [ ] 5.4 Create basic app structure and routing
- [ ] 5.5 Set up API client (axios with base URL)
- [ ] 5.6 Test frontend dev server runs

### Phase 6: Frontend - Kanban Board UI
- [ ] 6.1 Create FilmRollCard component
- [ ] 6.2 Create StatusColumn component (New, Loaded, Exposed, etc.)
- [ ] 6.3 Set up dnd-kit drag-and-drop context
- [ ] 6.4 Implement drag-and-drop between columns
- [ ] 6.5 Fetch rolls from API and display in columns
- [ ] 6.6 Test drag-drop UI works (no API calls yet)

### Phase 7: Frontend - Actions & Modals
- [ ] 7.1 Create DatePickerModal component
- [ ] 7.2 Create ChemistryPickerModal component
- [ ] 7.3 Create RatingModal component (star selector)
- [ ] 7.4 Wire up drag-to-load action (calls PATCH /load)
- [ ] 7.5 Wire up drag-to-expose action (calls PATCH /unload)
- [ ] 7.6 Wire up drag-to-chemistry action (calls PATCH /chemistry)
- [ ] 7.7 Wire up rating action (calls PATCH /rating)
- [ ] 7.8 Add toast notifications for success/errors

### Phase 8: Frontend - Forms
- [ ] 8.1 Create AddRollForm component
- [ ] 8.2 Create EditRollForm component
- [ ] 8.3 Create AddChemistryForm component
- [ ] 8.4 Implement autocomplete for film stock names
- [ ] 8.5 Implement autocomplete for order IDs
- [ ] 8.6 Show live cost calculations in forms

### Phase 9: Frontend - Chemistry Management
- [ ] 9.1 Create Chemistry page/view
- [ ] 9.2 Display list of chemistry batches
- [ ] 9.3 Show roll count and C41 dev time for each batch
- [ ] 9.4 Add C41 development timer widget
- [ ] 9.5 Implement retire chemistry action
- [ ] 9.6 Link to view rolls that used each batch

### Phase 10: Mobile Responsiveness
- [ ] 10.1 Make kanban board responsive (stack columns on mobile)
- [ ] 10.2 Ensure cards are touch-friendly (min 48px tap targets)
- [ ] 10.3 Test drag-and-drop on mobile browser
- [ ] 10.4 Optimize modals for mobile screens
- [ ] 10.5 Add swipe gestures for quick actions (optional)

### Phase 11: Data Migration
- [ ] 11.1 Export existing Numbers spreadsheet to CSV
- [ ] 11.2 Write Python import script for film rolls
- [ ] 11.3 Write Python import script for chemistry batches
- [ ] 11.4 Run import and validate data integrity
- [ ] 11.5 Verify all calculations match spreadsheet

### Phase 12: Polish & Launch
- [ ] 12.1 Add loading states and skeleton screens
- [ ] 12.2 Improve error handling and validation
- [ ] 12.3 Add keyboard shortcuts (optional)
- [ ] 12.4 Write basic user documentation
- [ ] 12.5 Set up auto-start on macOS (launchd, optional)
- [ ] 12.6 Create backup script for database
- [ ] 12.7 🎬 Start using the app!
   - CRUD endpoints for chemistry
   - Roll counter updates on association
   - C41 timer widget
7. **Import existing data**:
   - Export Numbers spreadsheet to CSV
   - Write Python import script
   - Validate data integrity
8. **Polish & mobile optimization**:
   - Responsive design for mobile
   - Touch-friendly interactions
   - Animations and transitions
9. **Future enhancements**:
   - Shot metadata integration
   - Statistics dashboard
   - Data export/backup automation

**Verdict**: Would still feel like spreadsheet, not worth the limitation

### No-Code/Low-Code (Airtable, Notion, Baserow)
**Pros**: 
- Fast setup
- Built-in UI

**Cons**:
- Limited automation logic (C41 calculation tricky)
- Less flexibility
- Potential monthly costs

**Verdict**: Could work but custom calculations might be challenging

---

## Technology Alternatives by Preference

### If you prefer Python:
- **Backend**: FastAPI + SQLAlchemy + SQLite
- **Frontend**: Still React (or Vue) - Python not ideal for frontend
- **Deployment**: Easier to self-host on Linux

### If you want simplest possible:
- **Stack**: SvelteKit (full-stack in one framework)
- **Database**: SQLite
- **Deployment**: Single deployment artifact

### If you want bleeding-edge modern:
- **Frontend**: Svelte 5 or Solid.js
- **Backend**: Bun + Hono (super fast)
- **Database**: Turso (SQLite in the cloud)
- **ORM**: Drizzle

---

## Recommended Next Steps

1. **Validate architecture**: Confirm tech stack preferences
2. **Set up development environment**: 
   - Initialize Node.js + TypeScript project
   - Set up Vite + React
   - Configure Prisma + SQLite
3. **Design database schema in detail**: Finalize field types, constraints
4. **Create API contract**: Define REST endpoints
5. **Build core backend**: Database models + basic CRUD
6. **Build core frontend**: Roll list + chemistry list views
7. **Implement business logic**: Status transitions, calculations
8. **Import existing data**: Write migration script from Numbers export
9. **Polish UI**: Make it mobile-friendly
10. **Deploy**: Choose deployment option and ship it

---

## Questions to Consider

1. **Do you want to keep historical data?** (e.g., when roll status changes, log the change)
2. **Image storage?** Do you want to attach scanned photos to rolls in the future?
3. **Multiple chemistry types?** The C41 2% calculation - does this apply to all chemistry or just color?
4. **Sharing?** Any chance you'd want to share this with photography friends later?
5. **Offline support?** Critical to have offline access while shooting?
6. **Data export?** Want periodic backups exported to CSV/JSON?

---

## Cost Estimate

**Development Time**: ~2-4 weeks part-time for MVP
**Ongoing Costs**:
- Self-hosted: $0 (electricity/internet you already pay)
- Cloud hosted: $0-6/month
- Domain (optional): $12/year

**Total**: Likely free to run, mainly time investment upfront.

---

*This plan prioritizes simplicity, maintainability, and your specific single-user use case while keeping the door open for future enhancements.*

---

## Implementation Log

### Task 1.4: Create Database Models
**Files Created:**
- `backend/app/models/base.py` - Base model configuration with `DeclarativeBase`, `TimestampMixin` (created_at/updated_at), and UUID generation utility
- `backend/app/models/film_roll.py` - `FilmRoll` model with all schema fields and calculated properties:
  - `status` property: Derives status from field presence (NEW/LOADED/EXPOSED/DEVELOPED/SCANNED)
  - `dev_cost`, `total_cost`, `cost_per_shot`, `duration_days` properties with null handling
  - Special logic for "not mine" rolls (excludes film_cost from total_cost)
- `backend/app/models/chemistry_batch.py` - `ChemistryBatch` model with:
  - Cost tracking fields and `rolls_offset` for manual adjustments
  - `batch_cost`, `rolls_developed`, `cost_per_roll` calculated properties
  - `calc_c41_dev_time()` method for C41 development time calculation
  - `development_time_seconds` and `development_time_formatted` properties
- `backend/app/models/__init__.py` - Module exports for easy imports

**What It Does:**
Defines the SQLAlchemy ORM models that map Python classes to database tables. Implements all business logic for status derivation, cost calculations, and C41 development time as computed properties. Handles edge cases gracefully by returning None for division-by-zero or missing data scenarios.

### Task 1.5: Set Up SQLite Database Connection
**Files Created:**
- `backend/app/core/config.py` - Application settings using Pydantic Settings:
  - Loads configuration from environment variables or `.env` file
  - Database URL defaults to `sqlite:///~/emulsion_data/emulsion.db`
  - `get_database_path()` method creates database directory if needed
  - CORS origins configuration
- `backend/app/core/database.py` - Database connection and session management:
  - SQLAlchemy engine with SQLite pragma for foreign key constraints
  - `SessionLocal` session factory for database operations
  - `get_db()` dependency function for FastAPI endpoints
  - `init_db()` function to create all tables on startup
- `backend/app/core/__init__.py` - Core module exports
- `backend/.env.example` - Example environment configuration file

**Files Modified:**
- `backend/app/main.py` - Added database initialization on startup, imported settings for CORS configuration

**What It Does:**
Establishes SQLite database connection with proper configuration for local single-user deployment. The database file will be created at `backend/data/emulsion.db` relative to the project directory. Enables foreign key constraints (disabled by default in SQLite) and provides a dependency injection pattern (`get_db()`) for database sessions in FastAPI endpoints. Automatically creates tables on application startup if they don't exist.

### Task 1.6: Create Basic FastAPI App with Health Check Endpoint
**Files Modified:**
- `backend/app/main.py` - Enhanced health check endpoint to include database connectivity check

**What It Does:**
Completes the basic FastAPI application setup with a comprehensive health check endpoint. The `/health` endpoint now returns:
- `status`: "healthy" if database is connected, "degraded" otherwise
- `database`: Connection status ("connected" or "disconnected")
- `version`: API version

The application includes:
- Root endpoint (`/`) returning API information
- Health check endpoint (`/health`) for monitoring
- CORS middleware configured for local frontend development
- Database initialization on startup via `@app.on_event("startup")`
- Auto-generated API docs at `/docs` (Swagger UI) and `/redoc` (ReDoc)

### Task 1.7: Test Backend Server Runs Successfully
**Test Results:**
✅ Server starts successfully with `uvicorn app.main:app --reload`
✅ Database file created at `backend/data/emulsion.db`
✅ Database tables created automatically on startup (`film_rolls`, `chemistry_batches`)
✅ Health check endpoint returns `{"status":"healthy","database":"connected","version":"0.1.0"}`
✅ Root endpoint accessible at http://localhost:8000
✅ Interactive API documentation available at http://localhost:8000/docs

**What Was Verified:**
- SQLAlchemy engine connects to SQLite database successfully
- Foreign key constraints enabled (SQLite pragma applied)
- Database tables created with proper schema (UUIDs, timestamps, relationships)
- FastAPI application starts without errors
- CORS middleware configured for frontend access

**Phase 1 Complete!** Backend foundation is ready. Ready to move to Phase 2: Backend API - Film Rolls.

### Task 2.1-2.7: Film Rolls API Implementation
**Files Created:**
- `backend/app/api/__init__.py` - API router configuration with `/api` prefix
- `backend/app/api/schemas/__init__.py` - Pydantic schemas package exports
- `backend/app/api/schemas/film_roll.py` - Film roll Pydantic schemas:
  - `FilmRollBase`: Base schema with all fields
  - `FilmRollCreate`: Schema for POST requests (all required fields)
  - `FilmRollUpdate`: Schema for PUT requests (all fields optional)
  - `FilmRollResponse`: Response schema with computed fields (status, costs, duration)
  - `FilmRollList`: Schema for list responses with pagination
- `backend/app/api/schemas/chemistry_batch.py` - Chemistry batch schemas (for Phase 3)
- `backend/app/api/rolls.py` - Film rolls CRUD endpoints:
  - `GET /api/rolls` - List all rolls with pagination and filtering (skip, limit, status, order_id)
  - `POST /api/rolls` - Create new roll with validation
  - `GET /api/rolls/{roll_id}` - Get single roll by ID
  - `PUT /api/rolls/{roll_id}` - Update existing roll (partial updates supported)
  - `DELETE /api/rolls/{roll_id}` - Delete roll (returns 204 No Content)
- `backend/app/api/chemistry.py` - Placeholder for Phase 3

**Files Modified:**
- `backend/app/main.py` - Included API router, all endpoints now available under `/api` prefix

**What It Does:**
Implements complete CRUD API for film rolls with:
- **Validation**: Pydantic schemas validate all input data (field types, ranges, required fields)
- **Status Calculation**: Automatically computed from field presence (already in model @property)
- **Cost Calculations**: dev_cost, total_cost, cost_per_shot computed on-the-fly (model @properties)
- **Chemistry Validation**: Checks chemistry_id exists when creating/updating rolls
- **Filtering**: Query parameters for status and order_id filtering
- **Pagination**: Skip/limit parameters for large datasets
- **Error Handling**: Returns 404 for not found, 422 for validation errors
- **Response Models**: Clean JSON responses with computed fields included

**API Endpoints Available:**
- `GET /api/rolls?skip=0&limit=100&status=NEW&order_id=42` - List/filter rolls
- `POST /api/rolls` - Create roll
- `GET /api/rolls/{id}` - Get single roll
- `PUT /api/rolls/{id}` - Update roll
- `DELETE /api/rolls/{id}` - Delete roll

All endpoints documented at http://localhost:8000/docs with interactive testing.
