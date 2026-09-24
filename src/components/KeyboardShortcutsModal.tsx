import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + N', desc: 'Open New Court Dairy Case Entry form' },
    { key: 'Ctrl + S', desc: 'Save current Case entry or proceeding' },
    { key: 'Ctrl + F', desc: 'Focus Global Search / Open Advanced Search' },
    { key: 'Ctrl + P', desc: 'Open Print Preview for current view or case' },
    { key: 'Ctrl + E', desc: 'Quick Export to Excel (.xlsx)' },
    { key: 'Esc', desc: 'Close any active modal, dialog, or overlay' },
    { key: 'F5', desc: 'Refresh case register and dashboard statistics' },
    { key: 'Double Click', desc: 'Double-click any case row to open dossier' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-neutral-100">Desktop Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-2 text-xs">
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 rounded bg-neutral-950/60 border border-neutral-800/80"
            >
              <span className="text-neutral-300">{s.desc}</span>
              <kbd className="font-mono text-[11px] text-amber-300 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 font-semibold shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
