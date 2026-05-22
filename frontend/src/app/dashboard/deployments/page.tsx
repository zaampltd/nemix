"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Rocket, Globe, Zap, Activity, Copy, CheckCircle2,
  RefreshCw, Trash2, ExternalLink, Plus, Shield, Clock, X, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

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
  local?: boolean;
}

const MOCK_ENDPOINTS: Deployment[] = [
  { id: 'ep_001', name: 'llama3-sentiment-v2', model: 'LLaMA 3 8B', region: 'us-east-1', status: 'active', latency: 142, rps: 38, uptime: '99.9%', calls: '1.24M', url: 'https://api.nemix.ai/v1/ep_001/infer', created: '2026-05-18' },
  { id: 'ep_002', name: 'gpt2-code-assistant', model: 'GPT-2 XL', region: 'eu-west-1', status: 'active', latency: 88, rps: 12, uptime: '100%', calls: '289K', url: 'https://api.nemix.ai/v1/ep_002/infer', created: '2026-05-14' },
  { id: 'ep_003', name: 'bert-ner-pipeline', model: 'BERT Base', region: 'ap-southeast-1', status: 'sleeping', latency: 0, rps: 0, uptime: '—', calls: '54K', url: 'https://api.nemix.ai/v1/ep_003/infer', created: '2026-05-10' },
];

const REGIONS = [
  { id: 'us-east-1', name: 'N. Virginia (us-east-1)' },
  { id: 'eu-west-1', name: 'Ireland (eu-west-1)' },
  { id: 'ap-southeast-1', name: 'Singapore (ap-southeast-1)' },
  { id: 'us-west-2', name: 'Oregon (us-west-2)' },
];

export default function DeploymentsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<Deployment[]>([]);
  const [modelsList, setModelsList] = useState<any[]>([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0].id);
  const [customName, setCustomName] = useState('');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

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

  const handleDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel) return;

    const nameToUse = (customName.trim() || selectedModel.name || 'custom-model')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-');

    const newDepID = `ep_${Date.now()}`;
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
      created: new Date().toISOString().split('T')[0],
      local: true
    };

    const updated = [...endpoints, newDep];
    setEndpoints(updated);

    // Save local ones to storage
    const localOnly = updated.filter(e => e.local);
    localStorage.setItem('local_deployments', JSON.stringify(localOnly));

    // Close and reset modal
    setIsModalOpen(false);
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
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 cursor-pointer"
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
          <AnimatePresence>
            {endpoints.map((ep, i) => (
              <motion.div key={ep.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.07 }}
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
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm font-mono" style={S.text}>{ep.name}</h3>
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border"
                          style={{
                            background: ep.status === 'active' ? 'var(--md-success-cont)' : ep.status === 'provisioning' ? 'var(--md-warning-cont)' : 'var(--md-surface-3)',
                            color: ep.status === 'active' ? 'var(--md-success)' : ep.status === 'provisioning' ? 'var(--md-warning)' : 'var(--md-on-surface-var)',
                            borderColor: 'var(--md-outline)'
                          }}>
                          {ep.status}
                        </span>
                      </div>
                      <p className="text-xs mb-2" style={S.muted}>{ep.model} · {ep.region} · deployed {ep.created}</p>

                      <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 max-w-sm"
                        style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}>
                        <code className="text-[10px] font-mono truncate flex-1" style={S.muted}>{ep.url}</code>
                        <button onClick={() => handleCopy(ep.url, ep.id)} style={S.muted} className="cursor-pointer hover:opacity-85">
                          {copied === ep.id
                            ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--md-success)' }} />
                            : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: metrics + actions */}
                  <div className="flex items-center gap-5 lg:shrink-0">
                    {ep.status === 'active' && (
                      <div className="grid grid-cols-3 gap-4 text-center">
                        {[
                          { label: 'Latency', value: `${ep.latency}ms`, color: 'var(--md-primary)' },
                          { label: 'RPS',     value: String(ep.rps),    color: 'var(--md-on-surface)' },
                          { label: 'Uptime',  value: ep.uptime,         color: 'var(--md-success)' },
                        ].map(m => (
                          <div key={m.label}>
                            <p className="text-[9px] uppercase font-mono mb-0.5" style={S.muted}>{m.label}</p>
                            <p className="text-sm font-bold" style={{ color: m.color }}>{m.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {ep.status === 'provisioning' && (
                      <div className="text-right pr-4">
                        <span className="text-[10px] font-mono tracking-wide text-amber-500 animate-pulse">Allocating GPU & Server node...</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      {[
                        { icon: ExternalLink, title: 'Open URL' },
                        { icon: RefreshCw, title: 'Restart' },
                        { icon: Trash2, title: 'Delete', onClick: () => handleDelete(ep.id) },
                      ].map(({ icon: Icon, title, onClick }) => (
                        <button key={title} title={title} onClick={onClick}
                          className="p-2 rounded-xl transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" style={S.muted}>
                          <Icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Deploy New Model Modal */}
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
                className="relative w-full max-w-md rounded-3xl p-6 overflow-hidden z-10"
              >
                <div className="flex items-center justify-between border-b pb-4 mb-5" style={{ borderColor: 'var(--md-outline-var)' }}>
                  <div className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-bold" style={S.text}>Deploy New Model Endpoint</h2>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} style={S.muted} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleDeploy} className="space-y-4">
                  {/* Model Dropdown Selector */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-semibold" style={S.muted}>Select Model</label>
                    <div 
                      onClick={() => setModelDropdownOpen(prev => !prev)}
                      style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}
                      className="h-10 rounded-xl px-4 flex items-center justify-between cursor-pointer select-none"
                    >
                      <span className="text-xs" style={S.text}>
                        {selectedModel ? `${selectedModel.name} (${selectedModel.base_model})` : 'Select a Model...'}
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
                                {m.name} <span className="opacity-70 font-normal">({m.base_model})</span>
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
                      className="w-full h-10 rounded-xl px-4 text-xs focus:outline-none"
                    />
                  </div>

                  {/* Region */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold" style={S.muted}>Deploy Region</label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)' }}
                      className="w-full h-10 rounded-xl px-3 text-xs focus:outline-none"
                    >
                      {REGIONS.map(r => (
                        <option key={r.id} value={r.id} style={{ background: 'var(--md-surface-1)' }}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 h-10 rounded-xl border text-xs font-semibold cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      style={{ borderColor: 'var(--md-outline)', color: 'var(--md-on-surface-var)' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedModel}
                      className="flex-1 h-10 rounded-xl text-xs font-semibold cursor-pointer premium-gradient transition-opacity hover:opacity-90 disabled:opacity-50 disabled:grayscale"
                      style={{ color: 'var(--md-on-primary)' }}
                    >
                      Provision Endpoint
                    </button>
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
