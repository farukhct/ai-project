import React, { useState } from 'react';
import { Search, RotateCcw, Printer, FileSpreadsheet, FileText, Download, Eye, Edit2 } from 'lucide-react';
import { CourtCase, ResultOption } from '../types.js';
import { toDisplayDate, toIsoDate } from '../utils/date.js';
import { exportToExcel, exportToCsv, exportToWord, exportToPdf } from '../utils/export.js';
import { api } from '../services/api.js';

interface Props {
  resultsList: ResultOption[];
  onViewCase: (id: number) => void;
  onEditCase: (c: CourtCase) => void;
  onPrintPreview: (title: string, cases: CourtCase[]) => void;
  courtName?: string;
}

export const AdvancedSearchView: React.FC<Props> = ({
  resultsList,
  onViewCase,
  onEditCase,
  onPrintPreview,
  courtName
}) => {
  const [serialFrom, setSerialFrom] = useState('');
  const [serialTo, setSerialTo] = useState('');
  const [caseDateFrom, setCaseDateFrom] = useState('');
  const [caseDateTo, setCaseDateTo] = useState('');
  const [dairyDateFrom, setDairyDateFrom] = useState('');
  const [dairyDateTo, setDairyDateTo] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [result, setResult] = useState('All');
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');

  const [searchResults, setSearchResults] = useState<CourtCase[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const res = await api.getCases({
        serialFrom: serialFrom ? parseInt(serialFrom, 10) : '',
        serialTo: serialTo ? parseInt(serialTo, 10) : '',
        caseDateFrom: caseDateFrom ? toIsoDate(caseDateFrom) : '',
        caseDateTo: caseDateTo ? toIsoDate(caseDateTo) : '',
        dairyDateFrom: dairyDateFrom ? toIsoDate(dairyDateFrom) : '',
        dairyDateTo: dairyDateTo ? toIsoDate(dairyDateTo) : '',
        caseNumber: caseNumber.trim(),
        result: result === 'All' ? '' : result,
        description: description.trim(),
        remarks: remarks.trim(),
        limit: 500
      });
      setSearchResults(res.records);
      setHasSearched(true);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSerialFrom('');
    setSerialTo('');
    setCaseDateFrom('');
    setCaseDateTo('');
    setDairyDateFrom('');
    setDairyDateTo('');
    setCaseNumber('');
    setResult('All');
    setDescription('');
    setRemarks('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleExportExcel = () => {
    exportToExcel(searchResults, {
      title: 'Court_Dairy_Advanced_Search',
      courtName: courtName || 'Court Case Register',
      filterDescription: 'Advanced Search Query Results'
    });
  };

  const handleExportCsv = () => {
    exportToCsv(searchResults, 'CourtDairy_AdvancedSearch.csv');
  };

  const handleExportWord = () => {
    exportToWord(searchResults, {
      title: 'Advanced Search Case Report',
      courtName: courtName || 'Court Case Register',
      filterDescription: 'Advanced Search Filtered Cases'
    });
  };

  const handleExportPdf = () => {
    exportToPdf(searchResults, {
      title: 'ADVANCED SEARCH CASE REPORT',
      courtName: courtName || 'COURT OF BENCH OFFICER',
      filterDescription: 'Advanced Search Filtered Cases'
    });
  };

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto flex flex-col h-full overflow-y-auto">
      {/* Search Criteria Form */}
      <form onSubmit={handleSearch} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <h2 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-500" />
            <span>Advanced Search Parameters</span>
          </h2>
          <span className="text-[11px] text-neutral-400">
            Combine multiple parameters to narrow court dairy records
          </span>
        </div>

        {/* Row 1: Serial Range & Case Number & Result */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-neutral-400 mb-1">Serial Number (From)</label>
            <input
              type="number"
              value={serialFrom}
              onChange={(e) => setSerialFrom(e.target.value)}
              placeholder="Min serial..."
              className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Serial Number (To)</label>
            <input
              type="number"
              value={serialTo}
              onChange={(e) => setSerialTo(e.target.value)}
              placeholder="Max serial..."
              className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Case Number (Contains)</label>
            <input
              type="text"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="e.g. 104/2026..."
              className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Case Result / Status</label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
            >
              <option value="All">All Results</option>
              {resultsList.map((r) => (
                <option key={r.ResultID} value={r.ResultName}>
                  {r.ResultName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Date Ranges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-neutral-400 mb-1">Case Date (From)</label>
            <input
              type="date"
              value={caseDateFrom}
              onChange={(e) => setCaseDateFrom(e.target.value)}
              className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Case Date (To)</label>
            <input
              type="date"
              value={caseDateTo}
              onChange={(e) => setCaseDateTo(e.target.value)}
              className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Dairy Date (From)</label>
            <input
              type="date"
              value={dairyDateFrom}
              onChange={(e) => setDairyDateFrom(e.target.value)}
              className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Dairy Date (To)</label>
            <input
              type="date"
              value={dairyDateTo}
              onChange={(e) => setDairyDateTo(e.target.value)}
              className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
            />
          </div>
        </div>

        {/* Row 3: Description & Remarks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-neutral-400 mb-1">Description (Contains)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Search description keywords..."
              className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Remarks (Contains)</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Search remarks keywords..."
              className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-5 py-1.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-semibold text-xs rounded shadow-sm disabled:opacity-50 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{loading ? 'Searching...' : 'Search Records'}</span>
          </button>
        </div>
      </form>

      {/* Results Section */}
      {hasSearched && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col flex-1 shadow-sm">
          <div className="p-3 border-b border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-neutral-300">
              Query matched <strong className="font-mono text-amber-400">{searchResults.length}</strong> records.
            </div>

            {searchResults.length > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-700 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-1 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportWord}
                  className="flex items-center gap-1 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-700 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Word</span>
                </button>
                <button
                  onClick={handleExportPdf}
                  className="flex items-center gap-1 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-rose-400" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => onPrintPreview('Advanced Search Query Report', searchResults)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 transition-colors ml-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                No matching records found for the specified filters.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-neutral-950 border-b border-neutral-800 text-neutral-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-16">Serial</th>
                    <th className="py-2.5 px-3 text-center w-24">Case Date</th>
                    <th className="py-2.5 px-3 font-semibold">Case Number</th>
                    <th className="py-2.5 px-3 text-center w-24">Result</th>
                    <th className="py-2.5 px-3 text-center w-24">Dairy Date</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Remarks</th>
                    <th className="py-2.5 px-3 text-center w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {searchResults.map((c) => (
                    <tr
                      key={c.ID}
                      onClick={() => onViewCase(c.ID)}
                      className="hover:bg-neutral-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-neutral-400 tabular-nums">
                        {c.SerialNo}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-neutral-300 tabular-nums">
                        {c.DisplayCaseDate || toDisplayDate(c.CaseDate)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-100">
                        {c.CaseNumber}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-800 border border-neutral-700 text-neutral-200">
                          {c.Result}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-amber-300 tabular-nums">
                        {c.DisplayDairyDate || toDisplayDate(c.DairyDate)}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-300 max-w-xs truncate">
                        {c.Description || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-400 max-w-xs truncate">
                        {c.Remarks || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewCase(c.ID)}
                            title="View"
                            className="p-1 text-neutral-400 hover:text-white rounded"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditCase(c)}
                            title="Edit"
                            className="p-1 text-neutral-400 hover:text-amber-400 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
