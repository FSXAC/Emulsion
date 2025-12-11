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
                  │ http://localhost:8200
┌─────────────────▼──────────────────────────┐
│     Backend Server (FastAPI + Python)      │
│                                             │
│  ┌────────────────────────────────────────┐│
│  │  API Routes (FastAPI)                  ││
│  │  - GET/POST/PUT/DELETE /api/rolls      ││
│  │  - GET/POST/PUT/DELETE /api/chemistry  ││
│  │  - PATCH /api/rolls/{id}/load          ││
│  │  - PATCH /api/rolls/{id}/unload        ││
│  │  - PATCH /api/rolls/{id}/chemistry     ││
│  │  - PATCH /api/rolls/{id}/rating        ││
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
│          backend/data/emulsion.db          │
└────────────────────────────────────────────┘
```

---

## Database Schema

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
```

### Table: `shots_metadata` (Future Integration)
```sql
id              : UUID (PK)
roll_id         : UUID (FK → film_rolls)
frame_number    : Integer
date_taken      : Timestamp
```

---

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

---

## Deployment (Local Only)

### Current Setup

**Development Servers**:
- Backend: `uvicorn app.main:app --reload` (FastAPI dev server on port 8200)
- Frontend: `npm run dev` (Vite dev server on port 5173)
- Access: `http://localhost:5173` (frontend) → `http://localhost:8200` (backend API)
- Database: SQLite file at `backend/data/emulsion.db`

**Production-style Local Setup** (optional):
- Use `systemd` service (Linux) or `launchd` (macOS) to auto-start on boot
- Backend: Serve via Gunicorn/Uvicorn
- Frontend: Build production bundle, serve via backend static files
- Single port access: `http://localhost:8200`

**Backup Strategy**:
- SQLite database is a single file - easy to backup
- Cron job or manual copy to cloud storage (Dropbox, iCloud, etc.)
- Git repo for code (database file should be excluded from version control)

**Mobile Access on Local Network**:
- Find your computer's local IP (e.g., `192.168.1.100`)
- Access from phone: `http://192.168.1.100:5173`
- Make responsive for mobile browser
- Optional: Add to home screen as PWA

---

## Implemented Technology Stack

### Backend
- **Python 3.x** with FastAPI 0.115.0
- **SQLAlchemy 2.0.36** for ORM
- **Pydantic 2.9.2** for validation
- **Uvicorn 0.32.0** as ASGI server
- **SQLite** database at `backend/data/emulsion.db`
- **Alembic 1.13.1** for migrations (configured but not yet used)

### Frontend
- **React 19.2.0** with JavaScript (no TypeScript)
- **Vite 5.x** for fast development and builds
- **@dnd-kit** (core 6.1.0, sortable 8.0.0) for drag-and-drop
- **Axios 1.7.2** for API calls
- **Framer Motion 11.2.10** for animations
- **React Router DOM 7.3.0** for routing
- **Tailwind CSS 3.4.4** for styling
- **React Hot Toast 2.6.0** for notifications

### API Endpoints Implemented
- **Film Rolls**: GET/POST/PUT/DELETE `/api/rolls`
- **Chemistry Batches**: GET/POST/PUT/DELETE `/api/chemistry`
- **Status Transitions**:
  - PATCH `/api/rolls/{id}/load` - Set date_loaded
  - PATCH `/api/rolls/{id}/unload` - Set date_unloaded
  - PATCH `/api/rolls/{id}/chemistry` - Associate chemistry batch
  - PATCH `/api/rolls/{id}/rating` - Set stars rating

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
- [X] 2.8 Test all endpoints with sample data

### Phase 3: Backend API - Chemistry
- [X] 3.1 Implement GET /api/chemistry (list all batches)
- [X] 3.2 Implement POST /api/chemistry (create batch)
- [X] 3.3 Implement PUT /api/chemistry/{id} (update batch)
- [X] 3.4 Implement DELETE /api/chemistry/{id} (delete batch)
- [X] 3.5 Add rolls_developed calculation
- [X] 3.6 Add C41 development time calculator function
- [X] 3.7 Test chemistry endpoints

