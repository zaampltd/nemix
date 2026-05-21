"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Mail, Crown, Code2, Eye, UserPlus, X, Send,
  CheckCircle2, Clock, MoreHorizontal, Activity, Shield,
  Trash2, RefreshCw, ChevronDown,
} from 'lucide-react';

type Role = 'Admin' | 'Developer' | 'Viewer';

interface Member {
  id: string; name: string; email: string; role: Role;
  status: 'active' | 'offline' | 'invited'; lastSeen?: string; initials: string; color: string;
}

const INITIAL_MEMBERS: Member[] = [
  { id: 'm1', name: 'Sarah Chen',   email: 'sarah@company.com',   role: 'Admin',     status: 'active',  initials: 'SC', color: '#5b5bd6' },
  { id: 'm2', name: 'James Wilson', email: 'james@company.com',   role: 'Developer', status: 'active',  initials: 'JW', color: '#3dd68c' },
  { id: 'm3', name: 'Amira Patel',  email: 'amira@company.com',   role: 'Developer', status: 'offline', lastSeen: '2h ago', initials: 'AP', color: '#f5a623' },
  { id: 'm4', name: 'Tom Bradley',  email: 'tom@company.com',     role: 'Viewer',    status: 'active',  initials: 'TB', color: '#e5534b' },
  { id: 'm5', name: 'mike@startup.com', email: 'mike@startup.com', role: 'Developer', status: 'invited', initials: 'MI', color: '#8b8b99' },
];

const ACTIVITY = [
  { user: 'Sarah Chen',   action: 'deployed llama3-sentiment-v2',        time: '5 min ago', icon: CheckCircle2, color: 'var(--md-success)' },
  { user: 'James Wilson', action: 'started training gpt2-code-assistant', time: '1 hr ago',  icon: Activity,     color: 'var(--md-primary)' },
  { user: 'Amira Patel',  action: 'uploaded customer-reviews.csv',        time: '3 hr ago',  icon: CheckCircle2, color: 'var(--md-success)' },
  { user: 'Tom Bradley',  action: 'viewed Analytics dashboard',           time: '5 hr ago',  icon: Eye,          color: 'var(--md-on-surface-var)' },
  { user: 'Sarah Chen',   action: 'created API key prod-key-v2',          time: 'Yesterday', icon: Shield,       color: 'var(--md-primary)' },
  { user: 'James Wilson', action: 'deleted bert-ner-v1 model',            time: 'Yesterday', icon: Trash2,       color: 'var(--md-error)' },
];

const PERMISSIONS: { action: string; admin: boolean; dev: boolean; viewer: boolean }[] = [
  { action: 'View dashboard',       admin: true,  dev: true,  viewer: true  },
  { action: 'Create datasets',      admin: true,  dev: true,  viewer: false },
  { action: 'Train models',         admin: true,  dev: true,  viewer: false },
  { action: 'Deploy endpoints',     admin: true,  dev: true,  viewer: false },
  { action: 'Delete resources',     admin: true,  dev: false, viewer: false },
  { action: 'Manage API keys',      admin: true,  dev: false, viewer: false },
  { action: 'Billing & payments',   admin: true,  dev: false, viewer: false },
  { action: 'Invite team members',  admin: true,  dev: false, viewer: false },
];

