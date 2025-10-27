import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const SaveFilterDialog = ({ isOpen, onClose, onSave, existingNames = [] }) => {
  const [filterName, setFilterName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFilterName('');
      setError('');
    }
  }, [isOpen]);

  const validateName = (name) => {
    const trimmedName = name.trim();
    
    if (trimmedName === '') {
      return 'Filter name is required';
    }
    
    if (trimmedName.length > 50) {
      return 'Filter name must be 50 characters or less';
    }
    
    if (existingNames.includes(trimmedName)) {
      return 'A filter with this name already exists';
    }
    
    return '';
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setFilterName(value);
    setError(validateName(value));
  };

  const handleSave = () => {
    const trimmedName = filterName.trim();
    const validationError = validateName(trimmedName);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    onSave(trimmedName);
    setFilterName('');
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !error && filterName.trim()) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 
            id="dialog-title" 
            className="text-xl font-semibold text-gray-900 dark:text-white"
          >
            Save Filter Configuration
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Give this filter configuration a name to save it for later use
          </p>

          <div>
            <label 
              htmlFor="filter-name" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Filter Name
            </label>
            <input
              ref={inputRef}
              id="filter-name"
              type="text"
              value={filterName}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g., My Custom Filter"
              maxLength={50}
              className={`
                w-full px-3 py-2 border rounded-lg 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-primary-500 focus:border-transparent
                ${error 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
                }
              `}
              aria-invalid={!!error}
              aria-describedby={error ? 'name-error' : undefined}
            />
            {error && (
              <p 
                id="name-error" 
                className="mt-2 text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 
                     rounded-lg text-gray-700 dark:text-gray-300 
                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!!error || !filterName.trim()}
            className={`
              flex-1 px-4 py-2 rounded-lg font-medium transition-colors
              ${!!error || !filterName.trim()
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
              }
            `}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveFilterDialog;