### Phase 4: Backend - Roll/Chemistry Integration
- [X] 4.1 Add PATCH /api/rolls/{id}/load endpoint (set date_loaded)
- [X] 4.2 Add PATCH /api/rolls/{id}/unload endpoint (set date_unloaded)
- [X] 4.3 Add PATCH /api/rolls/{id}/chemistry endpoint (associate chemistry)
- [X] 4.4 Auto-increment chemistry roll count when associated
- [X] 4.5 Add PATCH /api/rolls/{id}/rating endpoint (set stars)
- [X] 4.6 Test status transitions work correctly

### Phase 5: Frontend Foundation
- [X] 5.1 Initialize Vite + React project (frontend/)
- [X] 5.2 Install dependencies: dnd-kit, axios, tailwindcss, framer-motion
- [X] 5.3 Configure Tailwind CSS
- [X] 5.4 Create basic app structure and routing
- [X] 5.5 Set up API client (axios with base URL)
- [X] 5.6 Test frontend dev server runs

### Phase 6: Frontend - Kanban Board UI
- [X] 6.1 Create FilmRollCard component
- [X] 6.2 Create StatusColumn component (New, Loaded, Exposed, etc.)
- [X] 6.3 Set up dnd-kit drag-and-drop context
- [X] 6.4 Implement drag-and-drop between columns
- [X] 6.5 Fetch rolls from API and display in columns
- [X] 6.6 Test drag-drop UI works

### Phase 7: Frontend - Actions & Modals
- [X] 7.1 Create DatePickerModal component
- [X] 7.2 Create ChemistryPickerModal component
- [X] 7.3 Create RatingModal component (star selector)
- [X] 7.4 Wire up drag-to-load action (calls PATCH /load)
- [X] 7.5 Wire up drag-to-expose action (calls PATCH /unload)
- [X] 7.6 Wire up drag-to-chemistry action (calls PATCH /chemistry)
- [X] 7.7 Wire up rating action (calls PATCH /rating)
- [X] 7.8 Add toast notifications for success/errors

### Phase 8: Frontend - Forms
- [X] 8.1 Create AddRollForm component
- [X] 8.2 Create EditRollForm component
- [X] 8.3 Create AddChemistryForm component
- [X] 8.4 Add delete button to EditRollForm (dangerous action)
- [X] 8.5 Wire AddRollForm to RollsPage "+ Add Roll" button
- [X] 8.6 Wire AddChemistryForm to Chemistry page (Phase 9)
- [X] 8.7 Implement autocomplete for film stock names
- [X] 8.8 Implement autocomplete for order IDs
- [X] 8.9 Show live cost calculations in forms

### Phase 8A: Additional Requested Features
- [X] 8.a.1 Duplicate button for film rolls in the NEW stage. This is so that we can quickly add multiple rolls from the same order. Fields such as order ID, film stock type, expected exposured should be copied.
- [X] 8.a.2 De-emphasize the delete roll button in edit film roll form, make it a link-style text button. 
- [X] 8.a.3 Do not show push/pull badge if it's 0.0 stops.

### Phase 9: Frontend - Chemistry Management
- [X] 9.1 Create Chemistry page/view
- [X] 9.2 Display list of chemistry batches
- [X] 9.3 Show roll count and C41 dev time for each batch
- [ ] 9.4 Add C41 development timer widget (DO NOT impl. in phase 9: defer to later phases)
- [X] 9.5 Edit Chemistry form and Implement retire chemistry action
- [X] 9.6 Link to view rolls that used each batch
- [X] 9.7 Add duplicate and delete actions similar to the ones for rolls

### Phase 10: Mobile Responsiveness
- [X] 10.1 Make kanban board responsive (stack columns on mobile)
- [X] 10.2 Ensure cards are touch-friendly (min 48px tap targets)
- [X] 10.3 Test drag-and-drop on mobile browser
- [X] 10.4 Optimize modals for mobile screens
- [ ] 10.5 Add swipe gestures for quick actions (optional - deferred)

### Phase 11: Data Migration
- [X] 11.1 Export existing Numbers spreadsheet to CSV
- [X] 11.2 Write Python import script for film rolls
- [X] 11.3 Write Python import script for chemistry batches
- [X] 11.4 Run import and validate data integrity
- [X] 11.5 Verify all calculations match spreadsheet

