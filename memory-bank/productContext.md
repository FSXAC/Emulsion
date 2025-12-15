# Product Context

## The Problem
Analog photography involves multiple physical steps separated by time. Rolls act as "inventory" that move through these distinct phases. Key challenges include:
- Remembering what film is loaded in which camera.
- Tracking how many rolls have been developed with a specific batch of chemistry (critical for C41 exhaustion).
- Calculating the "real" cost of shooting, which includes both the film stock and the chemistry usage.
- Managing data that was previously stuck in spreadsheets or physical notes.

## The Solution
Emulsion replaces mental tracking and spreadsheets with a visual, interactive Kanban board. It models the physical reality of film photography:
- A roll is a physical object that moves from "Shelf" (New) to "Camera" (Loaded) to "Bag" (Exposed) to "Tank" (Developed) to "Scanner" (Scanned).
- Chemistry is a consumable resource with a finite lifespan and capacity.
- Developing a roll consumes a portion of the chemistry's life.

## User Experience Goals
1. **Frictionless Entry**: Inputting data should be fast and easy, especially on mobile. Drag-and-drop is preferred over form filling where possible.
2. **Visual Feedback**: The app should feel tactile. Cards slide, lists animate, and status changes are obvious.
3. **Transparent Logic**: Costs and status are calculated automatically, showing the user *why* a status is what it is (e.g., "This roll is Developed because it has a chemistry ID assigned").
4. **Forgiving Data**: The system minimizes rigid constraints. You can enter data out of order, and the system infers the most likely status.

## Key Workflows
- **Purchase**: Add new rolls (bulk add supported via duplication).
- **Load**: Drag a roll to "Loaded" column → prompts for date (defaults to Today).
- **Shoot**: Drag to "Exposed" → prompts for unload date.
- **Develop**: Drag to "Developed" → prompts to select active chemistry batch.
- **Scan/Archive**: Drag to "Scanned" → prompts for rating.
- **Analysis**: View charts to see film preferences and spending trends.
