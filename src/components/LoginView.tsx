import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, KeyRound, RotateCcw, Check, ShieldCheck, AlertCircle, PhoneCall, HelpCircle, FileText } from 'lucide-react';
import { GovHeader, CourtLogo, BangladeshGovEmblem } from './GovBrand.js';
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

  // Security Code / Captcha
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');

  // Generate random 5-character alphanumeric captcha
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setUserCaptcha('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

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
      setErrorMsg('Please enter both User ID and password.');
      return;
    }

    // Verify security code
    if (userCaptcha.trim().toUpperCase() !== captchaCode) {
      setErrorMsg('Invalid Security Code. Please enter the characters shown in the verification image.');
      generateCaptcha();
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
      generateCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetUsername.trim()) {
      setResetError('Please enter your User ID.');
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
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col justify-between text-slate-800 font-sans select-none">
      {/* 1. Official Government Header Banner */}
      <GovHeader
        rightContent={
          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#006A4E] border border-emerald-200 font-medium text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Secure Portal Active
            </span>
            <div className="flex items-center border border-slate-300 rounded overflow-hidden text-xs">
              <button
                type="button"
                className="px-2 py-0.5 bg-[#006A4E] text-white font-medium text-[11px]"
              >
                English
              </button>
              <button
                type="button"
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px]"
              >
                বাংলা
              </button>
            </div>
          </div>
        }
      />

      {/* 2. Main Login Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden">
          {/* Left Panel: Portal Branding & Information */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#006A4E] to-[#004D39] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle Bangladesh seal background watermark */}
            <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none">
              <BangladeshGovEmblem size={240} />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Court<span className="text-[#F42A41]">Diary</span>
                </h2>
                <p className="text-xs text-emerald-100 font-medium">
                  Judicial Case Diary & Ledger System
                </p>
                <div className="pt-2 text-xs text-white/90 leading-relaxed">
                  Official Court Case Diary & Management System of the Bench Officer & Judicial Magistrate.
                </div>
              </div>

              <div className="pt-4 border-t border-white/15 space-y-3 text-xs">
                <div className="flex items-start gap-2.5 text-emerald-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>Centralized, offline SQLite storage with real-time audit logging and encryption.</span>
                </div>
                <div className="flex items-start gap-2.5 text-emerald-100">
                  <FileText className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>Standardized cause list registers, hearing orders, and gazette export tools.</span>
                </div>
              </div>
            </div>

            {/* Bottom Support Info */}
            <div className="relative z-10 pt-6 mt-6 border-t border-white/15 text-[11px] text-emerald-100/90 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-300" />
                <span>Helpdesk: <strong>+01726427751</strong></span>
              </div>
              <span className="font-mono text-[10px] text-emerald-200">Ver 2.6 (2026)</span>
            </div>
          </div>

          {/* Right Panel: Official Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-white">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Sign In to Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter your authorized User ID and password to access the bench registry.
                  </p>
                </div>
                <div className="hidden sm:block">
                  <CourtLogo subtitle={false} />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* User ID Field */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  User ID / Officer ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Enter your User ID (e.g. admin)"
                    className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#006A4E] focus:ring-2 focus:ring-[#006A4E]/20 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetUsername(username.trim());
                      setShowResetModal(true);
                    }}
                    className="text-[11px] text-[#006A4E] hover:text-[#00543e] font-semibold hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    className="w-full h-10 pl-9 pr-10 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#006A4E] focus:ring-2 focus:ring-[#006A4E]/20 transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Security Code / Captcha */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Security Code <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                  {/* Captcha Display Box */}
                  <div className="h-10 px-3 bg-gradient-to-r from-emerald-50 via-slate-100 to-emerald-50 border border-slate-300 rounded-lg flex items-center justify-between shadow-inner select-none">
                    <span className="font-mono text-base font-extrabold tracking-widest text-[#006A4E] italic line-through decoration-slate-400/70 select-none">
                      {captchaCode}
                    </span>
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      className="p-1 text-slate-500 hover:text-[#006A4E] hover:bg-white rounded transition-colors cursor-pointer"
                      title="Reload Security Code"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Captcha Input */}
                  <input
                    type="text"
                    value={userCaptcha}
                    onChange={(e) => setUserCaptcha(e.target.value)}
                    required
                    maxLength={5}
                    placeholder="Type code above"
                    className="h-10 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 uppercase font-mono font-bold text-xs tracking-wider placeholder:normal-case placeholder:font-normal placeholder:tracking-normal focus:bg-white focus:outline-none focus:border-[#006A4E] focus:ring-2 focus:ring-[#006A4E]/20 transition-all shadow-xs"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Case-insensitive verification code required for security.
                </span>
              </div>

              {/* Remember User ID */}
              <div className="flex items-center justify-between text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberUser}
                    onChange={(e) => setRememberUser(e.target.checked)}
                    className="rounded border-slate-300 text-[#006A4E] focus:ring-[#006A4E] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-medium">Remember User ID</span>
                </label>
              </div>

              {/* Login Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 bg-[#006A4E] hover:bg-[#00543e] active:bg-[#004332] text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
                </button>
              </div>
            </form>

            {/* Advisory Note */}
            <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Important Notice:</strong> Never disclose your credentials or one-time verification tokens. For administrative assistance, contact the System Helpdesk at <strong>+01726427751</strong>.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Official Government Portal Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-xs text-slate-600 select-none shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div>
            Copyright © {new Date().getFullYear()} Court Case Diary & Judicial Management System. All rights reserved.
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <span>Official Judicial Registry</span>
            <span>·</span>
            <span>ISO 27001 Certified</span>
            <span>·</span>
            <span className="text-[#006A4E] font-semibold">Court Case Diary System</span>
          </div>
        </div>
      </footer>

      {/* Modern Password Reset Modal styled in Government Portal Theme */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white border border-slate-300 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-modal-card relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-[#006A4E]" />

            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#006A4E]" />
                <h3 className="font-bold text-sm text-slate-900">Reset Portal Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-slate-700 rounded-full p-1 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide your registered User ID to set a new password.
            </p>

            {resetError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Account User ID</label>
                <input
                  type="text"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  placeholder="Enter your User ID"
                  required
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#006A4E] focus:ring-2 focus:ring-[#006A4E]/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">New Password (Min 5 chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#006A4E] focus:ring-2 focus:ring-[#006A4E]/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#006A4E] focus:ring-2 focus:ring-[#006A4E]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="px-4 py-1.5 bg-[#006A4E] hover:bg-[#00543e] text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
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
