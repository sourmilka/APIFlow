import { useState } from 'react';
import { Play, Edit, Save, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function ApiTester({ api }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [editedRequest, setEditedRequest] = useState({
    url: api.url,
    method: api.method,
    headers: api.headers,
    payload: api.payload
  });

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const startTime = Date.now();
      
      const options = {
        method: editedRequest.method,
        headers: editedRequest.headers,
      };

      if (editedRequest.payload && ['POST', 'PUT', 'PATCH'].includes(editedRequest.method)) {
        options.body = editedRequest.payload;
      }

      const response = await fetch(editedRequest.url, options);
      const responseTime = Date.now() - startTime;
      
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      setTestResult({
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        responseTime,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleEdit = (field, value) => {
    setEditedRequest(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetToOriginal = () => {
    setEditedRequest({
      url: api.url,
      method: api.method,
      headers: api.headers,
      payload: api.payload
    });
    setIsEditing(false);
    setTestResult(null);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Play className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h4 className="font-semibold text-purple-900 dark:text-purple-100">API Tester</h4>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={resetToOriginal}
                className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded flex items-center gap-1 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="px-4 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Test API
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editable Request */}
      {isEditing && (
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">URL</label>
            <input
              type="text"
              value={editedRequest.url}
              onChange={(e) => handleEdit('url', e.target.value)}
              className="w-full px-3 py-2 border border-purple-300 dark:border-purple-700 dark:bg-gray-800 dark:text-white rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">Method</label>
            <select
              value={editedRequest.method}
              onChange={(e) => handleEdit('method', e.target.value)}
              className="w-full px-3 py-2 border border-purple-300 dark:border-purple-700 dark:bg-gray-800 dark:text-white rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>PATCH</option>
              <option>DELETE</option>
            </select>
          </div>
          {editedRequest.payload && (
            <div>
              <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">Payload</label>
              <textarea
                value={editedRequest.payload}
                onChange={(e) => handleEdit('payload', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-purple-300 dark:border-purple-700 dark:bg-gray-800 dark:text-white rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-mono"
              />
            </div>
          )}
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div className={`mt-4 p-4 rounded-lg border ${
          testResult.success 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {testResult.success ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-green-900 dark:text-green-100">
                  {testResult.status} {testResult.statusText}
                </span>
                <span className="text-sm text-green-700 dark:text-green-300 ml-auto">
                  {testResult.responseTime}ms
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="font-semibold text-red-900 dark:text-red-100">Request Failed</span>
              </>
            )}
          </div>

          {testResult.success ? (
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold text-green-800 dark:text-green-200 mb-1">Response Data:</p>
                <pre className="text-xs bg-white dark:bg-gray-900 dark:text-gray-100 p-3 rounded border border-green-200 dark:border-green-800 overflow-x-auto max-h-64">
                  {typeof testResult.data === 'string' 
                    ? testResult.data 
                    : JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
              <div className="flex items-center justify-between text-xs text-green-700 dark:text-green-300">
                <span>Tested: {new Date(testResult.timestamp).toLocaleString()}</span>
                {api.response?.responseTime && (
                  <span>
                    Original: {api.response.responseTime}ms | 
                    Difference: {testResult.responseTime - api.response.responseTime > 0 ? '+' : ''}
                    {testResult.responseTime - api.response.responseTime}ms
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-red-800 dark:text-red-200">{testResult.error}</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Common issues: CORS policy, network error, invalid URL, or authentication required
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>💡 Tip:</strong> Click "Edit" to modify the request before testing. 
          This allows you to test with different parameters, headers, or payloads.
        </p>
      </div>
    </div>
  );
}

export default ApiTester;
