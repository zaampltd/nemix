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
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');

    try {
      await api.post('/auth/register', { email, password, full_name: fullName });
      setSuccess(true);
      setTimeout(() => router.push('/auth/login?registered=true'), 1500);
    } catch (err: any) {
      if (!err.response) {
        const existing: any[] = JSON.parse(localStorage.getItem('local_users') || '[]');
        if (existing.some(u => u.email === email)) {
          setError('An account with this email already exists. Please sign in.');
          setLoading(false); return;
        }
        const newUser = { email, password, full_name: fullName };
        localStorage.setItem('local_users', JSON.stringify([...existing, newUser]));
        const session = { token: `local-token-${email}`, email, full_name: fullName };
        localStorage.setItem('token', session.token);
        localStorage.setItem('current_user', JSON.stringify(session));
        setSuccess(true);
        setTimeout(() => router.push('/dashboard'), 1200);
      } else {
        setError(err.response?.data?.detail || 'Registration failed. Try a different email.');
        setLoading(false);
      }
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
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--md-on-surface)' }}>Create Account</h1>
          <p style={{ color: 'var(--md-on-surface-var)' }}>Join the next generation of AI builders</p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="p-10 rounded-3xl flex flex-col items-center gap-4 text-center"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-2)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--md-success-cont)' }}>
                <CheckCircle2 className="w-9 h-9" style={{ color: 'var(--md-success)' }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--md-on-surface)' }}>Account Created!</h2>
              <p className="text-sm" style={{ color: 'var(--md-on-surface-var)' }}>Taking you to the dashboard…</p>
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mt-2" style={{ borderColor: 'var(--md-primary)', borderTopColor: 'transparent' }} />
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={handleRegister} className="space-y-5 p-8 rounded-3xl"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-2)' }}>
              <Input label="Full Name" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} required />
              <Input label="Email Address" type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
              <Input label="Password" type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required />

              <div className="flex items-start gap-3 px-1 pt-1">
                <div className="mt-1 p-1 rounded" style={{ background: 'var(--md-primary-container)' }}>
                  <ShieldCheck className="w-4 h-4" style={{ color: 'var(--md-on-primary-cont)' }} />
                </div>
                <p className="text-[11px] leading-tight" style={{ color: 'var(--md-on-surface-var)' }}>
                  By creating an account, you agree to our Terms of Service and Privacy Policy regarding AI model usage and data retention.
                </p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-sm text-center" style={{ color: 'var(--md-error)' }}>
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button type="submit" className="w-full h-12 mt-4" loading={loading}>Create Free Account</Button>

              <p className="text-center text-sm" style={{ color: 'var(--md-on-surface-var)' }}>
                Already have an account?{' '}
                <Link href="/auth/login" className="font-bold hover:underline" style={{ color: 'var(--md-primary)' }}>Sign in</Link>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