function roleIcon(role: Role) {
  if (role === 'Admin') return Crown;
  if (role === 'Developer') return Code2;
  return Eye;
}
function roleColor(role: Role) {
  if (role === 'Admin') return 'var(--md-warning)';
  if (role === 'Developer') return 'var(--md-primary)';
  return 'var(--md-on-surface-var)';
}
function roleContColor(role: Role) {
  if (role === 'Admin') return 'var(--md-warning-cont)';
  if (role === 'Developer') return 'var(--md-primary-container)';
  return 'var(--md-surface-2)';
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('Developer');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [openRoleMenu, setOpenRoleMenu] = useState<string | null>(null);

  const activeCount  = members.filter(m => m.status === 'active').length;
  const adminCount   = members.filter(m => m.role === 'Admin').length;
  const invitedCount = members.filter(m => m.status === 'invited').length;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    const initials = inviteEmail.slice(0, 2).toUpperCase();
    setMembers(p => [...p, {
      id: `m${Date.now()}`, name: inviteEmail, email: inviteEmail,
      role: inviteRole, status: 'invited', initials, color: '#8b8b99',
    }]);
    setSending(false); setSent(true);
    setTimeout(() => { setSent(false); setShowInvite(false); setInviteEmail(''); }, 2000);
  };

  const changeRole = (id: string, role: Role) => {
    setMembers(p => p.map(m => m.id === id ? { ...m, role } : m));
    setOpenRoleMenu(null);
  };

  const removeMember = (id: string) => setMembers(p => p.filter(m => m.id !== id));

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
            <h1 className="text-xl font-semibold" style={S.text}>Team Management</h1>
            <p className="text-sm mt-1" style={S.muted}>Manage your workspace members, roles, and permissions.</p>
          </div>
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Members', value: members.length,  color: 'var(--md-primary)',  icon: Users },
            { label: 'Active Now',    value: activeCount,     color: 'var(--md-success)',  icon: Activity },
            { label: 'Admins',        value: adminCount,      color: 'var(--md-warning)',  icon: Crown },
            { label: 'Pending',       value: invitedCount,    color: 'var(--md-on-surface-var)', icon: Clock },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4" style={S.card}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                <p className="text-[11px] font-mono uppercase tracking-wider" style={S.muted}>{s.label}</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Member list */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-semibold" style={S.text}>Members</h2>
            <div className="space-y-2">
              {members.map((m, i) => {
                const RIcon = roleIcon(m.role);
                return (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-2xl group relative" style={S.card}>
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                      style={{ background: m.color + '22', color: m.color }}>
                      {m.initials}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate" style={S.text}>
                          {m.status === 'invited' ? m.email : m.name}
                        </p>
                        {/* Status dot */}
                        <span className="w-2 h-2 rounded-full shrink-0" style={{
                          background: m.status === 'active' ? 'var(--md-success)' : m.status === 'offline' ? 'var(--md-outline)' : 'var(--md-warning)',
                        }} />
                        {m.status === 'invited' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{ background: 'var(--md-warning-cont)', color: 'var(--md-warning)' }}>PENDING</span>
                        )}
                      </div>
                      <p className="text-xs" style={S.muted}>
                        {m.status === 'invited' ? 'Invite sent' : m.status === 'offline' ? `Last seen ${m.lastSeen}` : m.email}
                      </p>
                    </div>

                    {/* Role pill + dropdown */}
                    <div className="relative">
                      <button onClick={() => setOpenRoleMenu(openRoleMenu === m.id ? null : m.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: roleContColor(m.role), color: roleColor(m.role) }}>
                        <RIcon className="w-3.5 h-3.5" />
                        {m.role}
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>
                      <AnimatePresence>
                        {openRoleMenu === m.id && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-36 rounded-xl p-1 z-10"
                            style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-2)' }}>
                            {(['Admin', 'Developer', 'Viewer'] as Role[]).map(r => {
                              const RI = roleIcon(r);
                              return (
                                <button key={r} onClick={() => changeRole(m.id, r)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                                  style={{ color: m.role === r ? roleColor(r) : 'var(--md-on-surface-var)', background: m.role === r ? roleContColor(r) : 'transparent' }}>
                                  <RI className="w-3.5 h-3.5" /> {r}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.status === 'invited' && (
                        <button title="Resend invite" className="p-1.5 rounded-lg" style={S.muted}>
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => removeMember(m.id)} title="Remove"
                        className="p-1.5 rounded-lg" style={{ color: 'var(--md-error)' }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Permissions matrix */}
            <div className="rounded-2xl overflow-hidden mt-6" style={S.card}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--md-outline)' }}>
                <h2 className="font-semibold" style={S.text}>Role Permissions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--md-outline)' }}>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={S.muted}>Action</th>
                      {(['Admin', 'Developer', 'Viewer'] as Role[]).map(r => {
                        const RI = roleIcon(r);
                        return (
                          <th key={r} className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: roleColor(r) }}>
                            <div className="flex items-center justify-center gap-1"><RI className="w-3.5 h-3.5" />{r}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSIONS.map((row, i) => (
                      <tr key={row.action} style={{ borderTop: i > 0 ? '1px solid var(--md-outline-var)' : 'none' }}>
                        <td className="px-5 py-3 text-sm" style={S.text}>{row.action}</td>
                        {[row.admin, row.dev, row.viewer].map((has, j) => (
                          <td key={j} className="px-5 py-3 text-center">
                            {has
                              ? <CheckCircle2 className="w-4 h-4 mx-auto" style={{ color: 'var(--md-success)' }} />
                              : <X className="w-4 h-4 mx-auto opacity-30" style={{ color: 'var(--md-on-surface-var)' }} />}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Activity feed */}
          <div>
            <h2 className="font-semibold mb-4" style={S.text}>Recent Activity</h2>
            <div className="rounded-2xl p-5 space-y-4" style={S.card}>
              {ACTIVITY.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--md-surface-2)' }}>
                    <a.icon className="w-4 h-4" style={{ color: a.color }} />
                  </div>
                  <div>
                    <p className="text-xs" style={S.text}>
                      <span className="font-semibold">{a.user}</span> {a.action}
                    </p>
                    <p className="text-[11px] mt-0.5" style={S.muted}>{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-sm" style={{ background: 'var(--md-scrim)' }}
              onClick={() => !sending && setShowInvite(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl p-8"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)' }}>
              <button onClick={() => setShowInvite(false)} className="absolute top-5 right-5 p-2 rounded-xl" style={S.muted}>
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--md-primary-container)' }}>
                  <UserPlus className="w-5 h-5" style={{ color: 'var(--md-on-primary-cont)' }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={S.text}>Invite Team Member</h2>
                  <p className="text-xs" style={S.muted}>They'll receive an email invitation</p>
                </div>
              </div>
              {sent ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--md-success)' }} />
                  <p className="font-semibold" style={S.text}>Invitation sent!</p>
                  <p className="text-sm mt-1" style={S.muted}>Check your team's inbox.</p>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={S.muted}>Email Address</label>
                    <input type="email" required placeholder="colleague@company.com"
                      value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                      className="w-full h-11 rounded-xl px-4 text-sm"
                      style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)', outline: 'none' }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={S.muted}>Role</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Admin', 'Developer', 'Viewer'] as Role[]).map(r => {
                        const RI = roleIcon(r);
                        return (
                          <button key={r} type="button" onClick={() => setInviteRole(r)}
                            className="p-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition-all"
                            style={{
                              background: inviteRole === r ? roleContColor(r) : 'var(--md-surface-2)',
                              border: `2px solid ${inviteRole === r ? roleColor(r) : 'var(--md-outline)'}`,
                              color: inviteRole === r ? roleColor(r) : 'var(--md-on-surface-var)',
                            }}>
                            <RI className="w-4 h-4" /> {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button type="submit" disabled={!inviteEmail || sending}
                    className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
                    {sending
                      ? <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--md-on-primary)', borderTopColor: 'transparent' }} />Sending...</>
                      : <><Send className="w-4 h-4" />Send Invitation</>}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
