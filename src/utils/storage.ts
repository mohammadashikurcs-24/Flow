import { Note, Task, Notebook } from '../types';

export const INITIAL_NOTEBOOKS: Notebook[] = [
  { id: 'nb-arch', name: 'Engineering & Architecture', icon: 'Code', color: '#0284c7' },
  { id: 'nb-product', name: 'Product & Design', icon: 'Sparkles', color: '#7c3aed' },
  { id: 'nb-exec', name: 'Client Accounts & Strategy', icon: 'Briefcase', color: '#d97706' },
  { id: 'nb-personal', name: 'Personal & Habits', icon: 'BookOpen', color: '#16a34a' },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Q4 Core Platform Redesign & Stream Architecture',
    folderId: 'nb-arch',
    tags: ['performance', 'architecture', 'infrastructure'],
    starred: true,
    pinned: true,
    archived: false,
    createdAt: '2026-10-02T09:30:00Z',
    updatedAt: '2026-10-06T14:20:00Z',
    blocks: [
      {
        id: 'b-1-1',
        type: 'h1',
        content: 'System Decoupling & Optimistic Cache Layer',
      },
      {
        id: 'b-1-2',
        type: 'paragraph',
        content: 'The core challenge in our previous release was lock contention on heavy synchronous transactions. By moving to an event-driven optimistic UI with local mutation journal, we drop perceptual interaction latency to zero.',
      },
      {
        id: 'b-1-3',
        type: 'quote',
        content: '"Simplicity is prerequisite for reliability. Eliminate intermediate coordinator queues wherever direct streaming suffices."',
      },
      {
        id: 'b-1-4',
        type: 'checklist',
        content: 'Audit slow execution plans in warehouse ingestion pipeline',
        checked: false,
        taskId: 'task-1-1',
      },
      {
        id: 'b-1-5',
        type: 'checklist',
        content: 'Draft RFC for WebSocket bi-directional heartbeat protocol',
        checked: true,
        taskId: 'task-1-2',
      },
      {
        id: 'b-1-6',
        type: 'paragraph',
        content: 'Under load simulation tests, memory allocations plateaued safely around 180MB with 25,000 active virtual clients. We must still verify fallback behavior during cold socket reconnects.',
      },
      {
        id: 'b-1-7',
        type: 'checklist',
        content: 'Run chaos disconnect drill on staging cluster with 20k sockets',
        checked: false,
        taskId: 'task-1-3',
      },
      {
        id: 'b-1-8',
        type: 'code',
        content: '// Fast optimistic cache reconciliation\nexport function reconcileMutation<T>(state: T, patch: Partial<T>): T {\n  return Object.assign({}, state, patch);\n}',
        codeLanguage: 'typescript',
      },
    ],
  },
  {
    id: 'note-2',
    title: 'Client Briefing: Vertex Mobility Expansion',
    folderId: 'nb-exec',
    tags: ['vertex', 'enterprise', 'sla'],
    starred: true,
    pinned: false,
    archived: false,
    createdAt: '2026-10-04T11:15:00Z',
    updatedAt: '2026-10-07T08:10:00Z',
    blocks: [
      {
        id: 'b-2-1',
        type: 'h2',
        content: 'Expansion Scope & Key SLA Commitments',
      },
      {
        id: 'b-2-2',
        type: 'paragraph',
        content: 'Met with Marcus and the VP of Operations. Vertex plans to scale telemetry ingest to 4 new metropolitan transit corridors before November. Contract renewal hinges on guaranteed 99.98% uptime.',
      },
      {
        id: 'b-2-3',
        type: 'checklist',
        content: 'Send updated Master Services Agreement with 99.98% SLA schedule',
        checked: false,
        taskId: 'task-2-1',
      },
      {
        id: 'b-2-4',
        type: 'checklist',
        content: 'Prepare 10-slide executive walkthrough on real-time anomaly alerts',
        checked: false,
        taskId: 'task-2-2',
      },
      {
        id: 'b-2-5',
        type: 'quote',
        content: '"Vertex does not need more reports; they need automated threshold paging when transit dispatch signals stutter."',
      },
      {
        id: 'b-2-6',
        type: 'checklist',
        content: 'Schedule joint security & compliance review with Vertex InfoSec',
        checked: true,
        taskId: 'task-2-3',
      },
    ],
  },
  {
    id: 'note-3',
    title: 'Weekly Focus Sprint & Deep Work Cadence',
    folderId: 'nb-personal',
    tags: ['productivity', 'habits', 'weekly-review'],
    starred: false,
    pinned: false,
    archived: false,
    createdAt: '2026-10-05T07:45:00Z',
    updatedAt: '2026-10-07T07:45:00Z',
    blocks: [
      {
        id: 'b-3-1',
        type: 'h2',
        content: 'Guarding Unbroken Morning Time',
      },
      {
        id: 'b-3-2',
        type: 'paragraph',
        content: 'Context switching is the primary drain on cognitive bandwidth. Keep mornings strictly offline from instant messaging to write high-leverage architectural designs.',
      },
      {
        id: 'b-3-3',
        type: 'checklist',
        content: 'Protect Tuesday morning 9:00 - 12:00 for uninterrupted schema design',
        checked: false,
        taskId: 'task-3-1',
      },
      {
        id: 'b-3-4',
        type: 'checklist',
        content: 'Conduct Friday engineering retrospective with team at 16:00',
        checked: false,
        taskId: 'task-3-2',
      },
    ],
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1-1',
    title: 'Audit slow execution plans in warehouse ingestion pipeline',
    noteId: 'note-1',
    blockId: 'b-1-4',
    noteTitle: 'Q4 Core Platform Redesign & Stream Architecture',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-10-09',
    timeEstimateMinutes: 90,
    timeboxSlot: 'morning',
    tags: ['performance', 'database'],
    createdAt: '2026-10-02T09:35:00Z',
  },
  {
    id: 'task-1-2',
    title: 'Draft RFC for WebSocket bi-directional heartbeat protocol',
    noteId: 'note-1',
    blockId: 'b-1-5',
    noteTitle: 'Q4 Core Platform Redesign & Stream Architecture',
    status: 'done',
    priority: 'medium',
    dueDate: '2026-10-05',
    timeEstimateMinutes: 60,
    timeboxSlot: 'afternoon',
    tags: ['architecture'],
    createdAt: '2026-10-02T09:36:00Z',
    completedAt: '2026-10-05T16:00:00Z',
  },
  {
    id: 'task-1-3',
    title: 'Run chaos disconnect drill on staging cluster with 20k sockets',
    noteId: 'note-1',
    blockId: 'b-1-7',
    noteTitle: 'Q4 Core Platform Redesign & Stream Architecture',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-10-12',
    timeEstimateMinutes: 120,
    timeboxSlot: 'morning',
    tags: ['infrastructure'],
    createdAt: '2026-10-02T09:40:00Z',
  },
  {
    id: 'task-2-1',
    title: 'Send updated Master Services Agreement with 99.98% SLA schedule',
    noteId: 'note-2',
    blockId: 'b-2-3',
    noteTitle: 'Client Briefing: Vertex Mobility Expansion',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-10-07',
    timeEstimateMinutes: 45,
    timeboxSlot: 'morning',
    tags: ['vertex', 'legal'],
    createdAt: '2026-10-04T11:20:00Z',
  },
  {
    id: 'task-2-2',
    title: 'Prepare 10-slide executive walkthrough on real-time anomaly alerts',
    noteId: 'note-2',
    blockId: 'b-2-4',
    noteTitle: 'Client Briefing: Vertex Mobility Expansion',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2026-10-10',
    timeEstimateMinutes: 90,
    timeboxSlot: 'afternoon',
    tags: ['presentation'],
    createdAt: '2026-10-04T11:25:00Z',
  },
  {
    id: 'task-2-3',
    title: 'Schedule joint security & compliance review with Vertex InfoSec',
    noteId: 'note-2',
    blockId: 'b-2-6',
    noteTitle: 'Client Briefing: Vertex Mobility Expansion',
    status: 'done',
    priority: 'low',
    dueDate: '2026-10-06',
    timeEstimateMinutes: 30,
    timeboxSlot: 'afternoon',
    tags: ['compliance'],
    createdAt: '2026-10-04T11:30:00Z',
    completedAt: '2026-10-06T15:00:00Z',
  },
  {
    id: 'task-3-1',
    title: 'Protect Tuesday morning 9:00 - 12:00 for uninterrupted schema design',
    noteId: 'note-3',
    blockId: 'b-3-3',
    noteTitle: 'Weekly Focus Sprint & Deep Work Cadence',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-10-13',
    timeEstimateMinutes: 180,
    timeboxSlot: 'morning',
    tags: ['habits'],
    createdAt: '2026-10-05T07:50:00Z',
  },
  {
    id: 'task-3-2',
    title: 'Conduct Friday engineering retrospective with team at 16:00',
    noteId: 'note-3',
    blockId: 'b-3-4',
    noteTitle: 'Weekly Focus Sprint & Deep Work Cadence',
    status: 'todo',
    priority: 'low',
    dueDate: '2026-10-09',
    timeEstimateMinutes: 60,
    timeboxSlot: 'evening',
    tags: ['team'],
    createdAt: '2026-10-05T07:55:00Z',
  },
  // Standalone task captured without note (showing global ledger flexibility)
  {
    id: 'task-standalone-1',
    title: 'Review quarterly cloud infrastructure budget with finance',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-10-14',
    timeEstimateMinutes: 45,
    timeboxSlot: 'afternoon',
    tags: ['finance'],
    createdAt: '2026-10-06T10:00:00Z',
  },
];

const STORAGE_KEY_NOTES = 'folio_flow_notes_v1';
const STORAGE_KEY_TASKS = 'folio_flow_tasks_v1';
const STORAGE_KEY_NOTEBOOKS = 'folio_flow_notebooks_v1';

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTES);
    if (!raw) return INITIAL_NOTES;
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTES;
  }
}

export function saveNotes(notes: Note[]) {
  try {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save notes:', e);
  }
}

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (!raw) return INITIAL_TASKS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_TASKS;
  }
}

export function saveTasks(tasks: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks:', e);
  }
}

export function loadNotebooks(): Notebook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTEBOOKS);
    if (!raw) return INITIAL_NOTEBOOKS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTEBOOKS;
  }
}

export function saveNotebooks(notebooks: Notebook[]) {
  try {
    localStorage.setItem(STORAGE_KEY_NOTEBOOKS, JSON.stringify(notebooks));
  } catch (e) {
    console.error('Failed to save notebooks:', e);
  }
}
