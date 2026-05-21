'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Database, Cpu, Layers, Activity, Clock,
  CheckCircle2, AlertCircle, ArrowUpRight,
  Rocket, Shield, MessageSquare, Plus, Zap, ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';

const ACTIVITIES = [
  { id: 1, action: 'Fine-tuning completed', target: 'llama3-sentiment-v2', time: '2 min ago', status: 'completed' as const },
  { id: 2, action: 'Dataset uploaded', target: 'customer-reviews-2k.csv', time: '18 min ago', status: 'completed' as const },
  { id: 3, action: 'Training started', target: 'gpt2-code-assistant', time: '1 hr ago', status: 'running' as const },
  { id: 4, action: 'Model deployed', target: 'bert-ner-pipeline', time: '3 hr ago', status: 'completed' as const },
  { id: 5, action: 'API key generated', target: 'Production — Main App', time: '5 hr ago', status: 'completed' as const },
  { id: 6, action: 'Training failed', target: 'clip-vision-v1 (OOM)', time: 'Yesterday', status: 'failed' as const },
];

const S = {
  card: { background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-1)' } as React.CSSProperties,
  divider: { borderBottom: '1px solid var(--md-outline-var)' } as React.CSSProperties,
  textPrimary: { color: 'var(--md-on-surface)' } as React.CSSProperties,
  textSecondary: { color: 'var(--md-on-surface-var)' } as React.CSSProperties,
  primary: { color: 'var(--md-primary)' } as React.CSSProperties,
};

