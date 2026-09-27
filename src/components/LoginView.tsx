import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, KeyRound, Database, RotateCcw, Check } from 'lucide-react';
import courtEmblem from '../assets/images/court_emblem_insignia_1790276040697.jpg';
import benchBanner from '../assets/images/courtroom_bench_banner_1790276054267.jpg';
import { api } from '../services/api.js';

interface Props {
  onLoginSuccess: (user: any) => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  courtName?: string;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess, onToast, courtName }) => {
  const [username, setUsername] = useState(() => localStorage.getItem('court_dairy_remembered_user') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUser, setRememberUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Reset modal state
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.login({
        username: username.trim(),
        password
      });

      if (rememberUser) {
        localStorage.setItem('court_dairy_remembered_user', username.trim());
      } else {
        localStorage.removeItem('court_dairy_remembered_user');
      }

      localStorage.setItem('court_dairy_auth_token', res.token);
      localStorage.setItem('court_dairy_auth_user', JSON.stringify(res.user));
      onToast('success', `Welcome, ${res.user.fullName}`);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetUsername.trim()) {
      setResetError('Please enter your account username.');
      return;
    }

    if (!newPassword || newPassword.length < 5) {
      setResetError('New password must be at least 5 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    try {
      setResetSubmitting(true);
      const res = await api.resetPassword({
        username: resetUsername.trim(),
        newPassword
      });
      setResetSuccess(res.message);
      setUsername(resetUsername.trim());
      setPassword(newPassword);
      setTimeout(() => {
        setShowResetModal(false);
        setResetSuccess(null);
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password.');
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4 relative select-none">
      {/* Background Courtroom Bench with Scrim */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={benchBanner}
          alt="Courtroom Bench"
          className="w-full h-full object-cover filter brightness-[0.25] blur-[1px]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-neutral-950/70"></div>
      </div>

      <div className="relative z-10 max-w-md w-full bg-neutral-900/95 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md animate-fadeIn">
        {/* Header */}
        <div className="p-6 text-center border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex justify-center mb-3">
            <img
              src={courtEmblem}
              alt="Judicial Insignia"
              className="w-16 h-16 rounded-xl border border-neutral-700 shadow-md object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-xl font-bold font-serif text-neutral-100 tracking-tight">
            Court Dairy
          </h1>
          <div className="text-xs text-amber-500 font-medium tracking-wide mt-0.5">
            Court Case Diary & Management System
          </div>
          <p className="text-[11px] text-neutral-400 mt-1 truncate">
            {courtName || 'Court of Judicial Magistrate & Bench Officers'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-lg text-rose-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Username / Officer ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
                className="w-full h-9 pl-9 pr-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-neutral-300 font-medium">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetUsername(username.trim());
                  setShowResetModal(true);
                }}
                className="text-[11px] text-amber-500 hover:text-amber-400 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full h-9 pl-9 pr-9 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-neutral-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberUser}
                onChange={(e) => setRememberUser(e.target.checked)}
                className="rounded bg-neutral-950 border-neutral-700 text-amber-600 focus:ring-0"
              />
              <span>Remember username</span>
            </label>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-10 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold rounded-lg flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </div>
        </form>

        <div className="p-3 bg-neutral-950 text-center border-t border-neutral-800 text-[10px] text-neutral-500 flex items-center justify-between px-6">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-amber-500" />
            <span>SQLite CourtDairy.db</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setResetUsername(username.trim());
              setShowResetModal(true);
            }}
            className="text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Password</span>
          </button>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-neutral-100">Reset Account Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Set a new password for your account. This will update your login credentials in <code className="text-amber-400 font-mono">CourtDairy.db</code>.
            </p>

            {resetError && (
              <div className="p-2.5 bg-rose-950/70 border border-rose-800 rounded text-rose-200 text-xs">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="p-2.5 bg-emerald-950/70 border border-emerald-800 rounded text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 mb-1">Account Username</label>
                <input
                  type="text"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="w-full h-8 px-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">New Password (Min 5 chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full h-8 px-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full h-8 px-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold rounded flex items-center gap-1.5 disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{resetSubmitting ? 'Saving...' : 'Set Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
