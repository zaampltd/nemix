"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Try the real backend first
      await api.post('/auth/register', { email, password, full_name: fullName });
      setSuccess(true);
      setTimeout(() => router.push('/auth/login?registered=true'), 1500);
    } catch (err: any) {
      const isNetworkError = !err.response; // backend offline

      if (isNetworkError) {
        // ── Offline mode: persist credentials so login can match them ──
        const existingUsers: any[] = JSON.parse(localStorage.getItem('local_users') || '[]');
        const alreadyExists = existingUsers.some((u) => u.email === email);
        if (alreadyExists) {
          setError('An account with this email already exists. Please sign in.');
          setLoading(false);
          return;
        }
        const newUser = { email, password, full_name: fullName };
        localStorage.setItem('local_users', JSON.stringify([...existingUsers, newUser]));

        const newUserSession = {
          token: `local-token-${email}`,
          email,
          full_name: fullName,
        };
        localStorage.setItem('token', newUserSession.token);
        localStorage.setItem('current_user', JSON.stringify(newUserSession));
        setSuccess(true);
        setTimeout(() => router.push('/dashboard'), 1200);
      } else {
        // Real backend error (e.g. email already taken)
        setError(err.response?.data?.detail || 'Registration failed. Try a different email.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-purple-500/5 blur-[120px] rounded-full -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-3xl mb-8 tracking-tighter">
            <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center shadow-[0_0_20px_-5px_#a855f7]">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span>Nemix</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-500">Join the next generation of AI builders</p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-10 rounded-3xl border-white/5 shadow-2xl flex flex-col items-center gap-4 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Account Created!</h2>
              <p className="text-gray-400 text-sm">Taking you to the dashboard…</p>
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mt-2" />
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleRegister}
              className="space-y-5 glass p-8 rounded-3xl border-white/5 shadow-2xl"
            >
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />

              <div className="flex items-start gap-3 px-1 pt-2">
                <div className="mt-1 p-1 rounded bg-purple-500/10">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">
                  By creating an account, you agree to our Terms of Service and Privacy Policy regarding AI model usage and data retention.
                </p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-red-400 text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button type="submit" className="w-full h-12 mt-4" loading={loading}>
                Create Free Account
              </Button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-purple-400 font-bold hover:underline">
                  Sign in
                </Link>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
