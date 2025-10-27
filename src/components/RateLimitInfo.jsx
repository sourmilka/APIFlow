import React from 'react';
import { Gauge, Hash, TrendingDown, AlertTriangle, Clock, Timer, Info } from 'lucide-react';

const RateLimitInfo = ({ rateLimit, compact = false }) => {
  // Early return if no data
  if (!rateLimit) return null;

  // Determine status color based on percentage
  const getStatusColor = () => {
    if (!rateLimit.percentage) return 'text-gray-600 dark:text-gray-400';
    if (rateLimit.percentage > 50) return 'text-green-600 dark:text-green-400';
    if (rateLimit.percentage >= 20) return 'text-primary-600 dark:text-primary-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressBarColor = () => {
    if (!rateLimit.percentage) return 'bg-gray-500';
    if (rateLimit.percentage > 50) return 'bg-green-500';
    if (rateLimit.percentage >= 20) return 'bg-primary-500';
    return 'bg-red-500';
  };

  const statusColor = getStatusColor();
  const progressBarColor = getProgressBarColor();

  // Compact mode - single line display
  if (compact) {
    const timeInfo = rateLimit.timeUntilReset?.formatted || 'unknown';
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusColor} bg-purple-100 dark:bg-purple-900/30`}>
        <Gauge className="w-4 h-4" />
        Rate Limit: {rateLimit.remaining}/{rateLimit.limit} ({rateLimit.percentage}%) - Resets {timeInfo}
        {rateLimit.isApproachingLimit && <AlertTriangle className="w-4 h-4" />}
      </span>
    );
  }

  // Full display mode
  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          Rate Limit Information
        </h3>
        <span className="px-2 py-1 text-xs font-medium rounded bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200">
          {rateLimit.limitType.toUpperCase()}
        </span>
      </div>

      {/* Progress Bar */}
      {rateLimit.percentage !== null && (
        <div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full ${progressBarColor} transition-all duration-300`}
              style={{ width: `${Math.max(0, Math.min(100, rateLimit.percentage))}%` }}
              role="progressbar"
              aria-label={`Rate limit usage: ${rateLimit.percentage} percent`}
              aria-valuenow={rateLimit.percentage}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </div>
      )}

      {/* Information Grid */}
      <div className="space-y-2 text-sm">
        {/* Limit */}
        {rateLimit.limit !== null && (
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300">
            <Hash className="w-4 h-4" />
            <span className="font-medium">Limit:</span>
            <span>{rateLimit.limit} requests</span>
          </div>
        )}

        {/* Remaining */}
        {rateLimit.remaining !== null && (
          <div className={`flex items-center gap-2 ${statusColor} font-semibold`}>
            {rateLimit.isApproachingLimit ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-medium">Remaining:</span>
            <span>
              {rateLimit.remaining} requests
              {rateLimit.percentage !== null && ` (${rateLimit.percentage}%)`}
            </span>
          </div>
        )}

        {/* Reset Time */}
        {rateLimit.resetFormatted && (
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Resets at:</span>
            <span>{rateLimit.resetFormatted}</span>
          </div>
        )}

        {/* Time Until Reset */}
        {rateLimit.timeUntilReset && !rateLimit.timeUntilReset.isPast && (
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Resets:</span>
            <span className="font-semibold">{rateLimit.timeUntilReset.formatted}</span>
          </div>
        )}

        {/* Retry-After */}
        {rateLimit.retryAfter !== null && (
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300">
            <Timer className="w-4 h-4" />
            <span className="font-medium">Retry after:</span>
            <span>{rateLimit.retryAfter} seconds</span>
          </div>
        )}

        {/* Policy */}
        {rateLimit.policy && (
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300">
            <Info className="w-4 h-4" />
            <span className="font-medium">Policy:</span>
            <span>{rateLimit.policy}</span>
          </div>
        )}
      </div>

      {/* Warning Banner */}
      {rateLimit.isApproachingLimit && (
        <div className="bg-primary-100 dark:bg-primary-900/30 border-l-4 border-primary-500 p-3 rounded space-y-1">
          <div className="flex items-center gap-2 text-primary-800 dark:text-primary-200 font-semibold">
            <AlertTriangle className="w-5 h-5" />
            <span>⚠️ Approaching rate limit!</span>
          </div>
          <p className="text-sm text-primary-700 dark:text-primary-300">
            Consider slowing down requests. Wait for reset or implement exponential backoff.
          </p>
        </div>
      )}
    </div>
  );
};

export default RateLimitInfo;
