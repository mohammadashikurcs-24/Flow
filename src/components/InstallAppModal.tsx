import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  Download, 
  Smartphone, 
  Laptop, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  X, 
  HardDrive, 
  Globe, 
  Code2
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExportModal: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  onOpenExportModal,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'data' | 'source'>('pwa');
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-neutral-900 text-white rounded-xl shadow-xs">
              <Download className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Download & Install Folio & Flow</h3>
              <p className="text-[11px] text-neutral-500">Run as a native app on your desktop, tablet, or phone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-100 px-6 pt-3 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`pb-2.5 transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'pwa'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Install as App (PWA)</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`pb-2.5 transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'data'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Download Data & Notes</span>
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={`pb-2.5 transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'source'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Source Code</span>
          </button>
        </div>

        {/* Tab 1: PWA Installation Guide */}
        {activeTab === 'pwa' && (
          <div className="p-6 space-y-5">
            {/* If browser supports 1-click install prompt */}
            {isInstallable && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-amber-900">One-Click Install Available</h4>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Your browser supports instant installation to your desktop or mobile apps.
                  </p>
                </div>
                <button
                  onClick={handleInstallClick}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer whitespace-nowrap transition-transform active:scale-95"
                >
                  {installSuccess ? 'Installed!' : 'Install Now'}
                </button>
              </div>
            )}

            {isInstalled && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>You are already running Folio & Flow in standalone app mode!</span>
              </div>
            )}

            {/* Desktop Instructions */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-neutral-700" />
                <h4 className="text-xs font-bold text-neutral-900">Chrome, Edge, or Brave (Mac & Windows)</h4>
              </div>
              <ol className="text-xs text-neutral-600 space-y-1.5 list-decimal list-inside pl-1">
                <li>
                  Look for the <strong>Install</strong> icon (computer with down arrow) on the right side of your browser address bar.
                </li>
                <li>
                  Click <strong>Install Folio & Flow</strong>.
                </li>
                <li>
                  Alternatively, click the browser menu (<strong>⋮</strong> or <strong>⋯</strong>) → <strong>Cast, save, and share</strong> → <strong>Install page as app</strong>.
                </li>
              </ol>
            </div>

            {/* iOS & Mobile Instructions */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-neutral-700" />
                <h4 className="text-xs font-bold text-neutral-900">iPhone / iPad (Safari) & Android</h4>
              </div>
              <div className="text-xs text-neutral-600 space-y-2">
                <p className="flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                  <span>On iOS Safari: Tap <strong>Share</strong> in the toolbar → select <strong>Add to Home Screen</strong>.</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <PlusSquare className="w-3.5 h-3.5 text-neutral-500" />
                  <span>On Android Chrome: Tap menu (<strong>⋮</strong>) → <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Data Download */}
        {activeTab === 'data' && (
          <div className="p-6 space-y-4">
            <p className="text-xs text-neutral-600 leading-relaxed">
              You own all your thinking and action history. You can download all your notes and tasks at any time:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <h4 className="text-xs font-bold text-neutral-900 mb-1">Markdown Documentation</h4>
                <p className="text-[11px] text-neutral-500 mb-3">Download as standard .md files readable in Obsidian, Notion, or any text editor.</p>
                <button
                  onClick={() => { onClose(); onOpenExportModal(); }}
                  className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 cursor-pointer"
                >
                  Download .md
                </button>
              </div>

              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <h4 className="text-xs font-bold text-neutral-900 mb-1">JSON Full Backup</h4>
                <p className="text-[11px] text-neutral-500 mb-3">Complete snapshot including timeboxes, priority matrices, and audio memos.</p>
                <button
                  onClick={() => { onClose(); onOpenExportModal(); }}
                  className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 cursor-pointer"
                >
                  Download .json
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Source Code & GitHub */}
        {activeTab === 'source' && (
          <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto">
            {/* Direct AI Studio GitHub Export */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-800" />
                <h4 className="text-xs font-bold text-amber-950">Option 1: Direct Export via AI Studio (Easiest)</h4>
              </div>
              <ol className="text-xs text-amber-900 space-y-1 list-decimal list-inside pl-1">
                <li>Look at the <strong>top right navigation bar of Google AI Studio</strong> (above this preview).</li>
                <li>Click the <strong>GitHub</strong> or <strong>Export</strong> icon button.</li>
                <li>Authorize your GitHub account and choose a repository name.</li>
                <li>AI Studio will automatically create the repo and push all source files directly.</li>
              </ol>
            </div>

            {/* Manual Terminal Push */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-neutral-800" />
                <h4 className="text-xs font-bold text-neutral-900">Option 2: Push via Terminal (Git CLI)</h4>
              </div>
              <p className="text-xs text-neutral-600">
                If you download the files to your computer or use your local terminal:
              </p>
              <div className="bg-neutral-900 text-neutral-100 rounded-lg p-3 font-mono text-[11px] space-y-1 select-all overflow-x-auto">
                <p className="text-neutral-400"># 1. Initialize git and commit:</p>
                <p className="text-emerald-400">git init</p>
                <p className="text-emerald-400">git add .</p>
                <p className="text-emerald-400">git commit -m "Initial commit of Folio & Flow"</p>
                <p className="text-neutral-400 pt-1"># 2. Link your GitHub repo & push:</p>
                <p className="text-emerald-400">git branch -M main</p>
                <p className="text-amber-300">git remote add origin https://github.com/&lt;USERNAME&gt;/&lt;REPO_NAME&gt;.git</p>
                <p className="text-emerald-400">git push -u origin main</p>
              </div>
            </div>

            <div className="text-[11px] text-neutral-500">
              Note: Remember to never commit API keys or sensitive secrets. All environmental variables are properly template in <code>.env.example</code>.
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-between text-xs">
          <span className="text-neutral-400 text-[11px]">Folio & Flow PWA v1.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
