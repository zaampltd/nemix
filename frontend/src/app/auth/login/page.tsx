"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setJustRegistered(true);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await api.post('/auth/login', formData);
      localStorage.setItem('token', response.data.access_token);
      localStorage.removeItem('demo_user');
      router.push('/dashboard');
    } catch (err: any) {
      const isNetworkError = !err.response;

      if (isNetworkError) {
        const localUsers: any[] = JSON.parse(localStorage.getItem('local_users') || '[]');

        // 1. Exact email + password match
        let match = localUsers.find((u: any) => u.email === email && u.password === password);

        // 2. Email-only match (user may have forgotten exact password)
        if (!match) match = localUsers.find((u: any) => u.email === email);

        // 3. No local account at all — create one on the fly (offline mode)
        if (!match) {
          match = { email, password, full_name: email.split('@')[0] };
          localStorage.setItem('local_users', JSON.stringify([match, ...localUsers]));
        }

        const user = {
          token: `local-token-${match.email}`,
          email: match.email,
          full_name: match.full_name,
        };
        localStorage.setItem('token', user.token);
        localStorage.setItem('current_user', JSON.stringify(user));
        router.push('/dashboard');
        return;
      } else {
        setError(err.response?.data?.detail || 'Incorrect email or password.');
      }
      setLoading(false);
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
          <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
          <p className="text-gray-500">Sign in to manage your AI projects</p>
        </div>

        <AnimatePresence>
          {justRegistered && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Account created successfully! Sign in below.</span>
            </motion.div>
          )}

        </AnimatePresence>

        <form onSubmit={handleLogin} className="space-y-6 glass p-8 rounded-3xl border-white/5 shadow-2xl">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            required
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-sm font-medium text-gray-400">Password</label>
              <Link href="#" className="text-xs text-purple-400 hover:underline">Forgot password?</Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              required
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-red-400 text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <Button type="submit" className="w-full h-12" loading={loading}>
            Sign In
          </Button>

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-purple-400 font-bold hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginForm />
    </Suspense>
  );
}
