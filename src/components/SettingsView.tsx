import React, { useState, useEffect } from 'react';
import { Settings, Save, Check } from 'lucide-react';
import { SystemSettings, ResultOption } from '../types.js';
import { api } from '../services/api.js';
import { DATE_FORMAT_OPTIONS, setStoredDateFormat, DateFormatPattern } from '../utils/date.js';

interface Props {
  settings: SystemSettings;
  resultsList: ResultOption[];
  onSaveSettings: (newSettings: SystemSettings) => Promise<void>;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const SettingsView: React.FC<Props> = ({
  settings,
  resultsList,
  onSaveSettings,
  onToast
}) => {
  const [form, setForm] = useState<SystemSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSaveSettings(form);
      onToast('success', 'Application settings saved successfully.');
    } catch (err: any) {
      onToast('error', err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Application & Court Configuration</h2>
            <p className="text-[11px] text-neutral-400">
              Customize judicial institutional details, cause list report headers, and diary display rules.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800/90 p-6 rounded-2xl space-y-6 text-xs shadow-xl relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

        {/* Organization Details */}
        <div>
          <h3 className="font-semibold text-neutral-100 text-xs mb-3.5 border-b border-neutral-800/80 pb-2">
            Court & Judiciary Identity
          </h3>
          <div className="space-y-3.5">
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">Court / Bench Organization Name *</label>
              <input
                type="text"
                value={form.courtName}
                onChange={(e) => setForm({ ...form, courtName: e.target.value })}
                required
                className="form-input-modern w-full h-9 px-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-200 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Appears at the top of printable cause lists, single case sheets, and official reports.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">Application Title</label>
                <input
                  type="text"
                  value={form.appName}
                  onChange={(e) => setForm({ ...form, appName: e.target.value })}
                  required
                  className="form-input-modern w-full h-9 px-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-200 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">Application Subtitle</label>
                <input
                  type="text"
                  value={form.appSubtitle}
                  onChange={(e) => setForm({ ...form, appSubtitle: e.target.value })}
                  className="form-input-modern w-full h-9 px-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-200 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Printable Headers & Footers */}
        <div className="pt-2">
          <h3 className="font-semibold text-neutral-100 text-xs mb-3.5 border-b border-neutral-800/80 pb-2">
            Report Header & Footer Design
          </h3>
          <div className="space-y-3.5">
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">Official Report Header Banner</label>
              <input
                type="text"
                value={form.reportHeader}
                onChange={(e) => setForm({ ...form, reportHeader: e.target.value })}
                className="form-input-modern w-full h-9 px-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-200 text-xs uppercase focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">Official Report Footer Text</label>
              <input
                type="text"
                value={form.reportFooter}
                onChange={(e) => setForm({ ...form, reportFooter: e.target.value })}
                className="form-input-modern w-full h-9 px-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-200 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Operational Defaults */}
        <div className="pt-2">
          <h3 className="font-semibold text-neutral-100 text-xs mb-3.5 border-b border-neutral-800/80 pb-2">
            Operational Defaults
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">Default Initial Case Result</label>
              <select
                value={form.defaultResult}
                onChange={(e) => setForm({ ...form, defaultResult: e.target.value })}
                className="form-input-modern w-full h-9 px-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-200 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner cursor-pointer"
              >
                {resultsList.map((r) => (
                  <option key={r.ResultID} value={r.ResultName}>
                    {r.ResultName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">Display Date Standard</label>
              <select
                value={form.dateFormat || 'DD-MM-YYYY'}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({ ...form, dateFormat: val });
                  setStoredDateFormat(val as DateFormatPattern);
                }}
                className="form-input-modern w-full h-9 px-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner cursor-pointer"
              >
                {DATE_FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label} — e.g. {opt.example}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">Visual Theme</label>
              <select
                value={form.theme || 'dark'}
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
                className="form-input-modern w-full h-9 px-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-200 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner cursor-pointer"
              >
                <option value="dark">Dark Theme (Judicial Night)</option>
                <option value="light">Light Theme (Judicial Day)</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">Upcoming Dairy Window (Days)</label>
              <input
                type="number"
                value={form.upcomingDays}
                onChange={(e) => setForm({ ...form, upcomingDays: e.target.value })}
                className="form-input-modern w-full h-9 px-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-200 font-mono text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">Automatic Database Backup Cadence</label>
              <select
                value={form.autoBackup}
                onChange={(e) => setForm({ ...form, autoBackup: e.target.value })}
                className="form-input-modern w-full h-9 px-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-200 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner cursor-pointer"
              >
                <option value="Daily">Daily on Launch</option>
                <option value="Weekly">Weekly</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-3 border-t border-neutral-800">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-bold rounded-lg shadow-md shadow-amber-900/30 hover:shadow-amber-600/30 disabled:opacity-50 transition-all form-pressable cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Configuration...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
