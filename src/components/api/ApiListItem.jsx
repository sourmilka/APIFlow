import { Copy, TestTube, ChevronRight, Clock, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

function ApiListItem({ api, isSelected, onSelect, onCopy, onTest, isChecked, onCheck }) {
  const getMethodColor = (method) => {
    const colors = {
      GET: 'border-blue-500 text-blue-500 bg-blue-500/5',
      POST: 'border-green-500 text-green-500 bg-green-500/5',
  PUT: 'border-primary-500 text-primary-500 bg-primary-500/5',
      DELETE: 'border-red-500 text-red-500 bg-red-500/5',
      PATCH: 'border-purple-500 text-purple-500 bg-purple-500/5',
      HEAD: 'border-gray-500 text-gray-500 bg-gray-500/5',
      OPTIONS: 'border-cyan-500 text-cyan-500 bg-cyan-500/5',
    };
    return colors[method] || 'border-gray-500 text-gray-500 bg-gray-500/5';
  };

  const getStatusColor = (status) => {
    if (!status) return 'text-muted-foreground';
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 300 && status < 400) return 'text-blue-500';
  if (status >= 400 && status < 500) return 'text-primary-600';
    if (status >= 500) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const sizeIndex = Math.min(i, sizes.length - 1);
    return Math.round((bytes / Math.pow(k, sizeIndex)) * 10) / 10 + ' ' + sizes[sizeIndex];
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const getDomain = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };

  const getPath = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
  };

  return (
    <Card
      className={cn(
        'p-4 transition-all duration-200 hover:bg-accent/50 hover:border-accent',
        isSelected && 'border-primary bg-accent/30',
        isChecked && 'bg-primary/5 border-primary'
      )}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <Checkbox
          checked={isChecked}
          onCheckedChange={(checked) => {
            onCheck?.(api, checked);
          }}
          onClick={(e) => e.stopPropagation()}
        />
        
        {/* Method Badge - 64px fixed */}
        <Badge
          variant="outline"
          className={cn('h-7 w-16 justify-center font-semibold text-xs', getMethodColor(api.method))}
        >
          {api.method}
        </Badge>

        {/* Path - Flex 1 */}
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onSelect(api)}
        >
          <div className="font-mono text-sm font-medium truncate mb-1 hover:text-primary transition-colors">
            {getPath(api.url)}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate max-w-[200px]">{getDomain(api.url)}</span>
            <span className="text-muted-foreground/50">•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>{api.response?.time ? `${Math.round(api.response.time)}ms` : 'N/A'}</span>
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className="flex items-center gap-1.5">
              <HardDrive className="h-3 w-3" />
              <span>{formatBytes(api.response?.size)}</span>
            </span>
            {api.timestamp && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span>{formatTime(api.timestamp)}</span>
              </>
            )}
          </div>
        </div>

        {/* Status - 70px fixed */}
        <div className="flex flex-col items-end w-[70px]">
          <div className={cn('text-sm font-semibold', getStatusColor(api.response?.status))}>
            {api.response?.status || 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">
            {api.response?.status ? 'Status' : ''}
          </div>
        </div>

        {/* Actions - Fixed width */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              onCopy?.(api);
            }}
            title="Copy URL"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              onTest?.(api);
            }}
            title="Test API"
          >
            <TestTube className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="View Details"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ApiListItem;
