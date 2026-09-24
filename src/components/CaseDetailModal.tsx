import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  FileText,
  Paperclip,
  Upload,
  Plus,
  CheckCircle,
  FileDown,
  Hash,
  BookOpen
} from 'lucide-react';
import { CourtCase, CaseProceeding, CaseDocument, ResultOption } from '../types.js';
import { toDisplayDate, getTodayIso } from '../utils/date.js';
import { api } from '../services/api.js';

interface Props {
  caseId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onEditCase: (caseItem: CourtCase) => void;
  onDeleteCase: (caseItem: CourtCase) => void;
  onPrintPreview: (title: string, cases: CourtCase[]) => void;
  resultsList: ResultOption[];
  onCaseUpdated?: () => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const CaseDetailModal: React.FC<Props> = ({
  caseId,
  isOpen,
  onClose,
  onEditCase,
  onDeleteCase,
  onPrintPreview,
  resultsList,
  onCaseUpdated,
  onToast
}) => {
  const [caseData, setCaseData] = useState<CourtCase | null>(null);
  const [proceedings, setProceedings] = useState<CaseProceeding[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // New Proceeding Form state
  const [showAddProceeding, setShowAddProceeding] = useState(false);
  const [hearingDateIso, setHearingDateIso] = useState(getTodayIso());
  const [businessRecorded, setBusinessRecorded] = useState('');
  const [nextHearingDateIso, setNextHearingDateIso] = useState('');
  const [benchNotes, setBenchNotes] = useState('');
  const [updateResult, setUpdateResult] = useState('');
  const [savingProceeding, setSavingProceeding] = useState(false);

  // New Document Upload state
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('Order Sheet');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (!caseId || !isOpen) return;

    loadCaseDetails(caseId);
  }, [caseId, isOpen]);

