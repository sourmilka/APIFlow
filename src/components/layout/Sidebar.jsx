import { 
  BarChart3, 
  List, 
  Activity, 
  History,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useNavigation } from '@/contexts/NavigationContext';

function Sidebar({ 
  apiCount = 0,
  activeConnections = 0,
  requestsPerSecond = 0,
  avgResponseTime = 0,
  successRate = 100
}) {
  const { activeSection, setActiveSection } = useNavigation();

  return (
    <aside className="w-56 border-r border-border bg-card flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5">
        <div className="px-3 py-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Menu
          </h2>
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 h-9 px-3"
        >
          <List className="h-4 w-4" />
          <span className="text-sm font-medium">APIs</span>
          {apiCount > 0 && (
            <Badge variant="outline" className="ml-auto h-5 px-1.5 text-xs">
              {apiCount}
            </Badge>
          )}
        </Button>
      </nav>

      <Separator />

      {/* Live Metrics */}
      <div className="p-2">
        <div className="px-3 py-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Stats
          </h2>
        </div>
        <div className="px-3 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{apiCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg Time</span>
            <span className="font-semibold">{avgResponseTime ? `${avgResponseTime}ms` : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Success</span>
            <span className="font-semibold text-primary">{successRate}%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
