import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckSquare, AlertCircle, Check, X } from 'lucide-react';
import { ResultOption } from '../types.js';
import { api } from '../services/api.js';

interface Props {
  resultsList: ResultOption[];
  onRefresh: () => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const ResultManagementView: React.FC<Props> = ({
  resultsList,
  onRefresh,
  onToast
}) => {
  const [newResultName, setNewResultName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResultName.trim()) return;

    try {
      setSaving(true);
      await api.addResult(newResultName.trim());
      onToast('success', `Result category "${newResultName.trim()}" added.`);
      setNewResultName('');
      onRefresh();
    } catch (err: any) {
      onToast('error', err.message || 'Failed to add result.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (r: ResultOption) => {
    setEditingId(r.ResultID);
    setEditingName(r.ResultName);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editingName.trim()) return;
    try {
      await api.updateResult(id, { resultName: editingName.trim() });
      onToast('success', 'Result category updated.');
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      onToast('error', err.message || 'Failed to update result.');
    }
  };

  const handleToggleActive = async (r: ResultOption) => {
    try {
      const nextState = r.IsActive === 1 ? false : true;
      await api.updateResult(r.ResultID, { isActive: nextState });
      onToast('success', `Result category ${nextState ? 'activated' : 'deactivated'}.`);
      onRefresh();
    } catch (err: any) {
      onToast('error', err.message || 'Failed to toggle status.');
    }
  };

  const handleDelete = async (r: ResultOption) => {
    if (!confirm(`Are you sure you want to delete result "${r.ResultName}"?`)) return;
    try {
      await api.deleteResult(r.ResultID);
      onToast('success', `Result "${r.ResultName}" deleted.`);
      onRefresh();
    } catch (err: any) {
      onToast('error', err.message || 'Failed to delete result.');
    }
  };

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CheckSquare className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Result Management Facility</h2>
            <p className="text-[11px] text-neutral-400">
              Configure admissible case disposition and adjournment outcome categories stored in SQLite.
            </p>
          </div>
        </div>
      </div>

      {/* Add New Result Form */}
      <form onSubmit={handleAdd} className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg space-y-3">
        <h3 className="text-xs font-semibold text-neutral-200">Add New Result Outcome</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newResultName}
            onChange={(e) => setNewResultName(e.target.value)}
            placeholder="e.g. Adjourned sine die, Compromised, Remanded"
            className="flex-1 h-8 px-3 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 text-xs focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={saving || !newResultName.trim()}
            className="flex items-center gap-1 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-semibold text-xs rounded shadow-sm disabled:opacity-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>
      </form>

      {/* Results List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden shadow-sm">
        <div className="p-3 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-200">Configured Results ({resultsList.length})</span>
          <span className="text-neutral-500">Stored in SQLite 'Results' table</span>
        </div>

        <div className="divide-y divide-neutral-800/60 text-xs">
          {resultsList.map((r) => {
            const isEditing = editingId === r.ResultID;
            const isActive = r.IsActive === 1;

            return (
              <div key={r.ResultID} className="p-3 flex items-center justify-between gap-3 hover:bg-neutral-800/30">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-7 px-2 bg-neutral-950 border border-amber-500 rounded text-neutral-200 text-xs"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(r.ResultID)}
                      className="p-1 text-emerald-400 hover:bg-neutral-800 rounded"
                      title="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-neutral-400 hover:bg-neutral-800 rounded"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-neutral-200">{r.ResultName}</span>
                    <span
                      onClick={() => handleToggleActive(r)}
                      className={`cursor-pointer text-[10px] px-2 py-0.5 rounded border ${
                        isActive
                          ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                          : 'text-neutral-500 bg-neutral-950 border-neutral-800'
                      }`}
                      title="Click to toggle status"
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                )}

                {!isEditing && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(r)}
                      title="Edit Category"
                      className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      title="Delete Category"
                      className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
