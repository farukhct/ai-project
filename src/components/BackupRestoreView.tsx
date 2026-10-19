import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, AlertTriangle, History, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AuditLogItem } from '../types.js';
import { formatDateTime } from '../utils/date.js';
import { api } from '../services/api.js';

interface Props {
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onRefreshAll: () => void;
}

export const BackupRestoreView: React.FC<Props> = ({ onToast, onRefreshAll }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Restore state
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleDownloadBackup = () => {
    const token = localStorage.getItem('court_dairy_auth_token');
    const link = document.createElement('a');
    link.href = `/api/backup/download?auth=${encodeURIComponent(token || '')}`;
    link.setAttribute('download', `CourtDairy_Backup_${new Date().toISOString().split('T')[0]}.db`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('success', 'Database backup downloaded successfully.');
    loadLogs();
  };

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) {
      onToast('error', 'Please select a CourtDairy.db file to restore.');
      return;
    }

    if (confirmText !== 'CONFIRM_RESTORE') {
      onToast('error', 'Please type CONFIRM_RESTORE in the box to authorize database restoration.');
      return;
    }

    try {
      setRestoring(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1] || '';
          await api.restoreDatabase(base64, 'CONFIRM_RESTORE');
          onToast('success', 'Database restored successfully! Application data refreshed.');
          setShowRestoreDialog(false);
          setRestoreFile(null);
          setConfirmText('');
          loadLogs();
          onRefreshAll();
        } catch (err: any) {
          onToast('error', err.message || 'Failed to restore database.');
        } finally {
          setRestoring(false);
        }
      };
      reader.readAsDataURL(restoreFile);
    } catch (err: any) {
      onToast('error', err.message || 'Failed to read backup file.');
      setRestoring(false);
    }
  };

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Database className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Database Backup, Restore & Auditing</h2>
            <p className="text-[11px] text-neutral-400">
              Direct offline SQLite file (`CourtDairy.db`) backup and safety-validated restoration.
            </p>
          </div>
        </div>
      </div>

      {/* Backup & Restore Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backup Card */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-1">
              <Download className="w-4 h-4" />
              <span>Export SQLite Database</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Download the entire CourtDairy.db SQLite binary file containing all registered cases, hearing proceedings, bench notes, attachments, user accounts, and system configuration.
            </p>
          </div>

          <button
            onClick={handleDownloadBackup}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded text-xs transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup (CourtDairy.db)</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold mb-1">
              <Upload className="w-4 h-4" />
              <span>Restore Database from Backup</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Upload a previously downloaded .db SQLite backup to restore all court cases and records. Automatic pre-restore backup is generated to prevent accidental data loss.
            </p>
          </div>

          <button
            onClick={() => setShowRestoreDialog(true)}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white font-semibold rounded text-xs transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Restore SQLite Database</span>
          </button>
        </div>
      </div>

      {/* Restore Safety Modal */}
      {showRestoreDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-modal-backdrop">
          <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-rose-600/60 rounded-2xl shadow-2xl shadow-black/80 max-w-lg w-full p-6 space-y-4 animate-modal-card relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-rose-600 via-rose-400 to-rose-600" />

            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-100">Database Restoration Warning</h3>
                <span className="text-[11px] text-neutral-400">Overwrite existing diary and case data</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed font-medium">
              Restoring a database will replace the current application data with the records from your backup file.
              An automatic safety backup of your existing database will be created on disk before restoration begins.
            </p>

            <form onSubmit={handleRestoreSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">Select Backup File (.db format)</label>
                <input
                  type="file"
                  accept=".db,.sqlite,.sqlite3"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                  required
                  className="w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700 form-pressable cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">
                  Type <strong className="text-rose-400 font-mono">CONFIRM_RESTORE</strong> below to proceed:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="CONFIRM_RESTORE"
                  required
                  className="form-input-modern w-full h-9 px-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-200 font-mono text-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/25 shadow-inner"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => setShowRestoreDialog(false)}
                  className="px-3.5 py-2 bg-neutral-800/90 hover:bg-neutral-750 text-neutral-300 rounded-lg border border-neutral-700/60 transition-all form-pressable cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restoring || confirmText !== 'CONFIRM_RESTORE'}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold rounded-lg shadow-md shadow-rose-950/50 disabled:opacity-40 transition-all form-pressable cursor-pointer"
                >
                  {restoring ? 'Restoring...' : 'Replace Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden shadow-sm">
        <div className="p-3 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-neutral-200">System Activity & Audit Trail</span>
          </div>
          <button
            onClick={loadLogs}
            className="text-[11px] text-amber-400 hover:underline"
          >
            Refresh Logs
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loadingLogs ? (
            <div className="p-6 text-center text-neutral-500 text-xs animate-pulse">
              Loading audit records...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-6 text-center text-neutral-500 text-xs">
              No audit logs recorded yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-neutral-950 text-neutral-400 text-[10px] uppercase">
                <tr className="border-b border-neutral-800">
                  <th className="py-2 px-3 w-36">Timestamp</th>
                  <th className="py-2 px-3 w-28">Action</th>
                  <th className="py-2 px-3 w-28">Module</th>
                  <th className="py-2 px-3">Details</th>
                  <th className="py-2 px-3 w-24">Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.ID} className="hover:bg-neutral-800/30">
                    <td className="py-1.5 px-3 text-neutral-400 tabular-nums">
                      {formatDateTime(log.PerformedAt)}
                    </td>
                    <td className="py-1.5 px-3 font-semibold text-amber-400">
                      {log.Action}
                    </td>
                    <td className="py-1.5 px-3 text-neutral-400">
                      {log.Module}
                    </td>
                    <td className="py-1.5 px-3 text-neutral-200 font-sans">
                      {log.Details}
                    </td>
                    <td className="py-1.5 px-3 text-neutral-400">
                      {log.PerformedBy}
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
