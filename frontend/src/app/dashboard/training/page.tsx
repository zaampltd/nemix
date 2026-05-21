"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import {
  Cpu, Clock, CheckCircle2, XCircle, Activity,
  History, Plus, Terminal, X, ChevronDown, Zap, Layers, Flame,
  AlertCircle, RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import TrainingProviderPanel from '@/components/training/TrainingProviderPanel';

// ── Types ─────────────────────────────────────────────────────────────
interface Job {
  id: number;
  job_id: string;
  model_name?: string;
  status: 'pending' | 'training' | 'completed' | 'failed';
  progress: number;
  current_epoch: number;
  total_epochs: number;
  logs: any[];
  created_at: string;
  dataset_id?: number;
  model_id?: number;
}

// ── Page ──────────────────────────────────────────────────────────────
export default function TrainingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('together_ai');

  // Form state
  const [dbModels, setDbModels] = useState<any[]>([]);
  const [dbDatasets, setDbDatasets] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedDataset, setSelectedDataset] = useState('');
  const [totalEpochs, setTotalEpochs] = useState(3);
  const [learningRate, setLearningRate] = useState(0.0001);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // ── Fetch all jobs from backend ────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    try {
      const res = await api.get('/training/jobs');
      const data: Job[] = res.data || [];
      setJobs(data);
      // Keep active job in sync
      setActiveJob(prev => {
        if (!prev) return data[0] || null;
        const updated = data.find(j => j.job_id === prev.job_id);
        return updated || prev;
      });
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial load + poll while jobs are running ─────────────────────
  useEffect(() => {
    fetchJobs();

    pollRef.current = setInterval(() => {
      const hasActive = jobs.some(j => j.status === 'pending' || j.status === 'training');
      if (hasActive) fetchJobs();
    }, 3000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Poll more aggressively when there are active jobs
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    const hasActive = jobs.some(j => j.status === 'pending' || j.status === 'training');
    pollRef.current = setInterval(fetchJobs, hasActive ? 2000 : 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobs, fetchJobs]);

  // Auto-scroll log terminal
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeJob?.logs]);

  // Load models + datasets for form
  useEffect(() => {
    api.get('/models/').then(r => setDbModels(r.data || [])).catch(() => {});
    api.get('/datasets/').then(r => setDbDatasets(r.data || [])).catch(() => {});
  }, []);

  // ── Create job ─────────────────────────────────────────────────────
  const handleNewJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    // Check provider key
    const keys = JSON.parse(localStorage.getItem('training_provider_keys') || '{}');
    const hasKey = keys.together_api_key || (keys.hf_token && keys.hf_username);
    if (!hasKey) {
      setCreateError('No API key configured. Add your Together AI or Hugging Face key in the Provider panel above.');
      setCreating(false);
      return;
    }

    const modelId = Number(selectedModel);
    const datasetId = Number(selectedDataset);

    try {
      const res = await api.post(`/training/jobs?provider=${selectedProvider}`, {
        model_id: modelId,
        dataset_id: datasetId,
        total_epochs: totalEpochs,
      });

      const newJob: Job = res.data;
      setJobs(prev => [newJob, ...prev]);
      setActiveJob(newJob);
      setIsModalOpen(false);
      setSelectedModel('');
      setSelectedDataset('');
      setTotalEpochs(3);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to start training job. Check your API key.';
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  // ── Cancel job ─────────────────────────────────────────────────────
  const handleCancelJob = async (jobId: string) => {
    try {
      await api.delete(`/training/jobs/${jobId}`);
      fetchJobs();
    } catch {}
  };

  // ── Helpers ────────────────────────────────────────────────────────
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'failed':    return <XCircle className="w-5 h-5 text-red-400" />;
      case 'training':  return <Activity className="w-5 h-5 text-purple-400 animate-pulse" />;
      default:          return <Clock className="w-5 h-5 text-orange-400" />;
    }
  };

  const parseLog = (log: any): string => {
    if (typeof log === 'string') return log;
    if (log && typeof log === 'object') {
      if ('message' in log) return String(log.message);
      if ('error' in log) return `[ERROR] ${log.error}`;
    }
    return JSON.stringify(log);
  };

  const logColor = (text: string) => {
    if (text.includes('✅') || text.toLowerCase().includes('complete') || text.toLowerCase().includes('success')) return 'text-green-400';
    if (text.includes('❌') || text.toLowerCase().includes('error') || text.toLowerCase().includes('fail')) return 'text-red-400';
    if (text.includes('⚠️') || text.toLowerCase().includes('warning')) return 'text-yellow-400';
    if (text.includes('🚀') || text.includes('🔗') || text.includes('🔄')) return 'text-purple-400 font-semibold';
    if (text.includes('📊') || text.includes('📥') || text.includes('💾') || text.includes('☁️')) return 'text-blue-400';
    return 'text-green-400/70';
  };

  const display = activeJob || jobs[0];
  const selectClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer";

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Training Hub</h1>
            <p style={{ color: 'var(--md-on-surface-var)' }}>Train real AI models via Together AI or Hugging Face.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/training/visualizer">
              <Button variant="secondary" className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 gap-2 text-xs font-semibold">
                <Flame className="w-4 h-4 text-purple-400" />
                Pipeline Visualizer
              </Button>
            </Link>
            <button
              onClick={() => { setCreateError(''); setIsModalOpen(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '12px', background: 'var(--md-primary)', color: 'var(--md-on-primary)', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer' }}
            >
              <Plus className="w-4 h-4" /> New Training Job
            </button>
          </div>
        </div>

        {/* ── Provider Panel ── */}
        <TrainingProviderPanel
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
        />

        {/* ── Main content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main detail panel */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 glass rounded-3xl">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Loading jobs...</p>
              </div>
            ) : display ? (
              <>
                {/* Job card */}
                <div className="glass p-8 rounded-3xl border-white/5">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                        <Cpu className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          {display.model_name || `Job #${display.id}`}
                        </h2>
                        <p className="text-sm text-gray-500 font-mono">{display.job_id.slice(0, 16)}...</p>
                        <p className="text-xs text-gray-600 mt-0.5">{new Date(display.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border',
                        display.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                        display.status === 'failed'    ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        display.status === 'training'  ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                                                         'bg-orange-500/10 border-orange-500/20 text-orange-400'
                      )}>
                        {getStatusIcon(display.status)}
                        <span className="capitalize">{display.status}</span>
                      </div>
                      {(display.status === 'training' || display.status === 'pending') && (
                        <button
                          onClick={() => handleCancelJob(display.job_id)}
                          style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, background: 'var(--md-error-cont)', color: 'var(--md-error)', border: 'none', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2 mb-8">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="font-bold">{(display.progress ?? 0).toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${display.progress ?? 0}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full premium-gradient shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                      />
                    </div>
                  </div>

                  {/* Stats — from real backend data only */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Epochs', value: `${display.current_epoch ?? 0} / ${display.total_epochs ?? 0}` },
                      { label: 'Status', value: display.status },
                      { label: 'Job ID', value: display.job_id.slice(0, 8) + '...' },
                    ].map(stat => (
                      <div key={stat.label} style={{ padding: '14px', borderRadius: '16px', background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}>
                        <p style={{ fontSize: '10px', color: 'var(--md-on-surface-var)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{stat.label}</p>
                        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--md-on-surface)', fontFamily: 'monospace' }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live terminal */}
                <div className="glass rounded-3xl border-white/5 overflow-hidden">
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <Terminal className="w-4 h-4 text-gray-600 ml-2" />
                    <span className="text-xs font-mono text-gray-500">training.log — {display.model_name || display.job_id.slice(0, 12)}</span>
                    <div className="ml-auto">
                      <button onClick={fetchJobs} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--md-on-surface-var)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <RefreshCw style={{ width: '12px', height: '12px' }} /> Refresh
                      </button>
                    </div>
                  </div>
                  <div className="p-6 h-72 overflow-y-auto font-mono text-xs space-y-1 scroll-smooth" style={{ background: '#030303' }}>
                    {display.logs && display.logs.length > 0 ? (
                      display.logs.map((log, i) => {
                        const text = parseLog(log);
                        return (
                          <p key={i} className={logColor(text)}>
                            {text}
                          </p>
                        );
                      })
                    ) : (
                      <p className="text-gray-600">Waiting for logs...</p>
                    )}
                    {display.status === 'training' && (
                      <p className="text-green-400/50 animate-pulse">▋</p>
                    )}
                    <div ref={logEndRef} />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 glass rounded-3xl border-dashed border-white/10">
                <Cpu className="w-14 h-14 text-gray-700 mb-5" />
                <h3 className="text-xl font-bold mb-2">No training jobs yet</h3>
                <p className="text-gray-500 mb-8 text-center max-w-xs">
                  Add your API key in the Provider panel above, then start a real training job.
                </p>
                <button
                  onClick={() => { setCreateError(''); setIsModalOpen(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 22px', borderRadius: '12px', background: 'var(--md-primary)', color: 'var(--md-on-primary)', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer' }}
                >
                  <Zap className="w-4 h-4" /> Start Training
                </button>
              </div>
            )}
          </div>

          {/* Job history sidebar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-gray-500" />
                Job History
              </h2>
              <span className="text-xs text-gray-600">{jobs.length} job{jobs.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              <AnimatePresence>
                {jobs.map(job => (
                  <motion.button
                    key={job.job_id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setActiveJob(job)}
                    className={cn(
                      'w-full text-left p-4 rounded-2xl border transition-all',
                      activeJob?.job_id === job.job_id
                        ? 'bg-purple-500/10 border-purple-500/40'
                        : 'border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs font-medium text-gray-300 truncate max-w-[100px]">
                          {job.model_name || `Job #${job.id}`}
                        </span>
                      </div>
                      {getStatusIcon(job.status)}
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                      <motion.div
                        animate={{ width: `${job.progress ?? 0}%` }}
                        transition={{ duration: 0.5 }}
                        className={cn('h-full rounded-full', job.status === 'completed' ? 'bg-green-500' : 'premium-gradient')}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest">
                      <span>{job.current_epoch}/{job.total_epochs} epochs</span>
                      <span>{(job.progress ?? 0).toFixed(0)}%</span>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1 font-mono">{job.job_id.slice(0, 14)}...</p>
                  </motion.button>
                ))}
              </AnimatePresence>
              {jobs.length === 0 && !loading && (
                <p className="text-center text-gray-600 text-sm py-8">No jobs yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── New Job Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => !creating && setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)' }}
              className="relative w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--md-on-surface)' }}>New Training Job</h2>
                  <p style={{ color: 'var(--md-on-surface-var)', fontSize: '13px', marginTop: '3px' }}>
                    Uses your <strong>{selectedProvider === 'together_ai' ? 'Together AI' : 'Hugging Face'}</strong> key
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--md-on-surface-var)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Error */}
              {createError && (
                <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'var(--md-error-cont)', border: '1px solid var(--md-outline)', marginBottom: '16px' }}>
                  <AlertCircle style={{ width: '15px', height: '15px', color: 'var(--md-error)', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '12px', color: 'var(--md-on-surface)', margin: 0 }}>{createError}</p>
                </div>
              )}

              <form onSubmit={handleNewJob} className="space-y-5">
                {/* Model */}
                <div className="space-y-2">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--md-on-surface-var)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Model</label>
                  <div className="relative">
                    <select className={selectClass} value={selectedModel} onChange={e => setSelectedModel(e.target.value)} required>
                      <option className="bg-[#121214] text-white" value="">— Select a model —</option>
                      {dbModels.map(m => (
                        <option className="bg-[#121214] text-white" key={m.id} value={m.id}>{m.name} ({m.base_model})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  {dbModels.length === 0 && (
                    <p className="text-xs text-orange-400">No models found. <a href="/dashboard/models" className="underline">Create a model first →</a></p>
                  )}
                </div>

                {/* Dataset */}
                <div className="space-y-2">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--md-on-surface-var)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dataset</label>
                  <div className="relative">
                    <select className={selectClass} value={selectedDataset} onChange={e => setSelectedDataset(e.target.value)} required>
                      <option className="bg-[#121214] text-white" value="">— Select a dataset —</option>
                      {dbDatasets.map(d => (
                        <option className="bg-[#121214] text-white" key={d.id} value={d.id}>{d.name} ({d.file_type})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  {dbDatasets.length === 0 && (
                    <p className="text-xs text-orange-400">No datasets found. <a href="/dashboard/datasets" className="underline">Upload a dataset first →</a></p>
                  )}
                </div>

                {/* Epochs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--md-on-surface-var)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Epochs</label>
                    <span style={{ fontSize: '13px', fontWeight: 700, background: 'var(--md-surface-2)', padding: '2px 10px', borderRadius: '100px', color: 'var(--md-on-surface)' }}>{totalEpochs}</span>
                  </div>
                  <input type="range" min={1} max={20} step={1} value={totalEpochs}
                    onChange={e => setTotalEpochs(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-gray-600">
                    <span>1</span><span>10</span><span>20</span>
                  </div>
                </div>

                {/* Learning rate */}
                <div className="space-y-2">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--md-on-surface-var)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Learning Rate</label>
                  <div className="relative">
                    <select className={selectClass} value={learningRate} onChange={e => setLearningRate(Number(e.target.value))}>
                      <option className="bg-[#121214] text-white" value={0.001}>1e-3 — Standard</option>
                      <option className="bg-[#121214] text-white" value={0.0002}>2e-4 — LoRA recommended</option>
                      <option className="bg-[#121214] text-white" value={0.0001}>1e-4 — Fine-tuning</option>
                      <option className="bg-[#121214] text-white" value={0.00005}>5e-5 — Careful</option>
                      <option className="bg-[#121214] text-white" value={0.00001}>1e-5 — Slow & stable</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Config preview */}
                <div style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline-var)', borderRadius: '14px', padding: '14px', fontFamily: 'monospace', fontSize: '12px' }}>
                  <p style={{ color: 'var(--md-primary)', marginBottom: '6px' }}># Training config</p>
                  <p style={{ color: 'var(--md-on-surface-var)' }}>provider = <span style={{ color: 'var(--md-success)' }}>"{selectedProvider}"</span></p>
                  <p style={{ color: 'var(--md-on-surface-var)' }}>model_id = <span style={{ color: '#60a5fa' }}>{selectedModel || 'not selected'}</span></p>
                  <p style={{ color: 'var(--md-on-surface-var)' }}>dataset_id = <span style={{ color: '#60a5fa' }}>{selectedDataset || 'not selected'}</span></p>
                  <p style={{ color: 'var(--md-on-surface-var)' }}>epochs = <span style={{ color: '#f59e0b' }}>{totalEpochs}</span></p>
                  <p style={{ color: 'var(--md-on-surface-var)' }}>lr = <span style={{ color: '#f59e0b' }}>{learningRate}</span></p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={creating}
                    style={{ flex: 1, padding: '10px', borderRadius: '12px', background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={creating || !selectedModel || !selectedDataset}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '12px', background: 'var(--md-primary)', color: 'var(--md-on-primary)', fontWeight: 700, border: 'none', cursor: creating || !selectedModel || !selectedDataset ? 'not-allowed' : 'pointer', opacity: creating || !selectedModel || !selectedDataset ? 0.6 : 1, fontSize: '14px' }}>
                    {creating ? <><RefreshCw style={{ width: '14px', height: '14px' }} /> Starting...</> : <><Zap className="w-4 h-4" /> Launch Training</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
