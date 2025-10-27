import React, { useState, useEffect } from 'react';

const RangeFilter = ({ 
  label, 
  icon: Icon, 
  enabled, 
  min, 
  max, 
  unit, 
  presets = [], 
  helperText, 
  onEnabledChange, 
  onRangeChange,
  formatValue 
}) => {
  const [localMin, setLocalMin] = useState(min);
  const [localMax, setLocalMax] = useState(max);
  const [error, setError] = useState('');

  useEffect(() => {
    setLocalMin(min);
    setLocalMax(max);
  }, [min, max]);

  const handleMinChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setLocalMin(value);
    
    if (value > localMax) {
      setError('Minimum value cannot be greater than maximum');
    } else {
      setError('');
      onRangeChange({ min: value, max: localMax });
    }
  };

  const handleMaxChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setLocalMax(value);
    
    if (value < localMin) {
      setError('Maximum value cannot be less than minimum');
    } else {
      setError('');
      onRangeChange({ min: localMin, max: value });
    }
  };

  const applyPreset = (preset) => {
    setLocalMin(preset.min);
    setLocalMax(preset.max);
    setError('');
    onRangeChange({ min: preset.min, max: preset.max });
    if (!enabled) {
      onEnabledChange(true);
    }
  };

  const displayValue = (value) => {
    return formatValue ? formatValue(value) : `${value} ${unit}`;
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <label className="flex-1 font-medium text-gray-900 dark:text-white">
          {label}
        </label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          aria-label={`Enable ${label} filter`}
        />
      </div>

      {/* Collapsible Content */}
      {enabled && (
        <div className="space-y-3 animate-fadeIn">
          {/* Helper Text */}
          {helperText && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {helperText}
            </p>
          )}

          {/* Min/Max Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min
              </label>
              <input
                type="number"
                value={localMin}
                onChange={handleMinChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                aria-label={`Minimum ${label}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max
              </label>
              <input
                type="number"
                value={localMax}
                onChange={handleMaxChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                aria-label={`Maximum ${label}`}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Current Range Display */}
          {!error && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Filtering: {displayValue(localMin)} - {displayValue(localMax)}
            </p>
          )}

          {/* Preset Buttons */}
          {presets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => applyPreset(preset)}
                  className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                           hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  aria-label={`Apply preset: ${preset.label}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RangeFilter;
