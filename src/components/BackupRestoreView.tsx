import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  AlertTriangle,
  History,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  FileCheck,
  Shield,
  Trash2
} from 'lucide-react';
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

  // Download state
  const [downloading, setDownloading] = useState(false);

  // Restore state
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  // Reset state (One-Click Reset with explicit permission)
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  /**
   * Fixed & Verified SQLite Database Download:
   * Uses authenticated fetch with Bearer token, streams blob, and triggers browser download.
   */
  const handleDownloadBackup = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem('court_dairy_auth_token');
      
      const res = await fetch('/api/backup/download', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Download failed with HTTP status ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const todayStr = new Date().toISOString().split('T')[0];
      link.download = `CourtDairy_Backup_${todayStr}.db`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      onToast('success', 'Database backup (CourtDairy.db) downloaded successfully.');
      loadLogs();
    } catch (err: any) {
      onToast('error', err.message || 'Failed to download database backup.');
    } finally {
      setDownloading(false);
    }
  };

  /**
   * Verified Database Restore:
   * Validates SQLite file header, creates safety pre-restore backup, and reloads data.
   */
  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!restoreFile) {
      onToast('error', 'Please select a valid .db SQLite file to restore.');
      return;
    }

    if (confirmText !== 'CONFIRM_RESTORE') {
      onToast('error', 'Please type CONFIRM_RESTORE to authorize restoration.');
      return;
    }

    try {
      setRestoring(true);
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const resultStr = reader.result as string;
          const base64 = resultStr.split(',')[1] || '';

          if (!base64) {
            throw new Error('Unable to encode backup file.');
          }

          const res = await api.restoreDatabase(base64, 'CONFIRM_RESTORE');
          onToast('success', res.message || 'Database restored successfully! Application records reloaded.');
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

      reader.onerror = () => {
        onToast('error', 'Error reading selected backup file.');
        setRestoring(false);
      };

      reader.readAsDataURL(restoreFile);
    } catch (err: any) {
      onToast('error', err.message || 'Failed to process backup file.');
      setRestoring(false);
    }
  };

  /**
   * One-Click Database Reset (Requires explicit user permission):
   * Creates automatic safety pre-reset backup on disk, clears cases, and restarts serial numbers.
   */
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (resetConfirmText.trim().toUpperCase() !== 'RESET') {
      onToast('error', 'Please type RESET in the box below to authorize database reset.');
      return;
    }

    try {
      setResetting(true);
      const res = await api.resetDatabase('CONFIRM_RESET');
      onToast('success', res.message || 'Database reset successfully. Next case serial number is 1.');
      setShowResetDialog(false);
      setResetConfirmText('');
      loadLogs();
      onRefreshAll();
    } catch (err: any) {
      onToast('error', err.message || 'Failed to reset database.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 h-full overflow-y-auto">
      {/* View Header */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600/10 border border-emerald-600/30 text-emerald-500">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-100 flex items-center gap-2">
              <span>Database Operations & Archiving</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SQLite 3
              </span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Manage database backups, restore previous judicial archives, and perform factory resets with automatic safety snapshots.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>CourtDairy.db Online</span>
          </span>
        </div>
      </div>

      {/* Main 3-Action Grid: Backup, Restore, Reset */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Download Backup Card */}
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl flex flex-col justify-between space-y-4 shadow-xs hover:border-emerald-700/60 transition-all">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Download className="w-4 h-4" />
              <span>Download Backup (.db)</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Export the complete <code className="text-emerald-400">CourtDairy.db</code> binary file containing all registered cases, hearing proceedings, bench notes, attachments, user roles, and audit trail.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={downloading}
            className="w-full btn-gov-primary flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {downloading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Preparing Backup...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Backup (.db)</span>
              </>
            )}
          </button>
        </div>

        {/* 2. Restore Database Card */}
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl flex flex-col justify-between space-y-4 shadow-xs hover:border-sky-700/60 transition-all">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <Upload className="w-4 h-4" />
              <span>Restore from Backup</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Upload a previously downloaded <code className="text-sky-400">.db</code> SQLite backup. An automatic safety snapshot is stored on disk before overwriting existing data.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmText('');
              setRestoreFile(null);
              setShowRestoreDialog(true);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Restore SQLite Archive</span>
          </button>
        </div>

        {/* 3. One-Click Database Reset Card (With Explicit Permission Protection) */}
        <div className="bg-neutral-900 border border-rose-900/40 p-5 rounded-xl flex flex-col justify-between space-y-4 shadow-xs hover:border-rose-700/70 transition-all">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <RotateCcw className="w-4 h-4" />
              <span>One-Click Reset Database</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Wipe all cases, proceedings, notes, and documents to start a fresh judicial session. Resets case serial number to 1. Saves an automatic safety snapshot before clearing.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setResetConfirmText('');
              setShowResetDialog(true);
            }}
            className="btn-gov-danger w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold shadow-md active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Database</span>
          </button>
        </div>
      </div>

      {/* Restore Safety Modal */}
      {showRestoreDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-modal-backdrop">
          <div className="bg-neutral-900 border border-sky-600/60 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-modal-card relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-600 via-sky-400 to-sky-600" />

            <div className="flex items-center gap-3 text-sky-400">
              <div className="p-2.5 rounded-xl bg-sky-950/80 border border-sky-800/60 text-sky-400">
                <Upload className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-100">Restore Database from Archive</h3>
                <span className="text-[11px] text-neutral-400">Replace current diary records with backup file</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Restoring a database will replace current records with the data from your backup file.
              An automatic safety snapshot (<code className="text-sky-300 font-mono text-[11px]">CourtDairy_PreRestore_*.db</code>) is saved to disk before restoration begins.
            </p>

            <form onSubmit={handleRestoreSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  Select Backup File (.db, .sqlite format) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="file"
                  accept=".db,.sqlite,.sqlite3"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                  required
                  className="w-full text-xs text-neutral-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700 cursor-pointer border border-neutral-700 rounded-lg p-1 bg-neutral-950"
                />
                {restoreFile && (
                  <span className="text-[11px] text-emerald-400 mt-1 block font-mono">
                    Selected: {restoreFile.name} ({(restoreFile.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  Type <strong className="text-sky-400 font-mono">CONFIRM_RESTORE</strong> below to authorize:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="CONFIRM_RESTORE"
                  required
                  className="w-full h-10 px-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-100 font-mono text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowRestoreDialog(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg border border-neutral-700 transition-all active:scale-95 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restoring || confirmText !== 'CONFIRM_RESTORE' || !restoreFile}
                  className="px-4 py-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold rounded-lg shadow-md disabled:opacity-40 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  {restoring ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Restoring Database...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Confirm & Restore</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* One-Click Database Reset Modal (Requires explicit user permission) */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-modal-backdrop">
          <div className="bg-neutral-900 border border-rose-600/70 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-modal-card relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600" />

            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-800/80 text-rose-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-100">Database Reset Authorization</h3>
                <span className="text-[11px] text-rose-400/90 font-medium">Without your explicit permission, this will not run.</span>
              </div>
            </div>

            <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl space-y-2 text-xs text-neutral-300">
              <p className="font-semibold text-rose-300">
                ⚠️ What happens when you reset:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-neutral-300 text-[11px]">
                <li>All registered court cases and diary records will be wiped.</li>
                <li>All hearing proceedings, bench notes, and uploaded documents will be deleted.</li>
                <li>The Case Serial numbering will restart cleanly at <strong>Serial No: 1</strong>.</li>
                <li><strong>Your administrator account and system configuration will be preserved.</strong></li>
                <li>An automatic safety snapshot (<code className="text-amber-300 font-mono">CourtDairy_PreReset_*.db</code>) is created on disk immediately before clearing.</li>
              </ul>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  Type <strong className="text-rose-400 font-mono text-sm">RESET</strong> below to give your explicit permission:
                </label>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="RESET"
                  required
                  autoFocus
                  className="w-full h-10 px-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-100 font-mono text-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/25"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowResetDialog(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg border border-neutral-700 transition-all active:scale-95 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting || resetConfirmText.trim().toUpperCase() !== 'RESET'}
                  className="btn-gov-danger px-4 py-2 text-white font-bold rounded-lg shadow-md disabled:opacity-40 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  {resetting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Resetting Database...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm & Reset Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-neutral-200">System Activity & Database Audit Trail</span>
          </div>
          <button
            onClick={loadLogs}
            disabled={loadingLogs}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
            <span>Refresh Audit Logs</span>
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loadingLogs ? (
            <div className="p-8 text-center text-neutral-500 text-xs animate-pulse flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
              <span>Loading audit records...</span>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-xs">
              No audit logs recorded yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-neutral-950 text-neutral-400 text-[10px] uppercase font-bold">
                <tr className="border-b border-neutral-800">
                  <th className="py-2.5 px-3 w-36">Timestamp</th>
                  <th className="py-2.5 px-3 w-32">Action</th>
                  <th className="py-2.5 px-3 w-28">Module</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3 w-24">Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.ID} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-2 px-3 text-neutral-400 tabular-nums">
                      {formatDateTime(log.PerformedAt)}
                    </td>
                    <td className="py-2 px-3 font-semibold text-emerald-400">
                      {log.Action}
                    </td>
                    <td className="py-2 px-3 text-neutral-300 font-sans">
                      {log.Module}
                    </td>
                    <td className="py-2 px-3 text-neutral-200 font-sans">
                      {log.Details}
                    </td>
                    <td className="py-2 px-3 text-neutral-400 font-sans">
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
