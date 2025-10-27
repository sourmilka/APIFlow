import React from 'react';
import { Loader2, Globe, CheckCircle, Clock, Zap } from 'lucide-react';

const ProgressTracker_New = () => {
  const steps = [
    { icon: Globe, label: 'Loading website', status: 'active' },
    { icon: Zap, label: 'Intercepting requests', status: 'pending' },
    { icon: Clock, label: 'Analyzing APIs', status: 'pending' },
    { icon: CheckCircle, label: 'Processing results', status: 'pending' }
  ];

  return (
    <div className="relative overflow-hidden rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 backdrop-blur-sm">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
      
      {/* Content */}
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Analyzing Website</h3>
            <p className="text-xs text-muted-foreground">Discovering API endpoints...</p>
          </div>
        </div>

        {/* Progress Steps - Compact Horizontal */}
        <div className="flex items-center gap-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.status === 'active';
            
            return (
              <React.Fragment key={index}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30' 
                    : 'bg-secondary/30 border border-transparent'
                }`}>
                  <Icon className={`w-3.5 h-3.5 ${
                    isActive ? 'text-blue-500 animate-pulse' : 'text-muted-foreground'
                  }`} />
                  <span className={`text-xs font-medium ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
                
                {/* Connector */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-1 bg-secondary/50 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse" style={{ width: '60%' }} />
        </div>

        {/* Status Text */}
        <p className="mt-3 text-center text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="animate-pulse">●</span>
            Please wait while we capture network activity...
          </span>
        </p>
      </div>
    </div>
  );
};

export default ProgressTracker_New;