### Phase 12: Polish & Launch
- [X] 12.1 Add loading states and skeleton screens
- [X] 12.2 Improve error handling and validation
- [ ] 12.3 Add keyboard shortcuts (optional)
- [ ] 12.4 Write basic user documentation
- [ ] 12.5 Set up auto-start on macOS (launchd, optional)
- [ ] 12.6 Create backup script for database
- [ ] 12.7 🎬 Start using the app!

---

## Phase 13: Advanced Search & Filter System

### Overview
Expand the current chemistry-ID filtering to support comprehensive search and filter capabilities with syntax-based queries.

### Requirements
1. **Backward Compatibility**: Maintain existing chemistry filter from URL params (`?chemistry=<id>`)
2. **Unified Search Interface**: Single search bar with syntax support
3. **Full Dataset Search**: Search across all rolls, not just paginated visible rolls
4. **Filter Syntax**: Support both simple text search and field-specific queries
5. **Responsive Design**: Search UI works on mobile and desktop

### Search Syntax Design

#### Simple Text Search (Default)
When user enters plain text without syntax:
- Searches across: `film_stock_name`, `notes`, `order_id`
- Case-insensitive partial matching
- Example: `"portra"` matches "Kodak Portra 400", "Portra 160", etc.

#### Field-Specific Syntax
Format: `field:value` or `field:"value with spaces"`

**Supported Fields:**
- `format:120` - Film format (35mm, 120, HF, etc.)
- `stock:portra` - Film stock name (partial match)
- `status:loaded` - Roll status (NEW, LOADED, EXPOSED, DEVELOPED, SCANNED)
- `order:42` - Order ID (exact or partial match)
- `stars:4` - Star rating (exact match, also supports `stars:>=4`, `stars:<=3`)
- `mine:false` or `not_mine:true` - Friend's rolls filter
- `push:+1` or `pull:-1` - Push/pull stops
- `chemistry:<name>` - Chemistry batch name (partial match)
- `cost:>10` or `cost:<5` - Cost range filters
- `date:2024-12` - Date filters (YYYY-MM format for month, YYYY-MM-DD for specific date)

**Comparison Operators:**
- `field:value` - Exact match (or partial for text fields)
- `field:>value` - Greater than (for numeric/date fields)
- `field:>=value` - Greater than or equal
- `field:<value` - Less than
- `field:<=value` - Less than or equal

**Multiple Filters:**
- Space-separated: `format:120 status:loaded` (AND logic)
- Future: Support OR with `|` operator: `format:120|35mm`

**Examples:**
- `format:120` - All 120 format rolls
- `status:loaded stock:portra` - Loaded Portra rolls
- `stars:>=4` - Highly rated rolls (4-5 stars)
- `format:120 not_mine:true` - Friend's 120 rolls
- `chemistry:c41 status:developed` - Rolls developed with C41 chemistry
- `date:2024-12` - Rolls from December 2024
- `cost:>15` - Expensive rolls (film cost + dev cost > $15)

### Architecture Plan

#### Backend Changes

**1. Enhanced API Endpoint**
- Modify `GET /api/rolls` to accept search query parameter
- Add `search: Optional[str] = Query(None)` parameter
- Implement query parser in backend to handle syntax
- Return all matching rolls (remove pagination limit when searching)

**New File**: `backend/app/api/search.py`
```python
class SearchParser:
    """Parse search syntax and build SQLAlchemy filters"""
    
    def parse(self, query: str) -> List[Filter]:
        # Parse field:value syntax
        # Build SQLAlchemy filter expressions
        # Handle comparison operators
        pass
    
    def parse_simple_text(self, query: str) -> List[Filter]:
        # Search across multiple text fields (OR logic)
        pass
```

**Modified Files:**
- `backend/app/api/rolls.py` - Add search parameter and integrate SearchParser
- `backend/app/api/schemas/film_roll.py` - Add SearchQuery schema if needed

#### Frontend Changes

**1. Search Component**
**New File**: `frontend/src/components/SearchBar.jsx`
```jsx
<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  onSearch={handleSearch}
  onClear={handleClearSearch}
  placeholder="Search rolls... (e.g., format:120 status:loaded)"
  showSyntaxHelp={true}
/>
```

