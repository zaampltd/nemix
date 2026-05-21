"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Layers, Search, Trash2, Play, CheckCircle2, Clock,
  AlertCircle as AlertIcon, X, Plus, Cpu, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

const BASE_MODELS = [
  'bert-base-uncased','gpt2','gpt2-medium','distilbert-base-uncased',
  'roberta-base','llama-2-7b','mistral-7b','t5-base','clip-vit-base-patch32','whisper-small',
];

const TASK_TYPES = [
  'Text Classification','Text Generation','Question Answering',
  'Named Entity Recognition','Sentiment Analysis','Summarization',
  'Translation','Image Classification','Speech Recognition',
];

interface AIModel {
  id: number; name: string; version: string; base_model: string;
  task_type: string; description: string; status: string; created_at: string; local?: boolean;
}

const STORAGE_KEY = 'local_models';
function loadLocalModels(): AIModel[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function saveLocalModels(models: AIModel[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(models)); }

function statusStyle(status: string): React.CSSProperties {
  if (status === 'deployed' || status === 'ready') return { color: 'var(--md-success)' };
  if (status === 'failed') return { color: 'var(--md-error)' };
  if (status === 'training') return { color: 'var(--md-primary)' };
  return { color: 'var(--md-on-surface-var)' };
}

export default function ModelsPage() {
  const router = useRouter();
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseModel, setBaseModel] = useState(BASE_MODELS[0]);
  const [taskType, setTaskType] = useState(TASK_TYPES[0]);
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadModels(); }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      const response = await api.get('/models/');
      setModels([...response.data, ...loadLocalModels()]);
    } catch {
      setModels(loadLocalModels());
    } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const newModel: AIModel = {
      id: Date.now(), name: name.trim(), description: description.trim(),
      base_model: baseModel, task_type: taskType, version: 'v1.0.0',
      status: 'ready', created_at: new Date().toISOString(), local: true,
    };
    try {
      await api.post('/models/', { name: newModel.name, base_model: baseModel, description, task_type: taskType });
    } catch {
      const existing = loadLocalModels();
      saveLocalModels([newModel, ...existing]);
    }
    setModels(prev => [newModel, ...prev]);
    setIsModalOpen(false);
    setName(''); setDescription(''); setBaseModel(BASE_MODELS[0]); setTaskType(TASK_TYPES[0]);
    setCreating(false);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Delete this model?')) return;
    const updated = models.filter(m => m.id !== id);
    setModels(updated);
    saveLocalModels(updated.filter(m => m.local));
  };

  const handleTrain = (model: AIModel) => {
    localStorage.setItem('train_model', JSON.stringify(model));
    router.push('/dashboard/training');
  };

  const filtered = models.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.base_model.toLowerCase().includes(search.toLowerCase())
  );

  // Shared select style using CSS variables
  const selectStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--md-surface-2)',
    border: '1px solid var(--md-outline)',
    borderRadius: '12px',
    padding: '10px 16px',
    fontSize: '0.875rem',
    color: 'var(--md-on-surface)',
    appearance: 'none',
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--md-on-surface)' }}>AI Models</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--md-on-surface-var)' }}>Create, manage, and deploy your trained models.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create New Model
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)' }}>
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--md-on-surface-var)' }} />
          <input type="text" placeholder="Search models..."
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: 'var(--md-on-surface)' }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-1)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--md-outline)' }}>
                  {['Model Name','Base Model','Task','Version','Status','Created','Actions'].map((h, i) => (
                    <th key={h} className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider${i === 6 ? ' text-right' : ''}`}
                      style={{ color: 'var(--md-on-surface-var)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                        style={{ borderColor: 'var(--md-primary)', borderTopColor: 'transparent' }} />
                      <p className="text-sm" style={{ color: 'var(--md-on-surface-var)' }}>Loading models...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      {/* Icon */}
                      <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{ background: 'var(--md-primary-container)' }}>
                        <Layers className="w-7 h-7" style={{ color: 'var(--md-on-primary-cont)' }} />
                      </div>
                      {/* "No models yet" — FIXED: was text-white which shows as invisible */}
                      <p className="font-bold text-base mb-1" style={{ color: 'var(--md-on-surface)' }}>No models yet</p>
                      <p className="text-sm mb-6" style={{ color: 'var(--md-on-surface-var)' }}>Create your first model to get started.</p>
                      <Button onClick={() => setIsModalOpen(true)} className="mx-auto">Create Model</Button>
                    </td>
                  </tr>
                ) : (
                  filtered.map((model, i) => (
                    <motion.tr key={model.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="group transition-colors"
                      style={{ borderTop: i > 0 ? '1px solid var(--md-outline-var)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--md-surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'var(--md-primary-container)' }}>
                            <Layers className="w-4 h-4" style={{ color: 'var(--md-on-primary-cont)' }} />
                          </div>
                          <div>
                            {/* Model name — FIXED was text-white */}
                            <p className="font-medium text-sm" style={{ color: 'var(--md-on-surface)' }}>{model.name}</p>
                            {model.description && (
                              <p className="text-xs truncate max-w-[180px]" style={{ color: 'var(--md-on-surface-var)' }}>{model.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Base model — FIXED was text-gray-400 */}
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--md-on-surface-var)' }}>{model.base_model}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--md-on-surface-var)' }}>{model.task_type || '—'}</td>

                      <td className="px-6 py-4">
                        <span className="font-mono text-xs px-2 py-1 rounded"
                          style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)' }}>
                          {model.version}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm" style={statusStyle(model.status)}>
                          {(model.status === 'deployed' || model.status === 'ready')
                            ? <CheckCircle2 className="w-4 h-4" />
                            : model.status === 'failed'
                            ? <AlertIcon className="w-4 h-4" />
                            : <Clock className={`w-4 h-4${model.status === 'training' ? ' animate-pulse' : ''}`} />}
                          <span className="capitalize">{model.status}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--md-on-surface-var)' }}>
                        {new Date(model.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleTrain(model)} title="Start Training"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                            style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-cont)' }}>
                            <Cpu className="w-3.5 h-3.5" /> Train
                          </button>
                          <button onClick={() => handleDelete(model.id)} title="Delete"
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: 'var(--md-on-surface-var)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--md-error)'; e.currentTarget.style.background = 'var(--md-error-cont)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--md-on-surface-var)'; e.currentTarget.style.background = 'transparent'; }}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Model Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-sm" style={{ background: 'var(--md-scrim)' }}
              onClick={() => !creating && setIsModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-lg rounded-3xl p-8"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)' }}>

              <div className="flex items-center justify-between mb-7">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--md-on-surface)' }}>Create New Model</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--md-on-surface-var)' }}>Define your model configuration</p>
                </div>
                <button onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl transition-all" style={{ color: 'var(--md-on-surface-var)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                <Input label="Model Name" placeholder="e.g., sentiment-analyzer-v2"
                  value={name} onChange={e => setName(e.target.value)} required />

                {/* Base Model select — FIXED uses CSS vars */}
                <div className="space-y-2">
                  <label className="text-sm font-medium px-1" style={{ color: 'var(--md-on-surface-var)' }}>Base Model</label>
                  <div className="relative">
                    <select style={selectStyle} value={baseModel} onChange={e => setBaseModel(e.target.value)}>
                      {BASE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: 'var(--md-on-surface-var)' }} />
                  </div>
                </div>

                {/* Task Type select — FIXED uses CSS vars */}
                <div className="space-y-2">
                  <label className="text-sm font-medium px-1" style={{ color: 'var(--md-on-surface-var)' }}>Task Type</label>
                  <div className="relative">
                    <select style={selectStyle} value={taskType} onChange={e => setTaskType(e.target.value)}>
                      {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: 'var(--md-on-surface-var)' }} />
                  </div>
                </div>

                {/* Description textarea — FIXED uses CSS vars */}
                <div className="space-y-2">
                  <label className="text-sm font-medium px-1" style={{ color: 'var(--md-on-surface-var)' }}>
                    Description <span style={{ opacity: 0.5 }}>(optional)</span>
                  </label>
                  <textarea
                    className="w-full h-20 rounded-xl px-4 py-3 text-sm transition-all resize-none"
                    style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)', outline: 'none' }}
                    placeholder="What does this model do?"
                    value={description} onChange={e => setDescription(e.target.value)} />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1"
                    onClick={() => setIsModalOpen(false)} disabled={creating}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" loading={creating} disabled={!name.trim()}>
                    Create Model
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
