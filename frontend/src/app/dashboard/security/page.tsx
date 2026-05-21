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
  id: string;
  name: string;
  prefix: string;
  suffix: string;
  scopes: string[];
  created: string;
  lastUsed: string;
  calls: string;
  status: 'active' | 'revoked';
}

const INITIAL_KEYS: ApiKey[] = [
  {
    id: 'sk_001',
    name: 'Production — Main App',
    prefix: 'nex_sk_prod_',
    suffix: '...k8Qr',
    scopes: ['inference', 'models:read', 'datasets:read'],
    created: '2026-05-01',
    lastUsed: '2 minutes ago',
    calls: '1.24M',
    status: 'active',
  },
  {
    id: 'sk_002',
    name: 'CI/CD Pipeline',
    prefix: 'nex_sk_ci_',
    suffix: '...pL9m',
    scopes: ['models:read', 'training:write'],
    created: '2026-04-15',
    lastUsed: '1 hour ago',
    calls: '88K',
    status: 'active',
  },
  {
    id: 'sk_003',
    name: 'Staging Environment',
    prefix: 'nex_sk_stg_',
    suffix: '...aZ3x',
    scopes: ['inference', 'models:read'],
    created: '2026-04-10',
    lastUsed: '3 days ago',
    calls: '12K',
    status: 'revoked',
  },
];

