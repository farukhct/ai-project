import React from 'react';
import { Search, Plus, RefreshCw, Moon, Sun, Printer, Shield, FilePlus } from 'lucide-react';

interface Props {
  currentView: string;
  globalSearch: string;
  onGlobalSearchChange: (query: string) => void;
  onGlobalSearchSubmit: () => void;
  onRefresh: () => void;
  onNewCase: () => void;
  onPrintCurrent: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const VIEW_TITLES: Record<string, string> = {
  'dashboard': 'Bench Overview & Diary Status',
  'new-case': 'Add New Court Diary Entry',
  'case-list': 'Comprehensive Case Register',
  'case-details': 'Case Proceedings & Records Dossier',
  'advanced-search': 'Advanced Multi-Parameter Query',
  'reports-today': "Today's Hearing Schedule",
  'reports-upcoming': 'Upcoming Cause List & Dairy Schedule',
  'reports-overdue': 'Overdue & Pending Case Monitor',
  'reports-generator': 'Custom Reports Generator',
  'admin-results': 'Result Categories Management',
  'admin-users': 'Judicial Bench Users & Roles',
  'admin-backup': 'Database Backup, Restore & Archiving',
  'admin-logs': 'System Security & Activity Audit Log',
  'admin-settings': 'Court & Application Configuration',
  'about': 'About Court Dairy System'
};

export const TopBar: React.FC<Props> = ({
  currentView,
  globalSearch,
  onGlobalSearchChange,
  onGlobalSearchSubmit,
  onRefresh,
  onNewCase,
  onPrintCurrent,
  isDark,
  onToggleTheme
}) => {
  const title = VIEW_TITLES[currentView] || 'Court Case Diary';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onGlobalSearchSubmit();
    }
  };

  return (
    <header className="h-14 bg-neutral-900 border-b border-neutral-800 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 shrink-0 select-none shadow-xs">
      {/* Zone 1: Breadcrumb & Title */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[11px] font-semibold text-emerald-600 hidden md:inline">Court Dairy /</span>
        <h1 className="text-xs sm:text-sm font-bold text-neutral-100 truncate tracking-tight">
          {title}
        </h1>
      </div>

      {/* Zone 2: Global Search */}
      <div className="flex-1 max-w-xs sm:max-w-md mx-1 sm:mx-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Serial, Case No, Result..."
            className="w-full h-8.5 pl-8 pr-8 bg-neutral-950 border border-neutral-700/80 rounded-lg text-xs text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30 transition-all shadow-2xs"
          />
          {globalSearch && (
            <button
              onClick={() => {
                onGlobalSearchChange('');
                onGlobalSearchSubmit();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-100 text-xs font-mono p-0.5"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Zone 3: Primary Actions (Animated & Responsive) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <button
          onClick={onRefresh}
          title="Refresh Data (F5)"
          className="p-2 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800/80 rounded-lg transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={onPrintCurrent}
          title="Print Current View (Ctrl+P)"
          className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/80 rounded-lg transition-all active:scale-95 hidden sm:inline-flex"
        >
          <Printer className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleTheme}
          title="Toggle Light/Dark Theme"
          className="p-2 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800/80 rounded-lg transition-all active:scale-95"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Primary Action Button (eTax Bangladesh Emerald Gradient, Animated & Responsive) */}
        <button
          onClick={onNewCase}
          className="btn-gov-primary flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold shadow-md cursor-pointer whitespace-nowrap active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden xs:inline sm:inline">New Case</span>
        </button>
      </div>
    </header>
  );
};
