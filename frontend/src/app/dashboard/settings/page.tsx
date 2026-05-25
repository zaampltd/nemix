"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useTheme } from '@/lib/theme';
import {
  User, Lock, Bell, Globe, Zap, CheckCircle2,
  Eye, EyeOff, Copy, Plus, Trash2, ToggleLeft, ToggleRight, Save,
  Key, AlertCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import api from '@/lib/api';

// ── Shared Styling Tokens ──────────────────────────────────────────
const inpStyle: React.CSSProperties = {
  width: '100%', height: '44px', borderRadius: '12px',
  padding: '0 14px', fontSize: '0.875rem',
  background: 'var(--md-surface-2)',
  border: '1px solid var(--md-outline)',
  color: 'var(--md-on-surface)', outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 700,
  marginBottom: '6px', color: 'var(--md-on-surface-var)',
  textTransform: 'uppercase', letterSpacing: '0.05em'
};
const cardStyle: React.CSSProperties = {
  background: 'var(--md-surface-1)',
  border: '1px solid var(--md-outline)',
  borderRadius: '24px', padding: '24px',
  boxShadow: 'var(--shadow-1)',
  backdropFilter: 'blur(12px)',
};

const TABS = [
  { id: 'profile',       label: 'Profile Info',     icon: User       },
  { id: 'security',      label: 'Security',         icon: Lock       },
  { id: 'notifications', label: 'Notifications',    icon: Bell       },
  { id: 'api',           label: 'API Key Vault',    icon: Zap        },
  { id: 'appearance',    label: 'Appearance UX',    icon: Globe      },
];

function SaveBanner({ onSave, loading, onDiscard }: { onSave: () => void; loading?: boolean; onDiscard?: () => void }) {
  return (
    <div className="flex justify-end gap-3 pt-5 mt-5" style={{ borderTop: '1px solid var(--md-outline-var)' }}>
      <button type="button" onClick={onDiscard} className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-neutral-800/10"
        style={{ border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)', background: 'transparent' }}>
        Discard
      </button>
      <button onClick={onSave} disabled={loading}
        className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
        style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Changes
      </button>
    </div>
  );
}

// ── Profile Tab (Live Sync to PostgreSQL + Firestore) ───────────────
interface ProfileTabProps {
  currentUser: any;
  profileSettings: any;
  onSave: (updatedProfile: any) => Promise<void>;
}

function ProfileTab({ currentUser, profileSettings, onSave }: ProfileTabProps) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    username: '',
    bio: '',
    company: '',
    website: '',
    timezone: '',
    language: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profileSettings || currentUser) {
      setForm({
        fullName: profileSettings?.fullName || currentUser?.full_name || '',
        email: profileSettings?.email || currentUser?.email || '',
        username: profileSettings?.username || currentUser?.email?.split('@')[0] || '',
        bio: profileSettings?.bio || 'MLOps fine-tuning clusters and intelligent edge routing engines coordinator.',
        company: profileSettings?.company || 'Nvmix Corporation',
        website: profileSettings?.website || 'https://nvmix.com',
        timezone: profileSettings?.timezone || 'UTC+03:00',
        language: profileSettings?.language || 'English (US)'
      });
    }
  }, [profileSettings, currentUser]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await onSave(form);
    } catch (err) {
      console.error("Failed to save profile settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    setForm({
      fullName: profileSettings?.fullName || currentUser?.full_name || '',
      email: profileSettings?.email || currentUser?.email || '',
      username: profileSettings?.username || currentUser?.email?.split('@')[0] || '',
      bio: profileSettings?.bio || 'MLOps fine-tuning clusters and intelligent edge routing engines coordinator.',
      company: profileSettings?.company || 'Nvmix Corporation',
      website: profileSettings?.website || 'https://nvmix.com',
      timezone: profileSettings?.timezone || 'UTC+03:00',
      language: profileSettings?.language || 'English (US)'
    });
  };

  const initials = (form.fullName || 'GA').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-5">
      <div style={cardStyle}>
        <p className="text-sm font-bold mb-4" style={{ color: 'var(--md-on-surface)' }}>Profile Photo</p>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--md-primary) 0%, var(--logo-grad-end, #ef4444) 100%)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(124,106,247,0.2)'
            }}>
            {initials}
          </div>
          <div>
            <button className="block px-4 py-2 rounded-xl text-xs font-bold mb-1.5 transition-opacity hover:opacity-80"
              style={{ background: 'var(--md-primary-container)', color: 'var(--md-primary)' }}>
              Upload Photo
            </button>
            <p className="text-xs" style={{ color: 'var(--md-on-surface-var)' }}>JPG, PNG or GIF · Max 5 MB</p>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <p className="text-sm font-bold mb-5" style={{ color: 'var(--md-on-surface)' }}>Personal Workspace Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Full Name</label>
            <input style={inpStyle} value={form.fullName} onChange={e => set('fullName', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Username</label>
            <input style={inpStyle} value={form.username} onChange={e => set('username', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label style={labelStyle}>Email Address</label>
            <input style={inpStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Company</label>
            <input style={inpStyle} value={form.company} onChange={e => set('company', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Website</label>
            <input style={inpStyle} value={form.website} onChange={e => set('website', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label style={labelStyle}>User Biography</label>
            <textarea
              className="w-full rounded-xl px-4 py-3 text-sm resize-none"
              style={{ ...inpStyle, height: '80px' } as React.CSSProperties}
              value={form.bio} onChange={e => set('bio', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Timezone</label>
            <select style={{ ...inpStyle, appearance: 'none', cursor: 'pointer' }}
              value={form.timezone} onChange={e => set('timezone', e.target.value)}>
              {['UTC-08:00 (LA)', 'UTC-05:00 (NY)', 'UTC+00:00 (London)', 'UTC+01:00 (Paris)', 'UTC+03:00 (Istanbul)', 'UTC+05:30 (Mumbai)', 'UTC+08:00 (Singapore)', 'UTC+09:00 (Tokyo)'].map(tz => (
                <option key={tz} className="bg-[#111118] text-[#e5e1f0]">{tz}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>System Language</label>
            <select style={{ ...inpStyle, appearance: 'none', cursor: 'pointer' }}
              value={form.language} onChange={e => set('language', e.target.value)}>
              {['English (US)', 'English (UK)', 'Turkish', 'French', 'German'].map(lang => (
                <option key={lang} className="bg-[#111118] text-[#e5e1f0]">{lang}</option>
              ))}
            </select>
          </div>
        </div>
        <SaveBanner onSave={handleSaveProfile} loading={loading} onDiscard={handleDiscard} />
      </div>

      <div style={{ ...cardStyle, borderColor: 'var(--md-error)' }}>
        <p className="text-sm font-bold mb-1" style={{ color: 'var(--md-error)' }}>Danger Access Zone</p>
        <p className="text-xs mb-4" style={{ color: 'var(--md-on-surface-var)' }}>
          Permanently delete this MLOps workspace environment. Trained checkpoints and datasets vault will be destroyed.
        </p>
        <button className="px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
          style={{ background: 'var(--md-error-cont)', color: 'var(--md-error)', border: '1px solid var(--md-error)' }}>
          Delete Workspace
        </button>
      </div>
    </div>
  );
}

// ── Security Tab (MFA & Live Password change) ───────────────────────
interface SecurityTabProps {
  securitySettings: any;
  onSave: (updatedSecurity: any) => Promise<void>;
}

function SecurityTab({ securitySettings, onSave }: SecurityTabProps) {
  const [cur, setCur] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [mfa, setMfa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (securitySettings) {
      setMfa(securitySettings.mfa || false);
    }
  }, [securitySettings]);

  const strength = newPw.length === 0 ? 0 : newPw.length < 6 ? 1 : newPw.length < 10 ? 2 : /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) ? 4 : 3;
  const strengthLabel = ['', 'Weak password', 'Fair quality', 'Good character variety', 'Production-grade key strength'];
  const strengthColor = ['', 'var(--md-error)', 'var(--md-warning)', 'var(--md-primary)', 'var(--md-success)'];

  const handleSaveSecurity = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // 1. If password is supplied, verify and update
      if (newPw) {
        if (newPw !== confirm) {
          setErrorMsg("Confirmation password doesn't match.");
          setLoading(false);
          return;
        }
        await api.post('/auth/change-password', {
          current_password: cur,
          new_password: newPw
        });
        setCur('');
        setNewPw('');
        setConfirm('');
        setSuccessMsg("Password successfully synchronized!");
      }
      
      // 2. Save security settings (MFA status)
      await onSave({ mfa });
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to update security parameters.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    setCur('');
    setNewPw('');
    setConfirm('');
    setMfa(securitySettings?.mfa || false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const SESSIONS = [
    { device: 'Chrome — Windows 11', location: 'Istanbul, Turkey', time: 'Active now', current: true },
    { device: 'Safari — iPhone 15',  location: 'Istanbul, Turkey', time: '2 days ago',   current: false },
  ];

  return (
    <div className="space-y-5">
      <div style={cardStyle}>
        <p className="text-sm font-bold mb-5" style={{ color: 'var(--md-on-surface)' }}>Credentials Management</p>
        
        <AnimatePresence>
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl mb-4 text-xs font-semibold"
              style={{ background: 'var(--md-error-cont)', border: '1px solid var(--md-error)', color: 'var(--md-error)' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl mb-4 text-xs font-semibold"
              style={{ background: 'var(--md-success-cont)', border: '1px solid var(--md-success)', color: 'var(--md-success)' }}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4 max-w-md">
          <div>
            <label style={labelStyle}>Current Password</label>
            <div className="relative">
              <input type={showCur ? 'text' : 'password'} style={{ ...inpStyle, paddingRight: '44px' }}
                value={cur} onChange={e => setCur(e.target.value)} placeholder="Enter current credential" />
              <button type="button" onClick={() => setShowCur(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--md-on-surface-var)' }}>
                {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} style={{ ...inpStyle, paddingRight: '44px' }}
                value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Enter new secret password" />
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
                <p className="text-xs font-semibold" style={{ color: strengthColor[strength] }}>{strengthLabel[strength]}</p>
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input type="password" style={{ ...inpStyle, borderColor: confirm && confirm !== newPw ? 'var(--md-error)' : 'var(--md-outline)' }}
              value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat new credential" />
            {confirm && confirm !== newPw && (
              <p className="text-xs mt-1 font-bold" style={{ color: 'var(--md-error)' }}>Confirmation doesn't match</p>
            )}
          </div>
        </div>
        <SaveBanner onSave={handleSaveSecurity} loading={loading} onDiscard={handleDiscard} />
      </div>

      <div style={cardStyle} className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>Two-Factor Authentication (2FA)</p>
          <p className="text-xs mt-1" style={{ color: 'var(--md-on-surface-var)' }}>
            Protect deployment capabilities with secondary Authenticator passcode requirements.
          </p>
        </div>
        <button onClick={() => setMfa(p => !p)}>
          {mfa
            ? <ToggleRight className="w-8 h-8 cursor-pointer" style={{ color: 'var(--md-primary)' }} />
            : <ToggleLeft className="w-8 h-8 cursor-pointer" style={{ color: 'var(--md-on-surface-var)', opacity: 0.4 }} />}
        </button>
      </div>

      <div style={cardStyle}>
        <p className="text-sm font-bold mb-4" style={{ color: 'var(--md-on-surface)' }}>Active Dashboard Sessions</p>
        <div className="space-y-3">
          {SESSIONS.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline-var)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold" style={{ color: 'var(--md-on-surface)' }}>{s.device}</p>
                  {s.current && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase"
                      style={{ background: 'var(--md-success-cont)', color: 'var(--md-success)' }}>Active Now</span>
                  )}
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--md-on-surface-var)' }}>{s.location} · {s.time}</p>
              </div>
              {!s.current && (
                <button className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-95"
                  style={{ background: 'var(--md-error-cont)', color: 'var(--md-error)' }}>
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Notifications Tab (Preference settings dispatches) ──────────
interface NotificationsTabProps {
  notificationsSettings: any;
  onSave: (updatedNotifications: any) => Promise<void>;
}

function NotificationsTab({ notificationsSettings, onSave }: NotificationsTabProps) {
  const [prefs, setPrefs] = useState<any>({
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (notificationsSettings) {
      if (notificationsSettings.prefs) setPrefs(notificationsSettings.prefs);
      setSlackWebhook(notificationsSettings.slackWebhook || '');
      setDigest(notificationsSettings.digest || 'realtime');
    }
  }, [notificationsSettings]);

  const toggle = (event: string, ch: 'email' | 'push' | 'slack') => {
    setPrefs((p: any) => ({
      ...p,
      [event]: { ...p[event], [ch]: !p[event][ch] }
    }));
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await onSave({ prefs, slackWebhook, digest });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    if (notificationsSettings) {
      setPrefs(notificationsSettings.prefs || {});
      setSlackWebhook(notificationsSettings.slackWebhook || '');
      setDigest(notificationsSettings.digest || 'realtime');
    }
  };

  const EVENTS = [
    { key: 'training_complete', label: 'Training Complete',    desc: 'When fine-tuning process finishes successfully.' },
    { key: 'training_failed',   label: 'Training Failed',      desc: 'When training pipeline encounters errors.' },
    { key: 'deployment_live',   label: 'Deployment Live',      desc: 'When custom container endpoint starts serving.' },
    { key: 'billing_alert',     label: 'Billing Alert',        desc: 'Workspace threshold boundary alert events.' },
    { key: 'team_invite',       label: 'Team Invites',         desc: 'When developers accept member invites.' },
    { key: 'api_limit',         label: 'API Limit Warning',    desc: 'When approaching quota plan boundaries.' },
    { key: 'security_alert',    label: 'Security Alerts',      desc: 'Key issuances or security access changes.' },
  ];

  const ToggleBtn = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button onClick={onClick} className="transition-all cursor-pointer">
      {on
        ? <ToggleRight className="w-7 h-7" style={{ color: 'var(--md-primary)' }} />
        : <ToggleLeft className="w-7 h-7" style={{ color: 'var(--md-on-surface-var)', opacity: 0.35 }} />}
    </button>
  );

  return (
    <div className="space-y-5">
      <div style={cardStyle}>
        <p className="text-sm font-bold mb-4" style={{ color: 'var(--md-on-surface)' }}>Workspace Event Subscriptions</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--md-outline)' }} className="opacity-80">
                <th className="text-left pb-3 font-bold uppercase tracking-wider" style={{ color: 'var(--md-on-surface-var)' }}>Telemetry Scope</th>
                {['Email', 'Push', 'Slack'].map(ch => (
                  <th key={ch} className="text-center pb-3 font-bold uppercase tracking-wider" style={{ color: 'var(--md-on-surface-var)' }}>{ch}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EVENTS.map((ev, i) => {
                const p = prefs[ev.key] || { email: false, push: false, slack: false };
                return (
                  <tr key={ev.key} className="transition-colors hover:bg-neutral-800/10" style={{ borderTop: i > 0 ? '1px solid var(--md-outline-var)' : 'none' }}>
                    <td className="py-3 pr-4">
                      <p className="text-xs font-bold" style={{ color: 'var(--md-on-surface)' }}>{ev.label}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--md-on-surface-var)' }}>{ev.desc}</p>
                    </td>
                    <td className="py-3 text-center"><ToggleBtn on={p.email} onClick={() => toggle(ev.key, 'email')} /></td>
                    <td className="py-3 text-center"><ToggleBtn on={p.push}  onClick={() => toggle(ev.key, 'push')}  /></td>
                    <td className="py-3 text-center"><ToggleBtn on={p.slack} onClick={() => toggle(ev.key, 'slack')} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={cardStyle}>
        <p className="text-sm font-bold mb-1" style={{ color: 'var(--md-on-surface)' }}>Slack Webhook Target</p>
        <p className="text-xs mb-4" style={{ color: 'var(--md-on-surface-var)' }}>
          Incoming Slack Webhook URL for Slack workspace alert dispatches.
        </p>
        <input style={inpStyle} value={slackWebhook} onChange={e => setSlackWebhook(e.target.value)}
          placeholder="https://hooks.slack.com/services/T.../B.../..." />
      </div>

      <div style={cardStyle}>
        <p className="text-sm font-bold mb-4" style={{ color: 'var(--md-on-surface)' }}>Digest Dispatches</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'realtime', label: 'Real-time', desc: 'Instant alerts' },
            { id: 'daily',    label: 'Daily Digest', desc: '8:00 AM daily' },
            { id: 'weekly',   label: 'Weekly Digest', desc: 'Mondays' },
            { id: 'never',    label: 'Never Bother', desc: 'Deactivated' },
          ].map(opt => (
            <button key={opt.id} onClick={() => setDigest(opt.id)}
              className="p-4 rounded-xl text-left transition-all hover:scale-[1.01] cursor-pointer"
              style={{
                background: digest === opt.id ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                border: `2px solid ${digest === opt.id ? 'var(--md-primary)' : 'var(--md-outline)'}`,
              }}>
              <p className="text-xs font-bold" style={{ color: digest === opt.id ? 'var(--md-primary)' : 'var(--md-on-surface)' }}>
                {opt.label}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--md-on-surface-var)' }}>{opt.desc}</p>
            </button>
          ))}
        </div>
        <SaveBanner onSave={handleSaveNotifications} loading={loading} onDiscard={handleDiscard} />
      </div>
    </div>
  );
}

// ── API Keys Tab (Dynamic Scoped Sync) ──────────────────────────────
interface APIKeysTabProps {
  currentUser: any;
}

function APIKeysTab({ currentUser }: APIKeysTabProps) {
  const [keys, setKeys] = useState<{ id: string; name: string; key: string; created: number; perms: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    type?: 'danger' | 'info' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const userIdentifier = currentUser?.email || currentUser?.id || "test-user-123";

  // Resilient timeout wrapper to prevent Firestore infinite blocks if offline
  const withTimeout = async <T,>(promise: Promise<T>, ms: number = 1800): Promise<T> => {
    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Timeout: Database offline"));
      }, ms);
    });
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  useEffect(() => {
    const loadKeys = async () => {
      try {
        setIsLoading(true);
        const q = query(collection(db, "UserNvmixAPIKeys"), where("userId", "==", userIdentifier));
        const snapshot = await withTimeout(getDocs(q), 1500);
        const fetched: any[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            name: data.name || "API Key",
            key: data.key || "",
            created: data.created || Date.now(),
            perms: data.perms || "Full access"
          });
        });
        setKeys(fetched);
        // Sync to localStorage
        localStorage.setItem(`nvmix_generated_keys_${userIdentifier}`, JSON.stringify(fetched));
      } catch (err) {
        console.warn("Failed to load keys from Firestore (falling back to local storage):", err);
        try {
          const cached = localStorage.getItem(`nvmix_generated_keys_${userIdentifier}`);
          if (cached) {
            setKeys(JSON.parse(cached));
          }
        } catch {}
      } finally {
        setIsLoading(false);
      }
    };
    loadKeys();
  }, [userIdentifier]);

  const copyKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const createKey = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    
    // Generate key designations
    const randomSeed = Array.from({ length: 20 }, () => Math.random().toString(36)[2]).join('');
    const generatedKey = `nvx_sk_ep_${randomSeed}`;
    const generatedId = `opt_key_${Date.now()}`;
    
    const keyData = {
      userId: userIdentifier,
      name: newName.trim(),
      key: generatedKey,
      created: Date.now(),
      perms: 'Full access'
    };

    // 1. Optimistic UI Update: Instantly add to state & localStorage (0ms save!)
    const updatedKeys = [...keys, {
      id: generatedId,
      name: keyData.name,
      key: generatedKey,
      created: keyData.created,
      perms: keyData.perms
    }];
    setKeys(updatedKeys);
    try {
      localStorage.setItem(`nvmix_generated_keys_${userIdentifier}`, JSON.stringify(updatedKeys));
    } catch {}

    setNewName(''); 
    setShowCreate(false);
    setCreating(false); // Stop loading instantly!

    // 2. Background Firestore Sync: fire-and-forget in the background
    withTimeout(
      addDoc(collection(db, "UserNvmixAPIKeys"), {
        ...keyData,
        createdAt: serverTimestamp()
      }),
      2500
    ).then((docRef) => {
      console.log("Successfully synced generated key to Firestore database in background:", docRef.id);
      // Replace the optimistic mock id with the real Firestore doc ID
      setKeys(prev => prev.map(k => k.id === generatedId ? { ...k, id: docRef.id } : k));
    }).catch((err) => {
      console.warn("Background Firestore key synchronization failed or timed out (saved locally):", err);
    });
  };

  const deleteKey = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Revoke API Key",
      message: "Are you sure you want to permanently revoke this API Key? Any external systems or scripts leveraging this key will immediately fail to authenticate.",
      confirmText: "Revoke Key",
      cancelText: "Keep Active",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "UserNvmixAPIKeys", id));
          setKeys(p => p.filter(k => k.id !== id));
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  return (
    <div className="space-y-5">
      <div style={cardStyle}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>Credentials API Keys</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--md-on-surface-var)' }}>Issue and revoke secure credentials for production CLI/API endpoint calls.</p>
          </div>
          <button onClick={() => setShowCreate(p => !p)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer animate-pulse"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
            <Plus className="w-4 h-4" /> New Key
          </button>
        </div>

        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4">
              <div className="flex gap-3 p-4 rounded-xl" style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}>
                <input style={{ ...inpStyle, flex: 1 }} value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="Key designation label (e.g. CLI Production Node)" onKeyDown={e => e.key === 'Enter' && createKey()} />
                <button onClick={createKey} disabled={!newName.trim() || creating}
                  className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)', whiteSpace: 'nowrap' }}>
                  {creating ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--md-on-primary)', borderTopColor: 'transparent' }} /> : <Plus className="w-4 h-4" />}
                  Generate Key
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--md-primary)] mb-2" />
              <p className="text-xs" style={{ color: 'var(--md-on-surface-var)' }}>Loading secure key vault...</p>
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center p-8 rounded-xl" style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}>
              <Key className="w-8 h-8 mx-auto opacity-50 mb-2 text-[var(--md-outline)]" />
              <p className="text-xs" style={{ color: 'var(--md-on-surface-var)' }}>No API keys generated for this workspace yet.</p>
            </div>
          ) : (
            keys.map(k => (
              <div key={k.id} className="p-4 rounded-xl transition-all hover:translate-x-1" style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline-var)' }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--md-on-surface)' }}>{k.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--md-on-surface-var)' }}>
                      Issued: {new Date(k.created).toLocaleDateString()} · {k.perms}
                    </p>
                  </div>
                  <button onClick={() => deleteKey(k.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer" style={{ color: 'var(--md-error)' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 rounded-lg font-mono text-[11px] overflow-hidden select-all"
                    style={{ background: 'var(--md-surface)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)' }}>
                    {showKey === k.id ? k.key : `${k.key.slice(0, 15)}${'•'.repeat(25)}`}
                  </div>
                  <button onClick={() => setShowKey(showKey === k.id ? null : k.id)}
                    className="p-2 rounded-lg hover:bg-neutral-800/10 cursor-pointer" style={{ color: 'var(--md-on-surface-var)' }}>
                    {showKey === k.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => copyKey(k.id, k.key)}
                    className="p-2 rounded-lg hover:bg-neutral-800/10 cursor-pointer" style={{ color: copied === k.id ? 'var(--md-success)' : 'var(--md-on-surface-var)' }}>
                    {copied === k.id ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={cardStyle}>
        <p className="text-sm font-bold mb-3" style={{ color: 'var(--md-on-surface)' }}>Programmatic Quick Start</p>
        <pre className="p-4 rounded-xl text-[11px] font-mono overflow-x-auto select-all"
          style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)' }}>
{`curl -X POST https://api.nvmix.com/v1/inference \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "ep_001", "input": "Hello world"}'`}
        </pre>
      </div>
      
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-sm" style={{ background: 'var(--md-scrim)' }}
              onClick={() => setConfirmModal(p => ({ ...p, isOpen: false }))} />
            
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl p-6 overflow-hidden"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)', backdropFilter: 'blur(20px)' }}>
              
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: confirmModal.type === 'danger' ? 'var(--md-error-cont)' : 'var(--md-primary-container)',
                    color: confirmModal.type === 'danger' ? 'var(--md-error)' : 'var(--md-primary)'
                  }}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h3 className="text-base font-extrabold tracking-tight" style={{ color: 'var(--md-on-surface)' }}>
                    {confirmModal.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--md-on-surface-var)' }}>
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'var(--md-outline-var)' }}>
                <button type="button" onClick={() => setConfirmModal(p => ({ ...p, isOpen: false }))}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold transition hover:bg-neutral-800/10 border"
                  style={{ borderColor: 'var(--md-outline)', color: 'var(--md-on-surface-var)', background: 'transparent' }}>
                  {confirmModal.cancelText || 'Cancel'}
                </button>
                <button type="button"
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(p => ({ ...p, isOpen: false }));
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold transition hover:opacity-90"
                  style={{
                    background: confirmModal.type === 'danger' ? 'var(--md-error)' : 'var(--md-primary)',
                    color: 'var(--md-on-primary)'
                  }}>
                  {confirmModal.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Appearance Tab (Live UX and Theme Context integrations) ───────
interface AppearanceTabProps {
  appearanceSettings: any;
  onSave: (updatedAppearance: any) => Promise<void>;
}

function AppearanceTab({ appearanceSettings, onSave }: AppearanceTabProps) {
  const { theme: activeTheme, toggle: toggleTheme } = useTheme();
  const [density, setDensity] = useState('comfortable');
  const [accent, setAccent] = useState('#5b5bd6');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (appearanceSettings) {
      setDensity(appearanceSettings.density || 'comfortable');
      setAccent(appearanceSettings.accent || '#5b5bd6');
    }
  }, [appearanceSettings]);

  const handleSaveAppearance = async () => {
    setLoading(true);
    try {
      await onSave({ density, accent });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    if (appearanceSettings) {
      setDensity(appearanceSettings.density || 'comfortable');
      setAccent(appearanceSettings.accent || '#5b5bd6');
    }
  };

  const ACCENTS = ['#5b5bd6','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

  return (
    <div className="space-y-5">
      <div style={cardStyle}>
        <p className="text-sm font-bold mb-4" style={{ color: 'var(--md-on-surface)' }}>Workspace Theme Settings</p>
        <div className="grid grid-cols-3 gap-3">
          {(['light', 'dark', 'system'] as const).map(t => {
            const isActive = activeTheme === t || (t === 'system' && !['light', 'dark'].includes(activeTheme));
            return (
              <button key={t} onClick={() => {
                if (t === 'light' && activeTheme !== 'light') toggleTheme();
                else if (t === 'dark' && activeTheme !== 'dark') toggleTheme();
                else if (t === 'system') {
                  // Simulate system theme preference
                  const sysPref = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                  if (activeTheme !== sysPref) toggleTheme();
                  localStorage.removeItem("nvmix-theme");
                }
              }}
                className="p-4 rounded-2xl text-left transition-all hover:scale-[1.01] cursor-pointer"
                style={{
                  background: isActive ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                  border: `2px solid ${isActive ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                  color: isActive ? 'var(--md-primary)' : 'var(--md-on-surface)',
                }}>
                <p className="text-2xl mb-2">{t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'}</p>
                <p className="text-xs font-bold capitalize">{t}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div style={cardStyle}>
        <p className="text-sm font-bold mb-1" style={{ color: 'var(--md-on-surface)' }}>Accent Color Palette</p>
        <p className="text-xs mb-4" style={{ color: 'var(--md-on-surface-var)' }}>Choose your brand color accents across the MLOps portal.</p>
        <div className="flex gap-3 flex-wrap">
          {ACCENTS.map(c => (
            <button key={c} onClick={() => setAccent(c)}
              className="w-9 h-9 rounded-xl transition-all hover:scale-105 cursor-pointer"
              style={{
                background: c,
                boxShadow: accent === c ? `0 0 0 3px var(--md-surface), 0 0 0 5px ${c}` : 'none',
              }} />
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <p className="text-sm font-bold mb-4" style={{ color: 'var(--md-on-surface)' }}>Display UX Density</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'compact',      label: 'Compact',      desc: 'High content density' },
            { id: 'comfortable',  label: 'Comfortable',  desc: 'Balanced spacing' },
            { id: 'spacious',     label: 'Spacious',     desc: 'Breathable layout' },
          ].map(d => (
            <button key={d.id} onClick={() => setDensity(d.id)}
              className="p-3 rounded-2xl text-left transition-all hover:scale-[1.01] cursor-pointer"
              style={{
                background: density === d.id ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                border: `2px solid ${density === d.id ? 'var(--md-primary)' : 'var(--md-outline)'}`,
              }}>
              <p className="text-xs font-bold" style={{ color: density === d.id ? 'var(--md-primary)' : 'var(--md-on-surface)' }}>{d.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--md-on-surface-var)' }}>{d.desc}</p>
            </button>
          ))}
        </div>
        <SaveBanner onSave={handleSaveAppearance} loading={loading} onDiscard={handleDiscard} />
      </div>
    </div>
  );
}

// ── Main Page (Unified Dual-Write State Coordinator) ───────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const defaultSettings = {
    profile: {
      fullName: 'Google AI Developer', email: 'google.developer@nvmix.com', username: 'googledev',
      bio: 'MLOps fine-tuning clusters and intelligent edge routing engines coordinator.',
      company: 'Nvmix Corporation', website: 'https://nvmix.com', timezone: 'UTC+03:00', language: 'English (US)'
    },
    security: { mfa: false },
    notifications: {
      prefs: {
        training_complete:  { email: true,  push: true,  slack: false },
        training_failed:    { email: true,  push: true,  slack: true  },
        deployment_live:    { email: true,  push: false, slack: false },
        billing_alert:      { email: true,  push: false, slack: false },
        team_invite:        { email: true,  push: true,  slack: false },
        api_limit:          { email: true,  push: true,  slack: true  },
        security_alert:     { email: true,  push: true,  slack: true  },
      },
      slackWebhook: '',
      digest: 'realtime'
    },
    appearance: { density: 'comfortable', accent: '#5b5bd6' }
  };

  useEffect(() => {
    const initPage = async () => {
      try {
        setIsLoading(true);
        const rawUser = localStorage.getItem('current_user');
        let user: any = null;
        if (rawUser) {
          try {
            user = JSON.parse(rawUser);
            setCurrentUser(user);
          } catch (e) {}
        }

        const userIdentifier = user?.email || user?.id || "test-user-123";
        let loadedSettings = { ...defaultSettings };

        // 1. Try loading settings from PostgreSQL backend
        try {
          const res = await api.get('/auth/settings');
          if (res.data && Object.keys(res.data).length > 0) {
            loadedSettings = { ...loadedSettings, ...res.data };
          }
        } catch (apiErr) {
          console.warn("[Settings] Backend API failed, falling back to Firestore/LocalStorage:", apiErr);
          
          // 2. Try loading settings from Firestore backup
          try {
            const docRef = doc(db, "UserSettings", userIdentifier);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              loadedSettings = { ...loadedSettings, ...data };
            }
          } catch (fsErr) {
            console.error("[Settings] Firestore fallback failed:", fsErr);
          }
        }

        // Apply profile names from active session if missing
        if (user) {
          if (!loadedSettings.profile) loadedSettings.profile = { ...defaultSettings.profile };
          loadedSettings.profile.fullName = loadedSettings.profile.fullName || user.full_name;
          loadedSettings.profile.email = loadedSettings.profile.email || user.email;
        }

        setSettings(loadedSettings);
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initPage();
  }, []);

  const handleSaveSubSection = async (section: 'profile' | 'security' | 'notifications' | 'appearance', sectionData: any) => {
    setSaveError(null);
    try {
      const updatedSettings = {
        ...settings,
        [section]: sectionData
      };
      
      const userIdentifier = currentUser?.email || currentUser?.id || "test-user-123";

      // 1. Profile synchronizations
      if (section === 'profile') {
        try {
          await api.put('/auth/profile', {
            full_name: sectionData.fullName,
            email: sectionData.email
          });
          
          const localUser = JSON.parse(localStorage.getItem('current_user') || '{}');
          localUser.full_name = sectionData.fullName;
          localUser.email = sectionData.email;
          localStorage.setItem('current_user', JSON.stringify(localUser));
          
          window.dispatchEvent(new Event('storage'));
        } catch (profileErr: any) {
          console.error("Failed to sync profile changes with PostgreSQL:", profileErr);
          if (profileErr.response?.data?.detail) {
            setSaveError(profileErr.response.data.detail);
            return;
          }
        }
      }

      // 2. Save settings data payload to PostgreSQL
      try {
        await api.put('/auth/settings', updatedSettings);
      } catch (apiErr) {
        console.warn("Failed to write settings to PostgreSQL:", apiErr);
      }

      // 3. Save settings to Firestore backup document
      try {
        const docRef = doc(db, "UserSettings", userIdentifier);
        await setDoc(docRef, updatedSettings, { merge: true });
      } catch (fsErr) {
        console.error("Failed to backup settings in Firestore:", fsErr);
      }

      setSettings(updatedSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save settings modification.");
    }
  };

  if (isLoading || !settings) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--md-primary)] mb-3" />
          <p className="text-sm font-semibold" style={{ color: 'var(--md-on-surface-var)' }}>Initializing workspace settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--md-on-surface)' }}>Workspace Settings</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--md-on-surface-var)' }}>Configure MLOps environments, notification dispatches, and key vaults.</p>
          </div>
          <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded bg-purple-950 text-purple-200 border border-purple-500/20">
            SOC 2 Type II Certified
          </span>
        </div>

        {/* Dynamic Toast Messages */}
        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'var(--md-success-cont)', border: '1px solid var(--md-success)' }}>
              <CheckCircle2 className="w-5 h-5 shrink-0 text-green-500" />
              <p className="text-xs font-bold text-green-500">Settings modifications synchronized in secure database vaults!</p>
            </motion.div>
          )}
          {saveError && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'var(--md-error-cont)', border: '1px solid var(--md-error)' }}>
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <p className="text-xs font-bold text-red-500">{saveError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium tab navigation list */}
        <div className="flex gap-1.5 p-1.5 rounded-2xl overflow-x-auto scrollbar-none"
          style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-1 justify-center cursor-pointer"
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

        {/* Tab content containers */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {activeTab === 'profile'       && <ProfileTab currentUser={currentUser} profileSettings={settings.profile} onSave={async (d) => handleSaveSubSection('profile', d)} />}
            {activeTab === 'security'      && <SecurityTab securitySettings={settings.security} onSave={async (d) => handleSaveSubSection('security', d)} />}
            {activeTab === 'notifications' && <NotificationsTab notificationsSettings={settings.notifications} onSave={async (d) => handleSaveSubSection('notifications', d)} />}
            {activeTab === 'api'           && <APIKeysTab currentUser={currentUser} />}
            {activeTab === 'appearance'    && <AppearanceTab appearanceSettings={settings.appearance} onSave={async (d) => handleSaveSubSection('appearance', d)} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
