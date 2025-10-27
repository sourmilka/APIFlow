import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

const DateTimeRangeFilter = ({ enabled, startDate, endDate, onEnabledChange, onRangeChange }) => {
  const [localStart, setLocalStart] = useState('');
  const [localEnd, setLocalEnd] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (startDate) {
      const date = new Date(startDate);
      setLocalStart(formatDateTimeLocal(date));
    } else {
      setLocalStart('');
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate) {
      const date = new Date(endDate);
      setLocalEnd(formatDateTimeLocal(date));
    } else {
      setLocalEnd('');
    }
  }, [endDate]);

  const formatDateTimeLocal = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleStartChange = (e) => {
    const value = e.target.value;
    setLocalStart(value);
    
    if (value && localEnd) {
      const start = new Date(value);
      const end = new Date(localEnd);
      
      if (start > end) {
        setError('Start date cannot be after end date');
      } else {
        setError('');
        onRangeChange({ start: start.toISOString(), end: end.toISOString() });
      }
    } else if (value) {
      onRangeChange({ start: new Date(value).toISOString(), end: localEnd ? new Date(localEnd).toISOString() : null });
    }
  };

  const handleEndChange = (e) => {
    const value = e.target.value;
    setLocalEnd(value);
    
    if (value && localStart) {
      const start = new Date(localStart);
      const end = new Date(value);
      
      if (start > end) {
        setError('End date cannot be before start date');
      } else {
        setError('');
        onRangeChange({ start: start.toISOString(), end: end.toISOString() });
      }
    } else if (value) {
      onRangeChange({ start: localStart ? new Date(localStart).toISOString() : null, end: new Date(value).toISOString() });
    }
  };

  const applyPreset = (presetName) => {
    const now = new Date();
    let start;
    
    switch (presetName) {
      case 'last5min':
        start = new Date(now.getTime() - 5 * 60 * 1000);
        break;
      case 'last15min':
        start = new Date(now.getTime() - 15 * 60 * 1000);
        break;
      case 'lastHour':
        start = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case 'last24hours':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      default:
        return;
    }
    
    setLocalStart(formatDateTimeLocal(start));
    setLocalEnd(formatDateTimeLocal(now));
    setError('');
    onRangeChange({ start: start.toISOString(), end: now.toISOString() });
    
    if (!enabled) {
      onEnabledChange(true);
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getRelativeTime = () => {
    if (!localStart || !localEnd) return '';
    
    const start = new Date(localStart);
    const end = new Date(localEnd);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    
    if (diffMins < 60) {
      return `Last ${diffMins} minutes`;
    } else if (diffHours < 24) {
      return `Last ${diffHours} hours`;
    } else {
      return `Last ${diffDays} days`;
    }
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <label className="flex-1 font-medium text-gray-900 dark:text-white">
          Date/Time Range
        </label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          aria-label="Enable date/time range filter"
        />
      </div>

      {/* Collapsible Content */}
      {enabled && (
        <div className="space-y-3 animate-fadeIn">
          {/* Helper Text */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Filter APIs by timestamp
          </p>

          {/* Date Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date/Time
              </label>
              <input
                type="datetime-local"
                value={localStart}
                onChange={handleStartChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                aria-label="Start date and time"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date/Time
              </label>
              <input
                type="datetime-local"
                value={localEnd}
                onChange={handleEndChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                aria-label="End date and time"
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
          {!error && localStart && localEnd && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium">{getRelativeTime()}</p>
              <p className="text-xs mt-1">
                {formatDisplayDate(localStart)} → {formatDisplayDate(localEnd)}
              </p>
            </div>
          )}

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyPreset('last5min')}
              className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                       hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              aria-label="Filter last 5 minutes"
            >
              Last 5 min
            </button>
            <button
              onClick={() => applyPreset('last15min')}
              className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                       hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              aria-label="Filter last 15 minutes"
            >
              Last 15 min
            </button>
            <button
              onClick={() => applyPreset('lastHour')}
              className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                       hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              aria-label="Filter last hour"
            >
              Last hour
            </button>
            <button
              onClick={() => applyPreset('today')}
              className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                       hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              aria-label="Filter today"
            >
              Today
            </button>
            <button
              onClick={() => applyPreset('last24hours')}
              className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                       hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              aria-label="Filter last 24 hours"
            >
              Last 24 hours
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimeRangeFilter;
