import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  KeyRound,
  RotateCcw,
  Check,
  ShieldCheck,
  AlertCircle,
  PhoneCall,
  HelpCircle,
  FileText,
  Volume2,
  Calendar,
  ExternalLink,
  BookOpen,
  HelpCircle as FaqIcon,
  Sparkles
} from 'lucide-react';
import { GovHeader, BangladeshGovEmblem, CourtLogo } from './GovBrand.js';
import { api } from '../services/api.js';

interface Props {
  onLoginSuccess: (user: any) => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  courtName?: string;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess, onToast, courtName }) => {
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [username, setUsername] = useState(() => localStorage.getItem('court_dairy_remembered_user') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUser, setRememberUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'guide'>('signin');

  // Security Code / Captcha
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [captchaSpin, setCaptchaSpin] = useState(false);

  // Generate random 5-character alphanumeric captcha
  const generateCaptcha = () => {
    setCaptchaSpin(true);
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setUserCaptcha('');
    setTimeout(() => setCaptchaSpin(false), 300);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Quick Demo Logins
  const handleQuickLogin = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setUserCaptcha(captchaCode);
    onToast('info', `Credentials populated for ${demoUser}. Click 'Sign In' or press Enter.`);
  };

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
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে ইউজার আইডি ও পাসওয়ার্ড লিখুন।' : 'Please enter both User ID and password.');
      return;
    }

    // Verify security code
    if (userCaptcha.trim().toUpperCase() !== captchaCode) {
      setErrorMsg(lang === 'bn' ? 'ভুল সিকিউরিটি কোড! ছবিতে প্রদর্শিত কোডটি সঠিকভাবে লিখুন।' : 'Invalid Security Code. Please enter the characters shown in the verification image.');
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
      onToast('success', `${lang === 'bn' ? 'স্বাগতম' : 'Welcome'}, ${res.user.fullName}`);
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
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col justify-between text-slate-800 font-sans select-none antialiased">
      {/* 1. Official Government Header (eTax NBR signature) */}
      <GovHeader
        activeLang={lang}
        onToggleLang={(l) => setLang(l)}
      />

      {/* 2. Secondary eTax Navigation Ribbon */}
      <nav className="bg-[#004D39] text-white border-b border-[#003829] shadow-sm hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1 sm:space-x-4">
            <button
              type="button"
              onClick={() => setActiveTab('signin')}
              className={`py-2 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'signin'
                  ? 'border-[#F59E0B] text-white bg-white/10'
                  : 'border-transparent text-emerald-100 hover:text-white hover:bg-white/5'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'bn' ? 'সাইন ইন / প্রবেশ' : 'Portal Sign In'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('guide');
                onToast('info', 'Case Diary User Manual & Quick Reference Guide displayed.');
              }}
              className={`py-2 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'border-[#F59E0B] text-white bg-white/10'
                  : 'border-transparent text-emerald-100 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'bn' ? 'ব্যবহার নির্দেশিকা' : 'User Manual'}</span>
            </button>
            <button
              type="button"
              onClick={() => onToast('info', 'Helpline: 09612-779077 / 01726427751 (9 AM - 5 PM)')}
              className="py-2 px-3 font-semibold border-b-2 border-transparent text-emerald-100 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'bn' ? 'হেল্পডেস্ক' : 'Helpdesk'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-emerald-200 text-[11px] py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{lang === 'bn' ? 'অফলাইন ডেটাবেস সক্রিয়' : 'Offline Secure SQLite Active'}</span>
          </div>
        </div>
      </nav>

      {/* 3. Official Notice Ticker (eTax NBR signature) */}
      <div className="bg-[#FFFBEB] border-b border-amber-200/80 px-4 py-2 flex items-center text-xs text-amber-900 overflow-hidden shadow-xs">
        <div className="max-w-7xl mx-auto w-full flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-amber-800 shrink-0 bg-amber-100/90 px-2.5 py-1 rounded-md text-[11px] border border-amber-300">
            <Volume2 className="w-3.5 h-3.5 text-amber-700 animate-bounce" />
            <span>{lang === 'bn' ? 'জরুরি বিজ্ঞপ্তি' : 'Official Notice'}</span>
          </div>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            <p className="inline-block animate-marquee font-medium text-xs text-slate-800">
              {lang === 'bn'
                ? 'আইন ও বিচার বিভাগ: বেঞ্চ অফিসার ও জুডিশিয়াল ম্যাজিস্ট্রেটদের জন্য সরকারি নির্দেশিকা অনুযায়ী সকল কোর্ট কেস ডায়েরি, কার্যতালিকা ও কজ-লিস্ট অনলাইনে এবং অফলাইনে স্বয়ংক্রিয়ভাবে সংরক্ষিত রয়েছে। যেকোনো প্রযুক্তিগত সহায়তায় যোগাযোগ করুন ০১৭২৬-৪২৭৭৫১।'
                : 'National Judicial Case Diary Portal: All cause list proceedings, case register numbers, hearing schedules, and orders are digitally logged with high-grade offline SQLite encryption. Technical assistance: 09612-779077 / 01726427751.'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Main Sign-In Card (eTax NBR signature layout) */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden transition-all duration-300">
          
          {/* Left Panel: Portal Branding & Key Highlights (Deep Bangladesh Emerald) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#006A4E] via-[#00543e] to-[#004332] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle Bangladesh seal background watermark */}
            <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none">
              <BangladeshGovEmblem size={240} />
            </div>

            <div className="relative z-10 space-y-5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-200 border border-white/20 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>e-Judiciary Portal</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Court<span className="text-[#D92534]">Diary</span>
                </h2>
                <p className="text-xs text-emerald-100 font-semibold">
                  {lang === 'bn' ? 'কোর্ট কেস ডায়েরি ও কার্যতালিকা ব্যবস্থা' : 'Judicial Case Diary & Ledger System'}
                </p>
                <div className="pt-2 text-xs text-white/90 leading-relaxed font-normal">
                  {lang === 'bn'
                    ? 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের আদালত ও বেঞ্চ অফিসারদের দৈনন্দিন মামলার কার্যবিবরণী ও কজ-লিস্ট ব্যবস্থাপনার অফিসিয়াল প্ল্যাটফর্ম।'
                    : 'Official Court Case Diary & Management Portal for Bench Officers, Clerks, and Judicial Magistrates.'}
                </div>
              </div>

              {/* Service Highlights */}
              <div className="pt-4 border-t border-white/15 space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5 text-emerald-50">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>{lang === 'bn' ? 'অফলাইন ও অনলাইন সমন্বিত সুরক্ষিত ডাটাবেস' : 'Encrypted Offline SQLite storage with instant sync and audit logging.'}</span>
                </div>
                <div className="flex items-start gap-2.5 text-emerald-50">
                  <FileText className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>{lang === 'bn' ? 'দৈনিক কজ-লিস্ট ও আদেশনামা স্বয়ংক্রিয় প্রিন্ট ও রপ্তানি' : 'Automated daily cause list registers, hearing orders, and gazette export.'}</span>
                </div>
                <div className="flex items-start gap-2.5 text-emerald-50">
                  <Calendar className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>{lang === 'bn' ? 'পরবর্তী শুনানির তারিখ ও নিষ্পত্তির ট্র্যাকিং' : 'Next hearing scheduler with automatic upcoming and overdue alerts.'}</span>
                </div>
              </div>
            </div>

            {/* Bottom Support Info */}
            <div className="relative z-10 pt-6 mt-6 border-t border-white/15 text-[11px] text-emerald-100/90 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-amber-300" />
                <span>Helpline: <strong className="text-white">+01726427751</strong></span>
              </div>
              <span className="font-mono text-[10px] text-emerald-200 bg-white/10 px-2 py-0.5 rounded border border-white/10">v2.6 (2026)</span>
            </div>
          </div>

          {/* Right Panel: Official eTax-Style Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-white">
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>{lang === 'bn' ? 'সাইন ইন করুন' : 'Sign In to Portal'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {lang === 'bn'
                      ? 'অনুমোদিত ইউজার আইডি ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।'
                      : 'Enter your authorized User ID and password to access the bench registry.'}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <CourtLogo subtitle={false} />
                </div>
              </div>

              {/* Quick Fill Demo Accounts (For easy review & testing) */}
              <div className="mt-4 p-2.5 bg-emerald-50/70 border border-emerald-200/90 rounded-xl">
                <div className="text-[11px] font-bold text-[#006A4E] mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'bn' ? 'দ্রুত প্রবেশ (পরীক্ষামূলক একাউন্ট):' : 'Instant Demo Login (One-Click Fill):'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin', 'admin123')}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white text-emerald-900 border border-emerald-300 rounded-lg hover:bg-emerald-600 hover:text-white hover:border-emerald-600 shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                    title="Fill as Admin / Bench Officer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Admin: <strong>admin</strong> / <strong>admin123</strong></span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('clerk', 'clerk123')}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-700 hover:text-white hover:border-slate-700 shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                    title="Fill as Judicial Clerk"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    <span>Clerk: <strong>clerk</strong> / <strong>clerk123</strong></span>
                  </button>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* User ID Field */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {lang === 'bn' ? 'ইউজার আইডি / অফিসার আইডি' : 'User ID / Officer ID'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder={lang === 'bn' ? 'ইউজার আইডি লিখুন (যেমন: admin)' : 'Enter your User ID (e.g. admin)'}
                    className="w-full h-11 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#006A4E] focus:ring-3 focus:ring-[#006A4E]/20 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold">
                    {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'} <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetUsername(username.trim());
                      setShowResetModal(true);
                    }}
                    className="text-[11px] text-[#006A4E] hover:text-[#00543e] font-bold hover:underline cursor-pointer"
                  >
                    {lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={lang === 'bn' ? 'পাসওয়ার্ড লিখুন' : 'Enter password'}
                    className="w-full h-11 pl-9 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#006A4E] focus:ring-3 focus:ring-[#006A4E]/20 transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer rounded-md hover:bg-slate-100 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Security Code / Captcha (eTax NBR signature) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {lang === 'bn' ? 'সিকিউরিটি কোড' : 'Security Code'} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                  {/* Captcha Display Box */}
                  <div className="h-11 px-3 bg-gradient-to-r from-emerald-50 via-slate-100 to-emerald-50 border border-slate-300 rounded-xl flex items-center justify-between shadow-inner select-none">
                    <span className="font-mono text-lg font-black tracking-widest text-[#006A4E] italic line-through decoration-slate-400/80 select-none">
                      {captchaCode}
                    </span>
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      className="p-1.5 text-slate-500 hover:text-[#006A4E] hover:bg-white rounded-lg transition-all cursor-pointer shadow-2xs"
                      title="Reload Security Code"
                    >
                      <RotateCcw className={`w-4 h-4 ${captchaSpin ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Captcha Input */}
                  <input
                    type="text"
                    value={userCaptcha}
                    onChange={(e) => setUserCaptcha(e.target.value)}
                    required
                    maxLength={5}
                    placeholder={lang === 'bn' ? 'কোডটি এখানে লিখুন' : 'Type code above'}
                    className="h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-mono font-bold text-xs tracking-wider placeholder:normal-case placeholder:font-normal placeholder:tracking-normal focus:bg-white focus:outline-none focus:border-[#006A4E] focus:ring-3 focus:ring-[#006A4E]/20 transition-all shadow-2xs"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {lang === 'bn' ? 'নিরাপত্তার স্বার্থে ছবিতে প্রদর্শিত অক্ষরমালিকাটি লিখুন।' : 'Case-insensitive verification code required for portal security.'}
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
                  <span className="text-xs font-semibold text-slate-700">
                    {lang === 'bn' ? 'ইউজার আইডি মনে রাখুন' : 'Remember User ID'}
                  </span>
                </label>
              </div>

              {/* Login Button (Animated & Responsive) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 sm:h-12 btn-gov-primary flex items-center justify-center gap-2.5 text-xs sm:text-sm uppercase tracking-wider font-bold cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {submitting
                      ? (lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Authenticating...')
                      : (lang === 'bn' ? 'সাইন ইন করুন' : 'Sign In')}
                  </span>
                </button>
              </div>
            </form>

            {/* Advisory Note */}
            <div className="mt-5 pt-4 border-t border-slate-200 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2 bg-slate-50/90 p-3 rounded-xl border border-slate-200">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>{lang === 'bn' ? 'জরুরি নির্দেশনা:' : 'Important Notice:'}</strong>{' '}
                {lang === 'bn'
                  ? 'আপনার পাসওয়ার্ড কারো সাথে শেয়ার করবেন না। সহায়তার প্রয়োজনে যোগাযোগ করুন: ০১৭২৬-৪২৭৭৫১।'
                  : 'Never disclose your credentials to unauthorized persons. For administrative support, contact System Helpdesk at +01726427751.'}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* 5. Official Government Portal Footer (eTax NBR signature) */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-4 text-center text-xs text-slate-600 select-none shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px]">
          <div className="flex items-center gap-2">
            <BangladeshGovEmblem className="w-5 h-5 shrink-0" />
            <span>
              Copyright © {new Date().getFullYear()} <strong>Government of the People's Republic of Bangladesh</strong>. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 font-medium">
            <span>National Judicial Registry</span>
            <span>·</span>
            <span>ISO 27001 Certified</span>
            <span>·</span>
            <span className="text-[#006A4E] font-bold">Court Case Diary System</span>
          </div>
        </div>
      </footer>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-modal-card relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#006A4E] via-[#059669] to-[#C59B27]" />
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
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}
            <form onSubmit={handleResetSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">User ID</label>
                <input
                  type="text"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  required
                  placeholder="Enter your User ID"
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#006A4E] focus:ring-2 focus:ring-[#006A4E]/20"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={5}
                  placeholder="Minimum 5 characters"
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#006A4E] focus:ring-2 focus:ring-[#006A4E]/20"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={5}
                  placeholder="Repeat new password"
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#006A4E] focus:ring-2 focus:ring-[#006A4E]/20"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="btn-gov-primary px-4 py-1.5 text-white font-bold"
                >
                  {resetSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
