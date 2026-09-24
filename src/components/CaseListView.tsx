import React, { useState, useMemo } from 'react';
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
  Filter,
  Copy,
  Check,
  RotateCcw
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
  const [copiedCaseNo, setCopiedCaseNo] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  const [filterResult, setFilterResult] = useState('ALL');

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (filterResult !== 'ALL' && c.Result.toLowerCase() !== filterResult.toLowerCase()) {
        return false;
      }
      if (!localSearch.trim()) return true;
      const query = localSearch.trim().toLowerCase();
      return (
        c.CaseNumber.toLowerCase().includes(query) ||
        String(c.SerialNo).includes(query) ||
        (c.Description && c.Description.toLowerCase().includes(query)) ||
        (c.Remarks && c.Remarks.toLowerCase().includes(query)) ||
        (c.DisplayDairyDate && c.DisplayDairyDate.toLowerCase().includes(query)) ||
        (c.DisplayCaseDate && c.DisplayCaseDate.toLowerCase().includes(query))
      );
    });
  }, [cases, localSearch, filterResult]);

  const handleCopyCaseNo = (e: React.MouseEvent, caseNo: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(caseNo);
    setCopiedCaseNo(caseNo);
    setTimeout(() => setCopiedCaseNo(null), 2000);
  };

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
    exportToExcel(filteredCases, {
      title: 'Court_Dairy_Case_Register',
      courtName: courtName || 'Court Case Register',
      filterDescription: `Case Register View (${filteredCases.length} records)`
    });
  };

  const handleExportCsv = () => {
    exportToCsv(filteredCases, 'CourtDairy_CaseRegister.csv');
  };

  const handleExportWord = () => {
    exportToWord(filteredCases, {
      title: 'Court Diary Case Register',
      courtName: courtName || 'Court Case Register',
      filterDescription: `Current Register View (${filteredCases.length} records)`
    });
  };

  const handleExportPdf = () => {
    exportToPdf(filteredCases, {
      title: 'COURT DIARY CASE REGISTER',
      courtName: courtName || 'COURT OF BENCH OFFICER',
      filterDescription: `Current Register View (${filteredCases.length} records)`
    });
  };

  return (
    <div className="p-4 sm:p-5 space-y-3.5 max-w-7xl mx-auto flex flex-col h-full overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-lg shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Filter Search in Case Register */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filter by Case #, parties, facts..."
              className="h-8 pl-8 pr-7 bg-neutral-950 border border-neutral-700 rounded text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500 w-48 sm:w-64 transition-colors"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs font-mono"
              >
                ×
              </button>
            )}
          </div>

          {/* Result Filter Dropdown */}
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="h-8 px-2 bg-neutral-950 border border-neutral-700 rounded text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Outcomes</option>
            <option value="Pending">Pending</option>
            <option value="Adjourned">Adjourned</option>
            <option value="Disposed">Disposed</option>
            <option value="Allowed">Allowed</option>
            <option value="Dismissed">Dismissed</option>
            <option value="Reserved">Reserved</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>

          <span className="text-neutral-700 hidden sm:inline">|</span>

          <span className="text-xs text-neutral-400 hidden md:inline">
            Total in DB: <strong className="font-mono text-neutral-100 tabular-nums">{pagination.totalRecords}</strong>
            {filteredCases.length !== cases.length && (
              <span className="text-amber-400 ml-1.5 font-medium">
                (showing {filteredCases.length})
              </span>
            )}
          </span>

          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <span>Per page:</span>
            <select
              value={pagination.limit}
              onChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
              className="bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none"
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
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={handleExportCsv}
              title="Export to CSV"
              className="flex items-center gap-1 px-2 py-1 text-neutral-300 hover:text-sky-400 hover:bg-neutral-800 rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={handleExportWord}
              title="Export to Word (.doc)"
              className="flex items-center gap-1 px-2 py-1 text-neutral-300 hover:text-indigo-400 hover:bg-neutral-800 rounded transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Word</span>
            </button>
            <button
              onClick={handleExportPdf}
              title="Export to PDF"
              className="flex items-center gap-1 px-2 py-1 text-neutral-300 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>

          <button
            onClick={() => onPrintPreview('Court Diary Case Register', filteredCases)}
            className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded text-xs font-medium border border-neutral-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print View</span>
          </button>

          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded text-xs font-medium border border-neutral-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={onNewCase}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-neutral-950 px-3.5 py-1.5 rounded text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Case</span>
          </button>
        </div>
      </div>

      {/* Main Data Grid */}
      <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col shadow-sm">
        <div className="flex-1 overflow-auto">
          {filteredCases.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex p-3 bg-neutral-800/80 rounded-full text-neutral-400 mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-200">
                {cases.length === 0 ? 'No court case records in database.' : 'No cases match your filter criteria.'}
              </h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                {cases.length === 0
                  ? 'Your Court Dairy register is ready. Click below to record your first court case entry.'
                  : `No records match "${localSearch || filterResult}". You can clear filters or register a new case.`}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                {cases.length > 0 && (
                  <button
                    onClick={() => {
                      setLocalSearch('');
                      setFilterResult('ALL');
                    }}
                    className="inline-flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Filter</span>
                  </button>
                )}
                <button
                  onClick={onNewCase}
                  className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 px-4 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Case Record</span>
                </button>
              </div>
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
                    className="py-3 px-4 font-semibold w-52 cursor-pointer hover:text-white transition-colors"
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
                    Description / Parties
                  </th>
                  <th className="py-3 px-4 font-semibold min-w-[180px]">
                    Remarks / Bench Orders
                  </th>
                  <th className="py-3 px-3 font-semibold text-center w-28">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-sans">
                {filteredCases.map((c) => {
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
                        <div className="flex items-center gap-1.5 group/caseno">
                          <span className="font-mono text-amber-200/90 font-bold tracking-tight">
                            {c.CaseNumber}
                          </span>
                          <button
                            onClick={(e) => handleCopyCaseNo(e, c.CaseNumber)}
                            title="Copy Case Number"
                            className="opacity-0 group-hover/caseno:opacity-100 p-0.5 text-neutral-500 hover:text-amber-400 transition-opacity"
                          >
                            {copiedCaseNo === c.CaseNumber ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
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
              <strong className="text-neutral-200">{pagination.totalPages}</strong> ({pagination.totalRecords} total cases)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="font-mono text-neutral-300 px-1">
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
