"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Layers, Search, Trash2, Play, CheckCircle2, Clock,
  AlertCircle as AlertIcon, X, Plus, Cpu, ChevronDown,
  Sparkles, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

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
  id: string | number; name: string; version: string; base_model: string;
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

  // States for custom dropdown UI toggles
  const [isBaseModelOpen, setIsBaseModelOpen] = useState(false);
  const [isTaskTypeOpen, setIsTaskTypeOpen] = useState(false);

  useEffect(() => { loadModels(); }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      // 1. Fetch from Firestore
      const q = query(
        collection(db, "UserModels"),
        where("userId", "==", "test-user-123")
      );
      const querySnapshot = await getDocs(q);
      const fetched: AIModel[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetched.push({
          id: docSnap.id,
          name: data.name || "Unnamed Model",
          description: data.description || "",
          base_model: data.base_model || "",
          task_type: data.task_type || "",
          version: data.version || "v1.0.0",
          status: data.status || "ready",
          created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : new Date().toISOString(),
          local: false
        });
      });
      // Sort in-memory to safely bypass missing composite index limitations
      fetched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // 2. Fetch from fallback REST
      let restData: AIModel[] = [];
      try {
        const response = await api.get('/models/');
        restData = response.data;
      } catch {}

      setModels([...fetched, ...restData, ...loadLocalModels()]);
    } catch (err) {
      console.error("Firestore models query failed, falling back to REST/LocalStorage:", err);
      try {
        const response = await api.get('/models/');
        setModels([...response.data, ...loadLocalModels()]);
      } catch {
        setModels(loadLocalModels());
      }
    } finally { setLoading(false); }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsBaseModelOpen(false);
    setIsTaskTypeOpen(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const newModel = {
      name: name.trim(),
      description: description.trim(),
      base_model: baseModel,
      task_type: taskType,
      version: 'v1.0.0',
      status: 'ready',
      created_at: new Date().toISOString(),
      local: false,
    };
    try {
      // 1. Commit Document directly to Firestore
      const docRef = await addDoc(collection(db, "UserModels"), {
        userId: "test-user-123",
        name: newModel.name,
        description: newModel.description,
        base_model: newModel.base_model,
        task_type: newModel.task_type,
        version: newModel.version,
        status: newModel.status,
        created_at: serverTimestamp()
      });
      setModels(prev => [{ ...newModel, id: docRef.id }, ...prev]);
    } catch (err: any) {
      console.error("Firestore model publish failed, falling back to REST/LocalStorage:", err);
      // Fallback: save to REST / LocalStorage
      const localModel: AIModel = {
        ...newModel,
        id: Date.now(),
        local: true
      };
      try {
        await api.post('/models/', { name: localModel.name, base_model: baseModel, description, task_type: taskType });
      } catch {
        const existing = loadLocalModels();
        saveLocalModels([localModel, ...existing]);
      }
      setModels(prev => [localModel, ...prev]);
    }
    closeModal();
    setName(''); setDescription(''); setBaseModel(BASE_MODELS[0]); setTaskType(TASK_TYPES[0]);
    setCreating(false);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Delete this model?')) return;
    const modelToDelete = models.find(m => m.id === id);
    
    if (modelToDelete && !modelToDelete.local && typeof id === 'string') {
      try {
        await deleteDoc(doc(db, "UserModels", id));
      } catch (err) {
        console.error("Failed to delete document from Firestore:", err);
      }
    }
    
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

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--md-on-surface)' }}>AI Models</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--md-on-surface-var)' }}>Create, manage, and deploy your trained models.</p>
          </div>
          <Button onClick={() => { setIsModalOpen(true); setIsBaseModelOpen(false); setIsTaskTypeOpen(false); }} className="gap-2">
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
                <tr className="bg-[var(--md-surface-2)]" style={{ borderBottom: '1px solid var(--md-outline)' }}>
                  {['Model Name','Base Model','Task','Version','Status','Created','Actions'].map((h, i) => (
                    <th key={h} className={`px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider${i === 6 ? ' text-right' : ''}`}
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
                      <p className="font-bold text-base mb-1" style={{ color: 'var(--md-on-surface)' }}>No models yet</p>
                      <p className="text-sm mb-6" style={{ color: 'var(--md-on-surface-var)' }}>Create your first model to get started.</p>
                      <Button onClick={() => { setIsModalOpen(true); setIsBaseModelOpen(false); setIsTaskTypeOpen(false); }} className="mx-auto">Create Model</Button>
                    </td>
                  </tr>
                ) : (
                  filtered.map((model, i) => (
                    <motion.tr key={model.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="group hover:bg-[var(--md-surface-2)]/50 transition-colors duration-200"
                      style={{ borderTop: i > 0 ? '1px solid var(--md-outline-var)' : 'none' }}>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'var(--md-primary-container)' }}>
                            <Layers className="w-4 h-4" style={{ color: 'var(--md-on-primary-cont)' }} />
                          </div>
                          <div>
                            <p className="font-medium text-sm" style={{ color: 'var(--md-on-surface)' }}>{model.name}</p>
                            {model.description && (
                              <p className="text-xs truncate max-w-[180px]" style={{ color: 'var(--md-on-surface-var)' }}>{model.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--md-on-surface-var)' }}>{model.base_model}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--md-on-surface-var)' }}>{model.task_type || '—'}</td>

                      <td className="px-6 py-4">
                        <span className="font-mono text-xs px-2 py-1 rounded"
                          style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)' }}>
                          {model.version}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {(() => {
                          if (model.status === 'deployed' || model.status === 'ready') {
                            return (
                              <span className="flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                Ready
                              </span>
                            );
                          } else if (model.status === 'training') {
                            return (
                              <span className="flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 text-[10px] font-bold uppercase tracking-wider">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                                Training
                              </span>
                            );
                          } else if (model.status === 'failed') {
                            return (
                              <span className="flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-bold uppercase tracking-wider">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                Failed
                              </span>
                            );
                          } else {
                            return (
                              <span className="flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                                {model.status}
                              </span>
                            );
                          }
                        })()}
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
            
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ background: 'var(--md-scrim)' }}
              onClick={() => !creating && closeModal()}
            />
            
            {/* Modal Body Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-lg rounded-3xl p-8"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)' }}
            >
              
              {/* Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: 'var(--md-outline-var)' }}>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--md-on-surface)' }}>Create New Model</h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--md-on-surface-var)' }}>Define your model configuration & training adapters</p>
                </div>
                <button 
                  onClick={() => !creating && closeModal()}
                  className="p-2 rounded-xl transition hover:bg-neutral-800" 
                  style={{ color: 'var(--md-on-surface-var)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreate} className="space-y-5">
                
                {/* Model Name Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--md-on-surface-var)' }}>
                    Model Name
                  </label>
                  <div className="relative flex items-center">
                    <Cpu className="absolute left-3 w-4 h-4 text-purple-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g., sentiment-analyzer-v2"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full h-12 rounded-xl pl-10 pr-4 py-2 text-sm bg-[var(--md-surface-2)] border text-[var(--md-on-surface)] outline-none transition focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                      style={{ borderColor: 'var(--md-outline)' }}
                    />
                  </div>
                </div>

                {/* Custom Base Model Dropdown */}
                <div className="relative space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--md-on-surface-var)' }}>
                    Base Model
                  </label>
                  <div 
                    onClick={() => {
                      setIsBaseModelOpen(!isBaseModelOpen);
                      setIsTaskTypeOpen(false);
                    }}
                    className="w-full p-3 rounded-xl bg-[var(--md-surface-2)] border cursor-pointer flex justify-between items-center transition-all duration-200 hover:border-purple-500/80 hover:shadow-[0_0_12px_rgba(124,106,247,0.1)]"
                    style={{ borderColor: 'var(--md-outline)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold" style={{ color: 'var(--md-on-surface)' }}>{baseModel}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isBaseModelOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {isBaseModelOpen && (
                    <div className="absolute z-[999] top-[calc(100%+4px)] left-0 w-full max-h-60 overflow-y-auto bg-[var(--md-surface-1)] border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2"
                      style={{ borderColor: 'var(--md-outline)' }}
                    >
                      {BASE_MODELS.map(model => (
                        <div 
                          key={model}
                          onClick={() => { setBaseModel(model); setIsBaseModelOpen(false); }}
                          className={`flex items-center gap-2 p-3 text-sm cursor-pointer transition-colors duration-150 ${
                            baseModel === model 
                              ? 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-cont)] font-bold' 
                              : 'text-[var(--md-on-surface)] hover:bg-purple-500/10 hover:text-purple-600'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5 opacity-60" />
                          {model}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Task Type Dropdown */}
                <div className="relative space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--md-on-surface-var)' }}>
                    Task Type
                  </label>
                  <div 
                    onClick={() => {
                      setIsTaskTypeOpen(!isTaskTypeOpen);
                      setIsBaseModelOpen(false);
                    }}
                    className="w-full p-3 rounded-xl bg-[var(--md-surface-2)] border cursor-pointer flex justify-between items-center transition-all duration-200 hover:border-purple-500/80 hover:shadow-[0_0_12px_rgba(124,106,247,0.1)]"
                    style={{ borderColor: 'var(--md-outline)' }}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold" style={{ color: 'var(--md-on-surface)' }}>{taskType}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isTaskTypeOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {isTaskTypeOpen && (
                    <div className="absolute z-[999] top-[calc(100%+4px)] left-0 w-full max-h-60 overflow-y-auto bg-[var(--md-surface-1)] border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2"
                      style={{ borderColor: 'var(--md-outline)' }}
                    >
                      {TASK_TYPES.map(type => (
                        <div 
                          key={type}
                          onClick={() => { setTaskType(type); setIsTaskTypeOpen(false); }}
                          className={`flex items-center gap-2 p-3 text-sm cursor-pointer transition-colors duration-150 ${
                            taskType === type 
                              ? 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-cont)] font-bold' 
                              : 'text-[var(--md-on-surface)] hover:bg-purple-500/10 hover:text-purple-600'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5 opacity-60" />
                          {type}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description textarea */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--md-on-surface-var)' }}>
                    Description <span style={{ opacity: 0.5 }}>(optional)</span>
                  </label>
                  <textarea
                    className="w-full h-24 rounded-xl px-4 py-3 text-sm transition focus:outline-none resize-none focus:ring-1 focus:ring-purple-500"
                    style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)' }}
                    placeholder="What does this model do?"
                    value={description} onChange={e => setDescription(e.target.value)} />
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--md-outline-var)' }}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => closeModal()}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    loading={creating}
                    disabled={!name.trim()}
                  >
                    <Sparkles className="w-4 h-4" /> Create Model
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
