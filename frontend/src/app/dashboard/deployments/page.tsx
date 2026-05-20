"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Rocket, Globe, Zap, Activity, Copy, CheckCircle2, 
  RefreshCw, Trash2, ExternalLink, Plus, Shield, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const MOCK_ENDPOINTS = [
  {
    id: 'ep_001',
    name: 'llama3-sentiment-v2',
    model: 'LLaMA 3 8B',
    region: 'us-east-1',
    status: 'active',
    latency: 142,
    rps: 38,
    uptime: '99.9%',
    calls: '1.24M',
    url: 'https://api.nemix.ai/v1/ep_001/infer',
    created: '2026-05-18',
  },
  {
    id: 'ep_002',
    name: 'gpt2-code-assistant',
    model: 'GPT-2 XL',
    region: 'eu-west-1',
    status: 'active',
    latency: 88,
    rps: 12,
    uptime: '100%',
    calls: '289K',
    url: 'https://api.nemix.ai/v1/ep_002/infer',
    created: '2026-05-14',
  },
  {
    id: 'ep_003',
    name: 'bert-ner-pipeline',
    model: 'BERT Base',
    region: 'ap-southeast-1',
    status: 'sleeping',
    latency: 0,
    rps: 0,
    uptime: '—',
    calls: '54K',
    url: 'https://api.nemix.ai/v1/ep_003/infer',
    created: '2026-05-10',
  },
];

export default function DeploymentsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight premium-text-glow flex items-center gap-2">
              <Rocket className="w-7 h-7 text-purple-400" />
              API Deployments
            </h1>
            <p className="text-gray-400 mt-1">One-click deployed model endpoints with auto-scaling and global routing.</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl premium-gradient text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            Deploy New Model
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Endpoints', value: '2', icon: Globe, color: 'text-green-400', border: 'border-green-500/20', bg: 'from-green-500/10 to-transparent' },
            { label: 'Total API Calls', value: '1.58M', icon: Activity, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'from-purple-500/10 to-transparent' },
            { label: 'Avg Latency', value: '115ms', icon: Clock, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'from-blue-500/10 to-transparent' },
            { label: 'Avg Uptime', value: '99.9%', icon: Shield, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'from-emerald-500/10 to-transparent' },
          ].map((stat) => (
            <div key={stat.label} className={`glass rounded-2xl p-4 border ${stat.border} bg-gradient-to-b ${stat.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Endpoints list */}
        <div className="space-y-4">
          <AnimatePresence>
            {MOCK_ENDPOINTS.map((ep, i) => (
              <motion.div
                key={ep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="glass rounded-2xl border border-white/5 p-5 hover:border-purple-500/20 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: info */}
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
                      ep.status === 'active' 
                        ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                        : 'bg-gray-500/10 border-gray-500/20 text-gray-500'
                    )}>
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white">{ep.name}</h3>
                        <span className={cn(
                          "text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border",
                          ep.status === 'active' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                        )}>
                          {ep.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{ep.model} · {ep.region} · deployed {ep.created}</p>
                      
                      {/* URL bar */}
                      <div className="flex items-center gap-2 mt-2 bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 max-w-sm">
                        <code className="text-[10px] text-gray-400 font-mono truncate flex-1">{ep.url}</code>
                        <button 
                          onClick={() => handleCopy(ep.url, ep.id)}
                          className="text-gray-500 hover:text-purple-400 transition-colors shrink-0"
                        >
                          {copied === ep.id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: metrics + actions */}
                  <div className="flex items-center gap-6 lg:shrink-0">
                    {ep.status === 'active' && (
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase font-mono">Latency</p>
                          <p className="text-sm font-bold text-blue-400 mt-0.5">{ep.latency}ms</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase font-mono">RPS</p>
                          <p className="text-sm font-bold text-purple-400 mt-0.5">{ep.rps}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase font-mono">Uptime</p>
                          <p className="text-sm font-bold text-green-400 mt-0.5">{ep.uptime}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-blue-400 transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-yellow-400 transition-all">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
