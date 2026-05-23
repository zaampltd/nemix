"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Crown, Code2, Eye, UserPlus, X, Send,
  CheckCircle2, Clock, Activity, Shield,
  Trash2, RefreshCw, ChevronDown, Loader2, Sparkles, Key, AlertCircle
} from 'lucide-react';
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";

type Role = 'Admin' | 'Developer' | 'Viewer';

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'offline' | 'invited';
  lastSeen?: string;
  initials: string;
  color: string;
}

const INITIAL_MEMBERS: Member[] = [
  { id: 'm1', name: 'Sarah Chen',   email: 'sarah@company.com',   role: 'Admin',     status: 'active',  initials: 'SC', color: 'var(--md-warning)' },
  { id: 'm2', name: 'James Wilson', email: 'james@company.com',   role: 'Developer', status: 'active',  initials: 'JW', color: 'var(--md-primary)' },
  { id: 'm3', name: 'Amira Patel',  email: 'amira@company.com',   role: 'Developer', status: 'offline', lastSeen: '2h ago', initials: 'AP', color: 'var(--md-success)' },
  { id: 'm4', name: 'Tom Bradley',  email: 'tom@company.com',     role: 'Viewer',    status: 'active',  initials: 'TB', color: '#e5534b' },
  { id: 'm5', name: 'mike@startup.com', email: 'mike@startup.com', role: 'Developer', status: 'invited', initials: 'MI', color: 'var(--md-on-surface-var)' },
];

const ACTIVITY = [
  { user: 'Sarah Chen',   action: 'deployed llama3-sentiment-v2 endpoint', time: '5m ago',  icon: CheckCircle2, color: 'var(--md-success)' },
  { user: 'James Wilson', action: 'started training gpt2-code-assistant', time: '1h ago',  icon: Activity,     color: 'var(--md-primary)' },
  { user: 'Amira Patel',  action: 'uploaded customer-reviews-2026.csv',   time: '3h ago',  icon: CheckCircle2, color: 'var(--md-success)' },
  { user: 'Tom Bradley',  action: 'viewed monitoring metrics feed',       time: '5h ago',  icon: Eye,          color: 'var(--md-on-surface-var)' },
  { user: 'Sarah Chen',   action: 'issued master endpoint API credentials',time: 'Yesterday',icon: Shield,       color: 'var(--md-primary)' },
  { user: 'James Wilson', action: 'deleted bert-ner-v1 model checkpoint', time: 'Yesterday',icon: Trash2,       color: 'var(--md-error)' },
];

