import React, { useState } from 'react';
import { Task, Priority, TimeboxSlot } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  Target, 
  Flag, 
  Sun, 
  Sunset, 
  Moon,
  Sparkles
} from 'lucide-react';
import { playCheckTick, playCompletionChime } from '../utils/audio';

interface MarginActionLedgerProps {
  noteId: string;
  noteTitle: string;
  tasks: Task[];
  onToggleTaskStatus: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (taskId: string, patch: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onScrollToBlock?: (blockId: string) => void;
}

export const MarginActionLedger: React.FC<MarginActionLedgerProps> = ({
  noteId,
  tasks,
  onToggleTaskStatus,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onScrollToBlock,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'done'>('all');
  const [isAdding, setIsAdding] = useState(false);

  // Filter tasks belonging to THIS note
  const noteTasks = tasks.filter((t) => t.noteId === noteId);
  const doneCount = noteTasks.filter((t) => t.status === 'done').length;
  const totalCount = noteTasks.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const displayedTasks = noteTasks.filter((t) => {
    if (filterMode === 'pending') return t.status !== 'done';
    if (filterMode === 'done') return t.status === 'done';
    return true;
  });

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle.trim(),
      noteId,
      status: 'todo',
      priority: newPriority,
      dueDate: newDueDate || undefined,
      timeboxSlot: 'none',
      tags: [],
    });

