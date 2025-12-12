# Spool Up Feature - Implementation Plan

## Overview
Allow users to split bulk 35mm film rolls (>36 exposures) into smaller rolls by "spooling up" a portion of the exposures into a new canister. This reflects the real-world workflow of bulk loading film.

## User Story
As a user with a bulk roll of 35mm film (e.g., 360 exposures at $100), I want to split off a portion (e.g., 36 exposures) into a new roll so that I can track each canister separately while maintaining accurate cost accounting.

**Example Flow:**
1. User has a NEW status roll: 360 exposures, $100 cost, 35mm format
2. Because format=35mm AND exposures>36 AND status=NEW, a "Spool Up" button appears next to "Duplicate"
3. User clicks "Spool Up"
4. Modal prompts for number of exposures (12-40, default 36)
5. User enters 36 and confirms
6. **Result:**
   - **New roll created:** 36 exposures, $10 cost (36/360 × $100), same order_id, film_stock_name, format, push_pull_stops, not_mine
   - **Original roll updated:** 324 exposures (360-36), $90 cost (324/360 × $100)

## Technical Approach

### Why This Design is Optimal
1. **No Backend Changes Required:** Status is already computed from fields, no need to add "bulk" flag
2. **Proportional Cost Calculation:** Film cost is split based on exposure ratio, maintaining accurate accounting
3. **Client-Side Logic:** Bulk detection happens in UI (format=35mm, exposures>36, status=NEW)
4. **Leverages Existing APIs:** Uses standard `createRoll` and `updateRoll` endpoints
5. **Similar to Duplicate:** Follows established pattern with additional cost/exposure calculations

### Bulk Roll Detection Criteria
A roll is considered "bulk" and eligible for spooling when:
- `status === 'NEW'` (not loaded yet)
- `film_format === '35mm'` (only 35mm can be bulk loaded)
- `expected_exposures > 36` (more than standard roll)

No database changes needed - this is purely computed in the frontend.

## Implementation Tasks

### 1. Create SpoolUpModal Component (`frontend/src/components/SpoolUpModal.jsx`)
**Purpose:** Prompt user for number of exposures to spool up

**Features:**
- Input field for exposures (number between 12-40, default 36)
- Display calculated costs:
  - New roll cost: `(inputExposures / bulk.expected_exposures) × bulk.film_cost`
  - Remaining bulk cost: `((bulk.expected_exposures - inputExposures) / bulk.expected_exposures) × bulk.film_cost`
- Validation:
  - Min: 12 exposures (minimum practical for 35mm)
  - Max: 40 exposures (maximum practical for 35mm)
  - Must be ≤ current bulk roll exposures
- Error handling for invalid inputs
- Cancel/Confirm buttons with loading states

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: function,
  onConfirm: function(exposures: number),
  bulkRoll: object, // The roll being split
}
```

**UI/UX:**
- Show preview of both rolls (new + remaining) with updated values
- Use similar styling to DatePickerModal and RatingModal
- Prevent body scroll when open
- Backdrop click to close
- Sound effects on confirm (reuse playClick)

### 2. Update EditRollForm Component (`frontend/src/components/EditRollForm.jsx`)

**Changes:**
- Add `onSpoolUp` prop to component signature
- Add logic to detect bulk rolls:
  ```javascript
  const isBulkRoll = roll && 
                     roll.status === 'NEW' && 
                     roll.film_format === '35mm' && 
                     roll.expected_exposures > 36;
  ```
- Add "Spool Up" button next to "Duplicate" button (only show when `isBulkRoll === true`)
- Button should have film canister icon and appropriate styling
- Call `onSpoolUp(roll)` when clicked, then close edit modal

**Button Placement:**
In the actions footer, update the button grid to include Spool Up:
```jsx
{roll && isBulkRoll && onSpoolUp && (
  <button
    type="button"
    onClick={handleSpoolUp}
    className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
  >
    <Icon name="film" size={18} /> Spool Up
  </button>
)}
```

### 3. Update RollsPage Component (`frontend/src/pages/RollsPage.jsx`)

**State Management:**
- Add modal state: `const [spoolUpModal, setSpoolUpModal] = useState({ isOpen: false, roll: null })`

**Handler Function:**
```javascript
const handleSpoolUp = (bulkRoll) => {
  setEditRollModal({ isOpen: false, roll: null });
  setSpoolUpModal({ isOpen: true, roll: bulkRoll });
};

