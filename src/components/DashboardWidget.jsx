import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const DashboardWidget = ({
  title,
  icon: Icon,
  children,
  defaultExpanded = true,
  collapsible = true,
  sparklineData,
  sparklineColor = 'primary',
  className = '',
  headerAction
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  const renderSparkline = (data, color) => {
    if (!data || data.length === 0) return null;

    const width = 50;
    const height = 18;
    const padding = 2;

    // Handle edge cases
    if (data.length === 1) {
      return (
        <svg width={width} height={height} className="sparkline inline-block">
          <circle
            cx={width / 2}
            cy={height / 2}
            r={2}
            className={`sparkline-${color}`}
            fill="currentColor"
          />
        </svg>
      );
    }

    // Calculate min and max for normalization
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // Avoid division by zero

    // Normalize data points to fit in SVG viewBox
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((value - min) / range) * (height - 2 * padding);
      return { x, y };
    });

    // Generate smooth curve path using quadratic bezier curves
    let pathData = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      
      pathData += ` Q ${prev.x} ${prev.y}, ${midX} ${(prev.y + curr.y) / 2}`;
      
      if (i === points.length - 1) {
        pathData += ` T ${curr.x} ${curr.y}`;
      }
    }

    return (
      <svg width={width} height={height} className="sparkline inline-block">
        <path
          d={pathData}
          fill="none"
          className={`sparkline-${color}`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className={`dashboard-widget ${className}`}>
      <div
        className={`px-3 py-2.5 md:px-4 md:py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!collapsible ? 'cursor-default !hover:bg-transparent dark:!hover:bg-transparent' : ''}`}
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2 flex-1">
          {Icon && <Icon className="w-4 h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-400" />}
          <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
        
        <div className="flex items-center gap-3">
          {sparklineData && (
            <div className="hidden sm:flex items-center">
              {renderSparkline(sparklineData, sparklineColor)}
            </div>
          )}
          
          {headerAction && (
            <div onClick={(e) => e.stopPropagation()}>
              {headerAction}
            </div>
          )}
          
          {collapsible && (
            <button
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded touch-manipulation"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-3 md:p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardWidget;
