import React, { useState, useEffect } from 'react';
import { Note, Task, Priority } from '../types';
import { Zap, FileText, Check, X, Calendar, Flag } from 'lucide-react';
import { playExtractPop } from '../utils/audio';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  onAddNote: (title: string, content: string) => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  notes,
  onAddTask,
  onAddNote,
}) => {
  const [mode, setMode] = useState<'task' | 'note'>('task');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('none');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');

  // Handle Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (mode === 'task') {
      const chosenNote = notes.find((n) => n.id === selectedNoteId);
      onAddTask({
        title: title.trim(),
        noteId: selectedNoteId === 'none' ? undefined : selectedNoteId,
        noteTitle: chosenNote ? chosenNote.title : undefined,
        status: 'todo',
        priority,
        dueDate: dueDate || undefined,
        timeboxSlot: 'none',
        tags: [],
      });
      playExtractPop();
    } else {
      onAddNote(title.trim(), content.trim());
    }

    // Reset and close
    setTitle('');
    setContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Tabs */}
        <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-1 p-0.5 bg-neutral-200/60 rounded-lg text-xs">
            <button
              onClick={() => setMode('task')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                mode === 'task' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Capture Action Item</span>
            </button>
            <button
              onClick={() => setMode('note')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                mode === 'note' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Quick Folio</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Capture Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">
              {mode === 'task' ? 'Action Description' : 'Folio Title'}
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                mode === 'task'
                  ? 'e.g., Verify staging cluster latency before release...'
                  : 'e.g., Thoughts on reactive cache synchronization...'
              }
              className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {mode === 'task' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Origin Note link */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">Anchor to Folio</label>
                <select
                  value={selectedNoteId}
                  onChange={(e) => setSelectedNoteId(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-neutral-300 rounded-lg text-neutral-800 focus:outline-none cursor-pointer"
                >
                  <option value="none">Standalone Task</option>
                  {notes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title || 'Untitled'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full text-xs px-2.5 py-1.5 border border-neutral-300 rounded-lg text-neutral-800 focus:outline-none cursor-pointer"
                >
                  <option value="high">P1 High</option>
                  <option value="medium">P2 Medium</option>
                  <option value="low">P3 Low</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-neutral-300 rounded-lg text-neutral-800 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Initial Thoughts</label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing thoughts or brainstorm notes..."
                className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
            <span className="text-[11px] text-neutral-400">Press Enter to save</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                Capture & Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
