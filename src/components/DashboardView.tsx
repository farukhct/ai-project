import React from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  FolderCheck,
  Hourglass,
  Files,
  ArrowRight,
  Printer,
  Eye,
  Edit2,
  FilePlus2,
  TrendingUp,
  FileText
} from 'lucide-react';
import { DashboardData, CourtCase } from '../types.js';
import { toDisplayDate } from '../utils/date.js';

interface Props {
  data: DashboardData | null;
  loading: boolean;
  onViewCase: (id: number) => void;
  onEditCase: (caseItem: CourtCase) => void;
  onNavigate: (view: string) => void;
  onPrintPreview: (title: string, cases: CourtCase[]) => void;
}

export const DashboardView: React.FC<Props> = ({
  data,
  loading,
  onViewCase,
  onEditCase,
  onNavigate,
  onPrintPreview
}) => {
  if (loading || !data) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-neutral-800/60 rounded-lg border border-neutral-700/50"></div>
          ))}
        </div>
        <div className="h-64 bg-neutral-800/60 rounded-lg border border-neutral-700/50"></div>
      </div>
    );
  }

  const { statistics, casesByResult, todayList, upcomingList, overdueList, recentProceedings } = data;

  const resultTone = (result: string) => {
    const r = (result || '').toLowerCase();
    if (r === 'pending') return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
    if (['disposed', 'allowed'].includes(r)) return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
    if (['dismissed', 'withdrawn'].includes(r)) return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
    if (r === 'adjourned') return 'text-sky-400 bg-sky-950/60 border-sky-800/60';
    if (r === 'reserved') return 'text-purple-400 bg-purple-950/60 border-purple-800/60';
    return 'text-neutral-400 bg-neutral-800 border-neutral-700';
  };

  const badgeIndicator = (badge?: string) => {
    if (badge === 'Today') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          Today
        </span>
      );
    }
    if (badge === 'Tomorrow') {
      return (
        <span className="inline-flex items-center text-[11px] font-semibold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
          Tomorrow
        </span>
      );
    }
    if (badge === 'Overdue') {
      return (
        <span className="inline-flex items-center text-[11px] font-semibold text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
          Overdue
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[11px] font-medium text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
        Upcoming
      </span>
    );
  };

  return (
    <div className="p-5 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Cases */}
        <div
          onClick={() => onNavigate('case-list')}
          className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg hover:border-neutral-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Total Cases</span>
            <Files className="w-4 h-4 text-neutral-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-neutral-100">
            {statistics.totalCases}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 truncate">
            {statistics.yearCases} registered this year
          </div>
        </div>

        {/* Today's Dairy */}
        <div
          onClick={() => onNavigate('reports-today')}
          className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg hover:border-emerald-800/60 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Today's Cause List</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-400">
            {statistics.todayCases}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 truncate">
            Scheduled for {data.currentDateDisplay}
          </div>
        </div>

        {/* Upcoming Cases */}
        <div
          onClick={() => onNavigate('reports-upcoming')}
          className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg hover:border-amber-800/60 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Upcoming Dairy</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-amber-400">
            {statistics.upcomingCases}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 truncate">
            Ahead in calendar
          </div>
        </div>

        {/* Overdue Cases */}
        <div
          onClick={() => onNavigate('reports-overdue')}
          className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg hover:border-rose-800/60 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Overdue Dairy</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-rose-400">
            {statistics.overdueCases}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 truncate">
            Past dairy, not disposed
          </div>
        </div>

        {/* Pending Cases */}
        <div
          onClick={() => onNavigate('case-list')}
          className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg hover:border-neutral-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Pending Matters</span>
            <Hourglass className="w-4 h-4 text-amber-500/80" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-neutral-100">
            {statistics.pendingCases}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 truncate">
            Active under adjudication
          </div>
        </div>

        {/* Disposed Cases */}
        <div
          onClick={() => onNavigate('case-list')}
          className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg hover:border-neutral-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Disposed / Decided</span>
            <FolderCheck className="w-4 h-4 text-emerald-500/80" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-neutral-100">
            {statistics.disposedCases}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 truncate">
            Allowed, dismissed or closed
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Banner */}
      <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-600/10 border border-amber-600/30 rounded-md text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Daily Court Operations Console</h2>
            <p className="text-xs text-neutral-400">
              Bench Officer Diary & Case Progress Record · SQLite Database Live
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('new-case')}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 px-3 py-1.5 rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>Add New Case (Ctrl+N)</span>
          </button>

          <button
            onClick={() => onPrintPreview("Today's Case Diary", todayList)}
            className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded text-xs font-medium border border-neutral-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Today's List</span>
          </button>
        </div>
      </div>

      {/* Grid: Upcoming Cases (Major) & Today's Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Major Section: Upcoming Cases */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-neutral-100">Upcoming Cases (By Dairy Date)</h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span>{upcomingList.length} upcoming</span>
              <button
                onClick={() => onNavigate('reports-upcoming')}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
              >
                <span>View Full Schedule</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {upcomingList.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                No upcoming cases scheduled ahead in the diary.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 bg-neutral-950/40 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-semibold w-16 text-center">Serial</th>
                    <th className="py-2.5 px-3 font-semibold w-24 text-center">Dairy Date</th>
                    <th className="py-2.5 px-3 font-semibold">Case Number</th>
                    <th className="py-2.5 px-3 font-semibold w-24 text-center">Status</th>
                    <th className="py-2.5 px-3 font-semibold w-24 text-center">Result</th>
                    <th className="py-2.5 px-3 font-semibold">Description / Remarks</th>
                    <th className="py-2.5 px-3 font-semibold w-20 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {upcomingList.slice(0, 10).map((c) => (
                    <tr
                      key={c.ID}
                      className="hover:bg-neutral-800/40 transition-colors group cursor-pointer"
                      onClick={() => onViewCase(c.ID)}
                    >
                      <td className="py-2.5 px-3 font-mono text-center text-neutral-400 tabular-nums">
                        {c.SerialNo}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-center text-amber-300 font-medium tabular-nums">
                        {c.DisplayDairyDate || toDisplayDate(c.DairyDate)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-100">
                        {c.CaseNumber}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {badgeIndicator(c.statusBadge)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${resultTone(c.Result)}`}>
                          {c.Result}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-300 max-w-xs truncate">
                        {c.Description || c.Remarks || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewCase(c.ID)}
                            title="View Case Dossier"
                            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Section: Today's Cause List */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-neutral-100">Today's Hearing Schedule</h3>
            </div>
            <span className="font-mono text-xs text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded tabular-nums">
              {todayList.length} Listed
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-96 p-3 space-y-2">
            {todayList.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                No cases scheduled for today.
              </div>
            ) : (
              todayList.map((c) => (
                <div
                  key={c.ID}
                  onClick={() => onViewCase(c.ID)}
                  className="p-3 bg-neutral-950/60 border border-neutral-800 hover:border-emerald-700/60 rounded-md transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-neutral-400">
                      Serial #{c.SerialNo}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${resultTone(c.Result)}`}>
                      {c.Result}
                    </span>
                  </div>
                  <div className="mt-1 font-semibold text-neutral-100 text-xs truncate">
                    {c.CaseNumber}
                  </div>
                  {c.Description && (
                    <div className="mt-1 text-[11px] text-neutral-400 line-clamp-2">
                      {c.Description}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {todayList.length > 0 && (
            <div className="p-3 border-t border-neutral-800 bg-neutral-950/40 text-center">
              <button
                onClick={() => onPrintPreview("Today's Case Diary Report", todayList)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 py-1.5 rounded transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Today's Schedule</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Overdue Cases & Case Results Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue Cases */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-neutral-100">Overdue Cases (Pending Attention)</h3>
            </div>
            <button
              onClick={() => onNavigate('reports-overdue')}
              className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 font-medium transition-colors"
            >
              <span>View All Overdue ({overdueList.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {overdueList.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                No overdue cases found. All case diaries are up to date.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 bg-neutral-950/40 text-[11px] uppercase tracking-wider">
                    <th className="py-2 px-3 font-semibold text-center w-16">Serial</th>
                    <th className="py-2 px-3 font-semibold text-center w-24">Last Dairy</th>
                    <th className="py-2 px-3 font-semibold">Case Number</th>
                    <th className="py-2 px-3 font-semibold text-center w-24">Result</th>
                    <th className="py-2 px-3 font-semibold">Description</th>
                    <th className="py-2 px-3 font-semibold text-center w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {overdueList.slice(0, 5).map((c) => (
                    <tr
                      key={c.ID}
                      onClick={() => onViewCase(c.ID)}
                      className="hover:bg-neutral-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-2 px-3 font-mono text-center text-neutral-400 tabular-nums">
                        {c.SerialNo}
                      </td>
                      <td className="py-2 px-3 font-mono text-center text-rose-400 font-medium tabular-nums">
                        {c.DisplayDairyDate || toDisplayDate(c.DairyDate)}
                      </td>
                      <td className="py-2 px-3 font-semibold text-neutral-100">
                        {c.CaseNumber}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${resultTone(c.Result)}`}>
                          {c.Result}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-neutral-400 max-w-xs truncate">
                        {c.Description || '-'}
                      </td>
                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onViewCase(c.ID)}
                          className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 rounded text-[11px] transition-colors"
                        >
                          Update Dairy
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Case Results Distribution & Recent Proceedings */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-100 mb-3 flex items-center justify-between">
              <span>Cases by Result</span>
              <span className="text-xs font-mono text-neutral-500">{casesByResult.length} types</span>
            </h3>
            <div className="space-y-2">
              {casesByResult.length === 0 ? (
                <div className="text-xs text-neutral-500 py-2">No cases recorded yet.</div>
              ) : (
                casesByResult.map((r) => {
                  const pct = statistics.totalCases > 0
                    ? Math.round((r.count / statistics.totalCases) * 100)
                    : 0;
                  return (
                    <div key={r.Result} className="text-xs">
                      <div className="flex items-center justify-between text-neutral-300 mb-1">
                        <span className="font-medium">{r.Result}</span>
                        <span className="font-mono text-neutral-400 tabular-nums">
                          {r.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800">
            <h4 className="text-xs font-semibold text-neutral-300 mb-2">Recent Bench Recordings</h4>
            {recentProceedings.length === 0 ? (
              <p className="text-[11px] text-neutral-500">No proceedings recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {recentProceedings.slice(0, 2).map((p) => (
                  <div key={p.ID} className="text-[11px] bg-neutral-950 p-2 rounded border border-neutral-800">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="font-semibold text-neutral-200">{p.CaseNumber}</span>
                      <span className="font-mono">{p.DisplayHearingDate}</span>
                    </div>
                    <div className="text-neutral-300 line-clamp-1 mt-0.5">
                      {p.BusinessRecorded}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
