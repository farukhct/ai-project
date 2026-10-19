import React, { useState } from 'react';
import { Shield, KeyRound, User, Lock, ArrowRight, AlertCircle, Database } from 'lucide-react';
import { GovHeader, BangladeshGovEmblem } from './GovBrand.js';

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
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col justify-between select-none">
      <GovHeader />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden animate-modal-card relative">
          {/* Top Accent Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-[#006A4E]" />

          {/* Header */}
          <div className="p-6 pb-4 text-center border-b border-slate-200 bg-slate-50/70">
            <div className="flex justify-center mb-3">
              <BangladeshGovEmblem className="w-16 h-16 drop-shadow-xs" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Court<span className="text-[#D92534]">Diary</span> Judicial System
            </h1>
            <div className="text-xs text-[#006A4E] font-bold tracking-wide mt-0.5">
              Initial Administrator Setup (Government Portal)
            </div>
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              SQLite database initialized. Create the master judicial bench administrator credentials to activate the portal.
            </p>
          </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-lg text-rose-200 flex items-center gap-2 animate-slide-down">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
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
                className="form-input-modern w-full h-10 pl-9 pr-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-100 placeholder:text-neutral-500 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
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
                className="form-input-modern w-full h-10 pl-9 pr-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-100 placeholder:text-neutral-500 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
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
                className="form-input-modern w-full h-10 pl-9 pr-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-100 placeholder:text-neutral-500 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
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
                className="form-input-modern w-full h-10 pl-9 pr-3 bg-neutral-950/80 border border-neutral-700/80 rounded-lg text-neutral-100 placeholder:text-neutral-500 text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 shadow-inner"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-[#006A4E] hover:bg-[#00543e] active:bg-[#004332] text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 hover:shadow-lg transition-all form-pressable disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
            >
              <span>{submitting ? 'Creating Administrator...' : 'Initialize & Launch System'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="p-3 bg-slate-50 text-center border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-[#006A4E]" />
          <span>Offline SQLite Storage · Court Case Diary System</span>
        </div>
      </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-2.5 px-4 text-center text-xs text-slate-500">
        Copyright © {new Date().getFullYear()} Court Case Diary & Judicial Management System. All rights reserved.
      </footer>
    </div>
  );
};
