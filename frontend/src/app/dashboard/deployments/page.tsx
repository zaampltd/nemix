"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Rocket, Globe, Zap, Activity, Copy, CheckCircle2,
  RefreshCw, Trash2, ExternalLink, Plus, Shield, Clock, X, ChevronDown, Check, Server, GitMerge, Sliders, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface Deployment {
  id: string;
  name: string;
  type: 'model' | 'router';
  modelOrRules: string;
  regionOrPolicy: string;
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
  { id: 'ep_001', name: 'llama3-sentiment-v2', type: 'model', modelOrRules: 'LLaMA 3 8B', regionOrPolicy: 'us-east-1', status: 'active', latency: 142, rps: 38, uptime: '99.9%', calls: '1.24M', url: 'https://api.nemix.ai/v1/ep_001/infer', computeNode: 'NVIDIA L4 GPU', created: '2026-05-18', apiKey: 'nex_sk_ep_llama3_xxxxxxxx' },
  { id: 'ep_002', name: 'gpt2-code-assistant', type: 'model', modelOrRules: 'GPT-2 XL', regionOrPolicy: 'eu-west-1', status: 'active', latency: 88, rps: 12, uptime: '100%', calls: '289K', url: 'https://api.nemix.ai/v1/ep_002/infer', computeNode: 'NVIDIA L4 GPU', created: '2026-05-14', apiKey: 'nex_sk_ep_gpt2_xxxxxxxx' },
  { id: 'ep_r01', name: 'global-smart-router', type: 'router', modelOrRules: 'Llama-3, GPT-2 (Smart Routing)', regionOrPolicy: 'Task-Based Routing', status: 'active', latency: 94, rps: 52, uptime: '100%', calls: '1.58M', url: 'https://api.nemix.ai/v1/router/global-smart-router/infer', computeNode: 'Edge Gateway Node', created: '2026-05-20', apiKey: 'nex_sk_ep_router_xxxxxxxx' },
  { id: 'ep_003', name: 'bert-ner-pipeline', type: 'model', modelOrRules: 'BERT Base', regionOrPolicy: 'ap-southeast-1', status: 'sleeping', latency: 0, rps: 0, uptime: '—', calls: '54K', url: 'https://api.nemix.ai/v1/ep_003/infer', computeNode: 'Shared CPU Node', created: '2026-05-10', apiKey: 'Use Default System Token' },
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

const ROUTING_POLICIES = [
  { id: 'smart_routing', name: 'Task-Based Dynamic Routing', desc: 'Queries are auto-routed to the best suited model based on semantic content analysis.', icon: '🧠', tag: 'Recommended' },
  { id: 'ab_test', name: 'A/B Split Testing', desc: 'Distribute a configurable ratio of traffic between your primary and shadow models.', icon: '🔀', tag: 'Dual-active' },
  { id: 'load_balancer', name: 'High-Availability Load Balancer', desc: 'Distribute incoming requests equally to maximize throughput and guarantee uptime.', icon: '🔄', tag: 'Round-robin' }
];

function generateSecretKey(name: string, prefix = 'ep') {
  const rand = Array.from({ length: 24 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
  ).join('');
  return `nex_sk_${prefix}_${name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6)}_${rand}`;
}

export default function DeploymentsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<Deployment[]>([]);
  const [modelsList, setModelsList] = useState<any[]>([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [deploymentType, setDeploymentType] = useState<'model' | 'router'>('model');
  const [activeLogsEndpoint, setActiveLogsEndpoint] = useState<Deployment | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  
  // Model Deploy Form states
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0].id);
  const [selectedCompute, setSelectedCompute] = useState(COMPUTE_NODES[1].id);
  
  // Edge Router Form states
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState(ROUTING_POLICIES[0].id);
  const [abSplitRatio, setAbSplitRatio] = useState(50); // 50% split default
  
  // Shared Form states
  const [customName, setCustomName] = useState('');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [generateDedicatedKey, setGenerateDedicatedKey] = useState(true);

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

  // Stream simulated logs in real time
  useEffect(() => {
    if (!activeLogsEndpoint) return;

    const interval = setInterval(() => {
      const paths = ['/v1/models', '/v1/chat/completions', '/v1/embeddings', '/health'];
      const methods = ['GET', 'POST', 'POST', 'GET'];
      const rIdx = Math.floor(Math.random() * paths.length);
      const latencyVal = Math.round(50 + Math.random() * 250);
      const isSuccess = Math.random() > 0.05;
      const statusText = isSuccess ? '200 OK' : '500 Internal Error';
      const logType = isSuccess ? 'INFO' : 'ERROR';
      
      const newLog = `[${new Date().toISOString()}] [${logType}] Received inference call - ${methods[rIdx]} ${paths[rIdx]} -> ${statusText} (${latencyVal}ms)`;
      
      setLogLines(prev => [newLog, ...prev]);
    }, 2000);

    return () => clearInterval(interval);
  }, [activeLogsEndpoint]);

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

    const nameToUse = (customName.trim() || (deploymentType === 'model' ? selectedModel?.name : 'gateway-route') || 'endpoint')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-');

    const newDepID = `ep_${Date.now()}`;
    const newKey = generateSecretKey(nameToUse, deploymentType === 'model' ? 'ep' : 'router');
    let activeKeyStr = 'Use Default System Token';

    if (generateDedicatedKey) {
      activeKeyStr = newKey;
      // Sync it directly with the Security Credentials Vault in Firestore
      try {
        await addDoc(collection(db, "UserNemixAPIKeys"), {
          userId: "test-user-123",
          name: `Dedicated ${deploymentType === 'model' ? 'endpoint' : 'edge router'} key for ${nameToUse}`,
          prefix: newKey.slice(0, 16),
          suffix: `...${newKey.slice(-4)}`,
          keyHash: newKey,
          scopes: deploymentType === 'model' ? ["inference", "models:read"] : ["inference", "admin"],
          created: new Date().toISOString().split('T')[0],
          lastUsed: "Never",
          calls: "0",
          status: "active",
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to sync key credentials to Firestore:", err);
      }
    }

    let newDep: Deployment;

    if (deploymentType === 'model') {
      const targetCompute = COMPUTE_NODES.find(c => c.id === selectedCompute)?.name || 'Standard CPU';
      newDep = {
        id: newDepID,
        name: nameToUse,
        type: 'model',
        modelOrRules: selectedModel?.base_model || selectedModel?.name || 'Custom Base',
        regionOrPolicy: selectedRegion,
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
    } else {
      const policyName = ROUTING_POLICIES.find(p => p.id === selectedPolicy)?.name || 'Smart Routing';
      const modelsBoundCount = selectedEndpoints.length;
      newDep = {
        id: newDepID,
        name: nameToUse,
        type: 'router',
        modelOrRules: `${modelsBoundCount} Active Endpoints linked`,
        regionOrPolicy: policyName,
        status: 'active', // Routers deploy instantly on proxy servers
        latency: 85,
        rps: 18,
        uptime: '100%',
        calls: '0',
        url: `https://api.nemix.ai/v1/router/${nameToUse}/infer`,
        computeNode: 'Edge Gateway Node',
        created: new Date().toISOString().split('T')[0],
        apiKey: activeKeyStr,
        local: true
      };
    }

    const updated = [...endpoints, newDep];
    setEndpoints(updated);

    const localOnly = updated.filter(e => e.local);
    localStorage.setItem('local_deployments', JSON.stringify(localOnly));

    // Reset wizard
    setIsModalOpen(false);
    setWizardStep(1);
    setCustomName('');
    setSelectedEndpoints([]);
    setModelDropdownOpen(false);
  };

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
  const previewTokenString = generateDedicatedKey ? `nex_sk_${deploymentType === 'model' ? 'ep' : 'router'}_${(customName || (deploymentType === 'model' ? selectedModel?.name : 'gateway') || 'api').slice(0, 6).toLowerCase().replace(/[^a-z]/g, 'x')}_xxxxxxxxxxxxxxxx` : 'YOUR_MASTER_API_TOKEN';
  const previewUrlString = deploymentType === 'model' ? `https://api.nemix.ai/v1/ep_0142/infer` : `https://api.nemix.ai/v1/router/${customName || 'smart-gateway'}/infer`;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2" style={S.text}>
              <Rocket className="w-5 h-5 animate-pulse" style={{ color: 'var(--md-primary)' }} />
              API Deployments & Routers
            </h1>
            <p className="text-sm mt-1" style={S.muted}>Deploy single model endpoints or compile complex edge routers to group all models into a single smart gateway.</p>
          </div>
          <button 
            onClick={() => {
              setIsModalOpen(true);
              setWizardStep(1);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 cursor-pointer shadow-sm"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
          >
            <Plus className="w-4 h-4" /> Deploy & Route
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
                  className="rounded-2xl p-5 transition-all relative overflow-hidden" style={S.card}>

                  {/* Top-right subtle badge indicating Gateway vs Single Model */}
                  <div className="absolute top-0 right-0 p-3 flex gap-2">
                    <span className="text-[7px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-neutral-500/20 bg-neutral-500/5" style={S.muted}>
                      {ep.type === 'model' ? 'Single Inference API' : 'Edge Smart Router'}
                    </span>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          background: ep.type === 'router' ? 'var(--md-primary-container)' : ep.status === 'active' ? 'var(--md-success-cont)' : ep.status === 'provisioning' ? 'var(--md-warning-cont)' : 'var(--md-surface-3)',
                          color: ep.type === 'router' ? 'var(--md-primary)' : ep.status === 'active' ? 'var(--md-success)' : ep.status === 'provisioning' ? 'var(--md-warning)' : 'var(--md-on-surface-var)',
                          borderColor: 'var(--md-outline)'
                        }}>
                        {ep.status === 'provisioning' ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : ep.type === 'router' ? (
                          <GitMerge className="w-5 h-5" />
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
                        <p className="text-[11px]" style={S.muted}>
                          {ep.type === 'model' ? `Base: ${ep.modelOrRules}` : `Bindings: ${ep.modelOrRules}`} · Routing: {ep.regionOrPolicy} · {ep.created}
                        </p>

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
                            <span>Routing Access Key:</span>
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
                        <button title="Open endpoint logs" 
                          onClick={() => {
                            setActiveLogsEndpoint(ep);
                            setLogLines([
                              `[${new Date().toISOString()}] [INFO] Starting container node service for ${ep.name}...`,
                              `[${new Date().toISOString()}] [INFO] Connecting to high-availability database cluster...`,
                              `[${new Date().toISOString()}] [INFO] CUDA v12.2 detected. Initializing GPU pipelines...`,
                              `[${new Date().toISOString()}] [INFO] Loading fine-tuned adapter weights onto GPU:0...`,
                              `[${new Date().toISOString()}] [INFO] Adapter loaded. Peak memory footprint: 8.42 GB / 24.0 GB`,
                              `[${new Date().toISOString()}] [INFO] Initializing FastAPI gateway on port 8000...`,
                              `[${new Date().toISOString()}] [INFO] Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)`,
                              `[${new Date().toISOString()}] [INFO] Startup completed successfully. Endpoint is online.`
                            ]);
                          }}
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
                      <h2 className="text-sm font-bold" style={S.text}>
                        {wizardStep === 1 ? 'Select Deployment Architecture' : deploymentType === 'model' ? 'Deploy Single Model API' : 'Compile Intelligent Edge Router'}
                      </h2>
                      <p className="text-[10px] uppercase font-mono tracking-wider" style={S.muted}>Step {wizardStep} of 3</p>
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
                    {/* WIZARD STEP 1: Select Deployment Type + Core Config */}
                    {wizardStep === 1 && (
                      <motion.div key="step-1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                        
                        {/* High-Fidelity Type Choice Cards */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold" style={S.muted}>Select API Framework Type</label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'model', title: 'Single Model Inference API', desc: 'Deploy one fine-tuned checkpoint directly to autoscaling computing GPU clusters.', icon: Rocket },
                              { id: 'router', title: 'Intelligent Edge Router Gateway', desc: 'Join all model APIs into a single gateway routing. Decides optimal targets in real-time.', icon: GitMerge }
                            ].map(t => {
                              const active = deploymentType === t.id;
                              return (
                                <button
                                  key={`type-${t.id}`}
                                  type="button"
                                  onClick={() => setDeploymentType(t.id as 'model' | 'router')}
                                  style={{
                                    background: active ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                                    borderColor: active ? 'var(--md-primary)' : 'var(--md-outline)',
                                    color: active ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface)',
                                  }}
                                  className="p-4 rounded-2xl text-left border flex flex-col justify-between h-40 transition-all cursor-pointer hover:opacity-95"
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-black/5 dark:bg-white/5" style={{ borderColor: active ? 'var(--md-primary)' : 'var(--md-outline)' }}>
                                      <t.icon className="w-4 h-4" />
                                    </div>
                                    <div className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                                      style={{ borderColor: active ? 'var(--md-primary)' : 'var(--md-outline)', background: active ? 'var(--md-primary)' : 'transparent' }}>
                                      {active && <Check className="w-2.5 h-2.5 text-[var(--md-on-primary)]" />}
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <p className="text-xs font-bold">{t.title}</p>
                                    <p className="text-[9px] mt-1 leading-relaxed opacity-85">{t.desc}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Condition-based config render */}
                        {deploymentType === 'model' ? (
                          <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--md-outline-var)' }}>
                            {/* Model Select */}
                            <div className="space-y-1.5 relative">
                              <label className="text-xs font-semibold" style={S.muted}>Target Model *</label>
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
                                    className="absolute left-0 right-0 top-full mt-1.5 rounded-xl p-1.5 max-h-40 overflow-y-auto z-50 flex flex-col"
                                  >
                                    {modelsList.map(m => (
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
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Custom Name */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold" style={S.muted}>Endpoint Naming *</label>
                              <input 
                                type="text"
                                placeholder="e.g. llama3-sentiment-v2"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)' }}
                                className="w-full h-11 rounded-xl px-4 text-xs focus:outline-none"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--md-outline-var)' }}>
                            {/* Checkbox grid listing active model endpoints */}
                            <div className="space-y-2">
                              <label className="text-xs font-semibold block" style={S.muted}>Select Active APIs to Bind to Router *</label>
                              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                                {endpoints.filter(e => e.type === 'model').map(ep => {
                                  const checked = selectedEndpoints.includes(ep.id);
                                  return (
                                    <div
                                      key={`bind-${ep.id}`}
                                      onClick={() => {
                                        setSelectedEndpoints(prev => 
                                          checked ? prev.filter(x => x !== ep.id) : [...prev, ep.id]
                                        );
                                      }}
                                      style={{
                                        background: checked ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                                        borderColor: checked ? 'var(--md-primary)' : 'var(--md-outline)',
                                        color: checked ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface)',
                                      }}
                                      className="p-3 rounded-xl border flex items-center justify-between cursor-pointer select-none hover:opacity-95"
                                    >
                                      <div>
                                        <p className="text-xs font-semibold font-mono">{ep.name}</p>
                                        <p className="text-[9px] opacity-75">{ep.modelOrRules} · {ep.computeNode} · {ep.regionOrPolicy}</p>
                                      </div>
                                      <input 
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {}}
                                        style={{ accentColor: 'var(--md-primary)' }}
                                        className="w-4 h-4 pointer-events-none"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Gateway Custom Name */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold" style={S.muted}>Edge Router URL Gateway Name *</label>
                              <input 
                                type="text"
                                placeholder="e.g. global-smart-router"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)' }}
                                className="w-full h-11 rounded-xl px-4 text-xs focus:outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* WIZARD STEP 2: Infra Nodes (Model) OR Routing Logic (Router) */}
                    {wizardStep === 2 && (
                      <motion.div key="step-2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                        {deploymentType === 'model' ? (
                          <div className="space-y-4">
                            {/* Region selector */}
                            <div className="space-y-2">
                              <label className="text-xs font-semibold" style={S.muted}>Target Deployment Region</label>
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

                            {/* Compute Selector */}
                            <div className="space-y-2">
                              <label className="text-xs font-semibold" style={S.muted}>Model Cluster Compute Level</label>
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
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Routing Policies */}
                            <div className="space-y-2">
                              <label className="text-xs font-semibold" style={S.muted}>Select Intelligent Routing Policy</label>
                              <div className="grid grid-cols-1 gap-2.5">
                                {ROUTING_POLICIES.map(p => {
                                  const active = selectedPolicy === p.id;
                                  return (
                                    <button
                                      key={`policy-${p.id}`}
                                      type="button"
                                      onClick={() => setSelectedPolicy(p.id)}
                                      style={{
                                        background: active ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                                        borderColor: active ? 'var(--md-primary)' : 'var(--md-outline)',
                                        color: active ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface)',
                                      }}
                                      className="p-3 rounded-2xl text-left border flex items-start gap-3 transition-all cursor-pointer hover:opacity-95"
                                    >
                                      <span className="text-2xl shrink-0 mt-0.5">{p.icon}</span>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <p className="text-xs font-semibold">{p.name}</p>
                                          <span className="text-[8px] font-mono uppercase px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/5">{p.tag}</span>
                                        </div>
                                        <p className="text-[10px] mt-1 leading-relaxed opacity-85">{p.desc}</p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Dynamic Ratio slider if A/B test selected */}
                            {selectedPolicy === 'ab_test' && (
                              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl border space-y-3" style={{ background: 'var(--md-surface-2)', borderColor: 'var(--md-outline)' }}>
                                <div className="flex justify-between items-center text-xs font-mono">
                                  <span style={{ color: 'var(--md-primary)' }}>Primary API: {abSplitRatio}%</span>
                                  <span style={{ color: 'var(--md-success)' }}>Shadow API: {100 - abSplitRatio}%</span>
                                </div>
                                <input 
                                  type="range"
                                  min="1"
                                  max="99"
                                  value={abSplitRatio}
                                  onChange={(e) => setAbSplitRatio(parseInt(e.target.value))}
                                  className="w-full h-1 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[var(--md-primary)]"
                                />
                                <p className="text-[9px]" style={S.muted}>
                                  Incoming gateway calls will be split dynamically on our Edge Nodes according to this exact weight ratio.
                                </p>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* WIZARD STEP 3: Security, Dedicated Key Generation & Code block preview */}
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
                                Generate a New Dedicated Key for this {deploymentType === 'model' ? 'endpoint' : 'gateway router'}
                              </label>
                              <p className="text-[10px] mt-0.5" style={S.muted}>
                                Highly recommended. Creates a unique, dedicated security token for this routing gateway, keeping your master model credentials isolated.
                              </p>
                            </div>
                          </div>
                          
                          {generateDedicatedKey && (
                            <div className="flex items-center gap-2 p-2 rounded-xl border border-dashed text-[10px] font-mono text-purple-400" style={{ background: 'var(--md-surface-1)', borderColor: 'var(--md-primary)' }}>
                              <Shield className="w-3.5 h-3.5 shrink-0" />
                              <span>Token prefix will be: </span>
                              <code>{`nex_sk_${deploymentType === 'model' ? 'ep' : 'router'}_${(customName || 'api').slice(0, 6).toLowerCase().replace(/[^a-z]/g, 'x')}_...`}</code>
                            </div>
                          )}
                        </div>

                        {/* Interactive cURL Code Block Preview */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold" style={S.muted}>cURL Integration Preview</label>
                          <pre className="p-4 rounded-2xl text-[10px] font-mono overflow-x-auto select-all"
                            style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)' }}>
{`curl -X POST ${previewUrlString} \\
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
                          disabled={
                            (wizardStep === 1 && deploymentType === 'model' && !selectedModel) ||
                            (wizardStep === 1 && deploymentType === 'router' && (selectedEndpoints.length === 0 || !customName.trim()))
                          }
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

          {/* Premium Live Logs Terminal Drawer */}
          <AnimatePresence>
            {activeLogsEndpoint && (
              <div className="fixed inset-0 z-[100] flex justify-end">
                
                {/* Backdrop */}
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  onClick={() => setActiveLogsEndpoint(null)}
                  className="absolute inset-0 backdrop-blur-xs"
                  style={{ background: 'var(--md-scrim)' }}
                />

                {/* Drawer Panel */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="relative w-full max-w-lg h-full p-6 flex flex-col z-10"
                  style={{ 
                    background: 'var(--md-surface-1)', 
                    borderLeft: '1px solid var(--md-outline)', 
                    boxShadow: 'var(--shadow-3)',
                    backdropFilter: 'blur(16px)'
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 mb-4 border-b" style={{ borderColor: 'var(--md-outline-var)' }}>
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                      <div>
                        <h3 className="font-bold text-sm" style={{ color: 'var(--md-on-surface)' }}>
                          Live Logs: {activeLogsEndpoint.name}
                         </h3>
                        <p className="text-[10px] uppercase font-mono" style={{ color: 'var(--md-on-surface-var)' }}>
                          Active Connection · SSL Secured
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setActiveLogsEndpoint(null)}
                      className="p-1.5 rounded-xl hover:bg-neutral-800/10 cursor-pointer"
                      style={{ color: 'var(--md-on-surface-var)' }}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Terminal Window */}
                  <div className="flex-1 rounded-2xl p-4 font-mono text-[11px] overflow-y-auto space-y-1.5 flex flex-col-reverse"
                    style={{ background: '#0a0a0c', border: '1px solid var(--md-outline)', color: '#3dd68c' }}>
                    <div className="flex flex-col gap-1.5">
                      {logLines.map((line, idx) => {
                        let color = '#3dd68c'; // green info
                        if (line.includes('[ERROR]')) color = 'var(--md-error)'; // red
                        if (line.includes('[WARN]')) color = 'var(--md-warning)'; // yellow
                        return (
                          <p key={`log-${idx}`} style={{ color, wordBreak: 'break-all', lineHeight: '1.4' }}>
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  </div>

                  {/* Control bar */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: 'var(--md-outline-var)' }}>
                    <p className="text-[10px]" style={{ color: 'var(--md-on-surface-var)' }}>
                      Autoscroll active · Streaming via secure websockets
                    </p>
                    <button onClick={() => setLogLines([])}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-neutral-800/10 border cursor-pointer"
                      style={{ borderColor: 'var(--md-outline)', color: 'var(--md-on-surface)' }}>
                      Clear Terminal
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </motion.div>
      </DashboardLayout>
  );
}
