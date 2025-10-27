import { Info, Shield, Key, AlertTriangle } from 'lucide-react';

function ApiExplanation({ api }) {
  if (!api) return null;

  const hasAuth = api.authentication && api.authentication.length > 0;
  const hasExplanations = api.explanations && api.explanations.length > 0;

  if (!hasAuth && !hasExplanations) return null;

  return (
    <div className="space-y-3">
      {/* Explanations */}
      {hasExplanations && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">What is this API?</h4>
          </div>
          <ul className="space-y-1">
            {api.explanations.map((explanation, idx) => (
              <li key={idx} className="text-sm text-blue-800 dark:text-blue-200">
                {explanation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Authentication Info */}
      {hasAuth && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="font-semibold text-amber-900 dark:text-amber-100">Authentication Detected</h4>
          </div>
          <div className="space-y-2">
            {api.authentication.map((auth, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded p-2 border border-amber-200 dark:border-amber-700">
                <div className="flex items-start gap-2">
                  <Key className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-amber-900 dark:text-amber-100">{auth.type}</p>
                    {auth.header && (
                      <p className="text-xs text-amber-700 dark:text-amber-300">Header: {auth.header}</p>
                    )}
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-mono mt-1">{auth.value}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-2 mt-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded">
              <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Security Note:</strong> This API uses authentication. Keep these credentials secure and never share them publicly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiExplanation;
