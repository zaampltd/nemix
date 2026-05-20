"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Database,
  Cpu,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  Layers,
  MessageSquare,
  User,
  Rocket,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import ThemeSelector from './ThemeSelector';

const sidebarItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Datasets', href: '/dashboard/datasets', icon: Database },
  { name: 'Models', href: '/dashboard/models', icon: Layers },
  { name: 'Training', href: '/dashboard/training', icon: Cpu },
  { name: 'Playground', href: '/dashboard/playground', icon: MessageSquare },
  { name: 'Deployments', href: '/dashboard/deployments', icon: Rocket },
  { name: 'Security', href: '/dashboard/security', icon: Shield },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
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
    
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    if (raw) {
      try { setCurrentUser(JSON.parse(raw)); } catch {}
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('demo_user');
    router.push('/auth/login');
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <nav className={cn('flex-1 space-y-1', mobile ? 'px-0' : 'px-4')}>
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => mobile && setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5 transition-colors',
                isActive ? 'text-purple-400' : 'group-hover:text-purple-400'
              )} />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId={mobile ? 'active-nav-mobile' : 'active-nav'}
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <ThemeSelector />

      <div className="p-4 border-t border-white/5 space-y-3">
        {currentUser && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{currentUser.full_name}</p>
              <p className="text-[11px] text-gray-500 truncate">{currentUser.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-400/5 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 h-screen">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg premium-gradient flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span>Nemix</span>
          </Link>
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile Menu */}
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
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-64 h-full bg-[#080808] border-r border-white/10 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 mb-2">
                <div className="flex items-center gap-2 font-bold text-xl">
                  <div className="w-8 h-8 rounded-lg premium-gradient flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span>Nemix</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent mobile />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <Zap className="w-5 h-5 text-purple-400" />
            <span>Nemix</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 text-gray-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
