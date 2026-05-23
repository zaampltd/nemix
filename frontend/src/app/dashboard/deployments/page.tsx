"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Rocket, Globe, Zap, Activity, Copy, CheckCircle2,
  RefreshCw, Trash2, ExternalLink, Plus, Shield, Clock, X, ChevronDown, Check, Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface Deployment {
  id: string;
  name: string;
  model: string;
  region: string;
  status: 'active' | 'sleeping' | 'provisioning';
  latency: number;
  rps: number;
  uptime: string;
  calls: string;
  url: string;
  created: string;
  apiKey?: string;
  computeNode?: string;
  local?: boolean;
}

const MOCK_ENDPOINTS: Deployment[] = [
  { id: 'ep_001', name: 'llama3-sentiment-v2', model: 'LLaMA 3 8B', region: 'us-east-1', status: 'active', latency: 142, rps: 38, uptime: '99.9%', calls: '1.24M', url: 'https://api.nemix.ai/v1/ep_001/infer', computeNode: 'NVIDIA L4 GPU', created: '2026-05-18', apiKey: 'nex_sk_ep_llama3_xxxxxxxx' },
  { id: 'ep_002', name: 'gpt2-code-assistant', model: 'GPT-2 XL', region: 'eu-west-1', status: 'active', latency: 88, rps: 12, uptime: '100%', calls: '289K', url: 'https://api.nemix.ai/v1/ep_002/infer', computeNode: 'NVIDIA L4 GPU', created: '2026-05-14', apiKey: 'nex_sk_ep_gpt2_xxxxxxxx' },
  { id: 'ep_003', name: 'bert-ner-pipeline', model: 'BERT Base', region: 'ap-southeast-1', status: 'sleeping', latency: 0, rps: 0, uptime: '—', calls: '54K', url: 'https://api.nemix.ai/v1/ep_003/infer', computeNode: 'Shared CPU Node', created: '2026-05-10', apiKey: 'Use Default System Token' },
];

const REGIONS = [
  { id: 'us-east-1', name: 'N. Virginia (us-east-1)', flag: '🇺🇸', latency: '~142ms' },
  { id: 'eu-west-1', name: 'Ireland (eu-west-1)', flag: '🇮🇪', latency: '~88ms' },
  { id: 'ap-southeast-1', name: 'Singapore (ap-southeast-1)', flag: '🇸🇬', latency: '~210ms' },
  { id: 'us-west-2', name: 'Oregon (us-west-2)', flag: '🇺🇸', latency: '~120ms' },
];

const COMPUTE_NODES = [
  { id: 'cpu', name: 'Shared CPU Node', desc: 'No VRAM, shared container allocation.', price: 'Free Tier', icon: '💻' },
  { id: 'nvidia-l4', name: 'NVIDIA L4 GPU', desc: '24GB VRAM, modern Tensor Cores.', price: '$0.48/hr', icon: '⚡' },
  { id: 'nvidia-a100', name: 'NVIDIA A100 GPU', desc: '80GB VRAM, high-scale performance.', price: '$2.20/hr', icon: '🔥' },
];

