import React, { useState } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Printer,
  FileSpreadsheet,
  FileText,
  Download,
  Upload,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { CourtCase, Pagination } from '../types.js';
import { toDisplayDate } from '../utils/date.js';
import { exportToExcel, exportToCsv, exportToWord, exportToPdf } from '../utils/export.js';

interface Props {
  cases: CourtCase[];
  pagination: Pagination;
  loading: boolean;
  sortBy: string;
  sortOrder: string;
  onSortChange: (column: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onViewCase: (id: number) => void;
  onEditCase: (caseItem: CourtCase) => void;
  onDeleteCase: (caseItem: CourtCase) => void;
  onNewCase: () => void;
  onOpenImport: () => void;
  onPrintPreview: (title: string, cases: CourtCase[]) => void;
  courtName?: string;
  userRole?: string;
}

export const CaseListView: React.FC<Props> = ({
  cases,
  pagination,
  loading,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  onLimitChange,
  onViewCase,
  onEditCase,
  onDeleteCase,
  onNewCase,
  onOpenImport,
  onPrintPreview,
  courtName,
  userRole
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 text-neutral-600 opacity-60 ml-1 inline" />;
    }
    return sortOrder.toUpperCase() === 'DESC' ? (
      <ArrowDown className="w-3 h-3 text-amber-500 ml-1 inline" />
    ) : (
      <ArrowUp className="w-3 h-3 text-amber-500 ml-1 inline" />
    );
  };

  const resultBadgeClass = (result: string) => {
    const r = (result || '').toLowerCase();
    if (r === 'pending') return 'text-amber-300 bg-amber-950/70 border-amber-800/80';
    if (['disposed', 'allowed'].includes(r)) return 'text-emerald-300 bg-emerald-950/70 border-emerald-800/80';
    if (['dismissed', 'withdrawn'].includes(r)) return 'text-rose-300 bg-rose-950/70 border-rose-800/80';
    if (r === 'adjourned') return 'text-sky-300 bg-sky-950/70 border-sky-800/80';
    if (r === 'reserved') return 'text-purple-300 bg-purple-950/70 border-purple-800/80';
    return 'text-neutral-300 bg-neutral-800 border-neutral-700';
  };

  const handleExportExcel = () => {
    exportToExcel(cases, {
      title: 'Court_Dairy_Case_Register',
      courtName: courtName || 'Court Case Register',
      filterDescription: `Page ${pagination.page} (${cases.length} records)`
    });
  };

  const handleExportCsv = () => {
    exportToCsv(cases, 'CourtDairy_CaseRegister.csv');
  };

  const handleExportWord = () => {
    exportToWord(cases, {
      title: 'Court Diary Case Register',
      courtName: courtName || 'Court Case Register',
      filterDescription: `Current Register View (${cases.length} records)`
    });
  };

  const handleExportPdf = () => {
    exportToPdf(cases, {
      title: 'COURT DIARY CASE REGISTER',
      courtName: courtName || 'COURT OF BENCH OFFICER',
      filterDescription: `Current Register View (${cases.length} records)`
    });
  };

