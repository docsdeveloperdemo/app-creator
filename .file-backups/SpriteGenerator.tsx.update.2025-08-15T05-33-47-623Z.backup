import React, { useRef, useEffect, useState } from 'react';
import { CharacterConfig } from '../types';

interface SpriteGeneratorProps {
  character: CharacterConfig;
  animationFrame: number;
}

const SpriteGenerator: React.FC<SpriteGeneratorProps> = ({ character, animationFrame }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spriteData, setSpriteData] = useState<string>('');

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
    
    // Left leg
    drawPixelRect(ctx, centerX - 3, centerY + 4, 2, 6, bodyColor);
    drawPixelRect(ctx, centerX - 3, centerY + 10, 3, 2, '#2D1B1B'); // boot
    
    // Right leg  
    drawPixelRect(ctx, centerX + 1 + legOffset, centerY + 4, 2, 6, bodyColor);
    drawPixelRect(ctx, centerX + 1 + legOffset, centerY + 10, 3, 2, '#2D1B1B'); // boot
  };

  const drawBody = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, bodyColor: string) => {
    // Main body
    drawPixelRect(ctx, centerX - 4, centerY - 2, 8, 8, bodyColor);
    
    // Body shading
    drawPixelRect(ctx, centerX + 3, centerY - 2, 1, 8, darkenColor(bodyColor, 20));
    drawPixelRect(ctx, centerX - 4, centerY + 5, 8, 1, darkenColor(bodyColor, 15));
  };

  const drawArms = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, skinColor: string, swing: number) => {
    // Left arm
    drawPixelRect(ctx, centerX - 6, centerY, 2, 5, skinColor);
    drawPixel(ctx, centerX - 6, centerY + 5, darkenColor(skinColor, 15));
    
    // Right arm with swing
    drawPixelRect(ctx, centerX + 4 + swing * 0.5, centerY + swing * 0.3, 2, 5, skinColor);
    drawPixel(ctx, centerX + 4 + swing * 0.5, centerY + 5 + swing * 0.3, darkenColor(skinColor, 15));
  };

  const drawHead = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, skinColor: string) => {
    // Head shape
    drawPixelRect(ctx, centerX - 4, centerY - 4, 8, 8, skinColor);
    
    // Head shading
    drawPixelRect(ctx, centerX + 3, centerY - 4, 1, 8, darkenColor(skinColor, 15));
    drawPixelRect(ctx, centerX - 4, centerY + 3, 8, 1, darkenColor(skinColor, 10));
  };

  const drawHair = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, hairColor: string, hairStyle: string) => {
    switch (hairStyle) {
      case 'spiky':
        // Spiky hair points
        drawPixel(ctx, centerX - 3, centerY - 6, hairColor);
        drawPixel(ctx, centerX - 1, centerY - 7, hairColor);
        drawPixel(ctx, centerX + 1, centerY - 6, hairColor);
        drawPixel(ctx, centerX + 3, centerY - 5, hairColor);
        drawPixelRect(ctx, centerX - 4, centerY - 5, 8, 2, hairColor);
        break;
      case 'long':
        // Long flowing hair
        drawPixelRect(ctx, centerX - 5, centerY - 5, 10, 3, hairColor);
        drawPixelRect(ctx, centerX - 3, centerY + 4, 2, 3, hairColor);
        drawPixelRect(ctx, centerX + 1, centerY + 4, 2, 4, hairColor);
        break;
      case 'curly':
        // Curly/afro style
        drawPixelRect(ctx, centerX - 5, centerY - 6, 10, 4, hairColor);
        drawPixel(ctx, centerX - 6, centerY - 4, hairColor);
        drawPixel(ctx, centerX + 5, centerY - 4, hairColor);
        break;
      default: // short
        drawPixelRect(ctx, centerX - 4, centerY - 5, 8, 2, hairColor);
    }
  };

  const drawFace = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, skinColor: string) => {
    // Eyes
    drawPixel(ctx, centerX - 2, centerY - 2, '#000000');
    drawPixel(ctx, centerX + 1, centerY - 2, '#000000');
    
    // Eye highlights
    drawPixel(ctx, centerX - 2, centerY - 3, '#FFFFFF');
    drawPixel(ctx, centerX + 1, centerY - 3, '#FFFFFF');
    
    // Nose (subtle)
    drawPixel(ctx, centerX, centerY - 1, darkenColor(skinColor, 20));
    
    // Mouth
    drawPixel(ctx, centerX - 1, centerY + 1, '#8B4513');
    drawPixel(ctx, centerX, centerY + 1, '#8B4513');
  };

  const drawOutfitDetails = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, outfitStyle: string) => {
    switch (outfitStyle) {
      case 'warrior':
        // Belt
        drawPixelRect(ctx, centerX - 4, centerY + 2, 8, 1, '#8B4513');
        // Armor plates
        drawPixel(ctx, centerX - 2, centerY - 1, '#C0C0C0');
        drawPixel(ctx, centerX + 1, centerY - 1, '#C0C0C0');
        break;
      case 'mage':
        // Robe trim
        drawPixelRect(ctx, centerX - 4, centerY - 2, 1, 8, '#DAA520');
        drawPixelRect(ctx, centerX + 3, centerY - 2, 1, 8, '#DAA520');
        drawPixelRect(ctx, centerX - 4, centerY + 5, 8, 1, '#DAA520');
        break;
      case 'rogue':
        // Cloak
        drawPixel(ctx, centerX - 5, centerY - 1, '#2F2F2F');
        drawPixel(ctx, centerX + 4, centerY, '#2F2F2F');
        break;
    }
  };

  const darkenColor = (color: string, percent: number): string => {
    // Simple color darkening function
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const darkerR = Math.max(0, Math.floor(r * (100 - percent) / 100));
    const darkerG = Math.max(0, Math.floor(g * (100 - percent) / 100));
    const darkerB = Math.max(0, Math.floor(b * (100 - percent) / 100));
    
    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
  };

  return (
    <div className="sprite-generator">
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2">Character Sprite</h3>
        <div className="bg-gray-800 p-4 rounded-lg inline-block">
          <canvas 
            ref={canvasRef}
            className="pixelated border-2 border-gray-600"
            style={{
              imageRendering: 'pixelated',
              imageRendering: '-moz-crisp-edges',
              imageRendering: 'crisp-edges',
              width: '128px',
              height: '128px'
            }}
          />
        </div>
      </div>
      
      <div className="text-sm text-gray-400">
        <p>32x32 pixel classic sprite</p>
        <p>Late 90s RPG style</p>
      </div>
    </div>
  );
};

export default SpriteGenerator;