  const loadCaseDetails = async (id: number) => {
    try {
      setLoading(true);
      const res = await api.getCase(id);
      setCaseData(res.case);
      setProceedings(res.proceedings);
      setDocuments(res.documents);
      setUpdateResult(res.case.Result || 'Pending');
    } catch (err: any) {
      onToast('error', err.message || 'Failed to load case record.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !caseId) return null;

  const handleAddProceeding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessRecorded.trim()) {
      onToast('error', 'Business recorded is required.');
      return;
    }

    try {
      setSavingProceeding(true);
      await api.addProceeding(caseId, {
        hearingDate: hearingDateIso,
        businessRecorded: businessRecorded.trim(),
        nextHearingDate: nextHearingDateIso || undefined,
        benchNotes: benchNotes.trim() || undefined,
        updateResult: updateResult || undefined
      });

      onToast('success', 'Proceeding and bench notes recorded. Case diary updated.');
      setBusinessRecorded('');
      setBenchNotes('');
      setNextHearingDateIso('');
      setShowAddProceeding(false);
      loadCaseDetails(caseId);
      if (onCaseUpdated) onCaseUpdated();
    } catch (err: any) {
      onToast('error', err.message || 'Failed to record proceeding.');
    } finally {
      setSavingProceeding(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      onToast('error', 'Please select a document to upload.');
      return;
    }

    try {
      setUploadingDoc(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1] || '';
        await api.uploadDocument(caseId, {
          title: docTitle.trim() || uploadFile.name,
          documentType: docType,
          fileName: uploadFile.name,
          fileSize: uploadFile.size,
          mimeType: uploadFile.type || 'application/octet-stream',
          base64Data
        });

        onToast('success', 'Document securely attached to case.');
        setDocTitle('');
        setUploadFile(null);
        setShowUploadDoc(false);
        loadCaseDetails(caseId);
      };
      reader.readAsDataURL(uploadFile);
    } catch (err: any) {
      onToast('error', err.message || 'Failed to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDownloadDoc = async (docId: number) => {
    try {
      const doc = await api.downloadDocument(docId);
      const byteCharacters = atob(doc.base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: doc.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      onToast('error', err.message || 'Failed to download document.');
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this attached document?')) return;
    try {
      await api.deleteDocument(docId);
      onToast('success', 'Document deleted.');
      loadCaseDetails(caseId);
    } catch (err: any) {
      onToast('error', err.message || 'Failed to delete document.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-amber-500 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
              Serial #{caseData?.SerialNo}
            </span>
            <div>
              <h2 className="text-base font-bold text-neutral-100 font-serif tracking-tight">
                Case No: {caseData?.CaseNumber}
              </h2>
              <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                <span>Case Date: {caseData ? toDisplayDate(caseData.CaseDate) : '-'}</span>
                <span>·</span>
                <span className="text-amber-400 font-medium">Dairy Date: {caseData ? toDisplayDate(caseData.DairyDate) : '-'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {caseData && (
              <>
                <button
                  onClick={() => onPrintPreview(`Case #${caseData.CaseNumber} Dossier`, [caseData])}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded border border-neutral-700 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print Record</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onEditCase(caseData);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-xs rounded border border-neutral-700 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit Case</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onDeleteCase(caseData);
                  }}
                  className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
                  title="Delete Case"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {loading || !caseData ? (
            <div className="py-12 text-center text-neutral-400 animate-pulse">
              Loading case information and proceedings history...
            </div>
          ) : (
            <>
              {/* Primary Case Summary Card */}
              <div className="bg-neutral-950/60 border border-neutral-800 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">Status / Result</span>
                    <span className="font-semibold text-neutral-200 text-sm mt-0.5 inline-block">
                      {caseData.Result}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">Next Hearing (Dairy)</span>
                    <span className="font-semibold text-amber-400 font-mono text-sm mt-0.5 inline-block">
                      {toDisplayDate(caseData.DairyDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">Institution Date</span>
                    <span className="font-mono text-neutral-300 mt-0.5 inline-block">
                      {toDisplayDate(caseData.CaseDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">Recorded By</span>
                    <span className="text-neutral-300 mt-0.5 inline-block">
                      {caseData.CreatedBy || 'Officer'}
                    </span>
                  </div>
                </div>

                {caseData.Description && (
                  <div className="pt-2 border-t border-neutral-800">
                    <span className="text-neutral-500 text-[10px] uppercase block mb-1">Description</span>
                    <p className="text-neutral-200 whitespace-pre-wrap leading-relaxed">
                      {caseData.Description}
                    </p>
                  </div>
                )}

                {caseData.Remarks && (
                  <div className="pt-2 border-t border-neutral-800">
                    <span className="text-neutral-500 text-[10px] uppercase block mb-1">Remarks & Directives</span>
                    <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">
                      {caseData.Remarks}
                    </p>
                  </div>
                )}
              </div>

              {/* Proceedings & Real-time Bench Notes Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    <h3 className="font-semibold text-neutral-100 text-sm">
                      Hearing Proceedings & Real-time Bench Notes ({proceedings.length})
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowAddProceeding(!showAddProceeding)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-semibold rounded transition-colors text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddProceeding ? 'Cancel' : 'Record Hearing Entry'}</span>
                  </button>
                </div>

                {/* Add Proceeding Form */}
                {showAddProceeding && (
                  <form onSubmit={handleAddProceeding} className="bg-neutral-950 border border-amber-600/40 p-4 rounded-lg space-y-3 animate-fadeIn">
                    <h4 className="font-semibold text-amber-300 text-xs">Record Today's Proceedings & Bench Directives</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-neutral-400 text-[11px] mb-1">Hearing Date *</label>
                        <input
                          type="date"
                          value={hearingDateIso}
                          onChange={(e) => setHearingDateIso(e.target.value)}
                          required
                          className="w-full h-8 px-2 bg-neutral-900 border border-neutral-700 rounded text-neutral-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-400 text-[11px] mb-1">Next Dairy Date</label>
                        <input
                          type="date"
                          value={nextHearingDateIso}
                          onChange={(e) => setNextHearingDateIso(e.target.value)}
                          className="w-full h-8 px-2 bg-neutral-900 border border-neutral-700 rounded text-neutral-200 text-xs"
                        />
                        <span className="text-[10px] text-amber-400 mt-0.5 block">
                          Auto-reschedules Case Dairy Date
                        </span>
                      </div>
                      <div>
                        <label className="block text-neutral-400 text-[11px] mb-1">Update Result</label>
                        <select
                          value={updateResult}
                          onChange={(e) => setUpdateResult(e.target.value)}
                          className="w-full h-8 px-2 bg-neutral-900 border border-neutral-700 rounded text-neutral-200 text-xs"
                        >
                          {resultsList.map((r) => (
                            <option key={r.ResultID} value={r.ResultName}>
                              {r.ResultName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-neutral-400 text-[11px] mb-1">Business Recorded (Daily Order / Summary) *</label>
                      <textarea
                        rows={2}
                        value={businessRecorded}
                        onChange={(e) => setBusinessRecorded(e.target.value)}
                        placeholder="e.g. Accused present on bail. PW-1 examined in chief and cross examined. Put up for PW-2."
                        required
                        className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-neutral-200 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-400 text-[11px] mb-1">Judge / Bench Notes (Confidential)</label>
                      <textarea
                        rows={2}
                        value={benchNotes}
                        onChange={(e) => setBenchNotes(e.target.value)}
                        placeholder="e.g. Demeanor of witness noted. Prosecution requested final opportunity."
                        className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-neutral-200 text-xs font-mono"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddProceeding(false)}
                        className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded hover:bg-neutral-700 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingProceeding}
                        className="px-4 py-1 bg-amber-600 text-neutral-950 font-semibold rounded hover:bg-amber-500 disabled:opacity-50 text-xs"
                      >
                        {savingProceeding ? 'Recording...' : 'Commit Proceeding'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Proceedings Timeline */}
                {proceedings.length === 0 ? (
                  <div className="p-4 text-center text-neutral-500 bg-neutral-950/40 rounded-lg">
                    No proceedings entered yet. Use "Record Hearing Entry" above to log court proceedings.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {proceedings.map((proc) => (
                      <div key={proc.ID} className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-lg">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                            <strong className="text-neutral-200 font-mono">
                              Hearing: {toDisplayDate(proc.HearingDate)}
                            </strong>
                            {proc.NextHearingDate && (
                              <span className="text-neutral-400 font-mono text-[11px]">
                                → Next Dairy: {toDisplayDate(proc.NextHearingDate)}
                              </span>
                            )}
                          </div>
                          <span className="text-neutral-500 text-[10px]">
                            Recorded by {proc.CreatedBy}
                          </span>
                        </div>

                        <p className="text-neutral-200 leading-relaxed mt-1">
                          {proc.BusinessRecorded}
                        </p>

                        {proc.BenchNotes && (
                          <div className="mt-2 p-2 bg-neutral-900 border border-neutral-800 rounded text-[11px] text-amber-200/90 font-mono">
                            <span className="text-neutral-500 block text-[9px] uppercase">Bench Note</span>
                            {proc.BenchNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Case Documents & Attachments Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-sky-400" />
                    <h3 className="font-semibold text-neutral-100 text-sm">
                      Secure Documents & Record Attachments ({documents.length})
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowUploadDoc(!showUploadDoc)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 transition-colors text-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{showUploadDoc ? 'Cancel' : 'Upload Document'}</span>
                  </button>
                </div>

                {/* Upload Form */}
                {showUploadDoc && (
                  <form onSubmit={handleFileUpload} className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-neutral-400 text-[11px] mb-1">Document Title *</label>
                        <input
                          type="text"
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          placeholder="e.g. Order Sheet, Charge Sheet, Bail Application"
                          required
                          className="w-full h-8 px-2 bg-neutral-900 border border-neutral-700 rounded text-neutral-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-400 text-[11px] mb-1">Document Category</label>
                        <select
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          className="w-full h-8 px-2 bg-neutral-900 border border-neutral-700 rounded text-neutral-200 text-xs"
                        >
                          <option value="Order Sheet">Order Sheet</option>
                          <option value="Petition / Complaint">Petition / Complaint</option>
                          <option value="Charge Sheet / FIR">Charge Sheet / FIR</option>
                          <option value="Evidence / Exhibit">Evidence / Exhibit</option>
                          <option value="Written Statement">Written Statement</option>
                          <option value="Final Judgment">Final Judgment</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-neutral-400 text-[11px] mb-1">Select File (PDF, Word, Image, Scan)</label>
                      <input
                        type="file"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        required
                        className="w-full text-xs text-neutral-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowUploadDoc(false)}
                        className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded hover:bg-neutral-700 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={uploadingDoc}
                        className="px-4 py-1 bg-sky-600 text-white font-semibold rounded hover:bg-sky-500 disabled:opacity-50 text-xs"
                      >
                        {uploadingDoc ? 'Uploading...' : 'Save & Encrypt'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Documents List */}
                {documents.length === 0 ? (
                  <div className="p-4 text-center text-neutral-500 bg-neutral-950/40 rounded-lg">
                    No documents attached to this case. Click "Upload Document" to attach order sheets, petitions, or exhibits.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {documents.map((doc) => (
                      <div key={doc.ID} className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-md flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-neutral-200 truncate">{doc.Title}</div>
                          <div className="text-[10px] text-neutral-400 truncate">
                            {doc.DocumentType} · {doc.FileName}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleDownloadDoc(doc.ID)}
                            title="Download Document"
                            className="p-1 text-neutral-400 hover:text-sky-400 hover:bg-neutral-800 rounded transition-colors"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDoc(doc.ID)}
                            title="Delete Document"
                            className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
