import { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import ApiListItem from './ApiListItem';

function GroupedApiList({ apis, selectedApi, onSelectApi }) {
  const [expandedGroups, setExpandedGroups] = useState(new Set(['all']));
  const [groupBy, setGroupBy] = useState('domain'); // domain, path, method, status

  const toggleGroup = (groupName) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const groupApis = () => {
    const groups = {};

    apis.forEach(api => {
      let groupKey;

      switch (groupBy) {
        case 'domain':
          try {
            groupKey = new URL(api.url).hostname;
          } catch {
            groupKey = 'Invalid URL';
          }
          break;

        case 'path':
          try {
            const urlObj = new URL(api.url);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            groupKey = pathParts.length > 0 ? `/${pathParts[0]}` : '/';
          } catch {
            groupKey = 'Other';
          }
          break;

        case 'method':
          groupKey = api.method;
          break;

        case 'status':
          if (!api.response) {
            groupKey = 'Pending';
          } else if (api.response.status >= 200 && api.response.status < 300) {
            groupKey = 'Success (2xx)';
          } else if (api.response.status >= 400 && api.response.status < 500) {
            groupKey = 'Client Error (4xx)';
          } else if (api.response.status >= 500) {
            groupKey = 'Server Error (5xx)';
          } else {
            groupKey = 'Other';
          }
          break;

        default:
          groupKey = 'All';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(api);
    });

    return groups;
  };

  const groups = groupApis();
  const groupNames = Object.keys(groups).sort();

  const getGroupColor = (groupName) => {
    if (groupBy === 'status') {
      if (groupName.includes('Success')) return 'text-primary border-primary/30 bg-primary/5';
      if (groupName.includes('Error')) return 'text-destructive border-destructive/30 bg-destructive/5';
      if (groupName.includes('Pending')) return 'text-muted-foreground border-border bg-secondary/30';
    }
    if (groupBy === 'method') {
      const colors = {
        GET: 'text-blue-500 border-blue-500/30 bg-blue-500/5',
        POST: 'text-primary border-primary/30 bg-primary/5',
  PUT: 'text-primary-600 border-primary/30 bg-primary/5',
        DELETE: 'text-destructive border-destructive/30 bg-destructive/5',
        PATCH: 'text-purple-500 border-purple-500/30 bg-purple-500/5',
      };
      return colors[groupName] || 'text-foreground border-border bg-secondary/30';
    }
    return 'text-foreground border-border bg-card';
  };

  return (
    <div>
      {/* Group By Selector */}
      <div className="mb-3 flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">Group by:</label>
        <select
          value={groupBy}
          onChange={(e) => {
            setGroupBy(e.target.value);
            setExpandedGroups(new Set(['all']));
          }}
          className="h-9 px-3 text-sm border border-border bg-background rounded focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="domain">Domain</option>
          <option value="path">Base Path</option>
          <option value="method">HTTP Method</option>
          <option value="status">Status Code</option>
        </select>
        <button
          onClick={() => {
            if (expandedGroups.size === groupNames.length) {
              setExpandedGroups(new Set());
            } else {
              setExpandedGroups(new Set(groupNames));
            }
          }}
          className="ml-auto text-xs text-primary hover:text-primary/80 font-medium"
        >
          {expandedGroups.size === groupNames.length ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Grouped Lists */}
      <div className="space-y-2">
        {groupNames.map(groupName => {
          const groupApis = groups[groupName];
          const isExpanded = expandedGroups.has(groupName);

          return (
            <div key={groupName} className="border border-border rounded overflow-hidden">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(groupName)}
                className={`w-full px-4 py-2.5 flex items-center justify-between hover:opacity-80 transition-all ${getGroupColor(groupName)}`}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <>
                      <FolderOpen className="w-4 h-4" />
                      <ChevronDown className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Folder className="w-4 h-4" />
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                  <span className="font-semibold text-sm">{groupName}</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-background border border-border rounded">
                  {groupApis.length}
                </span>
              </button>

              {/* Group Content */}
              {isExpanded && (
                <div className="bg-background p-2 border-t border-border">
                  <div className="space-y-2">
                    {groupApis.map((api) => (
                      <ApiListItem
                        key={api.id}
                        api={api}
                        isSelected={selectedApi?.id === api.id}
                        onSelect={onSelectApi}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GroupedApiList;
