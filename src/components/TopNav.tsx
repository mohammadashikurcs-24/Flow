import React from 'react';
import { ViewMode } from '../types';
import { 
  Columns2, 
  FileText, 
  Sun,
  Kanban, 
  Grid2X2, 
  CalendarClock, 
  Network, 
  Plus, 
  Zap, 
  Maximize2,
  Volume2,
  VolumeX,
  Download
} from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '../utils/audio';

interface TopNavProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenQuickCapture: () => void;
  onToggleFocusMode: () => void;
  onNewNote: () => void;
  onOpenExport: () => void;
  onOpenInstallApp: () => void;
  activeNoteTitle?: string;
  totalPendingTasks: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentView,
  onSelectView,
  onOpenQuickCapture,
  onToggleFocusMode,
  onNewNote,
  onOpenExport,
  onOpenInstallApp,
  totalPendingTasks,
}) => {
  const [soundOn, setSoundOn] = React.useState(isSoundEnabled());

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
  };

  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'split', label: 'Dual Stream', icon: <Columns2 className="w-4 h-4" /> },
    { id: 'editor-only', label: 'Notes Canvas', icon: <FileText className="w-4 h-4" /> },
    { id: 'tasks-digest', label: 'Daily Digest', icon: <Sun className="w-4 h-4 text-amber-600" /> },
    { id: 'tasks-kanban', label: 'Action Board', icon: <Kanban className="w-4 h-4" /> },
    { id: 'tasks-matrix', label: 'Priority Matrix', icon: <Grid2X2 className="w-4 h-4" /> },
    { id: 'tasks-timebox', label: 'Day Timebox', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'graph', label: 'Thought Nexus', icon: <Network className="w-4 h-4" /> },
  ];

  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-neutral-200 select-none sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => onSelectView('split')}
          className="text-left group cursor-pointer focus:outline-none"
        >
          <span className="text-xl font-bold tracking-tight text-neutral-900 group-hover:text-amber-700 transition-colors">
            Folio & Flow
          </span>
        </button>
        <span className="hidden sm:inline text-xs text-neutral-400 font-mono tabular-nums">
          {totalPendingTasks} open action{totalPendingTasks === 1 ? '' : 's'}
        </span>
      </div>

      {/* Zone 2: Navigation Links (Clean text buttons, single line) */}
      <nav className="hidden lg:flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200/80">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2">
        {/* Sound toggle button */}
        <button
          onClick={handleToggleSound}
          title={soundOn ? 'Mute audio feedback' : 'Enable audio feedback'}
          className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
        >
          {soundOn ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Export / Backup */}
        <button
          onClick={onOpenExport}
          title="Export notes & tasks"
          className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Install / Download App PWA */}
        <button
          onClick={onOpenInstallApp}
          title="Install or download Folio & Flow app"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-amber-700" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {/* Quick Capture Cmd+K */}
        <button
          onClick={onOpenQuickCapture}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden md:inline">Capture</span>
          <kbd className="hidden sm:inline text-[10px] bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </button>

        {/* Deep Focus Mode */}
        <button
          onClick={onToggleFocusMode}
          title="Distraction-Free Focus Mode"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Focus</span>
        </button>

        {/* Primary Action: New Note */}
        <button
          onClick={onNewNote}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>New Folio</span>
        </button>
      </div>
    </header>
  );
};
