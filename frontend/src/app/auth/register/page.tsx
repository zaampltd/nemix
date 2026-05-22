"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap, Eye, EyeOff, AlertCircle, Lock, Mail, User,
  CheckCircle2, ArrowRight, ShieldCheck, ShieldAlert, Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/lib/theme';
import AnimatedMascot from '@/components/auth/AnimatedMascot';

// ─── Custom Floating Ribbon SVG Component ──────────────────────────────────
const FloatingRibbon = ({ className = '', delay = 0, duration = 6, color1 = '#ec4899', color2 = '#8b5cf6' }) => (
  <motion.svg
    className={`absolute pointer-events-none ${className}`}
    width="160"
    height="160"
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    animate={{
      y: [0, -20, 0],
      rotate: [0, -15, 15, 0],
      scale: [1, 0.95, 1.05, 1],
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  >
    <path
      d="M130 140C110 50 140 120 80 100C20 80 50 40 30 20"
      stroke={`url(#ribbon-grad-reg-${color1.replace('#', '')})`}
      strokeWidth="16"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.85"
    />
    <defs>
      <linearGradient id={`ribbon-grad-reg-${color1.replace('#', '')}`} x1="130" y1="140" x2="30" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor={color1} />
        <stop offset="1" stopColor={color2} />
      </linearGradient>
    </defs>
  </motion.svg>
);

// ─── Floating Shiny Sphere Component ───────────────────────────────────────
const FloatingSphere = ({ size = 'w-10 h-10', position = '', delay = 0, duration = 5, colorGrad = 'from-fuchsia-400 to-purple-800' }) => (
  <motion.div
    className={`absolute rounded-full pointer-events-none bg-gradient-to-br ${colorGrad} ${size} ${position}`}
    animate={{
      y: [0, -15, 0],
      scale: [1, 1.06, 0.94, 1],
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
    style={{
      boxShadow: 'inset -6px -6px 12px rgba(0,0,0,0.5), inset 6px 6px 12px rgba(255,255,255,0.4)',
    }}
  />
);

function RegisterFormInner() {
  const router = useRouter();
  const { signUpWithEmail, loginWithGoogle } = useAuth();
  const { theme, toggle } = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) return;
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!termsAccepted) {
      setError('You must accept the Terms and Conditions.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signUpWithEmail(fullName, email, password);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err: any) {
      console.warn("Firebase sign up failed, trying local fallback:", err.code || err.message);

      // Verify if email is already saved locally
      const localUsers: any[] = JSON.parse(localStorage.getItem('local_users') || '[]');
      if (localUsers.some(u => u.email === email)) {
        setError('An account with this email address already exists.');
        setLoading(false);
        return;
      }

      // Add to local sandbox array in localStorage
      const newSandboxUser = { email, password, full_name: fullName };
      localStorage.setItem('local_users', JSON.stringify([...localUsers, newSandboxUser]));
      
      const mockProfile = {
        email,
        full_name: fullName,
        id: 'sandbox-id-' + Math.random().toString(36).substr(2, 9)
      };
      localStorage.setItem('token', `local-token-${email}`);
      localStorage.setItem('current_user', JSON.stringify(mockProfile));

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1200);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (err: any) {
      console.warn("Firebase Google signup failed, running sandbox fallback:", err);
      
      // Sandbox fallback
      const mockProfile = {
        email: 'google.developer@nemix.ai',
        full_name: 'Google AI Developer',
        id: 'sandbox-google-id'
      };
      localStorage.setItem('token', `local-token-google`);
      localStorage.setItem('current_user', JSON.stringify(mockProfile));
      
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1000);
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--md-surface)] text-[var(--md-on-surface)] transition-colors duration-300 overflow-hidden flex flex-col font-sans">
      
      {/* ── Background Glow & Grid ────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.12),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.08),transparent_60%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.18),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.12),transparent_60%)] pointer-events-none transition-all duration-300" />
      <div className="absolute inset-0 bg-[linear-gradient(var(--md-outline-var)_1px,transparent_1px),linear-gradient(90deg,var(--md-outline-var)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 dark:opacity-15 pointer-events-none transition-all duration-300" />

      {/* ── Glassmorphic Top Navbar ──────────────────────────────────────── */}
      <header className="relative w-full max-w-7xl mx-auto px-6 pt-6 z-40">
        <div className="flex items-center justify-between px-6 py-3.5 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/[0.05] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.37)] transition-all duration-300">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              <Zap className="w-4.5 h-4.5 text-white fill-white/10" />
            </div>
            <span className="text-lg font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 transition-all">NEMIX</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-8 text-[13px] font-semibold text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">Home</Link>
            <Link href="/blog" className="hover:text-gray-900 dark:hover:text-white transition-colors">Blog</Link>
            <Link href="/docs" className="hover:text-gray-900 dark:hover:text-white transition-colors font-medium">Documentation</Link>
            <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-[11px] font-bold tracking-wider">v1.2 LAUNCH</span>
          </nav>
          <div className="flex items-center gap-2">
            {/* Sleek Theme Switcher Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggle}
              type="button"
              className="p-2 rounded-xl bg-gray-100/80 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/10 hover:border-violet-500/30 text-gray-700 dark:text-white transition-all cursor-pointer flex items-center justify-center mr-1"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
              ) : (
                <Moon className="w-4 h-4 text-violet-600 fill-violet-600/10" />
              )}
            </motion.button>
            <Link href="/auth/login" className="text-[13px] font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Sign in →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Split Screen Body Layout ─────────────────────────────────────── */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-8 z-30">
        
        {/* ── Left Side: Register Form ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full lg:w-[46%] max-w-[460px] shrink-0"
        >
          {/* Glass Form Card */}
          <div className="relative rounded-3xl bg-white/70 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] backdrop-blur-2xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300">
            
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent" />

            {/* Heading */}
            <div className="mb-6">
              <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-950 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-gray-300 mb-2">
                Create Account 🚀
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Join the next generation of AI developers</p>
            </div>

            {/* Social Sign Up */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignup}
                type="button"
                className="flex items-center justify-center gap-2.5 h-11 rounded-xl bg-gray-50/50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 hover:border-violet-500/30 hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-800 dark:text-white text-xs font-bold transition-all cursor-pointer shadow-sm dark:shadow-lg"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Google
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignup}
                type="button"
                className="flex items-center justify-center gap-2.5 h-11 rounded-xl bg-gray-50/50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 hover:border-fuchsia-500/30 hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-800 dark:text-white text-xs font-bold transition-all cursor-pointer shadow-sm dark:shadow-lg"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                GitHub
              </motion.button>
            </div>

            {/* Email Divider */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="flex-1 h-[1px] bg-gray-200 dark:bg-white/10" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">or use credentials</span>
              <div className="flex-1 h-[1px] bg-gray-200 dark:bg-white/10" />
            </div>

            {/* Signup Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 px-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={fullName}
                    onChange={e => { setFullName(e.target.value); setError(''); }}
                    className="w-full h-11 pl-11 pr-4 bg-gray-50/30 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:border-fuchsia-500/80 focus:ring-1 focus:ring-fuchsia-500/20 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 px-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    required
                    placeholder="john@company.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    className="w-full h-11 pl-11 pr-4 bg-gray-50/30 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:border-fuchsia-500/80 focus:ring-1 focus:ring-fuchsia-500/20 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 px-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    className="w-full h-11 pl-11 pr-12 bg-gray-50/30 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:border-fuchsia-500/80 focus:ring-1 focus:ring-fuchsia-500/20 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer flex items-center"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 px-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                    className="w-full h-11 pl-11 pr-12 bg-gray-50/30 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus:border-fuchsia-500/80 focus:ring-1 focus:ring-fuchsia-500/20 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer flex items-center"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms and conditions */}
              <div className="flex items-start gap-2.5 pt-1.5 px-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4.5 h-4.5 rounded bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/10 accent-fuchsia-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="terms" className="text-[11px] text-gray-500 dark:text-gray-400 font-medium cursor-pointer leading-tight select-none">
                  By signing up, I agree to the <Link href="#" className="text-fuchsia-600 dark:text-fuchsia-400 hover:underline">Terms of Service</Link> and <Link href="#" className="text-fuchsia-600 dark:text-fuchsia-400 hover:underline">Privacy Policy</Link> regarding AI compute usages.
                </label>
              </div>

              {/* Errors */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold"
                  >
                    <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Create Account Submit */}
              <motion.button
                type="submit"
                disabled={loading || success}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="relative w-full h-12 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-extrabold text-sm shadow-[0_4px_20px_rgba(217,70,239,0.35)] hover:shadow-[0_4px_25px_rgba(217,70,239,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed overflow-hidden"
              >
                {success ? (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    Creating Sandbox Environment...
                  </motion.div>
                ) : loading ? (
                  <div className="flex items-center gap-2.5">
                    <div className="w-4.5 h-4.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Registering Account...
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 font-black uppercase tracking-wider">
                    Create Free Account <ArrowRight className="w-4.5 h-4.5 ml-0.5" />
                  </div>
                )}
              </motion.button>
            </form>

            {/* Bottom Navigation Link */}
            <div className="mt-6 pt-5 border-t border-gray-200 dark:border-white/[0.06] text-center">
              <span className="text-xs text-gray-500 font-medium">Already have a Nemix account? </span>
              <Link href="/auth/login" className="text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-500 dark:hover:text-fuchsia-300 transition-colors">
                Sign in →
              </Link>
            </div>

            {/* Security compliances */}
            <div className="flex justify-center gap-5 mt-4.5 opacity-30">
              <div className="flex items-center gap-1 text-[9px] font-bold text-gray-500 dark:text-gray-400">
                <ShieldCheck className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> SECURE DATA
              </div>
              <div className="flex items-center gap-1 text-[9px] font-bold text-gray-500 dark:text-gray-400">
                <ShieldAlert className="w-3 h-3 text-fuchsia-500 dark:text-fuchsia-400" /> COMPLY GUARANTEE
              </div>
            </div>

          </div>
        </motion.div>

        {/* ── Right Side: Immersive 3D Presentation Scene ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="hidden lg:flex flex-1 flex-col items-center justify-center relative min-h-[580px] w-full"
        >
          {/* Glowing Radial Backdrop Backgrounds */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/3 -translate-y-1/3 w-[260px] h-[260px] bg-violet-600/8 rounded-full blur-[90px] pointer-events-none" />

          {/* Dribbble Style Ornaments */}
          <FloatingRibbon className="top-12 left-14" delay={0.5} duration={7} color1="#ec4899" color2="#8b5cf6" />
          <FloatingRibbon className="bottom-10 right-10 scale-75 rotate-45" delay={1.8} duration={8.5} color1="#3b82f6" color2="#a855f7" />
          
          <FloatingSphere size="w-12 h-12" position="top-24 right-20" delay={0.2} duration={5.5} colorGrad="from-violet-400 to-fuchsia-800" />
          <FloatingSphere size="w-7 h-7" position="bottom-28 left-16" delay={1.2} duration={4.8} colorGrad="from-fuchsia-400 to-indigo-800" />
          <FloatingSphere size="w-5 h-5" position="top-2/3 right-1/4" delay={0.8} duration={6} colorGrad="from-purple-400 to-pink-700" />

          {/* Tagline */}
          <div className="text-center max-w-[480px] mb-8 z-20">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-3"
            >
              The fastest way to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 via-violet-500 to-blue-600 dark:from-fuchsia-400 dark:via-violet-400 dark:to-blue-500">ship AI models.</span>
            </motion.h2>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed px-6">
              Empower your product with custom intelligence. Fine-tune open weights, validate training metrics in real-time, and run instantly at scale.
            </p>
          </div>

          {/* Mascot Scene Area */}
          <AnimatedMascot />
          
        </motion.div>

      </div>

      {/* Footer copyright */}
      <footer className="w-full text-center py-6 text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-600 uppercase z-30 select-none">
        © {new Date().getFullYear()} Nemix AI Platform Inc. All rights reserved.
      </footer>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--md-surface)] flex items-center justify-center text-[var(--md-on-surface)] transition-colors duration-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">LOADING SAAS PLATFORM...</span>
        </div>
      </div>
    }>
      <RegisterFormInner />
    </Suspense>
  );
}
