"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Database, Cpu, Settings, LogOut,
  Menu, X, Zap, Layers, MessageSquare, User,
  Rocket, Shield, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeSelector from './ThemeSelector';

const NAV_SECTIONS = [
  {
    label: 'Main',
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
    label: 'Account',
    items: [
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

interface CurrentUser {
  full_name: string;
  email: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const raw = localStorage.getItem('current_user');
    if (!token) { router.push('/auth/login'); return; }
    if (raw) { try { setCurrentUser(JSON.parse(raw)); } catch {} }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('demo_user');
    router.push('/auth/login');
  };

  const initials = currentUser?.full_name
    ? currentUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={cn('flex-1 overflow-y-auto scrollbar-none py-2', mobile ? 'px-0' : 'px-3')}>
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="mb-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-700 px-3 mb-1">{section.label}</p>
          {section.items.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => mobile && setIsMobileMenuOpen(false)}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group mb-0.5',
                  isActive
                    ? 'bg-white/[0.06] text-white'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId={mobile ? 'nav-active-m' : 'nav-active'}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-purple-400"
                    style={{ boxShadow: '0 0 8px rgba(168,85,247,0.8)' }}
                  />
                )}
                <item.icon className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-purple-400' : 'group-hover:text-gray-300'
                )} />
                <span className="text-sm font-medium">{item.name}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-purple-400/50 ml-auto" />}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const SidebarBottom = () => (
    <div className="border-t border-white/[0.05] p-4 space-y-3">
      <ThemeSelector />

      {currentUser && (
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl glass-strong border border-white/[0.06]">
          {/* Avatar with initials */}
          <div className="w-8 h-8 rounded-full premium-gradient flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{currentUser.full_name}</p>
            <p className="text-[10px] text-gray-500 truncate">{currentUser.email}</p>
          </div>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2 w-full text-gray-500 hover:text-red-400 rounded-xl hover:bg-red-400/5 transition-all"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-medium">Logout</span>
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-black text-white">

      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/[0.05] sticky top-0 h-screen"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(24px)' }}>
        {/* Logo */}
        <div className="p-5 border-b border-white/[0.05]">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 rounded-xl premium-gradient flex items-center justify-center shadow-[0_0_16px_-4px_var(--theme-glow)]">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <span>Nemix</span>
          </Link>
        </div>

        <NavItems />
        <SidebarBottom />
      </aside>

      {/* ── Mobile Overlay ───────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-64 h-full flex flex-col border-r border-white/10"
              style={{ background: 'rgba(4,4,8,0.95)', backdropFilter: 'blur(24px)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <div className="w-7 h-7 rounded-lg premium-gradient flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span>Nemix</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/5">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
              <NavItems mobile />
              <SidebarBottom />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="h-14 border-b border-white/[0.05] flex items-center justify-between px-5 md:hidden"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)' }}>
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <Zap className="w-4.5 h-4.5 text-purple-400" />
            <span>Nemix</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-5 md:p-8 overflow-y-auto" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(120,60,200,0.05), transparent)' }}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
