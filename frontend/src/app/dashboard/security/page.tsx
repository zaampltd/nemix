"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Shield, Key, Plus, Copy, CheckCircle2, Eye, EyeOff,
  Trash2, RefreshCw, AlertTriangle, Clock, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ApiKey {
  id: string; name: string; prefix: string; suffix: string;
  scopes: string[]; created: string; lastUsed: string; calls: string;
  status: 'active' | 'revoked';
}

const INITIAL_KEYS: ApiKey[] = [
  { id: 'sk_001', name: 'Production — Main App', prefix: 'nex_sk_prod_', suffix: '...k8Qr',
    scopes: ['inference', 'models:read', 'datasets:read'], created: '2026-05-01', lastUsed: '2 minutes ago', calls: '1.24M', status: 'active' },
  { id: 'sk_002', name: 'CI/CD Pipeline', prefix: 'nex_sk_ci_', suffix: '...pL9m',
    scopes: ['models:read', 'training:write'], created: '2026-04-15', lastUsed: '1 hour ago', calls: '88K', status: 'active' },
  { id: 'sk_003', name: 'Staging Environment', prefix: 'nex_sk_stg_', suffix: '...aZ3x',
    scopes: ['inference', 'models:read'], created: '2026-04-10', lastUsed: '3 days ago', calls: '12K', status: 'revoked' },
];

const ALL_SCOPES = [
  { id: 'inference',       label: 'inference',        desc: 'Run model inference calls' },
  { id: 'models:read',     label: 'models:read',      desc: 'List and read model configs' },
  { id: 'datasets:read',   label: 'datasets:read',    desc: 'Read dataset metadata' },
  { id: 'training:write',  label: 'training:write',   desc: 'Start and manage training jobs' },
  { id: 'deployments:read',label: 'deployments:read', desc: 'View deployment endpoints' },
  { id: 'admin',           label: 'admin',            desc: 'Full admin access (use with care)' },
];

