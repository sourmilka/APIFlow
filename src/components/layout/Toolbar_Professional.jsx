import React from 'react';
import { Download, Filter, Grid, List, Copy, Play, FileText, FolderPlus, CheckSquare, Square, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

const Toolbar_Professional = ({ 
  selectedApis = [],
  totalApis = 0,
  onSelectAll,
  onClearSelection,
  onExport,
  onDelete,
  onAddToCollection,
  onReplayAll,
  onCompare,
  onTestAll,
  onGenerateDocs,
  onCopyAll,
  viewMode = 'list',
  onViewModeChange
}) => {
  const hasSelection = selectedApis.length > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gradient-to-r from-secondary/50 to-secondary/30 border border-border rounded-lg mb-4">
      {/* Left: Selection Controls */}
      <div className="flex items-center gap-2">
        {hasSelection ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              className="h-8 px-3 gap-1.5"
            >
              <Square className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">{selectedApis.length} selected</span>
            </Button>
            <div className="h-4 w-px bg-border" />
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            className="h-8 px-3 gap-1.5"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span className="text-xs">Select All</span>
          </Button>
        )}
      </div>

      {/* Center: Bulk Actions (when selection active) */}
      {hasSelection && (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onCopyAll}
            className="h-8 px-2.5 gap-1"
            title="Copy all as cURL"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="text-xs hidden md:inline">cURL</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onTestAll}
            className="h-8 px-2.5 gap-1"
            title="Test selected APIs"
          >
            <Play className="w-3.5 h-3.5" />
            <span className="text-xs hidden md:inline">Test</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onReplayAll}
            className="h-8 px-2.5 gap-1"
            title="Replay selected requests"
          >
            <Play className="w-3.5 h-3.5 rotate-180" />
            <span className="text-xs hidden md:inline">Replay</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onCompare}
            className="h-8 px-2.5 gap-1"
            title="Compare APIs"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="text-xs hidden md:inline">Compare</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateDocs}
            className="h-8 px-2.5 gap-1"
            title="Generate documentation"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="text-xs hidden md:inline">Docs</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onAddToCollection}
            className="h-8 px-2.5 gap-1"
            title="Add to collection"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span className="text-xs hidden md:inline">Collection</span>
          </Button>
          
          <div className="h-4 w-px bg-border mx-1" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="h-8 px-2.5 gap-1 text-red-600 hover:bg-red-500/10 border-red-500/30"
            title="Delete selected"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-xs hidden md:inline">Delete</span>
          </Button>
        </div>
      )}

      {/* Right: View & Export */}
      <div className="flex items-center gap-2">
        {!hasSelection && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewModeChange}
              className="h-8 px-2.5 gap-1"
              title={`Switch to ${viewMode === 'list' ? 'grouped' : 'list'} view`}
            >
              {viewMode === 'list' ? (
                <>
                  <Grid className="w-3.5 h-3.5" />
                  <span className="text-xs hidden md:inline">Group</span>
                </>
              ) : (
                <>
                  <List className="w-3.5 h-3.5" />
                  <span className="text-xs hidden md:inline">List</span>
                </>
              )}
            </Button>
            <div className="h-4 w-px bg-border" />
          </>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="h-8 px-3 gap-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border-blue-500/30"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Export</span>
        </Button>
      </div>
    </div>
  );
};

export default Toolbar_Professional;
