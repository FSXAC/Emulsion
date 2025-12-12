---
name: Add UI Sound Effects
overview: Add sound effects for UI interactions (hover, drag, buttons, state transitions) with a centralized sound management system, pitch variation for organic feel, sound file recommendations, and integration across all interactive components.
todos:
  - id: create-sound-manager
    content: Create soundManager.js utility with Web Audio API for pitch variation, AudioBuffer caching, and play methods
    status: pending
  - id: create-sound-hook
    content: Create useSound.js React hook wrapping SoundManager for easy component integration
    status: pending
  - id: integrate-card-hover
    content: Add hover sounds with pitch variation to FilmRollCard component
    status: pending
  - id: integrate-drag-sounds
    content: Add drag start/end sounds (with pitch variation on start) to FilmRollCard and RollsPage drag handlers
    status: pending
  - id: integrate-button-sounds
    content: Add click/cancel sounds to all form buttons and modals
    status: pending
  - id: integrate-transition-sounds
    content: Add state transition sounds to status change handlers in RollsPage and StatusColumn
    status: pending
  - id: integrate-modal-sounds
    content: Add open/close sounds to all modal components
    status: pending
  - id: add-sound-preload
    content: Initialize sound preloading in App.jsx or main entry point
    status: pending
  - id: handle-audiocontext-resume
    content: Add AudioContext resume logic for browser autoplay restrictions
    status: pending
---

# Add UI Sound Effects System

## Overview

Implement a comprehensive sound effects system for UI interactions including card hovers, drag operations, button clicks, and state transitions. The system will use a centralized sound manager with preloading for performance and Web Audio API for pitch variation to create organic, non-repetitive sound experiences.

## Sound File Setup

### Recommended Sound Sources

- **freesound.org** - Free, CC0/public domain sounds
- **zapsplat.com** - Free with attribution
- **mixkit.co** - Free sound effects library
- **Adobe Stock** - Premium option

### Required Sound Files (suggested)

Place in `frontend/public/sounds/`:

- `hover.mp3` / `hover.ogg` - Subtle whoosh/tick for card hover
- `drag-start.mp3` - Pickup sound when dragging begins
- `drag-end.mp3` - Drop/place sound when dragging ends
- `button-click.mp3` - Confirm/action button clicks
- `button-cancel.mp3` - Cancel/close button clicks
- `state-transition.mp3` - Status change transitions (NEW→LOADED, etc.)
- `modal-open.mp3` - Modal open sound
- `modal-close.mp3` - Modal close sound
- `slider-tick.mp3` - Slider increment/decrement (optional)

**Format**: Use both `.mp3` (fallback) and `.ogg` (better compression) for browser compatibility.

## Implementation

### 1. Create Sound Manager Utility

**File**: `frontend/src/utils/soundManager.js`

- Create `SoundManager` class with:
  - **Web Audio API setup**: AudioContext for pitch manipulation
  - **Audio buffer caching**: Preload and cache AudioBuffers for Web Audio API
  - **HTML5 Audio fallback**: Simple Audio elements for sounds that don't need pitch variation
  - **Pitch variation system**:
    - Random pitch variation within range (e.g., ±0.1 to ±0.3 semitones)
    - Sequential pitch variation (cycling through slight variations)
    - Configurable per sound type
  - Sound preloading/caching
  - Volume control (default 0.3-0.5 for subtlety)
  - Play methods for each sound type with optional pitch variation
  - Debouncing for rapid interactions (hover sounds)
- Export singleton instance

**Key Methods**:

- `loadSound(url, usePitchVariation)` - Load and cache audio buffer
- `playSound(name, options)` - Play with optional pitch variation
- `playWithPitch(buffer, pitchVariation)` - Use AudioBufferSourceNode with detune/pitch adjustment

### 2. Create React Hook

**File**: `frontend/src/hooks/useSound.js`

- Custom hook wrapping SoundManager
- Provides `playHover()`, `playDragStart()`, `playDragEnd()`, `playClick()`, `playCancel()`, `playTransition()`, `playModalOpen()`, `playModalClose()`
- Handles cleanup and error handling
- Exposes pitch variation configuration if needed

### 3. Pitch Variation Strategy

**Sounds with pitch variation**:

