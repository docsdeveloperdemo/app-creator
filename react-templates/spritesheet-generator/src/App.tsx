import React, { useState, useEffect } from 'react';
import CharacterCustomizer from './components/CharacterCustomizer';
import SpriteGenerator from './components/SpriteGenerator';
import ExportPanel from './components/ExportPanel';
import { CharacterConfig } from './types';
import './App.css';

function App() {
  const [character, setCharacter] = useState<CharacterConfig>({
    skinColor: '#FDBCB4',
    hairColor: '#8B4513',
    hairStyle: 'short',
    bodyColor: '#4682B4',
    outfitStyle: 'casual'
  });

  const [animationFrame, setAnimationFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isAnimating) return;
    
    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [isAnimating]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎮 Fighting Sprite Generator
          </h1>
          <p className="text-gray-300 text-lg">
            Create classic late 90s RPG-style character sprites
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Character Customizer */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <CharacterCustomizer 
                character={character} 
                onCharacterChange={setCharacter} 
              />
            </div>
            
            {/* Animation Controls */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl mt-4">
              <h3 className="text-lg font-bold text-white mb-4">Animation Controls</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsAnimating(!isAnimating)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isAnimating 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isAnimating ? '⏸️ Pause' : '▶️ Play'}
                </button>
                <span className="text-gray-300">Frame: {animationFrame}</span>
              </div>
            </div>
          </div>

          {/* Sprite Display */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <SpriteGenerator 
                character={character} 
                animationFrame={animationFrame} 
              />
            </div>
          </div>

          {/* Export Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <ExportPanel 
                character={character} 
                animationFrame={animationFrame}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-400">
          <p>Classic 32x32 pixel art sprites • Retro gaming aesthetic</p>
        </footer>
      </div>
    </div>
  );
}

export default App;