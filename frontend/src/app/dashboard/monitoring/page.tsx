"use client";

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import {
  Activity, Globe, Zap, AlertCircle, CheckCircle2,
  Clock, TrendingUp, TrendingDown, Server, ToggleLeft, ToggleRight,
} from 'lucide-react';

const MODELS = [
  { name: 'llama3-sentiment-v2', endpoint: 'ep_001', region: 'us-east-1', status: 'healthy', rps: 38, p50: 142, p95: 380, p99: 620, errors: 0.3 },
  { name: 'gpt2-code-assistant', endpoint: 'ep_002', region: 'eu-west-1', status: 'healthy', rps: 12, p50: 88, p95: 210, p99: 410, errors: 0.1 },
  { name: 'bert-ner-pipeline',   endpoint: 'ep_003', region: 'ap-southeast-1', status: 'sleeping', rps: 0, p50: 0, p95: 0, p99: 0, errors: 0 },
];

const REGIONS = [
  { name: 'us-east-1',       status: 'healthy', latency: '142ms', load: 62 },
  { name: 'eu-west-1',       status: 'healthy', latency: '88ms',  load: 28 },
  { name: 'ap-southeast-1',  status: 'idle',    latency: '—',     load: 0  },
];

const ERROR_LOG = [
  { time: '10:33:12', model: 'llama3-sentiment-v2', type: 'RateLimitExceeded', count: 3 },
  { time: '09:58:44', model: 'gpt2-code-assistant', type: 'TimeoutError',      count: 1 },
  { time: '08:21:09', model: 'llama3-sentiment-v2', type: 'InvalidInputError', count: 7 },
];

const ALERT_RULES = [
  { id: 'a1', name: 'High error rate',    condition: 'Error rate > 5%',    enabled: true  },
  { id: 'a2', name: 'High latency',       condition: 'p95 Latency > 500ms', enabled: true  },
  { id: 'a3', name: 'Low throughput',     condition: 'RPS < 1 for 5 min',  enabled: false },
  { id: 'a4', name: 'Model offline',      condition: 'Status = sleeping',  enabled: true  },
];

const LATENCY_BUCKETS = [
  { label: '< 50ms',   pct: 8  },
  { label: '50–100ms', pct: 31 },
  { label: '100–200ms',pct: 42 },
  { label: '200–500ms',pct: 16 },
  { label: '> 500ms',  pct: 3  },
];

