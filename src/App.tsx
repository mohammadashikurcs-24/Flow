import React, { useState, useEffect } from 'react';
import { 
  Note, 
  Task, 
  Notebook, 
  ViewMode 
} from './types';
import { 
  loadNotes, 
  saveNotes, 
  loadTasks, 
  saveTasks, 
  loadNotebooks, 
  saveNotebooks,
  INITIAL_NOTES,
  INITIAL_TASKS,
  INITIAL_NOTEBOOKS
} from './utils/storage';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { NoteEditor } from './components/NoteEditor';
import { MarginActionLedger } from './components/MarginActionLedger';
import { GlobalTaskConsole } from './components/GlobalTaskConsole';
import { GraphView } from './components/GraphView';
import { FocusModeOverlay } from './components/FocusModeOverlay';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { ExportModal } from './components/ExportModal';
import { InstallAppModal } from './components/InstallAppModal';

export default function App() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => loadNotebooks());
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    const loaded = loadNotes();
    return loaded.length > 0 ? loaded[0].id : null;
  });

  const [currentView, setCurrentView] = useState<ViewMode>('split');
  const [activeNotebookFilter, setActiveNotebookFilter] = useState<string | 'all' | 'starred' | 'archive'>('all');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  // Auto-persist changes
  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveNotebooks(notebooks);
  }, [notebooks]);

  // Global keyboard shortcuts (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickCaptureOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0] || null;
  const totalPendingTasks = tasks.filter((t) => t.status !== 'done').length;

  // Note handlers
  const handleSelectNote = (noteId: string) => {
    setActiveNoteId(noteId);
    if (currentView !== 'split' && currentView !== 'editor-only') {
      setCurrentView('split');
    }
  };

  const handleNewNote = (folderId?: string) => {
    const newNoteId = `note-${Date.now()}`;
    const targetFolder = folderId || (notebooks.length > 0 ? notebooks[0].id : 'nb-arch');

    const newNote: Note = {
      id: newNoteId,
      title: 'Untitled Folio',
      folderId: targetFolder,
      tags: [],
      starred: false,
      pinned: false,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: [
        {
          id: `b-${Date.now()}-1`,
          type: 'h1',
          content: 'New Thought Document',
        },
        {
          id: `b-${Date.now()}-2`,
          type: 'paragraph',
          content: 'Begin jotting observations, requirements, or type [] to immediately spawn an action item...',
        },
      ],
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNoteId);
    setCurrentView('split');
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    // Also remove or detach linked tasks
    setTasks((prev) => prev.filter((t) => t.noteId !== noteId));
    if (activeNoteId === noteId) {
      const remaining = notes.filter((n) => n.id !== noteId);
      setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleToggleStar = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, starred: !n.starred } : n))
    );
  };

  const handleToggleArchive = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, archived: !n.archived } : n))
    );
  };

  const handleUpdateNote = (noteId: string, patch: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, ...patch } : n))
    );
  };

  // Task handlers
  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const handleToggleTaskStatus = (taskId: string) => {
    let nextStatus: Task['status'] = 'done';
    let blockToSync: { noteId?: string; blockId?: string; checked: boolean } | null = null;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        nextStatus = t.status === 'done' ? 'todo' : 'done';
        if (t.noteId && t.blockId) {
          blockToSync = {
            noteId: t.noteId,
            blockId: t.blockId,
            checked: nextStatus === 'done',
          };
        }
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'done' ? new Date().toISOString() : undefined,
        };
      })
    );

    // Two-way sync to block checkbox in Note
    if (blockToSync) {
      const { noteId, blockId, checked } = blockToSync;
      setNotes((prevNotes) =>
        prevNotes.map((n) => {
          if (n.id !== noteId) return n;
          return {
            ...n,
            blocks: n.blocks.map((b) => (b.id === blockId ? { ...b, checked } : b)),
          };
        })
      );
    }
  };

  const handleUpdateTask = (taskId: string, patch: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    // Clear block taskId reference if linked
    if (taskToDelete && taskToDelete.noteId && taskToDelete.blockId) {
      setNotes((prevNotes) =>
        prevNotes.map((n) => {
          if (n.id !== taskToDelete.noteId) return n;
          return {
            ...n,
            blocks: n.blocks.map((b) =>
              b.id === taskToDelete.blockId ? { ...b, taskId: undefined } : b
            ),
          };
        })
      );
    }
  };

  // Deep-link from global task or margin to source block
  const handleOpenNoteWithBlock = (noteId: string, blockId?: string) => {
    setActiveNoteId(noteId);
    setCurrentView('split');
    if (blockId) {
      setHighlightedBlockId(blockId);
    }
  };

  const handleAddNotebook = (name: string, color: string) => {
    const newNb: Notebook = {
      id: `nb-${Date.now()}`,
      name,
      color,
      icon: 'Folder',
    };
    setNotebooks((prev) => [...prev, newNb]);
  };

  const handleImportData = (data: { notes: Note[]; tasks: Task[]; notebooks: Notebook[] }) => {
    setNotes(data.notes);
    setTasks(data.tasks);
    setNotebooks(data.notebooks);
    if (data.notes.length > 0) {
      setActiveNoteId(data.notes[0].id);
    }
  };

  const handleResetToDemo = () => {
    setNotes(INITIAL_NOTES);
    setTasks(INITIAL_TASKS);
    setNotebooks(INITIAL_NOTEBOOKS);
    setActiveNoteId(INITIAL_NOTES[0].id);
    setCurrentView('split');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-100 text-neutral-900">
      {/* Top Bar Navigation */}
      <TopNav
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onToggleFocusMode={() => setIsFocusMode(true)}
        onNewNote={() => handleNewNote()}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenInstallApp={() => setIsInstallOpen(true)}
        activeNoteTitle={activeNote?.title}
        totalPendingTasks={totalPendingTasks}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Always accessible or collapsible for notes management) */}
        {currentView !== 'graph' && (
          <Sidebar
            notes={notes}
            notebooks={notebooks}
            tasks={tasks}
            activeNoteId={activeNoteId}
            onSelectNote={handleSelectNote}
            onNewNote={handleNewNote}
            onDeleteNote={handleDeleteNote}
            onToggleStar={handleToggleStar}
            onToggleArchive={handleToggleArchive}
            activeNotebookFilter={activeNotebookFilter}
            onSelectNotebookFilter={setActiveNotebookFilter}
            activeTagFilter={activeTagFilter}
            onSelectTagFilter={setActiveTagFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddNotebook={handleAddNotebook}
          />
        )}

        {/* Dynamic Center Stage Views */}
        {/* VIEW 1 & 2: DUAL STREAM (Editor + Margin Action Ledger) or NOTE CANVAS ONLY */}
        {(currentView === 'split' || currentView === 'editor-only') && activeNote && (
          <div className="flex-1 flex overflow-hidden">
            {/* Center: Rich Note Editor Canvas */}
            <NoteEditor
              note={activeNote}
              notebooks={notebooks}
              tasks={tasks}
              onUpdateNote={handleUpdateNote}
              onAddTask={handleAddTask}
              onToggleTaskStatus={handleToggleTaskStatus}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              highlightedBlockId={highlightedBlockId}
              onClearHighlight={() => setHighlightedBlockId(null)}
            />

            {/* Right: Live Action Margin (The key distinctive feature) */}
            {currentView === 'split' && (
              <MarginActionLedger
                noteId={activeNote.id}
                noteTitle={activeNote.title}
                tasks={tasks}
                onToggleTaskStatus={handleToggleTaskStatus}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onScrollToBlock={(blockId) => setHighlightedBlockId(blockId)}
              />
            )}
          </div>
        )}

        {/* Fallback if no notes exist */}
        {(currentView === 'split' || currentView === 'editor-only') && !activeNote && (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-neutral-400 bg-white">
            <div>
              <p className="text-base font-semibold text-neutral-700 mb-2">No Folios in this view</p>
              <p className="text-xs text-neutral-400 mb-4">Create your first folio to begin capturing thoughts.</p>
              <button
                onClick={() => handleNewNote()}
                className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                + Create New Folio
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: GLOBAL ACTION CONSOLE (Daily Digest, Kanban, Priority Matrix, Day Timebox) */}
        {(currentView === 'tasks-digest' || currentView === 'tasks-kanban' || currentView === 'tasks-matrix' || currentView === 'tasks-timebox') && (
          <GlobalTaskConsole
            initialSubTab={
              currentView === 'tasks-digest'
                ? 'digest'
                : currentView === 'tasks-matrix'
                ? 'matrix'
                : currentView === 'tasks-timebox'
                ? 'timebox'
                : 'kanban'
            }
            tasks={tasks}
            notes={notes}
            notebooks={notebooks}
            onToggleTaskStatus={handleToggleTaskStatus}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onOpenNoteWithBlock={handleOpenNoteWithBlock}
          />
        )}

        {/* VIEW 4: THOUGHT & ACTION NEXUS (Interactive Graph View) */}
        {currentView === 'graph' && (
          <GraphView
            notes={notes}
            tasks={tasks}
            onOpenNote={handleSelectNote}
            onBackToWorkspace={() => setCurrentView('split')}
          />
        )}
      </div>

      {/* Focus Mode Overlay */}
      {isFocusMode && activeNote && (
        <FocusModeOverlay
          note={activeNote}
          onUpdateNote={handleUpdateNote}
          onClose={() => setIsFocusMode(false)}
        />
      )}

      {/* Quick Capture Modal (Cmd+K) */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        notes={notes}
        onAddTask={handleAddTask}
        onAddNote={(title, content) => {
          const newNoteId = `note-${Date.now()}`;
          const newNote: Note = {
            id: newNoteId,
            title: title || 'Quick Note',
            folderId: notebooks[0]?.id || 'nb-arch',
            tags: [],
            starred: false,
            pinned: false,
            archived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            blocks: [
              {
                id: `b-${Date.now()}`,
                type: 'paragraph',
                content: content || 'Captured thought...',
              },
            ],
          };
          setNotes((prev) => [newNote, ...prev]);
          setActiveNoteId(newNoteId);
          setCurrentView('split');
        }}
      />

      {/* Data Export / Backup Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        notes={notes}
        tasks={tasks}
        notebooks={notebooks}
        onImportData={handleImportData}
        onResetToDemo={handleResetToDemo}
      />

      {/* Download & Install App Modal (PWA) */}
      <InstallAppModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
        onOpenExportModal={() => setIsExportOpen(true)}
      />
    </div>
  );
}
