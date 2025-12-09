/**
 * Demo page for testing the canister renderer
 * Navigate to /canister-demo to see it
 */

import { useState } from 'react';
import CanisterPreview from '../components/CanisterPreview';

export default function CanisterDemo() {
  const [textureFile, setTextureFile] = useState(null);
  const [texturePreview, setTexturePreview] = useState('/sample-label.svg');
  const [thumbnail, setThumbnail] = useState(null);

  const handleTextureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTextureFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setTexturePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleThumbnailGenerate = (dataURL) => {
    setThumbnail(dataURL);
    console.log('Thumbnail generated! Ready to upload.');
    
    // Convert to blob for uploading
    fetch(dataURL)
      .then(res => res.blob())
      .then(blob => {
        console.log('Thumbnail blob:', blob);
        // Here you would upload to your backend
        // const formData = new FormData();
        // formData.append('thumbnail', blob, 'canister-thumbnail.png');
        // await uploadThumbnail(formData);
      });
  };

  const handleDownload = () => {
    if (thumbnail) {
      const link = document.createElement('a');
      link.href = thumbnail;
      link.download = 'canister-thumbnail.png';
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🎞️ Canister Thumbnail Generator</h1>
        <p className="text-gray-600 mb-8">
          Upload a label texture to generate a 3D canister thumbnail with shadows and lighting
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Upload */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">1. Upload Label Texture</h2>
              <input
                type="file"
                accept="image/*"
                onChange={handleTextureUpload}
                className="block w-full text-sm text-gray-600
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-film-cyan file:text-white
                  hover:file:bg-film-cyan/90
                  cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-2">
                Best results with rectangular labels (aspect ratio 2:1 or 3:1)
              </p>

              {texturePreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Uploaded texture:</p>
                  <img 
                    src={texturePreview} 
                    alt="Label texture" 
                    className="max-w-full h-auto border border-gray-300 rounded"
                  />
                </div>
              )}
            </div>

            {thumbnail && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">2. Generated Thumbnail</h2>
                <img 
                  src={thumbnail} 
                  alt="Generated canister thumbnail" 
                  className="w-full h-auto border border-gray-300 rounded mb-4"
                />
                <button
                  onClick={handleDownload}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  ⬇️ Download Thumbnail
                </button>
              </div>
            )}
          </div>

          {/* Right column - 3D Preview */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">3D Preview</h2>
            
            {texturePreview ? (
              <CanisterPreview
                textureUrl={texturePreview}
                onGenerate={handleThumbnailGenerate}
                config={{
                  width: 400,
                  height: 400,
                  enableShadows: true,
                  backgroundColor: null, // Transparent background
                  autoRotate: false,
                  enableOrbit: false,
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">🎞️</div>
                  <div className="text-sm">Upload a texture to see preview</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips section */}
        {/* <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Tips for Best Results</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Use high-resolution images (at least 800px wide)</li>
            <li>• Label designs should wrap around the cylinder seamlessly</li>
            <li>• Rectangular aspect ratios work best (2:1 or 3:1)</li>
            <li>• Drag with mouse to rotate view, scroll to zoom in/out</li>
            <li>• Enable auto-rotate to see all sides before generating</li>
            <li>• Try different background colors for contrast</li>
          </ul>
        </div> */}
      </div>
    </div>
  );
}
