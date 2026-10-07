import React, { useState, useEffect } from 'react';
import { Task, Note, Priority, TaskStatus, TimeboxSlot, Notebook } from '../types';
import { 
  Sun,
  Kanban, 
  Grid2X2, 
  CalendarClock, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Plus, 
  ArrowUpRight, 
  Flag, 
  Sunset, 
  Moon, 
  Filter,
  Check
} from 'lucide-react';
import { playCheckTick, playCompletionChime } from '../utils/audio';
import { DailyDigest } from './DailyDigest';

interface GlobalTaskConsoleProps {
  initialSubTab?: 'digest' | 'kanban' | 'matrix' | 'timebox';
  tasks: Task[];
  notes: Note[];
  notebooks: Notebook[];
  onToggleTaskStatus: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  onUpdateTask: (taskId: string, patch: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenNoteWithBlock: (noteId: string, blockId?: string) => void;
}

export const GlobalTaskConsole: React.FC<GlobalTaskConsoleProps> = ({
  initialSubTab = 'digest',
  tasks,
  notes,
  notebooks,
  onToggleTaskStatus,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onOpenNoteWithBlock,
}) => {
  const [activeTab, setActiveTab] = useState<'digest' | 'kanban' | 'matrix' | 'timebox'>(initialSubTab);

  useEffect(() => {
    setActiveTab(initialSubTab);
  }, [initialSubTab]);
  const [searchFilter, setSearchFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [selectedNoteFilter, setSelectedNoteFilter] = useState<string | 'all'>('all');
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddPriority, setQuickAddPriority] = useState<Priority>('medium');
  const [quickAddNoteId, setQuickAddNoteId] = useState<string>('none');

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (searchFilter && !t.title.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (selectedNoteFilter !== 'all') {
      if (selectedNoteFilter === 'standalone' && t.noteId) return false;
      if (selectedNoteFilter !== 'standalone' && t.noteId !== selectedNoteFilter) return false;
    }
    return true;
  });

