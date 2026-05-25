"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCircle2, AlertCircle, Info, Zap, Cpu,
  Rocket, CreditCard, Shield, X, Check, Filter, Trash2,
  BellOff, Clock, ChevronRight,
} from 'lucide-react';

type NotifType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  category: string;
  icon: React.ElementType;
  action?: string;
}

const INITIAL: Notification[] = [
  { id: 'n1', type: 'success', title: 'Training Complete', body: 'llama3-sentiment-v2 finished training with 94.2% accuracy.', time: '2 min ago', read: false, category: 'Training', icon: Cpu, action: 'View Results' },
  { id: 'n2', type: 'error', title: 'Deployment Failed', body: 'bert-ner-pipeline deployment to ap-southeast-1 failed. Retrying...', time: '15 min ago', read: false, category: 'Deployments', icon: Rocket },
  { id: 'n3', type: 'warning', title: 'API Limit Warning', body: "You've used 87% of your monthly API call quota (870/1000 calls).", time: '1 hr ago', read: false, category: 'Billing', icon: CreditCard, action: 'Upgrade' },
  { id: 'n4', type: 'success', title: 'Dataset Uploaded', body: 'customer-reviews-2026.csv (42K rows, 18.3 MB) processed successfully.', time: '3 hr ago', read: true, category: 'Datasets', icon: Zap },
  { id: 'n5', type: 'info', title: 'New Team Member', body: 'mike@startup.com accepted your invitation and joined as Developer.', time: '5 hr ago', read: true, category: 'Team', icon: Shield },
  { id: 'n6', type: 'success', title: 'Webhook Delivered', body: '238 webhook events delivered to your Slack endpoint with 100% success rate.', time: '6 hr ago', read: true, category: 'Webhooks', icon: Zap },
  { id: 'n7', type: 'error', title: 'Training Failed', body: 'gpt2-text-gen training stopped. OOM error on epoch 3 — try reducing batch size.', time: 'Yesterday', read: true, category: 'Training', icon: Cpu, action: 'View Logs' },
  { id: 'n8', type: 'info', title: 'Model Deployed', body: 'llama3-sentiment-v2 is live at api.nvmix.com/v1/ep_001/infer.', time: 'Yesterday', read: true, category: 'Deployments', icon: Rocket, action: 'Open Endpoint' },
  { id: 'n9', type: 'success', title: 'Payment Successful', body: 'Invoice #INV-0042 of $49.00 paid. Your Pro plan renews June 1.', time: '2 days ago', read: true, category: 'Billing', icon: CreditCard },
  { id: 'n10', type: 'info', title: 'Nvmix v2.4 Released', body: 'New: Config Builder improvements, Pipelines v2, and 40% faster inference.', time: '3 days ago', read: true, category: 'System', icon: Info },
];

const CATEGORIES = ['All', 'Training', 'Deployments', 'Billing', 'Datasets', 'Team', 'Webhooks', 'System'];

function typeStyle(type: NotifType) {
  switch (type) {
    case 'success': return { color: 'var(--md-success)', bg: 'var(--md-success-cont)' };
    case 'error':   return { color: 'var(--md-error)',   bg: 'var(--md-error-cont)'   };
    case 'warning': return { color: 'var(--md-warning)', bg: 'var(--md-warning-cont)' };
    default:        return { color: 'var(--md-primary)', bg: 'var(--md-primary-container)' };
  }
}