function generateSecretKey(name: string) {
  const rand = Array.from({ length: 24 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
  ).join('');
  return `nex_sk_ep_${name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6)}_${rand}`;
}

export default function DeploymentsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<Deployment[]>([]);
  const [modelsList, setModelsList] = useState<any[]>([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0].id);
  const [selectedCompute, setSelectedCompute] = useState(COMPUTE_NODES[1].id);
  const [customName, setCustomName] = useState('');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  
  // Dedicated API Key settings inside step 3
  const [generateDedicatedKey, setGenerateDedicatedKey] = useState(true);
  const [generatedKeyResult, setGeneratedKeyResult] = useState('');

  // Load deployments and models
  useEffect(() => {
    const loadData = async () => {
      let localDeps: Deployment[] = [];
      try {
        localDeps = JSON.parse(localStorage.getItem('local_deployments') || '[]');
      } catch {}
      setEndpoints([...MOCK_ENDPOINTS, ...localDeps]);

      let dbModels: any[] = [];
      let localModels: any[] = [];
      try {
        const res = await api.get('/models/');
        dbModels = res.data || [];
      } catch {}
      try {
        localModels = JSON.parse(localStorage.getItem('local_models') || '[]');
      } catch {}
      const combined = [...dbModels, ...localModels];
      setModelsList(combined);
      if (combined.length > 0) {
        setSelectedModel(combined[0]);
      }
    };
    loadData();
  }, []);

  // Monitor provisioning endpoints to transition them to active
  useEffect(() => {
    const provisioning = endpoints.filter(e => e.status === 'provisioning');
    if (provisioning.length > 0) {
      const timer = setTimeout(() => {
        const updated = endpoints.map(e => {
          if (e.status === 'provisioning') {
            return {
              ...e,
              status: 'active' as const,
              latency: Math.round(70 + Math.random() * 80),
              rps: Math.round(5 + Math.random() * 25),
              uptime: '100%',
              calls: '0'
            };
          }
          return e;
        });
        setEndpoints(updated);
        const localOnly = updated.filter(e => e.local);
        localStorage.setItem('local_deployments', JSON.stringify(localOnly));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [endpoints]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this deployment?')) return;
    const updated = endpoints.filter(e => e.id !== id);
    setEndpoints(updated);
    const localOnly = updated.filter(e => e.local);
    localStorage.setItem('local_deployments', JSON.stringify(localOnly));
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel) return;

    const nameToUse = (customName.trim() || selectedModel.name || 'custom-model')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-');

    const newDepID = `ep_${Date.now()}`;
    const targetCompute = COMPUTE_NODES.find(c => c.id === selectedCompute)?.name || 'Standard CPU';
    
    let activeKeyStr = 'Use Default System Token';
    
    // If the user checks the dedicated key generator, create a credential
    if (generateDedicatedKey) {
      const newKey = generateSecretKey(nameToUse);
      activeKeyStr = newKey;
      
      // Save it permanently to Firestore security credentials vault
      try {
        await addDoc(collection(db, "UserNemixAPIKeys"), {
          userId: "test-user-123",
          name: `Dedicated endpoint key for ${nameToUse}`,
          prefix: newKey.slice(0, 16),
          suffix: `...${newKey.slice(-4)}`,
          keyHash: newKey,
          scopes: ["inference", "models:read"],
          created: new Date().toISOString().split('T')[0],
          lastUsed: "Never",
          calls: "0",
          status: "active",
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to sync API key to firestore vault:", err);
      }
    }

    const newDep: Deployment = {
      id: newDepID,
      name: nameToUse,
      model: selectedModel.base_model || selectedModel.name || 'Custom Base',
      region: selectedRegion,
      status: 'provisioning',
      latency: 0,
      rps: 0,
      uptime: '—',
      calls: '0',
      url: `https://api.nemix.ai/v1/${newDepID}/infer`,
      computeNode: targetCompute,
      created: new Date().toISOString().split('T')[0],
      apiKey: activeKeyStr,
      local: true
    };

    const updated = [...endpoints, newDep];
    setEndpoints(updated);

    const localOnly = updated.filter(e => e.local);
    localStorage.setItem('local_deployments', JSON.stringify(localOnly));

    // Reset wizard
    setIsModalOpen(false);
    setWizardStep(1);
    setCustomName('');
    setModelDropdownOpen(false);
  };

  // Compute dynamic stats
  const activeCount = endpoints.filter(e => e.status === 'active').length;
  
  const totalCallsNum = endpoints.reduce((acc, ep) => {
    if (!ep.calls || ep.calls === '—') return acc;
    if (ep.calls.endsWith('M')) return acc + parseFloat(ep.calls) * 1000000;
    if (ep.calls.endsWith('K')) return acc + parseFloat(ep.calls) * 1000;
    return acc + parseInt(ep.calls || '0');
  }, 0);

  const formatTotalCalls = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return String(num);
  };

  const avgLatency = Math.round(
    endpoints.filter(e => e.status === 'active').reduce((acc, e) => acc + e.latency, 0) / 
    Math.max(activeCount, 1)
  );

  const S = {
    text:   { color: 'var(--md-on-surface)' } as React.CSSProperties,
    muted:  { color: 'var(--md-on-surface-var)' } as React.CSSProperties,
    card:   { background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-1)' } as React.CSSProperties,
  };

  // Dedicated dynamic token string for Step 3 Code Block preview
  const previewTokenString = generateDedicatedKey ? `nex_sk_ep_${(customName || selectedModel?.name || 'api').slice(0, 6).toLowerCase().replace(/[^a-z]/g, 'x')}_xxxxxxxxxxxxxxxx` : 'YOUR_MASTER_API_TOKEN';

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2" style={S.text}>
              <Rocket className="w-5 h-5 animate-pulse" style={{ color: 'var(--md-primary)' }} />
              API Deployments
            </h1>
            <p className="text-sm mt-1" style={S.muted}>One-click deployed model endpoints with auto-scaling and global routing.</p>
          </div>
          <button 
            onClick={() => {
              setIsModalOpen(true);
              setWizardStep(1);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 cursor-pointer shadow-sm"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
          >
            <Plus className="w-4 h-4" /> Deploy New Model
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Endpoints', value: String(activeCount),     icon: Globe,    color: 'var(--md-success)' },
            { label: 'Total API Calls',  value: formatTotalCalls(totalCallsNum), icon: Activity, color: 'var(--md-primary)' },
            { label: 'Avg Latency',      value: `${avgLatency}ms`, icon: Clock,    color: 'var(--md-on-surface)' },
            { label: 'Avg Uptime',       value: '99.9%', icon: Shield,   color: 'var(--md-success)' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl p-4" style={S.card}>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                <span className="text-[10px] font-mono uppercase tracking-wider" style={S.muted}>{stat.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Endpoint cards */}
        <div className="space-y-3">
          {endpoints.length === 0 ? (
            <div className="rounded-2xl p-12 text-center border" style={S.card}>
              <Globe className="w-8 h-8 text-[var(--md-primary)] mx-auto opacity-55 mb-2 animate-bounce" />
              <h3 className="font-bold text-xs" style={S.text}>No Deployed Endpoints</h3>
              <p className="text-[11px] max-w-sm mx-auto mt-1" style={S.muted}>
                You have not deployed any models to live gateway gateways yet. Deploy your model in 3 simple steps to query it programmatically.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {endpoints.map((ep, i) => (
                <motion.div key={ep.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.05 }}
                  className="rounded-2xl p-5 transition-all" style={S.card}>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          background: ep.status === 'active' ? 'var(--md-success-cont)' : ep.status === 'provisioning' ? 'var(--md-warning-cont)' : 'var(--md-surface-3)',
                          color: ep.status === 'active' ? 'var(--md-success)' : ep.status === 'provisioning' ? 'var(--md-warning)' : 'var(--md-on-surface-var)',
                          borderColor: 'var(--md-outline)'
                        }}>
                        {ep.status === 'provisioning' ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Globe className="w-5 h-5" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-sm font-mono" style={S.text}>{ep.name}</h3>
                          <span className="text-[8px] font-mono uppercase px-2 py-0.5 rounded-full border"
                            style={{
                              background: ep.status === 'active' ? 'var(--md-success-cont)' : ep.status === 'provisioning' ? 'var(--md-warning-cont)' : 'var(--md-surface-3)',
                              color: ep.status === 'active' ? 'var(--md-success)' : ep.status === 'provisioning' ? 'var(--md-warning)' : 'var(--md-on-surface-var)',
                              borderColor: 'var(--md-outline)'
                            }}>
                            {ep.status}
                          </span>
                          <span className="text-[8px] font-mono px-2 py-0.5 rounded-full border bg-neutral-500/10" style={S.muted}>
                            {ep.computeNode || 'NVIDIA L4 GPU'}
                          </span>
                        </div>
                        <p className="text-[11px]" style={S.muted}>{ep.model} · {ep.region} · deployed {ep.created}</p>

                        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 max-w-sm mt-2"
                          style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}>
                          <code className="text-[9px] font-mono truncate flex-1" style={S.muted}>{ep.url}</code>
                          <button onClick={() => handleCopy(ep.url, ep.id)} style={S.muted} className="cursor-pointer hover:opacity-85">
                            {copied === ep.id
                              ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--md-success)' }} />
                              : <Copy className="w-3.5 h-3.5 opacity-65" />}
                          </button>
                        </div>
                        
                        {/* Access Token indicator */}
                        {ep.apiKey && (
                          <div className="flex items-center gap-1.5 text-[9px] font-mono" style={S.muted}>
                            <Shield className="w-3 h-3 text-purple-400" /> 
                            <span>Credential:</span>
                            <code className="text-purple-400 font-semibold">{ep.apiKey.slice(0, 16)}••••</code>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: metrics + actions */}
                    <div className="flex items-center gap-5 lg:shrink-0 justify-between sm:justify-start">
                      {ep.status === 'active' && (
                        <div className="grid grid-cols-3 gap-4 text-center">
                          {[
                            { label: 'Latency', value: `${ep.latency}ms`, color: 'var(--md-primary)' },
                            { label: 'RPS',     value: String(ep.rps),    color: 'var(--md-on-surface)' },
                            { label: 'Uptime',  value: ep.uptime,         color: 'var(--md-success)' },
                          ].map(m => (
                            <div key={m.label}>
                              <p className="text-[9px] uppercase font-mono mb-0.5" style={S.muted}>{m.label}</p>
                              <p className="text-xs font-bold" style={{ color: m.color }}>{m.value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {ep.status === 'provisioning' && (
                        <div className="text-right pr-4 shrink-0">
                          <span className="text-[10px] font-mono tracking-wide text-amber-500 animate-pulse">Allocating GPU & Server node...</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button title="Open endpoint logs" onClick={() => alert(`Connecting to active logs for ${ep.name}...`)}
                          className="p-2 rounded-xl transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" style={S.muted}>
                          <Clock className="w-4 h-4" />
                        </button>
                        <button title="Delete deployment" onClick={() => handleDelete(ep.id)}
                          className="p-2 rounded-xl transition-colors cursor-pointer hover:bg-red-500/10 hover:text-red-500" style={{ color: 'var(--md-error)' }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Deploy New Model Modal (Step-wise Wizard) */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* Content Panel */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)' }}
                className="relative w-full max-w-xl rounded-3xl p-6 overflow-hidden z-10"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b pb-4 mb-5" style={{ borderColor: 'var(--md-outline-var)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center border" style={{ background: 'var(--md-primary-container)', borderColor: 'var(--md-outline)' }}>
                      <Rocket className="w-5 h-5 text-[var(--md-primary)]" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold" style={S.text}>Deploy New Model Endpoint</h2>
                      <p className="text-[10px]" style={S.muted}>Step {wizardStep} of 3</p>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} style={S.muted} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress Stepper Bar */}
                <div className="flex items-center gap-2 mb-6">
                  {[1, 2, 3].map(step => (
                    <div key={`step-indicator-${step}`} className="flex-1 flex items-center gap-1">
                      <div className="h-1 flex-1 rounded-full"
                        style={{
                          background: wizardStep >= step ? 'var(--md-primary)' : 'var(--md-surface-3)',
                          transition: 'background-color 0.3s'
                        }}
                      />
                      <span className="text-[9px] font-mono font-bold" style={{ color: wizardStep === step ? 'var(--md-primary)' : 'var(--md-on-surface-var)' }}>
                        0{step}
                      </span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleDeploy} className="space-y-5">
                  <AnimatePresence mode="wait">
                    {/* WIZARD STEP 1: Basic Config */}
                    {wizardStep === 1 && (
                      <motion.div key="step-1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                        {/* Model Dropdown Selector */}
                        <div className="space-y-1.5 relative">
                          <label className="text-xs font-semibold" style={S.muted}>Select Model *</label>
                          <div 
                            onClick={() => setModelDropdownOpen(prev => !prev)}
                            style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}
                            className="h-11 rounded-xl px-4 flex items-center justify-between cursor-pointer select-none"
                          >
                            <span className="text-xs font-medium" style={S.text}>
                              {selectedModel ? `${selectedModel.name} (${selectedModel.base_model || 'Fine-tuned'})` : 'Select a Model...'}
                            </span>
                            <ChevronDown className="w-4 h-4 text-purple-400" />
                          </div>

                          <AnimatePresence>
                            {modelDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 6 }}
                                style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-2)' }}
                                className="absolute left-0 right-0 top-full mt-1.5 rounded-xl p-1.5 max-h-48 overflow-y-auto z-50 flex flex-col"
                              >
                                {modelsList.length === 0 ? (
                                  <div className="p-3 text-center text-xs" style={S.muted}>No models found. Create one first!</div>
                                ) : (
                                  modelsList.map(m => (
                                    <button
                                      key={`deploy-model-${m.id}`}
                                      type="button"
                                      onClick={() => {
                                        setSelectedModel(m);
                                        setModelDropdownOpen(false);
                                      }}
                                      style={{
                                        background: selectedModel?.id === m.id ? 'var(--md-primary-container)' : 'transparent',
                                        color: selectedModel?.id === m.id ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface)',
                                      }}
                                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-500/10 transition-colors"
                                    >
                                      {m.name} <span className="opacity-70 font-normal">({m.base_model || m.baseModel || 'Fine-tuned'})</span>
                                    </button>
                                  ))
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Custom Name */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold" style={S.muted}>Endpoint Name (Optional)</label>
                          <input 
                            type="text"
                            placeholder="e.g. llama3-sentiment-v2"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)' }}
                            className="w-full h-11 rounded-xl px-4 text-xs focus:outline-none"
                          />
                          <p className="text-[10px]" style={S.muted}>Your routing path: <code>https://api.nemix.ai/v1/{customName || 'endpoint-id'}/infer</code></p>
                        </div>
                      </motion.div>
                    )}

                    {/* WIZARD STEP 2: Server & Infrastructure */}
                    {wizardStep === 2 && (
                      <motion.div key="step-2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                        {/* Region Grid Selection (Custom dropdown bypass!) */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold" style={S.muted}>Deployment Region</label>
                          <div className="grid grid-cols-2 gap-3">
                            {REGIONS.map(r => {
                              const active = selectedRegion === r.id;
                              return (
                                <button
                                  key={`reg-${r.id}`}
                                  type="button"
                                  onClick={() => setSelectedRegion(r.id)}
                                  style={{
                                    background: active ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                                    borderColor: active ? 'var(--md-primary)' : 'var(--md-outline)',
                                    color: active ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface)',
                                  }}
                                  className="p-3 rounded-2xl text-left border flex items-center justify-between transition-all cursor-pointer hover:opacity-95"
                                >
                                  <div>
                                    <p className="text-xs font-semibold flex items-center gap-1.5">
                                      <span>{r.flag}</span> {r.name.split(' ')[0]}
                                    </p>
                                    <p className="text-[9px] font-mono mt-0.5 opacity-70">Latency: {r.latency}</p>
                                  </div>
                                  <div className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                                    style={{ borderColor: active ? 'var(--md-primary)' : 'var(--md-outline)', background: active ? 'var(--md-primary)' : 'transparent' }}>
                                    {active && <Check className="w-2.5 h-2.5 text-[var(--md-on-primary)]" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Compute Resource Selection */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold" style={S.muted}>Instance Compute Level</label>
                          <div className="grid grid-cols-1 gap-2">
                            {COMPUTE_NODES.map(c => {
                              const active = selectedCompute === c.id;
                              return (
                                <button
                                  key={`comp-${c.id}`}
                                  type="button"
                                  onClick={() => setSelectedCompute(c.id)}
                                  style={{
                                    background: active ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                                    borderColor: active ? 'var(--md-primary)' : 'var(--md-outline)',
                                    color: active ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface)',
                                  }}
                                  className="p-3 rounded-2xl text-left border flex items-center gap-3 transition-all cursor-pointer hover:opacity-95"
                                >
                                  <span className="text-2xl shrink-0">{c.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-semibold">{c.name}</p>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-neutral-500/20 bg-neutral-500/5">{c.price}</span>
                                    </div>
                                    <p className="text-[10px] mt-0.5 opacity-85">{c.desc}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* WIZARD STEP 3: Security & Key Selector */}
                    {wizardStep === 3 && (
                      <motion.div key="step-3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                        {/* Token Generator Selector */}
                        <div className="p-4 rounded-2xl border space-y-3" style={{ background: 'var(--md-surface-2)', borderColor: 'var(--md-outline)' }}>
                          <div className="flex items-start gap-3">
                            <input 
                              type="checkbox"
                              id="dedicated-key"
                              checked={generateDedicatedKey}
                              onChange={(e) => setGenerateDedicatedKey(e.target.checked)}
                              className="mt-1"
                              style={{ accentColor: 'var(--md-primary)' }}
                            />
                            <div className="flex-1 min-w-0">
                              <label htmlFor="dedicated-key" className="text-xs font-bold block cursor-pointer" style={S.text}>
                                Generate a New Dedicated Key for this endpoint
                              </label>
                              <p className="text-[10px] mt-0.5" style={S.muted}>
                                Highly recommended. A unique, dedicated security token will be auto-generated for this specific model router, keeping your master training token separate and safe.
                              </p>
                            </div>
                          </div>
                          
                          {generateDedicatedKey && (
                            <div className="flex items-center gap-2 p-2 rounded-xl border border-dashed text-[10px] font-mono text-purple-400" style={{ background: 'var(--md-surface-1)', borderColor: 'var(--md-primary)' }}>
                              <Shield className="w-3.5 h-3.5 shrink-0" />
                              <span>Token prefix will be: </span>
                              <code>{`nex_sk_ep_${(customName || selectedModel?.name || 'api').slice(0, 6).toLowerCase().replace(/[^a-z]/g, 'x')}_...`}</code>
                            </div>
                          )}
                        </div>

                        {/* Interactive cURL Code Block Preview */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold" style={S.muted}>cURL Connection Preview</label>
                          <pre className="p-4 rounded-2xl text-[10px] font-mono overflow-x-auto select-all"
                            style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)' }}>
{`curl -X POST https://api.nemix.ai/v1/ep_${Date.now().toString().slice(-4)}/infer \\
  -H "Authorization: Bearer ${previewTokenString}" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Hello World"}'`}
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Wizard Footer Controls */}
                  <div className="flex justify-between items-center gap-3 pt-3 border-t mt-5" style={{ borderColor: 'var(--md-outline-var)' }}>
                    <div>
                      {wizardStep > 1 && (
                        <button
                          type="button"
                          onClick={() => setWizardStep(p => Math.max(1, p - 1))}
                          className="h-10 rounded-xl px-4 text-xs font-semibold cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors border"
                          style={{ borderColor: 'var(--md-outline)', color: 'var(--md-on-surface-var)' }}
                        >
                          Back
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="h-10 rounded-xl px-4 text-xs font-semibold cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        style={{ color: 'var(--md-on-surface-var)' }}
                      >
                        Cancel
                      </button>

                      {wizardStep < 3 ? (
                        <button
                          type="button"
                          onClick={() => setWizardStep(p => Math.min(3, p + 1))}
                          disabled={wizardStep === 1 && !selectedModel}
                          className="h-10 rounded-xl px-5 text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
                          style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
                        >
                          Next Step
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="h-10 rounded-xl px-5 text-xs font-semibold cursor-pointer premium-gradient transition-opacity hover:opacity-90 shadow-sm"
                          style={{ color: 'var(--md-on-primary)' }}
                        >
                          Provision Endpoint
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </DashboardLayout>
  );
}
