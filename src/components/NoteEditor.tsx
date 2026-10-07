import React, { useState, useRef, useEffect } from 'react';
import { Note, NoteBlock, BlockType, Notebook, Task, Priority } from '../types';
import { 
  Plus, 
  Trash2, 
  CheckSquare, 
  Heading1, 
  Heading2, 
  Heading3, 
  AlignLeft, 
  Quote, 
  Code, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Sparkles, 
  Tag, 
  Calendar, 
  Copy, 
  Check, 
  Zap,
  Volume2
} from 'lucide-react';
import { playCheckTick, playCompletionChime, playExtractPop } from '../utils/audio';

interface NoteEditorProps {
  note: Note;
  notebooks: Notebook[];
  tasks: Task[];
  onUpdateNote: (noteId: string, patch: Partial<Note>) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  onToggleTaskStatus: (taskId: string) => void;
  onUpdateTask: (taskId: string, patch: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  highlightedBlockId?: string | null;
  onClearHighlight?: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  notebooks,
  tasks,
  onUpdateNote,
  onAddTask,
  onToggleTaskStatus,
  onUpdateTask,
  highlightedBlockId,
  onClearHighlight,
}) => {
  const [newTagInput, setNewTagInput] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll to highlighted block if specified
  useEffect(() => {
    if (highlightedBlockId && blockRefs.current[highlightedBlockId]) {
      const el = blockRefs.current[highlightedBlockId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const timer = setTimeout(() => {
          if (onClearHighlight) onClearHighlight();
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightedBlockId, onClearHighlight]);

  // Compute word count and reading estimate
  const textStats = React.useMemo(() => {
    const allText = note.blocks.map((b) => b.content).join(' ');
    const words = allText.trim() ? allText.trim().split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes };
  }, [note.blocks]);

  // Block update helpers
  const handleUpdateBlock = (blockId: string, content: string) => {
    // Check for markdown prefixes
    let updatedType: BlockType | undefined;
    let finalContent = content;

    if (content.startsWith('# ')) {
      updatedType = 'h1';
      finalContent = content.slice(2);
    } else if (content.startsWith('## ')) {
      updatedType = 'h2';
      finalContent = content.slice(3);
    } else if (content.startsWith('### ')) {
      updatedType = 'h3';
      finalContent = content.slice(4);
    } else if (content.startsWith('> ')) {
      updatedType = 'quote';
      finalContent = content.slice(2);
    } else if (content.startsWith('- ') || content.startsWith('* ')) {
      updatedType = 'bullet';
      finalContent = content.slice(2);
    } else if (content.startsWith('[] ') || content.startsWith('[ ] ')) {
      updatedType = 'checklist';
      finalContent = content.replace(/^\[\s?\]\s/, '');
    } else if (content.startsWith('```')) {
      updatedType = 'code';
      finalContent = content.replace(/^```/, '');
    }

    const updatedBlocks = note.blocks.map((b) => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        content: finalContent,
        ...(updatedType ? { type: updatedType } : {}),
      };
    });

    onUpdateNote(note.id, {
      blocks: updatedBlocks,
      updatedAt: new Date().toISOString(),
    });

    // If promoted to checklist and has no task yet, create task
    if (updatedType === 'checklist') {
      const currentBlock = note.blocks.find(b => b.id === blockId);
      if (currentBlock && !currentBlock.taskId) {
        handleExtractTask(blockId, finalContent || 'New action item');
      }
    }
  };

  const handleChangeBlockType = (blockId: string, type: BlockType) => {
    const updatedBlocks = note.blocks.map((b) => {
      if (b.id !== blockId) return b;
      return { ...b, type };
    });
    onUpdateNote(note.id, { blocks: updatedBlocks, updatedAt: new Date().toISOString() });

    if (type === 'checklist') {
      const target = note.blocks.find(b => b.id === blockId);
      if (target && !target.taskId) {
        handleExtractTask(blockId, target.content || 'Action task');
      }
    }
  };

  const handleAddBlock = (afterBlockId?: string, type: BlockType = 'paragraph') => {
    const newBlock: NoteBlock = {
      id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      content: '',
      checked: false,
    };

    let updatedBlocks: NoteBlock[];
    if (afterBlockId) {
      const idx = note.blocks.findIndex((b) => b.id === afterBlockId);
      if (idx !== -1) {
        updatedBlocks = [
          ...note.blocks.slice(0, idx + 1),
          newBlock,
          ...note.blocks.slice(idx + 1),
        ];
      } else {
        updatedBlocks = [...note.blocks, newBlock];
      }
    } else {
      updatedBlocks = [...note.blocks, newBlock];
    }

    onUpdateNote(note.id, { blocks: updatedBlocks, updatedAt: new Date().toISOString() });
  };

  const handleDeleteBlock = (blockId: string) => {
    if (note.blocks.length <= 1) return; // Keep at least one block
    const updatedBlocks = note.blocks.filter((b) => b.id !== blockId);
    onUpdateNote(note.id, { blocks: updatedBlocks, updatedAt: new Date().toISOString() });
  };

  // Extract a paragraph/thought into a live linked task
  const handleExtractTask = (blockId: string, content: string, priority: Priority = 'medium') => {
    playExtractPop();
    const taskTitle = content.trim() || 'New extracted action item';

    const createdTask = onAddTask({
      title: taskTitle,
      noteId: note.id,
      blockId,
      noteTitle: note.title,
      status: 'todo',
      priority,
      timeboxSlot: 'none',
      tags: [...note.tags],
    });

    // Update block to record taskId & ensure type is checklist or has action marker
    const updatedBlocks = note.blocks.map((b) => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        taskId: createdTask.id,
        type: b.type === 'paragraph' ? 'checklist' : b.type,
      };
    });

    onUpdateNote(note.id, { blocks: updatedBlocks, updatedAt: new Date().toISOString() });
  };

  // Toggle checklist checkbox
  const handleToggleChecklist = (block: NoteBlock) => {
    const newChecked = !block.checked;
    if (newChecked) {
      playCompletionChime();
    } else {
      playCheckTick();
    }

    const updatedBlocks = note.blocks.map((b) => {
      if (b.id !== block.id) return b;
      return { ...b, checked: newChecked };
    });
    onUpdateNote(note.id, { blocks: updatedBlocks, updatedAt: new Date().toISOString() });

    // Sync to linked task if exists
    if (block.taskId) {
      onToggleTaskStatus(block.taskId);
    }
  };

  // Audio Voice Memo Recording & Simulated Playback
  const handleStartVoiceRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const newBlock: NoteBlock = {
            id: `b-audio-${Date.now()}`,
            type: 'audio',
            content: 'Voice reflection recorded at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            audioUrl,
            audioDuration: 18,
          };
          onUpdateNote(note.id, {
            blocks: [...note.blocks, newBlock],
            updatedAt: new Date().toISOString(),
          });
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecordingAudio(true);
      } else {
        // Fallback simulated voice note
        createSimulatedVoiceMemo();
      }
    } catch {
      // Permission denied or sandbox restriction: provide simulated voice note
      createSimulatedVoiceMemo();
    }
  };

  const handleStopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  const createSimulatedVoiceMemo = () => {
    const newBlock: NoteBlock = {
      id: `b-audio-${Date.now()}`,
      type: 'audio',
      content: 'Audio memo: Synthesize client requirements and draft deployment plan',
      audioDuration: 24,
    };
    onUpdateNote(note.id, {
      blocks: [...note.blocks, newBlock],
      updatedAt: new Date().toISOString(),
    });
  };

  const handlePlaySimulatedAudio = (blockId: string) => {
    if (playingAudioId === blockId) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(blockId);
      setTimeout(() => {
        setPlayingAudioId(null);
      }, 5000);
    }
  };

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 1800);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const cleanTag = newTagInput.trim().replace(/^#/, '').toLowerCase();
      if (!note.tags.includes(cleanTag)) {
        onUpdateNote(note.id, { tags: [...note.tags, cleanTag] });
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateNote(note.id, { tags: note.tags.filter((t) => t !== tagToRemove) });
  };

  return (
    <main className="flex-1 overflow-y-auto bg-white flex flex-col items-center px-6 py-8 md:px-12 selection:bg-amber-100 selection:text-amber-900">
      <div className="w-full max-w-3xl">
        {/* Header Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-neutral-100 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            {/* Notebook Selector */}
            <select
              value={note.folderId}
              onChange={(e) => onUpdateNote(note.id, { folderId: e.target.value })}
              className="bg-neutral-100 text-neutral-800 font-medium px-2.5 py-1 rounded-md border border-neutral-200 focus:outline-none cursor-pointer"
            >
              {notebooks.map((nb) => (
                <option key={nb.id} value={nb.id}>
                  {nb.name}
                </option>
              ))}
            </select>

            <span className="text-neutral-300">/</span>

            {/* Formatted Date */}
            <span className="flex items-center gap-1 font-mono text-[11px] text-neutral-400">
              <Calendar className="w-3 h-3 opacity-60" />
              {new Date(note.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Reading Stats */}
          <div className="flex items-center gap-3 font-mono text-[11px] text-neutral-400">
            <span>{textStats.words} words</span>
            <span>·</span>
            <span>{textStats.minutes} min read</span>
          </div>
        </div>

        {/* Note Title Input */}
        <input
          type="text"
          value={note.title}
          onChange={(e) => onUpdateNote(note.id, { title: e.target.value })}
          placeholder="Folio Title..."
          className="w-full text-2xl md:text-3xl font-bold font-serif text-neutral-900 placeholder:text-neutral-300 mb-4 focus:outline-none tracking-tight border-none bg-transparent"
        />

        {/* Tags Bar */}
        <div className="flex flex-wrap items-center gap-1.5 mb-8">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs text-neutral-600 bg-neutral-100 hover:bg-neutral-200/80 px-2 py-0.5 rounded-md transition-colors"
            >
              <Tag className="w-2.5 h-2.5 text-neutral-400" />
              <span>#{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-neutral-400 hover:text-rose-600 text-[10px] ml-0.5 cursor-pointer"
              >
                ✕
              </button>
            </span>
          ))}
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="+ tag..."
            className="text-xs text-neutral-600 placeholder:text-neutral-400 bg-transparent px-2 py-0.5 focus:outline-none w-20"
          />
        </div>

        {/* Blocks Editor Surface */}
        <div className="space-y-3.5">
          {note.blocks.map((block, idx) => {
            const isHighlighted = highlightedBlockId === block.id;
            const linkedTask = tasks.find((t) => t.id === block.taskId || t.blockId === block.id);

            return (
              <div
                key={block.id}
                ref={(el) => { blockRefs.current[block.id] = el; }}
                className={`group relative rounded-lg transition-all duration-300 p-1 -mx-2 ${
                  isHighlighted ? 'bg-amber-50/80 ring-2 ring-amber-400 highlight-pulse' : 'hover:bg-neutral-50/70'
                }`}
              >
                {/* Block Gutter Action Affordances */}
                <div className="absolute -left-9 top-1.5 hidden group-hover:flex items-center gap-1">
                  {/* Convert to task / priority button */}
                  {!linkedTask && block.type !== 'audio' && (
                    <button
                      onClick={() => handleExtractTask(block.id, block.content)}
                      title="Promote to Action Ledger"
                      className="p-1 bg-white hover:bg-amber-100 border border-neutral-200 text-amber-700 rounded shadow-xs text-xs transition-colors cursor-pointer"
                    >
                      <Zap className="w-3 h-3 fill-amber-500 text-amber-600" />
                    </button>
                  )}
                  {/* Delete Block */}
                  {note.blocks.length > 1 && (
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      title="Delete block"
                      className="p-1 bg-white hover:bg-rose-50 border border-neutral-200 text-neutral-400 hover:text-rose-600 rounded shadow-xs text-xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Block Content Rendering */}
                {block.type === 'h1' && (
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBlock(block.id, 'paragraph');
                      }
                    }}
                    placeholder="Heading 1..."
                    className="w-full text-xl font-bold font-serif text-neutral-900 border-none bg-transparent focus:outline-none"
                  />
                )}

                {block.type === 'h2' && (
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBlock(block.id, 'paragraph');
                      }
                    }}
                    placeholder="Heading 2..."
                    className="w-full text-lg font-bold text-neutral-800 border-none bg-transparent focus:outline-none"
                  />
                )}

                {block.type === 'h3' && (
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBlock(block.id, 'paragraph');
                      }
                    }}
                    placeholder="Heading 3..."
                    className="w-full text-base font-semibold text-neutral-800 border-none bg-transparent focus:outline-none"
                  />
                )}

                {block.type === 'paragraph' && (
                  <div className="relative">
                    <textarea
                      rows={Math.max(1, Math.ceil(block.content.length / 75))}
                      value={block.content}
                      onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddBlock(block.id, 'paragraph');
                        }
                      }}
                      placeholder="Write freely... Type [] for tasks, # for headers, > for quotes..."
                      className="w-full text-sm leading-relaxed text-neutral-800 border-none bg-transparent resize-none focus:outline-none"
                    />
                    {/* Prompt to convert long sentence to action */}
                    {!linkedTask && block.content.length > 25 && (
                      <div className="hidden group-hover:flex items-center gap-1.5 mt-1 text-[11px] text-neutral-400">
                        <button
                          onClick={() => handleExtractTask(block.id, block.content)}
                          className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-medium cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Extract as Action to Margin</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {block.type === 'checklist' && (
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => handleToggleChecklist(block)}
                      className="mt-0.5 text-neutral-400 hover:text-amber-600 transition-colors cursor-pointer shrink-0"
                    >
                      {block.checked ? (
                        <div className="w-4 h-4 bg-emerald-600 text-white rounded flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 border-2 border-neutral-300 hover:border-amber-500 rounded" />
                      )}
                    </button>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddBlock(block.id, 'checklist');
                          }
                        }}
                        placeholder="Action item..."
                        className={`w-full text-sm border-none bg-transparent focus:outline-none transition-all ${
                          block.checked ? 'line-through text-neutral-400' : 'text-neutral-900 font-medium'
                        }`}
                      />
                      {linkedTask && (
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400 font-mono">
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Synced with Action Ledger ({linkedTask.priority})
                          </span>
                          {linkedTask.dueDate && <span>Due: {linkedTask.dueDate}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {block.type === 'bullet' && (
                  <div className="flex items-start gap-2">
                    <span className="text-neutral-400 text-lg leading-none mt-0.5">•</span>
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBlock(block.id, 'bullet');
                        }
                      }}
                      placeholder="List item..."
                      className="w-full text-sm text-neutral-800 border-none bg-transparent focus:outline-none"
                    />
                  </div>
                )}

                {block.type === 'quote' && (
                  <div className="border-l-3 border-amber-500 pl-3 py-1 bg-neutral-50/50 rounded-r">
                    <textarea
                      rows={2}
                      value={block.content}
                      onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                      placeholder="Insight or principle..."
                      className="w-full text-sm italic font-serif text-neutral-800 border-none bg-transparent resize-none focus:outline-none"
                    />
                  </div>
                )}

                {block.type === 'code' && (
                  <div className="bg-neutral-900 text-neutral-100 rounded-lg p-3 font-mono text-xs relative group/code">
                    <div className="flex items-center justify-between text-neutral-400 pb-2 mb-2 border-b border-neutral-800 text-[10px]">
                      <span>{block.codeLanguage || 'typescript'}</span>
                      <button
                        onClick={() => handleCopyCode(block.id, block.content)}
                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedCodeId === block.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={block.content}
                      onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                      className="w-full bg-transparent border-none text-neutral-200 resize-y focus:outline-none font-mono"
                    />
                  </div>
                )}

                {block.type === 'audio' && (
                  <div className="flex items-center justify-between p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePlaySimulatedAudio(block.id)}
                        className="w-8 h-8 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-xs"
                      >
                        {playingAudioId === block.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                      <div>
                        <p className="text-xs font-semibold text-neutral-900">{block.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {/* Animated sound wave bars */}
                          <div className="flex items-center gap-0.5 h-3">
                            {[12, 24, 16, 28, 8, 20, 14, 26, 18, 10].map((h, i) => (
                              <div
                                key={i}
                                className={`w-0.5 rounded-full transition-all duration-200 ${
                                  playingAudioId === block.id ? 'bg-amber-600 animate-pulse' : 'bg-neutral-300'
                                }`}
                                style={{ height: playingAudioId === block.id ? `${(h * 0.7) + (i % 3) * 3}px` : '4px' }}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-mono text-neutral-400 tabular-nums">
                            0:{block.audioDuration || 18}s
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleExtractTask(block.id, block.content)}
                      className="text-xs text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Convert to Task</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating / Bottom Block Inserter Bar */}
        <div className="mt-8 pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => handleAddBlock(undefined, 'paragraph')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Text</span>
            </button>
            <button
              onClick={() => handleAddBlock(undefined, 'h2')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              <Heading2 className="w-3.5 h-3.5" />
              <span>Heading</span>
            </button>
            <button
              onClick={() => handleAddBlock(undefined, 'checklist')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Action Checklist</span>
            </button>
            <button
              onClick={() => handleAddBlock(undefined, 'quote')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              <Quote className="w-3.5 h-3.5" />
              <span>Callout</span>
            </button>
            <button
              onClick={() => handleAddBlock(undefined, 'code')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
          </div>

          {/* Voice Memo Capture */}
          <div className="flex items-center gap-2">
            {isRecordingAudio ? (
              <button
                onClick={handleStopVoiceRecording}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-300 rounded-lg animate-pulse cursor-pointer"
              >
                <MicOff className="w-3.5 h-3.5" />
                <span>Stop Recording</span>
              </button>
            ) : (
              <button
                onClick={handleStartVoiceRecording}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                title="Record or simulate voice thought memo"
              >
                <Mic className="w-3.5 h-3.5 text-amber-600" />
                <span>Voice Thought</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
