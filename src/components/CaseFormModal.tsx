import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Hash, Tag, FileText, AlertCircle } from 'lucide-react';
import { CourtCase, ResultOption } from '../types.js';
import { toDisplayDate, toIsoDate, getTodayIso } from '../utils/date.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (caseData: Partial<CourtCase>) => Promise<void>;
  editingCase: CourtCase | null;
  nextSerial: number;
  resultsList: ResultOption[];
}

export const CaseFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  editingCase,
  nextSerial,
  resultsList
}) => {
  const [serialNo, setSerialNo] = useState<string>('');
  const [caseDateIso, setCaseDateIso] = useState<string>('');
  const [caseNumber, setCaseNumber] = useState<string>('');
  const [result, setResult] = useState<string>('Pending');
  const [dairyDateIso, setDairyDateIso] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingCase) {
      setSerialNo(String(editingCase.SerialNo));
      setCaseDateIso(toIsoDate(editingCase.CaseDate) || getTodayIso());
      setCaseNumber(editingCase.CaseNumber || '');
      setResult(editingCase.Result || 'Pending');
      setDairyDateIso(toIsoDate(editingCase.DairyDate) || getTodayIso());
      setDescription(editingCase.Description || '');
      setRemarks(editingCase.Remarks || '');
    } else {
      setSerialNo(String(nextSerial || 1));
      setCaseDateIso(getTodayIso());
      setCaseNumber('');
      setResult('Pending');
      setDairyDateIso(getTodayIso());
      setDescription('');
      setRemarks('');
    }
    setErrorMsg(null);
  }, [editingCase, nextSerial, isOpen]);

  // Keyboard shortcut: Ctrl+S to save, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const cleanCaseNo = caseNumber.trim();
    if (!cleanCaseNo) {
      setErrorMsg('Case Number is required.');
      return;
    }
    if (!caseDateIso) {
      setErrorMsg('Case Date is required.');
      return;
    }
    if (!dairyDateIso) {
      setErrorMsg('Dairy Date is required.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        ID: editingCase ? editingCase.ID : undefined,
        SerialNo: parseInt(serialNo, 10) || nextSerial,
        CaseDate: caseDateIso,
        CaseNumber: cleanCaseNo,
        Result: result,
        DairyDate: dairyDateIso,
        Description: description.trim(),
        Remarks: remarks.trim()
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save case.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>{editingCase ? `Edit Case #${editingCase.CaseNumber}` : 'Add New Court Dairy Entry'}</span>
            </h2>
            <p className="text-[11px] text-neutral-400">
              Enter official case diary details. Dates are formatted as DD-MM-YYYY.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-md text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Row 1: Serial No & Case Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-neutral-400" />
                <span>Serial Number (Sequential)</span>
              </label>
              <input
                type="number"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                required
                className="w-full h-8 px-3 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                Auto-assigned next available serial number.
              </span>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>Case Date (DD-MM-YYYY) *</span>
              </label>
              <input
                type="date"
                value={caseDateIso}
                onChange={(e) => setCaseDateIso(e.target.value)}
                required
                className="w-full h-8 px-3 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                Display: {toDisplayDate(caseDateIso) || 'DD-MM-YYYY'}
              </span>
            </div>
          </div>

          {/* Row 2: Case Number & Result */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Case Number (Required) *
              </label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="e.g. CR-104/2026, BA-45/2026"
                required
                className="w-full h-8 px-3 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-medium focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                Official court case reference or registration number.
              </span>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-neutral-400" />
                <span>Result / Status</span>
              </label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="w-full h-8 px-3 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-amber-500"
              >
                {resultsList.length === 0 ? (
                  <>
                    <option value="Pending">Pending</option>
                    <option value="Adjourned">Adjourned</option>
                    <option value="Disposed">Disposed</option>
                    <option value="Allowed">Allowed</option>
                    <option value="Dismissed">Dismissed</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Withdrawn">Withdrawn</option>
                    <option value="Other">Other</option>
                  </>
                ) : (
                  resultsList.map((r) => (
                    <option key={r.ResultID} value={r.ResultName}>
                      {r.ResultName}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Row 3: Dairy Date */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Dairy Date (Next Scheduled Hearing) *</span>
            </label>
            <input
              type="date"
              value={dairyDateIso}
              onChange={(e) => setDairyDateIso(e.target.value)}
              required
              className="w-full h-8 px-3 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-amber-500"
            />
            <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
              Scheduled for: {toDisplayDate(dairyDateIso) || 'DD-MM-YYYY'}
            </span>
          </div>

          {/* Row 4: Description */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Description (Case Facts / Parties / Subject Matter)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. State vs John Doe; U/S 302/34 IPC; For prosecution witnesses"
              className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Row 5: Remarks */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Remarks (Bench Directives / Orders / Adjournment Details)
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Summons re-issued to witness #2; Next date peremptory"
              className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs">
          <span className="text-neutral-500 hidden sm:inline">
            Press <kbd className="font-mono bg-neutral-800 px-1 py-0.5 rounded text-neutral-400">Ctrl+S</kbd> to save, <kbd className="font-mono bg-neutral-800 px-1 py-0.5 rounded text-neutral-400">Esc</kbd> to cancel
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-semibold rounded shadow-sm disabled:opacity-50 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : 'Save Case'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
