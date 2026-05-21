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
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

const BASE_MODELS = [
  'bert-base-uncased',
  'gpt2',
  'gpt2-medium',
  'distilbert-base-uncased',
  'roberta-base',
  'llama-2-7b',
  'mistral-7b',
  't5-base',
  'clip-vit-base-patch32',
  'whisper-small',
];

const TASK_TYPES = [
  'Text Classification',
  'Text Generation',
  'Question Answering',
  'Named Entity Recognition',
  'Sentiment Analysis',
  'Summarization',
  'Translation',
  'Image Classification',
  'Speech Recognition',
];

interface AIModel {
  id: number;
  name: string;
  version: string;
  base_model: string;
  task_type: string;
  description: string;
  status: string;
  created_at: string;
  local?: boolean;
}

const STORAGE_KEY = 'local_models';

function loadLocalModels(): AIModel[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveLocalModels(models: AIModel[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
}

export default function ModelsPage() {
  const router = useRouter();
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
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
      const local = loadLocalModels();
      setModels([...response.data, ...local]);
    } catch (err: any) {
      if (!err.isOffline) console.error('Failed to fetch models:', err);
      setModels(loadLocalModels());
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const newModel: AIModel = {
      id: Date.now(),
      name: name.trim(),
      description: description.trim(),
      base_model: baseModel,
      task_type: taskType,
      version: 'v1.0.0',
      status: 'ready',
      created_at: new Date().toISOString(),
      local: true,
    };

    // Try real API first
    try {
      await api.post('/models/', { name: newModel.name, base_model: baseModel, description, task_type: taskType });
    } catch {
      // Offline — persist locally
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
    // Store the selected model and navigate to training
    localStorage.setItem('train_model', JSON.stringify(model));
    router.push('/dashboard/training');
  };

  const filtered = models.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.base_model.toLowerCase().includes(search.toLowerCase())
  );

  const selectClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer";

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Models</h1>
            <p className="text-gray-400 mt-1">Create, manage, and deploy your trained models.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create New Model
          </Button>
        </div>

        {/* Search */}
        <div className="glass p-4 rounded-2xl flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search models..."
              className="w-full bg-transparent border-none focus:ring-0 text-sm pl-10 outline-none text-white placeholder-gray-600"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-3xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Model Name</th>
                  <th className="px-6 py-4 font-semibold">Base Model</th>
                  <th className="px-6 py-4 font-semibold">Task</th>
                  <th className="px-6 py-4 font-semibold">Version</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Created</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Loading models...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <Layers className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                      <p className="text-white font-bold mb-1">No models yet</p>
                      <p className="text-gray-500 text-sm mb-6">Create your first model to get started.</p>
                      <Button onClick={() => setIsModalOpen(true)} className="mx-auto">
                        Create Model
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filtered.map(model => (
                    <motion.tr
                      key={model.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                            <Layers className="w-4 h-4 text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{model.name}</p>
                            {model.description && <p className="text-xs text-gray-500 truncate max-w-[180px]">{model.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{model.base_model}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{model.task_type || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">{model.version}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn('flex items-center gap-2 text-sm', {
                          'text-emerald-400': model.status === 'deployed' || model.status === 'ready',
                          'text-red-400': model.status === 'failed',
                          'text-purple-400 animate-pulse': model.status === 'training',
                          'text-orange-400': !['deployed','ready','failed','training'].includes(model.status),
                        })}>
                          {model.status === 'deployed' || model.status === 'ready'
                            ? <CheckCircle2 className="w-4 h-4" />
                            : model.status === 'failed'
                            ? <AlertIcon className="w-4 h-4" />
                            : <Clock className="w-4 h-4" />}
                          <span className="capitalize">{model.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(model.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleTrain(model)}
                            title="Start Training"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 transition-colors"
                          >
                            <Cpu className="w-3.5 h-3.5" /> Train
                          </button>
                          <button
                            onClick={() => handleDelete(model.id)}
                            title="Delete"
                            className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                          >
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ background: 'var(--md-scrim)' }}
              onClick={() => !creating && setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-lg border border-white/10 rounded-3xl p-8 shadow-2xl"
              style={{ background: 'var(--md-surface)' }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">Create New Model</h2>
                  <p className="text-gray-500 text-sm mt-1">Define your model configuration</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                <Input
                  label="Model Name"
                  placeholder="e.g., sentiment-analyzer-v2"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 px-1">Base Model</label>
                  <div className="relative">
                    <select
                      className={selectClass}
                      value={baseModel}
                      onChange={e => setBaseModel(e.target.value)}
                    >
                      {BASE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 px-1">Task Type</label>
                  <div className="relative">
                    <select
                      className={selectClass}
                      value={taskType}
                      onChange={e => setTaskType(e.target.value)}
                    >
                      {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 px-1">Description <span className="text-gray-600">(optional)</span></label>
                  <textarea
                    className="w-full h-20 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none placeholder-gray-600"
                    placeholder="What does this model do?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
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
