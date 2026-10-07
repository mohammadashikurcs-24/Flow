import React, { useState } from 'react';
import { Note, Notebook, Task } from '../types';
import { 
  Folder, 
  Star, 
  Archive, 
  Hash, 
  Search, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Pin,
  FileText
} from 'lucide-react';

interface SidebarProps {
  notes: Note[];
  notebooks: Notebook[];
  tasks: Task[];
  activeNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onNewNote: (folderId?: string) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleStar: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  activeNotebookFilter: string | 'all' | 'starred' | 'archive';
  onSelectNotebookFilter: (filter: string | 'all' | 'starred' | 'archive') => void;
  activeTagFilter: string | null;
  onSelectTagFilter: (tag: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddNotebook: (name: string, color: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  notebooks,
  tasks,
  activeNoteId,
  onSelectNote,
  onNewNote,
  onDeleteNote,
  onToggleStar,
  onToggleArchive,
  activeNotebookFilter,
  onSelectNotebookFilter,
  activeTagFilter,
  onSelectTagFilter,
  searchQuery,
  onSearchChange,
  onAddNotebook,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#0284c7');

  // Compute task statistics per note
  const noteTaskStats = React.useMemo(() => {
    const stats: Record<string, { total: number; done: number }> = {};
    for (const note of notes) {
      stats[note.id] = { total: 0, done: 0 };
    }
    for (const task of tasks) {
      if (task.noteId && stats[task.noteId]) {
        stats[task.noteId].total += 1;
        if (task.status === 'done') {
          stats[task.noteId].done += 1;
        }
      }
    }
    return stats;
  }, [notes, tasks]);

  // Aggregate all unique tags with count
  const allTagsWithCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    notes.forEach(note => {
      note.tags.forEach(tag => {
        map.set(tag, (map.get(tag) || 0) + 1);
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  // Filter notes according to current selections
  const filteredNotes = React.useMemo(() => {
    return notes.filter((n) => {
      // Archive filter
      if (activeNotebookFilter === 'archive') {
        if (!n.archived) return false;
      } else {
        if (n.archived) return false; // don't show archived in normal views
        if (activeNotebookFilter === 'starred' && !n.starred) return false;
        if (activeNotebookFilter !== 'all' && activeNotebookFilter !== 'starred' && n.folderId !== activeNotebookFilter) {
          return false;
        }
      }

      // Tag filter
      if (activeTagFilter && !n.tags.includes(activeTagFilter)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(query);
        const matchesContent = n.blocks.some((b) => b.content.toLowerCase().includes(query));
        const matchesTags = n.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesContent && !matchesTags) return false;
      }

      return true;
    }).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, activeNotebookFilter, activeTagFilter, searchQuery]);

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onAddNotebook(newFolderName.trim(), newFolderColor);
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  if (isCollapsed) {
    return (
      <aside className="w-14 bg-neutral-100/90 border-r border-neutral-200 flex flex-col items-center py-4 select-none shrink-0">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
          title="Expand Sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onNewNote()}
          className="mt-4 p-2.5 text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          title="New Note"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => onSelectNotebookFilter('all')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              activeNotebookFilter === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
            }`}
            title="All Notes"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectNotebookFilter('starred')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              activeNotebookFilter === 'starred' ? 'bg-amber-100 text-amber-800' : 'text-neutral-500 hover:text-neutral-900'
            }`}
            title="Starred"
          >
            <Star className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-neutral-50 border-r border-neutral-200 flex flex-col h-full select-none shrink-0 overflow-hidden">
      {/* Search Header */}
      <div className="p-3.5 border-b border-neutral-200 flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes & tasks..."
            className="w-full bg-white border border-neutral-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2 text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded-md transition-colors cursor-pointer"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Navigation Categories */}
        <div className="px-3 pt-3 pb-2">
          <div className="space-y-0.5 text-xs font-medium text-neutral-600">
            <button
              onClick={() => { onSelectNotebookFilter('all'); onSelectTagFilter(null); }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeNotebookFilter === 'all' && !activeTagFilter ? 'bg-neutral-200/80 text-neutral-900 font-semibold' : 'hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-neutral-500" />
                All Folios
              </span>
              <span className="text-neutral-400 font-mono text-[11px] tabular-nums">{notes.filter(n => !n.archived).length}</span>
            </button>

            <button
              onClick={() => { onSelectNotebookFilter('starred'); onSelectTagFilter(null); }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeNotebookFilter === 'starred' ? 'bg-amber-100/70 text-amber-900 font-semibold' : 'hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Starred
              </span>
              <span className="text-neutral-400 font-mono text-[11px] tabular-nums">{notes.filter(n => n.starred && !n.archived).length}</span>
            </button>

            <button
              onClick={() => { onSelectNotebookFilter('archive'); onSelectTagFilter(null); }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeNotebookFilter === 'archive' ? 'bg-neutral-200/80 text-neutral-900 font-semibold' : 'hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <Archive className="w-3.5 h-3.5 text-neutral-400" />
                Archive
              </span>
              <span className="text-neutral-400 font-mono text-[11px] tabular-nums">{notes.filter(n => n.archived).length}</span>
            </button>
          </div>
        </div>

        {/* Notebook Folders */}
        <div className="px-3 py-2 border-t border-neutral-200/80">
          <div className="flex items-center justify-between px-2.5 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Notebooks</span>
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded cursor-pointer"
              title="Add Notebook"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {notebooks.map((nb) => {
              const count = notes.filter(n => n.folderId === nb.id && !n.archived).length;
              const isActive = activeNotebookFilter === nb.id;
              return (
                <button
                  key={nb.id}
                  onClick={() => { onSelectNotebookFilter(nb.id); onSelectTagFilter(null); }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    isActive ? 'bg-neutral-200/80 text-neutral-900 font-semibold' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: nb.color }} 
                    />
                    <span className="truncate">{nb.name}</span>
                  </span>
                  <span className="text-neutral-400 font-mono text-[11px] tabular-nums shrink-0">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        {allTagsWithCounts.length > 0 && (
          <div className="px-3 py-2 border-t border-neutral-200/80">
            <div className="flex items-center justify-between px-2.5 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Tags</span>
              {activeTagFilter && (
                <button
                  onClick={() => onSelectTagFilter(null)}
                  className="text-[11px] text-amber-700 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1 px-1">
              {allTagsWithCounts.map(([tag, count]) => {
                const isTagActive = activeTagFilter === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => onSelectTagFilter(isTagActive ? null : tag)}
                    className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-md transition-colors cursor-pointer ${
                      isTagActive
                        ? 'bg-neutral-800 text-white font-medium'
                        : 'bg-white hover:bg-neutral-200 text-neutral-600 border border-neutral-200'
                    }`}
                  >
                    <Hash className="w-2.5 h-2.5 opacity-60" />
                    <span>{tag}</span>
                    <span className="text-[10px] opacity-70 tabular-nums">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Note List Stream */}
        <div className="p-3 border-t border-neutral-200/80">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Folios ({filteredNotes.length})
            </span>
            <button
              onClick={() => onNewNote(activeNotebookFilter !== 'all' && activeNotebookFilter !== 'starred' && activeNotebookFilter !== 'archive' ? activeNotebookFilter : undefined)}
              className="flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900 font-medium cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-neutral-400">
              No folios match this view.
              <button
                onClick={() => onNewNote()}
                className="mt-2 block mx-auto text-amber-700 hover:underline font-medium cursor-pointer"
              >
                + Create new folio
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredNotes.map((note) => {
                const isActive = note.id === activeNoteId;
                const stats = noteTaskStats[note.id] || { total: 0, done: 0 };
                const folder = notebooks.find(nb => nb.id === note.folderId);

                return (
                  <div
                    key={note.id}
                    onClick={() => onSelectNote(note.id)}
                    className={`group relative p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white border-neutral-300 shadow-xs ring-1 ring-neutral-300'
                        : 'bg-white/60 hover:bg-white border-transparent hover:border-neutral-200'
                    }`}
                  >
                    {/* Title and Pin */}
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className={`text-xs font-semibold leading-snug line-clamp-2 ${isActive ? 'text-neutral-900' : 'text-neutral-700'}`}>
                        {note.pinned && <Pin className="w-2.5 h-2.5 inline mr-1 text-amber-600 fill-amber-600" />}
                        {note.title || 'Untitled Folio'}
                      </h4>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleStar(note.id); }}
                          className="p-0.5 text-neutral-400 hover:text-amber-500 cursor-pointer"
                          title={note.starred ? 'Unstar' : 'Star'}
                        >
                          <Star className={`w-3 h-3 ${note.starred ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                          className="p-0.5 text-neutral-400 hover:text-rose-600 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Excerpt preview */}
                    {note.blocks[0] && (
                      <p className="mt-1 text-[11px] text-neutral-500 line-clamp-1">
                        {note.blocks[0].content || 'Empty note...'}
                      </p>
                    )}

                    {/* Metadata: folder, date, task stats */}
                    <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                      <span className="truncate max-w-[110px]" style={{ color: folder?.color }}>
                        {folder?.name}
                      </span>

                      {/* Action items status indicator */}
                      {stats.total > 0 && (
                        <span 
                          className={`flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] tabular-nums font-mono ${
                            stats.done === stats.total
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-amber-700 bg-amber-50'
                          }`}
                          title={`${stats.done} of ${stats.total} actions completed`}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>{stats.done}/{stats.total}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-neutral-200 max-w-sm w-full p-5">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Create New Notebook</h3>
            <form onSubmit={handleCreateFolderSubmit}>
              <label className="block text-xs text-neutral-600 mb-1">Notebook Title</label>
              <input
                type="text"
                autoFocus
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. System Design, Team Retros..."
                className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg mb-3 focus:outline-none focus:border-neutral-500"
              />

              <label className="block text-xs text-neutral-600 mb-1">Accent Color</label>
              <div className="flex gap-2 mb-4">
                {['#0284c7', '#7c3aed', '#d97706', '#16a34a', '#e11d48', '#4f46e5'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewFolderColor(color)}
                    className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${newFolderColor === color ? 'ring-2 ring-offset-2 ring-neutral-800 scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
