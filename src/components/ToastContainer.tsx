import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types.js';

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<Props> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg shadow-xl border text-sm transition-all duration-200 ${
              isSuccess
                ? 'bg-neutral-900 border-emerald-600/50 text-neutral-100'
                : isError
                ? 'bg-neutral-900 border-rose-600/50 text-neutral-100'
                : isWarning
                ? 'bg-neutral-900 border-amber-600/50 text-neutral-100'
                : 'bg-neutral-900 border-neutral-700 text-neutral-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-sky-400" />}
            </div>

            <div className="flex-1 text-xs font-medium text-neutral-200 leading-relaxed">
              {toast.message}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-neutral-500 hover:text-neutral-300 transition-colors shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
