import React from 'react';
import { Database, CheckCircle, Clock, Globe, HardDrive, Zap, TrendingUp, TrendingDown, Activity } from 'lucide-react';

const Statistics_Compact = ({ stats = {} }) => {
  const {
    totalApis = 0,
    successRate = 100,
    avgResponseTime = 0,
    methods = {},
    domains = 0,
    totalSize = 0,
    websockets = 0
  } = stats;

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceStatus = (ms) => {
    if (ms < 300) return { text: 'Excellent', color: 'text-green-500', icon: TrendingUp };
    if (ms < 1000) return { text: 'Good', color: 'text-blue-500', icon: Activity };
    if (ms < 3000) return { text: 'Average', color: 'text-yellow-500', icon: TrendingDown };
    return { text: 'Slow', color: 'text-red-500', icon: TrendingDown };
  };

  const performance = getPerformanceStatus(avgResponseTime);
  const PerformanceIcon = performance.icon;

  return (
    <div className="mb-3 p-3 rounded-xl border border-border bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 shadow-sm">
      {/* Ultra Compact Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {/* Total APIs - Expanded */}
        <div className="col-span-1 p-2 rounded-lg bg-card/50 border border-blue-500/20 hover:border-blue-500/40 transition-all group">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center">
              <Database className="w-3 h-3 text-blue-500" />
            </div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">APIs</span>
          </div>
          <div className="text-xl font-bold text-foreground mb-0.5">{totalApis}</div>
          <div className="flex flex-wrap gap-0.5">
            {Object.entries(methods).slice(0, 3).map(([method, count]) => (
              <span key={method} className="text-[8px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold">
                {method} {count}
              </span>
            ))}
          </div>
        </div>

        {/* Success Rate */}
        <div className="col-span-1 p-2 rounded-lg bg-card/50 border border-green-500/20 hover:border-green-500/40 transition-all">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-green-500" />
            </div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Success</span>
          </div>
          <div className="text-xl font-bold text-green-600 mb-0.5">{successRate.toFixed(1)}%</div>
          <div className="text-[8px] text-muted-foreground font-medium">
            {Math.round(totalApis * successRate / 100)}/{totalApis} OK
          </div>
        </div>

        {/* Response Time */}
        <div className="col-span-1 p-2 rounded-lg bg-card/50 border border-purple-500/20 hover:border-purple-500/40 transition-all">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded bg-purple-500/10 flex items-center justify-center">
              <Clock className="w-3 h-3 text-purple-500" />
            </div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Speed</span>
          </div>
          <div className="text-xl font-bold text-foreground mb-0.5">{formatTime(avgResponseTime)}</div>
          <div className={`flex items-center gap-0.5 text-[8px] font-bold ${performance.color}`}>
            <PerformanceIcon className="w-2 h-2" />
            {performance.text}
          </div>
        </div>

        {/* Domains */}
        <div className="col-span-1 p-2 rounded-lg bg-card/50 border border-orange-500/20 hover:border-orange-500/40 transition-all">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded bg-orange-500/10 flex items-center justify-center">
              <Globe className="w-3 h-3 text-orange-500" />
            </div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Hosts</span>
          </div>
          <div className="text-xl font-bold text-foreground mb-0.5">{domains}</div>
          <div className="text-[8px] text-muted-foreground font-medium">
            {domains === 1 ? 'Single' : `${domains} unique`}
          </div>
        </div>

        {/* Total Size */}
        <div className="col-span-1 p-2 rounded-lg bg-card/50 border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded bg-cyan-500/10 flex items-center justify-center">
              <HardDrive className="w-3 h-3 text-cyan-500" />
            </div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Data</span>
          </div>
          <div className="text-xl font-bold text-foreground mb-0.5">{formatSize(totalSize)}</div>
          <div className="text-[8px] text-muted-foreground font-medium">
            {formatSize(totalSize / totalApis)}/req
          </div>
        </div>

        {/* WebSockets */}
        <div className="col-span-1 p-2 rounded-lg bg-card/50 border border-yellow-500/20 hover:border-yellow-500/40 transition-all">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded bg-yellow-500/10 flex items-center justify-center">
              <Zap className="w-3 h-3 text-yellow-500" />
            </div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase">WS</span>
          </div>
          <div className="text-xl font-bold text-foreground mb-0.5">{websockets}</div>
          <div className="text-[8px] text-muted-foreground font-medium">
            {websockets > 0 ? 'Live' : 'None'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics_Compact;
