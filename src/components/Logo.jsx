import React from 'react';
import { BRAND } from '../constants/brand';

const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  const iconSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizes[size]} flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 shadow-lg shadow-blue-500/30 transform transition-transform hover:scale-105`}>
        <span className={`${iconSizes[size]} font-bold text-white drop-shadow-md`}>
          {BRAND.logo.icon}
        </span>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizes[size]} font-bold tracking-tight leading-none`}>
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              {BRAND.name}
            </span>
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
              {BRAND.versionName}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