const ALL_SCOPES = [
  { id: 'inference', label: 'inference', desc: 'Run model inference calls', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { id: 'models:read', label: 'models:read', desc: 'List and read model configs', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { id: 'datasets:read', label: 'datasets:read', desc: 'Read dataset metadata', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  { id: 'training:write', label: 'training:write', desc: 'Start and manage training jobs', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
  { id: 'deployments:read', label: 'deployments:read', desc: 'View deployment endpoints', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
  { id: 'admin', label: 'admin', desc: 'Full admin access (use with care)', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
];

const SCOPE_COLORS: Record<string, string> = {
  'inference': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'models:read': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'datasets:read': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'training:write': 'bg-red-500/10 text-red-400 border-red-500/20',
  'deployments:read': 'bg-green-500/10 text-green-400 border-green-500/20',
  'admin': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

function generateKey(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'key';
  const rand = Array.from({ length: 32 }, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
  ).join('');
  return `nex_sk_${slug}_${rand}`;
}

export default function SecurityPage() {
  const [keys, setKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['inference', 'models:read']);
  const [nameError, setNameError] = useState('');
  const [scopeError, setScopeError] = useState('');

  // Generated key reveal state
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleScope = (scope: string) => {
    setScopeError('');
    setSelectedScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  };

  const handleGenerate = () => {
    let valid = true;
    if (!newKeyName.trim()) {
      setNameError('Please enter a name for this key.');
      valid = false;
    } else {
      setNameError('');
    }
    if (selectedScopes.length === 0) {
      setScopeError('Select at least one scope.');
      valid = false;
    } else {
      setScopeError('');
    }
    if (!valid) return;

    const fullKey = generateKey(newKeyName);
    const now = new Date().toISOString().split('T')[0];
    const newKey: ApiKey = {
      id: `sk_${Date.now()}`,
      name: newKeyName.trim(),
      prefix: fullKey.slice(0, 16),
      suffix: `...${fullKey.slice(-4)}`,
      scopes: selectedScopes,
      created: now,
      lastUsed: 'Never',
      calls: '0',
      status: 'active',
    };

    setKeys(prev => [newKey, ...prev]);
    setGeneratedKey(fullKey);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewKeyName('');
    setSelectedScopes(['inference', 'models:read']);
    setNameError('');
    setScopeError('');
    setGeneratedKey(null);
    setKeyCopied(false);
  };

  const handleRevokeKey = (id: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' as const } : k));
  };

  const activeCount = keys.filter(k => k.status === 'active').length;
  const revokedCount = keys.filter(k => k.status === 'revoked').length;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight premium-text-glow flex items-center gap-2">
              <Shield className="w-7 h-7 text-purple-400" />
              Security & API Keys
            </h1>
            <p className="text-gray-400 mt-1">Manage encrypted API keys, RBAC scopes, and access audit logs.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl premium-gradient text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95 shadow-[0_0_20px_-6px_var(--theme-glow)]"
          >
            <Plus className="w-4 h-4" />
            Generate New Key
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Keys', value: String(activeCount), color: 'text-green-400', border: 'border-green-500/20', bg: 'from-green-500/10 to-transparent' },
            { label: 'Total API Calls', value: '1.34M', color: 'text-purple-400', border: 'border-purple-500/20', bg: 'from-purple-500/10 to-transparent' },
            { label: 'Revoked Keys', value: String(revokedCount), color: 'text-red-400', border: 'border-red-500/20', bg: 'from-red-500/10 to-transparent' },
            { label: 'Last Activity', value: '2 min ago', color: 'text-blue-400', border: 'border-blue-500/20', bg: 'from-blue-500/10 to-transparent' },
          ].map((stat) => (
            <div key={stat.label} className={`glass rounded-2xl p-4 border ${stat.border} bg-gradient-to-b ${stat.bg}`}>
              <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p className="text-xs font-mono">Never share your secret keys. They are shown once at creation. Store them in environment variables.</p>
        </div>

        {/* Keys list */}
        <div className="space-y-4">
          <AnimatePresence>
            {keys.map((key, i) => (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "glass rounded-2xl border p-5 transition-all duration-300",
                  key.status === 'revoked' ? 'border-white/5 opacity-50' : 'border-white/5 hover:border-purple-500/20'
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
                      key.status === 'active'
                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                        : 'bg-gray-500/10 border-gray-500/20 text-gray-500'
                    )}>
                      <Key className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white text-sm">{key.name}</h3>
                        <span className={cn(
                          "text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border",
                          key.status === 'active'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        )}>
                          {key.status}
                        </span>
                      </div>

                      {/* Key value */}
                      <div className="flex items-center gap-2 mt-2 bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 max-w-sm">
                        <code className="text-[10px] text-gray-400 font-mono flex-1 select-all">
                          {key.prefix}••••••••••••{key.suffix}
                        </code>
                        <button onClick={() => setRevealed(revealed === key.id ? null : key.id)} className="text-gray-500 hover:text-purple-400 transition-colors">
                          {revealed === key.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleCopy(`${key.prefix}[redacted]${key.suffix}`, key.id)} className="text-gray-500 hover:text-purple-400 transition-colors">
                          {copied === key.id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Scopes */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {key.scopes.map((scope) => (
                          <span key={scope} className={cn("text-[9px] font-mono px-2 py-0.5 rounded-full border", SCOPE_COLORS[scope] || 'bg-white/5 text-gray-400 border-white/10')}>
                            {scope}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-600 font-mono">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {key.lastUsed}</span>
                        <span>{key.calls} calls</span>
                        <span>Created {key.created}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {key.status === 'active' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-yellow-400 transition-all">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRevokeKey(key.id)}
                        className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all"
                        title="Revoke key"
                      >
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

      {/* ── Generate Key Modal ───────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-3xl border border-white/10 w-full max-w-lg overflow-hidden"
              style={{ boxShadow: '0 0 80px -20px rgba(168,85,247,0.4)' }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Key className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">Generate API Key</h2>
                    <p className="text-xs text-gray-500">Key shown once — store it immediately</p>
                  </div>
                </div>
                <button onClick={handleCloseModal} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* ── If key has been generated, show it ── */}
                {generatedKey ? (
                  <div className="space-y-5">
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-500/5 border border-green-500/20">
                      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-green-400">
                        Key generated! Copy it now — it will <strong>not</strong> be shown again.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 mb-2 block font-mono uppercase tracking-wider">Your New API Key</label>
                      <div className="flex items-center gap-2 bg-black/60 border border-purple-500/30 rounded-xl px-4 py-3">
                        <code className="text-sm text-purple-300 font-mono flex-1 break-all select-all">
                          {generatedKey}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedKey);
                            setKeyCopied(true);
                          }}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          {keyCopied
                            ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                            : <Copy className="w-5 h-5 text-gray-400 hover:text-purple-400" />
                          }
                        </button>
                      </div>
                      {keyCopied && (
                        <p className="text-xs text-green-400 font-mono mt-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Copied to clipboard!
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleCloseModal}
                      className="w-full py-3 rounded-2xl premium-gradient text-white font-bold hover:opacity-90 transition-all"
                    >
                      Done — I've saved my key
                    </button>
                  </div>
                ) : (
                  /* ── Form ── */
                  <div className="space-y-5">
                    {/* Name */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block font-mono uppercase tracking-wider">Key Name *</label>
                      <input
                        value={newKeyName}
                        onChange={(e) => { setNewKeyName(e.target.value); setNameError(''); }}
                        placeholder="e.g. Production Backend, CI Pipeline..."
                        className={cn(
                          "w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none transition-all",
                          nameError ? 'border-red-500/50' : 'border-white/10 focus:border-purple-500/50'
                        )}
                      />
                      {nameError && <p className="text-xs text-red-400 mt-1">{nameError}</p>}
                    </div>

                    {/* Scopes */}
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block font-mono uppercase tracking-wider">Permissions (Scopes) *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ALL_SCOPES.map((scope) => {
                          const isSelected = selectedScopes.includes(scope.id);
                          return (
                            <button
                              key={scope.id}
                              type="button"
                              onClick={() => toggleScope(scope.id)}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                                isSelected
                                  ? `${scope.color} border-current`
                                  : 'bg-white/[0.02] border-white/[0.06] text-gray-500 hover:border-white/10'
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all",
                                isSelected ? 'bg-current border-current' : 'border-gray-600'
                              )}>
                                {isSelected && <CheckCircle2 className="w-3 h-3 text-black" />}
                              </div>
                              <div>
                                <p className="text-[11px] font-mono font-bold">{scope.label}</p>
                                <p className="text-[10px] opacity-70 mt-0.5">{scope.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {scopeError && <p className="text-xs text-red-400 mt-1">{scopeError}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={handleCloseModal}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-gray-400 hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleGenerate}
                        className="flex-1 py-2.5 rounded-xl premium-gradient text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95"
                      >
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