  const handleToggle = (task: Task) => {
    if (task.status !== 'done') {
      playCompletionChime();
    } else {
      playCheckTick();
    }
    onToggleTaskStatus(task.id);
  };

  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTitle.trim()) return;

    const chosenNote = notes.find((n) => n.id === quickAddNoteId);

    onAddTask({
      title: quickAddTitle.trim(),
      noteId: quickAddNoteId === 'none' ? undefined : quickAddNoteId,
      noteTitle: chosenNote ? chosenNote.title : undefined,
      status: 'todo',
      priority: quickAddPriority,
      timeboxSlot: 'none',
      tags: [],
    });

    setQuickAddTitle('');
  };

  const priorityStyles: Record<Priority, { label: string; bg: string; text: string; border: string }> = {
    high: { label: 'High', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    medium: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    low: { label: 'Low', bg: 'bg-neutral-100', text: 'text-neutral-600', border: 'border-neutral-200' },
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50 overflow-hidden select-none">
      {/* Top Filter & View Selector Bar */}
      <div className="bg-white border-b border-neutral-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-lg">
          <button
            onClick={() => setActiveTab('digest')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'digest' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-600" />
            <span>Daily Digest</span>
          </button>
          <button
            onClick={() => setActiveTab('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'kanban' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Action Board</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'matrix' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Grid2X2 className="w-3.5 h-3.5" />
            <span>Priority Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('timebox')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'timebox' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Day Timebox</span>
          </button>
        </div>

        {/* Global Task Search and Filters (shown for kanban, matrix, timebox) */}
        {activeTab !== 'digest' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Note filter dropdown */}
            <select
              value={selectedNoteFilter}
              onChange={(e) => setSelectedNoteFilter(e.target.value)}
              className="text-xs bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Folios</option>
              <option value="standalone">Standalone only</option>
              {notes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title || 'Untitled'}
                </option>
              ))}
            </select>

            {/* Priority filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
              className="text-xs bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="high">High (P1)</option>
              <option value="medium">Medium (P2)</option>
              <option value="low">Low (P3)</option>
            </select>

            {/* Search input */}
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter tasks..."
              className="text-xs bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-700 focus:outline-none w-36"
            />
          </div>
        )}
      </div>

      {/* Main Tab View Canvas */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 0: DAILY DIGEST */}
        {activeTab === 'digest' && (
          <DailyDigest
            tasks={tasks}
            notes={notes}
            notebooks={notebooks}
            onToggleTaskStatus={onToggleTaskStatus}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onOpenNoteWithBlock={onOpenNoteWithBlock}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* Quick Add Bar (for board, matrix, timebox) */}
        {activeTab !== 'digest' && (
          <form onSubmit={handleCreateQuickTask} className="mb-6 flex flex-wrap items-center gap-2 max-w-4xl">
            <input
              type="text"
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              placeholder="+ Quick capture actionable task..."
              className="flex-1 min-w-[260px] text-xs px-3.5 py-2 bg-white border border-neutral-300 rounded-lg shadow-xs focus:outline-none focus:border-neutral-500"
            />
            <select
              value={quickAddPriority}
              onChange={(e) => setQuickAddPriority(e.target.value as Priority)}
              className="text-xs px-2.5 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 focus:outline-none cursor-pointer"
            >
              <option value="high">High (P1)</option>
              <option value="medium">Medium (P2)</option>
              <option value="low">Low (P3)</option>
            </select>
            <select
              value={quickAddNoteId}
              onChange={(e) => setQuickAddNoteId(e.target.value)}
              className="text-xs px-2.5 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 focus:outline-none max-w-[180px] truncate cursor-pointer"
            >
              <option value="none">Standalone (No Note)</option>
              {notes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title || 'Untitled'}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Capture
            </button>
          </form>
        )}

        {/* TAB 1: KANBAN BOARD */}
        {activeTab === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl">
            {(
              [
                { id: 'todo', title: 'To Do', count: filteredTasks.filter((t) => t.status === 'todo').length },
                { id: 'in_progress', title: 'In Flight', count: filteredTasks.filter((t) => t.status === 'in_progress').length },
                { id: 'done', title: 'Completed', count: filteredTasks.filter((t) => t.status === 'done').length },
              ] as const
            ).map((column) => {
              const columnTasks = filteredTasks.filter((t) => t.status === column.id);

              return (
                <div key={column.id} className="bg-neutral-100/70 border border-neutral-200/80 rounded-xl p-3 flex flex-col">
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-neutral-200/80">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                      {column.title}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-neutral-400 bg-white px-2 py-0.5 rounded-full border border-neutral-200">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2.5 flex-1 min-h-[280px]">
                    {columnTasks.length === 0 ? (
                      <div className="h-28 flex items-center justify-center text-xs text-neutral-400 border border-dashed border-neutral-200 rounded-lg">
                        Empty column
                      </div>
                    ) : (
                      columnTasks.map((task) => {
                        const isDone = task.status === 'done';
                        const pStyle = priorityStyles[task.priority];

                        return (
                          <div
                            key={task.id}
                            className={`p-3.5 bg-white rounded-lg border border-neutral-200 shadow-xs hover:border-neutral-300 transition-all ${
                              isDone ? 'opacity-70 bg-neutral-50/70' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
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

                                {/* Priority and Due Date */}
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}>
                                    {pStyle.label}
                                  </span>

                                  {task.dueDate && (
                                    <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                                      <Calendar className="w-2.5 h-2.5 opacity-60" />
                                      {task.dueDate}
                                    </span>
                                  )}
                                </div>

                                {/* Bi-directional Deep Link to Origin Note */}
                                {task.noteId && (
                                  <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between">
                                    <button
                                      onClick={() => onOpenNoteWithBlock(task.noteId!, task.blockId)}
                                      className="group/link flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 font-medium truncate cursor-pointer"
                                      title="Open originating folio"
                                    >
                                      <span className="truncate">Folio: {task.noteTitle || 'View Note'}</span>
                                      <ArrowUpRight className="w-3 h-3 shrink-0 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Column mover buttons */}
                            <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-neutral-400">
                              {column.id !== 'todo' && (
                                <button
                                  onClick={() => onUpdateTask(task.id, { status: 'todo' })}
                                  className="px-1.5 py-0.5 hover:bg-neutral-100 rounded text-neutral-600 cursor-pointer"
                                >
                                  ← To Do
                                </button>
                              )}
                              {column.id !== 'in_progress' && (
                                <button
                                  onClick={() => onUpdateTask(task.id, { status: 'in_progress' })}
                                  className="px-1.5 py-0.5 hover:bg-neutral-100 rounded text-neutral-600 cursor-pointer"
                                >
                                  • In Flight
                                </button>
                              )}
                              {column.id !== 'done' && (
                                <button
                                  onClick={() => onUpdateTask(task.id, { status: 'done' })}
                                  className="px-1.5 py-0.5 hover:bg-neutral-100 rounded text-neutral-600 cursor-pointer"
                                >
                                  ✓ Done →
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: PRIORITY MATRIX (EISENHOWER) */}
        {activeTab === 'matrix' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl">
            {/* Quadrant 1: Urgent & High (Do First) */}
            <div className="p-4 bg-white border-2 border-rose-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-rose-100">
                <div>
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                    Q1: Critical & High Priority
                  </h4>
                  <p className="text-[11px] text-neutral-500">Do first · Immediate leverage</p>
                </div>
                <span className="text-xs font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                  {filteredTasks.filter((t) => t.priority === 'high' && t.status !== 'done').length}
                </span>
              </div>
              <div className="space-y-2">
                {filteredTasks
                  .filter((t) => t.priority === 'high' && t.status !== 'done')
                  .map((task) => (
                    <div key={task.id} className="p-2.5 bg-rose-50/40 border border-rose-100 rounded-lg flex items-start gap-2">
                      <button onClick={() => handleToggle(task)} className="mt-0.5 cursor-pointer text-neutral-400 hover:text-emerald-600">
                        <Circle className="w-4 h-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-neutral-900">{task.title}</p>
                        {task.noteId && (
                          <button
                            onClick={() => onOpenNoteWithBlock(task.noteId!, task.blockId)}
                            className="text-[10px] text-amber-700 hover:underline mt-1 block truncate cursor-pointer"
                          >
                            In: {task.noteTitle || 'Folio'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quadrant 2: High/Medium Strategic (Schedule) */}
            <div className="p-4 bg-white border-2 border-amber-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-amber-100">
                <div>
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Q2: Strategic & Planning
                  </h4>
                  <p className="text-[11px] text-neutral-500">Medium Priority · Deep focus</p>
                </div>
                <span className="text-xs font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  {filteredTasks.filter((t) => t.priority === 'medium' && t.status !== 'done').length}
                </span>
              </div>
              <div className="space-y-2">
                {filteredTasks
                  .filter((t) => t.priority === 'medium' && t.status !== 'done')
                  .map((task) => (
                    <div key={task.id} className="p-2.5 bg-amber-50/40 border border-amber-100 rounded-lg flex items-start gap-2">
                      <button onClick={() => handleToggle(task)} className="mt-0.5 cursor-pointer text-neutral-400 hover:text-emerald-600">
                        <Circle className="w-4 h-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-neutral-900">{task.title}</p>
                        {task.noteId && (
                          <button
                            onClick={() => onOpenNoteWithBlock(task.noteId!, task.blockId)}
                            className="text-[10px] text-amber-700 hover:underline mt-1 block truncate cursor-pointer"
                          >
                            In: {task.noteTitle || 'Folio'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quadrant 3: Low Priority / Quick Wins */}
            <div className="p-4 bg-white border-2 border-neutral-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-100">
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Q3: Quick Batches & Wins
                  </h4>
                  <p className="text-[11px] text-neutral-500">Low Priority · 10-15 minute tasks</p>
                </div>
                <span className="text-xs font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                  {filteredTasks.filter((t) => t.priority === 'low' && t.status !== 'done').length}
                </span>
              </div>
              <div className="space-y-2">
                {filteredTasks
                  .filter((t) => t.priority === 'low' && t.status !== 'done')
                  .map((task) => (
                    <div key={task.id} className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg flex items-start gap-2">
                      <button onClick={() => handleToggle(task)} className="mt-0.5 cursor-pointer text-neutral-400 hover:text-emerald-600">
                        <Circle className="w-4 h-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-neutral-800">{task.title}</p>
                        {task.noteId && (
                          <button
                            onClick={() => onOpenNoteWithBlock(task.noteId!, task.blockId)}
                            className="text-[10px] text-neutral-500 hover:underline mt-1 block truncate cursor-pointer"
                          >
                            In: {task.noteTitle || 'Folio'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quadrant 4: Completed Log */}
            <div className="p-4 bg-white border-2 border-emerald-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-emerald-100">
                <div>
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Accomplished Archive
                  </h4>
                  <p className="text-[11px] text-neutral-500">Verified actions finished</p>
                </div>
                <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {filteredTasks.filter((t) => t.status === 'done').length}
                </span>
              </div>
              <div className="space-y-2">
                {filteredTasks
                  .filter((t) => t.status === 'done')
                  .slice(0, 8)
                  .map((task) => (
                    <div key={task.id} className="p-2 bg-emerald-50/40 border border-emerald-100 rounded-lg flex items-start gap-2 opacity-80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <p className="text-xs line-through text-neutral-400 truncate">{task.title}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DAY TIMEBOX */}
        {activeTab === 'timebox' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl">
            {/* Morning Slot */}
            <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-200">
                <div className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-neutral-800">Morning (08:00 - 12:00)</span>
                </div>
                <span className="text-xs font-mono text-neutral-400">
                  {filteredTasks.filter((t) => t.timeboxSlot === 'morning').length}
                </span>
              </div>
              <div className="space-y-2">
                {filteredTasks
                  .filter((t) => t.timeboxSlot === 'morning')
                  .map((task) => (
                    <div key={task.id} className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
                      <p className="font-medium text-neutral-900">{task.title}</p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
                        <span>{task.timeEstimateMinutes || 45}m</span>
                        <button
                          onClick={() => onUpdateTask(task.id, { timeboxSlot: 'none' })}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          Unassign
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Afternoon Slot */}
            <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-200">
                <div className="flex items-center gap-1.5">
                  <Sunset className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold text-neutral-800">Afternoon (12:00 - 17:00)</span>
                </div>
                <span className="text-xs font-mono text-neutral-400">
                  {filteredTasks.filter((t) => t.timeboxSlot === 'afternoon').length}
                </span>
              </div>
              <div className="space-y-2">
                {filteredTasks
                  .filter((t) => t.timeboxSlot === 'afternoon')
                  .map((task) => (
                    <div key={task.id} className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
                      <p className="font-medium text-neutral-900">{task.title}</p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
                        <span>{task.timeEstimateMinutes || 45}m</span>
                        <button
                          onClick={() => onUpdateTask(task.id, { timeboxSlot: 'none' })}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          Unassign
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Evening Slot */}
            <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-200">
                <div className="flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-neutral-800">Evening (17:00 - 21:00)</span>
                </div>
                <span className="text-xs font-mono text-neutral-400">
                  {filteredTasks.filter((t) => t.timeboxSlot === 'evening').length}
                </span>
              </div>
              <div className="space-y-2">
                {filteredTasks
                  .filter((t) => t.timeboxSlot === 'evening')
                  .map((task) => (
                    <div key={task.id} className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
                      <p className="font-medium text-neutral-900">{task.title}</p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
                        <span>{task.timeEstimateMinutes || 30}m</span>
                        <button
                          onClick={() => onUpdateTask(task.id, { timeboxSlot: 'none' })}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          Unassign
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Unassigned Pool */}
            <div className="p-4 bg-neutral-100/70 border border-neutral-200 rounded-xl">
              <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider block mb-3">
                Unscheduled Queue ({filteredTasks.filter((t) => t.timeboxSlot === 'none' && t.status !== 'done').length})
              </span>
              <div className="space-y-2">
                {filteredTasks
                  .filter((t) => t.timeboxSlot === 'none' && t.status !== 'done')
                  .map((task) => (
                    <div key={task.id} className="p-2.5 bg-white rounded-lg border border-neutral-200 text-xs shadow-xs">
                      <p className="font-medium text-neutral-900 line-clamp-2">{task.title}</p>
                      <div className="mt-2 flex items-center justify-between gap-1 pt-1 border-t border-neutral-100">
                        <span className="text-[10px] text-neutral-400">Slot into:</span>
                        <div className="flex gap-1 text-[10px]">
                          <button
                            onClick={() => onUpdateTask(task.id, { timeboxSlot: 'morning' })}
                            className="px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded cursor-pointer"
                          >
                            Morn
                          </button>
                          <button
                            onClick={() => onUpdateTask(task.id, { timeboxSlot: 'afternoon' })}
                            className="px-1.5 py-0.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded cursor-pointer"
                          >
                            Aft
                          </button>
                          <button
                            onClick={() => onUpdateTask(task.id, { timeboxSlot: 'evening' })}
                            className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded cursor-pointer"
                          >
                            Eve
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
