import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Calendar,
  Hash,
  Tag,
  FileText,
  AlertCircle,
  Clock,
  ChevronDown
} from 'lucide-react';
import { CourtCase, ResultOption } from '../types.js';
import {
  toIsoDate,
  getTodayIso,
  DateFormatPattern,
  DATE_FORMAT_OPTIONS,
  formatDateByPattern,
  getStoredDateFormat,
  setStoredDateFormat
} from '../utils/date.js';
import { api } from '../services/api.js';

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
  const [dateFormat, setDateFormat] = useState<DateFormatPattern>(getStoredDateFormat);

  const [serialNo, setSerialNo] = useState<string>('');
  const [caseDateIso, setCaseDateIso] = useState<string>('');
  const [caseDateInput, setCaseDateInput] = useState<string>('');

  const [caseNumber, setCaseNumber] = useState<string>('');
  const [result, setResult] = useState<string>('Pending');

  const [dairyDateIso, setDairyDateIso] = useState<string>('');
  const [dairyDateInput, setDairyDateInput] = useState<string>('');

  const [description, setDescription] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [duplicateWarning, setDuplicateWarning] = useState<CourtCase | null>(null);
  const [checkingCaseNo, setCheckingCaseNo] = useState(false);
  const caseNumberInputRef = useRef<HTMLInputElement>(null);
  const caseDatePickerRef = useRef<HTMLInputElement>(null);
  const dairyDatePickerRef = useRef<HTMLInputElement>(null);

  // Initialize form state
  useEffect(() => {
    const currentFormat = getStoredDateFormat();
    setDateFormat(currentFormat);

    if (editingCase) {
      setSerialNo(String(editingCase.SerialNo));
      const cIso = toIsoDate(editingCase.CaseDate) || getTodayIso();
      const dIso = toIsoDate(editingCase.DairyDate) || getTodayIso();
      setCaseDateIso(cIso);
      setCaseDateInput(formatDateByPattern(cIso, currentFormat));
      setCaseNumber(editingCase.CaseNumber || '');
      setResult(editingCase.Result || 'Pending');
      setDairyDateIso(dIso);
      setDairyDateInput(formatDateByPattern(dIso, currentFormat));
      setDescription(editingCase.Description || '');
      setRemarks(editingCase.Remarks || '');
    } else {
      setSerialNo(String(nextSerial || 1));
      const today = getTodayIso();
      setCaseDateIso(today);
      setCaseDateInput(formatDateByPattern(today, currentFormat));
      setCaseNumber('');
      setResult('Pending');
      setDairyDateIso(today);
      setDairyDateInput(formatDateByPattern(today, currentFormat));
      setDescription('');
      setRemarks('');
    }
    setErrorMsg(null);
    setDuplicateWarning(null);
  }, [editingCase, nextSerial, isOpen]);

  // Handle format change
  const handleFormatChange = (newFormat: DateFormatPattern) => {
    setDateFormat(newFormat);
    setStoredDateFormat(newFormat);
    if (caseDateIso) {
      setCaseDateInput(formatDateByPattern(caseDateIso, newFormat));
    }
    if (dairyDateIso) {
      setDairyDateInput(formatDateByPattern(dairyDateIso, newFormat));
    }
  };

  // Sync date text inputs with ISO changes
  const updateCaseDate = (iso: string) => {
    setCaseDateIso(iso);
    setCaseDateInput(formatDateByPattern(iso, dateFormat));
  };

  const updateDairyDate = (iso: string) => {
    setDairyDateIso(iso);
    setDairyDateInput(formatDateByPattern(iso, dateFormat));
  };

  // Handle manual typing in case date
  const handleCaseDateInputChange = (val: string) => {
    setCaseDateInput(val);
    const parsed = toIsoDate(val);
    if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
      setCaseDateIso(parsed);
    }
  };

  // Handle manual typing in dairy date
  const handleDairyDateInputChange = (val: string) => {
    setDairyDateInput(val);
    const parsed = toIsoDate(val);
    if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
      setDairyDateIso(parsed);
    }
  };

  // Auto focus Case Number field when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        caseNumberInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Duplicate Case Number live verification
  useEffect(() => {
    const cleanNo = caseNumber.trim();
    if (cleanNo.length < 2) {
      setDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingCaseNo(true);
        const res = await api.checkCaseNumber(cleanNo, editingCase ? editingCase.ID : null);
        if (res.exists && res.match) {
          setDuplicateWarning(res.match);
        } else {
          setDuplicateWarning(null);
        }
      } catch (err) {
        console.warn('Case number check failed', err);
      } finally {
        setCheckingCaseNo(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [caseNumber, editingCase]);

  // Quick preset helper for Dairy Date
  const addDaysToDairyDate = (days: number) => {
    const base = dairyDateIso ? new Date(dairyDateIso) : new Date();
    base.setDate(base.getDate() + days);
    const newIso = base.toISOString().split('T')[0];
    updateDairyDate(newIso);
  };

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
      caseNumberInputRef.current?.focus();
      return;
    }

    const finalCaseDate = caseDateIso || toIsoDate(caseDateInput);
    if (!finalCaseDate || !/^\d{4}-\d{2}-\d{2}$/.test(finalCaseDate)) {
      setErrorMsg(`Valid Case Date is required (Format: ${dateFormat}).`);
      return;
    }

    const finalDairyDate = dairyDateIso || toIsoDate(dairyDateInput);
    if (!finalDairyDate || !/^\d{4}-\d{2}-\d{2}$/.test(finalDairyDate)) {
      setErrorMsg(`Valid Dairy Date is required (Format: ${dateFormat}).`);
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        ID: editingCase ? editingCase.ID : undefined,
        SerialNo: parseInt(serialNo, 10) || nextSerial,
        serialNo: parseInt(serialNo, 10) || nextSerial,
        CaseDate: finalCaseDate,
        caseDate: finalCaseDate,
        CaseNumber: cleanCaseNo,
        caseNumber: cleanCaseNo,
        Result: result,
        result: result,
        DairyDate: finalDairyDate,
        dairyDate: finalDairyDate,
        Description: description.trim(),
        description: description.trim(),
        Remarks: remarks.trim(),
        remarks: remarks.trim()
      } as any);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save case.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>{editingCase ? `Edit Case #${editingCase.CaseNumber}` : 'Add New Court Diary Entry'}</span>
            </h2>
            <p className="text-[11px] text-neutral-400">
              Record official courtroom case proceedings and next cause list schedule.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date Format Standard Selector Toolbar */}
        <div className="bg-neutral-950/90 border-b border-neutral-800/80 px-5 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-neutral-300 font-medium">Date Format Standard:</span>
            <select
              value={dateFormat}
              onChange={(e) => handleFormatChange(e.target.value as DateFormatPattern)}
              className="bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1 text-xs text-amber-300 font-mono font-medium focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              {DATE_FORMAT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} (e.g. {opt.example})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
            <span>Current:</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-700/60 text-amber-300 font-bold">
              [{dateFormat}]
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-md text-xs text-rose-200 flex items-center gap-2 animate-fadeIn">
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
                className="w-full h-8.5 px-3 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                Sequential register docket number.
              </span>
            </div>

            {/* Case Date with Dual Input (Custom text in selected format + Calendar Picker) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Case Date [{dateFormat}] *</span>
                </label>
                <button
                  type="button"
                  onClick={() => updateCaseDate(getTodayIso())}
                  className="text-[10px] text-amber-400 hover:underline"
                >
                  Set Today
                </button>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={caseDateInput}
                  onChange={(e) => handleCaseDateInputChange(e.target.value)}
                  placeholder={`Format: ${dateFormat}`}
                  required
                  className="w-full h-8.5 pl-3 pr-9 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono focus:outline-none focus:border-amber-500"
                />
                {/* Hidden native picker button */}
                <input
                  ref={caseDatePickerRef}
                  type="date"
                  value={caseDateIso}
                  onChange={(e) => updateCaseDate(e.target.value)}
                  tabIndex={-1}
                  className="absolute right-2 opacity-0 w-6 h-6 pointer-events-auto cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => {
                    try {
                      caseDatePickerRef.current?.showPicker();
                    } catch {
                      caseDatePickerRef.current?.focus();
                    }
                  }}
                  title="Open Calendar Picker"
                  className="absolute right-2 p-1 text-neutral-400 hover:text-amber-400 cursor-pointer pointer-events-none"
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                Standard: [{dateFormat}] {caseDateIso ? `(ISO: ${caseDateIso})` : ''}
              </span>
            </div>
          </div>

          {/* Row 2: Case Number & Result */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>Case Number (Required) *</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {caseNumber.trim() ? `${caseNumber.trim().length} chars` : 'e.g. CR-104/2026'}
                </span>
              </label>
              <div className="relative">
                <input
                  ref={caseNumberInputRef}
                  type="text"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="e.g. CR-104/2026, WP-202/2026, CrlM-45/2026"
                  required
                  className="w-full h-8.5 px-3 bg-neutral-950 border border-neutral-700 rounded text-neutral-100 font-semibold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                {checkingCaseNo && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Quick Case Prefix Chips */}
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <span className="text-[10px] text-neutral-500">Quick prefix:</span>
                {['CR-', 'WP-', 'CrlM-', 'CP-', 'CA-', 'BA-', 'OS-'].map((p) => {
                  const isCurrent = caseNumber.trim().toUpperCase().startsWith(p.toUpperCase());
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        const trimmed = caseNumber.trim();
                        if (!trimmed.toUpperCase().startsWith(p.toUpperCase())) {
                          setCaseNumber(p + trimmed.replace(/^[A-Za-z.-]+[-/]?/, ''));
                        }
                        caseNumberInputRef.current?.focus();
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-600/30 text-amber-300 border-amber-600/60 font-semibold'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700/60'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* Duplicate Notice Banner */}
              {duplicateWarning && (
                <div className="mt-2 p-2 rounded bg-amber-950/40 border border-amber-800/80 text-[11px] text-amber-200 flex items-start gap-2 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-tight">
                    <strong>Notice:</strong> Case #{duplicateWarning.CaseNumber} already exists in register under <strong>Serial #{duplicateWarning.SerialNo}</strong> (Status: <em>{duplicateWarning.Result}</em>, Next Hearing: <em>{formatDateByPattern(duplicateWarning.DairyDate, dateFormat)}</em>).
                    <span className="block text-[10px] text-amber-300/80 mt-1">
                      You can still record this entry if filing an additional bench order/term, or verify the number if registering a new case.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-neutral-400" />
                <span>Result / Status</span>
              </label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="w-full h-8.5 px-3 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-amber-500"
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
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                Current judicial stage or disposition outcome.
              </span>
            </div>
          </div>

          {/* Row 3: Dairy Date (Next Cause List Date) with Format & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
              <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Dairy Date (Next Cause List Date) [{dateFormat}] *</span>
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-500 hidden sm:inline">Add:</span>
                <button
                  type="button"
                  onClick={() => addDaysToDairyDate(1)}
                  className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-amber-300 border border-neutral-700/60 cursor-pointer"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => addDaysToDairyDate(7)}
                  className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-amber-300 border border-neutral-700/60 cursor-pointer"
                >
                  +7 Days
                </button>
                <button
                  type="button"
                  onClick={() => addDaysToDairyDate(14)}
                  className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-amber-300 border border-neutral-700/60 cursor-pointer"
                >
                  +14 Days
                </button>
                <button
                  type="button"
                  onClick={() => addDaysToDairyDate(30)}
                  className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-amber-300 border border-neutral-700/60 cursor-pointer"
                >
                  +1 Month
                </button>
              </div>
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                value={dairyDateInput}
                onChange={(e) => handleDairyDateInputChange(e.target.value)}
                placeholder={`Format: ${dateFormat}`}
                required
                className="w-full h-8.5 pl-3 pr-9 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono focus:outline-none focus:border-amber-500"
              />
              {/* Hidden native picker button */}
              <input
                ref={dairyDatePickerRef}
                type="date"
                value={dairyDateIso}
                onChange={(e) => updateDairyDate(e.target.value)}
                tabIndex={-1}
                className="absolute right-2 opacity-0 w-6 h-6 pointer-events-auto cursor-pointer"
              />
              <button
                type="button"
                onClick={() => {
                  try {
                    dairyDatePickerRef.current?.showPicker();
                  } catch {
                    dairyDatePickerRef.current?.focus();
                  }
                }}
                title="Open Calendar Picker"
                className="absolute right-2 p-1 text-neutral-400 hover:text-amber-400 cursor-pointer pointer-events-none"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
              Scheduled for Cause List: [{formatDateByPattern(dairyDateIso, dateFormat)}]
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
              placeholder="e.g. State vs John Doe & Others; U/S 302/34 IPC; Fixed for recording prosecution witnesses"
              className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-amber-500 leading-relaxed text-xs"
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
              placeholder="e.g. Summons issued to witness #2; Next date peremptory for final arguments"
              className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-amber-500 leading-relaxed text-xs"
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
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-semibold rounded shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving Case...' : 'Save Case'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
