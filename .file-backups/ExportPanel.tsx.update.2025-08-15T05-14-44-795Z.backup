import React, { useState } from 'react';
import { CharacterConfig } from '../App';

interface ExportPanelProps {
  spritesheet: HTMLCanvasElement | null;
  config: CharacterConfig;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ spritesheet, config }) => {
  const [exportFormat, setExportFormat] = useState<'png' | 'json'>('png');
  const [exportScale, setExportScale] = useState(1);
  const [showPreview, setShowPreview] = useState(true);

  const downloadSpritesheet = () => {
    if (!spritesheet) return;

    if (exportFormat === 'png') {
      // Create scaled canvas if needed
      const canvas = exportScale === 1 ? spritesheet : scaleCanvas(spritesheet, exportScale);
      
      const link = document.createElement('a');
      link.download = `spritesheet_${config.animationType}_${config.size}px_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else {
      // Export JSON with metadata
      const spriteData = {
        metadata: {
          name: `Character_${config.animationType}`,
          format: 'spritesheet',
          size: {
            w: spritesheet.width,
            h: spritesheet.height
          },
          frameSize: config.size,
          frameCount: spritesheet.width / config.size,
          animationType: config.animationType,
          created: new Date().toISOString()
        },
        config: config,
        frames: generateFrameData()
      };
      
      const blob = new Blob([JSON.stringify(spriteData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.download = `spritesheet_${config.animationType}_${config.size}px_${Date.now()}.json`;
      link.href = URL.createObjectURL(blob);
      link.click();
    }
  };

  const scaleCanvas = (originalCanvas: HTMLCanvasElement, scale: number): HTMLCanvasElement => {
    const scaledCanvas = document.createElement('canvas');
    const ctx = scaledCanvas.getContext('2d');
    if (!ctx) return originalCanvas;

    scaledCanvas.width = originalCanvas.width * scale;
    scaledCanvas.height = originalCanvas.height * scale;
    
    // Disable smoothing for pixel art
    ctx.imageSmoothingEnabled = false;
    
    ctx.drawImage(originalCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
    
    return scaledCanvas;
  };

  const generateFrameData = () => {
    if (!spritesheet) return [];
    
    const frameCount = spritesheet.width / config.size;
    const frames = [];
    
    for (let i = 0; i < frameCount; i++) {
      frames.push({
        frame: {
          x: i * config.size,
          y: 0,
          w: config.size,
          h: config.size
        },
        rotated: false,
        trimmed: false,
        spriteSourceSize: {
          x: 0,
          y: 0,
          w: config.size,
          h: config.size
        },
        sourceSize: {
          w: config.size,
          h: config.size
        },
        duration: config.animationType === 'idle' ? 200 : 100
      });
    }
    
    return frames;
  };

  const copyToClipboard = async () => {
    if (!spritesheet) return;
    
    try {
      const blob = await new Promise<Blob>((resolve) => {
        spritesheet.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      alert('Spritesheet copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy to clipboard. Try downloading instead.');
    }
  };

  const getFrameCount = () => {
    if (!spritesheet) return 0;
    return spritesheet.width / config.size;
  };

  const getSpriteInfo = () => {
    if (!spritesheet) return null;
    
    return {
      dimensions: `${spritesheet.width}x${spritesheet.height}px`,
      frameCount: getFrameCount(),
      frameSize: `${config.size}x${config.size}px`,
      fileSize: Math.round(spritesheet.width * spritesheet.height * 4 / 1024) + 'KB (est.)'
    };
  };

  const info = getSpriteInfo();

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-lg p-6 border border-cyan-400/30">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4 font-mono">EXPORT PANEL</h2>
      
      {/* Sprite Info */}
      {info && (
        <div className="mb-6 p-4 bg-black/50 rounded border border-purple-400/30">
          <h3 className="text-cyan-300 mb-2 font-mono text-sm font-bold">SPRITE INFO:</h3>
          <div className="space-y-1 text-sm font-mono text-gray-300">
            <div>Dimensions: <span className="text-cyan-300">{info.dimensions}</span></div>
            <div>Frames: <span className="text-cyan-300">{info.frameCount}</span></div>
            <div>Frame Size: <span className="text-cyan-300">{info.frameSize}</span></div>
            <div>Est. Size: <span className="text-cyan-300">{info.fileSize}</span></div>
          </div>
        </div>
      )}

      {/* Export Format */}
      <div className="mb-4">
        <label className="block text-cyan-300 mb-2 font-mono text-sm font-bold">FORMAT:</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setExportFormat('png')}
            className={`p-3 rounded font-mono text-sm font-bold border-2 transition-all ${
              exportFormat === 'png'
                ? 'bg-green-500 text-white border-green-400'
                : 'bg-gray-800 text-cyan-300 border-gray-600 hover:border-green-400'
            }`}
          >
            PNG IMAGE
          </button>
          <button
            onClick={() => setExportFormat('json')}
            className={`p-3 rounded font-mono text-sm font-bold border-2 transition-all ${
              exportFormat === 'json'
                ? 'bg-blue-500 text-white border-blue-400'
                : 'bg-gray-800 text-cyan-300 border-gray-600 hover:border-blue-400'
            }`}
          >
            JSON DATA
          </button>
        </div>
      </div>

      {/* Export Scale */}
      {exportFormat === 'png' && (
        <div className="mb-4">
          <label className="block text-cyan-300 mb-2 font-mono text-sm font-bold">
            SCALE: {exportScale}x
          </label>
          <input
            type="range"
            min="1"
            max="4"
            step="1"
            value={exportScale}
            onChange={(e) => setExportScale(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 font-mono mt-1">
            <span>1x</span>
            <span>2x</span>
            <span>3x</span>
            <span>4x</span>
          </div>
        </div>
      )}

      {/* Preview Toggle */}
      <div className="mb-4">
        <label className="flex items-center text-cyan-300 font-mono text-sm">
          <input
            type="checkbox"
            checked={showPreview}
            onChange={(e) => setShowPreview(e.target.checked)}
            className="mr-2"
          />
          Show Preview
        </label>
      </div>

      {/* Preview */}
      {showPreview && spritesheet && (
        <div className="mb-4 p-4 bg-black/50 rounded border border-purple-400/30">
          <h3 className="text-cyan-300 mb-2 font-mono text-sm font-bold">PREVIEW:</h3>
          <div className="bg-gray-800 p-2 rounded overflow-x-auto">
            <canvas
              width={spritesheet.width}
              height={spritesheet.height}
              ref={(canvas) => {
                if (canvas && spritesheet) {
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(spritesheet, 0, 0);
                  }
                }
              }}
              className="border border-gray-600"
              style={{ 
                imageRendering: config.style === 'pixel' ? 'pixelated' : 'auto',
                maxWidth: '100%',
                height: 'auto'
              }}
            />
          </div>
        </div>
      )}

      {/* Export Actions */}
      <div className="space-y-2">
        <button
          onClick={downloadSpritesheet}
          disabled={!spritesheet}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 text-white rounded font-mono font-bold border border-green-400/50 transition-all duration-200"
        >
          📥 DOWNLOAD {exportFormat.toUpperCase()}
        </button>
        
        {exportFormat === 'png' && (
          <button
            onClick={copyToClipboard}
            disabled={!spritesheet}
            className="w-full px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-600 text-white rounded font-mono text-sm border border-purple-400/50 transition-all duration-200"
          >
            📋 COPY TO CLIPBOARD
          </button>
        )}
      </div>

      {/* Usage Tips */}
      <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded">
        <h3 className="text-yellow-400 mb-2 font-mono text-sm font-bold">💡 USAGE TIPS:</h3>
        <ul className="text-xs text-yellow-200 space-y-1 font-mono">
          <li>• Use PNG for game engines</li>
          <li>• Use JSON for animation data</li>
          <li>• Scale up for retro pixel art</li>
          <li>• Frame timing in JSON is in ms</li>
        </ul>
      </div>
    </div>
  );
};