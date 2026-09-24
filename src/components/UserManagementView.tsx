import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, User as UserIcon, Trash2, Key, Edit2 } from 'lucide-react';
import { User } from '../types.js';
import { api } from '../services/api.js';

interface Props {
  currentUser: User | null;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const UserManagementView: React.FC<Props> = ({ currentUser, onToast }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Add User state
  const [showAddUser, setShowAddUser] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Administrator' | 'User'>('User');
  const [saving, setSaving] = useState(false);

  // Change Password state
  const [changingPassUserId, setChangingPassUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const list = await api.getUsers();
      setUsers(list);
    } catch (err: any) {
      onToast('error', err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || !fullName.trim()) {
      onToast('error', 'All fields are required.');
      return;
    }

    try {
      setSaving(true);
      await api.createUser({
        username: username.trim(),
        fullName: fullName.trim(),
        password,
        role
      });
      onToast('success', `User account ${username.trim()} created successfully.`);
      setUsername('');
      setFullName('');
      setPassword('');
      setShowAddUser(false);
      loadUsers();
    } catch (err: any) {
      onToast('error', err.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (id: number) => {
    if (!newPassword || newPassword.length < 5) {
      onToast('error', 'Password must be at least 5 characters long.');
      return;
    }
    try {
      await api.updateUser(id, { password: newPassword });
      onToast('success', 'Password updated successfully.');
      setChangingPassUserId(null);
      setNewPassword('');
    } catch (err: any) {
      onToast('error', err.message || 'Failed to update password');
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      const nextActive = u.isActive === 1 ? 0 : 1;
      await api.updateUser(u.userId, { isActive: nextActive });
      onToast('success', `User ${u.username} ${nextActive ? 'activated' : 'deactivated'}.`);
      loadUsers();
    } catch (err: any) {
      onToast('error', err.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (!confirm(`Are you sure you want to permanently delete user account "${u.username}"?`)) return;
    try {
      await api.deleteUser(u.userId);
      onToast('success', `User account "${u.username}" deleted.`);
      loadUsers();
    } catch (err: any) {
      onToast('error', err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">User Account Administration</h2>
            <p className="text-[11px] text-neutral-400">
              Manage bench officers, readers, and administrator authorization levels. Passwords hashed securely in SQLite.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddUser(!showAddUser)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-semibold rounded text-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddUser ? 'Close Form' : 'Create User'}</span>
        </button>
      </div>

      {/* Add User Form */}
      {showAddUser && (
        <form onSubmit={handleCreateUser} className="bg-neutral-900 border border-amber-600/40 p-4 rounded-lg space-y-3 animate-fadeIn text-xs">
          <h3 className="font-semibold text-amber-300">Create New Judicial User Account</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1">Username (Login ID) *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="e.g. officer_ahmed"
                className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Full Name & Title *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="e.g. Hon. Magistrate Faruk"
                className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Secure password..."
                className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Authorization Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full h-8 px-2.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              >
                <option value="User">User / Bench Officer (CRUD & Print)</option>
                <option value="Administrator">Administrator (Full System & User Control)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setShowAddUser(false)}
              className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1 bg-amber-600 text-neutral-950 font-semibold rounded hover:bg-amber-500 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Save User Account'}
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden shadow-sm">
        <div className="p-3 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-200">System Users ({users.length})</span>
          <span className="text-neutral-500">Stored in SQLite 'Users' table</span>
        </div>

        <div className="divide-y divide-neutral-800/60 text-xs">
          {users.map((u) => {
            const isSelf = currentUser?.userId === u.userId;
            const isChangingPass = changingPassUserId === u.userId;

            return (
              <div key={u.userId} className="p-4 hover:bg-neutral-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full border ${u.role === 'Administrator' ? 'bg-amber-950/60 border-amber-800 text-amber-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400'}`}>
                    {u.role === 'Administrator' ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-200">{u.fullName}</span>
                      <span className="text-neutral-400 font-mono">(@{u.username})</span>
                      {isSelf && (
                        <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.2 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                      <span className={u.role === 'Administrator' ? 'text-amber-400 font-medium' : ''}>
                        {u.role}
                      </span>
                      <span>·</span>
                      <span className={u.isActive === 1 ? 'text-emerald-400' : 'text-rose-400'}>
                        {u.isActive === 1 ? 'Active' : 'Deactivated'}
                      </span>
                    </div>
                  </div>
                </div>

                {isChangingPass ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="New password (min 5 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-7 px-2 bg-neutral-950 border border-amber-500 rounded text-neutral-200 text-xs"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdatePassword(u.userId)}
                      className="px-2 py-1 bg-amber-600 text-neutral-950 font-semibold rounded text-xs hover:bg-amber-500"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setChangingPassUserId(null);
                        setNewPassword('');
                      }}
                      className="px-2 py-1 bg-neutral-800 text-neutral-300 rounded text-xs hover:bg-neutral-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChangingPassUserId(u.userId)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs border border-neutral-700 transition-colors"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Reset Password</span>
                    </button>

                    {!isSelf && (
                      <>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`px-2 py-1 rounded text-xs border transition-colors ${
                            u.isActive === 1
                              ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border-neutral-700'
                              : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          }`}
                        >
                          {u.isActive === 1 ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u)}
                          title="Delete user"
                          className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
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
