import React from 'react';
import { Search, Plus, RefreshCw, Moon, Sun, Printer, Shield } from 'lucide-react';

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
  'new-case': 'Record New Court Case Entry',
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
    <header className="h-13 bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between gap-4 shrink-0 select-none">
      {/* Zone 1: Breadcrumb & Title */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-mono text-neutral-400 hidden sm:inline">Court Dairy /</span>
        <h1 className="text-sm font-semibold text-neutral-100 truncate tracking-tight">
          {title}
        </h1>
      </div>

      {/* Zone 2: Global Search */}
      <div className="flex-1 max-w-md mx-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search anything (Serial, Case No, Result, Date, Remarks)..."
            className="w-full h-8 pl-8 pr-8 bg-neutral-950 border border-neutral-700/80 rounded-md text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/50 transition-colors"
          />
          {globalSearch && (
            <button
              onClick={() => {
                onGlobalSearchChange('');
                onGlobalSearchSubmit();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 text-xs font-mono"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onRefresh}
          title="Refresh Data (F5)"
          className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={onPrintCurrent}
          title="Print Current View (Ctrl+P)"
          className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors hidden sm:inline-flex"
        >
          <Printer className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleTheme}
          title="Toggle Light/Dark Theme"
          className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onNewCase}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-neutral-950 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Case</span>
        </button>
      </div>
    </header>
  );
};
