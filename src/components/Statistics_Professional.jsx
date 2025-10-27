import React from 'react';
import { Activity, CheckCircle, Clock, TrendingUp, Zap, Globe, Database } from 'lucide-react';

const Statistics_Professional = ({ stats = {} }) => {
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
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const statCards = [
    {
      icon: Database,
      label: 'Total APIs',
      value: totalApis,
      subtitle: Object.entries(methods).map(([method, count]) => 
        `${method} ${count}`
      ).join(' • ') || 'No requests',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      iconColor: 'text-blue-500'
    },
    {
      icon: CheckCircle,
      label: 'Success Rate',
      value: `${successRate.toFixed(1)}%`,
      subtitle: `${Math.round(totalApis * successRate / 100)} passed`,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
      iconColor: 'text-green-500'
    },
    {
      icon: Clock,
      label: 'Avg Response',
      value: formatTime(avgResponseTime),
      subtitle: avgResponseTime < 500 ? 'Fast' : avgResponseTime < 2000 ? 'Normal' : 'Slow',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
      iconColor: 'text-purple-500'
    },
    {
      icon: Globe,
      label: 'Domains',
      value: domains,
      subtitle: domains === 1 ? 'Single domain' : `${domains} unique domains`,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/10 to-red-500/10',
      iconColor: 'text-orange-500'
    },
    {
      icon: TrendingUp,
      label: 'Total Size',
      value: formatSize(totalSize),
      subtitle: 'Downloaded',
      gradient: 'from-cyan-500 to-blue-500',
      bgGradient: 'from-cyan-500/10 to-blue-500/10',
      iconColor: 'text-cyan-500'
    },
    {
      icon: Zap,
      label: 'WebSockets',
      value: websockets,
      subtitle: websockets > 0 ? 'Active connections' : 'No connections',
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-500/10 to-orange-500/10',
      iconColor: 'text-yellow-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="group relative overflow-hidden rounded-xl border border-border bg-card hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            
            {/* Content */}
            <div className="relative p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${stat.bgGradient} shadow-sm`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <div className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${stat.gradient} text-white shadow-sm`}>
                  LIVE
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stat.subtitle}
                </p>
              </div>
              
              {/* Hover Effect Line */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Statistics_Professional;
