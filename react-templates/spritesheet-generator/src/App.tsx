import React, { useState, useRef, useEffect } from 'react';
import { SpriteGenerator } from './components/SpriteGenerator';
import { CharacterCustomizer } from './components/CharacterCustomizer';
import { ExportPanel } from './components/ExportPanel';
import './App.css';

export interface CharacterConfig {
  bodyColor: string;
  hairColor: string;
  clothingColor: string;
  size: number;
  style: 'classic' | 'modern' | 'pixel';
  animationType: 'walk' | 'run' | 'idle' | 'jump';
}

const defaultConfig: CharacterConfig = {
  bodyColor: '#F4C2A1',
  hairColor: '#8B4513',
  clothingColor: '#1E40AF',
  size: 64,
  style: 'classic',
  animationType: 'walk'
};

function App() {
  const [config, setConfig] = useState<CharacterConfig>(defaultConfig);
  const [spritesheet, setSpritesheet] = useState<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-yellow-400/30">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 font-mono">
            FIGHTING SPRITE GENERATOR
          </h1>
          <p className="text-cyan-300 mt-2 font-mono text-sm">Create retro fighting game inspired character sprites</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Character Customizer */}
          <div className="lg:col-span-1">
            <CharacterCustomizer config={config} setConfig={setConfig} />
          </div>

          {/* Sprite Generator */}
          <div className="lg:col-span-1">
            <SpriteGenerator 
              config={config} 
              setSpritesheet={setSpritesheet}
              canvasRef={canvasRef}
            />
          </div>

          {/* Export Panel */}
          <div className="lg:col-span-1">
            <ExportPanel spritesheet={spritesheet} config={config} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black/20 border-t border-yellow-400/30 mt-12">
        <div className="container mx-auto px-6 py-4 text-center">
          <p className="text-cyan-300/70 text-sm font-mono">
            Inspired by classic arcade fighting games • Original character designs
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;