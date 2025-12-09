import { useEffect, useRef, useState } from 'react';
import { renderCanisterToCanvas } from '../utils/canisterRenderer';

/**
 * CanisterPreview Component
 * 
 * Displays a live 3D preview of a film canister with custom texture
 * Allows users to generate thumbnails from the rendered view
 */
export default function CanisterPreview({ textureUrl, onGenerate, config = {} }) {
  const containerRef = useRef(null);
  const [renderer, setRenderer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [textureRotation, setTextureRotation] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !textureUrl) return;

    setLoading(true);

    let canvasRenderer;
    try {
      canvasRenderer = renderCanisterToCanvas(
        containerRef.current,
        textureUrl,
        { ...config, textureRotation }
      );

      setRenderer(canvasRenderer);
      setLoading(false);
    } catch (error) {
      console.error('Failed to render canister:', error);
      setLoading(false);
    }

    return () => {
      if (canvasRenderer) {
        canvasRenderer.dispose();
      }
    };
  }, [textureUrl, config, textureRotation]);

  const handleScreenshot = () => {
    if (renderer && onGenerate) {
      const dataURL = renderer.screenshot();
      onGenerate(dataURL);
    }
  };

  const handleFlipRotation = () => {
    setTextureRotation((prev) => prev + Math.PI);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg shadow">
      <div className="text-sm font-medium text-gray-700">Canister Preview</div>
      
      <div 
        ref={containerRef} 
        className="border border-gray-300 rounded bg-gray-50 relative"
        style={{ width: config.width || 400, height: config.height || 400 }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500">Loading 3D preview...</div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handleFlipRotation}
          disabled={!renderer}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          🔄 Flip 180°
        </button>
        
        <button
          onClick={handleScreenshot}
          disabled={!renderer}
          className="px-4 py-2 bg-film-cyan text-white rounded hover:bg-film-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          📸 Generate Thumbnail
        </button>
      </div>
    </div>
  );
}