function typeIcon(type: NotifType) {
  switch (type) {
    case 'success': return CheckCircle2;
    case 'error':   return AlertCircle;
    case 'warning': return AlertCircle;
    default:        return Info;
  }
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL);
  const [filter, setFilter] = useState('All');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [preferences, setPreferences] = useState({
    training:    { email: true,  push: true  },
    deployments: { email: true,  push: true  },
    billing:     { email: true,  push: false },
    team:        { email: false, push: true  },
    system:      { email: true,  push: false },
  });

  const unreadCount = notifs.filter(n => !n.read).length;

  const filtered = notifs.filter(n => {
    if (showUnreadOnly && n.read) return false;
    if (filter !== 'All' && n.category !== filter) return false;
    return true;
  });

  const markAll = () => setNotifs(p => p.map(n => ({ ...n, read: true })));
  const markOne = (id: string) => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  const remove = (id: string) => setNotifs(p => p.filter(n => n.id !== id));
  const clearAll = () => setNotifs([]);

  const togglePref = (cat: string, ch: 'email' | 'push') => {
    setPreferences(p => ({ ...p, [cat]: { ...p[cat as keyof typeof p], [ch]: !p[cat as keyof typeof p][ch] } }));
  };

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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center relative"
              style={{ background: 'var(--md-primary-container)' }}>
              <Bell className="w-5 h-5" style={{ color: 'var(--md-on-primary-cont)' }} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ background: 'var(--md-error)', color: 'var(--md-on-primary)' }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold" style={S.text}>Notifications</h1>
              <p className="text-sm" style={S.muted}>
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAll}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition-all"
                style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)' }}>
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            <button onClick={clearAll}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition-all"
              style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)' }}>
              <Trash2 className="w-3.5 h-3.5" /> Clear all
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Notification feed */}
          <div className="lg:col-span-2 space-y-4">

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-1.5 flex-1">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setFilter(cat)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: filter === cat ? 'var(--md-primary-container)' : 'var(--md-surface-1)',
                      color: filter === cat ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface-var)',
                      border: `1px solid ${filter === cat ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                    }}>
                    {cat}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowUnreadOnly(p => !p)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{
                  background: showUnreadOnly ? 'var(--md-primary-container)' : 'var(--md-surface-1)',
                  border: `1px solid ${showUnreadOnly ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                  color: showUnreadOnly ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface-var)',
                }}>
                <Filter className="w-3 h-3" /> Unread
              </button>
            </div>

            {/* Notification list */}
            <div className="space-y-2">
              <AnimatePresence>
                {filtered.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center py-16 rounded-2xl" style={S.card}>
                    <BellOff className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--md-outline)' }} />
                    <p className="font-medium" style={S.text}>No notifications</p>
                    <p className="text-sm mt-1" style={S.muted}>You're all caught up!</p>
                  </motion.div>
                ) : (
                  filtered.map((n, i) => {
                    const ts = typeStyle(n.type);
                    const TypeIcon = typeIcon(n.type);
                    return (
                      <motion.div key={n.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }} transition={{ delay: i * 0.03 }}
                        className="relative flex gap-4 p-4 rounded-2xl transition-all cursor-pointer group"
                        style={{
                          ...S.card,
                          background: n.read ? 'var(--md-surface-1)' : 'var(--md-primary-container)',
                          opacity: n.read ? 0.85 : 1,
                        }}
                        onClick={() => markOne(n.id)}>

                        {/* Unread dot */}
                        {!n.read && (
                          <span className="absolute top-4 right-4 w-2 h-2 rounded-full"
                            style={{ background: 'var(--md-primary)' }} />
                        )}

                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: ts.bg }}>
                          <n.icon className="w-5 h-5" style={{ color: ts.color }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 flex-wrap">
                            <p className="font-semibold text-sm" style={S.text}>{n.title}</p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                              style={{ background: ts.bg, color: ts.color }}>
                              {n.category}
                            </span>
                          </div>
                          <p className="text-sm mt-0.5" style={S.muted}>{n.body}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1 text-[11px]" style={S.muted}>
                              <Clock className="w-3 h-3" /> {n.time}
                            </span>
                            {n.action && (
                              <button className="text-[11px] font-semibold flex items-center gap-0.5"
                                style={{ color: 'var(--md-primary)' }}>
                                {n.action} <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Remove */}
                        <button onClick={e => { e.stopPropagation(); remove(n.id); }}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          style={{ color: 'var(--md-on-surface-var)' }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Preferences */}
          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={S.card}>
              <h2 className="font-semibold mb-4" style={S.text}>Notification Preferences</h2>
              <div className="space-y-4">
                {Object.entries(preferences).map(([cat, prefs]) => (
                  <div key={cat}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2 capitalize" style={S.muted}>{cat}</p>
                    <div className="flex gap-3">
                      {(['email', 'push'] as const).map(ch => (
                        <button key={ch} onClick={() => togglePref(cat, ch)}
                          className="flex items-center gap-2 flex-1 p-2.5 rounded-xl text-xs font-medium transition-all"
                          style={{
                            background: prefs[ch] ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                            border: `1px solid ${prefs[ch] ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                            color: prefs[ch] ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface-var)',
                          }}>
                          {prefs[ch] ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          <span className="capitalize">{ch}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="rounded-2xl p-5" style={S.card}>
              <h2 className="font-semibold mb-4" style={S.text}>This Week</h2>
              <div className="space-y-3">
                {[
                  { label: 'Total received', value: '47', color: 'var(--md-primary)' },
                  { label: 'Successes', value: '38', color: 'var(--md-success)' },
                  { label: 'Errors & warnings', value: '6', color: 'var(--md-error)' },
                  { label: 'System alerts', value: '3', color: 'var(--md-warning)' },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center justify-between text-sm">
                    <span style={S.muted}>{stat.label}</span>
                    <span className="font-bold" style={{ color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Digest schedule */}
            <div className="rounded-2xl p-5" style={S.card}>
              <h2 className="font-semibold mb-1" style={S.text}>Email Digest</h2>
              <p className="text-xs mb-4" style={S.muted}>Get a summary of activity in your inbox.</p>
              {['Real-time', 'Daily digest', 'Weekly digest', 'Never'].map((opt, i) => (
                <button key={opt}
                  className="flex items-center gap-3 w-full py-2.5 text-sm transition-all"
                  style={{ borderTop: i > 0 ? '1px solid var(--md-outline-var)' : 'none', color: 'var(--md-on-surface)' }}>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center border-2"
                    style={{ borderColor: i === 0 ? 'var(--md-primary)' : 'var(--md-outline)' }}>
                    {i === 0 && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--md-primary)' }} />}
                  </div>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