export default function Dashboard() {
  const [modelCount, setModelCount] = useState(12);
  const [datasetCount, setDatasetCount] = useState(38);
  const [activeJobs, setActiveJobs] = useState(2);
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
    const raw = localStorage.getItem('current_user');
    if (raw) { try { const u = JSON.parse(raw); setUserName(u.full_name?.split(' ')[0] || ''); } catch {} }
    api.get('/dashboard/stats').then(r => {
      if (r.data?.model_count !== undefined) setModelCount(r.data.model_count);
      if (r.data?.dataset_count !== undefined) setDatasetCount(r.data.dataset_count);
      if (r.data?.active_jobs !== undefined) setActiveJobs(r.data.active_jobs);
    }).catch(() => {});
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold mb-1" style={S.textPrimary}>
              {greeting}{userName ? `, ${userName}` : ''}.
            </h1>
            <p className="text-sm" style={S.textSecondary}>Here's what's happening in your workspace.</p>
          </div>
          <Link href="/dashboard/training"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
            <Plus className="w-4 h-4" /> New training run
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Models', value: modelCount, href: '/dashboard/models', delta: '+2 this week' },
            { label: 'Datasets', value: datasetCount, href: '/dashboard/datasets', delta: '+5 this week' },
            { label: 'API Calls', value: '1.2M', href: '/dashboard/deployments', delta: '+18% today' },
            { label: 'Active Jobs', value: activeJobs, href: '/dashboard/training', delta: 'running now' },
          ].map(s => (
            <Link key={s.label} href={s.href}>
              <div className="rounded-2xl p-4 group cursor-pointer transition-all hover:shadow-md" style={S.card}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs" style={S.textSecondary}>{s.label}</p>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={S.primary} />
                </div>
                <p className="text-2xl font-bold mb-1" style={S.textPrimary}>{s.value}</p>
                <p className="text-xs" style={S.textSecondary}>{s.delta}</p>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={S.textSecondary}>Quick actions</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: 'Upload Dataset', icon: Database, href: '/dashboard/datasets' },
              { label: 'Create Model', icon: Layers, href: '/dashboard/models' },
              { label: 'Start Training', icon: Cpu, href: '/dashboard/training' },
              { label: 'Test Playground', icon: MessageSquare, href: '/dashboard/playground' },
              { label: 'Deploy API', icon: Rocket, href: '/dashboard/deployments' },
              { label: 'Manage Keys', icon: Shield, href: '/dashboard/security' },
            ].map(a => (
              <Link key={a.label} href={a.href}>
                <div className="rounded-2xl p-3.5 flex flex-col items-center gap-2 text-center transition-all hover:shadow-md cursor-pointer" style={S.card}>
                  <a.icon className="w-5 h-5" style={S.primary} />
                  <span className="text-[11px] font-medium leading-tight" style={S.textSecondary}>{a.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Chart + Activity */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <div className="lg:col-span-2 rounded-2xl p-5" style={S.card}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-semibold mb-0.5" style={S.textPrimary}>Training performance</p>
                <p className="text-xs" style={S.textSecondary}>llama3-sentiment-v2 · Last run · 5 epochs</p>
              </div>
              <Link href="/dashboard/training/visualizer" className="flex items-center gap-1 text-xs" style={S.primary}>
                Full view <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div style={{ height: '160px' }}>
              <svg viewBox="0 0 560 140" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--md-primary)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--md-primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 35, 70, 105, 140].map(y => (
                  <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="var(--md-outline)" strokeWidth="1" />
                ))}
                <path d="M0,125 C80,108 160,85 240,58 S380,22 480,12 S530,10 560,8" fill="none" stroke="var(--md-primary)" strokeWidth="2" strokeLinecap="round" />
                <path d="M0,125 C80,108 160,85 240,58 S380,22 480,12 S530,10 560,8 L560,140 L0,140Z" fill="url(#lossGrad)" />
                <path d="M0,135 C80,125 160,108 240,88 S380,58 480,38 S530,30 560,26" fill="none" stroke="var(--md-success)" strokeWidth="1.5" strokeDasharray="5 3" strokeLinecap="round" />
                <circle cx="560" cy="8" r="3" fill="var(--md-primary)" />
                <circle cx="560" cy="26" r="2.5" fill="var(--md-success)" />
              </svg>
            </div>
            <div className="flex items-center gap-5 mt-4 pt-4" style={{ borderTop: '1px solid var(--md-outline-var)' }}>
              <div className="flex items-center gap-2 text-xs" style={S.textSecondary}>
                <span className="w-4 h-0.5 rounded inline-block" style={{ background: 'var(--md-primary)' }} />
                Loss — 0.08
              </div>
              <div className="flex items-center gap-2 text-xs" style={S.textSecondary}>
                <span className="w-4 inline-block" style={{ borderTop: '1.5px dashed var(--md-success)' }} />
                Accuracy — 98.2%
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={S.card}>
            <p className="text-sm font-semibold mb-4" style={S.textPrimary}>Recent activity</p>
            <div className="space-y-0.5">
              {ACTIVITIES.map(item => (
                <div key={item.id} className="flex items-start gap-2.5 py-2.5" style={S.divider}>
                  <div className="mt-0.5 shrink-0">
                    {item.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--md-success)' }} />}
                    {item.status === 'failed' && <AlertCircle className="w-3.5 h-3.5" style={{ color: 'var(--md-error)' }} />}
                    {item.status === 'running' && <Zap className="w-3.5 h-3.5" style={S.primary} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-tight" style={S.textPrimary}>{item.action}</p>
                    <p className="text-[10px] font-mono truncate mt-0.5" style={S.textSecondary}>{item.target}</p>
                  </div>
                  <span className="text-[10px] shrink-0 mt-0.5" style={S.textSecondary}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom row */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="rounded-2xl p-5" style={S.card}>
            <p className="text-sm font-semibold mb-4" style={S.textPrimary}>System status</p>
            <div className="space-y-1">
              {[
                { name: 'Training Engine', latency: '12ms' },
                { name: 'Inference API', latency: '8ms' },
                { name: 'Dataset Storage', latency: '3ms' },
                { name: 'Model Registry', latency: '5ms' },
              ].map(svc => (
                <div key={svc.name} className="flex items-center justify-between py-2.5" style={S.divider}>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--md-success)' }} />
                    <span className="text-sm" style={S.textSecondary}>{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono" style={S.textSecondary}>{svc.latency}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'var(--md-success-cont)', color: 'var(--md-success)' }}>
                      operational
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-5" style={S.card}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={S.textPrimary}>Active training jobs</p>
              <Link href="/dashboard/training" className="flex items-center gap-1 text-xs" style={S.primary}>
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { name: 'llama3-sentiment-v2', progress: 78, epoch: '4/5', eta: '~18 min' },
                { name: 'gpt2-code-assistant', progress: 34, epoch: '2/5', eta: '~1 hr' },
              ].map(job => (
                <div key={job.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--md-primary)' }} />
                      <span className="text-xs font-mono" style={S.textSecondary}>{job.name}</span>
                    </div>
                    <span className="text-[10px] font-mono" style={S.textSecondary}>Epoch {job.epoch} · {job.eta}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--md-surface-3)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${job.progress}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full" style={{ background: 'var(--md-primary)' }} />
                  </div>
                  <p className="text-[10px] mt-1 font-mono" style={S.textSecondary}>{job.progress}%</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
