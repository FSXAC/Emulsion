# 🎞️ Film Canister Thumbnail Generator

Three.js-based 3D renderer for generating film canister thumbnails from flat label textures.

## Features

- **Real-time 3D Preview**: See your canister design in real-time with lighting and shadows
- **Auto-rotate**: Animated preview to view all sides
- **Customizable Settings**: Adjust shadows, background color, and camera angle
- **High-quality Rendering**: PNG export with transparent backgrounds or custom colors
- **Browser-based**: No server-side rendering needed for preview

## Quick Start

### 1. Access the Demo

Navigate to: `http://localhost:5173/canister-demo`

### 2. Upload a Label Texture

- Use the sample: `/public/sample-label.svg`
- Or create your own rectangular label design
- Best results: 800x267px (3:1 aspect ratio)

### 3. Generate Thumbnail

1. Upload your texture
2. Adjust settings (shadows, background)
3. Enable auto-rotate to preview
4. Click "Generate Thumbnail"
5. Download or use in your app

## Usage in Your App

### Basic Usage

```jsx
import CanisterPreview from './components/CanisterPreview';

function MyComponent() {
  const [thumbnail, setThumbnail] = useState(null);

  const handleGenerate = (dataURL) => {
    setThumbnail(dataURL);
    // Upload to backend or save locally
  };

  return (
    <CanisterPreview
      textureUrl="/path/to/texture.png"
      onGenerate={handleGenerate}
      config={{
        width: 400,
        height: 400,
        enableShadows: true,
        backgroundColor: '#f5f5f5',
      }}
    />
  );
}
```

### Generate Thumbnail Programmatically

```jsx
import { renderCanisterToDataURL, generateThumbnailBlob } from '../utils/canisterRenderer';

// Get as data URL (for preview)
const dataURL = await renderCanisterToDataURL('/texture.png', {
  width: 400,
  height: 400,
  enableShadows: true,
});

// Get as blob (for upload)
const blob = await generateThumbnailBlob('/texture.png', {
  width: 400,
  height: 400,
});

// Upload to backend
const formData = new FormData();
formData.append('thumbnail', blob, 'canister.png');
await fetch('/api/upload', { method: 'POST', body: formData });
```

## Configuration Options

```javascript
{
  width: 400,              // Canvas width in pixels
  height: 400,             // Canvas height in pixels
  canisterRadius: 0.5,     // Cylinder radius (3D units)
  canisterHeight: 1.5,     // Cylinder height (3D units)
  cameraDistance: 3,       // Camera distance from object
  backgroundColor: '#f5f5f5', // Background color (hex)
  enableShadows: true,     // Enable shadow rendering
  antialias: true,         // Enable antialiasing
  autoRotate: false,       // Enable auto-rotation
}
```

## Texture Guidelines

### Recommended Specifications
- **Aspect Ratio**: 2:1 or 3:1 (wraps around cylinder)
- **Resolution**: Minimum 800px wide
- **Format**: PNG, JPG, or SVG
- **Design**: Should tile seamlessly horizontally

### Example Label Dimensions
- **35mm film**: 800x267px (3:1)
- **120 film**: 800x400px (2:1)

### Design Tips
1. Important text should be in the center (most visible)
2. Design should work when wrapped around cylinder
3. Use high contrast for readability
4. Test with auto-rotate to check all sides

## API Reference

### `renderCanisterToDataURL(textureUrl, config)`
Renders canister to PNG data URL.
- **Returns**: `Promise<string>` - Data URL of rendered image

### `renderCanisterToCanvas(canvas, textureUrl, config)`
Renders live preview to canvas element.
- **Returns**: `{ dispose, setRotation, screenshot }` - Control object

### `generateThumbnailBlob(textureUrl, config)`
Generates thumbnail as blob for upload.
- **Returns**: `Promise<Blob>` - PNG blob

### `createCanister(textureUrl, options)`
Creates Three.js canister mesh (low-level).
- **Returns**: `THREE.Group` - Canister 3D object

### `setupScene(config)`
Sets up Three.js scene with lighting (low-level).
- **Returns**: `{ scene, camera, renderer }` - Scene objects

## Integration with Backend

### Option 1: Client-side Generation
Generate thumbnails in browser and upload to backend:

```javascript
const blob = await generateThumbnailBlob(textureUrl);
const formData = new FormData();
formData.append('thumbnail', blob, 'thumbnail.png');

await fetch('/api/rolls/thumbnails', {
  method: 'POST',
  body: formData,
});
```

### Option 2: Server-side Generation (Future)
For batch processing, use headless Three.js with Node.js:
- Install: `npm install three gl canvas`
- Use same renderer code with headless-gl
- Generate thumbnails for all existing rolls

## Troubleshooting

### Texture not loading
- Ensure texture URL is accessible (same origin or CORS enabled)
- Check browser console for errors
- Try with sample texture first

### Performance issues
- Reduce canvas size (width/height)
- Disable shadows
- Disable auto-rotate
- Use lower-resolution textures

### Shadows not appearing
- Ensure `enableShadows: true` in config
- Check that lights are casting shadows
- WebGL support required

## Future Enhancements

- [ ] Custom cap colors/materials
- [ ] Multiple texture support (front/back)
- [ ] Batch processing for existing rolls
- [ ] Export to different formats (WEBP, AVIF)
- [ ] Server-side rendering for headless generation
- [ ] 3D model customization (size, shape)
- [ ] Light/camera controls in UI
- [ ] Preset texture templates

## Dependencies

- **three**: ^0.170.0 - 3D rendering library

## License

Same as parent project.
