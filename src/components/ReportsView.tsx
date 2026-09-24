import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Clock,
  AlertTriangle,
  Layers,
  Filter,
  FileText,
  Eye,
  RefreshCw
} from 'lucide-react';
import { CourtCase, ResultOption } from '../types.js';
import { toDisplayDate, toIsoDate, getTodayIso } from '../utils/date.js';
import { exportToExcel, exportToCsv, exportToWord, exportToPdf } from '../utils/export.js';
import { api } from '../services/api.js';

interface Props {
  initialReportType?: string;
  resultsList: ResultOption[];
  onViewCase: (id: number) => void;
  onPrintPreview: (title: string, cases: CourtCase[]) => void;
  courtName?: string;
}

export const ReportsView: React.FC<Props> = ({
  initialReportType = 'today',
  resultsList,
  onViewCase,
  onPrintPreview,
  courtName
}) => {
  const [reportType, setReportType] = useState<string>(initialReportType);

  // Parameters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedResult, setSelectedResult] = useState('Pending');
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [caseNoFilter, setCaseNoFilter] = useState('');

  const [records, setRecords] = useState<CourtCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportTitle, setReportTitle] = useState("Today's Case Diary Report");

  useEffect(() => {
    setReportType(initialReportType);
  }, [initialReportType]);

  useEffect(() => {
    generateReport();
  }, [reportType, selectedResult, selectedYear, selectedMonth]);

  const generateReport = async () => {
    try {
      setLoading(true);
      const todayIso = getTodayIso();

      if (reportType === 'today') {
        setReportTitle(`Today's Cause List & Hearing Schedule (${toDisplayDate(todayIso)})`);
        const res = await api.getCases({ dairyDateFrom: todayIso, dairyDateTo: todayIso, limit: 500 });
        setRecords(res.records);
      } else if (reportType === 'upcoming') {
        setReportTitle('Upcoming Cases Cause List');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const res = await api.getCases({
          dairyDateFrom: tomorrow.toISOString().split('T')[0],
          sortBy: 'DairyDate',
          sortOrder: 'ASC',
          limit: 500
        });
        setRecords(res.records);
      } else if (reportType === 'overdue') {
        setReportTitle('Overdue Case Diary Monitor');
        // Fetch past dairy dates
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const res = await api.getCases({
          dairyDateTo: yesterday.toISOString().split('T')[0],
          limit: 500
        });
        // Filter out disposed cases
        const overdue = res.records.filter(
          r => !['disposed', 'allowed', 'dismissed', 'withdrawn'].includes((r.Result || '').toLowerCase())
        );
        setRecords(overdue);
      } else if (reportType === 'date-range') {
        const fromDisp = dateFrom ? toDisplayDate(dateFrom) : 'Start';
        const toDisp = dateTo ? toDisplayDate(dateTo) : 'End';
        setReportTitle(`Date Range Report (${fromDisp} to ${toDisp})`);
        const res = await api.getCases({
          caseDateFrom: dateFrom ? toIsoDate(dateFrom) : '',
          caseDateTo: dateTo ? toIsoDate(dateTo) : '',
          limit: 500
        });
        setRecords(res.records);
      } else if (reportType === 'result-wise') {
        setReportTitle(`Result-wise Report (${selectedResult})`);
        const res = await api.getCases({ result: selectedResult, limit: 500 });
        setRecords(res.records);
      } else if (reportType === 'monthly') {
        const monthStr = `${selectedYear}-${selectedMonth}`;
        setReportTitle(`Monthly Cause Diary Report (${selectedMonth}/${selectedYear})`);
        const res = await api.getCases({
          caseDateFrom: `${monthStr}-01`,
          caseDateTo: `${monthStr}-31`,
          limit: 500
        });
        setRecords(res.records);
      } else if (reportType === 'yearly') {
        setReportTitle(`Annual Case Register Report (${selectedYear})`);
        const res = await api.getCases({
          caseDateFrom: `${selectedYear}-01-01`,
          caseDateTo: `${selectedYear}-12-31`,
          limit: 1000
        });
        setRecords(res.records);
      } else if (reportType === 'all') {
        setReportTitle('Complete Court Case Register Report');
        const res = await api.getCases({ limit: 1000 });
        setRecords(res.records);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(records, {
      title: reportTitle.replace(/[^a-zA-Z0-9_-]/g, '_'),
      courtName: courtName || 'Court of Judicial Magistrate',
      filterDescription: reportTitle
    });
  };

  const handleExportCsv = () => {
    exportToCsv(records, `${reportTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
  };

  const handleExportWord = () => {
    exportToWord(records, {
      title: reportTitle,
      courtName: courtName || 'Court of Judicial Magistrate',
      filterDescription: `Report generated on ${new Date().toLocaleDateString('en-GB')}`
    });
  };

  const handleExportPdf = () => {
    exportToPdf(records, {
      title: reportTitle.toUpperCase(),
      courtName: courtName || 'COURT OF JUDICIAL MAGISTRATE & BENCH OFFICER',
      filterDescription: reportTitle
    });
  };

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto flex flex-col h-full overflow-hidden">
      {/* Report Selection Header */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">Court Cause List & Case Reports</h2>
              <p className="text-[11px] text-neutral-400">
                Official printable reports, cause lists, and archival records.
              </p>
            </div>
          </div>

          {/* Report Type Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setReportType('today')}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                reportType === 'today' ? 'bg-amber-600 text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setReportType('upcoming')}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                reportType === 'upcoming' ? 'bg-amber-600 text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setReportType('overdue')}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                reportType === 'overdue' ? 'bg-amber-600 text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Overdue
            </button>
            <button
              onClick={() => setReportType('date-range')}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                reportType === 'date-range' ? 'bg-amber-600 text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Date Range
            </button>
            <button
              onClick={() => setReportType('result-wise')}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                reportType === 'result-wise' ? 'bg-amber-600 text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Result-wise
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                reportType === 'monthly' ? 'bg-amber-600 text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setReportType('yearly')}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                reportType === 'yearly' ? 'bg-amber-600 text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Yearly
            </button>
            <button
              onClick={() => setReportType('all')}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                reportType === 'all' ? 'bg-amber-600 text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Cases
            </button>
          </div>
        </div>

        {/* Dynamic Parameter Filter Bar */}
        <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center gap-3 text-xs">
          {reportType === 'date-range' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400">From Date:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-7 px-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400">To Date:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-7 px-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                />
              </div>
              <button
                onClick={generateReport}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-semibold rounded text-xs"
              >
                Apply Range
              </button>
            </>
          )}

          {reportType === 'result-wise' && (
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400">Result Filter:</span>
              <select
                value={selectedResult}
                onChange={(e) => setSelectedResult(e.target.value)}
                className="h-7 px-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              >
                {resultsList.map((r) => (
                  <option key={r.ResultID} value={r.ResultName}>
                    {r.ResultName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(reportType === 'monthly' || reportType === 'yearly') && (
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-7 px-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'monthly' && (
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-7 px-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              >
                <option value="01">01 - January</option>
                <option value="02">02 - February</option>
                <option value="03">03 - March</option>
                <option value="04">04 - April</option>
                <option value="05">05 - May</option>
                <option value="06">06 - June</option>
                <option value="07">07 - July</option>
                <option value="08">08 - August</option>
                <option value="09">09 - September</option>
                <option value="10">10 - October</option>
                <option value="11">11 - November</option>
                <option value="12">12 - December</option>
              </select>
            </div>
          )}

          {/* Quick Refresh */}
          <button
            onClick={generateReport}
            title="Reload report data"
            className="p-1 text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 rounded ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Report Results Table & Export Controls */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col flex-1 shadow-sm">
        {/* Report Title Bar with Export buttons */}
        <div className="p-3 border-b border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-neutral-100">{reportTitle}</h3>
            <span className="text-[11px] text-neutral-400 font-mono">
              Total Records: {records.length} | Generated On: {new Date().toLocaleDateString('en-GB')}
            </span>
          </div>

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
              onClick={() => onPrintPreview(reportTitle, records)}
              className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 transition-colors ml-1 font-medium"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Preview</span>
            </button>
          </div>
        </div>

        {/* Report Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-12 text-center text-neutral-400 animate-pulse text-xs">
              Compiling court dairy report records...
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 text-xs">
              No case records found matching this report criteria.
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
                  <th className="py-2.5 px-3 text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {records.map((c) => (
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
                    <td className="py-2.5 px-3 text-center font-mono text-amber-300 tabular-nums font-medium">
                      {c.DisplayDairyDate || toDisplayDate(c.DairyDate)}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-300 max-w-xs truncate" title={c.Description}>
                      {c.Description || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-400 max-w-xs truncate" title={c.Remarks}>
                      {c.Remarks || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onViewCase(c.ID)}
                        title="View Case"
                        className="p-1 text-neutral-400 hover:text-white rounded"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
