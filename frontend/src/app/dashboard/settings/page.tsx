"use client";
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  User, Lock, Bell, Globe, CreditCard, Zap, CheckCircle2,
  Eye, EyeOff, Copy, RefreshCw, Plus, Trash2, ToggleLeft, ToggleRight, Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Shared input style ────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', height: '44px', borderRadius: '12px',
  padding: '0 14px', fontSize: '0.875rem',
  background: 'var(--md-surface-2)',
  border: '1px solid var(--md-outline)',
  color: 'var(--md-on-surface)', outline: 'none',
};
const label: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 600,
  marginBottom: '6px', color: 'var(--md-on-surface-var)',
};
const card: React.CSSProperties = {
  background: 'var(--md-surface-1)',
  border: '1px solid var(--md-outline)',
  borderRadius: '20px', padding: '24px',
  boxShadow: 'var(--shadow-1)',
};
const divider: React.CSSProperties = {
  borderTop: '1px solid var(--md-outline-var)', margin: '20px 0',
};

// ── Tab definitions ───────────────────────────────────────────────
const TABS = [
  { id: 'profile',       label: 'Profile',        icon: User       },
  { id: 'security',      label: 'Security',        icon: Lock       },
  { id: 'notifications', label: 'Notifications',   icon: Bell       },
  { id: 'api',           label: 'API Keys',         icon: Zap        },
  { id: 'appearance',    label: 'Appearance',      icon: Globe      },
];

