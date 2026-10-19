import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Save,
  Calendar,
  Hash,
  Tag,
  AlertCircle,
  Clock,
  Check,
  Edit3,
  ListFilter,
  FolderOpen,
  RotateCcw,
  Plus,
  ArrowRight,
  Eye,
  CheckCircle2,
  ListPlus
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

interface Props {
  editingCase: CourtCase | null;
  nextSerial: number;
  resultsList: ResultOption[];
  onSave: (caseData: Partial<CourtCase>) => Promise<void>;
  onNavigate: (view: string) => void;
  onClearEditing: () => void;
  onViewCase: (id: number) => void;
  onRefreshCases?: () => void;
}

export const CourtDiaryEntryView: React.FC<Props> = ({
  editingCase,
  nextSerial,
  resultsList,
  onSave,
  onNavigate,
  onClearEditing,
  onViewCase,
  onRefreshCases
}) => {
  const [dateFormat, setDateFormat] = useState<DateFormatPattern>(getStoredDateFormat);

  const [serialNo, setSerialNo] = useState<string>('');
  const [caseDateIso, setCaseDateIso] = useState<string>('');
  const [caseDateInput, setCaseDateInput] = useState<string>('');

  const [caseNumber, setCaseNumber] = useState<string>('');
  const [result, setResult] = useState<string>('Pending');
  const [isManualResult, setIsManualResult] = useState<boolean>(false);
  const [manualResultText, setManualResultText] = useState<string>('');

  const [dairyDateIso, setDairyDateIso] = useState<string>('');
  const [dairyDateInput, setDairyDateInput] = useState<string>('');

  const [description, setDescription] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Multi-case continuous entry state
  const [keepOpenContinuous, setKeepOpenContinuous] = useState(true);
  const [savedSessionCount, setSavedSessionCount] = useState(0);
  const [sessionSavedCases, setSessionSavedCases] = useState<Array<{
    serialNo: number;
    caseNumber: string;
    caseDate: string;
    dairyDate: string;
    result: string;
    id?: number;
  }>>([]);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const [duplicateWarning, setDuplicateWarning] = useState<CourtCase | null>(null);
  const [checkingCaseNo, setCheckingCaseNo] = useState(false);

  const caseNumberInputRef = useRef<HTMLInputElement>(null);
  const caseDatePickerRef = useRef<HTMLInputElement>(null);
  const dairyDatePickerRef = useRef<HTMLInputElement>(null);

  // Compute available result choices
  const computedResultOptions = useMemo(() => {
    const list = [...STANDARD_STATUS_OPTIONS];
    if (resultsList && resultsList.length > 0) {
      for (const r of resultsList) {
        if (
          r.ResultName &&
          r.IsActive !== 0 &&
          !list.some((item) => item.toLowerCase() === r.ResultName.trim().toLowerCase())
        ) {
          list.splice(list.length - 1, 0, r.ResultName.trim());
        }
      }
    }
    return list;
  }, [resultsList]);

  // Initialize or reset form state
  useEffect(() => {
    const currentFormat = getStoredDateFormat();
    setDateFormat(currentFormat);
    setSaveSuccessNotice(null);

    if (editingCase) {
      setKeepOpenContinuous(false);
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

    // Auto focus case number
    const timer = setTimeout(() => {
      caseNumberInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [editingCase, nextSerial]);

  // Handle format standard change
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

  const updateCaseDate = (iso: string) => {
    setCaseDateIso(iso);
    setCaseDateInput(formatDateByPattern(iso, dateFormat));
  };

  const updateDairyDate = (iso: string) => {
    setDairyDateIso(iso);
    setDairyDateInput(formatDateByPattern(iso, dateFormat));
  };

  const handleCaseDateInputChange = (val: string) => {
    setCaseDateInput(val);
    const parsed = toIsoDate(val);
    if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
      setCaseDateIso(parsed);
    }
  };

  const handleDairyDateInputChange = (val: string) => {
    setDairyDateInput(val);
    const parsed = toIsoDate(val);
    if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
      setDairyDateIso(parsed);
    }
  };

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

  const handleResetForm = () => {
    onClearEditing();
    setSerialNo(String(nextSerial || 1));
    const today = getTodayIso();
    setCaseDateIso(today);
    setCaseDateInput(formatDateByPattern(today, dateFormat));
    setCaseNumber('');
    setResult('Pending');
    setIsManualResult(false);
    setManualResultText('');
    setDairyDateIso(today);
    setDairyDateInput(formatDateByPattern(today, dateFormat));
    setDescription('');
    setRemarks('');
    setErrorMsg(null);
    setDuplicateWarning(null);
    setSaveSuccessNotice(null);
    setTimeout(() => {
      caseNumberInputRef.current?.focus();
    }, 50);
  };

  const handleSubmit = async (e?: React.FormEvent, navigateToRegister: boolean = false) => {
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

      // Track session entry
      setSessionSavedCases(prev => [
        {
          serialNo: currentSerialNum,
          caseNumber: cleanCaseNo,
          caseDate: finalCaseDate,
          dairyDate: finalDairyDate,
          result: finalResult,
          id: editingCase ? editingCase.ID : undefined
        },
        ...prev
      ]);

      if (navigateToRegister) {
        onClearEditing();
        onNavigate('case-list');
        return;
      }

      if (editingCase) {
        setSaveSuccessNotice(`✓ Case #${cleanCaseNo} updated successfully in Court Diary!`);
        onClearEditing();
      } else {
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

      if (onRefreshCases) {
        onRefreshCases();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save case.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusTone = (st: string) => {
    const s = (st || '').toLowerCase();
    if (s === 'pending') return 'text-amber-400 bg-amber-950/70 border-amber-800/80';
    if (['disposed', 'disposed of', 'allowed', 'absolute'].includes(s))
      return 'text-emerald-400 bg-emerald-950/70 border-emerald-800/80';
    if (['dismissed', 'withdrawn'].includes(s))
      return 'text-rose-400 bg-rose-950/70 border-rose-800/80';
    if (s === 'adjourned')
      return 'text-sky-400 bg-sky-950/70 border-sky-800/80';
    if (['reserved', 'for judgement'].includes(s))
      return 'text-purple-400 bg-purple-950/70 border-purple-800/80';
    return 'text-neutral-300 bg-neutral-800 border-neutral-700';
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900 overflow-hidden select-none">
      {/* Fixed Header Toolbar */}
      <div className="px-5 py-3.5 bg-neutral-950 border-b border-neutral-800 shrink-0 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-700/80 flex items-center justify-center text-emerald-400 shadow-inner">
            <FileText className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <span>{editingCase ? `Edit Case #${editingCase.CaseNumber}` : 'Add New Court Diary Entry'}</span>
              </h1>
              {editingCase && (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950/80 border border-amber-700/80 text-amber-300">
                  Editing Mode (Serial #{editingCase.SerialNo})
                </span>
              )}
              {!editingCase && savedSessionCount > 0 && (
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-700/80 text-emerald-300">
                  {savedSessionCount} {savedSessionCount === 1 ? 'case' : 'cases'} saved this session
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {editingCase
                ? 'Update courtroom case record and proceedings schedule.'
                : 'Fixed ledger form for continuous court diary entry without popups.'}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Date Format Standard Selector */}
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-700/80 rounded-lg px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-neutral-400 font-medium hidden sm:inline">Format:</span>
            <select
              value={dateFormat}
              onChange={(e) => handleFormatChange(e.target.value as DateFormatPattern)}
              className="bg-transparent text-amber-300 font-mono text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {DATE_FORMAT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-neutral-900 text-neutral-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset / New Form Button */}
          {editingCase ? (
            <button
              onClick={handleResetForm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium border border-neutral-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>New Entry Instead</span>
            </button>
          ) : (
            <button
              onClick={handleResetForm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium border border-neutral-700 transition-colors cursor-pointer"
              title="Clear all fields"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
              <span>Clear Form</span>
            </button>
          )}

          {/* Jump to Case Register */}
          <button
            onClick={() => onNavigate('case-list')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900/90 text-sky-200 text-xs font-semibold border border-sky-700/80 transition-colors cursor-pointer shadow-sm"
          >
            <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Case Register</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left / Primary Court Diary Entry Form (8 cols on lg) */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            
            {/* Success Alert Banner */}
            {saveSuccessNotice && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/90 rounded-xl text-xs text-emerald-200 flex items-center justify-between shadow-lg shadow-emerald-950/40">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-emerald-100">{saveSuccessNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('case-list')}
                  className="px-2.5 py-1 rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 font-medium text-[11px] border border-emerald-700/80 flex items-center gap-1 shrink-0 ml-2"
                >
                  <span>View Register</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Error Alert Banner */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-950/70 border border-rose-800/90 rounded-xl text-xs text-rose-200 flex items-center gap-2.5 shadow-lg">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Form Card Container */}
            <div className="bg-neutral-950/90 border border-neutral-800/90 rounded-2xl p-5 sm:p-6 shadow-xl relative backdrop-blur-sm">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 rounded-t-2xl" />

              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5 text-xs">
                
                {/* Row 1: Serial Number & Case Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Serial Number */}
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-amber-500" />
                      <span>Serial Number (Sequential)</span>
                    </label>
                    <input
                      type="number"
                      value={serialNo}
                      onChange={(e) => setSerialNo(e.target.value)}
                      required
                      className="form-input-modern w-full h-10 px-3 bg-neutral-900/90 border border-neutral-700 rounded-lg text-neutral-100 font-mono text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
                    />
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      Auto-generated docket register serial.
                    </span>
                  </div>

                  {/* Case Date */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-neutral-300 font-semibold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>Case Date [{dateFormat}] *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => updateCaseDate(getTodayIso())}
                        className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors font-semibold"
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
                        className="form-input-modern w-full h-10 pl-3 pr-10 bg-neutral-900/90 border border-neutral-700 rounded-lg text-neutral-100 font-mono text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
                      />
                      <input
                        ref={caseDatePickerRef}
                        type="date"
                        value={caseDateIso}
                        onChange={(e) => updateCaseDate(e.target.value)}
                        tabIndex={-1}
                        className="absolute right-2 opacity-0 w-7 h-7 pointer-events-auto cursor-pointer"
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
                        className="absolute right-2.5 p-1 text-neutral-400 hover:text-amber-400 cursor-pointer pointer-events-none transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>

                    <span className="text-[10px] text-neutral-400 font-mono mt-1 block">
                      Standard: [{dateFormat}] {caseDateIso ? `(ISO: ${caseDateIso})` : ''}
                    </span>
                  </div>
                </div>

                {/* Row 2: Case Number */}
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Case Number (Required) *</span>
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {caseNumber.trim() ? `${caseNumber.trim().length} chars` : 'e.g. CR-104/2026, CM-45/2026'}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      ref={caseNumberInputRef}
                      type="text"
                      value={caseNumber}
                      onChange={(e) => setCaseNumber(e.target.value)}
                      placeholder="e.g. CM-104/2026, FMA-202/2026, FM-45/2026, FA-12/2026, CR-88/2026"
                      required
                      className="form-input-modern w-full h-10 px-3 bg-neutral-900/90 border border-neutral-700 rounded-lg text-neutral-100 font-bold text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner tracking-wide"
                    />
                    {checkingCaseNo && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* Quick Case Prefix Chips */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
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
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-amber-600/30 text-amber-300 border-amber-600/60 font-bold shadow-sm'
                              : isPrimary
                              ? 'bg-neutral-850 hover:bg-neutral-800 text-amber-200/90 border-amber-800/40 hover:border-amber-600'
                              : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border-neutral-700/60'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  {/* Duplicate Notice Banner */}
                  {duplicateWarning && (
                    <div className="mt-2.5 p-3 rounded-lg bg-amber-950/50 border border-amber-800/90 text-xs text-amber-200 flex items-start gap-2.5 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1 leading-snug">
                        <strong>Notice:</strong> Case #{duplicateWarning.CaseNumber} already exists in register under <strong>Serial #{duplicateWarning.SerialNo}</strong> (Status: <em>{duplicateWarning.Result}</em>, Next Hearing: <em>{formatDateByPattern(duplicateWarning.DairyDate, dateFormat)}</em>).
                        <span className="block text-[11px] text-amber-300/80 mt-1">
                          You can still record this entry if filing an additional bench order/term, or verify the docket number if registering a new case.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Row 3: Result / Status */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-neutral-300 font-semibold flex items-center gap-1.5">
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
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer transition-colors"
                      title={isManualResult ? 'Choose from predefined list' : 'Type a custom result manually'}
                    >
                      {isManualResult ? (
                        <>
                          <ListFilter className="w-3.5 h-3.5" />
                          <span>Choose from Predefined List</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Enter Status Manually</span>
                        </>
                      )}
                    </button>
                  </div>

                  {!isManualResult ? (
                    <div className="space-y-1.5">
                      <select
                        value={result}
                        onChange={(e) => {
                          const val = e.target.value;
                          setResult(val);
                          if (val === 'Others' || val === 'Other') {
                            setIsManualResult(true);
                          }
                        }}
                        className="w-full h-10 px-3 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:border-amber-500 text-xs font-semibold cursor-pointer"
                      >
                        {computedResultOptions.map((opt) => (
                          <option key={opt} value={opt} className="bg-neutral-900 text-neutral-200">
                            {opt}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-neutral-500 block">
                        Choose standard judicial outcome, or click <strong className="text-amber-400 font-medium">Enter Status Manually</strong> to type.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={manualResultText}
                          onChange={(e) => setManualResultText(e.target.value)}
                          placeholder="Type custom status (e.g. Absolute, Discharged, Pending Argument)..."
                          autoFocus
                          className="w-full h-10 pl-3 pr-24 bg-neutral-900 border border-amber-500/80 rounded-lg text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsManualResult(false);
                            setResult('Pending');
                          }}
                          className="absolute right-2 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-[11px] text-neutral-300 border border-neutral-700 cursor-pointer font-medium"
                          title="Return to dropdown list"
                        >
                          Use List
                        </button>
                      </div>

                      {/* Quick fill chips */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-neutral-400">
                        <span className="text-neutral-500">Quick fill:</span>
                        {STANDARD_STATUS_OPTIONS.filter((o) => o !== 'Others' && o !== 'Pending').map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setManualResultText(tag)}
                            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              manualResultText.toLowerCase() === tag.toLowerCase()
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
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

                {/* Row 4: Dairy Date (Next Cause List Date) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <label className="text-neutral-300 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Dairy Date (Next Cause List Date) [{dateFormat}] *</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-neutral-500 hidden sm:inline">Add:</span>
                      <button
                        type="button"
                        onClick={() => addDaysToDairyDate(1)}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-750 text-[11px] text-amber-300 border border-neutral-700/70 cursor-pointer font-medium"
                      >
                        Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => addDaysToDairyDate(7)}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-750 text-[11px] text-amber-300 border border-neutral-700/70 cursor-pointer font-medium"
                      >
                        +7 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => addDaysToDairyDate(14)}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-750 text-[11px] text-amber-300 border border-neutral-700/70 cursor-pointer font-medium"
                      >
                        +14 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => addDaysToDairyDate(30)}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-750 text-[11px] text-amber-300 border border-neutral-700/70 cursor-pointer font-medium"
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
                      className="form-input-modern w-full h-10 pl-3 pr-10 bg-neutral-900/90 border border-neutral-700 rounded-lg text-neutral-100 font-mono text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
                    />
                    <input
                      ref={dairyDatePickerRef}
                      type="date"
                      value={dairyDateIso}
                      onChange={(e) => updateDairyDate(e.target.value)}
                      tabIndex={-1}
                      className="absolute right-2 opacity-0 w-7 h-7 pointer-events-auto cursor-pointer"
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
                      className="absolute right-2.5 p-1 text-neutral-400 hover:text-amber-400 cursor-pointer pointer-events-none transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-[10px] text-neutral-400 font-mono mt-1 block">
                    Scheduled for Cause List: [{formatDateByPattern(dairyDateIso, dateFormat)}]
                  </span>
                </div>

                {/* Row 5: Description */}
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1.5">
                    Description (Case Facts / Parties / Subject Matter / Sections)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. State vs John Doe & Others; U/S 302/34 IPC; Fixed for recording prosecution witnesses"
                    className="form-input-modern w-full p-3 bg-neutral-900/90 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 leading-relaxed text-xs shadow-inner"
                  />
                </div>

                {/* Row 6: Remarks */}
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1.5">
                    Remarks (Bench Directives / Orders / Adjournment Details)
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Summons issued to witness #2; Next date peremptory for final arguments"
                    className="form-input-modern w-full p-3 bg-neutral-900/90 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 leading-relaxed text-xs shadow-inner"
                  />
                </div>

                {/* Submit Controls Toolbar */}
                <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 text-xs">
                      Press <kbd className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300 border border-neutral-700">Ctrl+S</kbd> to save quickly
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 ml-auto">
                    {/* Save & View in Register */}
                    <button
                      type="button"
                      onClick={() => handleSubmit(undefined, true)}
                      disabled={submitting}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-semibold rounded-lg border border-neutral-700 disabled:opacity-50 transition-colors cursor-pointer text-xs flex items-center gap-1.5 shadow"
                      title="Save this case and jump directly to Case Register"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
                      <span>Save & Go to Register</span>
                    </button>

                    {/* Primary Save Case Record */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-lg shadow-lg shadow-emerald-950/60 disabled:opacity-50 transition-all cursor-pointer text-xs"
                      title={!editingCase ? 'Save case in diary and prepare form for next serial entry' : 'Save changes'}
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {submitting
                          ? 'Saving Case...'
                          : !editingCase
                          ? 'Save Case Entry'
                          : 'Update Case Record'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right Panel: Live Session Records & Quick Docket Reference (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Session Activity Card */}
            <div className="bg-neutral-950/90 border border-neutral-800/90 rounded-2xl p-4.5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <ListPlus className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-neutral-200">
                    Session Docket Entries
                  </h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-750 text-neutral-300 font-semibold">
                  {sessionSavedCases.length} entered
                </span>
              </div>

              {sessionSavedCases.length === 0 ? (
                <div className="py-8 text-center text-neutral-500 text-xs">
                  <FileText className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                  <p className="font-medium text-neutral-400">No cases recorded yet this session.</p>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    Newly saved court entries will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {sessionSavedCases.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 rounded-xl transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-neutral-500">
                          #{c.serialNo}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusTone(c.result)}`}>
                          {c.result}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-neutral-100 mt-1">
                        {c.caseNumber}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800 text-[10px] text-neutral-400">
                        <span>Case: {formatDateByPattern(c.caseDate, dateFormat)}</span>
                        <span className="text-amber-400/90 font-medium">
                          Next: {formatDateByPattern(c.dairyDate, dateFormat)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* View Register Link */}
              <div className="mt-4 pt-3 border-t border-neutral-800 text-center">
                <button
                  type="button"
                  onClick={() => onNavigate('case-list')}
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white rounded-lg text-xs font-medium border border-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
                  <span>Open Complete Case Register</span>
                </button>
              </div>
            </div>

            {/* Quick Tips & System Status Card */}
            <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-4 text-xs text-neutral-400 space-y-2.5">
              <h4 className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Court Diary Ledger Guidance</span>
              </h4>
              <ul className="space-y-1.5 text-[11px] text-neutral-400 leading-relaxed list-disc list-inside">
                <li>
                  <strong className="text-neutral-300">Continuous Entry:</strong> Serial number automatically increments after each save.
                </li>
                <li>
                  <strong className="text-neutral-300">Case Prefixes:</strong> Click prefix chips (CM-, FMA-, CR-) to fast-format docket numbers.
                </li>
                <li>
                  <strong className="text-neutral-300">Next Hearing:</strong> Use +7 Days or +14 Days buttons to schedule diary hearings swiftly.
                </li>
                <li>
                  <strong className="text-neutral-300">Date Formats:</strong> Change format standard from the top dropdown anytime without data loss.
                </li>
              </ul>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