Features:
- Input field with search icon
- Clear button (X) when text is present
- Syntax help tooltip/popover (shows available fields and operators)
- Debounced search (wait 300ms after user stops typing)
- Mobile-friendly with appropriate keyboard (search button on mobile keyboards)

**2. Search Help Modal**
**New File**: `frontend/src/components/SearchHelpModal.jsx`
- Triggered by "?" icon next to search bar
- Shows examples of search syntax
- Lists all available fields and operators
- Can be dismissed or closed

**3. Active Filter Display**
**New File**: `frontend/src/components/ActiveFilters.jsx`
```jsx
<ActiveFilters
  filters={parsedFilters}
  onRemoveFilter={handleRemoveFilter}
  onClearAll={handleClearAllFilters}
/>
```

Shows pill-style badges for each active filter:
- `[format: 120] [x]`
- `[status: loaded] [x]`
- "Clear all" button

**4. Update RollsPage**
**Modified File**: `frontend/src/pages/RollsPage.jsx`

Changes:
- Add search state: `const [searchQuery, setSearchQuery] = useState('')`
- Add parsed filters state: `const [activeFilters, setActiveFilters] = useState([])`
- Modify `fetchRolls()` to accept search parameter
- Add search bar to header area (below title, above Kanban board)
- When searching, show all matching rolls (remove pagination for NEW/SCANNED)
- Maintain chemistry filter compatibility (convert to search syntax internally)
- Show "Search Results" header when search is active with result count

Layout:
```
┌──────────────────────────────────────────────┐
│ Film Rolls                      [+ Add Roll] │
│ Drag rolls between columns...                │
├──────────────────────────────────────────────┤
│ 🔍 [Search bar with syntax help]   [?]  [x]  │
│ Active: [format:120][x] [stars:>=4][x] Clear │
├──────────────────────────────────────────────┤
│ [Chemistry Filter Banner if active]          │
├──────────────────────────────────────────────┤
│ Search Results: 12 rolls found               │ <- Only when searching
├──────────────────────────────────────────────┤
│ [Kanban Board Columns]                       │
└──────────────────────────────────────────────┘
```

**5. URL State Management**
Store search query in URL params for bookmarking/sharing:
- `?search=format:120+status:loaded`
- `?chemistry=<id>` - Convert to `chemistry:<id>` search syntax internally
- Use `useSearchParams` from React Router

#### Implementation Strategy

**Phase 13.1: Backend Search Parser**
- [X] 13.1.1 Create `SearchParser` class in `backend/app/api/search.py`
- [X] 13.1.2 Implement simple text search (OR across multiple fields)
- [X] 13.1.3 Implement field-specific syntax parsing (regex or simple parser)
- [X] 13.1.4 Implement comparison operators (>, <, >=, <=, =)
- [X] 13.1.5 Build SQLAlchemy filter expressions from parsed tokens
- [X] 13.1.6 Handle special cases (chemistry name lookup, date parsing, cost calculations)
- [X] 13.1.7 Add unit tests for search parser

**Phase 13.2: Backend API Integration**
- [X] 13.2.1 Add `search` parameter to `GET /api/rolls` endpoint
- [X] 13.2.2 Integrate SearchParser into rolls endpoint
- [X] 13.2.3 Remove pagination limit when search is active (return all results)
- [X] 13.2.4 Test search endpoint with various queries
- [X] 13.2.5 Update API documentation (OpenAPI/Swagger)

**Phase 13.3: Frontend Search UI** ✅
- [X] 13.3.1 Create `SearchBar` component with debounced input
- [X] 13.3.2 Create `SearchHelpModal` component with syntax reference
- [X] 13.3.3 Create `ActiveFilters` component for pill badges
- [X] 13.3.4 Add search bar to RollsPage header
- [X] 13.3.5 Style search UI for mobile and desktop
- [X] 13.3.6 Add keyboard shortcuts (Cmd/Ctrl+K to focus search)

