import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Shuffle, Users, 
  ChevronUp, ChevronDown, Settings, ExternalLink,
  MoreVertical, CheckCircle2, Circle, SkipForward, Clock, QrCode
} from 'lucide-react';
import { TimerDisplay } from './components/TimerDisplay';
import { Group, TimerPhase, PHASE_CONFIG } from './types';
import { playSound } from './utils/sound';

// Initial Setup
const INITIAL_GROUPS_BATCH_1 = Array.from({ length: 12 }, (_, i) => {
  // Week 15 Data (G1-G7 defined, others placeholder)
  const definedGroups = [
    "G1: 1103565 Eric; 1113540 Kassie",
    "G2: 1113537 Yada(馮夢瑩); 1113538 Angelica(欣于姬)",
    "G3: 1113526 Sunny; 1113530 Kamila",
    "G4: 1113507 Johnny; 1113514 Steven; 1113518 Joey",
    "G5: 1113568 蔡函伃; 1113570 今井駿平",
    "G6: 1113523",
    "G7: 1123546 Maji"
  ];
  return { 
    id: `b1-g${i + 1}`, 
    name: definedGroups[i] || `Group ${i + 1}`, 
    status: 'pending' as const 
  };
});

const INITIAL_GROUPS_BATCH_2 = Array.from({ length: 13 }, (_, i) => {
  // Week 16 Data (G11-G23)
  const definedGroups = [
    "G11: 1113524 Amane; 1113505 Elaine",
    "G12: 1113548 Arridson; 1113552 Zithile",
    "G13: 1113534; 1113535",
    "G14: 1103564 Amy; 1113539 Iwa",
    "G15 (Color Cloud): 1113541 Luke; 1103561 Jakid",
    "G16: 1113521 Ian; 1113559 Sean; 1113560 Alan",
    "G17: 1113556 蔡宗修",
    "G18: 1103535 Aaron; 1111665 Suzu; 1113531 Bema",
    "G19: 1113517 Tina; 1113536 Ink",
    "G20: 1113506 Bert",
    "G21: 1113551",
    "G22: 1113532 Perizat; 1113527 Adina",
    "G23: 1113542 Ferran; 1113543 Nolan; 1113545 Travis"
  ];
  return { 
    id: `b2-g${i + 1}`, 
    name: definedGroups[i] || `Group ${i + 11}`, 
    status: 'pending' as const 
  };
});

