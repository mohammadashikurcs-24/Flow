export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TimeboxSlot = 'morning' | 'afternoon' | 'evening' | 'none';

export type BlockType = 
  | 'paragraph' 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'bullet' 
  | 'checklist' 
  | 'quote' 
  | 'code' 
  | 'audio';

export interface NoteBlock {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean; // for checklist
  codeLanguage?: string;
  taskId?: string; // bi-directional link to a Task
  audioUrl?: string; // audio recording
  audioDuration?: number;
}

export interface Task {
  id: string;
  title: string;
  noteId?: string; // origin note ID
  blockId?: string; // origin block in note
  noteTitle?: string; // denormalized for speed
  status: TaskStatus;
  priority: Priority;
  dueDate?: string; // YYYY-MM-DD
  timeEstimateMinutes?: number;
  timeboxSlot: TimeboxSlot;
  tags: string[];
  createdAt: string;
  completedAt?: string;
}

export interface Note {
  id: string;
  title: string;
  blocks: NoteBlock[];
  folderId: string; // notebook folder
  tags: string[];
  starred: boolean;
  pinned: boolean;
  archived: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notebook {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export type ViewMode = 
  | 'split'          // Note editor + Note margin action ledger
  | 'editor-only'    // Full wide writing canvas
  | 'tasks-digest'   // Daily Digest summary & recent notes
  | 'tasks-kanban'   // Global task kanban across all notes
  | 'tasks-matrix'   // Eisenhower priority matrix
  | 'tasks-timebox'  // Day planner timeboxing
  | 'graph';         // Visual thought & task relationship graph

export interface FilterState {
  notebookId: string | 'all' | 'starred' | 'archive';
  tag?: string;
  searchQuery: string;
  priorityFilter?: Priority | 'all';
  statusFilter?: TaskStatus | 'all';
}
