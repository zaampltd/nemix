"use client";

import Link from 'next/link';
import { 
  Zap, Shield, Rocket, Globe, ArrowRight, Layers,
  Cpu, Database, MessageSquare, CheckCircle2,
  TrendingUp, Activity, Users, Star
} from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
});

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120,60,200,0.15), transparent)'}}>
      
      {/* ── Navigation ──────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.06]" style={{background:'rgba(0,0,0,0.6)', backdropFilter:'blur(24px)'}}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg premium-gradient flex items-center justify-center shadow-[0_0_16px_-4px_var(--theme-glow)]">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <span>Nemix</span>
          </div>

          <div className="hidden md:flex items-center gap-1 text-sm">
            {['Features','Pricing','Documentation','Blog'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-3 py-1.5">
              Sign In
            </Link>
            <Link href="/auth/register" className="px-4 py-2 rounded-xl premium-gradient text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95 shadow-[0_0_20px_-6px_var(--theme-glow)]">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-pink-600/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[300px] h-[300px] bg-blue-600/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: copy */}
            <div>
              <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-xs font-mono text-purple-400 mb-8 animate-glow">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
                </span>
                v1.0 is now live · Try it free
              </motion.div>

              <motion.h1 {...fadeUp(0.1)} className="text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
                Train & Deploy
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                  AI Models Fast
                </span>
              </motion.h1>

              <motion.p {...fadeUp(0.2)} className="text-gray-400 text-lg leading-relaxed mb-8 max-w-lg">
                Fine-tune LLMs, manage datasets, and ship production API endpoints — all in one dark-mode-first platform built for engineers.
              </motion.p>

              {/* Checklist */}
              <motion.ul {...fadeUp(0.25)} className="space-y-2 mb-10">
                {['No credit card required', 'LoRA fine-tuning in minutes', 'Auto-scaling API endpoints', '99.9% uptime SLA'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </motion.ul>

              <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-3">
                <Link href="/dashboard" className="px-6 py-3.5 rounded-2xl premium-gradient text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all group shadow-[0_0_30px_-8px_var(--theme-glow)]">
                  Start Building Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/dashboard/playground" className="px-6 py-3.5 rounded-2xl glass-strong text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-all border border-white/10">
                  Live Demo →
                </Link>
              </motion.div>

              {/* Social proof */}
              <motion.div {...fadeUp(0.4)} className="flex items-center gap-4 mt-10 pt-8 border-t border-white/5">
                <div className="flex -space-x-2">
                  {['A','B','C','D','E'].map((l) => (
                    <div key={l} className="w-8 h-8 rounded-full border-2 border-black bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-[10px] font-bold text-white">
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Loved by 500+ AI engineers</p>
                </div>
              </motion.div>
            </div>

            {/* Right: dashboard preview */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative hidden lg:block"
            >
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-purple-500/10 rounded-3xl blur-[60px]" />
              
              <div className="relative glass-strong rounded-3xl p-3 border border-white/10 shadow-[0_0_60px_-20px_rgba(168,85,247,0.4)]">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 pb-3 pt-1 border-b border-white/5">
                  <span className="w-3 h-3 rounded-full bg-red-500/70" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <span className="w-3 h-3 rounded-full bg-green-500/70" />
                  <div className="ml-3 flex-1 bg-white/5 rounded-lg h-5 text-[10px] text-gray-600 font-mono flex items-center px-3">
                    nemix-jjjj.vercel.app/dashboard
                  </div>
                </div>

                {/* Mini dashboard */}
                <div className="flex h-[420px] overflow-hidden rounded-2xl mt-1">
                  {/* Sidebar */}
                  <div className="w-44 shrink-0 bg-black/60 border-r border-white/5 flex flex-col p-3 gap-1">
                    <div className="flex items-center gap-2 mb-5 px-2 mt-1">
                      <div className="w-6 h-6 rounded-md premium-gradient flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="font-bold text-sm">Nemix</span>
                    </div>
                    {[
                      { label: 'Dashboard', icon: Layers, active: true },
                      { label: 'Datasets', icon: Database },
                      { label: 'Models', icon: Cpu },
                      { label: 'Training', icon: TrendingUp },
                      { label: 'Playground', icon: MessageSquare },
                      { label: 'Deployments', icon: Rocket },
                      { label: 'Security', icon: Shield },
                    ].map((item) => (
                      <div key={item.label} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-medium ${item.active ? 'bg-purple-500/15 text-purple-300 border-l-2 border-purple-400' : 'text-gray-600'}`}>
                        {item.icon && <item.icon className="w-3.5 h-3.5" />}
                        {item.label}
                      </div>
                    ))}
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-[#040406] p-4 flex flex-col gap-3 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">Overview</p>
                        <p className="text-sm font-bold">Good morning 👋</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[9px] text-green-400 font-mono">All systems live</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Models', value: '12', color: 'text-purple-400', border: 'border-purple-500/20', bg: 'from-purple-500/10' },
                        { label: 'API Calls', value: '1.2M', color: 'text-blue-400', border: 'border-blue-500/20', bg: 'from-blue-500/10' },
                        { label: 'Datasets', value: '38', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'from-emerald-500/10' },
                        { label: 'GPU Hrs', value: '847', color: 'text-pink-400', border: 'border-pink-500/20', bg: 'from-pink-500/10' },
                      ].map((s) => (
                        <div key={s.label} className={`rounded-xl p-2.5 border ${s.border} bg-gradient-to-b ${s.bg} to-transparent`}>
                          <p className="text-[8px] text-gray-500 uppercase font-mono">{s.label}</p>
                          <p className={`text-base font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Chart area */}
                    <div className="flex-1 rounded-xl border border-white/5 bg-white/[0.015] p-3 flex flex-col">
                      <p className="text-[8px] text-gray-500 uppercase font-mono mb-2">Training Loss · Last Run</p>
                      <div className="flex-1">
                        <svg viewBox="0 0 280 70" className="w-full h-full" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="heroGrad2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <path d="M0,65 C25,60 45,50 70,36 S115,18 145,13 S200,8 240,6 S270,5.5 280,5.5" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M0,65 C25,60 45,50 70,36 S115,18 145,13 S200,8 240,6 S270,5.5 280,5.5 L280,70 L0,70 Z" fill="url(#heroGrad2)"/>
                          <circle cx="280" cy="5.5" r="3" fill="#a855f7" />
                          <circle cx="280" cy="5.5" r="6" fill="#a855f7" fillOpacity={0.25} />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating stat chips */}
              <div className="absolute -left-10 top-1/3 glass-strong rounded-2xl px-3 py-2.5 border border-white/10 shadow-xl" style={{animation:'float 3s ease-in-out infinite'}}>
                <p className="text-[9px] text-gray-500 font-mono">P95 LATENCY</p>
                <p className="text-lg font-bold text-green-400">12ms</p>
              </div>
              <div className="absolute -right-8 top-1/4 glass-strong rounded-2xl px-3 py-2.5 border border-white/10 shadow-xl" style={{animation:'float 3.5s ease-in-out infinite 0.5s'}}>
                <p className="text-[9px] text-gray-500 font-mono">UPTIME</p>
                <p className="text-lg font-bold text-purple-400">99.9%</p>
              </div>
              <div className="absolute -right-6 bottom-1/4 glass-strong rounded-2xl px-3 py-2.5 border border-white/10 shadow-xl" style={{animation:'float 4s ease-in-out infinite 1s'}}>
                <p className="text-[9px] text-gray-500 font-mono">MODELS DEPLOYED</p>
                <p className="text-lg font-bold text-blue-400">2,841</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────── */}
      <section className="py-14 border-y border-white/[0.04]" style={{background:'rgba(255,255,255,0.01)'}}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-600 mb-8">Trusted by engineering teams at</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {['TECHFLOW','NEURALIS','OPTIX','VOID.AI','SYNTHOS','DATAVEX'].map((name) => (
              <div key={name} className="glass-strong px-5 py-2 rounded-xl border border-white/[0.06] text-sm font-black italic text-gray-600 hover:text-gray-400 hover:border-white/10 transition-all">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats row ────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '2,841', label: 'Models Deployed', icon: Rocket, color: 'text-purple-400' },
              { value: '1.2B', label: 'API Requests Served', icon: Activity, color: 'text-blue-400' },
              { value: '99.9%', label: 'Platform Uptime', icon: CheckCircle2, color: 'text-green-400' },
              { value: '500+', label: 'Active Teams', icon: Users, color: 'text-pink-400' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-3xl p-6 text-center border border-white/5"
              >
                <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-3`} />
                <p className={`text-4xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-purple-400 mb-3">What&apos;s inside</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 premium-text-glow">Everything you need to ship AI</h2>
            <p className="text-gray-400 max-w-xl mx-auto">A complete ecosystem for the modern AI engineer. Every feature below is either live in your dashboard or coming very soon.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Dataset Engine',
                desc: 'Upload, version, and auto-clean training data at scale.',
                icon: Database, status: 'live', href: '/dashboard/datasets',
                color: 'from-blue-500/10 to-transparent', border: 'hover:border-blue-500/30',
                iconColor: 'text-blue-400', iconBg: 'bg-blue-500/10 border-blue-500/20',
                bullets: ['CSV / JSON / Parquet upload', 'Auto schema validation & cleaning', 'Dataset versioning', 'Train/val auto-split'],
              },
              {
                title: 'Training Orchestrator',
                desc: 'Fine-tune LLMs with LoRA and visualize loss curves in real time.',
                icon: Cpu, status: 'live', href: '/dashboard/training',
                color: 'from-purple-500/10 to-transparent', border: 'hover:border-purple-500/30',
                iconColor: 'text-purple-400', iconBg: 'bg-purple-500/10 border-purple-500/20',
                bullets: ['LoRA / QLoRA fine-tuning', 'Interactive pipeline visualizer', 'Live loss/accuracy tracking', 'Checkpoint save & restore'],
              },
              {
                title: 'Model Playground',
                desc: 'Test, benchmark, and compare models side-by-side.',
                icon: MessageSquare, status: 'live', href: '/dashboard/playground',
                color: 'from-pink-500/10 to-transparent', border: 'hover:border-pink-500/30',
                iconColor: 'text-pink-400', iconBg: 'bg-pink-500/10 border-pink-500/20',
                bullets: ['Chat with fine-tuned models', 'Side-by-side Model Arena', 'Latency & token telemetry', 'Confidence scoring'],
              },
              {
                title: 'API Deployments',
                desc: 'One-click deploy to low-latency global edge endpoints.',
                icon: Rocket, status: 'live', href: '/dashboard/deployments',
                color: 'from-green-500/10 to-transparent', border: 'hover:border-green-500/30',
                iconColor: 'text-green-400', iconBg: 'bg-green-500/10 border-green-500/20',
                bullets: ['Global edge endpoints', 'Real-time RPS & latency', 'Auto sleep/wake scaling', 'One-click rollback'],
              },
              {
                title: 'Secure Gateway',
                desc: 'Enterprise API keys with RBAC scopes and audit logs.',
                icon: Shield, status: 'live', href: '/dashboard/security',
                color: 'from-amber-500/10 to-transparent', border: 'hover:border-amber-500/30',
                iconColor: 'text-amber-400', iconBg: 'bg-amber-500/10 border-amber-500/20',
                bullets: ['Scoped API key generation', 'Per-key usage analytics', 'Instant key revocation', 'Encrypted key storage'],
              },
              {
                title: 'Team Collaboration',
                desc: 'Shared workspaces, role management, and real-time co-editing.',
                icon: Globe, status: 'soon', href: null,
                color: 'from-white/[0.02] to-transparent', border: 'hover:border-white/10',
                iconColor: 'text-gray-500', iconBg: 'bg-white/5 border-white/10',
                bullets: ['Multi-user workspaces', 'Admin/Editor/Viewer roles', 'Activity feed & audit trail', 'Shared model registry'],
              },
            ].map((f) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`relative glass-card rounded-3xl border border-white/[0.06] ${f.border} p-7 bg-gradient-to-b ${f.color} flex flex-col group`}
              >
                {/* Spotlight hover effect */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{background:`radial-gradient(circle at 50% 0%, rgba(var(--theme-glow-rgb),0.06), transparent 70%)`}} />

                <div className="absolute top-5 right-5">
                  {f.status === 'live' ? (
                    <span className="flex items-center gap-1.5 text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Live
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/10">
                      Coming Soon
                    </span>
                  )}
                </div>

                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-5 border ${f.iconBg}`}>
                  <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                </div>

                <h3 className="text-base font-bold mb-2 text-white">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">{f.desc}</p>

                <ul className="space-y-2 mb-6 flex-1">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className={`mt-1 w-1 h-1 rounded-full shrink-0 ${f.iconColor} bg-current`} />
                      {b}
                    </li>
                  ))}
                </ul>

                {f.href ? (
                  <Link href={f.href} className={`inline-flex items-center gap-1.5 text-xs font-semibold ${f.iconColor} hover:gap-2.5 transition-all`}>
                    Open {f.title} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="text-xs text-gray-700 font-mono">In development</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative glass-strong rounded-3xl border border-white/10 p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/10 pointer-events-none" />
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
            
            <div className="relative">
              <p className="text-xs font-mono uppercase tracking-widest text-purple-400 mb-4">Get started today</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 premium-text-glow">
                Ready to ship your
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">first AI model?</span>
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                Join 500+ engineers using Nemix to build, fine-tune, and deploy AI at scale. Start for free — no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth/register" className="px-8 py-4 rounded-2xl premium-gradient text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-[0_0_40px_-10px_var(--theme-glow)] group">
                  Start for Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/dashboard" className="px-8 py-4 rounded-2xl glass-strong text-white font-semibold flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all">
                  View Dashboard Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 font-bold text-lg mb-4">
                <div className="w-7 h-7 rounded-lg premium-gradient flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span>Nemix</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                The industrial-grade AI training platform for modern engineering teams.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-gray-600 font-mono">All systems operational</span>
              </div>
            </div>

            {/* Links */}
            {[
              { title: 'Product', links: ['Dashboard','Datasets','Training','Deployments','Security'] },
              { title: 'Developers', links: ['Documentation','API Reference','Status','Changelog'] },
              { title: 'Company', links: ['About','Blog','Careers','Privacy','Terms'] },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-300 transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="glow-line mb-8" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-700">© 2026 Nemix Infrastructure Inc. All rights reserved.</p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-700">Built with</span>
              <span className="text-red-500 mx-1">♥</span>
              <span className="text-xs text-gray-700">for AI engineers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
