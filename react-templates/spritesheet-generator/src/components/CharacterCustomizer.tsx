import React from 'react';
import { CharacterConfig } from '../App';

interface CharacterCustomizerProps {
  config: CharacterConfig;
  setConfig: (config: CharacterConfig) => void;
}

export const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({ config, setConfig }) => {
  const updateConfig = (updates: Partial<CharacterConfig>) => {
    setConfig({ ...config, ...updates });
  };

  const colorPresets = {
    body: ['#F4C2A1', '#D2B48C', '#8B6F47', '#4A4A4A', '#CD853F', '#F5DEB3'],
    hair: ['#8B4513', '#000000', '#FFD700', '#DC143C', '#4B0082', '#228B22'],
    clothing: ['#1E40AF', '#DC2626', '#059669', '#7C2D12', '#581C87', '#BE185D']
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-lg p-6 border border-cyan-400/30">
      <h2 className="text-2xl font-bold text-yellow-400 mb-6 font-mono">CHARACTER EDITOR</h2>
      
      {/* Style Selection */}
      <div className="mb-6">
        <label className="block text-cyan-300 mb-2 font-mono text-sm font-bold">RENDER STYLE:</label>
        <div className="grid grid-cols-3 gap-2">
          {(['classic', 'modern', 'pixel'] as const).map((style) => (
            <button
              key={style}
              onClick={() => updateConfig({ style })}
              className={`p-3 rounded font-mono text-sm font-bold border-2 transition-all ${
                config.style === style
                  ? 'bg-yellow-500 text-black border-yellow-400'
                  : 'bg-gray-800 text-cyan-300 border-gray-600 hover:border-cyan-400'
              }`}
            >
              {style.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Animation Type */}
      <div className="mb-6">
        <label className="block text-cyan-300 mb-2 font-mono text-sm font-bold">ANIMATION:</label>
        <div className="grid grid-cols-2 gap-2">
          {(['walk', 'run', 'idle', 'jump'] as const).map((animationType) => (
            <button
              key={animationType}
              onClick={() => updateConfig({ animationType })}
              className={`p-3 rounded font-mono text-sm font-bold border-2 transition-all ${
                config.animationType === animationType
                  ? 'bg-pink-500 text-white border-pink-400'
                  : 'bg-gray-800 text-cyan-300 border-gray-600 hover:border-pink-400'
              }`}
            >
              {animationType.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Size Slider */}
      <div className="mb-6">
        <label className="block text-cyan-300 mb-2 font-mono text-sm font-bold">
          SIZE: {config.size}px
        </label>
        <input
          type="range"
          min="32"
          max="128"
          step="16"
          value={config.size}
          onChange={(e) => updateConfig({ size: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Body Color */}
      <div className="mb-6">
        <label className="block text-cyan-300 mb-2 font-mono text-sm font-bold">BODY COLOR:</label>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="color"
            value={config.bodyColor}
            onChange={(e) => updateConfig({ bodyColor: e.target.value })}
            className="w-12 h-12 rounded border-2 border-gray-600 cursor-pointer"
          />
          <input
            type="text"
            value={config.bodyColor}
            onChange={(e) => updateConfig({ bodyColor: e.target.value })}
            className="flex-1 px-3 py-2 bg-gray-800 text-cyan-300 rounded border border-gray-600 font-mono text-sm"
          />
        </div>
        <div className="grid grid-cols-6 gap-1">
          {colorPresets.body.map((color) => (
            <button
              key={color}
              onClick={() => updateConfig({ bodyColor: color })}
              className={`w-8 h-8 rounded border-2 transition-all ${
                config.bodyColor === color ? 'border-yellow-400' : 'border-gray-600'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Hair Color */}
      <div className="mb-6">
        <label className="block text-cyan-300 mb-2 font-mono text-sm font-bold">HAIR COLOR:</label>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="color"
            value={config.hairColor}
            onChange={(e) => updateConfig({ hairColor: e.target.value })}
            className="w-12 h-12 rounded border-2 border-gray-600 cursor-pointer"
          />
          <input
            type="text"
            value={config.hairColor}
            onChange={(e) => updateConfig({ hairColor: e.target.value })}
            className="flex-1 px-3 py-2 bg-gray-800 text-cyan-300 rounded border border-gray-600 font-mono text-sm"
          />
        </div>
        <div className="grid grid-cols-6 gap-1">
          {colorPresets.hair.map((color) => (
            <button
              key={color}
              onClick={() => updateConfig({ hairColor: color })}
              className={`w-8 h-8 rounded border-2 transition-all ${
                config.hairColor === color ? 'border-yellow-400' : 'border-gray-600'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Clothing Color */}
      <div className="mb-6">
        <label className="block text-cyan-300 mb-2 font-mono text-sm font-bold">CLOTHING COLOR:</label>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="color"
            value={config.clothingColor}
            onChange={(e) => updateConfig({ clothingColor: e.target.value })}
            className="w-12 h-12 rounded border-2 border-gray-600 cursor-pointer"
          />
          <input
            type="text"
            value={config.clothingColor}
            onChange={(e) => updateConfig({ clothingColor: e.target.value })}
            className="flex-1 px-3 py-2 bg-gray-800 text-cyan-300 rounded border border-gray-600 font-mono text-sm"
          />
        </div>
        <div className="grid grid-cols-6 gap-1">
          {colorPresets.clothing.map((color) => (
            <button
              key={color}
              onClick={() => updateConfig({ clothingColor: color })}
              className={`w-8 h-8 rounded border-2 transition-all ${
                config.clothingColor === color ? 'border-yellow-400' : 'border-gray-600'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Random Character Button */}
      <button
        onClick={() => {
          const randomConfig: CharacterConfig = {
            bodyColor: colorPresets.body[Math.floor(Math.random() * colorPresets.body.length)],
            hairColor: colorPresets.hair[Math.floor(Math.random() * colorPresets.hair.length)],
            clothingColor: colorPresets.clothing[Math.floor(Math.random() * colorPresets.clothing.length)],
            size: [32, 48, 64, 80, 96, 128][Math.floor(Math.random() * 6)],
            style: (['classic', 'modern', 'pixel'] as const)[Math.floor(Math.random() * 3)],
            animationType: (['walk', 'run', 'idle', 'jump'] as const)[Math.floor(Math.random() * 4)]
          };
          setConfig(randomConfig);
        }}
        className="w-full px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded font-mono font-bold border border-red-400/50 transition-all duration-200"
      >
        🎲 RANDOM CHARACTER
      </button>
    </div>
  );
};