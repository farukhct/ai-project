import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const ImportModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, onToast }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<{
    successCount: number;
    failedCount: number;
    errors: { row: number; error: string }[];
  } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setImportReport(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (json.length > 0) {
          const rawHeaders = (json[0] as any[]).map(h => String(h || '').trim());
          setHeaders(rawHeaders);
          const rawData = json.slice(1).filter((r: any) => r && r.length > 0);
          const formatted = rawData.map((row: any) => {
            const item: Record<string, any> = {};
            rawHeaders.forEach((h, idx) => {
              item[h] = row[idx];
            });
            return item;
          });
          setParsedRows(formatted);
        }
      } catch (err: any) {
        onToast('error', 'Failed to parse file. Please verify CSV/Excel format.');
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) {
      onToast('error', 'No rows found in uploaded file.');
      return;
    }

    try {
      setImporting(true);
      const res = await api.bulkImport(parsedRows);
      setImportReport({
        successCount: res.successCount,
        failedCount: res.failedCount,
        errors: res.errors
      });
      onToast('success', `Imported ${res.successCount} cases successfully.`);
      onSuccess();
    } catch (err: any) {
      onToast('error', err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-neutral-100">Import Court Cases (CSV / Excel)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Select Excel Spreadsheet (.xlsx) or CSV (.csv)
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="w-full text-xs text-neutral-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-neutral-800 file:text-neutral-200"
            />
            <span className="text-[10px] text-neutral-500 mt-1 block">
              Supported columns: Serial No, Case Date, Case Number, Result, Dairy Date, Description, Remarks
            </span>
          </div>

          {/* Preview */}
          {parsedRows.length > 0 && !importReport && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-neutral-300 font-medium">
                <span>File Preview ({parsedRows.length} rows detected)</span>
                <span className="text-neutral-500 font-mono text-[11px]">{headers.join(', ')}</span>
              </div>

              <div className="max-h-48 overflow-auto border border-neutral-800 rounded bg-neutral-950">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 sticky top-0">
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i} className="p-2 truncate">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-sans">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-neutral-900/40">
                        {headers.map((h, i) => (
                          <td key={i} className="p-2 text-neutral-300 max-w-xs truncate">
                            {String(row[h] || '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Result Report */}
          {importReport && (
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
              <h3 className="font-semibold text-neutral-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Import Summary</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-neutral-900 rounded border border-emerald-800/50 text-emerald-300">
                  <span className="block text-[10px] uppercase text-neutral-400">Successfully Imported</span>
                  <strong className="text-lg font-mono">{importReport.successCount}</strong> rows
                </div>
                <div className="p-2.5 bg-neutral-900 rounded border border-rose-800/50 text-rose-300">
                  <span className="block text-[10px] uppercase text-neutral-400">Failed / Skipped</span>
                  <strong className="text-lg font-mono">{importReport.failedCount}</strong> rows
                </div>
              </div>

              {importReport.errors.length > 0 && (
                <div className="mt-2 text-[11px] text-rose-400 space-y-1 max-h-32 overflow-y-auto">
                  <span className="font-semibold block text-neutral-300">Error Details:</span>
                  {importReport.errors.map((e, idx) => (
                    <div key={idx} className="font-mono">
                      Row #{e.row}: {e.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
          >
            {importReport ? 'Close' : 'Cancel'}
          </button>
          {!importReport && (
            <button
              onClick={handleImportSubmit}
              disabled={importing || parsedRows.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-semibold rounded disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{importing ? 'Importing Records...' : 'Execute Import'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