function SaveBanner({ onSave }: { onSave: () => void }) {
  return (
    <div className="flex justify-end gap-3 pt-5" style={{ borderTop: '1px solid var(--md-outline-var)' }}>
      <button className="px-5 py-2.5 rounded-xl text-sm font-medium"
        style={{ border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)', background: 'transparent' }}>
        Discard
      </button>
      <button onClick={onSave}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
        style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
        <Save className="w-4 h-4" /> Save Changes
      </button>
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────
function ProfileTab({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({
    fullName: '', email: '', username: '', bio: '', company: '', website: '', timezone: 'UTC+03:00',
  });

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('current_user') || '{}');
      setForm(f => ({ ...f, fullName: u.full_name || 'John Doe', email: u.email || 'user@nemix.ai' }));
    } catch {}
  }, []);

  const initials = form.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-5">
      {/* Avatar */}
      <div style={card}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--md-on-surface)' }}>Profile Photo</p>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
            {initials}
          </div>
          <div>
            <button className="block px-4 py-2 rounded-xl text-sm font-medium mb-2 transition-opacity hover:opacity-80"
              style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-cont)' }}>
              Upload Photo
            </button>
            <p className="text-xs" style={{ color: 'var(--md-on-surface-var)' }}>JPG, PNG or GIF · Max 5 MB</p>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div style={card}>
        <p className="text-sm font-semibold mb-5" style={{ color: 'var(--md-on-surface)' }}>Personal Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={label}>Full Name</label>
            <input style={inp} value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="John Doe" />
          </div>
          <div>
            <label style={label}>Username</label>
            <input style={inp} value={form.username} onChange={e => set('username', e.target.value)} placeholder="johndoe" />
          </div>
          <div className="sm:col-span-2">
            <label style={label}>Email Address</label>
            <input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label style={label}>Company</label>
            <input style={inp} value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Inc." />
          </div>
          <div>
            <label style={label}>Website</label>
            <input style={inp} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://yoursite.com" />
          </div>
          <div className="sm:col-span-2">
            <label style={label}>Bio</label>
            <textarea
              className="w-full rounded-xl px-4 py-3 text-sm resize-none"
              style={{ ...inp, height: '88px' } as React.CSSProperties}
              value={form.bio} onChange={e => set('bio', e.target.value)}
              placeholder="A short bio about yourself..." />
          </div>
          <div>
            <label style={label}>Timezone</label>
            <select style={{ ...inp, appearance: 'none', cursor: 'pointer' }}
              value={form.timezone} onChange={e => set('timezone', e.target.value)}>
              {['UTC-08:00 (LA)', 'UTC-05:00 (NY)', 'UTC+00:00 (London)', 'UTC+01:00 (Paris)', 'UTC+03:00 (Istanbul)', 'UTC+05:30 (Mumbai)', 'UTC+08:00 (Singapore)', 'UTC+09:00 (Tokyo)'].map(tz => (
                <option key={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Language</label>
            <select style={{ ...inp, appearance: 'none', cursor: 'pointer' }}>
              <option>English (US)</option>
              <option>English (UK)</option>
              <option>Turkish</option>
              <option>French</option>
              <option>German</option>
              <option>Arabic</option>
            </select>
          </div>
        </div>
        <SaveBanner onSave={onSave} />
      </div>

      {/* Danger zone */}
      <div style={{ ...card, borderColor: 'var(--md-error)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--md-error)' }}>Danger Zone</p>
        <p className="text-xs mb-4" style={{ color: 'var(--md-on-surface-var)' }}>
          Permanently delete your account and all your data. This action cannot be undone.
        </p>
        <button className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--md-error-cont)', color: 'var(--md-error)', border: '1px solid var(--md-error)' }}>
          Delete Account
        </button>
      </div>
    </div>
  );
}

// ── Security Tab ──────────────────────────────────────────────────
function SecurityTab({ onSave }: { onSave: () => void }) {
  const [cur, setCur] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [mfa, setMfa] = useState(false);

  const strength = newPw.length === 0 ? 0 : newPw.length < 6 ? 1 : newPw.length < 10 ? 2 : /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) ? 4 : 3;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'var(--md-error)', 'var(--md-warning)', 'var(--md-primary)', 'var(--md-success)'];

  const SESSIONS = [
    { device: 'Chrome — Windows 11', location: 'Istanbul, Turkey', time: 'Active now',   current: true  },
    { device: 'Safari — iPhone 15',  location: 'Istanbul, Turkey', time: '2 days ago',   current: false },
    { device: 'Firefox — MacBook',   location: 'New York, US',     time: '1 week ago',   current: false },
  ];

  return (
    <div className="space-y-5">
      {/* Change password */}
      <div style={card}>
        <p className="text-sm font-semibold mb-5" style={{ color: 'var(--md-on-surface)' }}>Change Password</p>
        <div className="space-y-4 max-w-md">
          <div>
            <label style={label}>Current Password</label>
            <div className="relative">
              <input type={showCur ? 'text' : 'password'} style={{ ...inp, paddingRight: '44px' }}
                value={cur} onChange={e => setCur(e.target.value)} placeholder="Enter current password" />
              <button type="button" onClick={() => setShowCur(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--md-on-surface-var)' }}>
                {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label style={label}>New Password</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} style={{ ...inp, paddingRight: '44px' }}
                value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Enter new password" />
              <button type="button" onClick={() => setShowNew(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--md-on-surface-var)' }}>
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPw && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-all"
                      style={{ background: i <= strength ? strengthColor[strength] : 'var(--md-surface-3)' }} />
                  ))}
                </div>
                <p className="text-xs" style={{ color: strengthColor[strength] }}>{strengthLabel[strength]}</p>
              </div>
            )}
          </div>
          <div>
            <label style={label}>Confirm New Password</label>
            <input type="password" style={{ ...inp, borderColor: confirm && confirm !== newPw ? 'var(--md-error)' : 'var(--md-outline)' }}
              value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat new password" />
            {confirm && confirm !== newPw && (
              <p className="text-xs mt-1" style={{ color: 'var(--md-error)' }}>Passwords do not match</p>
            )}
          </div>
        </div>
        <SaveBanner onSave={onSave} />
      </div>

      {/* 2FA */}
      <div style={card}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--md-on-surface)' }}>Two-Factor Authentication</p>
            <p className="text-xs mt-1" style={{ color: 'var(--md-on-surface-var)' }}>
              Add an extra layer of security to your account.
            </p>
          </div>
          <button onClick={() => setMfa(p => !p)}>
            {mfa
              ? <ToggleRight className="w-8 h-8" style={{ color: 'var(--md-primary)' }} />
              : <ToggleLeft className="w-8 h-8" style={{ color: 'var(--md-on-surface-var)', opacity: 0.4 }} />}
          </button>
        </div>
        {mfa && (
          <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--md-primary-container)', border: '1px solid var(--md-outline)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--md-on-primary-cont)' }}>
              ✅ 2FA is enabled via Authenticator App
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--md-on-surface-var)' }}>
              Scan the QR code in your Authenticator app (Google Authenticator, Authy).
            </p>
          </div>
        )}
      </div>

      {/* Active sessions */}
      <div style={card}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--md-on-surface)' }}>Active Sessions</p>
        <div className="space-y-3">
          {SESSIONS.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline-var)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--md-on-surface)' }}>{s.device}</p>
                  {s.current && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                      style={{ background: 'var(--md-success-cont)', color: 'var(--md-success)' }}>Current</span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--md-on-surface-var)' }}>{s.location} · {s.time}</p>
              </div>
              {!s.current && (
                <button className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: 'var(--md-error-cont)', color: 'var(--md-error)' }}>
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
        <button className="mt-3 text-sm font-medium" style={{ color: 'var(--md-error)' }}>
          Sign out all other sessions
        </button>
      </div>
    </div>
  );
}