**Phase 13.4: Frontend Search Integration**
- [ ] 13.4.1 Add search state to RollsPage
- [ ] 13.4.2 Modify `fetchRolls()` to send search parameter
- [ ] 13.4.3 Parse search query on frontend for active filter display
- [ ] 13.4.4 Handle search results display (show all matching, group by status)
- [ ] 13.4.5 Add URL state management (sync search with URL params)
- [ ] 13.4.6 Convert existing chemistry filter to search syntax
- [ ] 13.4.7 Add loading state for search (spinner or skeleton)

**Phase 13.5: Testing & Polish**
- [ ] 13.5.1 Test search with various syntax combinations
- [ ] 13.5.2 Test mobile search experience (keyboard, touch, readability)
- [ ] 13.5.3 Test URL state persistence (bookmark, refresh, share)
- [ ] 13.5.4 Test backward compatibility with chemistry filter
- [ ] 13.5.5 Add error handling for invalid syntax
- [ ] 13.5.6 Optimize search performance (index considerations)
- [ ] 13.5.7 Add analytics/telemetry for search usage (optional)

### Technical Considerations

**Backend Performance:**
- For simple queries, SQLite full-text search is overkill (100-1000 rolls expected)
- SQLAlchemy filter expressions should be sufficient
- Consider adding indexes if search becomes slow:
  - `CREATE INDEX idx_film_stock_name ON film_rolls(film_stock_name)`
  - `CREATE INDEX idx_order_id ON film_rolls(order_id)`
  - `CREATE INDEX idx_status_computed` - Not possible (computed field), filter in Python if needed

**Chemistry Name Lookup:**
- When user searches `chemistry:c41`, need to:
  1. Query chemistry_batches table for name match
  2. Get list of chemistry IDs
  3. Filter film_rolls by chemistry_id IN (list)
- Cache chemistry lookups to avoid repeated queries

**Date Parsing:**
- Support multiple formats: `YYYY-MM-DD`, `YYYY-MM`, `YYYY`
- Use Python `dateutil.parser` or manual parsing
- Handle invalid dates gracefully

**Cost Filtering:**
- `cost` refers to `total_cost` (film + dev)
- This is a computed field, so need to:
  - Option A: Calculate in Python after fetch (slow for large datasets)
  - Option B: Use SQL expression in query (complex but faster)
  - Recommendation: Start with Option A for MVP, optimize later

**Status Filtering:**
- Status is computed field (cannot index or filter in SQL directly)
- Current implementation fetches all and filters in Python
- For search, this is acceptable (search returns smaller subset anyway)
- Future optimization: Add `status` column and trigger to keep it in sync

### User Experience Considerations

**Progressive Disclosure:**
- Show simple search box by default
- Add "?" icon for syntax help
- Show example syntax in placeholder text
- Highlight syntax in search input (future: color-code field names)

**Error Handling:**
- Invalid syntax: Show error message below search bar
- No results: Show "No rolls found" message with suggestion to clear filters
- Invalid field names: Show "Unknown field: xyz" with link to help

**Mobile Optimization:**
- Search bar should be prominent but not overwhelming
- Syntax help should be accessible (modal or expandable section)
- Active filters should wrap gracefully on small screens
- Consider voice input for search (browser feature)

**Accessibility:**
- Search bar should have proper ARIA labels
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader announcements for search results count
- Focus management (focus search bar on Cmd/Ctrl+K)

### Future Enhancements (Out of Scope for Phase 13)

**Advanced Features:**
- [ ] Saved searches / search presets
- [ ] Search history (recent searches)
- [ ] Auto-complete for field names and values
- [ ] Boolean operators: AND, OR, NOT (e.g., `(format:120 OR format:35mm) AND status:loaded`)
- [ ] Fuzzy text matching (Levenshtein distance)
- [ ] Search result sorting (by date, cost, rating, etc.)
- [ ] Export search results to CSV
- [ ] Search within search (refine results)
- [ ] Visual query builder (drag-and-drop UI for filters)

**Performance Optimizations:**
- [ ] Full-text search index (SQLite FTS5)
- [ ] Cached search results (Redis/in-memory)
- [ ] Incremental search (search-as-you-type with streaming results)
- [ ] Search result highlighting

**Analytics:**
- [ ] Track most common searches
- [ ] Track search success rate (results found vs. no results)
- [ ] A/B test different syntax designs

