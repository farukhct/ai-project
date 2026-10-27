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
import { BangladeshGovEmblem } from './GovBrand.js';
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
    return `w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
      isActive
        ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-600/5 text-emerald-600 dark:text-emerald-400 border border-emerald-600/30 shadow-xs translate-x-1'
        : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/70 border border-transparent hover:-translate-y-0.5'
    }`;
  };

  return (
    <aside className="w-64 bg-neutral-925 border-r border-neutral-800 flex flex-col shrink-0 h-full select-none overflow-hidden">
      {/* Court Header Brand Lockup */}
      <div className="p-3.5 border-b border-neutral-800/80 bg-neutral-950/60 flex items-center gap-2.5">
        <BangladeshGovEmblem className="w-9 h-9 shrink-0 drop-shadow-xs" />
        <div className="overflow-hidden">
          <div className="font-bold text-neutral-100 text-sm tracking-tight truncate flex items-center gap-1">
            <span>Court<span className="text-[#D92534]">Diary</span></span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100/10 text-emerald-400 border border-emerald-500/30 uppercase font-mono">
              e-Gov
            </span>
          </div>
          <div className="text-[10px] text-neutral-400 truncate">
            Judicial Registry System
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
                <LayoutDashboard className="w-4 h-4 shrink-0 text-emerald-500/90" />
                <span>Dashboard</span>
              </span>
            </button>

            <button
              onClick={() => onNavigate('new-case')}
              className={navItemClass('new-case')}
              title="Add New Court Diary Entry (Ctrl+N)"
            >
              <span className="flex items-center gap-2.5 truncate">
                <PlusCircle className="w-4 h-4 shrink-0 text-emerald-500/90" />
                <span>Add Court Diary Entry</span>
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
                <span>Today's Hearings</span>
              </span>
              {todayCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
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
                <span>Upcoming Cause List</span>
              </span>
              {upcomingCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
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
                <span>Overdue & Pending</span>
              </span>
              {overdueCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {overdueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('reports-generator')}
              className={navItemClass('reports-generator')}
            >
              <span className="flex items-center gap-2.5 truncate">
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-sky-400" />
                <span>Reports & Exports</span>
              </span>
            </button>
          </div>
        </div>

        {/* System Administration */}
        {isAdmin && (
          <div>
            <div className="px-2 pb-1 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              Administration
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => onNavigate('admin-results')}
                className={navItemClass('admin-results')}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <CheckSquare className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Result Categories</span>
                </span>
              </button>

              <button
                onClick={() => onNavigate('admin-users')}
                className={navItemClass('admin-users')}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Users className="w-4 h-4 shrink-0 text-purple-400" />
                  <span>Bench Users & Roles</span>
                </span>
              </button>

              <button
                onClick={() => onNavigate('admin-backup')}
                className={navItemClass('admin-backup')}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Database className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Backup & Restore</span>
                </span>
              </button>

              <button
                onClick={() => onNavigate('admin-settings')}
                className={navItemClass('admin-settings')}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Settings className="w-4 h-4 shrink-0 text-neutral-400" />
                  <span>Court Settings</span>
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Session & Logout Panel */}
      <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/60 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={judgeAvatar}
              alt="Judge/Officer"
              className="w-7 h-7 rounded-full object-cover border border-neutral-700 shrink-0 shadow-2xs"
            />
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-neutral-200 truncate">
                {currentUser?.fullName || 'Judicial Officer'}
              </div>
              <div className="text-[10px] text-emerald-400 truncate font-medium">
                {currentUser?.role || 'Bench Officer'}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Sign out of portal"
            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800/80 rounded-lg transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[10px] text-neutral-400">
          <button
            onClick={onOpenShortcuts}
            className="hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Shortcuts (F1)</span>
          </button>
          <span className="font-mono text-neutral-500">v2.6</span>
        </div>
      </div>
    </aside>
  );
};
