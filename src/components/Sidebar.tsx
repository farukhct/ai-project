import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertOctagon,
  FileSpreadsheet,
  FileText,
  Users,
  CheckSquare,
  Database,
  Settings,
  HelpCircle,
  LogOut,
  Shield,
  History,
  FileDown
} from 'lucide-react';
import { User } from '../types.js';
import courtEmblem from '../assets/images/court_emblem_insignia_1790276040697.jpg';
import judgeAvatar from '../assets/images/judge_officer_avatar_1790276066454.jpg';

interface Props {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenShortcuts: () => void;
  todayCount?: number;
  upcomingCount?: number;
  overdueCount?: number;
}

export const Sidebar: React.FC<Props> = ({
  currentView,
  onNavigate,
  currentUser,
  onLogout,
  onOpenShortcuts,
  todayCount = 0,
  upcomingCount = 0,
  overdueCount = 0
}) => {
  const isAdmin = currentUser?.role === 'Administrator';

  const navItemClass = (viewName: string) => {
    const isActive = currentView === viewName;
    return `w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-amber-700/20 text-amber-300 border border-amber-600/30'
        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
    }`;
  };

  return (
    <aside className="w-64 bg-neutral-925 border-r border-neutral-800 flex flex-col shrink-0 h-full select-none overflow-hidden">
      {/* Court Header Brand Lockup */}
      <div className="p-3 border-b border-neutral-800/80 bg-neutral-950/40 flex items-center gap-2.5">
        <img
          src={courtEmblem}
          alt="Judicial Insignia"
          className="w-8 h-8 rounded border border-neutral-700 object-cover shrink-0"
          referrerPolicy="no-referrer"
        />
        <div className="overflow-hidden">
          <div className="font-serif font-bold text-neutral-100 text-sm tracking-wide truncate">
            Court Dairy
          </div>
          <div className="text-[10px] text-neutral-400 font-mono tracking-wider truncate">
            BENCH REGISTER
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
        {/* Core Management */}
        <div>
          <div className="px-2 pb-1 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Main Console
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onNavigate('dashboard')}
              className={navItemClass('dashboard')}
            >
              <span className="flex items-center gap-2.5 truncate">
                <LayoutDashboard className="w-4 h-4 shrink-0 text-amber-500/90" />
                <span>Dashboard</span>
              </span>
            </button>

            <button
              onClick={() => onNavigate('new-case')}
              className={navItemClass('new-case')}
            >
              <span className="flex items-center gap-2.5 truncate">
                <PlusCircle className="w-4 h-4 shrink-0 text-emerald-500/90" />
                <span>New Case</span>
              </span>
              <kbd className="text-[9px] font-mono text-neutral-500 bg-neutral-800/80 px-1.5 py-0.5 rounded border border-neutral-700/60">
                Ctrl+N
              </kbd>
            </button>

            <button
              onClick={() => onNavigate('case-list')}
              className={navItemClass('case-list')}
            >
              <span className="flex items-center gap-2.5 truncate">
                <FolderOpen className="w-4 h-4 shrink-0 text-sky-400" />
                <span>Case Register</span>
              </span>
            </button>

            <button
              onClick={() => onNavigate('advanced-search')}
              className={navItemClass('advanced-search')}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Filter className="w-4 h-4 shrink-0 text-purple-400" />
                <span>Advanced Search</span>
              </span>
              <kbd className="text-[9px] font-mono text-neutral-500 bg-neutral-800/80 px-1.5 py-0.5 rounded border border-neutral-700/60">
                Ctrl+F
              </kbd>
            </button>
          </div>
        </div>

        {/* Proceedings & Dairy Reports */}
        <div>
          <div className="px-2 pb-1 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Dairy Schedules & Reports
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onNavigate('reports-today')}
              className={navItemClass('reports-today')}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Calendar className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Today's Cases</span>
              </span>
              {todayCount > 0 && (
                <span className="font-mono text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded-full tabular-nums">
                  {todayCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('reports-upcoming')}
              className={navItemClass('reports-upcoming')}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Upcoming Cases</span>
              </span>
              {upcomingCount > 0 && (
                <span className="font-mono text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.2 rounded-full tabular-nums">
                  {upcomingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('reports-overdue')}
              className={navItemClass('reports-overdue')}
            >
              <span className="flex items-center gap-2.5 truncate">
                <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Overdue Cases</span>
              </span>
              {overdueCount > 0 && (
                <span className="font-mono text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.2 rounded-full tabular-nums">
                  {overdueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('reports-generator')}
              className={navItemClass('reports-generator')}
            >
              <span className="flex items-center gap-2.5 truncate">
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-neutral-400" />
                <span>Custom Reports</span>
              </span>
            </button>
          </div>
        </div>

        {/* Administration Section */}
        {isAdmin && (
          <div>
            <div className="px-2 pb-1 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
              <span>Administration</span>
              <Shield className="w-3 h-3 text-amber-500/70" />
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => onNavigate('admin-results')}
                className={navItemClass('admin-results')}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <CheckSquare className="w-4 h-4 shrink-0 text-teal-400" />
                  <span>Result Types</span>
                </span>
              </button>

              <button
                onClick={() => onNavigate('admin-users')}
                className={navItemClass('admin-users')}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Users className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>User Accounts</span>
                </span>
              </button>

              <button
                onClick={() => onNavigate('admin-backup')}
                className={navItemClass('admin-backup')}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Database className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Backup & Restore</span>
                </span>
              </button>

              <button
                onClick={() => onNavigate('admin-logs')}
                className={navItemClass('admin-logs')}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <History className="w-4 h-4 shrink-0 text-neutral-400" />
                  <span>Audit Logs</span>
                </span>
              </button>

              <button
                onClick={() => onNavigate('admin-settings')}
                className={navItemClass('admin-settings')}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Settings className="w-4 h-4 shrink-0 text-neutral-400" />
                  <span>System Settings</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Help & About */}
        <div>
          <div className="px-2 pb-1 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Assistance
          </div>
          <div className="space-y-0.5">
            <button
              onClick={onOpenShortcuts}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 rounded-md transition-colors"
            >
              <span className="flex items-center gap-2.5 truncate">
                <HelpCircle className="w-4 h-4 shrink-0 text-neutral-400" />
                <span>Shortcuts</span>
              </span>
              <kbd className="text-[9px] font-mono text-neutral-500 bg-neutral-800/80 px-1 py-0.5 rounded">
                ?
              </kbd>
            </button>

            <button
              onClick={() => onNavigate('about')}
              className={navItemClass('about')}
            >
              <span className="flex items-center gap-2.5 truncate">
                <FileText className="w-4 h-4 shrink-0 text-neutral-400" />
                <span>About System</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Judicial Officer User Card */}
      <div className="p-2.5 border-t border-neutral-800/80 bg-neutral-950/60">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <img
            src={judgeAvatar}
            alt="Bench Officer"
            className="w-8 h-8 rounded-full border border-neutral-700 object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-neutral-200 truncate">
              {currentUser?.fullName || 'Bench Officer'}
            </div>
            <div className="text-[10px] text-neutral-400 flex items-center gap-1 font-mono">
              <span className={currentUser?.role === 'Administrator' ? 'text-amber-400' : 'text-neutral-400'}>
                {currentUser?.role || 'Officer'}
              </span>
              <span>·</span>
              <span className="text-emerald-400">Active</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Log out of Court Dairy"
            className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
