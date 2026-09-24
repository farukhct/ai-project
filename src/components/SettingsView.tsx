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
      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 p-5 rounded-lg space-y-4 text-xs shadow-sm">
        {/* Organization Details */}
        <div>
          <h3 className="font-semibold text-neutral-200 text-xs mb-3 border-b border-neutral-800 pb-1">
            Court & Judiciary Identity
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-neutral-400 mb-1">Court / Bench Organization Name *</label>
              <input
                type="text"
                value={form.courtName}
                onChange={(e) => setForm({ ...form, courtName: e.target.value })}
                required
                className="w-full h-8 px-3 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                Appears at the top of printable cause lists, single case sheets, and official reports.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1">Application Title</label>
                <input
                  type="text"
                  value={form.appName}
                  onChange={(e) => setForm({ ...form, appName: e.target.value })}
                  required
                  className="w-full h-8 px-3 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Application Subtitle</label>
                <input
                  type="text"
                  value={form.appSubtitle}
                  onChange={(e) => setForm({ ...form, appSubtitle: e.target.value })}
                  className="w-full h-8 px-3 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Printable Headers & Footers */}
        <div className="pt-2">
          <h3 className="font-semibold text-neutral-200 text-xs mb-3 border-b border-neutral-800 pb-1">
            Report Header & Footer Design
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-neutral-400 mb-1">Official Report Header Banner</label>
              <input
                type="text"
                value={form.reportHeader}
                onChange={(e) => setForm({ ...form, reportHeader: e.target.value })}
                className="w-full h-8 px-3 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 uppercase"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Official Report Footer Text</label>
              <input
                type="text"
                value={form.reportFooter}
                onChange={(e) => setForm({ ...form, reportFooter: e.target.value })}
                className="w-full h-8 px-3 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              />
            </div>
          </div>
        </div>

        {/* Operational Defaults */}
        <div className="pt-2">
          <h3 className="font-semibold text-neutral-200 text-xs mb-3 border-b border-neutral-800 pb-1">
            Operational Defaults
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1">Default Initial Case Result</label>
              <select
                value={form.defaultResult}
                onChange={(e) => setForm({ ...form, defaultResult: e.target.value })}
                className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              >
                {resultsList.map((r) => (
                  <option key={r.ResultID} value={r.ResultName}>
                    {r.ResultName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Display Date Standard</label>
              <select
                value={form.dateFormat || 'DD-MM-YYYY'}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({ ...form, dateFormat: val });
                  setStoredDateFormat(val as DateFormatPattern);
                }}
                className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500"
              >
                {DATE_FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label} — e.g. {opt.example}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Visual Theme</label>
              <select
                value={form.theme || 'dark'}
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
                className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-amber-500"
              >
                <option value="dark">Dark Theme (Judicial Night)</option>
                <option value="light">Light Theme (Judicial Day)</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Upcoming Dairy Window (Days)</label>
              <input
                type="number"
                value={form.upcomingDays}
                onChange={(e) => setForm({ ...form, upcomingDays: e.target.value })}
                className="w-full h-8 px-3 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Automatic Database Backup Cadence</label>
              <select
                value={form.autoBackup}
                onChange={(e) => setForm({ ...form, autoBackup: e.target.value })}
                className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
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
            className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-semibold rounded shadow-sm disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
