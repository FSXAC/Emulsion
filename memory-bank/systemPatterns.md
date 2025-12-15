# System Patterns

## Architecture
Emulsion is a monolithic web application with a decoupled frontend and backend.

```mermaid
flowchart TD
    Browser[Browser / Mobile] <--> Frontend
    Frontend[Frontend (React + Vite)] <--> API
    API[Backend API (FastAPI)] <--> DB
    DB[(SQLite Database)]
```

### Component Roles
- **Frontend**: Handles all UI/UX logic, drag-and-drop state, and visualization. Connects to backend via REST API.
- **Backend**: Provides CRUD operations, data validation (Pydantic), and business logic (cost calculations).
- **Database**: Single file SQLite database for portability and ease of backup.

## Design Patterns

### 1. Status Derivation
A core architectural decision is that **Status is Computed, Not Stored**.
Instead of a state machine storing a status string (e.g., "LOADED"), the system infers status from the presence of data fields:
- `NEW`: No dates, no chemistry, no stars.
- `LOADED`: Has `date_loaded` (but not unloaded).
- `EXPOSED`: Has `date_unloaded` (but not developed).
- `DEVELOPED`: Has `chemistry_id` (but not rated).
- `SCANNED`: Has `stars` rating.

**Implication**: Fixing data (e.g., removing a chemistry ID) automatically "downgrades" the status.

### 2. Computed Properties
Models extensively use `@property` decorators to calculate derived values on-the-fly:
- **Costs**: `film_cost` + `dev_cost` = `total_cost`.
- **C41 Timer**: Calculating development time based on the number of rolls previously developed in that batch.

### 3. Progressive Enhancement
The UI is designed to work on desktop but enhances experience on mobile:
- Touch targets are sized for fingers.
- Drag-and-drop works with touch events.
- Layouts stack vertically on small screens.

### 4. Search & Filter Syntax
A unified search pattern is used to filter rolls:
- Backend `SearchParser` handles queries like `status:loaded formt:120`.
- Frontend maps URL parameters/visual filters to this syntax.

## Data Flow
1. **Reads**: Frontend fetches full lists of Rolls/Chemistry. Filtering/Sorting often happens client-side for speed on small datasets (<1000 items), though backend supports filtering.
2. **Writes**: Updates are atomic PATCH/PUT requests.
3. **Optimistic UI**: Frontend updates UI immediately on drag-drop, then reverts if API call fails (handled by React Query or internal state management).
