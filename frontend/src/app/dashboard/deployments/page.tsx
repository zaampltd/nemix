"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Rocket, Globe, Zap, Activity, Copy, CheckCircle2,
  RefreshCw, Trash2, ExternalLink, Plus, Shield, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_ENDPOINTS = [
  { id: 'ep_001', name: 'llama3-sentiment-v2', model: 'LLaMA 3 8B', region: 'us-east-1', status: 'active', latency: 142, rps: 38, uptime: '99.9%', calls: '1.24M', url: 'https://api.nemix.ai/v1/ep_001/infer', created: '2026-05-18' },
  { id: 'ep_002', name: 'gpt2-code-assistant', model: 'GPT-2 XL', region: 'eu-west-1', status: 'active', latency: 88, rps: 12, uptime: '100%', calls: '289K', url: 'https://api.nemix.ai/v1/ep_002/infer', created: '2026-05-14' },
  { id: 'ep_003', name: 'bert-ner-pipeline', model: 'BERT Base', region: 'ap-southeast-1', status: 'sleeping', latency: 0, rps: 0, uptime: '—', calls: '54K', url: 'https://api.nemix.ai/v1/ep_003/infer', created: '2026-05-10' },
];

export default function DeploymentsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState(MOCK_ENDPOINTS);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = (id: string) => setEndpoints(prev => prev.filter(e => e.id !== id));

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
              <Rocket className="w-5 h-5" style={{ color: 'var(--md-primary)' }} />
              API Deployments
            </h1>
            <p className="text-sm mt-1" style={S.muted}>One-click deployed model endpoints with auto-scaling and global routing.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
            <Plus className="w-4 h-4" /> Deploy New Model
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Endpoints', value: '2',     icon: Globe,    color: 'var(--md-success)' },
            { label: 'Total API Calls',  value: '1.58M', icon: Activity, color: 'var(--md-primary)' },
            { label: 'Avg Latency',      value: '115ms', icon: Clock,    color: 'var(--md-on-surface)' },
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
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: ep.status === 'active' ? 'var(--md-success-cont)' : 'var(--md-surface-3)',
                        color: ep.status === 'active' ? 'var(--md-success)' : 'var(--md-on-surface-var)',
                        border: '1px solid var(--md-outline)',
                      }}>
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {/* Model name — FIXED (was text-white which becomes black in light mode) */}
                        <h3 className="font-semibold text-sm font-mono" style={S.text}>{ep.name}</h3>
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full"
                          style={{
                            background: ep.status === 'active' ? 'var(--md-success-cont)' : 'var(--md-surface-3)',
                            color: ep.status === 'active' ? 'var(--md-success)' : 'var(--md-on-surface-var)',
                            border: '1px solid var(--md-outline)',
                          }}>
                          {ep.status}
                        </span>
                      </div>
                      <p className="text-xs mb-2" style={S.muted}>{ep.model} · {ep.region} · deployed {ep.created}</p>

                      {/* URL bar — FIXED (was bg-black/40 which is literally black) */}
                      <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 max-w-sm"
                        style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}>
                        <code className="text-[10px] font-mono truncate flex-1" style={S.muted}>{ep.url}</code>
                        <button onClick={() => handleCopy(ep.url, ep.id)} style={S.muted}>
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
                    <div className="flex items-center gap-1.5">
                      {[
                        { icon: ExternalLink, title: 'Open URL' },
                        { icon: RefreshCw, title: 'Restart' },
                        { icon: Trash2, title: 'Delete', onClick: () => handleDelete(ep.id) },
                      ].map(({ icon: Icon, title, onClick }) => (
                        <button key={title} title={title} onClick={onClick}
                          className="p-2 rounded-xl transition-colors" style={S.muted}>
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
      </motion.div>
    </DashboardLayout>
  );
}
