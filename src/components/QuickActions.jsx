import { 
  GitCompare, 
  Play, 
  TestTube, 
  FileText, 
  Copy,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function QuickActions({ 
  selectedApis = [],
  onCompare,
  onTestAll,
  onReplayAll,
  onGenerateDocs,
  onCopyAll
}) {
  const hasSelection = selectedApis.length > 0;
  const canCompare = selectedApis.length === 2;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 h-9">
          <Zap className="h-4 w-4" />
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          onClick={onCompare}
          disabled={!canCompare}
          className="gap-2"
        >
          <GitCompare className="h-4 w-4" />
          Compare 2 APIs
          {!canCompare && <span className="ml-auto text-xs text-muted-foreground">Select 2</span>}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={onReplayAll}
          disabled={!hasSelection}
          className="gap-2"
        >
          <Play className="h-4 w-4" />
          Replay Selected
          {!hasSelection && <span className="ml-auto text-xs text-muted-foreground">Select any</span>}
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={onTestAll}
          disabled={!hasSelection}
          className="gap-2"
        >
          <TestTube className="h-4 w-4" />
          Test All Endpoints
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={onGenerateDocs}
          disabled={!hasSelection}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Generate Documentation
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={onCopyAll}
          disabled={!hasSelection}
          className="gap-2"
        >
          <Copy className="h-4 w-4" />
          Copy All as cURL
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default QuickActions;
