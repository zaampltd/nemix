"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Shield, Key, Plus, Copy, CheckCircle2, Eye, EyeOff, 
  Trash2, RefreshCw, AlertTriangle, Clock, X, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

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
  return `nvx_sk_${slug}_${rand}`;
}

export default function SecurityPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyType, setKeyType] = useState<'standard' | 'master'>('standard');
  const [nameError, setNameError] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);

  // ─── Fetch Keys from Firestore ─────────────────────────────────────────────
  const fetchKeys = async () => {
    try {
      setIsLoadingKeys(true);
      const q = query(collection(db, "UserNvmixAPIKeys"), where("userId", "==", "test-user-123"));
      const querySnapshot = await getDocs(q);
      const fetchedKeys: ApiKey[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedKeys.push({
          id: docSnap.id,
          name: data.name || "Unnamed Key",
          prefix: data.prefix || "nvx_sk_xxxx_",
          suffix: data.suffix || "...xxxx",
          scopes: data.scopes || [],
          created: data.created || "Unknown",
          lastUsed: data.lastUsed || "Never",
          calls: data.calls || "0",
          status: data.status || "active"
        });
      });
      setKeys(fetchedKeys);
    } catch (error) {
      console.error("Error fetching API keys from Firestore:", error);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // ─── Save New Key to Firestore ─────────────────────────────────────────────
  const handleGenerate = async () => {
    let valid = true;
    if (!keyName.trim()) { setNameError('Please enter a name for this key.'); valid = false; } else { setNameError(''); }
    if (!valid) return;

    setIsGenerating(true);
    try {
      const fullKey = generateKey(keyName);
      const now = new Date().toISOString().split('T')[0];
      const scopes = keyType === "standard"
        ? ["inference", "models:read", "datasets:read"]
        : ["inference", "models:read", "datasets:read", "training:write", "deployments:read", "admin"];
      
      const docRef = await addDoc(collection(db, "UserNvmixAPIKeys"), {
        userId: "test-user-123",
        name: keyName.trim(),
        prefix: fullKey.slice(0, 16),
        suffix: `...${fullKey.slice(-4)}`,
        keyHash: fullKey, // Plain text for test context copy once
        scopes: scopes,
        created: now,
        lastUsed: "Never",
        calls: "0",
        status: "active",
        createdAt: serverTimestamp()
      });

      const newKey: ApiKey = {
        id: docRef.id,
        name: keyName.trim(),
        prefix: fullKey.slice(0, 16),
        suffix: `...${fullKey.slice(-4)}`,
        scopes: scopes,
        created: now,
        lastUsed: 'Never',
        calls: '0',
        status: 'active',
      };

      setKeys(prev => [newKey, ...prev]);
      setGeneratedKey(fullKey);
    } catch (error) {
      console.error("Error saving API key to Firestore:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false); setKeyName(''); setKeyType('standard');
    setNameError(''); setGeneratedKey(null); setKeyCopied(false);
  };

  // ─── Revoke & Delete Key from Firestore ────────────────────────────────────
  const handleRevokeKey = async (id: string) => {
    const confirmRevoke = window.confirm("Are you sure you want to revoke this API key? This action is permanent and will immediately break any active gateway integrations using this key.");
    if (!confirmRevoke) return;

    try {
      await deleteDoc(doc(db, "UserNvmixAPIKeys", id));
      setKeys(prev => prev.filter(k => k.id !== id));
    } catch (error) {
      console.error("Error revoking API key from Firestore:", error);
      alert("Failed to revoke key due to database connection error.");
    }
  };

  const activeCount = keys.filter(k => k.status === 'active').length;

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
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={S.text}>
              <Shield className="w-5 h-5 text-[var(--md-primary)] animate-pulse" /> Security & API Keys
            </h1>
            <p className="text-xs" style={S.muted}>Manage encrypted API keys, scopes, and access audit logs.</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-90 cursor-pointer shadow-sm"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
            <Plus className="w-4 h-4" /> Generate New Key
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Keys',    value: String(activeCount),  color: 'var(--md-success)' },
            { label: 'Total API Calls',value: '1.34M',              color: 'var(--md-primary)' },
            { label: 'Audit Logs',     value: 'Safe',               color: 'var(--md-primary)' },
            { label: 'Last Activity',  value: 'Active Now',         color: 'var(--md-on-surface)' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl p-4 border" style={S.card}>
              <p className="text-[9px] font-mono uppercase tracking-wider mb-1" style={S.muted}>{stat.label}</p>
              <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-4 rounded-2xl border"
          style={{ background: 'var(--md-warning-cont)', borderColor: 'var(--md-outline)' }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--md-warning)' }} />
          <p className="text-xs font-mono" style={{ color: 'var(--md-warning)' }}>
            Never share your secret keys. They are shown once at creation. Store them securely in backend environment variables.
          </p>
        </div>

        {/* Keys list */}
        <div className="space-y-3">
          {isLoadingKeys ? (
            <div className="rounded-2xl p-8 text-center border" style={S.card}>
              <svg className="animate-spin h-5 w-5 mx-auto text-[var(--md-primary)] mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-xs" style={S.muted}>Loading secure credentials vault...</p>
            </div>
          ) : keys.length === 0 ? (
            <div className="rounded-2xl p-12 text-center border" style={S.card}>
              <Key className="w-8 h-8 text-[var(--md-primary)] mx-auto opacity-55 mb-2 animate-bounce" />
              <h3 className="font-bold text-xs" style={S.text}>No API Keys Generated</h3>
              <p className="text-[11px] max-w-sm mx-auto mt-1" style={S.muted}>
                You have not created any secret keys for this environment yet. Generate a new API key to access your deployed models programmatically.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {keys.map((key, i) => (
                <motion.div key={key.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.03 }}
                  className="rounded-2xl p-5 border transition-all"
                  style={S.card}>
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          background: 'var(--md-primary-container)',
                          color: 'var(--md-on-primary-cont)',
                          borderColor: 'var(--md-outline)'
                        }}>
                        <Key className="w-5 h-5 text-[var(--md-primary)]" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-xs" style={S.text}>{key.name}</h3>
                          <span className="text-[8px] font-mono uppercase px-2 py-0.5 rounded-full border"
                            style={{
                              background: 'var(--md-success-cont)',
                              color: 'var(--md-success)',
                              borderColor: 'var(--md-outline)'
                            }}>
                            {key.status}
                          </span>
                        </div>

                        {/* Masked Key */}
                        <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 max-w-xs"
                          style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}>
                          <code className="text-[9px] font-mono flex-1 select-all" style={S.muted}>
                            {key.prefix}••••••••••••{key.suffix}
                          </code>
                          <button onClick={() => handleCopy(`${key.prefix}xxxxxxxxxxxxxxxx${key.suffix}`, key.id)}
                            style={S.muted} className="cursor-pointer hover:opacity-100 transition-opacity">
                            {copied === key.id
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              : <Copy className="w-3.5 h-3.5 opacity-60" />}
                          </button>
                        </div>

                        {/* Scopes */}
                        <div className="flex flex-wrap gap-1">
                          {key.scopes.map(scope => (
                            <span key={scope} className="text-[8px] font-mono px-2 py-0.5 rounded-full border"
                              style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-cont)', borderColor: 'var(--md-outline)' }}>
                              {scope}
                            </span>
                          ))}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-[9px] font-mono" style={S.muted}>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-sky-400" /> Last Used: {key.lastUsed}</span>
                          <span>Inference Calls: {key.calls}</span>
                          <span>Created: {key.created}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleRevokeKey(key.id)}
                        className="p-2 rounded-xl transition-colors border hover:bg-red-500/10 cursor-pointer" 
                        style={{ borderColor: 'var(--md-outline)', color: 'var(--md-error)' }} 
                        title="Revoke and Delete key">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
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
              className="w-full max-w-md rounded-3xl overflow-hidden"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)' }}>

              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--md-outline-var)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border"
                    style={{ background: 'var(--md-primary-container)', borderColor: 'var(--md-outline)' }}>
                    <Key className="w-4 h-4 text-[var(--md-primary)]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-xs" style={{ color: 'var(--md-on-surface)' }}>Generate API Key</h2>
                    <p className="text-[10px]" style={{ color: 'var(--md-on-surface-var)' }}>Secret key shown once at creation</p>
                  </div>
                </div>
                <button onClick={handleCloseModal} style={{ color: 'var(--md-on-surface-var)' }} className="cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              {/* Modal Content */}
              <div className="p-5 space-y-4">
                {generatedKey ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-2xl border"
                      style={{ background: 'var(--md-success-cont)', borderColor: 'var(--md-outline)' }}>
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                      <p className="text-[11px]" style={{ color: 'var(--md-success)' }}>
                        Key successfully generated! Please copy it now and store it securely. You will <strong>not</strong> be able to view this key again.
                      </p>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] block font-mono uppercase tracking-wider" style={{ color: 'var(--md-on-surface-var)' }}>Your Secret API Key</label>
                      <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 border"
                        style={{ background: 'var(--md-surface-2)', borderColor: 'var(--md-primary)' }}>
                        <code className="text-xs font-mono flex-1 break-all select-all text-[var(--md-primary)]">
                          {generatedKey}
                        </code>
                        <button onClick={() => { navigator.clipboard.writeText(generatedKey); setKeyCopied(true); }}
                          className="shrink-0 p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--md-on-surface-var)' }}>
                          {keyCopied
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            : <Copy className="w-4 h-4 opacity-75" />}
                        </button>
                      </div>
                      {keyCopied && <p className="text-[10px] mt-1.5 flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Copied to clipboard!
                      </p>}
                    </div>
                    <button onClick={handleCloseModal}
                      className="w-full py-3 rounded-2xl text-xs font-bold transition-opacity hover:opacity-90 cursor-pointer shadow-sm"
                      style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
                      Done — I've saved my key
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] block font-mono uppercase tracking-wider" style={{ color: 'var(--md-on-surface-var)' }}>Key Name *</label>
                      <input value={keyName}
                        onChange={e => { setKeyName(e.target.value); setNameError(''); }}
                        placeholder="e.g. Production Backend, CI Pipeline..."
                        className="w-full rounded-xl px-3 py-2 text-xs outline-none border focus:border-[var(--md-primary)] transition-colors"
                        style={{ background: 'var(--md-surface-2)', border: `1px solid ${nameError ? 'var(--md-error)' : 'var(--md-outline)'}`, color: 'var(--md-on-surface)' }} />
                      {nameError && <p className="text-[10px] mt-1" style={{ color: 'var(--md-error)' }}>{nameError}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] block font-mono uppercase tracking-wider" style={{ color: 'var(--md-on-surface-var)' }}>Key Type *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button 
                          type="button" 
                          onClick={() => setKeyType('standard')}
                          className="flex flex-col p-3 rounded-2xl text-left transition-all border cursor-pointer"
                          style={{
                            background: keyType === 'standard' ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                            borderColor: keyType === 'standard' ? 'var(--md-primary)' : 'var(--md-outline)',
                            color: keyType === 'standard' ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface-var)',
                          }}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-[10px] font-bold font-mono">Standard Key</span>
                            <div className="w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0"
                              style={{ borderColor: keyType === 'standard' ? 'var(--md-primary)' : 'var(--md-outline)', background: keyType === 'standard' ? 'var(--md-primary)' : 'transparent' }}>
                              {keyType === 'standard' && <CheckCircle2 className="w-2.5 h-2.5 text-[var(--md-on-primary)]" />}
                            </div>
                          </div>
                          <p className="text-[8px] opacity-75 leading-relaxed">
                            Perfect for general model inference, list reading, and metadata checks. Safe for client apps.
                          </p>
                        </button>

                        <button 
                          type="button" 
                          onClick={() => setKeyType('master')}
                          className="flex flex-col p-3 rounded-2xl text-left transition-all border cursor-pointer"
                          style={{
                            background: keyType === 'master' ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                            borderColor: keyType === 'master' ? 'var(--md-primary)' : 'var(--md-outline)',
                            color: keyType === 'master' ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface-var)',
                          }}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-[10px] font-bold font-mono">Master Key</span>
                            <div className="w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0"
                              style={{ borderColor: keyType === 'master' ? 'var(--md-primary)' : 'var(--md-outline)', background: keyType === 'master' ? 'var(--md-primary)' : 'transparent' }}>
                              {keyType === 'master' && <CheckCircle2 className="w-2.5 h-2.5 text-[var(--md-on-primary)]" />}
                            </div>
                          </div>
                          <p className="text-[8px] opacity-75 leading-relaxed">
                            Unrestricted root-level access including pipeline training, endpoint revoking, and full admin permissions.
                          </p>
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={handleCloseModal}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer"
                        style={{ borderColor: 'var(--md-outline)', color: 'var(--md-on-surface-var)', background: 'transparent' }}>
                        Cancel
                      </button>
                      <button onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-opacity hover:opacity-90 cursor-pointer shadow-sm text-center"
                        style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
                        {isGenerating ? (
                          <svg className="animate-spin h-3.5 w-3.5 text-current mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : "Generate Key"}
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