const handleSpoolUpConfirm = async (exposures) => {
  const bulkRoll = spoolUpModal.roll;
  if (!bulkRoll) return;

  try {
    setLoading(true);
    
    // Calculate proportional costs
    const totalExposures = bulkRoll.expected_exposures;
    const remainingExposures = totalExposures - exposures;
    const costPerExposure = parseFloat(bulkRoll.film_cost) / totalExposures;
    const newRollCost = (costPerExposure * exposures).toFixed(2);
    const remainingCost = (costPerExposure * remainingExposures).toFixed(2);

    // Create new spooled roll
    const newRollData = {
      order_id: bulkRoll.order_id,
      film_stock_name: bulkRoll.film_stock_name,
      film_format: bulkRoll.film_format,
      expected_exposures: exposures,
      film_cost: parseFloat(newRollCost),
      push_pull_stops: bulkRoll.push_pull_stops || 0,
      not_mine: bulkRoll.not_mine || false,
      notes: bulkRoll.notes ? `${bulkRoll.notes}\n[Spooled from bulk roll]` : '[Spooled from bulk roll]',
    };

    await createRoll(newRollData);

    // Update bulk roll with remaining exposures and cost
    const updateData = {
      expected_exposures: remainingExposures,
      film_cost: parseFloat(remainingCost),
    };

    await updateRoll(bulkRoll.id, updateData);

    // Refresh roll list
    await fetchRolls();
    
    setSpoolUpModal({ isOpen: false, roll: null });
    playClick();
    showToast(`Spooled up ${exposures} exposures into new roll!`);
  } catch (err) {
    console.error('Spool up error:', err);
    showToast('Failed to spool up roll', 'error');
  } finally {
    setLoading(false);
  }
};
```

**Render SpoolUpModal:**
```jsx
<SpoolUpModal
  isOpen={spoolUpModal.isOpen}
  onClose={() => setSpoolUpModal({ isOpen: false, roll: null })}
  onConfirm={handleSpoolUpConfirm}
  bulkRoll={spoolUpModal.roll}
/>
```

**Pass Handler to EditRollForm:**
```jsx
<EditRollForm
  // ... existing props
  onSpoolUp={handleSpoolUp}
/>
```

### 4. Testing Checklist

#### Functionality Tests
- [ ] Spool Up button only appears for NEW status 35mm rolls with >36 exposures
- [ ] Spool Up button does NOT appear for:
  - Loaded/Exposed/Developed/Scanned rolls
  - Non-35mm formats (120, HF, etc.)
  - 35mm rolls with ≤36 exposures
- [ ] Modal opens when Spool Up clicked
- [ ] Input validation works:
  - Cannot enter < 12
  - Cannot enter > 40
  - Cannot enter > current bulk exposures
  - Cannot enter non-numeric values
- [ ] Cost calculations are accurate:
  - New roll cost = (input / total) × bulk_cost
  - Remaining cost = ((total - input) / total) × bulk_cost
  - Both costs sum to original cost (within rounding)
- [ ] After confirmation:
  - New roll appears in NEW column with correct values
  - Bulk roll updates with reduced exposures and cost
  - Both rolls have same order_id, stock name, format
  - Notes indicate "[Spooled from bulk roll]"

#### Edge Cases
- [ ] Spooling entire bulk roll (e.g., 36 from 36) - should create 0-exposure bulk roll
- [ ] Spooling with not_mine=true - cost splits proportionally
- [ ] Spooling with push_pull_stops - preserved in new roll
- [ ] Decimal costs (e.g., $99.99) - proper rounding to 2 decimals
- [ ] Very large bulk rolls (e.g., 1000 exposures)
- [ ] Modal close behavior (backdrop, cancel button)

#### UI/UX Tests
- [ ] Button styling consistent with Duplicate button
- [ ] Modal responsive on mobile (full screen) and desktop
- [ ] Loading states during API calls
- [ ] Sound effects play appropriately
- [ ] Toast notifications display success/error
- [ ] Body scroll prevented when modal open
- [ ] Error messages clear and helpful

## Cost Calculation Math

### Formula
Given:
- `B_exp` = Bulk roll exposures
- `B_cost` = Bulk roll cost
- `S_exp` = Spool up exposures (user input)

Calculate:
- `cost_per_exp = B_cost / B_exp`
- `S_cost = cost_per_exp × S_exp`
- `R_cost = cost_per_exp × (B_exp - S_exp)`

Where:
- `S_cost` = New spooled roll cost
- `R_cost` = Remaining bulk roll cost

### Example
**Before:**
- Bulk: 360 exp, $100.00

**User spools up 36 exposures:**
- `cost_per_exp = 100 / 360 = 0.27777...`
- `S_cost = 0.27777 × 36 = $10.00`
- `R_cost = 0.27777 × 324 = $90.00`

**After:**
- New roll: 36 exp, $10.00
- Bulk roll: 324 exp, $90.00

**Verification:** $10.00 + $90.00 = $100.00 ✓

## Implementation Order

1. **Create SpoolUpModal** - Self-contained component with all validation
2. **Update EditRollForm** - Add detection logic and button
3. **Update RollsPage** - Add state, handlers, and wire everything together
4. **Test thoroughly** - Follow testing checklist

## Future Enhancements (Out of Scope)

- [ ] Auto-suggest common exposure counts (24, 36)
- [ ] Bulk load multiple rolls at once
- [ ] Different cost allocation strategies (equal vs proportional)

## Notes

- This feature is **frontend-only** - no backend API changes needed
- Leverages existing `createRoll` and `updateRoll` endpoints
- Status remains computed from field presence (no new status needed)
- Cost split is mathematically accurate with proper rounding
- UX follows established patterns (modals, buttons, toasts)