  return (
    <div className="p-5 space-y-4 max-w-7xl mx-auto flex flex-col h-full overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">
            Total Records: <strong className="font-mono text-neutral-100 tabular-nums">{pagination.totalRecords}</strong>
          </span>
          <span className="text-neutral-700">|</span>
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <span>Per page:</span>
            <select
              value={pagination.limit}
              onChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
              className="bg-neutral-950 border border-neutral-700 rounded px-2 py-0.5 text-xs text-neutral-200 focus:outline-none"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        {/* Action buttons: Export & Add */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded border border-neutral-800 text-xs">
            <button
              onClick={handleExportExcel}
              title="Export to Excel (.xlsx)"
              className="flex items-center gap-1 px-2 py-1 text-neutral-300 hover:text-emerald-400 hover:bg-neutral-800 rounded transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportCsv}
              title="Export to CSV"
              className="flex items-center gap-1 px-2 py-1 text-neutral-300 hover:text-sky-400 hover:bg-neutral-800 rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportWord}
              title="Export to Word (.doc)"
              className="flex items-center gap-1 px-2 py-1 text-neutral-300 hover:text-indigo-400 hover:bg-neutral-800 rounded transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Word</span>
            </button>
            <button
              onClick={handleExportPdf}
              title="Export to PDF"
              className="flex items-center gap-1 px-2 py-1 text-neutral-300 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>

          <button
            onClick={() => onPrintPreview('Court Diary Case Register', cases)}
            className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded text-xs font-medium border border-neutral-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>

          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded text-xs font-medium border border-neutral-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          <button
            onClick={onNewCase}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-neutral-950 px-3 py-1.5 rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Case</span>
          </button>
        </div>
      </div>

      {/* Main Data Grid */}
      <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col shadow-sm">
        <div className="flex-1 overflow-auto">
          {cases.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex p-3 bg-neutral-800/80 rounded-full text-neutral-400 mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-200">No court case records found.</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                No entries match your search criteria or register is empty. Click below to add your first court case.
              </p>
              <button
                onClick={onNewCase}
                className="mt-4 inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 px-4 py-2 rounded text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Case Record</span>
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-neutral-950 border-b border-neutral-800 text-neutral-300 text-[11px] uppercase tracking-wider select-none shadow-sm">
                <tr>
                  <th
                    onClick={() => onSortChange('SerialNo')}
                    className="py-3 px-3.5 font-semibold text-center w-20 cursor-pointer hover:text-white transition-colors"
                  >
                    Serial No. {renderSortIcon('SerialNo')}
                  </th>
                  <th
                    onClick={() => onSortChange('CaseDate')}
                    className="py-3 px-3 font-semibold text-center w-28 cursor-pointer hover:text-white transition-colors"
                  >
                    Case Date {renderSortIcon('CaseDate')}
                  </th>
                  <th
                    onClick={() => onSortChange('CaseNumber')}
                    className="py-3 px-4 font-semibold w-48 cursor-pointer hover:text-white transition-colors"
                  >
                    Case Number {renderSortIcon('CaseNumber')}
                  </th>
                  <th
                    onClick={() => onSortChange('Result')}
                    className="py-3 px-3 font-semibold text-center w-28 cursor-pointer hover:text-white transition-colors"
                  >
                    Result {renderSortIcon('Result')}
                  </th>
                  <th
                    onClick={() => onSortChange('DairyDate')}
                    className="py-3 px-3 font-semibold text-center w-28 cursor-pointer hover:text-white transition-colors"
                  >
                    Dairy Date {renderSortIcon('DairyDate')}
                  </th>
                  <th className="py-3 px-4 font-semibold min-w-[200px]">
                    Description
                  </th>
                  <th className="py-3 px-4 font-semibold min-w-[180px]">
                    Remarks
                  </th>
                  <th className="py-3 px-3 font-semibold text-center w-28">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-sans">
                {cases.map((c) => {
                  const isSelected = selectedCaseId === c.ID;
                  return (
                    <tr
                      key={c.ID}
                      onClick={() => setSelectedCaseId(c.ID)}
                      onDoubleClick={() => onViewCase(c.ID)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-amber-950/30 text-neutral-100'
                          : 'hover:bg-neutral-800/50 text-neutral-300'
                      }`}
                    >
                      <td className="py-2.5 px-3.5 font-mono text-center text-neutral-400 tabular-nums">
                        {c.SerialNo}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-center text-neutral-300 tabular-nums">
                        {c.DisplayCaseDate || toDisplayDate(c.CaseDate)}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-neutral-100">
                        {c.CaseNumber}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${resultBadgeClass(c.Result)}`}>
                          {c.Result}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-center text-amber-300 font-medium tabular-nums">
                        {c.DisplayDairyDate || toDisplayDate(c.DairyDate)}
                      </td>
                      <td className="py-2.5 px-4 text-neutral-300 max-w-xs truncate" title={c.Description}>
                        {c.Description || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-neutral-400 max-w-xs truncate" title={c.Remarks}>
                        {c.Remarks || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewCase(c.ID)}
                            title="View Case Dossier & Proceedings"
                            className="p-1 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditCase(c)}
                            title="Edit Case"
                            className="p-1 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onPrintPreview(`Case #${c.CaseNumber} Summary Sheet`, [c])}
                            title="Print Case Summary Sheet"
                            className="p-1 text-neutral-400 hover:text-sky-400 hover:bg-neutral-800 rounded transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteCase(c)}
                            title="Delete Case Record"
                            className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {cases.length > 0 && (
          <div className="p-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400 select-none">
            <div>
              Showing page <strong className="text-neutral-200">{pagination.page}</strong> of{' '}
              <strong className="text-neutral-200">{pagination.totalPages}</strong> ({pagination.totalRecords} cases)
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                className="flex items-center gap-1 px-2.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-neutral-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="font-mono text-xs px-2 tabular-nums">
                {pagination.page} / {pagination.totalPages}
              </div>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="flex items-center gap-1 px-2.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-neutral-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