function generateKey(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'key';
  const rand = Array.from({ length: 32 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
  ).join('');
  return `nex_sk_${slug}_${rand}`;
}

export default function SecurityPage() {
  const [keys, setKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [copied, setCopied] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['inference', 'models:read']);
  const [nameError, setNameError] = useState('');
  const [scopeError, setScopeError] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleScope = (scope: string) => {
    setScopeError('');
    setSelectedScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
  };

  const handleGenerate = () => {
    let valid = true;
    if (!newKeyName.trim()) { setNameError('Please enter a name for this key.'); valid = false; } else { setNameError(''); }
    if (selectedScopes.length === 0) { setScopeError('Select at least one scope.'); valid = false; } else { setScopeError(''); }
    if (!valid) return;

    const fullKey = generateKey(newKeyName);
    const now = new Date().toISOString().split('T')[0];
    const newKey: ApiKey = {
      id: `sk_${Date.now()}`, name: newKeyName.trim(),
      prefix: fullKey.slice(0, 16), suffix: `...${fullKey.slice(-4)}`,
      scopes: selectedScopes, created: now, lastUsed: 'Never', calls: '0', status: 'active',
    };
    setKeys(prev => [newKey, ...prev]);
    setGeneratedKey(fullKey);
  };

  const handleCloseModal = () => {
    setShowModal(false); setNewKeyName(''); setSelectedScopes(['inference', 'models:read']);
    setNameError(''); setScopeError(''); setGeneratedKey(null); setKeyCopied(false);
  };

  const handleRevokeKey = (id: string) =>
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' as const } : k));

  const activeCount = keys.filter(k => k.status === 'active').length;
  const revokedCount = keys.filter(k => k.status === 'revoked').length;

  const S = {
    card: { background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-1)' } as React.CSSProperties,
    text: { color: 'var(--md-on-surface)' } as React.CSSProperties,
    muted: { color: 'var(--md-on-surface-var)' } as React.CSSProperties,
    primary: { color: 'var(--md-primary)' } as React.CSSProperties,
    divider: { borderTop: '1px solid var(--md-outline-var)' } as React.CSSProperties,
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2" style={S.text}>
              <Shield className="w-5 h-5" style={S.primary} /> Security & API Keys
            </h1>
            <p className="text-sm mt-1" style={S.muted}>Manage encrypted API keys, scopes, and access audit logs.</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
            <Plus className="w-4 h-4" /> Generate New Key
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Keys',    value: String(activeCount),  color: 'var(--md-success)' },
            { label: 'Total API Calls',value: '1.34M',              color: 'var(--md-primary)' },
            { label: 'Revoked Keys',   value: String(revokedCount), color: 'var(--md-error)' },
            { label: 'Last Activity',  value: '2 min ago',          color: 'var(--md-on-surface)' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl p-4" style={S.card}>
              <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={S.muted}>{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: 'var(--md-warning-cont)', border: '1px solid var(--md-outline)' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--md-warning)' }} />
          <p className="text-xs font-mono" style={{ color: 'var(--md-warning)' }}>
            Never share your secret keys. They are shown once at creation. Store them in environment variables.
          </p>
        </div>

        {/* Keys list */}
        <div className="space-y-3">
          <AnimatePresence>
            {keys.map((key, i) => (
              <motion.div key={key.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl p-5 transition-all"
                style={{ ...S.card, opacity: key.status === 'revoked' ? 0.6 : 1 }}>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: key.status === 'active' ? 'var(--md-primary-container)' : 'var(--md-surface-3)',
                        color: key.status === 'active' ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface-var)',
                      }}>
                      <Key className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-semibold text-sm" style={S.text}>{key.name}</h3>
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full"
                          style={{
                            background: key.status === 'active' ? 'var(--md-success-cont)' : 'var(--md-error-cont)',
                            color: key.status === 'active' ? 'var(--md-success)' : 'var(--md-error)',
                          }}>
                          {key.status}
                        </span>
                      </div>

                      {/* Key value */}
                      <div className="flex items-center gap-2 rounded-xl px-3 py-2 max-w-sm mb-3"
                        style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}>
                        <code className="text-[10px] font-mono flex-1 select-all" style={S.muted}>
                          {key.prefix}••••••••••••{key.suffix}
                        </code>
                        <button onClick={() => handleCopy(`${key.prefix}[redacted]${key.suffix}`, key.id)}
                          style={S.muted}>
                          {copied === key.id
                            ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--md-success)' }} />
                            : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Scopes */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {key.scopes.map(scope => (
                          <span key={scope} className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-cont)', border: '1px solid var(--md-outline)' }}>
                            {scope}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-[10px] font-mono" style={S.muted}>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {key.lastUsed}</span>
                        <span>{key.calls} calls</span>
                        <span>Created {key.created}</span>
                      </div>
                    </div>
                  </div>

                  {key.status === 'active' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="p-2 rounded-xl transition-colors" style={S.muted} title="Rotate key">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRevokeKey(key.id)}
                        className="p-2 rounded-xl transition-colors" style={S.muted} title="Revoke key">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'var(--md-scrim)' }} onClick={handleCloseModal}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl overflow-hidden"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)' }}>

              <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--md-outline)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--md-primary-container)' }}>
                    <Key className="w-5 h-5" style={{ color: 'var(--md-on-primary-cont)' }} />
                  </div>
                  <div>
                    <h2 className="font-bold" style={{ color: 'var(--md-on-surface)' }}>Generate API Key</h2>
                    <p className="text-xs" style={{ color: 'var(--md-on-surface-var)' }}>Key shown once — store it immediately</p>
                  </div>
                </div>
                <button onClick={handleCloseModal} style={{ color: 'var(--md-on-surface-var)' }}><X className="w-4 h-4" /></button>
              </div>

              <div className="p-6 space-y-5">
                {generatedKey ? (
                  <div className="space-y-5">
                    <div className="flex items-start gap-3 p-4 rounded-2xl"
                      style={{ background: 'var(--md-success-cont)', border: '1px solid var(--md-outline)' }}>
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--md-success)' }} />
                      <p className="text-sm" style={{ color: 'var(--md-success)' }}>
                        Key generated! Copy it now — it will <strong>not</strong> be shown again.
                      </p>
                    </div>
                    <div>
                      <label className="text-xs mb-2 block font-mono uppercase tracking-wider" style={{ color: 'var(--md-on-surface-var)' }}>Your New API Key</label>
                      <div className="flex items-center gap-2 rounded-xl px-4 py-3"
                        style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-primary)' }}>
                        <code className="text-sm font-mono flex-1 break-all select-all" style={{ color: 'var(--md-primary)' }}>
                          {generatedKey}
                        </code>
                        <button onClick={() => { navigator.clipboard.writeText(generatedKey); setKeyCopied(true); }}
                          className="shrink-0 p-1.5 rounded-lg transition-colors" style={{ color: 'var(--md-on-surface-var)' }}>
                          {keyCopied
                            ? <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--md-success)' }} />
                            : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                      {keyCopied && <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--md-success)' }}>
                        <CheckCircle2 className="w-3 h-3" /> Copied to clipboard!
                      </p>}
                    </div>
                    <button onClick={handleCloseModal}
                      className="w-full py-3 rounded-2xl font-bold transition-opacity hover:opacity-90"
                      style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
                      Done — I've saved my key
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="text-xs mb-1.5 block font-mono uppercase tracking-wider" style={{ color: 'var(--md-on-surface-var)' }}>Key Name *</label>
                      <input value={newKeyName}
                        onChange={e => { setNewKeyName(e.target.value); setNameError(''); }}
                        placeholder="e.g. Production Backend, CI Pipeline..."
                        className="w-full rounded-xl px-4 py-2.5 text-sm"
                        style={{ background: 'var(--md-surface-2)', border: `1px solid ${nameError ? 'var(--md-error)' : 'var(--md-outline)'}`, color: 'var(--md-on-surface)' }} />
                      {nameError && <p className="text-xs mt-1" style={{ color: 'var(--md-error)' }}>{nameError}</p>}
                    </div>
                    <div>
                      <label className="text-xs mb-2 block font-mono uppercase tracking-wider" style={{ color: 'var(--md-on-surface-var)' }}>Permissions (Scopes) *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ALL_SCOPES.map(scope => {
                          const isSelected = selectedScopes.includes(scope.id);
                          return (
                            <button key={scope.id} type="button" onClick={() => toggleScope(scope.id)}
                              className="flex items-start gap-3 p-3 rounded-xl text-left transition-all"
                              style={{
                                background: isSelected ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                                border: `1px solid ${isSelected ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                                color: isSelected ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface-var)',
                              }}>
                              <div className="w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5"
                                style={{ borderColor: isSelected ? 'var(--md-primary)' : 'var(--md-outline)', background: isSelected ? 'var(--md-primary)' : 'transparent' }}>
                                {isSelected && <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--md-on-primary)' }} />}
                              </div>
                              <div>
                                <p className="text-[11px] font-mono font-bold">{scope.label}</p>
                                <p className="text-[10px] opacity-70 mt-0.5">{scope.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {scopeError && <p className="text-xs mt-1" style={{ color: 'var(--md-error)' }}>{scopeError}</p>}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleCloseModal}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                        style={{ border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)', background: 'transparent' }}>
                        Cancel
                      </button>
                      <button onClick={handleGenerate}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                        style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
                        Generate Key
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
