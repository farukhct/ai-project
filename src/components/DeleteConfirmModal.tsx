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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-modal-backdrop select-none">
      <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-rose-600/60 rounded-2xl shadow-2xl shadow-black/80 max-w-md w-full p-6 space-y-4 animate-modal-card relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-rose-600 via-rose-400 to-rose-600" />

        <div className="flex items-center gap-3 text-rose-400">
          <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-100">Confirm Record Deletion</h3>
            <span className="text-[11px] text-neutral-400">Irreversible database operation</span>
          </div>
        </div>

        <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800/80 space-y-1.5 text-xs shadow-inner">
          <div className="text-neutral-400 font-mono">
            Serial No: <strong className="text-neutral-200">{caseItem.SerialNo}</strong>
          </div>
          <div className="text-neutral-400 font-medium">
            Case Number: <strong className="text-neutral-100">{caseItem.CaseNumber}</strong>
          </div>
          <div className="text-neutral-400">
            Result: <span className="text-amber-400 font-semibold">{caseItem.Result}</span>
          </div>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed font-medium">
          Are you sure you want to delete this case record?
        </p>

        <p className="text-[11px] text-neutral-500 leading-relaxed">
          This will permanently remove the case record, all associated hearing proceedings, and uploaded document attachments from the SQLite database.
        </p>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800/80 text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-3.5 py-2 bg-neutral-800/90 hover:bg-neutral-750 text-neutral-300 rounded-lg border border-neutral-700/60 transition-all form-pressable cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold rounded-lg shadow-md shadow-rose-950/50 disabled:opacity-50 transition-all form-pressable cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? 'Deleting...' : 'Delete Permanently'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
