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
            <h1 className="text-xl font-semibold mb-1" style={{ color: '#f0f0f2' }}>
              {greeting}{userName ? `, ${userName}` : ''}.
            </h1>
            <p className="text-sm" style={{ color: '#8b8b99' }}>Here's what's happening in your workspace.</p>
          </div>
          <Link href="/dashboard/training"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: '#7c6af7' }}>
            <Plus className="w-4 h-4" />
            New training run
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Models', value: modelCount, icon: Layers, href: '/dashboard/models', delta: '+2 this week' },
            { label: 'Datasets', value: datasetCount, icon: Database, href: '/dashboard/datasets', delta: '+5 this week' },
            { label: 'API Calls', value: '1.2M', icon: Activity, href: '/dashboard/deployments', delta: '+18% today' },
            { label: 'Active Jobs', value: activeJobs, icon: Cpu, href: '/dashboard/training', delta: 'running now' },
          ].map((s, i) => (
            <Link key={s.label} href={s.href}>
              <div className="rounded-xl p-4 transition-colors group cursor-pointer"
                style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs" style={{ color: '#55555f' }}>{s.label}</p>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#7c6af7' }} />
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color: '#f0f0f2' }}>{s.value}</p>
                <p className="text-xs" style={{ color: '#55555f' }}>{s.delta}</p>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#55555f' }}>Quick actions</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: 'Upload Dataset', icon: Database, href: '/dashboard/datasets' },
              { label: 'Create Model', icon: Layers, href: '/dashboard/models' },
              { label: 'Start Training', icon: Cpu, href: '/dashboard/training' },
              { label: 'Test in Playground', icon: MessageSquare, href: '/dashboard/playground' },
              { label: 'Deploy API', icon: Rocket, href: '/dashboard/deployments' },
              { label: 'Manage Keys', icon: Shield, href: '/dashboard/security' },
            ].map(a => (
              <Link key={a.label} href={a.href}>
                <div className="rounded-xl p-3.5 flex flex-col items-center gap-2 text-center transition-colors cursor-pointer"
                  style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                  <a.icon className="w-4.5 h-4.5" style={{ color: '#7c6af7' }} />
                  <span className="text-[11px] font-medium leading-tight" style={{ color: '#8b8b99' }}>{a.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Main content grid */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Chart */}
          <div className="lg:col-span-2 rounded-xl p-5" style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: '#f0f0f2' }}>Training performance</p>
                <p className="text-xs" style={{ color: '#55555f' }}>llama3-sentiment-v2 · Last run · 5 epochs</p>
              </div>
              <Link href="/dashboard/training/visualizer" className="flex items-center gap-1 text-xs transition-colors"
                style={{ color: '#7c6af7' }}>
                Full view <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div style={{ height: '160px' }}>
              <svg viewBox="0 0 560 140" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c6af7" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#7c6af7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3dd68c" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#3dd68c" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 35, 70, 105, 140].map(y => (
                  <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                ))}
                {/* Loss */}
                <path d="M0,125 C80,108 160,85 240,58 S380,22 480,12 S530,10 560,8" fill="none" stroke="#7c6af7" strokeWidth="2" strokeLinecap="round" />
                <path d="M0,125 C80,108 160,85 240,58 S380,22 480,12 S530,10 560,8 L560,140 L0,140Z" fill="url(#lossGrad)" />
                {/* Accuracy dashed */}
                <path d="M0,135 C80,125 160,108 240,88 S380,58 480,38 S530,30 560,26" fill="none" stroke="#3dd68c" strokeWidth="1.5" strokeDasharray="5 3" strokeLinecap="round" />
                <circle cx="560" cy="8" r="3" fill="#7c6af7" />
                <circle cx="560" cy="26" r="2.5" fill="#3dd68c" />
              </svg>
            </div>

            <div className="flex items-center gap-5 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: '#55555f' }}>
                <span className="w-3.5 h-0.5 rounded" style={{ background: '#7c6af7', display: 'inline-block' }} />
                Loss — 0.08
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: '#55555f' }}>
                <span className="w-3.5 rounded" style={{ borderTop: '1.5px dashed #3dd68c', display: 'inline-block' }} />
                Accuracy — 98.2%
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="rounded-xl p-5" style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm font-semibold mb-4" style={{ color: '#f0f0f2' }}>Recent activity</p>
            <div className="space-y-0.5">
              {ACTIVITIES.map(item => (
                <div key={item.id} className="flex items-start gap-2.5 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="mt-0.5 shrink-0">
                    {item.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#3dd68c' }} />}
                    {item.status === 'failed' && <AlertCircle className="w-3.5 h-3.5" style={{ color: '#e5534b' }} />}
                    {item.status === 'running' && <Zap className="w-3.5 h-3.5" style={{ color: '#7c6af7' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-tight" style={{ color: '#f0f0f2' }}>{item.action}</p>
                    <p className="text-[10px] font-mono truncate mt-0.5" style={{ color: '#55555f' }}>{item.target}</p>
                  </div>
                  <span className="text-[10px] shrink-0 mt-0.5" style={{ color: '#2e2e35' }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom row */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* System status */}
          <div className="rounded-xl p-5" style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm font-semibold mb-4" style={{ color: '#f0f0f2' }}>System status</p>
            <div className="space-y-1">
              {[
                { name: 'Training Engine', latency: '12ms' },
                { name: 'Inference API', latency: '8ms' },
                { name: 'Dataset Storage', latency: '3ms' },
                { name: 'Model Registry', latency: '5ms' },
              ].map(svc => (
                <div key={svc.name} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#3dd68c' }} />
                    <span className="text-sm" style={{ color: '#8b8b99' }}>{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono" style={{ color: '#55555f' }}>{svc.latency}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(61,214,140,0.08)', color: '#3dd68c' }}>
                      operational
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active jobs */}
          <div className="rounded-xl p-5" style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ color: '#f0f0f2' }}>Active training jobs</p>
              <Link href="/dashboard/training" className="flex items-center gap-1 text-xs" style={{ color: '#7c6af7' }}>
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
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#7c6af7' }} />
                      <span className="text-xs font-mono" style={{ color: '#8b8b99' }}>{job.name}</span>
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: '#55555f' }}>Epoch {job.epoch} · {job.eta} left</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${job.progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: '#7c6af7' }}
                    />
                  </div>
                  <p className="text-[10px] mt-1 font-mono" style={{ color: '#55555f' }}>{job.progress}%</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