export default function MonitoringPage() {
  const [alerts, setAlerts] = useState(ALERT_RULES);
  const [liveRPS, setLiveRPS] = useState<number[]>([28,35,42,38,51,44,48,40,38,52,47,55]);
  const [totalReq, setTotalReq] = useState(1_284_392);

  useEffect(() => {
    const t = setInterval(() => {
      const next = Math.floor(Math.random() * 30 + 30);
      setLiveRPS(p => [...p.slice(-11), next]);
      setTotalReq(p => p + next);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const toggleAlert = (id: string) => setAlerts(p => p.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));

  const maxRPS = Math.max(...liveRPS);

  const S = {
    card:  { background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-1)' } as React.CSSProperties,
    text:  { color: 'var(--md-on-surface)' } as React.CSSProperties,
    muted: { color: 'var(--md-on-surface-var)' } as React.CSSProperties,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={S.text}>Model Monitoring</h1>
            <p className="text-sm mt-1" style={S.muted}>Real-time performance metrics for all deployed endpoints.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'var(--md-success-cont)', border: '1px solid var(--md-outline)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--md-success)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--md-success)' }}>All Systems Operational</span>
          </div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Requests (24h)', value: totalReq.toLocaleString(), icon: Activity, color: 'var(--md-primary)', trend: '+12%' },
            { label: 'Avg Latency',          value: '115ms',                   icon: Clock,    color: 'var(--md-on-surface)', trend: '-8ms' },
            { label: 'Error Rate',           value: '0.24%',                   icon: AlertCircle, color: 'var(--md-success)', trend: '-0.1%' },
            { label: 'Active Models',        value: '2 / 3',                   icon: Server,   color: 'var(--md-primary)', trend: null },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl p-4" style={S.card}>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                <p className="text-[10px] font-mono uppercase tracking-wider" style={S.muted}>{stat.label}</p>
              </div>
              <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              {stat.trend && (
                <p className="text-[11px] mt-1 flex items-center gap-0.5"
                  style={{ color: stat.trend.startsWith('+') ? 'var(--md-success)' : 'var(--md-error)' }}>
                  {stat.trend.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.trend} vs yesterday
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Live RPS Chart */}
        <div className="rounded-2xl p-6" style={S.card}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold" style={S.text}>Requests per Second</h2>
              <p className="text-xs mt-0.5" style={S.muted}>Live — updates every 2s</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--md-primary)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--md-primary)' }}>{liveRPS[liveRPS.length - 1]} RPS</span>
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-28">
            {liveRPS.map((v, i) => (
              <motion.div key={i} className="flex-1 rounded-t-md"
                animate={{ height: `${Math.max((v / maxRPS) * 100, 4)}%` }}
                transition={{ duration: 0.3 }}
                style={{ background: i === liveRPS.length - 1 ? 'var(--md-primary)' : 'var(--md-primary-container)' }} />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px]" style={S.muted}>12 seconds ago</span>
            <span className="text-[10px]" style={S.muted}>Now</span>
          </div>
        </div>

        {/* Model metrics table */}
        <div className="rounded-2xl overflow-hidden" style={S.card}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--md-outline)' }}>
            <h2 className="font-semibold" style={S.text}>Endpoint Metrics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--md-outline)' }}>
                  {['Model','Region','RPS','p50','p95','p99','Error %','Status'].map((h, i) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={S.muted}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODELS.map((m, i) => (
                  <tr key={m.name} style={{ borderTop: i > 0 ? '1px solid var(--md-outline-var)' : 'none' }}>
                    <td className="px-5 py-3">
                      <p className="font-mono text-xs font-semibold" style={S.text}>{m.name}</p>
                      <p className="text-[10px]" style={S.muted}>{m.endpoint}</p>
                    </td>
                    <td className="px-5 py-3 text-xs" style={S.muted}>{m.region}</td>
                    <td className="px-5 py-3 text-xs font-bold" style={{ color: m.rps > 0 ? 'var(--md-primary)' : 'var(--md-on-surface-var)' }}>{m.rps > 0 ? m.rps : '—'}</td>
                    <td className="px-5 py-3 text-xs" style={S.text}>{m.p50 > 0 ? `${m.p50}ms` : '—'}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: m.p95 > 400 ? 'var(--md-warning)' : 'var(--md-on-surface)' }}>{m.p95 > 0 ? `${m.p95}ms` : '—'}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: m.p99 > 500 ? 'var(--md-error)' : 'var(--md-on-surface)' }}>{m.p99 > 0 ? `${m.p99}ms` : '—'}</td>
                    <td className="px-5 py-3 text-xs font-semibold" style={{ color: m.errors > 2 ? 'var(--md-error)' : 'var(--md-success)' }}>{m.errors > 0 ? `${m.errors}%` : '0%'}</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-full"
                        style={{
                          background: m.status === 'healthy' ? 'var(--md-success-cont)' : 'var(--md-surface-2)',
                          color: m.status === 'healthy' ? 'var(--md-success)' : 'var(--md-on-surface-var)',
                        }}>{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Latency histogram */}
          <div className="rounded-2xl p-5" style={S.card}>
            <h2 className="font-semibold mb-4" style={S.text}>Latency Distribution</h2>
            <div className="space-y-3">
              {LATENCY_BUCKETS.map(b => (
                <div key={b.label}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span style={S.muted}>{b.label}</span>
                    <span className="font-semibold" style={S.text}>{b.pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: 'var(--md-surface-3)' }}>
                    <motion.div className="h-2 rounded-full" initial={{ width: 0 }}
                      animate={{ width: `${b.pct}%` }} transition={{ duration: 0.8 }}
                      style={{ background: b.pct === Math.max(...LATENCY_BUCKETS.map(x => x.pct)) ? 'var(--md-primary)' : 'var(--md-primary-container)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert rules */}
          <div className="rounded-2xl p-5" style={S.card}>
            <h2 className="font-semibold mb-4" style={S.text}>Alert Rules</h2>
            <div className="space-y-3">
              {alerts.map(a => (
                <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline-var)' }}>
                  <div>
                    <p className="text-sm font-medium" style={S.text}>{a.name}</p>
                    <p className="text-[11px]" style={S.muted}>{a.condition}</p>
                  </div>
                  <button onClick={() => toggleAlert(a.id)}>
                    {a.enabled
                      ? <ToggleRight className="w-7 h-7" style={{ color: 'var(--md-primary)' }} />
                      : <ToggleLeft className="w-7 h-7" style={{ color: 'var(--md-on-surface-var)', opacity: 0.4 }} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Region health + Error log */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-2xl p-5" style={S.card}>
            <h2 className="font-semibold mb-4" style={S.text}>Region Health</h2>
            <div className="space-y-3">
              {REGIONS.map(r => (
                <div key={r.name} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: r.status === 'healthy' ? 'var(--md-success)' : 'var(--md-outline)' }} />
                  <p className="text-sm font-mono flex-1" style={S.text}>{r.name}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={S.muted}>{r.latency}</span>
                    <div className="w-16 h-1.5 rounded-full" style={{ background: 'var(--md-surface-3)' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${r.load}%`, background: 'var(--md-primary)' }} />
                    </div>
                    <span className="text-[11px]" style={S.muted}>{r.load}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-5" style={S.card}>
            <h2 className="font-semibold mb-4" style={S.text}>Recent Errors</h2>
            <div className="space-y-3">
              {ERROR_LOG.map((e, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--md-error-cont)', border: '1px solid var(--md-outline-var)' }}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--md-error)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: 'var(--md-error)' }}>{e.type}</p>
                    <p className="text-[11px] truncate" style={S.muted}>{e.model}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px]" style={S.muted}>{e.time}</p>
                    <p className="text-xs font-bold" style={{ color: 'var(--md-error)' }}>×{e.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
