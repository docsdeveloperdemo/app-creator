import React, { useRef, useEffect } from 'react';

interface SpriteConfig {
  skinColor: string;
  hairColor: string;
  hairStyle: string;
  outfitColor: string;
  outfitStyle: string;
}

interface SpriteGeneratorProps {
  config: SpriteConfig;
  isAnimating: boolean;
  currentFrame: number;
}

const SpriteGenerator: React.FC<SpriteGeneratorProps> = ({ config, isAnimating, currentFrame }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Default config fallback to prevent crashes
  const safeConfig = {
    skinColor: config?.skinColor || 'light',
    hairColor: config?.hairColor || 'brown',
    hairStyle: config?.hairStyle || 'Short',
    outfitColor: config?.outfitColor || 'blue',
    outfitStyle: config?.outfitStyle || 'Casual'
  };

  // Enhanced color palettes with shading
  const skinTones = {
    light: { base: '#FDBCB4', shadow: '#E8A194', highlight: '#FDD5CE' },
    medium: { base: '#C68642', shadow: '#A66D32', highlight: '#D49A5A' },
    tan: { base: '#D2B48C', shadow: '#B8956B', highlight: '#E5C99F' },
    olive: { base: '#8D7053', shadow: '#6B5439', highlight: '#A68B6B' },
    dark: { base: '#5D4037', shadow: '#3E2723', highlight: '#795548' }
  };

  const hairColors = {
    blonde: { base: '#F4C430', shadow: '#D4A017', highlight: '#FFF380' },
    brown: { base: '#8B4513', shadow: '#654321', highlight: '#A0522D' },
    black: { base: '#2C1810', shadow: '#1A0E08', highlight: '#3E2723' },
    red: { base: '#CC4125', shadow: '#A0251C', highlight: '#E85D3D' },
    gray: { base: '#808080', shadow: '#606060', highlight: '#A0A0A0' },
    purple: { base: '#8B008B', shadow: '#660066', highlight: '#B300B3' }
  };

  const outfitColors = {
    blue: { base: '#1976D2', shadow: '#0D47A1', highlight: '#42A5F5' },
    red: { base: '#D32F2F', shadow: '#B71C1C', highlight: '#EF5350' },
    green: { base: '#388E3C', shadow: '#1B5E20', highlight: '#66BB6A' },
    purple: { base: '#7B1FA2', shadow: '#4A148C', highlight: '#AB47BC' },
    gray: { base: '#616161', shadow: '#424242', highlight: '#9E9E9E' },
    brown: { base: '#5D4037', shadow: '#3E2723', highlight: '#8D6E63' }
  };

  const getSkinColor = (type: 'base' | 'shadow' | 'highlight' = 'base') => {
    const skinKey = safeConfig.skinColor as keyof typeof skinTones;
    return skinTones[skinKey]?.[type] || skinTones.light[type];
  };

  const getHairColor = (type: 'base' | 'shadow' | 'highlight' = 'base') => {
    const hairKey = safeConfig.hairColor as keyof typeof hairColors;
    return hairColors[hairKey]?.[type] || hairColors.brown[type];
  };

  const getOutfitColor = (type: 'base' | 'shadow' | 'highlight' = 'base') => {
    const outfitKey = safeConfig.outfitColor as keyof typeof outfitColors;
    return outfitColors[outfitKey]?.[type] || outfitColors.blue[type];
  };

  const drawPixel = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  };

  const drawEnhancedCharacter = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, 32, 32);
    
    // Animation offset for idle breathing
    const breathOffset = isAnimating ? Math.sin(currentFrame * 0.3) * 0.5 : 0;
    const baseY = Math.floor(breathOffset);

    // Head (8x8) - Enhanced with shading
    // Head outline and base
    for (let y = 6 + baseY; y < 14 + baseY; y++) {
      for (let x = 12; x < 20; x++) {
        if ((y === 6 + baseY || y === 13 + baseY) && (x >= 13 && x <= 18)) {
          drawPixel(ctx, x, y, getSkinColor('shadow'));
        } else if ((x === 12 || x === 19) && (y >= 7 + baseY && y <= 12 + baseY)) {
          drawPixel(ctx, x, y, getSkinColor('shadow'));
        } else if (y >= 7 + baseY && y <= 12 + baseY && x >= 13 && x <= 18) {
          // Face shading on right side
          if (x >= 17) {
            drawPixel(ctx, x, y, getSkinColor('shadow'));
          } else {
            drawPixel(ctx, x, y, getSkinColor('base'));
          }
        }
      }
    }

    // Face highlights
    drawPixel(ctx, 14, 7 + baseY, getSkinColor('highlight'));
    drawPixel(ctx, 15, 7 + baseY, getSkinColor('highlight'));

    // Eyes with more detail
    drawPixel(ctx, 14, 9 + baseY, '#000000'); // Left eye
    drawPixel(ctx, 17, 9 + baseY, '#000000'); // Right eye
    drawPixel(ctx, 14, 8 + baseY, '#FFFFFF'); // Eye highlight
    drawPixel(ctx, 17, 8 + baseY, '#FFFFFF'); // Eye highlight

    // Nose (subtle)
    drawPixel(ctx, 16, 10 + baseY, getSkinColor('shadow'));

    // Mouth
    drawPixel(ctx, 15, 11 + baseY, '#8B4513');
    drawPixel(ctx, 16, 11 + baseY, '#8B4513');

    // Enhanced Hair based on style
    if (safeConfig.hairStyle === 'Short') {
      // Short hair with texture
      for (let y = 6 + baseY; y < 10 + baseY; y++) {
        for (let x = 12; x < 20; x++) {
          if ((y === 6 + baseY && x >= 13 && x <= 18) ||
              (y === 7 + baseY && (x === 12 || x === 19 || (x >= 13 && x <= 18))) ||
              (y === 8 + baseY && (x === 12 || x === 19)) ||
              (y === 9 + baseY && (x === 12 || x === 19))) {
            // Hair shading
            if (x >= 17 || y >= 8 + baseY) {
              drawPixel(ctx, x, y, getHairColor('shadow'));
            } else {
              drawPixel(ctx, x, y, getHairColor('base'));
            }
          }
        }
      }
      // Hair highlights
      drawPixel(ctx, 14, 6 + baseY, getHairColor('highlight'));
      drawPixel(ctx, 15, 6 + baseY, getHairColor('highlight'));
    }

    // Enhanced Body (torso) with better shading
    for (let y = 14 + baseY; y < 22 + baseY; y++) {
      for (let x = 11; x < 21; x++) {
        if (y >= 14 + baseY && y < 22 + baseY && x >= 12 && x <= 19) {
          // Body shading on right side and bottom
          if (x >= 18 || y >= 20 + baseY) {
            drawPixel(ctx, x, y, getOutfitColor('shadow'));
          } else if (x <= 13 && y <= 15 + baseY) {
            drawPixel(ctx, x, y, getOutfitColor('highlight'));
          } else {
            drawPixel(ctx, x, y, getOutfitColor('base'));
          }
        }
        // Arms with muscle definition
        if ((x === 11 && y >= 16 + baseY && y <= 20 + baseY) ||
            (x === 20 && y >= 16 + baseY && y <= 20 + baseY)) {
          drawPixel(ctx, x, y, getOutfitColor('shadow'));
        }
      }
    }

    // Enhanced Arms with better form
    // Left arm
    for (let y = 16 + baseY; y < 21 + baseY; y++) {
      drawPixel(ctx, 10, y, getSkinColor('shadow'));
      drawPixel(ctx, 9, y, getSkinColor('base'));
    }
    // Right arm  
    for (let y = 16 + baseY; y < 21 + baseY; y++) {
      drawPixel(ctx, 21, y, getSkinColor('shadow'));
      drawPixel(ctx, 22, y, getSkinColor('base'));
    }

    // Hands with detail
    drawPixel(ctx, 9, 21 + baseY, getSkinColor('base'));
    drawPixel(ctx, 8, 21 + baseY, getSkinColor('shadow'));
    drawPixel(ctx, 22, 21 + baseY, getSkinColor('base'));
    drawPixel(ctx, 23, 21 + baseY, getSkinColor('shadow'));

    // Enhanced Legs with better proportions
    for (let y = 22 + baseY; y < 28 + baseY; y++) {
      // Left leg
      for (let x = 13; x < 16; x++) {
        if (x === 15 || y >= 26 + baseY) {
          drawPixel(ctx, x, y, getOutfitColor('shadow'));
        } else {
          drawPixel(ctx, x, y, getOutfitColor('base'));
        }
      }
      // Right leg
      for (let x = 16; x < 19; x++) {
        if (x >= 18 || y >= 26 + baseY) {
          drawPixel(ctx, x, y, getOutfitColor('shadow'));
        } else {
          drawPixel(ctx, x, y, getOutfitColor('base'));
        }
      }
    }

    // Enhanced Feet with better detail
    // Left foot
    drawPixel(ctx, 12, 28 + baseY, '#2C1810');
    drawPixel(ctx, 13, 28 + baseY, '#2C1810');
    drawPixel(ctx, 14, 28 + baseY, '#2C1810');
    drawPixel(ctx, 15, 28 + baseY, '#2C1810');
    drawPixel(ctx, 11, 29 + baseY, '#1A0E08');
    drawPixel(ctx, 12, 29 + baseY, '#1A0E08');
    drawPixel(ctx, 13, 29 + baseY, '#1A0E08');
    drawPixel(ctx, 14, 29 + baseY, '#1A0E08');
    
    // Right foot
    drawPixel(ctx, 16, 28 + baseY, '#2C1810');
    drawPixel(ctx, 17, 28 + baseY, '#2C1810');
    drawPixel(ctx, 18, 28 + baseY, '#2C1810');
    drawPixel(ctx, 19, 28 + baseY, '#2C1810');
    drawPixel(ctx, 17, 29 + baseY, '#1A0E08');
    drawPixel(ctx, 18, 29 + baseY, '#1A0E08');
    drawPixel(ctx, 19, 29 + baseY, '#1A0E08');
    drawPixel(ctx, 20, 29 + baseY, '#1A0E08');

    // Add some cool details
    // Belt
    drawPixel(ctx, 12, 21 + baseY, '#8B4513');
    drawPixel(ctx, 13, 21 + baseY, '#8B4513');
    drawPixel(ctx, 14, 21 + baseY, '#8B4513');
    drawPixel(ctx, 15, 21 + baseY, '#8B4513');
    drawPixel(ctx, 16, 21 + baseY, '#8B4513');
    drawPixel(ctx, 17, 21 + baseY, '#8B4513');
    drawPixel(ctx, 18, 21 + baseY, '#8B4513');
    drawPixel(ctx, 19, 21 + baseY, '#8B4513');
    
    // Belt buckle
    drawPixel(ctx, 15, 21 + baseY, '#FFD700');
    drawPixel(ctx, 16, 21 + baseY, '#FFD700');

    // Shirt details (buttons/seams)
    drawPixel(ctx, 15, 16 + baseY, getOutfitColor('shadow'));
    drawPixel(ctx, 16, 16 + baseY, getOutfitColor('shadow'));
    drawPixel(ctx, 15, 18 + baseY, getOutfitColor('shadow'));
    drawPixel(ctx, 16, 18 + baseY, getOutfitColor('shadow'));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Disable image smoothing for crisp pixels
    ctx.imageSmoothingEnabled = false;
    
    try {
      drawEnhancedCharacter(ctx);
    } catch (error) {
      console.error('Error drawing character:', error);
      // Draw a simple fallback character
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(15, 15, 2, 2);
    }
  }, [safeConfig, isAnimating, currentFrame]);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">Character Sprite</h3>
      <div className="flex justify-center mb-4">
        <div className="bg-gray-700 p-4 rounded border-2 border-gray-600">
          <canvas
            ref={canvasRef}
            width={32}
            height={32}
            className="w-24 h-24"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>
      <div className="text-center text-gray-300">
        <p className="text-sm">32x32 pixel enhanced sprite</p>
        <p className="text-xs opacity-75">Late 90s RPG style with modern shading</p>
      </div>
    </div>
  );
};

export default SpriteGenerator;