    setNewTitle('');
    setNewDueDate('');
    setIsAdding(false);
  };

  const handleToggle = (task: Task) => {
    const isNowDone = task.status !== 'done';
    if (isNowDone) {
      if (doneCount + 1 === totalCount && totalCount > 1) {
        playCompletionChime();
      } else {
        playCheckTick();
      }
    } else {
      playCheckTick();
    }
    onToggleTaskStatus(task.id);
  };

  const priorityColors: Record<Priority, { label: string; bg: string; text: string }> = {
    high: { label: 'P1 High', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
    medium: { label: 'P2 Med', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
    low: { label: 'P3 Low', bg: 'bg-neutral-100 border-neutral-200', text: 'text-neutral-600' },
  };

  const timeboxIcons: Record<TimeboxSlot, { icon: React.ReactNode; label: string }> = {
    morning: { icon: <Sun className="w-3 h-3 text-amber-500" />, label: 'Morning' },
    afternoon: { icon: <Sunset className="w-3 h-3 text-orange-500" />, label: 'Afternoon' },
    evening: { icon: <Moon className="w-3 h-3 text-indigo-500" />, label: 'Evening' },
    none: { icon: null, label: 'Unscheduled' },
  };

  return (
    <aside className="w-80 md:w-96 bg-neutral-50/70 border-l border-neutral-200 flex flex-col h-full shrink-0 select-none">
      {/* Header with Title & Action Stats */}
      <div className="p-4 border-b border-neutral-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Live Action Ledger
            </h3>
          </div>
          <span className="text-xs font-mono tabular-nums text-neutral-500">
            {doneCount}/{totalCount} done
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="bg-amber-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg text-xs">
          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 py-1 rounded-md font-medium text-center transition-colors cursor-pointer ${
              filterMode === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilterMode('pending')}
            className={`flex-1 py-1 rounded-md font-medium text-center transition-colors cursor-pointer ${
              filterMode === 'pending' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Pending ({totalCount - doneCount})
          </button>
          <button
            onClick={() => setFilterMode('done')}
            className={`flex-1 py-1 rounded-md font-medium text-center transition-colors cursor-pointer ${
              filterMode === 'done' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Done ({doneCount})
          </button>
        </div>
      </div>

      {/* Task Cards Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {displayedTasks.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-xs text-neutral-400">
              {filterMode === 'done'
                ? 'No completed tasks in this folio yet.'
                : 'No pending action items in this note.'}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Highlight text in the editor or click below to anchor an action item.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Action</span>
            </button>
          </div>
        ) : (
          displayedTasks.map((task) => {
            const isDone = task.status === 'done';
            const priorityConfig = priorityColors[task.priority];

            return (
              <div
                key={task.id}
                className={`group relative p-3 rounded-xl border bg-white transition-all ${
                  isDone
                    ? 'border-neutral-200/60 bg-neutral-50/50 opacity-75'
                    : 'border-neutral-200 shadow-xs hover:border-neutral-300'
                }`}
              >
                {/* Title & Checkbox */}
                <div className="flex items-start gap-2.5">
                  <button
                    onClick={() => handleToggle(task)}
                    className="mt-0.5 text-neutral-400 hover:text-amber-600 cursor-pointer shrink-0 transition-colors"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-4 h-4 hover:fill-amber-50" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-medium leading-snug transition-all ${
                        isDone ? 'line-through text-neutral-400' : 'text-neutral-900'
                      }`}
                    >
                      {task.title}
                    </p>

                    {/* Metadata indicators */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {/* Priority selector */}
                      <button
                        onClick={() => {
                          const cycle: Priority[] = ['low', 'medium', 'high'];
                          const next = cycle[(cycle.indexOf(task.priority) + 1) % 3];
                          onUpdateTask(task.id, { priority: next });
                        }}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold cursor-pointer ${priorityConfig.bg} ${priorityConfig.text}`}
                        title="Click to cycle priority"
                      >
                        <Flag className="w-2.5 h-2.5" />
                        <span>{priorityConfig.label}</span>
                      </button>

                      {/* Due date picker / display */}
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-neutral-200 text-neutral-500 text-[10px] bg-neutral-50">
                        <Calendar className="w-2.5 h-2.5 opacity-60" />
                        <input
                          type="date"
                          value={task.dueDate || ''}
                          onChange={(e) => onUpdateTask(task.id, { dueDate: e.target.value || undefined })}
                          className="bg-transparent border-none text-[10px] focus:outline-none cursor-pointer"
                        />
                      </div>

                      {/* Timebox slot */}
                      <button
                        onClick={() => {
                          const slots: TimeboxSlot[] = ['none', 'morning', 'afternoon', 'evening'];
                          const next = slots[(slots.indexOf(task.timeboxSlot) + 1) % slots.length];
                          onUpdateTask(task.id, { timeboxSlot: next });
                        }}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-neutral-200 text-neutral-600 text-[10px] bg-neutral-50 cursor-pointer hover:bg-neutral-100"
                        title="Assign to timebox slot"
                      >
                        {timeboxIcons[task.timeboxSlot].icon || <Clock className="w-2.5 h-2.5 text-neutral-400" />}
                        <span>{timeboxIcons[task.timeboxSlot].label}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                  {/* Origin Block Link */}
                  {task.blockId ? (
                    <button
                      onClick={() => onScrollToBlock && onScrollToBlock(task.blockId!)}
                      className="inline-flex items-center gap-1 text-[10px] text-amber-700 hover:text-amber-900 font-medium cursor-pointer"
                      title="Jump to originating paragraph in folio"
                    >
                      <Target className="w-3 h-3" />
                      <span>Jump to source block</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-neutral-400">Anchored to folio</span>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-600 transition-opacity cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Quick Add Form */}
        {isAdding ? (
          <form onSubmit={handleQuickAdd} className="p-3 bg-white border border-neutral-300 rounded-xl shadow-xs space-y-2.5">
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full text-xs px-2.5 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-xs">
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Priority)}
                  className="text-[11px] px-2 py-1 bg-neutral-100 border border-neutral-200 rounded-md focus:outline-none"
                >
                  <option value="high">P1 High</option>
                  <option value="medium">P2 Medium</option>
                  <option value="low">P3 Low</option>
                </select>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="text-[11px] px-2 py-1 bg-neutral-100 border border-neutral-200 rounded-md focus:outline-none"
                />
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-2 py-1 text-[11px] text-neutral-600 hover:bg-neutral-100 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 text-[11px] font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 px-3 border border-dashed border-neutral-300 hover:border-neutral-400 bg-white/50 hover:bg-white rounded-xl text-xs text-neutral-600 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-neutral-500" />
            <span>Add contextual action</span>
          </button>
        )}
      </div>
    </aside>
  );
};