// ── Notifications Tab ─────────────────────────────────────────────
function NotificationsTab({ onSave }: { onSave: () => void }) {
  const [prefs, setPrefs] = useState({
    training_complete:  { email: true,  push: true,  slack: false },
    training_failed:    { email: true,  push: true,  slack: true  },
    deployment_live:    { email: true,  push: false, slack: false },
    billing_alert:      { email: true,  push: false, slack: false },
    team_invite:        { email: true,  push: true,  slack: false },
    api_limit:          { email: true,  push: true,  slack: true  },
    security_alert:     { email: true,  push: true,  slack: true  },
  });
  const [slackWebhook, setSlackWebhook] = useState('');
  const [digest, setDigest] = useState('realtime');

  const toggle = (event: string, ch: 'email' | 'push' | 'slack') => {
    setPrefs(p => ({ ...p, [event]: { ...p[event as keyof typeof p], [ch]: !p[event as keyof typeof p][ch] } }));
  };

  const EVENTS: { key: string; label: string; desc: string }[] = [
    { key: 'training_complete', label: 'Training Complete',    desc: 'When a model finishes training' },
    { key: 'training_failed',   label: 'Training Failed',      desc: 'When training errors occur' },
    { key: 'deployment_live',   label: 'Deployment Live',      desc: 'When an endpoint goes live' },
    { key: 'billing_alert',     label: 'Billing Alert',        desc: 'Usage limits and payment events' },
    { key: 'team_invite',       label: 'Team Invites',         desc: 'When someone joins your team' },
    { key: 'api_limit',         label: 'API Limit Warning',    desc: 'When approaching quota limits' },
    { key: 'security_alert',    label: 'Security Alerts',      desc: 'Logins from new devices' },
  ];

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button onClick={onClick} className="transition-all">
      {on
        ? <ToggleRight className="w-7 h-7" style={{ color: 'var(--md-primary)' }} />
        : <ToggleLeft className="w-7 h-7" style={{ color: 'var(--md-on-surface-var)', opacity: 0.35 }} />}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Event preferences table */}
      <div style={card}>
        <p className="text-sm font-semibold mb-5" style={{ color: 'var(--md-on-surface)' }}>Event Notifications</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--md-outline)' }}>
                <th className="text-left pb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-on-surface-var)' }}>Event</th>
                {['Email', 'Push', 'Slack'].map(ch => (
                  <th key={ch} className="text-center pb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--md-on-surface-var)' }}>{ch}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EVENTS.map((ev, i) => {
                const p = prefs[ev.key as keyof typeof prefs];
                return (
                  <tr key={ev.key} style={{ borderTop: i > 0 ? '1px solid var(--md-outline-var)' : 'none' }}>
                    <td className="py-3">
                      <p className="text-sm font-medium" style={{ color: 'var(--md-on-surface)' }}>{ev.label}</p>
                      <p className="text-xs" style={{ color: 'var(--md-on-surface-var)' }}>{ev.desc}</p>
                    </td>
                    <td className="py-3 text-center"><Toggle on={p.email} onClick={() => toggle(ev.key, 'email')} /></td>
                    <td className="py-3 text-center"><Toggle on={p.push}  onClick={() => toggle(ev.key, 'push')}  /></td>
                    <td className="py-3 text-center"><Toggle on={p.slack} onClick={() => toggle(ev.key, 'slack')} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slack integration */}
      <div style={card}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--md-on-surface)' }}>Slack Integration</p>
        <p className="text-xs mb-4" style={{ color: 'var(--md-on-surface-var)' }}>
          Paste your Slack Incoming Webhook URL to receive notifications in a channel.
        </p>
        <input style={inp} value={slackWebhook} onChange={e => setSlackWebhook(e.target.value)}
          placeholder="https://hooks.slack.com/services/T.../B.../..." />
        <SaveBanner onSave={onSave} />
      </div>

      {/* Email digest */}
      <div style={card}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--md-on-surface)' }}>Email Digest Frequency</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'realtime', label: 'Real-time', desc: 'Instant' },
            { id: 'daily',    label: 'Daily',     desc: '8:00 AM'  },
            { id: 'weekly',   label: 'Weekly',    desc: 'Monday'   },
            { id: 'never',    label: 'Never',     desc: 'Off'      },
          ].map(opt => (
            <button key={opt.id} onClick={() => setDigest(opt.id)}
              className="p-4 rounded-xl text-left transition-all"
              style={{
                background: digest === opt.id ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                border: `2px solid ${digest === opt.id ? 'var(--md-primary)' : 'var(--md-outline)'}`,
              }}>
              <p className="text-sm font-semibold" style={{ color: digest === opt.id ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface)' }}>
                {opt.label}
              </p>
              <p className="text-xs" style={{ color: 'var(--md-on-surface-var)' }}>{opt.desc}</p>
            </button>
          ))}
        </div>
        <SaveBanner onSave={onSave} />
      </div>
    </div>
  );
}

