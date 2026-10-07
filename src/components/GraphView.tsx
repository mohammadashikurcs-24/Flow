import React, { useState, useMemo } from 'react';
import { Note, Task } from '../types';
import { ArrowLeft, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface GraphViewProps {
  notes: Note[];
  tasks: Task[];
  onOpenNote: (noteId: string) => void;
  onBackToWorkspace: () => void;
}

interface Node {
  id: string;
  type: 'note' | 'task' | 'tag';
  label: string;
  x: number;
  y: number;
  color: string;
  size: number;
  originalId: string;
  details?: string;
}

interface Link {
  source: string;
  target: string;
}

export const GraphView: React.FC<GraphViewProps> = ({
  notes,
  tasks,
  onOpenNote,
  onBackToWorkspace,
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Layout nodes around concentric orbits or radial layout
  const { nodes, links } = useMemo(() => {
    const nodesList: Node[] = [];
    const linksList: Link[] = [];

    const centerX = 500;
    const centerY = 400;
    const noteRadius = 220;

    // 1. Note Nodes (inner circle)
    notes.forEach((note, idx) => {
      const angle = (idx / Math.max(1, notes.length)) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * noteRadius;
      const y = centerY + Math.sin(angle) * noteRadius;

      nodesList.push({
        id: `note-${note.id}`,
        type: 'note',
        label: note.title || 'Untitled',
        x,
        y,
        color: '#0f172a',
        size: 14,
        originalId: note.id,
        details: `${note.blocks.length} blocks`,
      });

      // 2. Task Nodes connected to this note
      const noteTasks = tasks.filter((t) => t.noteId === note.id);
      noteTasks.forEach((task, tIdx) => {
        const taskAngle = angle + ((tIdx - (noteTasks.length - 1) / 2) * 0.28);
        const taskDist = noteRadius + 110 + (tIdx % 2) * 35;
        const tx = centerX + Math.cos(taskAngle) * taskDist;
        const ty = centerY + Math.sin(taskAngle) * taskDist;

        const taskId = `task-${task.id}`;
        nodesList.push({
          id: taskId,
          type: 'task',
          label: task.title,
          x: tx,
          y: ty,
          color: task.priority === 'high' ? '#e11d48' : task.priority === 'medium' ? '#d97706' : '#64748b',
          size: task.status === 'done' ? 6 : 9,
          originalId: task.id,
          details: `Priority: ${task.priority.toUpperCase()} · Status: ${task.status}`,
        });

        linksList.push({
          source: `note-${note.id}`,
          target: taskId,
        });
      });
    });

    // 3. Standalone Tasks
    const standaloneTasks = tasks.filter((t) => !t.noteId);
    standaloneTasks.forEach((task, idx) => {
      const angle = (idx / Math.max(1, standaloneTasks.length)) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * 70;
      const y = centerY + Math.sin(angle) * 70;
      nodesList.push({
        id: `task-${task.id}`,
        type: 'task',
        label: task.title,
        x,
        y,
        color: '#d97706',
        size: 8,
        originalId: task.id,
        details: 'Standalone task',
      });
    });

    return { nodes: nodesList, links: linksList };
  }, [notes, tasks]);

  const activeLinks = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const connected = new Set<string>();
    links.forEach((l) => {
      if (l.source === hoveredNodeId || l.target === hoveredNodeId) {
        connected.add(`${l.source}->${l.target}`);
      }
    });
    return connected;
  }, [hoveredNodeId, links]);

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-900 text-neutral-100 select-none relative overflow-hidden">
      {/* Top HUD */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between z-10 bg-neutral-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToWorkspace}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Editor</span>
          </button>
          <span className="text-sm font-semibold tracking-tight text-white">Thought Nexus & Action Constellation</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-lg">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
            className="p-1 hover:text-amber-400 cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono px-1 tabular-nums">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
            className="p-1 hover:text-amber-400 cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1 hover:text-amber-400 cursor-pointer"
            title="Reset zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="flex-1 flex items-center justify-center overflow-auto cursor-grab active:cursor-grabbing p-6">
        <svg
          viewBox="0 0 1000 800"
          className="w-full max-w-5xl h-auto transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Subtle Orbit Guides */}
          <circle cx="500" cy="400" r="70" fill="none" stroke="#262626" strokeDasharray="3 3" />
          <circle cx="500" cy="400" r="220" fill="none" stroke="#262626" strokeDasharray="4 4" />
          <circle cx="500" cy="400" r="330" fill="none" stroke="#1f1f1f" strokeDasharray="4 4" />

          {/* Links */}
          {links.map((link, idx) => {
            const sourceNode = nodes.find((n) => n.id === link.source);
            const targetNode = nodes.find((n) => n.id === link.target);
            if (!sourceNode || !targetNode) return null;

            const isHighlighted = activeLinks.has(`${link.source}->${link.target}`);

            return (
              <line
                key={idx}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={isHighlighted ? '#f59e0b' : '#3f3f46'}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeOpacity={isHighlighted ? 0.9 : 0.4}
                className="transition-all duration-200"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isHovered = hoveredNodeId === node.id;
            const isNote = node.type === 'note';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => {
                  if (isNote) onOpenNote(node.originalId);
                }}
                className="cursor-pointer"
              >
                {/* Outer Glow on hover */}
                {isHovered && (
                  <circle
                    r={node.size + 8}
                    fill={isNote ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.15)'}
                    className="animate-pulse"
                  />
                )}

                {/* Node Circle */}
                <circle
                  r={node.size}
                  fill={isNote ? '#f59e0b' : node.color}
                  stroke="#ffffff"
                  strokeWidth={isNote ? 2.5 : 1}
                  className="transition-transform duration-200"
                />

                {/* Node Label */}
                <text
                  y={node.size + 14}
                  textAnchor="middle"
                  className={`text-[10px] pointer-events-none select-none transition-colors ${
                    isHovered ? 'fill-white font-bold' : isNote ? 'fill-neutral-200 font-semibold' : 'fill-neutral-400'
                  }`}
                >
                  {node.label.length > 20 ? `${node.label.slice(0, 18)}…` : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node Detail Inspector Tooltip */}
      {hoveredNodeId && (
        <div className="absolute bottom-6 left-6 max-w-sm bg-neutral-800/95 border border-neutral-700 p-3 rounded-xl shadow-xl backdrop-blur-md">
          {(() => {
            const node = nodes.find((n) => n.id === hoveredNodeId);
            if (!node) return null;
            return (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  {node.type === 'note' ? 'Folio Node' : 'Linked Action Item'}
                </span>
                <p className="text-xs font-semibold text-white">{node.label}</p>
                {node.details && <p className="text-[11px] text-neutral-400 mt-1">{node.details}</p>}
                {node.type === 'note' && (
                  <p className="text-[10px] text-amber-300 mt-2 font-mono">Click to open this folio in editor →</p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
