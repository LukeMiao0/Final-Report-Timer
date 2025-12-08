export interface Group {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed';
  note?: string;
  totalSeconds?: number;
}

export enum TimerPhase {
  PRESENTATION = 'PRESENTATION',
  Q_AND_A = 'Q_AND_A',
  ASSESSMENT = 'ASSESSMENT',
  FINISHED = 'FINISHED'
}

export const PHASE_CONFIG = {
  [TimerPhase.PRESENTATION]: {
    label: 'Oral Presentation',
    duration: 480, // 8 minutes (in seconds)
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    barColor: 'bg-emerald-500',
    message: 'Presenting Topic (Beeps at 5m & 7m)'
  },
  [TimerPhase.Q_AND_A]: {
    label: 'Q&A Session',
    duration: 240, // 4 minutes (starts at 08:00 ends at 12:00)
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    barColor: 'bg-amber-500',
    message: 'Questions & Answers'
  },
  [TimerPhase.ASSESSMENT]: {
    label: 'Peer Assessment',
    duration: 120, // 2 minutes (starts at 12:00 ends at 14:00)
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    barColor: 'bg-indigo-500',
    message: 'Fill out Google Form'
  },
  [TimerPhase.FINISHED]: {
    label: 'Time Up',
    duration: 0,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    barColor: 'bg-rose-500',
    message: 'Group Completed'
  }
};