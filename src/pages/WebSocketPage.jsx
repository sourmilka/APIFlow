import { useState } from 'react';
import { 
  Activity, 
  Wifi, 
  WifiOff,
  MessageSquare,
  Send,
  Trash2,
  Download,
  Play,
  Square
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

function WebSocketPage({ websockets = [] }) {
  const [selectedWs, setSelectedWs] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  
  const activeConnections = websockets.filter(ws => ws.status === 'connected');
  const disconnectedConnections = websockets.filter(ws => ws.status !== 'connected');

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    // TODO: Implement actual message sending
    console.log('Sending message:', messageInput);
    setMessageInput('');
  };

  const handleClearMessages = (wsId) => {
    // TODO: Implement message clearing
    console.log('Clearing messages for:', wsId);
  };

  const handleDisconnect = (wsId) => {
    // TODO: Implement disconnect
    console.log('Disconnecting:', wsId);
  };

  const handleReconnect = (wsId) => {
    // TODO: Implement reconnect
    console.log('Reconnecting:', wsId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">WebSocket Monitor</h1>
          <p className="text-sm text-muted-foreground">
            Real-time WebSocket connection management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3 text-green-500" />
            {activeConnections.length} Active
          </Badge>
          <Badge variant="outline" className="gap-1">
            <WifiOff className="h-3 w-3 text-muted-foreground" />
            {disconnectedConnections.length} Disconnected
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Connections</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-1 p-4">
                {websockets.length > 0 ? (
                  websockets.map((ws, index) => {
                    const isActive = ws.status === 'connected';
                    const isSelected = selectedWs?.id === ws.id;
                    
                    return (
                      <button
                        key={ws.id || index}
                        onClick={() => setSelectedWs(ws)}
                        className={`w-full text-left p-3 rounded-md border transition-colors ${
                          isSelected 
                            ? 'bg-secondary border-primary' 
                            : 'hover:bg-secondary/50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-1 h-2 w-2 rounded-full ${
                            isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium truncate">
                                Connection {index + 1}
                              </span>
                              <Badge 
                                variant={isActive ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {ws.status || 'unknown'}
                              </Badge>
                            </div>
                            <p className="text-xs font-mono text-muted-foreground truncate">
                              {ws.url || ws.id}
                            </p>
                            {ws.messageCount !== undefined && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {ws.messageCount} messages
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <WifiOff className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No WebSocket connections</p>
                    <p className="text-xs mt-1">
                      Parse a website to detect connections
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Connection Details & Messages */}
        <Card className="lg:col-span-2">
          {selectedWs ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base mb-1">Connection Details</CardTitle>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {selectedWs.url || selectedWs.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedWs.status === 'connected' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(selectedWs.id)}
                        className="gap-1"
                      >
                        <Square className="h-3 w-3" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReconnect(selectedWs.id)}
                        className="gap-1"
                      >
                        <Play className="h-3 w-3" />
                        Reconnect
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearMessages(selectedWs.id)}
                      className="gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <Separator />
              
              <CardContent className="p-4">
                {/* Connection Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge variant={selectedWs.status === 'connected' ? 'default' : 'secondary'}>
                      {selectedWs.status || 'unknown'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Protocol</p>
                    <p className="text-sm font-medium">{selectedWs.protocol || 'WebSocket'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Messages</p>
                    <p className="text-sm font-medium">{selectedWs.messageCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Connected At</p>
                    <p className="text-sm font-medium">
                      {selectedWs.connectedAt 
                        ? new Date(selectedWs.connectedAt).toLocaleTimeString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Messages */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Messages</h4>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Download className="h-3 w-3" />
                      Export
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[300px] rounded-md border p-3">
                    {selectedWs.messages && selectedWs.messages.length > 0 ? (
                      <div className="space-y-3">
                        {selectedWs.messages.map((msg, index) => (
                          <div 
                            key={index}
                            className={`p-2 rounded-md text-sm ${
                              msg.type === 'sent' 
                                ? 'bg-primary/10 ml-8' 
                                : 'bg-secondary mr-8'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {msg.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                              {typeof msg.data === 'string' 
                                ? msg.data 
                                : JSON.stringify(msg.data, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No messages yet
                      </div>
                    )}
                  </ScrollArea>

                  {/* Send Message */}
                  {selectedWs.status === 'connected' && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Enter message to send..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="min-h-[80px] font-mono text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            handleSendMessage();
                          }
                        }}
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          Press Ctrl+Enter to send
                        </p>
                        <Button 
                          size="sm"
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim()}
                          className="gap-1"
                        >
                          <Send className="h-3 w-3" />
                          Send Message
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[600px]">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Select a connection to view details</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default WebSocketPage;
