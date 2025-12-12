# Development Chart (Dev-Chart) Plan

Status: Draft — rounds of review expected before implementation.

Purpose
-------
- Provide a backend-driven lookup ("dev-chart") to store and retrieve development times, dilutions, temperatures, and notes for film+developer combinations.
- Initially support two chemistry types: BW (primary focus) and C41 (fallback / default behavior supported already elsewhere).
- Allow quick addition of datapoints from experiments or datasheets and expose a lookup API for frontend widgets (timer, suggestions).

Design Principles
-----------------
- Keep data normalized but simple: store `film_stock_name` as a string initially (no new film_stocks FK), so integration is minimally invasive.
- Computed properties live on models when appropriate; lookup and ranking logic live in API/service layer.
- Store time in integer seconds (canonical unit). Store dilution as integer `dilution_n` meaning "1+N" where `0 == stock`.
- Store developed ISO adjustment as `developed_stops` (integer, recommended range -3..+3).

Data Model (proposed)
---------------------
- Table: `development_chart`
  - `id` : UUID primary key
  - `developer_name` : string NOT NULL
  - `film_stock_name` : string NOT NULL
  - `dilution_n` : integer NOT NULL DEFAULT 0  # semantics: dilution = 1+N, N=0 -> "stock"
  - `developed_stops` : integer NOT NULL  # recommended range -3..+3
  - `base_time_seconds` : integer NOT NULL  # dev time in seconds
  - `temperature_celsius` : numeric NULL
  - `notes` : text NULL
  - `created_by` : string NULL
  - `created_at` : timestamp default now

Indexes & Constraints
---------------------
- Unique constraint: (`developer_name`, `film_stock_name`, `dilution_n`, `developed_stops`)
  - Note: `temperature_celsius` is not part of the uniqueness to avoid NULL uniqueness issues; temperature can be recorded in notes if necessary.
- Indexes: composite index on (`film_stock_name`, `developer_name`, `dilution_n`, `developed_stops`) for fast lookup.

Pydantic Schemas (API surface)
-------------------------------
- `DevelopmentChartBase`:
  - `developer_name`, `film_stock_name`, `dilution_n`, `developed_stops`, `base_time_seconds`, `temperature_celsius?`, `notes?`
- `DevelopmentChartCreate(DevelopmentChartBase)`
- `DevelopmentChartUpdate` (all fields optional)
- `DevelopmentChartResponse(DevelopmentChartBase)` + `id`, `created_at`, helper fields: `base_time_formatted`, `dilution_display` ("stock" or "1+N").

API Endpoints
-------------
- CRUD
  - `GET /api/dev-chart` — list + filters (`film_stock`, `developer`, `dilution_n`, `developed_stops`, pagination)
  - `POST /api/dev-chart` — create
  - `GET /api/dev-chart/{id}` — retrieve
  - `PATCH /api/dev-chart/{id}` — update
  - `DELETE /api/dev-chart/{id}` — delete
- Lookup
  - `GET /api/dev-chart/lookup` — query params: `film_stock`, `developer`, `dilution_n`, `developed_stops`, `temperature_celsius`, `max_results=1`
  - Response: ordered list of matches with `match_score` and response fields (see schemas).

Lookup Algorithm (server-side)
------------------------------
1. Normalize inputs: lowercase/trim strings; coerce ints/floats; default `developed_stops` to 0 if absent.
2. Exact match: film + developer + dilution_n + developed_stops (+ temperature if provided and matches within a small delta) → score 100.
3. Closest-dilution fallback: same developer + film + developed_stops, pick row with minimal |dilution_n - query| (score reduces with distance).
4. Developer-agnostic fallback: same film + dilution + developed_stops for any developer.
5. Global fallback: any row where only developer or film matches; or stored C41 default if chemistry indicates C41.
6. Final fallback: for C41, use existing formula (base 210s + 2% per roll) if a batch-based computation is required; lookup can return a message suggesting this if no chart match exists.

Scoring heuristics (simple)
--------------------------
- Exact match: 100
- Dilution difference: subtract 10 points per dilution step difference (configurable)
- Developer mismatch: -20
- Temperature difference penalty: -1 per degree C

