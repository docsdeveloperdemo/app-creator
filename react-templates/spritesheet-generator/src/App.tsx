import React, { useState, useEffect } from 'react';
import CharacterCustomizer from './components/CharacterCustomizer';
import SpriteGenerator from './components/SpriteGenerator';
import ExportPanel from './components/ExportPanel';
import { Character } from './types';
import './App.css';

function App() {
  const [character, setCharacter] = useState<Character>({
    skinColor: '#FFDBAC',
    hairColor: '#8B4513',
    hairStyle: 'Short',
    outfitColor: '#4A90E2',
    outfitStyle: 'Casual'
  });
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [generatedSprite, setGeneratedSprite] = useState<string | null>(null);

  // Function to handle frame changes during animation
  const handleFrameChange = (frame: number) => {
    setCurrentFrame(frame);
  };

  // Toggle animation play/pause
  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  // Function to handle character customization changes
  const handleCharacterChange = (updates: Partial<Character>) => {
    setCharacter(prev => ({ ...prev, ...updates }));
  };

  // Function to handle sprite generation (called from SpriteGenerator)
  const handleSpriteGenerated = (spriteDataUrl: string) => {
    setGeneratedSprite(spriteDataUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <span className="text-2xl">🎮</span>
            Fighting Sprite Generator
          </h1>
          <p className="text-gray-300">Create classic late 90s RPG-style character sprites</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Character Customizer */}
          <div className="lg:col-span-1">
            <CharacterCustomizer
              character={character}
              onCharacterChange={handleCharacterChange}
            />
          </div>

          {/* Character Sprite Display */}
          <div className="lg:col-span-1">
            <SpriteGenerator
              character={character}
              isAnimating={isAnimating}
              currentFrame={currentFrame}
              onFrameChange={handleFrameChange}
            />
          </div>

          {/* Export Options */}
          <div className="lg:col-span-1">
            <ExportPanel
              character={character}
              currentFrame={currentFrame}
              generatedSprite={generatedSprite}
            />
          </div>
        </div>

        {/* Animation Controls */}
        <div className="flex justify-center">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-white text-lg font-bold mb-4">Animation Controls</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleAnimation}
                className={`px-4 py-2 rounded font-bold text-white transition-colors ${
                  isAnimating 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isAnimating ? '⏸️ Pause' : '▶️ Play'}
              </button>
              <span className="text-gray-300">Frame: {currentFrame}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Classic 32×32 pixel art sprites • Retro gaming aesthetic
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;