'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Database, Cpu, Layers, TrendingUp, Clock, CheckCircle2,
  AlertCircle, Activity, ArrowUpRight, Rocket, Shield,
  Zap, MessageSquare, Plus, ChevronRight, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
});

const ACTIVITY_FALLBACK = [
  { id: 1, action: 'Fine-tuning completed', target: 'llama3-sentiment-v2', time: '2 min ago', status: 'completed' as const },
  { id: 2, action: 'Dataset uploaded', target: 'customer-reviews-2k.csv', time: '18 min ago', status: 'completed' as const },
  { id: 3, action: 'Training started', target: 'gpt2-code-assistant', time: '1 hr ago', status: 'training' as const },
  { id: 4, action: 'Model deployed', target: 'bert-ner-pipeline', time: '3 hr ago', status: 'completed' as const },
  { id: 5, action: 'API key generated', target: 'Production — Main App', time: '5 hr ago', status: 'completed' as const },
  { id: 6, action: 'Job failed', target: 'clip-vision-v1 (OOM)', time: 'Yesterday', status: 'failed' as const },
];

export default function Dashboard() {
  const [modelCount, setModelCount] = useState(12);
  const [datasetCount, setDatasetCount] = useState(38);
  const [activeJobsCount, setActiveJobsCount] = useState(2);
  const [recentActivities, setRecentActivities] = useState(ACTIVITY_FALLBACK);
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const raw = localStorage.getItem('current_user');
    if (raw) {
      try { const u = JSON.parse(raw); setUserName(u.full_name?.split(' ')[0] || 'there'); } catch {}
    }

    api.get('/dashboard/stats').then((r) => {
      if (r.data) {
        if (r.data.model_count !== undefined) setModelCount(r.data.model_count);
        if (r.data.dataset_count !== undefined) setDatasetCount(r.data.dataset_count);
        if (r.data.active_jobs !== undefined) setActiveJobsCount(r.data.active_jobs);
      }
    }).catch(() => {});

    api.get('/activity').then((r) => {
      if (r.data?.length) setRecentActivities(r.data);
    }).catch(() => {});
  }, []);

  const stats = [
    { label: 'Models', value: modelCount, icon: Layers, color: 'text-purple-400', border: 'border-purple-500/20', glow: 'from-purple-500/10', delta: '+2 this week', href: '/dashboard/models' },
    { label: 'Datasets', value: datasetCount, icon: Database, color: 'text-blue-400', border: 'border-blue-500/20', glow: 'from-blue-500/10', delta: '+5 this week', href: '/dashboard/datasets' },
    { label: 'API Calls', value: '1.2M', icon: Activity, color: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'from-emerald-500/10', delta: '+18% today', href: '/dashboard/deployments' },
    { label: 'Active Jobs', value: activeJobsCount, icon: Cpu, color: 'text-pink-400', border: 'border-pink-500/20', glow: 'from-pink-500/10', delta: 'running now', href: '/dashboard/training' },
  ];

  const quickActions = [
    { label: 'Upload Dataset', icon: Database, href: '/dashboard/datasets', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', desc: 'Add training data' },
    { label: 'Create Model', icon: Layers, href: '/dashboard/models', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', desc: 'New model config' },
    { label: 'Start Training', icon: TrendingUp, href: '/dashboard/training', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', desc: 'Fine-tune a model' },
    { label: 'Test in Playground', icon: MessageSquare, href: '/dashboard/playground', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', desc: 'Chat with model' },
    { label: 'Deploy API', icon: Rocket, href: '/dashboard/deployments', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', desc: 'Ship an endpoint' },
    { label: 'Manage Keys', icon: Shield, href: '/dashboard/security', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', desc: 'API key security' },
  ];

  const services = [
    { name: 'Training Engine', status: 'operational', latency: '12ms' },
    { name: 'Inference API', status: 'operational', latency: '8ms' },
    { name: 'Dataset Storage', status: 'operational', latency: '3ms' },
    { name: 'Model Registry', status: 'operational', latency: '5ms' },
  ];

  // Sparkline path builder
  const spark = (vals: number[], w = 80, h = 24) => {
    const min = Math.min(...vals); const max = Math.max(...vals);
    const pts = vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${x},${y}`;
    });
    return `M ${pts.join(' L ')}`;
  };

  const sparkData = {
    models: [8, 9, 9, 10, 10, 11, 12],
    datasets: [28, 30, 32, 33, 35, 37, 38],
    calls: [0.8, 0.9, 1.0, 1.0, 1.1, 1.15, 1.2],
    jobs: [1, 0, 2, 1, 3, 2, 2],
  };
  const sparkKeys = ['models', 'datasets', 'calls', 'jobs'] as const;

  return (
    <DashboardLayout>
      <motion.div {...fadeUp(0)} className="space-y-8">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-gray-600 mb-1">{currentTime}</p>
            <h1 className="text-3xl font-bold tracking-tight premium-text-glow">
              {greeting}{userName ? `, ${userName}` : ''} 👋
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Here&apos;s what&apos;s happening across your AI workspace today.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-strong border border-white/10 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              All systems operational
            </div>
            <Link href="/dashboard/training" className="flex items-center gap-2 px-4 py-2 rounded-xl premium-gradient text-white text-sm font-bold hover:opacity-90 transition-all shadow-[0_0_20px_-6px_var(--theme-glow)]">
              <Plus className="w-4 h-4" /> New Training Run
            </Link>
          </div>
        </div>

        {/* ── Stats cards ─────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} {...fadeUp(i * 0.07)}>
              <Link href={stat.href} className="block">
                <div className={`glass-card rounded-3xl p-5 border ${stat.border} bg-gradient-to-b ${stat.glow} to-transparent group cursor-pointer`}>
                  {/* Glow backdrop */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-9 h-9 rounded-xl border ${stat.border} flex items-center justify-center ${stat.glow.replace('from-', 'bg-')}`}>
                      <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
                    </div>
                    <ArrowUpRight className={`w-4 h-4 ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </div>
                  <p className={`text-3xl font-bold ${stat.color} mb-0.5`}>{stat.value}</p>
                  <p className="text-xs text-gray-500 mb-3">{stat.label}</p>
                  {/* Sparkline */}
                  <svg viewBox={`0 0 80 24`} className="w-full h-6 mb-2" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={`spark-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} className={stat.color} />
                        <stop offset="100%" stopColor="currentColor" stopOpacity={0} className={stat.color} />
                      </linearGradient>
                    </defs>
                    <path d={spark(sparkData[sparkKeys[i]])} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={stat.color} />
                  </svg>
                  <p className="text-[10px] text-gray-600 font-mono">{stat.delta}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ── Quick Actions ────────────────────────────────── */}
        <motion.div {...fadeUp(0.3)}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <div className={`glass-card rounded-2xl p-4 border ${action.bg} text-center group cursor-pointer transition-all hover:-translate-y-1`}>
                  <div className={`w-10 h-10 rounded-xl border ${action.bg} flex items-center justify-center mx-auto mb-3`}>
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <p className="text-xs font-semibold text-white leading-tight">{action.label}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── Middle row: Chart + Activity ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Training performance chart */}
          <motion.div {...fadeUp(0.35)} className="lg:col-span-2 glass-card rounded-3xl border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-white">Training Performance</h2>
                <p className="text-xs text-gray-500 mt-0.5">Loss curve · llama3-sentiment-v2 · Last run</p>
              </div>
              <Link href="/dashboard/training/visualizer" className="flex items-center gap-1 text-xs text-purple-400 hover:underline">
                Full visualizer <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="h-44 relative">
              <svg viewBox="0 0 600 160" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="chartFill2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0,40,80,120,160].map(y => (
                  <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                ))}
                {/* Loss line */}
                <path d="M0,136 C100,110 200,72 300,40 S450,16 600,8" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M0,136 C100,110 200,72 300,40 S450,16 600,8 L600,160 L0,160 Z" fill="url(#chartFill)"/>
                {/* Accuracy line */}
                <path d="M0,145 C100,130 200,100 300,70 S450,40 600,22" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 3"/>
                {/* Endpoint dots */}
                <circle cx="600" cy="8" r="4" fill="#a855f7" />
                <circle cx="600" cy="8" r="8" fill="#a855f7" fillOpacity="0.2" />
                <circle cx="600" cy="22" r="3" fill="#10b981" />
              </svg>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-purple-400 rounded" /> <span className="text-gray-500">Loss (0.08)</span></div>
                <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-emerald-400 rounded border-dashed" style={{borderTop:'2px dashed #10b981', height:0}} /> <span className="text-gray-500">Accuracy (98.2%)</span></div>
              </div>
              <span className="text-[10px] font-mono text-gray-600">5 epochs · 1h 23m</span>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div {...fadeUp(0.4)} className="glass-card rounded-3xl border border-white/[0.06] p-6 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Recent Activity</h2>
              <button className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto scrollbar-none">
              {recentActivities.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                  <div className={cn(
                    'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                    item.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                    item.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                    item.status === 'training' ? 'bg-purple-500/10 text-purple-400' :
                    'bg-gray-500/10 text-gray-400'
                  )}>
                    {item.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                     item.status === 'failed' ? <AlertCircle className="w-3.5 h-3.5" /> :
                     item.status === 'training' ? <Zap className="w-3.5 h-3.5 animate-pulse" /> :
                     <Clock className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white leading-tight">{item.action}</p>
                    <p className="text-[10px] text-gray-600 font-mono truncate mt-0.5">{item.target}</p>
                  </div>
                  <span className="text-[9px] text-gray-600 font-mono shrink-0 mt-0.5">{item.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Bottom row: System Status + Active Jobs ───────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* System Status */}
          <motion.div {...fadeUp(0.45)} className="glass-card rounded-3xl border border-white/[0.06] p-6">
            <h2 className="font-semibold text-white mb-5">System Status</h2>
            <div className="space-y-3">
              {services.map((svc) => (
                <div key={svc.name} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                    <span className="text-sm text-gray-300">{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-600 font-mono">{svc.latency}</span>
                    <span className="text-[9px] text-green-400 font-mono uppercase px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                      {svc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Active jobs */}
          <motion.div {...fadeUp(0.5)} className="glass-card rounded-3xl border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Active Training Jobs</h2>
              <Link href="/dashboard/training" className="text-xs text-purple-400 hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { name: 'llama3-sentiment-v2', progress: 78, epoch: '4/5', time: '~18 min left', color: 'bg-purple-500' },
                { name: 'gpt2-code-assistant', progress: 34, epoch: '2/5', time: '~1 hr left', color: 'bg-blue-500' },
              ].map((job) => (
                <div key={job.name} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                      <span className="text-xs font-mono text-gray-300">{job.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-600 font-mono">Epoch {job.epoch}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${job.progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full ${job.color} rounded-full`}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-gray-600">
                    <span>{job.progress}% complete</span>
                    <span>{job.time}</span>
                  </div>
                </div>
              ))}
              {activeJobsCount === 0 && (
                <div className="text-center py-6 text-gray-600 text-sm">
                  <Cpu className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No active jobs · <Link href="/dashboard/training" className="text-purple-400 underline">Start one →</Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>

      </motion.div>
    </DashboardLayout>
  );
}
