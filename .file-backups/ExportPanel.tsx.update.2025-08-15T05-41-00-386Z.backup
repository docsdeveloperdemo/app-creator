import React, { useRef, useEffect, useState } from 'react';
import { CharacterConfig } from '../types';

interface ExportPanelProps {
  character: CharacterConfig;
  animationFrame: number;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ character, animationFrame }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spriteData, setSpriteData] = useState<string>('');
  const [spritesheetData, setSpritesheetData] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate single sprite
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for classic sprite dimensions
    canvas.width = 32;
    canvas.height = 32;
    
    // Disable image smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawClassicSprite(ctx, character, animationFrame);
    
    // Convert to data URL for export
    setSpriteData(canvas.toDataURL());
  }, [character, animationFrame]);

  const drawClassicSprite = (ctx: CanvasRenderingContext2D, character: CharacterConfig, frame: number) => {
    const centerX = 16;
    const centerY = 16;
    
    // Animation offset for idle/walk cycles
    const bobOffset = Math.sin(frame * 0.3) * 0.5;
    const armSwing = Math.sin(frame * 0.4) * 2;
    
    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(centerX - 6, 30, 12, 2);
    
    // Draw legs with animation
    drawLegs(ctx, centerX, centerY + bobOffset, character.bodyColor, frame);
    
    // Draw body
    drawBody(ctx, centerX, centerY - 4 + bobOffset, character.bodyColor);
    
    // Draw arms with swing animation
    drawArms(ctx, centerX, centerY - 4 + bobOffset, character.skinColor, armSwing);
    
    // Draw head
    drawHead(ctx, centerX, centerY - 10 + bobOffset, character.skinColor);
    
    // Draw hair
    drawHair(ctx, centerX, centerY - 10 + bobOffset, character.hairColor, character.hairStyle);
    
    // Draw face
    drawFace(ctx, centerX, centerY - 10 + bobOffset, character.skinColor);
    
    // Draw outfit details
    drawOutfitDetails(ctx, centerX, centerY - 4 + bobOffset, character.outfitStyle);
  };

  const drawPixelRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
  };

  const drawPixel = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    drawPixelRect(ctx, x, y, 1, 1, color);
  };

  const drawLegs = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, bodyColor: string, frame: number) => {
    const legOffset = Math.sin(frame * 0.5) * 1;
    drawPixelRect(ctx, centerX - 3, centerY + 4, 2, 6, bodyColor);
    drawPixelRect(ctx, centerX - 3, centerY + 10, 3, 2, '#2D1B1B');
    drawPixelRect(ctx, centerX + 1 + legOffset, centerY + 4, 2, 6, bodyColor);
    drawPixelRect(ctx, centerX + 1 + legOffset, centerY + 10, 3, 2, '#2D1B1B');
  };

  const drawBody = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, bodyColor: string) => {
    drawPixelRect(ctx, centerX - 4, centerY - 2, 8, 8, bodyColor);
    drawPixelRect(ctx, centerX + 3, centerY - 2, 1, 8, darkenColor(bodyColor, 20));
    drawPixelRect(ctx, centerX - 4, centerY + 5, 8, 1, darkenColor(bodyColor, 15));
  };

  const drawArms = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, skinColor: string, swing: number) => {
    drawPixelRect(ctx, centerX - 6, centerY, 2, 5, skinColor);
    drawPixel(ctx, centerX - 6, centerY + 5, darkenColor(skinColor, 15));
    drawPixelRect(ctx, centerX + 4 + swing * 0.5, centerY + swing * 0.3, 2, 5, skinColor);
    drawPixel(ctx, centerX + 4 + swing * 0.5, centerY + 5 + swing * 0.3, darkenColor(skinColor, 15));
  };

  const drawHead = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, skinColor: string) => {
    drawPixelRect(ctx, centerX - 4, centerY - 4, 8, 8, skinColor);
    drawPixelRect(ctx, centerX + 3, centerY - 4, 1, 8, darkenColor(skinColor, 15));
    drawPixelRect(ctx, centerX - 4, centerY + 3, 8, 1, darkenColor(skinColor, 10));
  };

  const drawHair = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, hairColor: string, hairStyle: string) => {
    switch (hairStyle) {
      case 'spiky':
        drawPixel(ctx, centerX - 3, centerY - 6, hairColor);
        drawPixel(ctx, centerX - 1, centerY - 7, hairColor);
        drawPixel(ctx, centerX + 1, centerY - 6, hairColor);
        drawPixel(ctx, centerX + 3, centerY - 5, hairColor);
        drawPixelRect(ctx, centerX - 4, centerY - 5, 8, 2, hairColor);
        break;
      case 'long':
        drawPixelRect(ctx, centerX - 5, centerY - 5, 10, 3, hairColor);
        drawPixelRect(ctx, centerX - 3, centerY + 4, 2, 3, hairColor);
        drawPixelRect(ctx, centerX + 1, centerY + 4, 2, 4, hairColor);
        break;
      case 'curly':
        drawPixelRect(ctx, centerX - 5, centerY - 6, 10, 4, hairColor);
        drawPixel(ctx, centerX - 6, centerY - 4, hairColor);
        drawPixel(ctx, centerX + 5, centerY - 4, hairColor);
        break;
      default:
        drawPixelRect(ctx, centerX - 4, centerY - 5, 8, 2, hairColor);
    }
  };

  const drawFace = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, skinColor: string) => {
    drawPixel(ctx, centerX - 2, centerY - 2, '#000000');
    drawPixel(ctx, centerX + 1, centerY - 2, '#000000');
    drawPixel(ctx, centerX - 2, centerY - 3, '#FFFFFF');
    drawPixel(ctx, centerX + 1, centerY - 3, '#FFFFFF');
    drawPixel(ctx, centerX, centerY - 1, darkenColor(skinColor, 20));
    drawPixel(ctx, centerX - 1, centerY + 1, '#8B4513');
    drawPixel(ctx, centerX, centerY + 1, '#8B4513');
  };

  const drawOutfitDetails = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, outfitStyle: string) => {
    switch (outfitStyle) {
      case 'warrior':
        drawPixelRect(ctx, centerX - 4, centerY + 2, 8, 1, '#8B4513');
        drawPixel(ctx, centerX - 2, centerY - 1, '#C0C0C0');
        drawPixel(ctx, centerX + 1, centerY - 1, '#C0C0C0');
        break;
      case 'mage':
        drawPixelRect(ctx, centerX - 4, centerY - 2, 1, 8, '#DAA520');
        drawPixelRect(ctx, centerX + 3, centerY - 2, 1, 8, '#DAA520');
        drawPixelRect(ctx, centerX - 4, centerY + 5, 8, 1, '#DAA520');
        break;
      case 'rogue':
        drawPixel(ctx, centerX - 5, centerY - 1, '#2F2F2F');
        drawPixel(ctx, centerX + 4, centerY, '#2F2F2F');
        break;
    }
  };

  const darkenColor = (color: string, percent: number): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const darkerR = Math.max(0, Math.floor(r * (100 - percent) / 100));
    const darkerG = Math.max(0, Math.floor(g * (100 - percent) / 100));
    const darkerB = Math.max(0, Math.floor(b * (100 - percent) / 100));
    
    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
  };

  const generateSpritesheet = async () => {
    setIsGenerating(true);
    
    // Create a larger canvas for spritesheet (8 frames x 4 directions)
    const spritesheetCanvas = document.createElement('canvas');
    spritesheetCanvas.width = 256; // 8 frames * 32px
    spritesheetCanvas.height = 128; // 4 directions * 32px
    
    const ctx = spritesheetCanvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    
    // Clear the spritesheet canvas
    ctx.clearRect(0, 0, spritesheetCanvas.width, spritesheetCanvas.height);
    
    // Generate different animation frames and directions
    const directions = ['idle', 'walk', 'attack', 'hit'];
    const framesPerDirection = 8;
    
    for (let dir = 0; dir < directions.length; dir++) {
      for (let frame = 0; frame < framesPerDirection; frame++) {
        const x = frame * 32;
        const y = dir * 32;
        
        // Save context state
        ctx.save();
        
        // Translate to current sprite position
        ctx.translate(x, y);
        
        // Draw the sprite with different animation states
        const animFrame = frame + (dir * 20); // Offset frames for different directions
        drawClassicSprite(ctx, character, animFrame);
        
        // Restore context state
        ctx.restore();
      }
    }
    
    // Convert spritesheet to data URL
    setSpritesheetData(spritesheetCanvas.toDataURL());
    setIsGenerating(false);
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="export-panel">
      <h3 className="text-lg font-bold text-white mb-4">Export Options</h3>
      
      {/* Current Sprite Preview */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Current Sprite</h4>
        <div className="bg-gray-700 p-4 rounded-lg inline-block">
          <canvas 
            ref={canvasRef}
            className="pixelated border border-gray-600"
            style={{
              imageRendering: 'pixelated',
              width: '64px',
              height: '64px'
            }}
          />
        </div>
      </div>

      {/* Download Current Sprite */}
      <div className="mb-6">
        <button
          onClick={() => downloadImage(spriteData, 'character-sprite.png')}
          disabled={!spriteData}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
        >
          📸 Download Current Frame
        </button>
      </div>

      {/* Generate Full Spritesheet */}
      <div className="mb-6">
        <button
          onClick={generateSpritesheet}
          disabled={isGenerating}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
        >
          {isGenerating ? '⏳ Generating...' : '🎬 Generate Full Spritesheet'}
        </button>
        <p className="text-xs text-gray-400 mt-2">
          Creates 32 frames (8 frames × 4 animations)
        </p>
      </div>

      {/* Spritesheet Preview */}
      {spritesheetData && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Spritesheet Preview</h4>
          <div className="bg-gray-700 p-4 rounded-lg">
            <img 
              src={spritesheetData}
              alt="Spritesheet"
              className="pixelated border border-gray-600 max-w-full"
              style={{
                imageRendering: 'pixelated',
                width: '100%',
                maxWidth: '256px'
              }}
            />
          </div>
          <button
            onClick={() => downloadImage(spritesheetData, 'character-spritesheet.png')}
            className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
          >
            📁 Download Spritesheet
          </button>
        </div>
      )}

      {/* Export Info */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Export Info</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Format: PNG with transparency</li>
          <li>• Size: 32×32 pixels per frame</li>
          <li>• Style: Late 90s pixel art</li>
          <li>• Spritesheet: 256×128 total size</li>
        </ul>
      </div>
    </div>
  );
};

export default ExportPanel;