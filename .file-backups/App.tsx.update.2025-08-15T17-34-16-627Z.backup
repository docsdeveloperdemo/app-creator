import React, { useState, useEffect } from 'react';
import SpriteGenerator from './components/SpriteGenerator';
import ExportPanel from './components/ExportPanel';
import CharacterCustomizer from './components/CharacterCustomizer';
import './App.css';

interface SpriteConfig {
  skinColor: string;
  hairColor: string;
  hairStyle: string;
  outfitColor: string;
  outfitStyle: string;
}

function App() {
  const [config, setConfig] = useState<SpriteConfig>({
    skinColor: 'light',
    hairColor: 'brown',
    hairStyle: 'Short',
    outfitColor: 'blue',
    outfitStyle: 'Casual'
  });
  
  const [isAnimating, setIsAnimating] = useState(true); // Changed to start with animation ON
  const [currentFrame, setCurrentFrame] = useState(0);

  // Animation loop
  useEffect(() => {
    if (!isAnimating) return;
    
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % 100);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isAnimating]);

  const handleConfigChange = (newConfig: Partial<SpriteConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const toggleAnimation = () => {
    setIsAnimating(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            🎮 Fighting Sprite Generator
          </h1>
          <p className="text-gray-300 text-lg">Create classic late 90s RPG-style character sprites</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Character Customizer */}
          <div className="lg:col-span-1">
            <CharacterCustomizer config={config} onConfigChange={handleConfigChange} />
            
            {/* Animation Controls */}
            <div className="bg-gray-800 rounded-lg p-6 mt-6">
              <h3 className="text-xl font-bold text-white mb-4">Animation Controls</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleAnimation}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isAnimating 
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isAnimating ? '⏸️ Pause' : '▶️ Play'}
                </button>
                <span className="text-gray-300">
                  Frame: {currentFrame}
                </span>
              </div>
            </div>
          </div>
          
          {/* Character Sprite */}
          <div className="lg:col-span-1">
            <SpriteGenerator 
              config={config} 
              isAnimating={isAnimating}
              currentFrame={currentFrame}
            />
          </div>
          
          {/* Export Panel */}
          <div className="lg:col-span-1">
            <ExportPanel config={config} currentFrame={currentFrame} />
          </div>
        </div>
        
        <footer className="text-center mt-8 text-gray-400 text-sm">
          Classic 32×32 pixel art sprites • Retro gaming aesthetic
        </footer>
      </div>
    </div>
  );
}

export default App;