// ── API Keys Tab ──────────────────────────────────────────────────
function APIKeysTab() {
  const [keys, setKeys] = useState([
    { id: 'k1', name: 'Production Key',  key: 'nmx_live_sk_8f2e4a1b3c9d7e6f', created: '2026-05-01', lastUsed: 'Just now',    perms: 'Full access' },
    { id: 'k2', name: 'Dev Key',         key: 'nmx_test_sk_5a3b2c1d9e8f7g6h', created: '2026-04-12', lastUsed: '2 days ago',  perms: 'Read only'   },
  ]);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const copyKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const createKey = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await new Promise(r => setTimeout(r, 800));
    const random = Array.from({ length: 16 }, () => Math.random().toString(36)[2]).join('');
    setKeys(p => [...p, {
      id: `k${Date.now()}`, name: newName.trim(),
      key: `nmx_live_sk_${random}`,
      created: new Date().toISOString().slice(0, 10),
      lastUsed: 'Never', perms: 'Full access',
    }]);
    setNewName(''); setCreating(false); setShowCreate(false);
  };

  return (
    <div className="space-y-5">
      <div style={card}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--md-on-surface)' }}>API Keys</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--md-on-surface-var)' }}>Use these keys to authenticate API requests.</p>
          </div>
          <button onClick={() => setShowCreate(p => !p)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
            <Plus className="w-4 h-4" /> New Key
          </button>
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4">
              <div className="flex gap-3 p-4 rounded-xl" style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}>
                <input style={{ ...inp, flex: 1 }} value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="Key name (e.g. Production)" onKeyDown={e => e.key === 'Enter' && createKey()} />
                <button onClick={createKey} disabled={!newName.trim() || creating}
                  className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                  style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)', whiteSpace: 'nowrap' }}>
                  {creating ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--md-on-primary)', borderTopColor: 'transparent' }} /> : <Plus className="w-4 h-4" />}
                  Generate
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {keys.map(k => (
            <div key={k.id} className="p-4 rounded-xl" style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline-var)' }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--md-on-surface)' }}>{k.name}</p>
                  <p className="text-xs" style={{ color: 'var(--md-on-surface-var)' }}>
                    Created {k.created} · Last used {k.lastUsed} · {k.perms}
                  </p>
                </div>
                <button onClick={() => setKeys(p => p.filter(x => x.id !== k.id))}
                  className="p-1.5 rounded-lg shrink-0" style={{ color: 'var(--md-error)' }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-lg font-mono text-xs overflow-hidden"
                  style={{ background: 'var(--md-surface)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)' }}>
                  {showKey === k.id ? k.key : `${k.key.slice(0, 16)}${'•'.repeat(20)}`}
                </div>
                <button onClick={() => setShowKey(showKey === k.id ? null : k.id)}
                  className="p-2 rounded-lg" style={{ color: 'var(--md-on-surface-var)' }}>
                  {showKey === k.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => copyKey(k.id, k.key)}
                  className="p-2 rounded-lg" style={{ color: copied === k.id ? 'var(--md-success)' : 'var(--md-on-surface-var)' }}>
                  {copied === k.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage example */}
      <div style={card}>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--md-on-surface)' }}>Quick Start</p>
        <pre className="p-4 rounded-xl text-xs font-mono overflow-x-auto"
          style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)' }}>
{`curl -X POST https://api.nemix.ai/v1/inference \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "ep_001", "input": "Hello world"}'`}
        </pre>
      </div>
    </div>
  );
}

