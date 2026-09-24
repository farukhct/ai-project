import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { CourtCase } from '../types.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  caseItem: CourtCase | null;
  deleting: boolean;
}

export const DeleteConfirmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  caseItem,
  deleting
}) => {
  if (!isOpen || !caseItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-neutral-900 border border-rose-600/50 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
        <div className="flex items-center gap-3 text-rose-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <h3 className="font-bold text-sm text-neutral-100">Confirm Record Deletion</h3>
        </div>

        <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-1 text-xs">
          <div className="text-neutral-400 font-mono">
            Serial No: <strong className="text-neutral-200">{caseItem.SerialNo}</strong>
          </div>
          <div className="text-neutral-400 font-medium">
            Case Number: <strong className="text-neutral-100">{caseItem.CaseNumber}</strong>
          </div>
          <div className="text-neutral-400">
            Result: <span className="text-amber-400">{caseItem.Result}</span>
          </div>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed font-medium">
          Are you sure you want to delete this case record?
        </p>

        <p className="text-[11px] text-neutral-500">
          This will permanently remove the case record, all associated hearing proceedings, and uploaded document attachments from the SQLite database.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800 text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded shadow-sm disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? 'Deleting...' : 'Delete Permanently'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
