import React, { useState } from 'react';
import { 
  Shield, 
  Globe, 
  Clock, 
  WifiOff, 
  Lock, 
  AlertTriangle,
  RefreshCw,
  X,
  Copy,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { getCorsGuidance } from '../utils/errorHandler';

/**
 * Error Display Component
 * Shows categorized errors with actionable suggestions
 */
const ErrorDisplay = ({ error, onRetry, onDismiss }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  // Map error types to icons and colors
  const errorTypeConfig = {
    cors: { icon: Shield, color: 'red', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30', textColor: 'text-red-400' },
    dns: { icon: Globe, color: 'orange', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30', textColor: 'text-orange-400' },
    dns_blocked: { icon: Lock, color: 'orange', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30', textColor: 'text-orange-400' },
  timeout: { icon: Clock, color: 'primary', bgColor: 'bg-primary-500/20', borderColor: 'border-primary-500/30', textColor: 'text-primary-400' },
    connection: { icon: WifiOff, color: 'red', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30', textColor: 'text-red-400' },
    ssl: { icon: Lock, color: 'red', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30', textColor: 'text-red-400' },
    network: { icon: AlertTriangle, color: 'orange', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30', textColor: 'text-orange-400' },
    server: { icon: AlertTriangle, color: 'red', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30', textColor: 'text-red-400' },
    client: { icon: AlertTriangle, color: 'orange', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30', textColor: 'text-orange-400' },
  redirect: { icon: RefreshCw, color: 'primary', bgColor: 'bg-primary-500/20', borderColor: 'border-primary-500/30', textColor: 'text-primary-400' },
    proxy: { icon: WifiOff, color: 'orange', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30', textColor: 'text-orange-400' },
  page_error: { icon: AlertTriangle, color: 'primary', bgColor: 'bg-primary-500/20', borderColor: 'border-primary-500/30', textColor: 'text-primary-400' },
    unknown: { icon: AlertTriangle, color: 'muted', bgColor: 'bg-secondary/30', borderColor: 'border-border', textColor: 'text-muted-foreground' }
  };

  const config = errorTypeConfig[error.type] || errorTypeConfig.unknown;
  const Icon = config.icon;
  const corsGuidance = error.type === 'cors' ? getCorsGuidance() : null;

  const handleCopyError = () => {
    const errorText = `
Error Type: ${error.type}
Title: ${error.title}
Message: ${error.message}

Suggestions:
${error.suggestions?.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Technical Details:
${JSON.stringify(error.originalError, null, 2)}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy error details:', err);
    });
  };

  return (
    <Alert variant="destructive" className="relative animate-fadeIn">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Icon className="h-5 w-5 mt-0.5" />
          <div className="flex-1">
            <AlertTitle className="mb-2 flex items-center gap-2">
              {error.title || 'Error'}
              <span className="text-xs uppercase font-semibold opacity-70">
                ({error.type})
              </span>
            </AlertTitle>
            <AlertDescription className="space-y-4">
              <p>{error.message}</p>

              {/* Suggestions */}
              {error.suggestions && error.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Suggestions:</h4>
                  <ul className="space-y-2">
                    {error.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CORS-Specific Guidance */}
              {corsGuidance && (
                <div className="border rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    About CORS
                  </h4>
                  <p className="text-sm mb-3">
                    {corsGuidance.explanation}
                  </p>
                  <div className="mb-3">
                    <h5 className="text-xs font-semibold mb-2">Common Solutions:</h5>
                    <ul className="space-y-1">
                      {corsGuidance.commonSolutions.map((solution, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-xs">•</span>
                          <span className="text-xs">{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <a
                    href={corsGuidance.documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    Learn more about CORS
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {error.retryable && onRetry && (
                  <Button onClick={onRetry} size="sm" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </Button>
                )}
                
                <Button onClick={handleCopyError} variant="outline" size="sm" className="gap-2">
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Error Details'}
                </Button>
              </div>

              {/* Technical Details (Collapsible) */}
              {error.originalError && (
                <div className="border rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full justify-between"
                    size="sm"
                  >
                    <span className="text-sm">Technical Details</span>
                    {showDetails ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>

                  {showDetails && (
                    <div className="bg-muted p-4">
                      <pre className="text-xs whitespace-pre-wrap font-mono overflow-auto max-h-48">
                        {JSON.stringify(error.originalError, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </AlertDescription>
          </div>
        </div>
        {/* Dismiss Button */}
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="absolute right-2 top-2 h-6 w-6"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
};

export default ErrorDisplay;
