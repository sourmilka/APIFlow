import { Loader2, RefreshCw, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

function LoadingState({ isRetrying = false, retryAttempt = 0, retryDelay = 0 }) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isRetrying && retryDelay > 0) {
      setCountdown(Math.ceil(retryDelay / 1000));
      
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRetrying, retryDelay]);

  return (
    <div className="card">
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          {isRetrying ? (
            <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />
          ) : (
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
          )}
          <div className={`absolute inset-0 w-16 h-16 border-4 ${isRetrying ? 'border-blue-200' : 'border-primary/20'} rounded-full animate-ping opacity-20`}></div>
        </div>

        {isRetrying ? (
          <>
            <h3 className="mt-6 text-xl font-semibold text-foreground">Retrying Connection...</h3>
            <p className="mt-2 text-muted-foreground text-center max-w-md">
              Attempt {retryAttempt} of 3
            </p>
            {countdown > 0 && (
              <div className="mt-4 flex items-center gap-2 text-blue-600">
                <Clock className="w-5 h-5" />
                <span className="text-lg font-medium">Next attempt in {countdown}s</span>
              </div>
            )}
            <div className="mt-6 w-full max-w-xs">
              <div className="bg-secondary rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((3 - retryAttempt) / 3) * 100}%` }}
                ></div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground text-center">
                Connection issue detected, retrying automatically...
              </p>
            </div>
          </>
        ) : (
          <>
            <h3 className="mt-6 text-xl font-semibold text-foreground">Analyzing Website</h3>
            <p className="mt-2 text-muted-foreground text-center max-w-md">
              Loading the website and intercepting API calls...
            </p>
            <div className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                <span>Launching headless browser</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse animation-delay-200"></div>
                <span>Intercepting network requests</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse animation-delay-400"></div>
                <span>Capturing API responses</span>
              </div>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">This may take 10-30 seconds...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default LoadingState;
