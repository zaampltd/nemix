"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Shield, Key, Plus, Copy, CheckCircle2, Eye, EyeOff,
  Trash2, RefreshCw, AlertTriangle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const MOCK_KEYS = [
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

const SCOPE_COLORS: Record<string, string> = {
  'inference': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'models:read': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'datasets:read': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'training:write': 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function SecurityPage() {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

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
              <Shield className="w-7 h-7 text-purple-400" />
              Security & API Keys
            </h1>
            <p className="text-gray-400 mt-1">Manage encrypted API keys, RBAC scopes, and access audit logs.</p>
          </div>
          <button
            onClick={() => setShowNewKeyModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl premium-gradient text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Generate New Key
          </button>
        </div>

        {/* Security summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Keys', value: '2', color: 'text-green-400', border: 'border-green-500/20', bg: 'from-green-500/10 to-transparent' },
            { label: 'Total API Calls', value: '1.34M', color: 'text-purple-400', border: 'border-purple-500/20', bg: 'from-purple-500/10 to-transparent' },
            { label: 'Revoked Keys', value: '1', color: 'text-red-400', border: 'border-red-500/20', bg: 'from-red-500/10 to-transparent' },
            { label: 'Last Activity', value: '2 min ago', color: 'text-blue-400', border: 'border-blue-500/20', bg: 'from-blue-500/10 to-transparent' },
          ].map((stat) => (
            <div key={stat.label} className={`glass rounded-2xl p-4 border ${stat.border} bg-gradient-to-b ${stat.bg}`}>
              <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Warning banner */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p className="text-xs font-mono">Never share your secret keys. They are shown once at creation. Store them in environment variables.</p>
        </div>

        {/* Keys list */}
        <div className="space-y-4">
          {MOCK_KEYS.map((key, i) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={cn(
                "glass rounded-2xl border p-5 transition-all duration-300",
                key.status === 'revoked' ? 'border-white/5 opacity-60' : 'border-white/5 hover:border-purple-500/20'
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
                      <code className="text-[10px] text-gray-400 font-mono flex-1">
                        {revealed === key.id 
                          ? `${key.prefix}••••••••••••${key.suffix}`
                          : `${key.prefix}••••••••••••${key.suffix}`
                        }
                      </code>
                      <button onClick={() => setRevealed(revealed === key.id ? null : key.id)} className="text-gray-500 hover:text-purple-400 transition-colors">
                        {revealed === key.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => handleCopy(`${key.prefix}[SECRET]${key.suffix}`, key.id)} className="text-gray-500 hover:text-purple-400 transition-colors">
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
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last used: {key.lastUsed}</span>
                      <span>{key.calls} calls total</span>
                      <span>Created {key.created}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-yellow-400 transition-all">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* New Key Modal */}
      <AnimatePresence>
        {showNewKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowNewKeyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl border border-white/10 p-8 w-full max-w-md mx-4"
            >
              <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Key className="w-5 h-5 text-purple-400" /> Generate API Key</h2>
              <p className="text-xs text-gray-500 mb-6">This key will only be shown once. Store it securely.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Key Name</label>
                  <input
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. Production Backend"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Scopes</label>
                  <div className="flex flex-wrap gap-2">
                    {['inference', 'models:read', 'datasets:read', 'training:write'].map((scope) => (
                      <button key={scope} className={cn("text-[10px] font-mono px-3 py-1 rounded-full border transition-all", SCOPE_COLORS[scope])}>
                        {scope}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowNewKeyModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-gray-400 hover:text-white transition-all">
                    Cancel
                  </button>
                  <button onClick={() => setShowNewKeyModal(false)} className="flex-1 px-4 py-2.5 rounded-xl premium-gradient text-white text-sm font-bold hover:opacity-90 transition-all">
                    Generate Key
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
