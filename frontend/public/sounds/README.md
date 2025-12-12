# Sound Effects

This directory contains UI sound effect files for the application.

## Required Sound Files

Place the following sound files in this directory (all in `.wav` format):

- `tick.wav` - Subtle tick for card hover (with pitch variation)
- `card-pickup.wav` - Pickup sound when dragging begins (with slight pitch variation)
- `card-slide.wav` - Drop/place sound when dragging ends
- `click.wav` - Confirm/action button clicks (OK buttons)
- `trans-load.wav` - Status transition: NEW → LOADED
- `trans-unload.wav` - Status transition: LOADED → EXPOSED (unload)
- `trans-developed.wav` - Status transition: EXPOSED → DEVELOPED
- `trans-scanned.wav` - Status transition: DEVELOPED → SCANNED

## Sound Characteristics

- **Volume**: Keep sounds subtle (system will apply 0.4 volume by default)
- **Duration**: Short sounds (50-200ms) work best for UI feedback
- **Format**: All sounds should be `.wav` format
- **Pitch Variation**: `tick.wav` and `card-pickup.wav` will have random pitch variation applied via Web Audio API

## Notes

- The application will gracefully handle missing sound files (silent fallback)
- Sounds are preloaded on app initialization for better performance
- Pitch variation is applied programmatically, so base sounds should be neutral pitch
- No sounds are played for modal open/close or cancel buttons