const PERMISSIONS: { action: string; admin: boolean; dev: boolean; viewer: boolean }[] = [
  { action: 'View metrics & telemetry',admin: true,  dev: true,  viewer: true  },
  { action: 'Create/Split datasets',   admin: true,  dev: true,  viewer: false },
  { action: 'Launch fine-tuning runs', admin: true,  dev: true,  viewer: false },
  { action: 'Deploy edge router APIs', admin: true,  dev: true,  viewer: false },
  { action: 'Delete cluster resources',admin: true,  dev: false, viewer: false },
  { action: 'Manage master credentials',admin: true,  dev: false, viewer: false },
  { action: 'Billing subscription level',admin: true,  dev: false, viewer: false },
  { action: 'Invite/Remove team members',admin: true,  dev: false, viewer: false },
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
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('Developer');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [openRoleMenu, setOpenRoleMenu] = useState<string | null>(null);

  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        setIsLoading(true);
        const q = query(collection(db, "TeamMembers"), where("userId", "==", "test-user-123"));
        const snapshot = await getDocs(q);
        const fetched: Member[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            name: data.name || "",
            email: data.email || "",
            role: data.role || "Developer",
            status: data.status || "active",
            lastSeen: data.lastSeen || undefined,
            initials: data.initials || "TM",
            color: data.color || "var(--md-primary)"
          });
        });

        if (fetched.length > 0) {
          setMembers(fetched);
          localStorage.setItem('local_members', JSON.stringify(fetched));
        } else {
          const local = localStorage.getItem('local_members');
          if (local) {
            setMembers(JSON.parse(local));
          } else {
            setMembers(INITIAL_MEMBERS);
            localStorage.setItem('local_members', JSON.stringify(INITIAL_MEMBERS));
          }
        }
      } catch (err) {
        console.error("Failed to load team members from firestore:", err);
        const local = localStorage.getItem('local_members');
        if (local) {
          setMembers(JSON.parse(local));
        } else {
          setMembers(INITIAL_MEMBERS);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamMembers();
  }, []);

  const activeCount  = members.filter(m => m.status === 'active').length;
  const adminCount   = members.filter(m => m.role === 'Admin').length;
  const invitedCount = members.filter(m => m.status === 'invited').length;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const initials = inviteEmail.slice(0, 2).toUpperCase();
      const colors = ['var(--md-primary)', 'var(--md-success)', 'var(--md-warning)', '#e5534b', 'var(--logo-grad-start)'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const memberData = {
        userId: "test-user-123",
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'invited' as const,
        initials: initials,
        color: randomColor,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "TeamMembers"), memberData);

      const newMember: Member = {
        id: docRef.id,
        name: memberData.name,
        email: inviteEmail,
        role: inviteRole,
        status: 'invited',
        initials: initials,
        color: randomColor
      };

      setMembers(prev => {
        const next = [...prev, newMember];
        localStorage.setItem('local_members', JSON.stringify(next));
        return next;
      });

      setSending(false);
      setSent(true);
      setTimeout(() => { setSent(false); setShowInvite(false); setInviteEmail(''); }, 2000);
    } catch (err) {
      console.error("Error creating team member invite in firestore:", err);
      // fallback
      const initials = inviteEmail.slice(0, 2).toUpperCase();
      const newMember: Member = {
        id: `m_${Date.now()}`,
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'invited',
        initials: initials,
        color: 'var(--md-primary)'
      };
      setMembers(prev => {
        const next = [...prev, newMember];
        localStorage.setItem('local_members', JSON.stringify(next));
        return next;
      });
      setSending(false);
      setSent(true);
      setTimeout(() => { setSent(false); setShowInvite(false); setInviteEmail(''); }, 2000);
    }
  };

  const changeRole = async (id: string, role: Role) => {
    try {
      if (!id.startsWith("m1") && !id.startsWith("m2") && !id.startsWith("m3") && !id.startsWith("m4") && !id.startsWith("m5") && !id.startsWith("m_")) {
        await updateDoc(doc(db, "TeamMembers", id), { role });
      }
      setMembers(prev => {
        const next = prev.map(m => m.id === id ? { ...m, role } : m);
        localStorage.setItem('local_members', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error("Failed to update team role in firestore:", err);
      setMembers(prev => {
        const next = prev.map(m => m.id === id ? { ...m, role } : m);
        localStorage.setItem('local_members', JSON.stringify(next));
        return next;
      });
    } finally {
      setOpenRoleMenu(null);
    }
  };

  const removeMember = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to remove this team member?");
    if (!confirmed) return;

    try {
      if (!id.startsWith("m1") && !id.startsWith("m2") && !id.startsWith("m3") && !id.startsWith("m4") && !id.startsWith("m5") && !id.startsWith("m_")) {
        await deleteDoc(doc(db, "TeamMembers", id));
      }
      setMembers(prev => {
        const next = prev.filter(m => m.id !== id);
        localStorage.setItem('local_members', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error("Failed to delete team member from firestore:", err);
      setMembers(prev => {
        const next = prev.filter(m => m.id !== id);
        localStorage.setItem('local_members', JSON.stringify(next));
        return next;
      });
    }
  };

  const S = {
    card:  { background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-1)', backdropFilter: 'blur(12px)' } as React.CSSProperties,
    text:  { color: 'var(--md-on-surface)' } as React.CSSProperties,
    muted: { color: 'var(--md-on-surface-var)' } as React.CSSProperties,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={S.text}>Team Management</h1>
            <p className="text-sm mt-1" style={S.muted}>Delegate dashboard permissions, invite developers, and manage workspace access levels.</p>
          </div>
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        </div>

        {/* Stats Row with visual indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Members', value: members.length,  color: 'var(--md-primary)',  icon: Users },
            { label: 'Active Now',    value: activeCount,     color: 'var(--md-success)',  icon: Activity, pulse: true },
            { label: 'Workspace Admins',value: adminCount,      color: 'var(--md-warning)',  icon: Crown },
            { label: 'Pending Invites',value: invitedCount,    color: 'var(--md-on-surface-var)', icon: Clock },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5 relative overflow-hidden transition-all hover:scale-[1.02]" style={S.card}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.color + '15' }}>
                    <s.icon className="w-4.5 h-4.5" style={{ color: s.color }} />
                  </div>
                  <p className="text-xs font-semibold" style={S.muted}>{s.label}</p>
                </div>
                {s.pulse && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
              </div>
              <p className="text-3xl font-black mt-2" style={{ color: s.color }}>{isLoading ? "..." : s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Member listing column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={S.text}>Workspace Members</h2>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-900 text-purple-200">
                Firestore database active
              </span>
            </div>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-16 rounded-2xl" style={S.card}>
                  <Loader2 className="w-8 h-8 text-[var(--md-primary)] animate-spin mb-3" />
                  <p className="text-xs" style={S.muted}>Establishing secure Firestore handshake...</p>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center p-16 rounded-2xl" style={S.card}>
                  <Users className="w-10 h-10 mx-auto text-[var(--md-outline)] mb-3 opacity-60" />
                  <p className="text-sm font-semibold" style={S.text}>Workspace is empty</p>
                  <p className="text-xs mt-1" style={S.muted}>Invite colleagues to collaborate in this workspace.</p>
                </div>
              ) : (
                members.map((m, i) => {
                  const RIcon = roleIcon(m.role);
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-4 p-4 rounded-2xl group relative transition-all hover:translate-x-1"
                      style={{ ...S.card, zIndex: openRoleMenu === m.id ? 50 : 20 - i }}>
                      
                      {/* Premium gradient rounded avatar */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm select-none"
                        style={{
                          background: m.status === 'invited' ? 'var(--md-surface-2)' : `linear-gradient(135deg, ${m.color} 0%, rgba(255,255,255,0.1) 100%)`,
                          color: m.status === 'invited' ? 'var(--md-on-surface-var)' : '#fff',
                          border: `1px solid ${m.status === 'invited' ? 'var(--md-outline)' : m.color + '40'}`,
                          textShadow: '0 1px 2px rgba(0,0,0,0.15)'
                        }}>
                        {m.initials}
                      </div>

                      {/* Name and email Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm truncate" style={S.text}>
                            {m.status === 'invited' ? m.email : m.name}
                          </p>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${m.status === 'active' ? 'animate-pulse' : ''}`} style={{
                            background: m.status === 'active' ? 'var(--md-success)' : m.status === 'offline' ? 'var(--md-outline)' : 'var(--md-warning)',
                          }} />
                          {m.status === 'invited' && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse bg-amber-500/10 text-amber-500 border border-amber-500/30">
                              PENDING INVITE
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={S.muted}>
                          {m.status === 'invited' ? 'Invite pending acceptance' : m.status === 'offline' ? `Last active ${m.lastSeen}` : m.email}
                        </p>
                      </div>

                      {/* Modern Role selector pill */}
                      <div className="relative">
                        <button onClick={() => setOpenRoleMenu(openRoleMenu === m.id ? null : m.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border hover:opacity-90"
                          style={{
                            background: roleContColor(m.role),
                            color: roleColor(m.role),
                            borderColor: roleColor(m.role) + '30'
                          }}>
                          <RIcon className="w-3.5 h-3.5" />
                          {m.role}
                          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                        </button>
                        <AnimatePresence>
                          {openRoleMenu === m.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenRoleMenu(null)} />
                              <motion.div initial={{ opacity: 0, y: 4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                className="absolute right-0 top-full mt-1.5 w-36 rounded-2xl p-1 z-20"
                                style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)' }}>
                                {(['Admin', 'Developer', 'Viewer'] as Role[]).map(r => {
                                  const RI = roleIcon(r);
                                  return (
                                    <button key={r} onClick={() => changeRole(m.id, r)}
                                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-neutral-800"
                                      style={{
                                        color: m.role === r ? roleColor(r) : 'var(--md-on-surface-var)',
                                        background: m.role === r ? roleContColor(r) : 'transparent'
                                      }}>
                                      <RI className="w-3.5 h-3.5" /> {r}
                                    </button>
                                  );
                                })}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Deletion action */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => removeMember(m.id)} title="Revoke Access"
                          className="p-2 rounded-xl hover:bg-red-500/10 transition-colors" style={{ color: 'var(--md-error)' }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Premium Role Permissions Matrix table */}
            <div className="rounded-3xl overflow-hidden mt-6" style={S.card}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--md-outline)' }}>
                <div>
                  <h3 className="font-bold text-sm" style={S.text}>Unified Permissions Grid</h3>
                  <p className="text-xs" style={S.muted}>Role-based security boundaries for automated fine-tuning clusters.</p>
                </div>
                <Sparkles className="w-4.5 h-4.5 text-purple-400" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--md-outline)' }}>
                      <th className="px-6 py-3.5 text-left font-bold uppercase tracking-widest" style={S.muted}>Scope Action</th>
                      {(['Admin', 'Developer', 'Viewer'] as Role[]).map(r => {
                        const RI = roleIcon(r);
                        return (
                          <th key={r} className="px-6 py-3.5 text-center font-bold uppercase tracking-widest" style={{ color: roleColor(r) }}>
                            <div className="flex items-center justify-center gap-1.5"><RI className="w-3.5 h-3.5" />{r}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSIONS.map((row, i) => (
                      <tr key={row.action} className="transition-colors hover:bg-neutral-800/10" style={{ borderTop: i > 0 ? '1px solid var(--md-outline-var)' : 'none' }}>
                        <td className="px-6 py-3 text-xs font-semibold" style={S.text}>{row.action}</td>
                        {[row.admin, row.dev, row.viewer].map((has, j) => (
                          <td key={j} className="px-6 py-3 text-center">
                            {has
                              ? <span className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center mx-auto">
                                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--md-success)' }} />
                                </span>
                              : <span className="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto">
                                  <X className="w-3.5 h-3.5" style={{ color: 'var(--md-error)' }} />
                                </span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Audit trail activity log */}
          <div>
            <h2 className="font-bold text-lg mb-4" style={S.text}>Audit Trail Logs</h2>
            <div className="rounded-2xl p-5 space-y-4" style={S.card}>
              {ACTIVITY.map((a, i) => (
                <div key={i} className="flex gap-3 relative group">
                  {i < ACTIVITY.length - 1 && (
                    <span className="absolute left-4 top-8 bottom-[-16px] w-[1px]" style={{ background: 'var(--md-outline-var)' }} />
                  )}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 relative z-10 transition-all group-hover:scale-105"
                    style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}>
                    <a.icon className="w-4 h-4" style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-normal" style={S.text}>
                      <span className="font-bold">{a.user}</span> <span className="opacity-80">{a.action}</span>
                    </p>
                    <p className="text-[10px] mt-1 font-semibold flex items-center gap-1" style={S.muted}>
                      <Clock className="w-3 h-3" /> {a.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Invitation Popup Modal */}
      <AnimatePresence>
        {showInvite && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-sm" style={{ background: 'var(--md-scrim)' }}
              onClick={() => !sending && setShowInvite(false)} />
            
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl p-6"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)' }}>
              
              <button onClick={() => setShowInvite(false)} className="absolute top-4 right-4 p-2 rounded-xl" style={S.muted}>
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--md-primary-container)' }}>
                  <UserPlus className="w-5 h-5" style={{ color: 'var(--md-primary)' }} />
                </div>
                <div>
                  <h2 className="text-lg font-black" style={S.text}>Invite Team Member</h2>
                  <p className="text-xs mt-0.5" style={S.muted}>They'll receive an invitation email and direct gateway link.</p>
                </div>
              </div>

              {sent ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-14 h-14 mx-auto mb-3 text-green-500 animate-bounce" />
                  <p className="font-bold text-sm" style={S.text}>Invitation Sent Successfully!</p>
                  <p className="text-xs mt-1" style={S.muted}>An active profile has been registered in the Firebase database vault.</p>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={S.muted}>Colleague Email Address</label>
                    <input type="email" required placeholder="colleague@startup.com"
                      value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                      className="w-full h-11 rounded-xl px-4 text-sm"
                      style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)', outline: 'none' }} />
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={S.muted}>Workspace Role Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Admin', 'Developer', 'Viewer'] as Role[]).map(r => {
                        const RI = roleIcon(r);
                        const isSelected = inviteRole === r;
                        return (
                          <button key={r} type="button" onClick={() => setInviteRole(r)}
                            className="p-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all border hover:scale-[1.02]"
                            style={{
                              background: isSelected ? roleContColor(r) : 'var(--md-surface-2)',
                              border: `2px solid ${isSelected ? roleColor(r) : 'var(--md-outline)'}`,
                              color: isSelected ? roleColor(r) : 'var(--md-on-surface-var)',
                            }}>
                            <RI className="w-4 h-4" /> {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-xl mb-2"
                    style={{ background: 'var(--md-primary-container)', border: '1px solid var(--md-outline-var)' }}>
                    <AlertCircle className="w-4 h-4 shrink-0 text-purple-600" />
                    <p className="text-[10px]" style={{ color: 'var(--md-on-surface-var)' }}>
                      New members default to <strong>Pending</strong> status until they accept invitation credentials.
                    </p>
                  </div>

                  <button type="submit" disabled={!inviteEmail || sending}
                    className="w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 mt-4"
                    style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
                    {sending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Issuing Invite...</>
                      : <><Send className="w-4 h-4" /> Send Workspace Invite</>}
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
