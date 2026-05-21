"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Database, Cpu, Settings, LogOut,
  Menu, X, Zap, Layers, MessageSquare, Rocket, Shield,
  BarChart2, BookOpen, FlaskConical, Sun, Moon, ChevronRight,
  GitBranch, Sliders, CreditCard, Users, Activity, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/theme";

const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Datasets", href: "/dashboard/datasets", icon: Database },
      { name: "Models", href: "/dashboard/models", icon: Layers },
      { name: "Training", href: "/dashboard/training", icon: Cpu },
      { name: "Playground", href: "/dashboard/playground", icon: MessageSquare },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { name: "Model Hub", href: "/dashboard/hub", icon: BookOpen },
      { name: "Prompt Library", href: "/dashboard/prompts", icon: BookOpen },
      { name: "Evaluations", href: "/dashboard/evaluations", icon: FlaskConical },
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
      { name: "Pipelines", href: "/dashboard/pipelines", icon: GitBranch },
      { name: "Config Builder", href: "/dashboard/config", icon: Sliders },
    ],
  },
  {
    label: "Deploy",
    items: [
      { name: "Deployments", href: "/dashboard/deployments", icon: Rocket },
      { name: "Monitoring",  href: "/dashboard/monitoring",  icon: Activity },
      { name: "Security",    href: "/dashboard/security",    icon: Shield },
      { name: "Billing",     href: "/dashboard/billing",     icon: CreditCard },
      { name: "Settings",    href: "/dashboard/settings",    icon: Settings },
    ],
  },
  {
    label: "Workspace",
    items: [
      { name: "Team",          href: "/dashboard/team",          icon: Users },
      { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ],
  },
];

interface User { full_name: string; email: string; }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth/login"); return; }
    const raw = localStorage.getItem("current_user");
    if (raw) { try { setUser(JSON.parse(raw)); } catch {} }
  }, [router]);

  const handleLogout = () => {
    ["token", "current_user", "demo_user"].forEach(k => localStorage.removeItem(k));
    router.push("/auth/login");
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14"
        style={{ borderBottom: "1px solid var(--md-outline)" }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-sm">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "var(--md-primary)" }}>
            <Zap className="w-4 h-4" style={{ color: "var(--md-on-primary)" }} />
          </div>
          <span style={{ color: "var(--md-on-surface)" }}>Nemix</span>
        </Link>
        {mobile && (
          <button onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--md-on-surface-var)" }}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto scrollbar-none px-3 py-4 space-y-6">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2"
              style={{ color: "var(--md-on-surface-var)", opacity: 0.6 }}>
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => mobile && setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all"
                    style={{
                      background: active ? "var(--md-primary-container)" : "transparent",
                      color: active ? "var(--md-on-primary-cont)" : "var(--md-on-surface-var)",
                    }}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                    {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-1" style={{ borderTop: "1px solid var(--md-outline)" }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-2xl text-sm font-medium transition-colors"
          style={{ color: "var(--md-on-surface-var)" }}
        >
          {theme === "dark"
            ? <><Sun className="w-4 h-4" /> Light mode</>
            : <><Moon className="w-4 h-4" /> Dark mode</>
          }
        </button>

        {/* User chip */}
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl"
            style={{ background: "var(--md-surface-2)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "var(--md-primary)", color: "var(--md-on-primary)" }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--md-on-surface)" }}>{user.full_name}</p>
              <p className="text-[10px] truncate" style={{ color: "var(--md-on-surface-var)" }}>{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-2xl text-sm font-medium transition-colors"
          style={{ color: "var(--md-on-surface-var)" }}
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ background: "var(--md-surface)" }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen"
        style={{ background: "var(--md-surface-1)", borderRight: "1px solid var(--md-outline)" }}>
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden" style={{ background: "var(--md-scrim)" }}
            onClick={() => setMobileOpen(false)}>
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="w-60 h-full"
              style={{ background: "var(--md-surface-1)", borderRight: "1px solid var(--md-outline)" }}
              onClick={e => e.stopPropagation()}>
              <NavContent mobile />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden h-14 flex items-center justify-between px-4"
          style={{ borderBottom: "1px solid var(--md-outline)", background: "var(--md-surface-1)" }}>
          <div className="flex items-center gap-2 font-bold text-sm">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "var(--md-primary)" }}>
              <Zap className="w-3.5 h-3.5" style={{ color: "var(--md-on-primary)" }} />
            </div>
            Nemix
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-2 rounded-xl transition-colors"
              style={{ color: "var(--md-on-surface-var)" }}>
              {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl transition-colors"
              style={{ color: "var(--md-on-surface-var)" }}>
              <Menu className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