Frontend Integration
--------------------
Files to add
- `frontend/src/services/developmentChart.js` — API client mirrors backend endpoints.
- `frontend/src/components/ChemistryTimerWidget.jsx` — small widget that calls `lookupDevTime` and displays suggested `base_time_formatted`, notes, and an "apply" button.
- `frontend/src/components/DevelopmentChartEditor.jsx` — modal/page to add/edit datapoints and import CSV.

Where to show suggestions
- In `EditRollForm.jsx` or the chemistry-assignment flow when a user assigns a chemistry/batch to an exposed roll — show `ChemistryTimerWidget` with pre-filled film_stock and developer.
- Optionally a small suggestion in `FilmRollCard.jsx` when a roll is EXPOSED.

UI Flows
--------
- Add datapoint flow: open editor → autocomplete developer name and film stock → enter dilution (integer N or stock) → enter stops → enter time (mm:ss) → save.
- From roll: when selecting a developer/dilution, show suggestion with a one-click apply to fill `base_time_seconds` in assign modal.

Data Formats & CSV Seed
----------------------
- CSV template path: `migration/data/development_chart.csv.template`
- CSV headers: `developer_name,film_stock_name,dilution_n,developed_stops,base_time_seconds,temperature_celsius,notes,created_by,created_at`
- Import script: optional helper `migration/scripts/import_dev_chart.py` to parse and insert rows.

Tests
-----
- Unit tests: model validations (dilution display, time conversion), lookup scoring.
- API tests: CRUD + lookup behavior and fallbacks.
- Suggested test files: `tests/test_development_chart_model.py`, `tests/test_development_chart_lookup.py`, `tests/test_dev_chart_api.py`.

Migration & Seeding
-------------------
- No Alembic migrations currently; the repo uses SQLite and creates tables on startup. Add model and let the app create the table, or provide an import script to seed CSV.

Implementation Checklist (files to add/change)
-------------------------------------------
- Add (backend):
  - `backend/app/models/development_chart.py`
  - `backend/app/api/schemas/development_chart.py`
  - `backend/app/api/development_chart.py` (router)
  - register router in `backend/app/main.py`
  - optionally `migration/scripts/import_dev_chart.py` and `migration/data/development_chart.csv.template`
- Add (frontend):
  - `frontend/src/services/developmentChart.js`
  - `frontend/src/components/ChemistryTimerWidget.jsx`
  - `frontend/src/components/DevelopmentChartEditor.jsx`

Rollout Plan & Rounds of Review
-------------------------------
Round 0 — Design review (this document):
- Confirm data model decisions: `dilution_n` semantics (1+N), `developed_stops` range, string `film_stock_name` vs FK.
- Confirm uniqueness constraints and temperature handling.

Round 1 — Backend PR (models, schemas, router):
- Add SQLAlchemy model, Pydantic schemas, router with CRUD + lookup skeleton, tests for model/lookup.
- Review for constraint behavior (SQLite uniqueness + NULL handling).

Round 2 — Frontend PR (service + widget + editor skeleton):
- Add API client and minimal components that call lookup and display results. Wire into `EditRollForm` or chemistry assignment flow for manual testing.

Round 3 — Integration tests + seed data:
- Add CSV template, import a few sample rows, run API + UI to validate behavior.

Round 4 — UX polish & optional advanced features:
- Add bulk-import UX, improved fuzzy matching, richer scoring, temperature interpolation.

Notes & Assumptions
-------------------
- There is no user auth; `created_by` is a freeform string for now.
- Film stocks are strings on `FilmRoll`; therefore `film_stock_name` is string in the chart for parity.
- Dilution integer covers common 1+N dilutions; fractional or labeled dilutions (e.g., "B") can be added later if needed.

Next steps (if you approve this plan)
------------------------------------
1. I will implement the backend model, schemas, router stubs, and tests.
2. Then I will scaffold the frontend service and widget; wire it into the chemistry assignment flow for manual verification.
3. Seed CSV with a few canonical examples and add tests.

Please review and reply with any changes or confirmation to proceed with Round 1 (backend implementation).
