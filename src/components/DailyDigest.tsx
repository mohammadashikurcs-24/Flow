import React, { useState } from 'react';
import { Task, Note, Priority, Notebook, TimeboxSlot } from '../types';
import { 
  Sun, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  ArrowUpRight, 
  Flag, 
  Sparkles, 
  AlertCircle, 
  FileText, 
  Plus, 
  ChevronRight,
  TrendingUp,
  FolderOpen
} from 'lucide-react';
import { playCheckTick, playCompletionChime } from '../utils/audio';

interface DailyDigestProps {
  tasks: Task[];
  notes: Note[];
  notebooks: Notebook[];
  onToggleTaskStatus: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  onUpdateTask: (taskId: string, patch: Partial<Task>) => void;
  onOpenNoteWithBlock: (noteId: string, blockId?: string) => void;
  onNavigateToTab?: (tab: 'kanban' | 'matrix' | 'timebox') => void;
}

export const DailyDigest: React.FC<DailyDigestProps> = ({
  tasks,
  notes,
  notebooks,
  onToggleTaskStatus,
  onAddTask,
  onUpdateTask,
  onOpenNoteWithBlock,
  onNavigateToTab,
}) => {
  const [newTodayTaskTitle, setNewTodayTaskTitle] = useState('');
  const [newTodayTaskPriority, setNewTodayTaskPriority] = useState<Priority>('high');
  const [newTodayTaskSlot, setNewTodayTaskSlot] = useState<TimeboxSlot>('morning');
  const [showAddForm, setShowAddForm] = useState(false);

  // Today's ISO date string (YYYY-MM-DD)
  const todayStr = new Date().toISOString().slice(0, 10);
  const formattedToday = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // 1. Identify tasks due today or scheduled in today's timebox
  const todayTasks = tasks.filter(
    (t) => t.dueDate === todayStr || (t.timeboxSlot && t.timeboxSlot !== 'none')
  );

  // If there are no tasks explicitly tagged today, fallback to pending high/medium priority tasks
  const effectiveTodayTasks = todayTasks.length > 0 
    ? todayTasks 
    : tasks.filter(t => t.status !== 'done' && (t.priority === 'high' || t.dueDate)).slice(0, 5);

  const completedTodayCount = effectiveTodayTasks.filter((t) => t.status === 'done').length;
  const totalTodayCount = effectiveTodayTasks.length;
  const completionRate = totalTodayCount === 0 ? 0 : Math.round((completedTodayCount / totalTodayCount) * 100);

  // Overdue tasks
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate && t.dueDate < todayStr
  );

  // Total planned focus minutes today
  const totalFocusMinutes = effectiveTodayTasks
    .filter((t) => t.status !== 'done')
    .reduce((acc, t) => acc + (t.timeEstimateMinutes || 45), 0);

  // 2. Identify recently active notes
  const recentNotes = [...notes]
    .filter((n) => !n.archived)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  const handleToggle = (task: Task) => {
    if (task.status !== 'done') {
      playCompletionChime();
    } else {
      playCheckTick();
    }
    onToggleTaskStatus(task.id);
  };

  const handleCreateTodayTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodayTaskTitle.trim()) return;

    onAddTask({
      title: newTodayTaskTitle.trim(),
      status: 'todo',
      priority: newTodayTaskPriority,
      dueDate: todayStr,
      timeboxSlot: newTodayTaskSlot,
      tags: ['today'],
    });

    setNewTodayTaskTitle('');
    setShowAddForm(false);
  };

  const priorityColors: Record<Priority, { label: string; bg: string; text: string }> = {
    high: { label: 'High Priority', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
    medium: { label: 'Medium', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
    low: { label: 'Low', bg: 'bg-neutral-100 border-neutral-200', text: 'text-neutral-600' },
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 select-none animate-in fade-in duration-200">
      {/* 1. HERO DIGEST BANNER */}
      <div className="relative overflow-hidden bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <Sun className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Daily Focus Digest
              </span>
              <span className="text-neutral-300">·</span>
              <span className="text-xs text-neutral-500 font-medium">{formattedToday}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-neutral-900">
              Today's Synthesis & Action Agenda
            </h2>
            <p className="mt-1 text-xs md:text-sm text-neutral-500 max-w-xl leading-relaxed">
              Consolidating priorities across your active folios into an executable schedule for today.
            </p>
          </div>

          {/* Quick Timebox & Board Callouts */}
          {onNavigateToTab && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigateToTab('timebox')}
                className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Open Day Timebox</span>
              </button>
              <button
                onClick={() => onNavigateToTab('kanban')}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>Action Board</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* METRIC STRIP */}
        <div className="mt-6 pt-6 border-t border-neutral-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Today's Actions
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
                {completedTodayCount}/{totalTodayCount}
              </span>
              <span className="text-[11px] text-neutral-400">completed</span>
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Planned Focus
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
                {Math.round(totalFocusMinutes / 60 * 10) / 10}h
              </span>
              <span className="text-[11px] text-neutral-400">estimated</span>
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Execution Velocity
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
                {completionRate}%
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Active Folios
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
                {recentNotes.length}
              </span>
              <span className="text-[11px] text-neutral-400">in flight</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. OVERDUE ALERT BANNER (If any) */}
      {overdueTasks.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-rose-900">
                {overdueTasks.length} Overdue Action{overdueTasks.length > 1 ? 's' : ''} Require Attention
              </h4>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Past deadlines anchored in your folios. Check off or reschedule to maintain momentum.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {overdueTasks.slice(0, 2).map((t) => (
              <button
                key={t.id}
                onClick={() => onUpdateTask(t.id, { dueDate: todayStr })}
                className="px-2 py-1 bg-white hover:bg-rose-100 border border-rose-300 text-rose-800 text-[10px] font-semibold rounded-md transition-colors cursor-pointer"
              >
                Reschedule to Today
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. TWO-COLUMN SPLIT: TASKS DUE TODAY & RECENTLY ACTIVE NOTES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (7 Cols): Today's Tasks Docket */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                Action Items for Today ({effectiveTodayTasks.length})
              </h3>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 text-xs font-semibold text-neutral-700 hover:text-neutral-900 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add for Today</span>
            </button>
          </div>

          {/* Quick Add Form for Today */}
          {showAddForm && (
            <form onSubmit={handleCreateTodayTask} className="p-4 bg-white border border-amber-300 rounded-xl shadow-xs space-y-3">
              <input
                type="text"
                autoFocus
                value={newTodayTaskTitle}
                onChange={(e) => setNewTodayTaskTitle(e.target.value)}
                placeholder="What must get done today?"
                className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-500"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <select
                    value={newTodayTaskPriority}
                    onChange={(e) => setNewTodayTaskPriority(e.target.value as Priority)}
                    className="text-[11px] px-2 py-1 bg-neutral-100 border border-neutral-200 rounded-md"
                  >
                    <option value="high">P1 High</option>
                    <option value="medium">P2 Medium</option>
                    <option value="low">P3 Low</option>
                  </select>
                  <select
                    value={newTodayTaskSlot}
                    onChange={(e) => setNewTodayTaskSlot(e.target.value as TimeboxSlot)}
                    className="text-[11px] px-2 py-1 bg-neutral-100 border border-neutral-200 rounded-md"
                  >
                    <option value="morning">Morning Block</option>
                    <option value="afternoon">Afternoon Block</option>
                    <option value="evening">Evening Block</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-2.5 py-1 text-xs text-neutral-500 hover:bg-neutral-100 rounded-md cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tasks List */}
          <div className="space-y-2.5">
            {effectiveTodayTasks.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-neutral-200">
                <p className="text-xs text-neutral-500 font-medium">All clear for today!</p>
                <p className="text-[11px] text-neutral-400 mt-1">
                  No tasks are pending today. Schedule an action from your folios or add one above.
                </p>
              </div>
            ) : (
              effectiveTodayTasks.map((task) => {
                const isDone = task.status === 'done';
                const pConfig = priorityColors[task.priority];

                return (
                  <div
                    key={task.id}
                    className={`group p-3.5 bg-white rounded-xl border transition-all ${
                      isDone
                        ? 'border-neutral-200 bg-neutral-50/60 opacity-70'
                        : 'border-neutral-200 hover:border-neutral-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggle(task)}
                        className="mt-0.5 text-neutral-400 hover:text-amber-600 transition-colors cursor-pointer shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium leading-snug ${isDone ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                          {task.title}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded border font-semibold ${pConfig.bg} ${pConfig.text}`}>
                            {pConfig.label}
                          </span>

                          {task.timeboxSlot && task.timeboxSlot !== 'none' && (
                            <span className="text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                              {task.timeboxSlot.charAt(0).toUpperCase() + task.timeboxSlot.slice(1)} Slot
                            </span>
                          )}

                          <span className="text-neutral-400 font-mono">
                            {task.timeEstimateMinutes || 45} mins
                          </span>
                        </div>

                        {/* Origin Folio Link */}
                        {task.noteId && (
                          <div className="mt-2 pt-1.5 border-t border-neutral-100">
                            <button
                              onClick={() => onOpenNoteWithBlock(task.noteId!, task.blockId)}
                              className="group/link inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 font-medium cursor-pointer truncate max-w-full"
                              title="Jump to note source"
                            >
                              <span className="truncate">Folio: {task.noteTitle || 'View Folio'}</span>
                              <ArrowUpRight className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform shrink-0" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): Recently Active Notes */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-neutral-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                Recently Active Folios
              </h3>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              Sorted by edits
            </span>
          </div>

          <div className="space-y-3">
            {recentNotes.map((note) => {
              const folder = notebooks.find((nb) => nb.id === note.folderId);
              const noteTasks = tasks.filter((t) => t.noteId === note.id);
              const doneCount = noteTasks.filter((t) => t.status === 'done').length;
              const pendingCount = noteTasks.length - doneCount;

              return (
                <div
                  key={note.id}
                  onClick={() => onOpenNoteWithBlock(note.id)}
                  className="p-4 bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 shadow-xs hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-neutral-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                      {note.title || 'Untitled Folio'}
                    </h4>
                    <span 
                      className="text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded border border-neutral-200/60"
                      style={{ color: folder?.color }}
                    >
                      {folder?.name}
                    </span>
                  </div>

                  {/* Excerpt preview */}
                  {note.blocks[0] && (
                    <p className="mt-1.5 text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                      {note.blocks[0].content}
                    </p>
                  )}

                  {/* Metadata and Quick Jump */}
                  <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-neutral-400 font-mono text-[10px]">
                      <span>
                        {new Date(note.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span>·</span>
                      <span className={pendingCount > 0 ? 'text-amber-700 font-semibold' : 'text-neutral-400'}>
                        {pendingCount} open action{pendingCount === 1 ? '' : 's'}
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-neutral-700 group-hover:text-amber-700 flex items-center gap-0.5">
                      <span>Open</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
