import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Shuffle, Users, 
  ChevronUp, ChevronDown, Settings, ExternalLink,
  MoreVertical, CheckCircle2, Circle
} from 'lucide-react';
import { TimerDisplay } from './components/TimerDisplay';
import { Group, TimerPhase, PHASE_CONFIG } from './types';
import { playSound } from './utils/sound';

// Initial Setup
const INITIAL_GROUPS_BATCH_1 = Array.from({ length: 10 }, (_, i) => ({ id: `b1-g${i + 1}`, name: `Group ${i + 1}`, status: 'pending' as const }));
const INITIAL_GROUPS_BATCH_2 = Array.from({ length: 10 }, (_, i) => ({ id: `b2-g${i + 1}`, name: `Group ${i + 11}`, status: 'pending' as const }));

export default function App() {
  // State: Management
  const [batch, setBatch] = useState<1 | 2>(1);
  const [groupsBatch1, setGroupsBatch1] = useState<Group[]>(INITIAL_GROUPS_BATCH_1);
  const [groupsBatch2, setGroupsBatch2] = useState<Group[]>(INITIAL_GROUPS_BATCH_2);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  
  // State: Timer
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [formLink, setFormLink] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  // Computed
  const currentGroups = batch === 1 ? groupsBatch1 : groupsBatch2;
  const setGroups = batch === 1 ? setGroupsBatch1 : setGroupsBatch2;
  
  // Phase Logic
  const getPhase = (sec: number): TimerPhase => {
    if (sec < 480) return TimerPhase.PRESENTATION; // 0-8m
    if (sec < 720) return TimerPhase.Q_AND_A; // 8-12m
    if (sec < 840) return TimerPhase.ASSESSMENT; // 12-14m
    return TimerPhase.FINISHED; // >14m
  };

  const currentPhase = getPhase(seconds);

  // Effects
  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1;
          
          // Sound Triggers
          if (next === 300) playSound('soft'); // 5m warning (Beep)
          if (next === 420) playSound('finish'); // 7m warning (Beep Beep - utilizing finish sound which is double beep)
          
          // Phase transition sounds
          if (next === 480) playSound('alert'); // End Presentation (8m)
          if (next === 720) playSound('alert'); // End Q&A (12m)
          if (next === 840) playSound('finish'); // End Assessment (14m)
          
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Handlers
  const handleShuffle = () => {
    if (isRunning) return; // Prevent shuffle while running
    const shuffled = [...currentGroups].sort(() => Math.random() - 0.5);
    setGroups(shuffled);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (isRunning && currentGroups[index].id === activeGroupId) return; // Lock active group
    
    const newGroups = [...currentGroups];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newGroups.length) {
      [newGroups[index], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[index]];
      setGroups(newGroups);
    }
  };

  const handleStartGroup = (group: Group) => {
    // If selecting a new group, reset timer
    if (activeGroupId !== group.id) {
        setActiveGroupId(group.id);
        setSeconds(0);
        setIsRunning(false); // Let user hit start manually to prepare
        
        // Update status of previous active group to completed if it exists
        setGroups(prev => prev.map(g => {
            if (g.id === activeGroupId) return { ...g, status: 'completed' };
            if (g.id === group.id) return { ...g, status: 'active' };
            return g;
        }));
    }
  };
  
  const toggleTimer = () => {
    if (!activeGroupId && currentGroups.length > 0) {
      // Auto-select first pending if none selected
      handleStartGroup(currentGroups[0]);
      return;
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  const handleNameEdit = (id: string, newName: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, name: newName } : g));
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar: Group List */}
      <aside className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col shadow-xl z-10">
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Class Presentation
          </h1>
          <p className="text-xs text-slate-500 mt-1">43 Students • 20 Groups</p>
        </div>

        {/* Batch Toggle */}
        <div className="flex p-2 bg-slate-50 border-b border-slate-200">
          <button 
            onClick={() => { setBatch(1); setIsRunning(false); setActiveGroupId(null); setSeconds(0); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${batch === 1 ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Week 1 (Gr 1-10)
          </button>
          <button 
            onClick={() => { setBatch(2); setIsRunning(false); setActiveGroupId(null); setSeconds(0); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${batch === 2 ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Week 2 (Gr 11-20)
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-white">
          <button 
            onClick={handleShuffle}
            disabled={isRunning || activeGroupId !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
            title="Randomize Order"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Shuffle Order
          </button>
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 animate-in slide-in-from-top-2">
            <label className="block text-xs font-semibold text-slate-600 mb-2">Peer Assessment Link (Google Form)</label>
            <input 
              type="url" 
              value={formLink}
              onChange={(e) => setFormLink(e.target.value)}
              placeholder="https://forms.google.com/..."
              className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {currentGroups.map((group, index) => (
            <div 
              key={group.id}
              className={`
                group relative flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none
                ${group.id === activeGroupId 
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-200' 
                  : group.status === 'completed' 
                    ? 'bg-slate-50 border-slate-100 opacity-60' 
                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'}
              `}
              onClick={() => handleStartGroup(group)}
            >
              {/* Order Indicator */}
              <div className="flex flex-col items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                {index + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <input 
                  value={group.name}
                  onChange={(e) => handleNameEdit(group.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent font-medium text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-300 rounded px-1 -ml-1 w-full truncate"
                />
                <div className="text-[10px] uppercase font-semibold text-slate-400 mt-0.5">
                    {group.id === activeGroupId ? (isRunning ? 'Presenting Now' : 'Ready') : group.status}
                </div>
              </div>

              {/* Status Icon */}
              {group.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              {group.id === activeGroupId && <Circle className="w-4 h-4 text-indigo-500 fill-indigo-500 animate-pulse" />}

              {/* Reorder Buttons (Hover Only) */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded p-1">
                <button 
                   onClick={(e) => { e.stopPropagation(); handleMove(index, 'up'); }}
                   className="p-1 hover:bg-slate-200 rounded text-slate-500"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button 
                   onClick={(e) => { e.stopPropagation(); handleMove(index, 'down'); }}
                   className="p-1 hover:bg-slate-200 rounded text-slate-500"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content: Timer */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background Gradients based on phase */}
        <div className={`absolute inset-0 transition-colors duration-1000 opacity-30 pointer-events-none
          ${currentPhase === TimerPhase.PRESENTATION ? 'bg-gradient-to-br from-emerald-100 to-slate-100' : ''}
          ${currentPhase === TimerPhase.Q_AND_A ? 'bg-gradient-to-br from-amber-100 to-slate-100' : ''}
          ${currentPhase === TimerPhase.ASSESSMENT ? 'bg-gradient-to-br from-indigo-100 to-slate-100' : ''}
          ${currentPhase === TimerPhase.FINISHED ? 'bg-gradient-to-br from-rose-100 to-slate-100' : ''}
        `}></div>

        {/* Current Active Header */}
        <div className="relative z-10 pt-12 pb-4 text-center">
            {activeGroupId ? (
                <div>
                    <h2 className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-2">Current Group</h2>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
                        {currentGroups.find(g => g.id === activeGroupId)?.name}
                    </h1>
                </div>
            ) : (
                <div className="h-24 flex items-center justify-center">
                    <p className="text-slate-400 text-lg">Select a group to start</p>
                </div>
            )}
        </div>

        {/* Big Timer */}
        <div className="flex-1 flex items-center justify-center relative z-10 min-h-[400px]">
            <TimerDisplay 
                seconds={seconds} 
                totalDuration={840} 
                phase={currentPhase} 
                isRunning={isRunning}
            />
        </div>

        {/* Contextual Actions (Google Form) */}
        <div className="h-32 flex items-start justify-center relative z-10 px-4">
            {(currentPhase === TimerPhase.ASSESSMENT || currentPhase === TimerPhase.FINISHED) && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {formLink ? (
                        <a 
                            href={formLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 font-semibold text-lg"
                        >
                            <span>Open Peer Assessment Form</span>
                            <ExternalLink className="w-5 h-5" />
                        </a>
                    ) : (
                        <button 
                            onClick={() => setShowSettings(true)}
                            className="text-indigo-600 underline underline-offset-4 hover:text-indigo-800"
                        >
                            Set Google Form URL in Settings
                        </button>
                    )}
                </div>
            )}
        </div>

        {/* Footer Controls */}
        <div className="relative z-20 bg-white border-t border-slate-200 p-6 flex items-center justify-center gap-6 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
            <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
                <RotateCcw className="w-5 h-5" />
                Reset
            </button>

            <button 
                onClick={toggleTimer}
                disabled={!activeGroupId}
                className={`
                    flex items-center gap-3 px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95
                    ${isRunning 
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                        : 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:transform-none'}
                `}
            >
                {isRunning ? (
                    <>
                        <Pause className="w-6 h-6 fill-current" />
                        Pause
                    </>
                ) : (
                    <>
                        <Play className="w-6 h-6 fill-current" />
                        {seconds > 0 ? 'Resume' : 'Start Timer'}
                    </>
                )}
            </button>
        </div>
      </main>
    </div>
  );
}