- `hover` - Random pitch variation (±0.15 semitones) for organic feel
- `drag-start` - Slight random variation (±0.1 semitones)
- `slider-tick` - Optional sequential variation

**Sounds without pitch variation**:

- `button-click` - Consistent pitch for feedback clarity
- `button-cancel` - Consistent pitch
- `state-transition` - Consistent pitch
- `modal-open/close` - Consistent pitch

**Implementation approach**:

- Use `AudioBufferSourceNode` with `detune` property (cents) or `playbackRate` adjustment
- Random variation: `Math.random() * range - range/2` (e.g., -0.15 to +0.15 semitones)
- Ensure AudioContext is created only once and reused

### 4. Integrate into Components

**FilmRollCard.jsx**:

- Add `onMouseEnter` handler → `playHover()` (with pitch variation)
- Add drag start listener → `playDragStart()` (with slight pitch variation)
- Add drag end listener → `playDragEnd()`

**RollsPage.jsx**:

- Add sound to `handleDragEnd` → `playDragEnd()`
- Add sound to status change handlers → `playTransition()`

**EditRollForm.jsx / AddRollForm.jsx**:

- Add sound to "Save Changes" button → `playClick()`
- Add sound to "Cancel" button → `playCancel()`
- Add sound to modal open/close → `playModalOpen()` / `playModalClose()`

**StatusColumn.jsx**:

- Add sound to drop handlers → `playTransition()`

**All Modal Components**:

- Add `playModalOpen()` on mount
- Add `playModalClose()` on close

**Slider (EditRollForm push/pull)**:

- Optional: Add `playSliderTick()` on value change (debounced, with pitch variation)

### 5. Performance Optimizations

- Preload all sounds on app initialization
- Use Web Audio API AudioBuffer for pitch-varied sounds
- Use HTML5 Audio for simple sounds (better compatibility)
- Debounce hover sounds (max once per 100-200ms)
- Cache AudioBuffer instances to avoid re-decoding
- Reuse AudioContext (create once, reuse for all sounds)
- Use `AudioBufferSourceNode` with proper cleanup

### 6. Error Handling

- Gracefully handle missing sound files
- Fallback to HTML5 Audio if Web Audio API unavailable
- Fallback to silent operation if audio fails
- Console warnings in development mode only
- Handle AudioContext autoplay restrictions (user interaction required)

### 7. Browser Compatibility

- Web Audio API: Modern browsers (Chrome, Firefox, Safari, Edge)
- Fallback: HTML5 Audio for older browsers
- Handle AudioContext state (suspended/unsuspended)
- Resume AudioContext on user interaction if needed

## File Structure

```
frontend/
├── public/
│   └── sounds/
│       ├── hover.mp3 / hover.ogg
│       ├── drag-start.mp3 / drag-start.ogg
│       ├── drag-end.mp3 / drag-end.ogg
│       ├── button-click.mp3 / button-click.ogg
│       ├── button-cancel.mp3 / button-cancel.ogg
│       ├── state-transition.mp3 / state-transition.ogg
│       ├── modal-open.mp3 / modal-open.ogg
│       └── modal-close.mp3 / modal-close.ogg
├── src/
│   ├── utils/
│   │   └── soundManager.js (new)
│   └── hooks/
│       └── useSound.js (new)
```

## Technical Details: Pitch Variation

**Web Audio API Approach**:

```javascript
// Create AudioBufferSourceNode
const source = audioContext.createBufferSource();
source.buffer = audioBuffer;
source.detune.value = randomPitchVariation; // in cents (100 cents = 1 semitone)
// OR use playbackRate for simpler approach:
source.playbackRate.value = 1.0 + (randomVariation / 12); // semitones to rate

// Connect and play
source.connect(audioContext.destination);
source.start();
```

**Pitch Variation Ranges**:

- Hover: ±0.15 semitones (subtle, organic)
- Drag start: ±0.1 semitones (very subtle)
- Slider tick: ±0.2 semitones (more noticeable variation)

## Testing Considerations

- Test on different browsers (Chrome, Firefox, Safari)
- Verify pitch variation sounds natural and not jarring
- Test sounds don't interfere with drag-and-drop
- Ensure sounds are subtle and not annoying
- Test with system volume at different levels
- Verify no performance impact during rapid interactions
- Test AudioContext resume on user interaction
- Verify pitch variation doesn't cause audio artifacts