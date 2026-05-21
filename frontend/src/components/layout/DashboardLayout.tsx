"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Database, Cpu, Settings, LogOut,
  Menu, X, Zap, Layers, MessageSquare, Rocket, Shield, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import ThemeSelector from './ThemeSelector';

const NAV = [
  {
    label: 'General',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Datasets', href: '/dashboard/datasets', icon: Database },
      { name: 'Models', href: '/dashboard/models', icon: Layers },
      { name: 'Training', href: '/dashboard/training', icon: Cpu },
      { name: 'Playground', href: '/dashboard/playground', icon: MessageSquare },
    ],
  },
  {
    label: 'Deploy',
    items: [
      { name: 'Deployments', href: '/dashboard/deployments', icon: Rocket },
      { name: 'Security', href: '/dashboard/security', icon: Shield },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

interface User { full_name: string; email: string; }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    const raw = localStorage.getItem('current_user');
    if (raw) { try { setUser(JSON.parse(raw)); } catch {} }
  }, [router]);

  const handleLogout = () => {
    ['token', 'current_user', 'demo_user'].forEach(k => localStorage.removeItem(k));
    router.push('/auth/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 h-12 flex items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-sm">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#7c6af7' }}>
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          Nemix
        </Link>
        {mobile && (
          <button onClick={() => setMobileOpen(false)} className="ml-auto p-1 rounded" style={{ color: '#55555f' }}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-none p-3 space-y-5">
        {NAV.map(section => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1.5" style={{ color: '#2e2e35' }}>
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const isActive = item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => mobile && setMobileOpen(false)}
                    className={cn('flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors')}
                    style={{
                      background: isActive ? 'rgba(124,106,247,0.1)' : 'transparent',
                      color: isActive ? '#a78bfa' : '#8b8b99',
                    }}
                    onMouseOver={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#f0f0f2'; } }}
                    onMouseOut={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b8b99'; } }}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{item.name}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <ThemeSelector />

        {user && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: '#7c6af7' }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: '#f0f0f2' }}>{user.full_name}</p>
              <p className="text-[10px] truncate" style={{ color: '#55555f' }}>{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-2.5 py-2 w-full rounded-lg text-sm transition-colors"
          style={{ color: '#55555f' }}
          onMouseOver={e => { e.currentTarget.style.color = '#e5534b'; e.currentTarget.style.background = 'rgba(229,83,75,0.06)'; }}
          onMouseOut={e => { e.currentTarget.style.color = '#55555f'; e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0b', color: '#f0f0f2' }}>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 sticky top-0 h-screen"
        style={{ background: '#0d0d10', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden" style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setMobileOpen(false)}>
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="w-56 h-full" style={{ background: '#0d0d10', borderRight: '1px solid rgba(255,255,255,0.06)' }}
              onClick={e => e.stopPropagation()}>
              <Sidebar mobile />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden h-12 flex items-center justify-between px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0d10' }}>
          <div className="flex items-center gap-2 font-semibold text-sm">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: '#7c6af7' }}>
              <Zap className="w-3 h-3 text-white" />
            </div>
            Nemix
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded" style={{ color: '#8b8b99' }}>
            <Menu className="w-4.5 h-4.5" />
          </button>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
