import { useState } from 'react';
import { 
  History, 
  Search,
  Download,
  Trash2,
  Calendar,
  Clock,
  Globe,
  Eye,
  Archive,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function HistoryPage({ sessions = [], onClearAll, onDeleteSession, onExportSession }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [selectedSession, setSelectedSession] = useState(null);

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterPeriod === 'all') return true;
    
    const sessionDate = new Date(session.timestamp);
    const now = new Date();
    const dayInMs = 24 * 60 * 60 * 1000;

    switch (filterPeriod) {
      case 'today':
        return now - sessionDate < dayInMs;
      case 'week':
        return now - sessionDate < 7 * dayInMs;
      case 'month':
        return now - sessionDate < 30 * dayInMs;
      default:
        return true;
    }
  });

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Session History</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your parsing sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onExportSession?.(null)}
            className="gap-1"
          >
            <Download className="h-3 w-3" />
            Export All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onClearAll}
            className="gap-1 text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions by URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Sessions</CardTitle>
              <Badge variant="outline">{filteredSessions.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-1 p-4">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => {
                    const isSelected = selectedSession?.id === session.id;
                    
                    return (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`w-full text-left p-3 rounded-md border transition-colors ${
                          isSelected 
                            ? 'bg-secondary border-primary' 
                            : 'hover:bg-secondary/50'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Globe className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {new URL(session.url).hostname}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                {new URL(session.url).pathname}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(session.timestamp)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {session.apiCount || 0} APIs
                            </Badge>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No sessions found</p>
                    {searchQuery && (
                      <p className="text-xs mt-1">
                        Try adjusting your search
                      </p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Session Details */}
        <Card className="lg:col-span-2">
          {selectedSession ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base mb-1">Session Details</CardTitle>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {selectedSession.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onExportSession?.(selectedSession.id)}
                      className="gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Export
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onDeleteSession?.(selectedSession.id);
                        setSelectedSession(null);
                      }}
                      className="gap-1 text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <Separator />
              
              <CardContent className="p-4">
                {/* Session Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Start Time</p>
                    <p className="text-sm font-medium">
                      {formatDate(selectedSession.timestamp)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Duration</p>
                    <p className="text-sm font-medium">
                      {formatDuration(selectedSession.duration)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">APIs Found</p>
                    <p className="text-sm font-medium">{selectedSession.apiCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge variant={selectedSession.status === 'completed' ? 'default' : 'secondary'}>
                      {selectedSession.status || 'completed'}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* API List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Captured APIs</h4>
                  
                  <ScrollArea className="h-[400px] rounded-md border">
                    {selectedSession.apis && selectedSession.apis.length > 0 ? (
                      <div className="p-3 space-y-2">
                        {selectedSession.apis.map((api, index) => (
                          <div 
                            key={index}
                            className="p-3 rounded-md border hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <Badge 
                                variant="outline"
                                className="text-xs"
                              >
                                {api.method}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-mono truncate mb-1">
                                  {api.url}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {api.response?.status && (
                                    <span className={
                                      api.response.status >= 200 && api.response.status < 300
                                        ? 'text-green-500'
                                        : 'text-red-500'
                                    }>
                                      Status: {api.response.status}
                                    </span>
                                  )}
                                  {api.response?.time && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {Math.round(api.response.time)}ms
                                    </span>
                                  )}
                                  <span>
                                    {new Date(api.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground text-sm">
                        No APIs in this session
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Session Notes */}
                {selectedSession.notes && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedSession.notes}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[600px]">
              <div className="text-center text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Select a session to view details</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default HistoryPage;
