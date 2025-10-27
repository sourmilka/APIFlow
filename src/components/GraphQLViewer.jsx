import { memo } from 'react';
import { Code2, Database, Variable } from 'lucide-react';

const getOperationColor = (type) => {
  switch (type) {
    case 'query':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'mutation':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'subscription':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

function GraphQLViewer({ graphql }) {
  if (!graphql) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Code2 className="w-5 h-5 text-indigo-600" />
        <h4 className="font-semibold text-indigo-900">GraphQL Operation</h4>
        <span className={`px-2 py-1 text-xs font-semibold rounded border ${getOperationColor(graphql.operationType)}`}>
          {graphql.operationType.toUpperCase()}
        </span>
      </div>

      {/* Operation Name */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-indigo-700 mb-1">Operation Name</label>
        <div className="bg-white px-3 py-2 rounded border border-indigo-200">
          <code className="text-sm text-indigo-900 font-semibold">{graphql.operationName}</code>
        </div>
      </div>

      {/* Query */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-indigo-700 mb-1">Query</label>
        <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-48">
          {graphql.query}
        </pre>
      </div>

      {/* Fields */}
      {graphql.fields && graphql.fields.length > 0 && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-indigo-700 mb-1">
            <Database className="w-3 h-3 inline mr-1" />
            Requested Fields
          </label>
          <div className="flex flex-wrap gap-1">
            {graphql.fields.map((field, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-white text-indigo-700 text-xs rounded border border-indigo-200 font-mono"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Variables */}
      {graphql.variables && Object.keys(graphql.variables).length > 0 && (
        <div>
          <label className="block text-xs font-medium text-indigo-700 mb-1">
            <Variable className="w-3 h-3 inline mr-1" />
            Variables
          </label>
          <pre className="bg-white p-3 rounded border border-indigo-200 text-xs overflow-x-auto">
            {JSON.stringify(graphql.variables, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-3 p-2 bg-indigo-100 rounded text-xs text-indigo-800">
        <strong>💡 GraphQL Detected:</strong> This is a GraphQL {graphql.operationType} operation. 
        {graphql.operationType === 'query' && ' It fetches data from the server.'}
        {graphql.operationType === 'mutation' && ' It modifies data on the server.'}
        {graphql.operationType === 'subscription' && ' It subscribes to real-time updates.'}
      </div>
    </div>
  );
}

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.graphql?.operationName === nextProps.graphql?.operationName &&
    prevProps.graphql?.query === nextProps.graphql?.query
  );
};

export default memo(GraphQLViewer, areEqual);
