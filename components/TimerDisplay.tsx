import React from 'react';
import { TimerPhase, PHASE_CONFIG } from '../types';

interface TimerDisplayProps {
  seconds: number;
  totalDuration: number; // usually 840 (14 mins)
  phase: TimerPhase;
  isRunning: boolean;
}

const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ seconds, totalDuration, phase, isRunning }) => {
  const config = PHASE_CONFIG[phase];
  
  // Calculate progress for the circle
  // We clamp it to 100% if over time
  const progress = Math.min((seconds / totalDuration) * 100, 100);
  const circumference = 2 * Math.PI * 120; // Radius 120
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center p-8">
      {/* SVG Ring */}
      <div className="relative w-80 h-80">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 260 260">
          {/* Background Track */}
          <circle
            cx="130"
            cy="130"
            r="120"
            fill="none"
            className="stroke-slate-200"
            strokeWidth="12"
          />
          {/* Progress Ring */}
          <circle
            cx="130"
            cy="130"
            r="120"
            fill="none"
            className={`transition-all duration-1000 ease-linear ${phase === TimerPhase.FINISHED ? 'stroke-rose-500' : config.barColor.replace('bg-', 'stroke-')}`}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-7xl font-mono font-bold tracking-tighter ${config.color}`}>
            {formatTime(seconds)}
          </div>
          <div className={`mt-2 text-sm font-semibold uppercase tracking-widest px-3 py-1 rounded-full ${config.bgColor} ${config.color}`}>
            {config.label}
          </div>
        </div>
      </div>

      {/* Phase Indicators */}
      <div className="w-full max-w-md mt-8 grid grid-cols-3 gap-2">
         {/* Phase 1: 0-8m */}
         <div className={`h-2 rounded-full transition-colors ${seconds >= 0 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
         {/* Phase 2: 8-12m */}
         <div className={`h-2 rounded-full transition-colors ${seconds >= 480 ? 'bg-amber-500' : 'bg-slate-200'}`}></div>
         {/* Phase 3: 12-14m */}
         <div className={`h-2 rounded-full transition-colors ${seconds >= 720 ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
      </div>
      
      <div className="mt-4 text-center text-slate-500 text-sm">
        {config.message}
      </div>
    </div>
  );
};