// ── Appearance Tab ────────────────────────────────────────────────
function AppearanceTab({ onSave }: { onSave: () => void }) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [density, setDensity] = useState('comfortable');
  const [accent, setAccent] = useState('#5b5bd6');

  const ACCENTS = ['#5b5bd6','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

  return (
    <div className="space-y-5">
      {/* Theme */}
      <div style={card}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--md-on-surface)' }}>Theme</p>
        <div className="grid grid-cols-3 gap-3">
          {(['light', 'dark', 'system'] as const).map(t => (
            <button key={t} onClick={() => setTheme(t)}
              className="p-4 rounded-xl text-left transition-all capitalize"
              style={{
                background: theme === t ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                border: `2px solid ${theme === t ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                color: theme === t ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface)',
              }}>
              <p className="text-2xl mb-2">{t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'}</p>
              <p className="text-sm font-semibold capitalize">{t}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div style={card}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--md-on-surface)' }}>Accent Color</p>
        <p className="text-xs mb-4" style={{ color: 'var(--md-on-surface-var)' }}>Choose your brand color across the dashboard.</p>
        <div className="flex gap-3 flex-wrap">
          {ACCENTS.map(c => (
            <button key={c} onClick={() => setAccent(c)}
              className="w-10 h-10 rounded-xl transition-all"
              style={{
                background: c,
                boxShadow: accent === c ? `0 0 0 3px var(--md-surface), 0 0 0 5px ${c}` : 'none',
              }} />
          ))}
        </div>
      </div>

      {/* Density */}
      <div style={card}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--md-on-surface)' }}>Display Density</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'compact',      label: 'Compact',      desc: 'More content' },
            { id: 'comfortable',  label: 'Comfortable',  desc: 'Balanced' },
            { id: 'spacious',     label: 'Spacious',     desc: 'More space' },
          ].map(d => (
            <button key={d.id} onClick={() => setDensity(d.id)}
              className="p-3 rounded-xl text-left"
              style={{
                background: density === d.id ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                border: `2px solid ${density === d.id ? 'var(--md-primary)' : 'var(--md-outline)'}`,
              }}>
              <p className="text-sm font-semibold" style={{ color: density === d.id ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface)' }}>{d.label}</p>
              <p className="text-xs" style={{ color: 'var(--md-on-surface-var)' }}>{d.desc}</p>
            </button>
          ))}
        </div>
        <SaveBanner onSave={onSave} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--md-on-surface)' }}>Settings</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--md-on-surface-var)' }}>Manage your account, security, notifications, and API access.</p>
        </div>

        {/* Success toast */}
        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'var(--md-success-cont)', border: '1px solid var(--md-outline)' }}>
              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--md-success)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--md-success)' }}>Settings saved successfully!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto" style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center"
                style={{
                  background: active ? 'var(--md-primary)' : 'transparent',
                  color: active ? 'var(--md-on-primary)' : 'var(--md-on-surface-var)',
                }}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {activeTab === 'profile'       && <ProfileTab onSave={handleSave} />}
            {activeTab === 'security'      && <SecurityTab onSave={handleSave} />}
            {activeTab === 'notifications' && <NotificationsTab onSave={handleSave} />}
            {activeTab === 'api'           && <APIKeysTab />}
            {activeTab === 'appearance'    && <AppearanceTab onSave={handleSave} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
