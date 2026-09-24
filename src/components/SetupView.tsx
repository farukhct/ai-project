import React, { useState } from 'react';
import { Shield, KeyRound, User, Lock, ArrowRight, AlertCircle, Database } from 'lucide-react';
import courtEmblem from '../assets/images/court_emblem_insignia_1790276040697.jpg';
import benchBanner from '../assets/images/courtroom_bench_banner_1790276054267.jpg';

interface Props {
  onSetupComplete: (user: any) => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const SetupView: React.FC<Props> = ({ onSetupComplete, onToast }) => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (username.trim().length < 3) {
      setErrorMsg('Username must be at least 3 characters long.');
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full official name and designation.');
      return;
    }
    if (password.length < 5) {
      setErrorMsg('Password must be at least 5 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          fullName: fullName.trim(),
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      localStorage.setItem('court_dairy_auth_token', data.token);
      localStorage.setItem('court_dairy_auth_user', JSON.stringify(data.user));
      onToast('success', 'Administrator account configured successfully.');
      onSetupComplete(data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error configuring administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4 relative select-none">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <img
          src={benchBanner}
          alt="Courtroom"
          className="w-full h-full object-cover filter blur-sm"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="relative z-10 max-w-md w-full bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-6 pb-4 text-center border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex justify-center mb-3">
            <img
              src={courtEmblem}
              alt="Court Seal"
              className="w-16 h-16 rounded-xl border border-neutral-700 shadow-md object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-xl font-bold font-serif text-neutral-100 tracking-tight">
            Court Dairy System
          </h1>
          <div className="text-xs text-amber-500 font-medium tracking-wide mt-0.5">
            Initial Administrator Setup (First-Run Wizard)
          </div>
          <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
            SQLite database <code className="text-neutral-300 font-mono">CourtDairy.db</code> created. Define your primary administrator credentials to secure this installation.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-lg text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Administrator Username (Login ID) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="e.g. admin or bench_officer"
                className="w-full h-9 pl-9 pr-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Full Official Name & Judicial Title *
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="e.g. Chief Bench Officer M. Faruk"
                className="w-full h-9 pl-9 pr-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Master Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter strong password (min 5 chars)"
                className="w-full h-9 pl-9 pr-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm password"
                className="w-full h-9 pl-9 pr-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold rounded-lg flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-50"
            >
              <span>{submitting ? 'Creating Administrator...' : 'Initialize & Launch System'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="p-3 bg-neutral-950 text-center border-t border-neutral-800 text-[10px] text-neutral-500 flex items-center justify-center gap-1.5">
          <Database className="w-3 h-3 text-amber-500" />
          <span>Offline SQLite Storage · No Cloud Dependency</span>
        </div>
      </div>
    </div>
  );
};
