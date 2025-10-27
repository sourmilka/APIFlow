import React from 'react';

const FilterPresetButton = ({ preset, isActive, onApply }) => {
  return (
    <button
      onClick={() => onApply(preset.name)}
      className={`
        px-4 py-2 rounded-lg border transition-all whitespace-nowrap
        flex items-center gap-2 hover:shadow-md
        ${isActive 
          ? 'bg-primary-600 text-white border-primary-600 shadow-lg' 
          : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:border-primary-500'
        }
      `}
      title={preset.description}
      aria-label={`${preset.name}: ${preset.description}`}
      aria-pressed={isActive}
    >
      <span className="text-lg" role="img" aria-hidden="true">{preset.icon}</span>
      <span className="font-medium">{preset.name}</span>
    </button>
  );
};

export default FilterPresetButton;