const formatTimeShort = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function App() {
  // State: Management
  const [batch, setBatch] = useState<1 | 2>(1);
  const [groupsBatch1, setGroupsBatch1] = useState<Group[]>(INITIAL_GROUPS_BATCH_1);
  const [groupsBatch2, setGroupsBatch2] = useState<Group[]>(INITIAL_GROUPS_BATCH_2);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  
  // State: Timer
  const [seconds, setSeconds] = useState(0); // This controls phase logic (0-840)
  const [elapsedActiveTime, setElapsedActiveTime] = useState(0); // This tracks ACTUAL time spent
  const [isRunning, setIsRunning] = useState(false);
  const [formLink, setFormLink] = useState<string>('https://docs.google.com/forms/d/e/1FAIpQLScZULrqaMMA7-NTZG2CDOeDoSZ0K-nsCPzOtyEMI0o3g3-2_g/viewform?usp=dialog');
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

  // Helper to mark complete
  const markCurrentGroupComplete = useCallback(() => {
    if (!activeGroupId) return;

    setIsRunning(false);
    setGroups(prev => prev.map(g => {
      if (g.id === activeGroupId) {
        return { 
          ...g, 
          status: 'completed',
          totalSeconds: elapsedActiveTime 
        };
      }
      return g;
    }));
    playSound('finish');
  }, [activeGroupId, elapsedActiveTime, setGroups]);

  // Effects
  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1;
          
          // Sound Triggers
          if (next === 300) playSound('beep'); // 5m warning (Single Beep)
          if (next === 420) playSound('double-beep'); // 7m warning (Double Beep)
          
          // Phase transition sounds
          if (next === 480) playSound('alert'); // End Presentation (8m)
          if (next === 720) playSound('alert'); // End Q&A (12m)
          
          // Auto-finish at 840 (14m)
          if (next >= 840) {
            markCurrentGroupComplete();
            return 840;
          }
          
          return next;
        });

        // Track actual time separately (doesn't jump on skips)
        setElapsedActiveTime(prev => prev + 1);

      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, markCurrentGroupComplete]);

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
    // If selecting the already active group, just toggle
    if (activeGroupId === group.id) {
       return;
    }

    // If selecting a completed group, just show it (view only)
    if (group.status === 'completed') {
      setIsRunning(false);
      setActiveGroupId(group.id);
      setSeconds(840); // Show full circle
      // Logic to show their time could be added to display if needed, currently shown in list
      return;
    }

    // Set previous active group to 'pending' if it wasn't completed
    setGroups(prev => prev.map(g => {
        if (g.id === activeGroupId && g.status !== 'completed') {
             return { ...g, status: 'pending' };
        }
        if (g.id === group.id) {
            return { ...g, status: 'active' };
        }
        return g;
    }));

    // Start new session
    setActiveGroupId(group.id);
    setSeconds(0);
    setElapsedActiveTime(0);
    setIsRunning(false); // Let user hit start manually to prepare
  };
  
  const toggleTimer = () => {
    if (!activeGroupId && currentGroups.length > 0) {
      // Find first non-completed group
      const nextGroup = currentGroups.find(g => g.status !== 'completed');
      if (nextGroup) {
        handleStartGroup(nextGroup);
      }
      return;
    }
    
    // Check if current group is completed
    const currentGroup = currentGroups.find(g => g.id === activeGroupId);
    if (currentGroup?.status === 'completed') return;

    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (!activeGroupId) return;
    const currentGroup = currentGroups.find(g => g.id === activeGroupId);
    if (currentGroup?.status === 'completed') return; // Don't reset completed groups

    setIsRunning(false);
    setSeconds(0);
    setElapsedActiveTime(0);
  };

  const handleNextPhase = () => {
    if (currentPhase === TimerPhase.FINISHED) return;

    let nextSeconds = seconds;
    
    if (currentPhase === TimerPhase.PRESENTATION) {
      nextSeconds = 480; // Jump to start of Q&A (8:00)
      playSound('alert');
    } else if (currentPhase === TimerPhase.Q_AND_A) {
      nextSeconds = 720; // Jump to start of Assessment (12:00)
      playSound('alert');
    } else if (currentPhase === TimerPhase.ASSESSMENT) {
      // Finish early
      setSeconds(840);
      markCurrentGroupComplete();
      return; 
    }

    setSeconds(nextSeconds);
  };

  const handleNameEdit = (id: string, newName: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, name: newName } : g));
  };

  const isCurrentGroupCompleted = currentGroups.find(g => g.id === activeGroupId)?.status === 'completed';

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar: Group List */}
      <aside className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col shadow-xl z-10">
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Class Presentation
          </h1>
          <p className="text-xs text-slate-500 mt-1">43 Students • 24 Groups</p>
        </div>

        {/* Batch Toggle */}
        <div className="flex p-2 bg-slate-50 border-b border-slate-200">
          <button 
            onClick={() => { setBatch(1); setIsRunning(false); setActiveGroupId(null); setSeconds(0); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${batch === 1 ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Week 15
          </button>
          <button 
            onClick={() => { setBatch(2); setIsRunning(false); setActiveGroupId(null); setSeconds(0); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${batch === 2 ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            Week 16
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
                    ? 'bg-slate-50 border-slate-100' 
                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'}
              `}
              onClick={() => handleStartGroup(group)}
            >
              {/* Order Indicator */}
              <div className={`flex flex-col items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                 ${group.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}
              `}>
                {group.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <input 
                  value={group.name}
                  onChange={(e) => handleNameEdit(group.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={group.status === 'completed'}
                  className="bg-transparent font-medium text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-300 rounded px-1 -ml-1 w-full truncate disabled:text-slate-500"
                />
                <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] uppercase font-semibold ${group.status === 'completed' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {group.id === activeGroupId ? (isRunning ? 'Presenting' : 'Ready') : group.status}
                    </span>
                    {group.status === 'completed' && group.totalSeconds !== undefined && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeShort(group.totalSeconds)}
                        </span>
                    )}
                </div>
              </div>

              {/* Active Indicator */}
              {group.id === activeGroupId && <Circle className="w-4 h-4 text-indigo-500 fill-indigo-500 animate-pulse" />}

              {/* Reorder Buttons (Hover Only - disabled if running or completed) */}
              {group.status !== 'completed' && (
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
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content: Timer */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
        {/* Background Gradients based on phase */}
        <div className={`absolute inset-0 transition-colors duration-1000 opacity-30 pointer-events-none
          ${currentPhase === TimerPhase.PRESENTATION ? 'bg-gradient-to-br from-emerald-100 to-slate-100' : ''}
          ${currentPhase === TimerPhase.Q_AND_A ? 'bg-gradient-to-br from-amber-100 to-slate-100' : ''}
          ${currentPhase === TimerPhase.ASSESSMENT ? 'bg-gradient-to-br from-indigo-100 to-slate-100' : ''}
          ${currentPhase === TimerPhase.FINISHED ? 'bg-gradient-to-br from-rose-100 to-slate-100' : ''}
        `}></div>

        {/* Current Active Header */}
        <div className="relative z-10 pt-10 pb-2 text-center flex-shrink-0">
            {activeGroupId ? (
                <div>
                    <h2 className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-2">Current Group</h2>
                    <h1 className="text-3xl md:text-5xl font-bold text-slate-900 truncate px-8">
                        {currentGroups.find(g => g.id === activeGroupId)?.name}
                    </h1>
                </div>
            ) : (
                <div className="h-20 flex items-center justify-center">
                    <p className="text-slate-400 text-lg">Select a group to start</p>
                </div>
            )}
        </div>

        {/* Big Timer */}
        <div className="flex-1 flex items-center justify-center relative z-10 min-h-[250px] transition-all duration-500">
            <TimerDisplay 
                seconds={seconds} 
                totalDuration={840} 
                phase={currentPhase} 
                isRunning={isRunning}
            />
        </div>

        {/* Contextual Actions (Google Form & QR) */}
        <div className="flex-shrink-0 relative z-10 px-4 mb-4 flex justify-center">
            {(currentPhase === TimerPhase.ASSESSMENT || currentPhase === TimerPhase.FINISHED) && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-2xl">
                    {formLink ? (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-xl mx-auto">
                            {/* QR Code */}
                            <div className="bg-white p-2 rounded-xl shadow-sm flex-shrink-0">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(formLink)}`}
                                    alt="Scan to Assess"
                                    className="w-24 h-24 md:w-32 md:h-32 object-contain"
                                />
                            </div>
                            
                            {/* Text & Button */}
                            <div className="flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Peer Assessment</h3>
                                    <p className="text-slate-600 text-xs md:text-sm">Scan QR code or click button</p>
                                </div>
                                <a 
                                    href={formLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 font-medium text-sm"
                                >
                                    <span>Open Form</span>
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowSettings(true)}
                            className="w-full flex items-center justify-center gap-3 text-indigo-600 hover:text-indigo-800 bg-white/50 hover:bg-indigo-50 px-6 py-4 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 transition-all group"
                        >
                            <div className="p-2 bg-indigo-100 rounded-full group-hover:bg-indigo-200 transition-colors">
                                <QrCode className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold">Setup Peer Assessment Link</span>
                                <span className="block text-xs text-indigo-500">Add URL in settings to generate QR code automatically</span>
                            </div>
                        </button>
                    )}
                </div>
            )}
        </div>

        {/* Footer Controls */}
        <div className="relative z-20 bg-white border-t border-slate-200 p-4 md:p-6 flex items-center justify-center gap-4 md:gap-6 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] flex-shrink-0">
            <button 
                onClick={handleReset}
                disabled={isCurrentGroupCompleted}
                className="flex items-center gap-2 px-4 md:px-6 py-3 rounded-full font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 text-sm md:text-base"
            >
                <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden md:inline">Reset</span>
            </button>

            <button 
                onClick={toggleTimer}
                disabled={!activeGroupId || isCurrentGroupCompleted}
                className={`
                    flex items-center gap-3 px-8 md:px-10 py-3 md:py-4 rounded-full font-bold text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95
                    ${isRunning 
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                        : 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:transform-none'}
                `}
            >
                {isRunning ? (
                    <>
                        <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                        <span className="hidden md:inline">Pause</span>
                    </>
                ) : (
                    <>
                        <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                        <span>{seconds > 0 ? 'Resume' : 'Start'}</span>
                    </>
                )}
            </button>

            <button 
                onClick={handleNextPhase}
                disabled={!activeGroupId || currentPhase === TimerPhase.FINISHED || isCurrentGroupCompleted}
                className="flex items-center gap-2 px-4 md:px-6 py-3 rounded-full font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
                <span className="hidden md:inline">{currentPhase === TimerPhase.ASSESSMENT ? 'Finish' : 'Next Phase'}</span>
                <span className="md:hidden">{currentPhase === TimerPhase.ASSESSMENT ? 'Finish' : 'Next'}</span>
                <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
            </button>
        </div>
      </main>
    </div>
  );
}