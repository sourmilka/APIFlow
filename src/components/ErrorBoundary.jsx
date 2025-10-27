import React from 'react';
import { AlertCircle, RefreshCw, Copy, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Error Boundary component to catch React rendering errors
 * Provides graceful error handling and recovery options
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Call custom error callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    // Reload the page to recover from the error
    window.location.reload();
  };

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const errorText = `
Error: ${error?.toString()}

Component Stack:
${errorInfo?.componentStack}

Stack Trace:
${error?.stack}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      alert('Error details copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy error details:', err);
    });
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI
      const { error, errorInfo, showDetails } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
            {/* Error Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-500/20 p-4 rounded-full">
                <AlertCircle className="w-16 h-16 text-red-500" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
              Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-gray-700 dark:text-gray-300 text-center mb-6">
              {error?.message || 'An unexpected error occurred in the application'}
            </p>

            {/* Error Count (if multiple errors) */}
            {this.state.errorCount > 1 && (
              <div className="bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/30 rounded-lg p-3 mb-6">
                <p className="text-primary-700 dark:text-primary-400 text-sm text-center">
                  This error has occurred {this.state.errorCount} times
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Reset Application
              </button>
              
              <button
                onClick={this.handleCopyError}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-5 h-5" />
                Copy Error Details
              </button>
            </div>

            {/* Technical Details (Collapsible) */}
            {isDevelopment && (
              <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={this.toggleDetails}
                  className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium py-3 px-4 flex items-center justify-between transition-colors"
                >
                  <span>Technical Details</span>
                  {showDetails ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {showDetails && (
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 max-h-96 overflow-auto">
                    {/* Error Stack */}
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Error Stack:</h3>
                      <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap font-mono">
                        {error?.stack || 'No stack trace available'}
                      </pre>
                    </div>

                    {/* Component Stack */}
                    {errorInfo?.componentStack && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Component Stack:</h3>
                        <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Help Text */}
            <p className="text-gray-500 dark:text-gray-500 text-sm text-center mt-6">
              If this problem persists, please contact support with the error details above.
            </p>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
