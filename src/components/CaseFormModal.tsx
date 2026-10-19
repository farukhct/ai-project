import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Save,
  Calendar,
  Hash,
  Tag,
  FileText,
  AlertCircle,
  Clock,
  ChevronDown,
  Check,
  Edit3,
  ListFilter
} from 'lucide-react';
import { CourtCase, ResultOption } from '../types.js';

export const STANDARD_STATUS_OPTIONS = [
  'Pending',
  'Absolute',
  'Discharged',
  'Disposed of',
  'Disposed',
  'Allowed',
  'Dismissed',
  'Adjourned',
  'For Judgement',
  'Withdrawn',
  'Reserved',
  'Others'
];
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
  const [isManualResult, setIsManualResult] = useState<boolean>(false);
  const [manualResultText, setManualResultText] = useState<string>('');

  const computedResultOptions = useMemo(() => {
    const list = [...STANDARD_STATUS_OPTIONS];
    if (resultsList && resultsList.length > 0) {
      for (const r of resultsList) {
        if (
          r.ResultName &&
          r.IsActive !== 0 &&
          !list.some((item) => item.toLowerCase() === r.ResultName.trim().toLowerCase())
        ) {
          // Insert custom results before 'Others'
          list.splice(list.length - 1, 0, r.ResultName.trim());
        }
      }
    }
    return list;
  }, [resultsList]);

  const [dairyDateIso, setDairyDateIso] = useState<string>('');
  const [dairyDateInput, setDairyDateInput] = useState<string>('');

  const [description, setDescription] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Multi-case continuous entry state
  const [keepOpenContinuous, setKeepOpenContinuous] = useState(true);
  const [savedSessionCount, setSavedSessionCount] = useState(0);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const [duplicateWarning, setDuplicateWarning] = useState<CourtCase | null>(null);
  const [checkingCaseNo, setCheckingCaseNo] = useState(false);
  const caseNumberInputRef = useRef<HTMLInputElement>(null);
  const caseDatePickerRef = useRef<HTMLInputElement>(null);
  const dairyDatePickerRef = useRef<HTMLInputElement>(null);
  const prevIsOpenRef = useRef(false);

  // Initialize form state
  useEffect(() => {
    const wasOpen = prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    // Reset when modal freshly opens or editingCase changes
    if ((!wasOpen && isOpen) || editingCase) {
      const currentFormat = getStoredDateFormat();
      setDateFormat(currentFormat);
      setSaveSuccessNotice(null);

      if (editingCase) {
        setKeepOpenContinuous(false);
        setSavedSessionCount(0);
        setSerialNo(String(editingCase.SerialNo));
        const cIso = toIsoDate(editingCase.CaseDate) || getTodayIso();
        const dIso = toIsoDate(editingCase.DairyDate) || getTodayIso();
        setCaseDateIso(cIso);
        setCaseDateInput(formatDateByPattern(cIso, currentFormat));
        setCaseNumber(editingCase.CaseNumber || '');

        const rawRes = (editingCase.Result || 'Pending').trim();
        const match = STANDARD_STATUS_OPTIONS.find(
          (o) => o.toLowerCase() === rawRes.toLowerCase() && o !== 'Others'
        );
        if (match) {
          setResult(match);
          setIsManualResult(false);
          setManualResultText('');
        } else {
          setResult('Others');
          setIsManualResult(true);
          setManualResultText(rawRes === 'Others' || rawRes === 'Other' ? '' : rawRes);
        }

        setDairyDateIso(dIso);
        setDairyDateInput(formatDateByPattern(dIso, currentFormat));
        setDescription(editingCase.Description || '');
        setRemarks(editingCase.Remarks || '');
      } else {
        setKeepOpenContinuous(true);
        setSavedSessionCount(0);
        setSerialNo(String(nextSerial || 1));
        const today = getTodayIso();
        setCaseDateIso(today);
        setCaseDateInput(formatDateByPattern(today, currentFormat));
        setCaseNumber('');
        setResult('Pending');
        setIsManualResult(false);
        setManualResultText('');
        setDairyDateIso(today);
        setDairyDateInput(formatDateByPattern(today, currentFormat));
        setDescription('');
        setRemarks('');
      }
      setErrorMsg(null);
      setDuplicateWarning(null);
    }
  }, [editingCase, isOpen, nextSerial]);

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

  const handleSubmit = async (e?: React.FormEvent, forceClose: boolean = false) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSaveSuccessNotice(null);

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

    const finalResult = isManualResult
      ? (manualResultText.trim() || 'Others')
      : (result === 'Others' || result === 'Other' ? (manualResultText.trim() || 'Others') : result);

    if (!finalResult) {
      setErrorMsg('Please specify or select a Result/Status.');
      return;
    }

    try {
      setSubmitting(true);
      const currentSerialNum = parseInt(serialNo, 10) || nextSerial;
      await onSave({
        ID: editingCase ? editingCase.ID : undefined,
        SerialNo: currentSerialNum,
        serialNo: currentSerialNum,
        CaseDate: finalCaseDate,
        caseDate: finalCaseDate,
        CaseNumber: cleanCaseNo,
        caseNumber: cleanCaseNo,
        Result: finalResult,
        result: finalResult,
        DairyDate: finalDairyDate,
        dairyDate: finalDairyDate,
        Description: description.trim(),
        description: description.trim(),
        Remarks: remarks.trim(),
        remarks: remarks.trim()
      } as any);

      if (editingCase || forceClose || !keepOpenContinuous) {
        onClose();
      } else {
        // Continuous Multi-Case Entry Mode: keep form open for several entries at a time!
        const nextNum = currentSerialNum + 1;
        setSerialNo(String(nextNum));
        setCaseNumber('');
        setDescription('');
        setRemarks('');
        setDuplicateWarning(null);
        setSavedSessionCount((prev) => prev + 1);
        setSaveSuccessNotice(`✓ Case #${cleanCaseNo} recorded in Court Diary! Ready for entry #${nextNum}.`);
        setTimeout(() => {
          caseNumberInputRef.current?.focus();
        }, 50);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save case.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-modal-backdrop">
      <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-700/80 rounded-2xl shadow-2xl shadow-black/80 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-modal-card relative">
        {/* Top Accent Glow Bar */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800/90 bg-neutral-950/90 backdrop-blur-sm flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>{editingCase ? `Edit Case #${editingCase.CaseNumber}` : 'Add New Court Diary Entry'}</span>
              {!editingCase && savedSessionCount > 0 && (
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-700/80 text-emerald-300 animate-slide-down">
                  {savedSessionCount} {savedSessionCount === 1 ? 'case' : 'cases'} saved
                </span>
              )}
            </h2>
            <p className="text-[11px] text-neutral-400">
              {editingCase
                ? 'Update courtroom case record and proceedings schedule.'
                : 'Enter court diary cases continuously without leaving the form.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800/80 transition-colors form-pressable cursor-pointer"
            title="Close (Esc)"
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

        {/* Success Alert for Batch / Continuous Entry */}
        {saveSuccessNotice && (
          <div className="mx-5 mt-3 p-2.5 bg-emerald-950/70 border border-emerald-800/80 rounded-md text-xs text-emerald-200 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{saveSuccessNotice}</span>
            </div>
            {savedSessionCount > 0 && (
              <span className="px-2 py-0.5 bg-emerald-900/80 border border-emerald-700/60 rounded text-[11px] font-mono text-emerald-300 font-bold shrink-0">
                {savedSessionCount} recorded
              </span>
            )}
          </div>
        )}

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
              <label className="block text-neutral-300 font-medium mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-neutral-400" />
                <span>Serial Number (Sequential)</span>
              </label>
              <input
                type="number"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                required
                className="form-input-modern w-full h-9 px-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-200 font-mono text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Sequential register docket number.
              </span>
            </div>

            {/* Case Date with Dual Input (Custom text in selected format + Calendar Picker) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Case Date [{dateFormat}] *</span>
                </label>
                <button
                  type="button"
                  onClick={() => updateCaseDate(getTodayIso())}
                  className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors form-pressable font-medium"
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
                  className="form-input-modern w-full h-9 pl-3 pr-9 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-200 font-mono text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
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
                  className="absolute right-2 p-1.5 text-neutral-400 hover:text-amber-400 cursor-pointer pointer-events-none transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-[10px] text-neutral-400 font-mono mt-1 block">
                Standard: [{dateFormat}] {caseDateIso ? `(ISO: ${caseDateIso})` : ''}
              </span>
            </div>
          </div>

          {/* Row 2: Case Number & Result */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5 flex items-center justify-between">
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
                  placeholder="e.g. CM-104/2026, FMA-202/2026, FM-45/2026, FA-12/2026"
                  required
                  className="form-input-modern w-full h-9 px-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-100 font-semibold text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
                />
                {checkingCaseNo && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Quick Case Prefix Chips */}
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <span className="text-[10px] text-neutral-400 font-medium">Quick prefix:</span>
                {['CM-', 'FMA-', 'FM-', 'FA-', 'CR-', 'WP-', 'CrlM-', 'CP-', 'CA-', 'BA-'].map((p) => {
                  const isCurrent = caseNumber.trim().toUpperCase().startsWith(p.toUpperCase());
                  const isPrimary = ['CM-', 'FMA-', 'FM-', 'FA-'].includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        const trimmed = caseNumber.trim();
                        if (!trimmed.toUpperCase().startsWith(p.toUpperCase())) {
                          const numPart = trimmed.replace(/^[A-Za-z.-]+[-/]?\s*/, '');
                          setCaseNumber(p + numPart);
                        }
                        caseNumberInputRef.current?.focus();
                      }}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono border transition-all form-pressable cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-600/30 text-amber-300 border-amber-600/60 font-semibold shadow-sm'
                          : isPrimary
                          ? 'bg-neutral-850 hover:bg-neutral-750 text-amber-200/90 border-amber-800/40 hover:border-amber-600'
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-neutral-300 font-medium flex items-center gap-1.5 text-xs">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  <span>Result / Status *</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = !isManualResult;
                    setIsManualResult(nextMode);
                    if (nextMode && !manualResultText) {
                      setManualResultText(result !== 'Others' && result !== 'Other' ? result : '');
                    }
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer transition-colors"
                  title={isManualResult ? 'Choose from predefined list' : 'Type a custom result manually'}
                >
                  {isManualResult ? (
                    <>
                      <ListFilter className="w-3 h-3" />
                      <span>Choose from List</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3 h-3" />
                      <span>Enter Manually</span>
                    </>
                  )}
                </button>
              </div>

              {!isManualResult ? (
                <div className="space-y-1">
                  <select
                    value={result}
                    onChange={(e) => {
                      const val = e.target.value;
                      setResult(val);
                      if (val === 'Others' || val === 'Other') {
                        setIsManualResult(true);
                      }
                    }}
                    className="w-full h-8.5 px-3 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-amber-500 text-xs font-medium cursor-pointer"
                  >
                    {computedResultOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-neutral-500 block">
                    Choose standard judicial outcome, or click <strong className="text-amber-400 font-medium">Enter Manually</strong> to type.
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={manualResultText}
                      onChange={(e) => setManualResultText(e.target.value)}
                      placeholder="Type custom result (e.g. Absolute, Discharged, etc.)..."
                      autoFocus
                      className="w-full h-8.5 pl-3 pr-20 bg-neutral-950 border border-amber-500/80 rounded text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualResult(false);
                        setResult('Pending');
                      }}
                      className="absolute right-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-neutral-300 border border-neutral-700 cursor-pointer"
                      title="Return to dropdown list"
                    >
                      Use List
                    </button>
                  </div>

                  {/* Quick-select chips */}
                  <div className="flex items-center gap-1 flex-wrap text-[10px] text-neutral-400">
                    <span className="text-neutral-500">Quick fill:</span>
                    {STANDARD_STATUS_OPTIONS.filter((o) => o !== 'Others' && o !== 'Pending').map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setManualResultText(tag)}
                        className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          manualResultText.toLowerCase() === tag.toLowerCase()
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                className="form-input-modern w-full h-9 pl-3 pr-9 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-200 font-mono text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
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
                className="absolute right-2 p-1.5 text-neutral-400 hover:text-amber-400 cursor-pointer pointer-events-none transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="text-[10px] text-neutral-400 font-mono mt-1 block">
              Scheduled for Cause List: [{formatDateByPattern(dairyDateIso, dateFormat)}]
            </span>
          </div>

          {/* Row 4: Description */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
              Description (Case Facts / Parties / Subject Matter)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. State vs John Doe & Others; U/S 302/34 IPC; Fixed for recording prosecution witnesses"
              className="form-input-modern w-full p-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 leading-relaxed text-xs shadow-inner"
            />
          </div>

          {/* Row 5: Remarks */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
              Remarks (Bench Directives / Orders / Adjournment Details)
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Summons issued to witness #2; Next date peremptory for final arguments"
              className="form-input-modern w-full p-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 leading-relaxed text-xs shadow-inner"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            {!editingCase ? (
              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepOpenContinuous}
                  onChange={(e) => setKeepOpenContinuous(e.target.checked)}
                  className="rounded bg-neutral-900 border-neutral-700 text-amber-600 focus:ring-0"
                />
                <span className="text-[11px] text-neutral-300">
                  Keep open to enter several cases continuously
                </span>
              </label>
            ) : (
              <span className="text-neutral-500 hidden sm:inline">
                Press <kbd className="font-mono bg-neutral-800 px-1 py-0.5 rounded text-neutral-400">Ctrl+S</kbd> to save, <kbd className="font-mono bg-neutral-800 px-1 py-0.5 rounded text-neutral-400">Esc</kbd> to close
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-neutral-800/90 hover:bg-neutral-750 text-neutral-300 rounded-lg transition-colors form-pressable cursor-pointer border border-neutral-700/60"
            >
              {!editingCase && savedSessionCount > 0 ? `Done (${savedSessionCount} Saved)` : 'Cancel'}
            </button>

            {!editingCase && (
              <button
                type="button"
                onClick={() => handleSubmit(undefined, true)}
                disabled={submitting}
                className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-lg border border-neutral-700 disabled:opacity-50 transition-colors form-pressable cursor-pointer"
                title="Save this case and close modal"
              >
                Save & Close
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSubmit(undefined, false)}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-bold rounded-lg shadow-md shadow-amber-900/30 hover:shadow-amber-600/30 disabled:opacity-50 transition-all form-pressable cursor-pointer"
              title={!editingCase ? 'Save this case and prepare form for next entry' : 'Save changes'}
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {submitting
                  ? 'Saving...'
                  : !editingCase
                  ? 'Save Case'
                  : 'Update Case'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
