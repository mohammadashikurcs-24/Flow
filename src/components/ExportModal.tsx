import React, { useState } from 'react';
import { Note, Task, Notebook } from '../types';
import { Download, Upload, RotateCcw, X, FileText, Check } from 'lucide-react';
import { INITIAL_NOTES, INITIAL_TASKS, INITIAL_NOTEBOOKS } from '../utils/storage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  tasks: Task[];
  notebooks: Notebook[];
  onImportData: (data: { notes: Note[]; tasks: Task[]; notebooks: Notebook[] }) => void;
  onResetToDemo: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  notes,
  tasks,
  notebooks,
  onImportData,
  onResetToDemo,
}) => {
  const [copiedMd, setCopiedMd] = useState(false);

  if (!isOpen) return null;

  // Generate markdown representation of all notes and tasks
  const generateMarkdownBundle = () => {
    let md = `# Folio & Flow Workspace Export\n*Exported on ${new Date().toLocaleDateString()}*\n\n`;

    notes.forEach((note) => {
      md += `## ${note.title || 'Untitled Folio'}\n`;
      md += `*Notebook:* ${notebooks.find(nb => nb.id === note.folderId)?.name || 'General'} | *Updated:* ${new Date(note.updatedAt).toLocaleDateString()}\n\n`;

      note.blocks.forEach((block) => {
        if (block.type === 'h1') md += `# ${block.content}\n\n`;
        else if (block.type === 'h2') md += `## ${block.content}\n\n`;
        else if (block.type === 'h3') md += `### ${block.content}\n\n`;
        else if (block.type === 'quote') md += `> ${block.content}\n\n`;
        else if (block.type === 'bullet') md += `- ${block.content}\n`;
        else if (block.type === 'checklist') md += `- [${block.checked ? 'x' : ' '}] ${block.content}\n`;
        else if (block.type === 'code') md += `\`\`\`${block.codeLanguage || ''}\n${block.content}\n\`\`\`\n\n`;
        else md += `${block.content}\n\n`;
      });

      // Contextual Tasks
      const noteTasks = tasks.filter((t) => t.noteId === note.id);
      if (noteTasks.length > 0) {
        md += `### Live Actions for this Folio:\n`;
        noteTasks.forEach((t) => {
          md += `- [${t.status === 'done' ? 'x' : ' '}] **[${t.priority.toUpperCase()}]** ${t.title} ${t.dueDate ? `(Due: ${t.dueDate})` : ''}\n`;
        });
        md += `\n`;
      }

      md += `---\n\n`;
    });

    // Standalone Tasks
    const standalone = tasks.filter((t) => !t.noteId);
    if (standalone.length > 0) {
      md += `## Standalone Action Docket\n`;
      standalone.forEach((t) => {
        md += `- [${t.status === 'done' ? 'x' : ' '}] **[${t.priority.toUpperCase()}]** ${t.title} ${t.dueDate ? `(Due: ${t.dueDate})` : ''}\n`;
      });
    }

    return md;
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownBundle();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `folio-flow-export-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const data = { notes, tasks, notebooks, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `folio-flow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownBundle();
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.notes && json.tasks) {
          onImportData({
            notes: json.notes,
            tasks: json.tasks,
            notebooks: json.notebooks || INITIAL_NOTEBOOKS,
          });
          onClose();
        } else {
          alert('Invalid backup file structure.');
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 max-w-md w-full p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
          <h3 className="text-sm font-bold text-neutral-900">Data Management & Export</h3>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Markdown Export */}
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
            <h4 className="text-xs font-semibold text-neutral-800 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-neutral-600" />
              <span>Markdown Documentation</span>
            </h4>
            <p className="text-[11px] text-neutral-500 mb-3">
              Export all your folios with formatted blocks and integrated task checkboxes.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </button>
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200/60 rounded-lg cursor-pointer"
              >
                {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
                <span>{copiedMd ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>
            </div>
          </div>

          {/* JSON Backup & Restore */}
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
            <h4 className="text-xs font-semibold text-neutral-800 mb-1 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-neutral-600" />
              <span>JSON Backup & Migration</span>
            </h4>
            <p className="text-[11px] text-neutral-500 mb-3">
              Full workspace backup including all links, audio memos, and timeboxing metadata.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownloadJson}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Backup .json</span>
              </button>
              <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import Backup</span>
                <input type="file" accept=".json" onChange={handleImportJsonFile} className="hidden" />
              </label>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-2 flex items-center justify-between border-t border-neutral-100 text-xs">
            <button
              onClick={() => {
                if (window.confirm('Reset all folios and tasks to demo state?')) {
                  onResetToDemo();
                  onClose();
                }
              }}
              className="text-neutral-500 hover:text-rose-600 flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore Sample Folios & Tasks</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-neutral-900 text-white rounded-lg font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
