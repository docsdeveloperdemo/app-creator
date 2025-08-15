import React from 'react';
import { CharacterConfig } from '../types';

interface CharacterCustomizerProps {
  character: CharacterConfig;
  onCharacterChange: (character: CharacterConfig) => void;
}

const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({ character, onCharacterChange }) => {
  const updateCharacter = (field: keyof CharacterConfig, value: string) => {
    onCharacterChange({ ...character, [field]: value });
  };

  return (
    <div className="character-customizer">
      <h3 className="text-lg font-bold text-white mb-4">Character Customizer</h3>
      
      {/* Skin Color */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Skin Color
        </label>
        <div className="flex gap-2 flex-wrap">
          {[
            { color: '#FDBCB4', name: 'Light' },
            { color: '#F1C27D', name: 'Medium' },
            { color: '#E0AC69', name: 'Tan' },
            { color: '#C68642', name: 'Dark' },
            { color: '#8D5524', name: 'Deep' }
          ].map(({ color, name }) => (
            <button
              key={color}
              onClick={() => updateCharacter('skinColor', color)}
              className={`w-8 h-8 rounded border-2 ${
                character.skinColor === color ? 'border-white' : 'border-gray-600'
              }`}
              style={{ backgroundColor: color }}
              title={name}
            />
          ))}
        </div>
      </div>

      {/* Hair Color */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Hair Color
        </label>
        <div className="flex gap-2 flex-wrap">
          {[
            { color: '#8B4513', name: 'Brown' },
            { color: '#000000', name: 'Black' },
            { color: '#FFD700', name: 'Blonde' },
            { color: '#B22222', name: 'Red' },
            { color: '#708090', name: 'Silver' },
            { color: '#4B0082', name: 'Purple' }
          ].map(({ color, name }) => (
            <button
              key={color}
              onClick={() => updateCharacter('hairColor', color)}
              className={`w-8 h-8 rounded border-2 ${
                character.hairColor === color ? 'border-white' : 'border-gray-600'
              }`}
              style={{ backgroundColor: color }}
              title={name}
            />
          ))}
        </div>
      </div>

      {/* Hair Style */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Hair Style
        </label>
        <select 
          value={character.hairStyle} 
          onChange={(e) => updateCharacter('hairStyle', e.target.value)}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
        >
          <option value="short">Short</option>
          <option value="long">Long</option>
          <option value="spiky">Spiky</option>
          <option value="curly">Curly</option>
        </select>
      </div>

      {/* Body/Outfit Color */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Outfit Color
        </label>
        <div className="flex gap-2 flex-wrap">
          {[
            { color: '#4682B4', name: 'Blue' },
            { color: '#228B22', name: 'Green' },
            { color: '#DC143C', name: 'Red' },
            { color: '#800080', name: 'Purple' },
            { color: '#2F4F4F', name: 'Dark Gray' },
            { color: '#8B4513', name: 'Brown' }
          ].map(({ color, name }) => (
            <button
              key={color}
              onClick={() => updateCharacter('bodyColor', color)}
              className={`w-8 h-8 rounded border-2 ${
                character.bodyColor === color ? 'border-white' : 'border-gray-600'
              }`}
              style={{ backgroundColor: color }}
              title={name}
            />
          ))}
        </div>
      </div>

      {/* Outfit Style */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Outfit Style
        </label>
        <select 
          value={character.outfitStyle} 
          onChange={(e) => updateCharacter('outfitStyle', e.target.value)}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
        >
          <option value="casual">Casual</option>
          <option value="warrior">Warrior</option>
          <option value="mage">Mage</option>
          <option value="rogue">Rogue</option>
        </select>
      </div>
    </div>
  );
};

export default CharacterCustomizer;