"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import {
  Cpu, Clock, CheckCircle2, XCircle, Activity,
  History, Plus, Terminal, X, ChevronDown, Zap, Layers, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import TrainingProviderPanel from '@/components/training/TrainingProviderPanel';

interface Job {
  id: number;
  job_id: string;
  model_name: string;
  status: 'pending' | 'training' | 'completed' | 'failed';
  progress: number;
  current_epoch: number;
  total_epochs: number;
  learning_rate: number;
  accuracy: number;
  loss: number;
  logs: string[];
  created_at: string;
  local?: boolean;
}

interface LocalModel {
  id: number;
  name: string;
  base_model: string;
}

const JOBS_KEY = 'local_training_jobs';

function loadJobs(): Job[] {
  try { return JSON.parse(localStorage.getItem(JOBS_KEY) || '[]'); } catch { return []; }
}
function saveJobs(jobs: Job[]) {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

function generateJobId() {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

export default function TrainingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('auto');
  
  // Model states
  const [localModels, setLocalModels] = useState<LocalModel[]>([]);
  const [dbModels, setDbModels] = useState<any[]>([]);
  
  // Dataset states
  const [localDatasets, setLocalDatasets] = useState<any[]>([]);
  const [dbDatasets, setDbDatasets] = useState<any[]>([]);

  // Form state
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedDataset, setSelectedDataset] = useState('');
  const [totalEpochs, setTotalEpochs] = useState(10);
  const [learningRate, setLearningRate] = useState(0.0001);
  const [creating, setCreating] = useState(false);

  const jobsRef = useRef<Job[]>([]);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep jobsRef in sync
  useEffect(() => { jobsRef.current = jobs; }, [jobs]);

  // Auto-select active job when list changes
  useEffect(() => {
    if (!activeJob && jobs.length > 0) setActiveJob(jobs[0]);
    else if (activeJob) {
      const updated = jobs.find(j => j.job_id === activeJob.job_id);
      if (updated) setActiveJob(updated);
    }
  }, [jobs]);

  const fetchDbModelsAndDatasets = async () => {
    try {
      const modelsRes = await api.get('/models/');
      setDbModels(modelsRes.data);
    } catch (err) {
      console.error('Failed to fetch DB models:', err);
    }
    try {
      const datasetsRes = await api.get('/datasets/');
      setDbDatasets(datasetsRes.data);
    } catch (err) {
      console.error('Failed to fetch DB datasets:', err);
    }
  };

  // Load initial data
  useEffect(() => {
    // Load local models for the dropdown
    try {
      const lm = JSON.parse(localStorage.getItem('local_models') || '[]');
      setLocalModels(lm);
    } catch {}

    // Load local datasets for the dropdown
    try {
      const ld = JSON.parse(localStorage.getItem('local_datasets') || '[]');
      setLocalDatasets(ld);
    } catch {}

    // Fetch DB models and datasets
    fetchDbModelsAndDatasets();

    // Check for a model pre-selected from Models page
    try {
      const preSelected = JSON.parse(localStorage.getItem('train_model') || 'null');
      if (preSelected) {
        if (preSelected.local) {
          setSelectedModel(`local:${preSelected.id}`);
        } else {
          setSelectedModel(`db:${preSelected.id}`);
        }
        localStorage.removeItem('train_model');
        setIsModalOpen(true);
      }
    } catch {}

    loadAllJobs();
  }, []);

  // Training simulation engine
  useEffect(() => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    simIntervalRef.current = setInterval(() => {
      const current = jobsRef.current;
      const hasActive = current.some(j => j.status === 'training' || j.status === 'pending');
      if (!hasActive) return;

      const updated = current.map(job => {
        if (job.status === 'pending') {
          return { ...job, status: 'training' as const, logs: [...job.logs, '[INFO] Training started...'] };
        }
        if (job.status !== 'training') return job;

        const epochDuration = 100 / job.total_epochs;
        const newProgress = Math.min(job.progress + epochDuration * 0.4, 100);
        const newEpoch = Math.min(Math.floor(newProgress / epochDuration), job.total_epochs);
        const newLoss = Math.max(0.05, job.loss - (job.loss * 0.03 * Math.random()));
        const newAcc  = Math.min(0.99, job.accuracy + 0.012 * Math.random());

        const newLog = newEpoch > job.current_epoch
          ? `[Epoch ${newEpoch}/${job.total_epochs}] loss: ${newLoss.toFixed(4)} — acc: ${(newAcc * 100).toFixed(1)}%`
          : `  step ${Math.floor(Math.random() * 900 + 100)}/1000 — loss: ${newLoss.toFixed(4)}`;

        const isFinished = newProgress >= 100;
        return {
          ...job,
          progress: isFinished ? 100 : newProgress,
          current_epoch: isFinished ? job.total_epochs : newEpoch,
          loss: newLoss,
          accuracy: newAcc,
          status: isFinished ? 'completed' as const : 'training' as const,
          logs: [...job.logs.slice(-30), newLog, ...(isFinished ? ['[INFO] Training complete ✓'] : [])],
        };
      });

      setJobs(updated);
      saveJobs(updated.filter(j => j.local));
    }, 800);

    return () => { if (simIntervalRef.current) clearInterval(simIntervalRef.current); };
  }, []);

  const loadAllJobs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/training/jobs');
      const local = loadJobs();
      setJobs([...response.data, ...local]);
    } catch (err: any) {
      if (!err.isOffline) console.error('Failed to fetch jobs:', err);
      setJobs(loadJobs());
    } finally {
      setLoading(false);
    }
  };

  const handleNewJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const isModelDb = selectedModel.startsWith('db:');
    const modelIdStr = selectedModel.split(':')[1];
    const modelId = Number(modelIdStr);

    const isDatasetDb = selectedDataset.startsWith('db:');
    const datasetIdStr = selectedDataset.split(':')[1];
    const datasetId = Number(datasetIdStr);

    let modelName = 'custom-model';
    let datasetName = 'dataset';

    if (isModelDb) {
      const m = dbModels.find(x => x.id === modelId);
      if (m) modelName = m.name;
    } else {
      const m = localModels.find(x => x.id === modelId);
      if (m) modelName = m.name;
    }

    if (isDatasetDb) {
      const d = dbDatasets.find(x => x.id === datasetId);
      if (d) datasetName = d.name;
    } else {
      const d = localDatasets.find(x => x.id === datasetId);
      if (d) datasetName = d.name;
    }

    const jobId = generateJobId();
    const newJob: Job = {
      id: Date.now(),
      job_id: jobId,
      model_name: modelName,
      status: 'pending',
      progress: 0,
      current_epoch: 0,
      total_epochs: totalEpochs,
      learning_rate: learningRate,
      accuracy: 0.3 + Math.random() * 0.1,
      loss: 1.2 + Math.random() * 0.3,
      logs: [
        '[INFO] Initializing training environment...',
        `[INFO] Model: ${modelName}`,
        `[INFO] Dataset: ${datasetName}`,
        `[INFO] Epochs: ${totalEpochs} | LR: ${learningRate}`,
        '[INFO] Loading dataset...',
      ],
      created_at: new Date().toISOString(),
      local: true,
    };

    if (isModelDb && isDatasetDb) {
      try {
        const response = await api.post('/training/jobs', {
          model_id: modelId,
          dataset_id: datasetId,
          total_epochs: totalEpochs
        });

        const dbJob = response.data;
        const apiJob: Job = {
          id: dbJob.id,
          job_id: dbJob.job_id,
          model_name: modelName,
          status: dbJob.status,
          progress: dbJob.progress,
          current_epoch: dbJob.current_epoch,
          total_epochs: dbJob.total_epochs,
          learning_rate: learningRate,
          accuracy: dbJob.accuracy || 0.0,
          loss: dbJob.loss || 0.0,
          logs: dbJob.logs || ['[INFO] Job initialized on remote server.'],
          created_at: dbJob.created_at,
          local: false
        };

        setJobs(prev => [apiJob, ...prev]);
        setActiveJob(apiJob);
      } catch (err: any) {
        console.error('Failed to create training job on backend:', err);
        const existing = loadJobs();
        saveJobs([newJob, ...existing]);
        setJobs(prev => [newJob, ...prev]);
        setActiveJob(newJob);
      }
    } else {
      const existing = loadJobs();
      saveJobs([newJob, ...existing]);
      setJobs(prev => [newJob, ...prev]);
      setActiveJob(newJob);
    }

    setIsModalOpen(false);
    setSelectedModel('');
    setSelectedDataset('');
    setTotalEpochs(10);
    setLearningRate(0.0001);
    setCreating(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'failed':    return <XCircle className="w-5 h-5 text-red-400" />;
      case 'training':  return <Activity className="w-5 h-5 text-purple-400 animate-pulse" />;
      default:          return <Clock className="w-5 h-5 text-orange-400" />;
    }
  };

  const display = activeJob || jobs[0];
  const selectClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer";

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Training Hub</h1>
            <p className="text-gray-400">Monitor and manage your AI model training jobs.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/training/visualizer">
              <Button variant="secondary" className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 gap-2 text-xs font-semibold">
                <Flame className="w-4 h-4 text-purple-400" />
                Pipeline Visualizer
              </Button>
            </Link>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Training Job
            </Button>
          </div>
        </div>

        {/* Provider configuration panel */}
        <TrainingProviderPanel
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Detail Panel */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 glass rounded-3xl">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Loading jobs...</p>
              </div>
            ) : display ? (
              <>
                {/* Job Card */}
                <div className="glass p-8 rounded-3xl border-white/5">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                        <Cpu className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          {display.model_name}
                          {display.local && (
                            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 uppercase tracking-wider">Local</span>
                          )}
                        </h2>
                        <p className="text-sm text-gray-500 font-mono">{display.job_id.slice(0, 12)}...</p>
                        <p className="text-xs text-gray-600 mt-0.5">{new Date(display.created_at).toLocaleString()}</p>
                      </div>
                    </div>
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
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2 mb-8">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Overall Progress</span>
                      <span className="font-bold">{(display.progress ?? 0).toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${display.progress ?? 0}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full premium-gradient shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Epoch', value: `${display.current_epoch ?? 0} / ${display.total_epochs ?? 0}` },
                      { label: 'Loss',  value: display.loss !== null && display.loss !== undefined ? display.loss.toFixed(4) : 'N/A' },
                      { label: 'Accuracy', value: display.accuracy !== null && display.accuracy !== undefined ? `${(display.accuracy * 100).toFixed(1)}%` : 'N/A' },
                      { label: 'Learn Rate', value: display.learning_rate !== null && display.learning_rate !== undefined ? display.learning_rate.toString() : 'N/A' },
                    ].map(stat => (
                      <div key={stat.label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
                        <p className="text-lg font-bold font-mono">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Terminal */}
                <div className="glass bg-[#030303] rounded-3xl border-white/5 overflow-hidden">
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <Terminal className="w-4 h-4 text-gray-600 ml-2" />
                    <span className="text-xs font-mono text-gray-500">training.log — {display.model_name}</span>
                  </div>
                  <div className="p-6 h-56 overflow-y-auto font-mono text-xs space-y-1 scroll-smooth" id="log-window">
                    {display.logs.map((log, i) => {
                      const logText = typeof log === 'string'
                        ? log
                        : (log && typeof log === 'object' && 'message' in log
                            ? String((log as any).message)
                            : (log && typeof log === 'object' && 'error' in log
                                ? `[ERROR] ${(log as any).error}`
                                : JSON.stringify(log)));
                      return (
                        <p
                          key={i}
                          className={cn(
                            logText.startsWith('[Epoch') ? 'text-purple-400 font-bold' :
                            logText.toLowerCase().includes('complete') || logText.toLowerCase().includes('success') ? 'text-green-400' :
                            logText.startsWith('[INFO]')  ? 'text-blue-400/70' :
                            logText.toLowerCase().includes('error') || logText.toLowerCase().includes('fail') ? 'text-red-400' :
                                                          'text-green-400/70'
                          )}
                        >
                          {logText}
                        </p>
                      );
                    })}
                    {display.status === 'training' && (
                      <p className="text-green-400/50 animate-pulse">▋</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 glass rounded-3xl border-dashed border-white/10">
                <Cpu className="w-14 h-14 text-gray-700 mb-5" />
                <h3 className="text-xl font-bold mb-2">No training jobs yet</h3>
                <p className="text-gray-500 mb-8 text-center max-w-xs">Create a model first, then start a training job to see live progress here.</p>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                  <Zap className="w-4 h-4" /> Start Training
                </Button>
              </div>
            )}
          </div>

          {/* Job History Sidebar */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-gray-500" />
              Job History
              <span className="ml-auto text-xs text-gray-600 font-normal">{jobs.length} job{jobs.length !== 1 ? 's' : ''}</span>
            </h2>
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
                        <span className="text-xs font-medium text-gray-300 truncate max-w-[100px]">{job.model_name}</span>
                      </div>
                      {getStatusIcon(job.status)}
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                      <motion.div
                        animate={{ width: `${job.progress}%` }}
                        transition={{ duration: 0.5 }}
                        className={cn('h-full rounded-full', job.status === 'completed' ? 'bg-green-500' : 'premium-gradient')}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest">
                      <span>{job.current_epoch}/{job.total_epochs} epochs</span>
                      <span>{job.progress.toFixed(0)}%</span>
                    </div>
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

      {/* New Training Job Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => !creating && setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">New Training Job</h2>
                  <p className="text-gray-500 text-sm mt-1">Configure and launch training</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleNewJob} className="space-y-5">
                {/* Model select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 px-1">Model</label>
                  <div className="relative">
                    <select
                      className={selectClass}
                      value={selectedModel}
                      onChange={e => setSelectedModel(e.target.value)}
                      required
                    >
                      <option className="bg-[#121214] text-white" value="">— Select a model —</option>
                      {dbModels.map(m => (
                        <option className="bg-[#121214] text-white" key={`db-${m.id}`} value={`db:${m.id}`}>{m.name} ({m.base_model}) [Cloud]</option>
                      ))}
                      {localModels.map(m => (
                        <option className="bg-[#121214] text-white" key={`local-${m.id}`} value={`local:${m.id}`}>{m.name} ({m.base_model}) [Local]</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  {dbModels.length === 0 && localModels.length === 0 && (
                    <p className="text-xs text-orange-400 px-1">No models found. <a href="/dashboard/models" className="underline">Create a model first →</a></p>
                  )}
                </div>

                {/* Dataset select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 px-1">Dataset</label>
                  <div className="relative">
                    <select
                      className={selectClass}
                      value={selectedDataset}
                      onChange={e => setSelectedDataset(e.target.value)}
                      required
                    >
                      <option className="bg-[#121214] text-white" value="">— Select a dataset —</option>
                      {dbDatasets.map(d => (
                        <option className="bg-[#121214] text-white" key={`db-${d.id}`} value={`db:${d.id}`}>{d.name} ({d.file_type}) [Cloud]</option>
                      ))}
                      {localDatasets.map(d => (
                        <option className="bg-[#121214] text-white" key={`local-${d.id}`} value={`local:${d.id}`}>{d.name} ({d.file_type}) [Local]</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  {dbDatasets.length === 0 && localDatasets.length === 0 && (
                    <p className="text-xs text-orange-400 px-1">No datasets found. <a href="/dashboard/datasets" className="underline">Upload a dataset first →</a></p>
                  )}
                </div>

                {/* Epochs slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-sm font-medium text-gray-400">Epochs</label>
                    <span className="text-sm font-bold text-white bg-white/10 px-3 py-0.5 rounded-full">{totalEpochs}</span>
                  </div>
                  <input
                    type="range" min={1} max={1000} step={1}
                    value={totalEpochs}
                    onChange={e => setTotalEpochs(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 px-0.5">
                    <span>1</span><span>500</span><span>1000</span>
                  </div>
                </div>

                {/* Learning rate */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 px-1">Learning Rate</label>
                  <div className="relative">
                    <select
                      className={selectClass}
                      value={learningRate}
                      onChange={e => setLearningRate(Number(e.target.value))}
                    >
                      <option className="bg-[#121214] text-white" value={10.0}>10.0 — Extreme</option>
                      <option className="bg-[#121214] text-white" value={5.0}>5.0 — Super Aggressive</option>
                      <option className="bg-[#121214] text-white" value={2.0}>2.0 — Very High</option>
                      <option className="bg-[#121214] text-white" value={1.0}>1.0 — Maximum</option>
                      <option className="bg-[#121214] text-white" value={0.5}>0.5 — Aggressive</option>
                      <option className="bg-[#121214] text-white" value={0.1}>0.1 — Fast (unstable)</option>
                      <option className="bg-[#121214] text-white" value={0.01}>0.01 — Standard</option>
                      <option className="bg-[#121214] text-white" value={0.001}>0.001 — Recommended</option>
                      <option className="bg-[#121214] text-white" value={0.0001}>0.0001 — Fine-tuning</option>
                      <option className="bg-[#121214] text-white" value={0.00001}>0.00001 — Slow convergence</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Config preview */}
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 font-mono text-xs text-gray-400 space-y-1">
                  <p className="text-purple-400 mb-2"># Training config</p>
                  <p>model = <span className="text-green-400">"{
                    selectedModel.startsWith('db:')
                      ? (dbModels.find(x => `db:${x.id}` === selectedModel)?.name || 'not selected')
                      : (localModels.find(x => `local:${x.id}` === selectedModel)?.name || 'not selected')
                  }"</span></p>
                  <p>dataset = <span className="text-green-400">"{
                    selectedDataset.startsWith('db:')
                      ? (dbDatasets.find(x => `db:${x.id}` === selectedDataset)?.name || 'not selected')
                      : (localDatasets.find(x => `local:${x.id}` === selectedDataset)?.name || 'not selected')
                  }"</span></p>
                  <p>epochs = <span className="text-blue-400">{totalEpochs}</span></p>
                  <p>lr = <span className="text-blue-400">{learningRate}</span></p>
                  <p>device = <span className="text-orange-400">{selectedModel.startsWith('db:') && selectedDataset.startsWith('db:') ? '"gpu"' : '"cpu"'}</span>  <span className="text-gray-600">{selectedModel.startsWith('db:') && selectedDataset.startsWith('db:') ? '# GPU training enabled' : '# Local CPU simulation'}</span></p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setIsModalOpen(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    loading={creating}
                    disabled={!selectedModel || !selectedDataset}
                  >
                    <Zap className="w-4 h-4" /> Launch Training
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
