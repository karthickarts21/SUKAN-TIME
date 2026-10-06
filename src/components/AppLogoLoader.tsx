import React from 'react';

interface AppLogoLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const AppLogoLoader: React.FC<AppLogoLoaderProps> = ({
  size = 'md',
  text = 'Loading...',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const ringSizes = {
    sm: 'w-9 h-9 border-2',
    md: 'w-14 h-14 border-2',
    lg: 'w-22 h-22 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4">
      <div className="relative flex items-center justify-center">
        {/* Animated Outer Pulse Ring */}
        <div
          className={`absolute rounded-full border-emerald-500/30 animate-ping ${ringSizes[size]}`}
        />
        {/* Animated Spin Ring */}
        <div
          className={`absolute rounded-full border-t-emerald-600 border-r-transparent border-b-emerald-600/20 border-l-transparent animate-spin ${ringSizes[size]}`}
        />
        {/* Logo Image in Center */}
        <img
          src="/logo.png"
          alt="Loading..."
          className={`object-contain rounded-xl shadow-xs relative z-10 animate-pulse ${sizeClasses[size]}`}
        />
      </div>
      {text && (
        <span className="text-xs font-semibold text-neutral-600 tracking-wide animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
};
