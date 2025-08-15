import React from 'react';

interface SpriteConfig {
  skinColor: string;
  hairColor: string;
  hairStyle: string;
  outfitColor: string;
  outfitStyle: string;
}

interface CharacterCustomizerProps {
  config: SpriteConfig;
  onConfigChange: (newConfig: Partial<SpriteConfig>) => void;
}

const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({ config, onConfigChange }) => {
  // Safe config with fallbacks
  const safeConfig = {
    skinColor: config?.skinColor || 'light',
    hairColor: config?.hairColor || 'brown',
    hairStyle: config?.hairStyle || 'Short',
    outfitColor: config?.outfitColor || 'blue',
    outfitStyle: config?.outfitStyle || 'Casual'
  };

  const skinColors = [
    { name: 'Light', value: 'light', color: '#FDBCB4' },
    { name: 'Medium', value: 'medium', color: '#C68642' },
    { name: 'Tan', value: 'tan', color: '#D2B48C' },
    { name: 'Olive', value: 'olive', color: '#8D7053' },
    { name: 'Dark', value: 'dark', color: '#5D4037' }
  ];

  const hairColors = [
    { name: 'Blonde', value: 'blonde', color: '#F4C430' },
    { name: 'Brown', value: 'brown', color: '#8B4513' },
    { name: 'Black', value: 'black', color: '#2C1810' },
    { name: 'Red', value: 'red', color: '#CC4125' },
    { name: 'Gray', value: 'gray', color: '#808080' },
    { name: 'Purple', value: 'purple', color: '#8B008B' }
  ];

  const outfitColors = [
    { name: 'Blue', value: 'blue', color: '#1976D2' },
    { name: 'Green', value: 'green', color: '#388E3C' },
    { name: 'Red', value: 'red', color: '#D32F2F' },
    { name: 'Purple', value: 'purple', color: '#7B1FA2' },
    { name: 'Gray', value: 'gray', color: '#616161' },
    { name: 'Brown', value: 'brown', color: '#5D4037' }
  ];

  const hairStyles = [
    { name: 'Short', value: 'Short' },
    { name: 'Long', value: 'Long' },
    { name: 'Curly', value: 'Curly' },
    { name: 'Spiky', value: 'Spiky' }
  ];

  const outfitStyles = [
    { name: 'Casual', value: 'Casual' },
    { name: 'Formal', value: 'Formal' },
    { name: 'Armor', value: 'Armor' },
    { name: 'Robe', value: 'Robe' }
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6">Character Customizer</h3>
      
      {/* Skin Color */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Skin Color
        </label>
        <div className="grid grid-cols-5 gap-2">
          {skinColors.map((skin) => (
            <button
              key={skin.value}
              onClick={() => onConfigChange({ skinColor: skin.value })}
              className={`w-10 h-10 rounded-lg border-2 transition-all ${
                safeConfig.skinColor === skin.value
                  ? 'border-white scale-110'
                  : 'border-gray-600 hover:border-gray-400'
              }`}
              style={{ backgroundColor: skin.color }}
              title={skin.name}
            />
          ))}
        </div>
      </div>

      {/* Hair Color */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Hair Color
        </label>
        <div className="grid grid-cols-6 gap-2">
          {hairColors.map((hair) => (
            <button
              key={hair.value}
              onClick={() => onConfigChange({ hairColor: hair.value })}
              className={`w-10 h-10 rounded-lg border-2 transition-all ${
                safeConfig.hairColor === hair.value
                  ? 'border-white scale-110'
                  : 'border-gray-600 hover:border-gray-400'
              }`}
              style={{ backgroundColor: hair.color }}
              title={hair.name}
            />
          ))}
        </div>
      </div>

      {/* Hair Style */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Hair Style
        </label>
        <select
          value={safeConfig.hairStyle}
          onChange={(e) => onConfigChange({ hairStyle: e.target.value })}
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          {hairStyles.map((style) => (
            <option key={style.value} value={style.value}>
              {style.name}
            </option>
          ))}
        </select>
      </div>

      {/* Outfit Color */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Outfit Color
        </label>
        <div className="grid grid-cols-6 gap-2">
          {outfitColors.map((outfit) => (
            <button
              key={outfit.value}
              onClick={() => onConfigChange({ outfitColor: outfit.value })}
              className={`w-10 h-10 rounded-lg border-2 transition-all ${
                safeConfig.outfitColor === outfit.value
                  ? 'border-white scale-110'
                  : 'border-gray-600 hover:border-gray-400'
              }`}
              style={{ backgroundColor: outfit.color }}
              title={outfit.name}
            />
          ))}
        </div>
      </div>

      {/* Outfit Style */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Outfit Style
        </label>
        <select
          value={safeConfig.outfitStyle}
          onChange={(e) => onConfigChange({ outfitStyle: e.target.value })}
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          {outfitStyles.map((style) => (
            <option key={style.value} value={style.value}>
              {style.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CharacterCustomizer;