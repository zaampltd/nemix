"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
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
  const [justRegistered, setJustRegistered] = useState(
    () => searchParams.get('registered') === 'true'
  );

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
      if (!err.response) {
        const localUsers: any[] = JSON.parse(localStorage.getItem('local_users') || '[]');
        let match = localUsers.find((u: any) => u.email === email && u.password === password)
          || localUsers.find((u: any) => u.email === email);
        if (!match) {
          match = { email, password, full_name: email.split('@')[0] };
          localStorage.setItem('local_users', JSON.stringify([match, ...localUsers]));
        }
        const user = { token: `local-token-${match.email}`, email: match.email, full_name: match.full_name };
        localStorage.setItem('token', user.token);
        localStorage.setItem('current_user', JSON.stringify(user));
        router.push('/dashboard');
        return;
      }
      setError(err.response?.data?.detail || 'Incorrect email or password.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--md-surface)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-2xl mb-6 tracking-tight" style={{ color: 'var(--md-on-surface)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--md-primary)' }}>
              <Zap className="w-5 h-5" style={{ color: 'var(--md-on-primary)' }} />
            </div>
            Nemix
          </Link>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--md-on-surface)' }}>Welcome back</h1>
          <p style={{ color: 'var(--md-on-surface-var)' }}>Sign in to manage your AI projects</p>
        </div>

        <AnimatePresence>
          {justRegistered && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 mb-6 p-4 rounded-2xl"
              style={{ background: 'var(--md-success-cont)', border: '1px solid var(--md-outline)' }}>
              <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--md-success)' }} />
              <span className="text-sm" style={{ color: 'var(--md-success)' }}>Account created successfully! Sign in below.</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleLogin} className="space-y-5 p-8 rounded-3xl"
          style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-2)' }}>
          <Input label="Email Address" type="email" placeholder="name@company.com"
            value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required />

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-sm font-medium" style={{ color: 'var(--md-on-surface-var)' }}>Password</label>
              <Link href="#" className="text-xs hover:underline" style={{ color: 'var(--md-primary)' }}>Forgot password?</Link>
            </div>
            <Input type="password" placeholder="••••••••"
              value={password} onChange={e => { setPassword(e.target.value); setError(''); }} required />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p key="error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-sm text-center" style={{ color: 'var(--md-error)' }}>
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <Button type="submit" className="w-full h-12" loading={loading}>Sign In</Button>

          <p className="text-center text-sm" style={{ color: 'var(--md-on-surface-var)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-bold hover:underline" style={{ color: 'var(--md-primary)' }}>Sign up</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--md-surface)' }} />}>
      <LoginForm />
    </Suspense>
  );
}
