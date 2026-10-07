import React, { useState, useEffect } from 'react';
import { Note, NoteBlock } from '../types';
import { Minimize2, Play, Pause, RotateCcw } from 'lucide-react';
import { playCompletionChime } from '../utils/audio';

interface FocusModeOverlayProps {
  note: Note;
  onUpdateNote: (noteId: string, patch: Partial<Note>) => void;
  onClose: () => void;
}

export const FocusModeOverlay: React.FC<FocusModeOverlayProps> = ({
  note,
  onUpdateNote,
  onClose,
}) => {
  // 25-minute Pomodoro timer
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      playCompletionChime();
      setIsRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  // Handle escape key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleUpdateBlock = (blockId: string, content: string) => {
    const updated = note.blocks.map((b) => (b.id === blockId ? { ...b, content } : b));
    onUpdateNote(note.id, { blocks: updated, updatedAt: new Date().toISOString() });
  };

  const handleAddParagraph = (afterId: string) => {
    const newBlock: NoteBlock = {
      id: `b-focus-${Date.now()}`,
      type: 'paragraph',
      content: '',
    };
    const idx = note.blocks.findIndex((b) => b.id === afterId);
    const updated = [...note.blocks.slice(0, idx + 1), newBlock, ...note.blocks.slice(idx + 1)];
    onUpdateNote(note.id, { blocks: updated, updatedAt: new Date().toISOString() });
  };

  const wordCount = note.blocks.map((b) => b.content).join(' ').trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 bg-[#faf9f6] text-neutral-900 flex flex-col items-center overflow-y-auto selection:bg-amber-100 selection:text-amber-900">
      {/* Subtle Top Bar */}
      <div className="w-full max-w-4xl px-8 py-4 flex items-center justify-between text-neutral-400 select-none">
        {/* Sprint Timer */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-neutral-700 font-semibold tabular-nums text-sm">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-1 hover:text-neutral-800 cursor-pointer"
            title={isRunning ? 'Pause Timer' : 'Start Timer'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => { setIsRunning(false); setTimeLeft(25 * 60); }}
            className="p-1 hover:text-neutral-800 cursor-pointer"
            title="Reset to 25m"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Word Count & Exit */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono tabular-nums">{wordCount} words written</span>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-md transition-colors cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Focus (Esc)</span>
          </button>
        </div>
      </div>

      {/* Typewriter Canvas */}
      <div className="w-full max-w-2xl px-6 py-12 flex-1">
        <input
          type="text"
          value={note.title}
          onChange={(e) => onUpdateNote(note.id, { title: e.target.value })}
          placeholder="Untitled Thought..."
          className="w-full text-3xl font-serif font-bold text-neutral-900 border-none bg-transparent focus:outline-none mb-8 tracking-tight"
        />

        <div className="space-y-4">
          {note.blocks.map((block) => (
            <div key={block.id} className="relative">
              {block.type === 'h1' || block.type === 'h2' || block.type === 'h3' ? (
                <input
                  type="text"
                  value={block.content}
                  onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                  className="w-full text-xl font-serif font-bold text-neutral-800 border-none bg-transparent focus:outline-none"
                />
              ) : (
                <textarea
                  rows={Math.max(1, Math.ceil(block.content.length / 65))}
                  value={block.content}
                  onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddParagraph(block.id);
                    }
                  }}
                  placeholder="Continue thinking..."
                  className="w-full text-base leading-relaxed text-neutral-800 border-none bg-transparent resize-none focus:outline-none font-sans"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
