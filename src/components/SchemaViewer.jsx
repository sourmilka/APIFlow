import { useState, useMemo, useCallback, memo } from 'react';
import { Code, Database, Copy, Check } from 'lucide-react';
import { inferSchema, generateTypeScript, analyzeResponse } from '../utils/schemaInference';

function SchemaViewer({ response }) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('schema'); // schema, typescript, analysis

  if (!response || !response.data) return null;

  const schema = useMemo(() => inferSchema(response.data), [response.data]);
  const typescript = useMemo(() => generateTypeScript(schema, 'ApiResponse'), [schema]);
  const analysis = useMemo(() => analyzeResponse(response.data), [response.data]);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h4 className="font-semibold text-teal-900 dark:text-teal-100">Response Schema</h4>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('schema')}
            className={`px-2 py-1 text-xs rounded ${
              viewMode === 'schema'
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-gray-800 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/30'
            }`}
          >
            JSON Schema
          </button>
          <button
            onClick={() => setViewMode('typescript')}
            className={`px-2 py-1 text-xs rounded ${
              viewMode === 'typescript'
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-gray-800 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/30'
            }`}
          >
            TypeScript
          </button>
          <button
            onClick={() => setViewMode('analysis')}
            className={`px-2 py-1 text-xs rounded ${
              viewMode === 'analysis'
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-gray-800 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/30'
            }`}
          >
            Analysis
          </button>
        </div>
      </div>

      {/* Schema View */}
      {viewMode === 'schema' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-teal-700 dark:text-teal-300">JSON Schema</label>
            <button
              onClick={() => copyToClipboard(JSON.stringify(schema, null, 2))}
              className="p-1 hover:bg-teal-100 dark:hover:bg-teal-900/30 rounded"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              )}
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-64">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>
      )}

      {/* TypeScript View */}
      {viewMode === 'typescript' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-teal-700 dark:text-teal-300">TypeScript Interface</label>
            <button
              onClick={() => copyToClipboard(typescript)}
              className="p-1 hover:bg-teal-100 dark:hover:bg-teal-900/30 rounded"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              )}
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-64">
            {typescript}
          </pre>
        </div>
      )}

      {/* Analysis View */}
      {viewMode === 'analysis' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white dark:bg-gray-800 p-2 rounded border border-teal-200 dark:border-teal-700">
              <p className="text-xs text-teal-700 dark:text-teal-300">Type</p>
              <p className="font-semibold text-teal-900 dark:text-teal-100">{analysis.type}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded border border-teal-200 dark:border-teal-700">
              <p className="text-xs text-teal-700 dark:text-teal-300">Size</p>
              <p className="font-semibold text-teal-900 dark:text-teal-100">{analysis.size} bytes</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded border border-teal-200 dark:border-teal-700">
              <p className="text-xs text-teal-700 dark:text-teal-300">Fields</p>
              <p className="font-semibold text-teal-900 dark:text-teal-100">{analysis.fields}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded border border-teal-200 dark:border-teal-700">
              <p className="text-xs text-teal-700 dark:text-teal-300">Depth</p>
              <p className="font-semibold text-teal-900 dark:text-teal-100">{analysis.depth}</p>
            </div>
          </div>

          {analysis.arrayFields.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-2 rounded border border-teal-200 dark:border-teal-700">
              <p className="text-xs text-teal-700 dark:text-teal-300 mb-1">Array Fields ({analysis.arrayFields.length})</p>
              <div className="flex flex-wrap gap-1">
                {analysis.arrayFields.slice(0, 5).map((field, idx) => (
                  <span key={idx} className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 px-2 py-0.5 rounded font-mono">
                    {field || 'root'}
                  </span>
                ))}
                {analysis.arrayFields.length > 5 && (
                  <span className="text-xs text-teal-600 dark:text-teal-400">+{analysis.arrayFields.length - 5} more</span>
                )}
              </div>
            </div>
          )}

          {analysis.nullFields.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-2 rounded border border-teal-200 dark:border-teal-700">
              <p className="text-xs text-teal-700 dark:text-teal-300 mb-1">Null Fields ({analysis.nullFields.length})</p>
              <div className="flex flex-wrap gap-1">
                {analysis.nullFields.slice(0, 5).map((field, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-mono">
                    {field}
                  </span>
                ))}
                {analysis.nullFields.length > 5 && (
                  <span className="text-xs text-gray-600 dark:text-gray-400">+{analysis.nullFields.length - 5} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 p-2 bg-teal-100 dark:bg-teal-900/30 rounded text-xs text-teal-800 dark:text-teal-200">
        <strong>💡 Schema Inference:</strong> Automatically generated from the API response. 
        Use this to understand the data structure and generate type definitions.
      </div>
    </div>
  );
}

const areEqual = (prevProps, nextProps) => {
  return prevProps.response?.data === nextProps.response?.data;
};

export default memo(SchemaViewer, areEqual);
