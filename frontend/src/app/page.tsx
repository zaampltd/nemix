"use client";

import Link from 'next/link';
import { 
  Zap, 
  Shield, 
  Rocket, 
  Globe, 
  ArrowRight, 
  Layers, 
  Cpu, 
  Database,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
            <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center shadow-[0_0_20px_-5px_#a855f7]">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span>Nemix</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#docs" className="hover:text-white transition-colors">Documentation</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium hover:text-purple-400 transition-colors">
              Sign In
            </Link>
            <Link href="/auth/register" className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-200 transition-all active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-purple-500/10 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-purple-400 mb-8 animate-glow"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            v1.0 is now live
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8"
          >
            The Industrial Grade <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              AI Training Platform
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl mb-12 leading-relaxed"
          >
            Build, train, and deploy production-ready AI models in minutes. 
            From fine-tuning LLMs to custom computer vision, we provide the infrastructure so you can focus on innovation.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 rounded-2xl premium-gradient text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all group">
              Start Building Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all">
              Book a Demo
            </button>
          </motion.div>

          {/* Hero Image / Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="mt-20 relative"
          >
            {/* Fade to black at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none rounded-b-3xl" />
            <div className="glass rounded-3xl border border-white/10 p-3 shadow-[0_0_80px_-20px_rgba(168,85,247,0.3)]">
              {/* Mock browser chrome */}
              <div className="flex items-center gap-2 px-4 pb-3 pt-1 border-b border-white/5">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <div className="ml-4 flex-1 bg-white/5 rounded-lg h-5 text-[10px] text-gray-600 font-mono flex items-center px-3">
                  nemix-jjjj.vercel.app/dashboard
                </div>
              </div>

              {/* Dashboard shell */}
              <div className="flex h-[460px] overflow-hidden rounded-2xl">

                {/* Sidebar */}
                <div className="w-48 shrink-0 bg-[#080808] border-r border-white/5 flex flex-col p-4 gap-1">
                  <div className="flex items-center gap-2 mb-6 px-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-sm">Nemix</span>
                  </div>
                  {[
                    { label: 'Dashboard', icon: Layers, active: true },
                    { label: 'Datasets', icon: Database, active: false },
                    { label: 'Models', icon: Cpu, active: false },
                    { label: 'Training', icon: Rocket, active: false },
                    { label: 'Playground', icon: Globe, active: false },
                  ].map((item) => (
                    <div key={item.label} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${item.active ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' : 'text-gray-500'}`}>
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 bg-[#050505] p-5 overflow-hidden flex flex-col gap-4">

                  {/* Top bar */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">Overview</p>
                      <h2 className="text-sm font-bold text-white">AI Infrastructure Dashboard</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[10px] text-green-400 font-mono">LIVE</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Models', value: '12', delta: '+2', color: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-400' },
                      { label: 'Datasets', value: '38', delta: '+5', color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400' },
                      { label: 'API Calls', value: '1.2M', delta: '+18%', color: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400' },
                      { label: 'GPU hrs', value: '847', delta: 'active', color: 'from-pink-500/20 to-pink-500/5', border: 'border-pink-500/20', text: 'text-pink-400' },
                    ].map((stat) => (
                      <div key={stat.label} className={`rounded-xl p-3 border ${stat.border} bg-gradient-to-b ${stat.color}`}>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">{stat.label}</p>
                        <p className={`text-lg font-bold mt-0.5 ${stat.text}`}>{stat.value}</p>
                        <p className="text-[9px] text-gray-600 mt-0.5">{stat.delta} this week</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart + Activity */}
                  <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
                    {/* Fake sparkline chart */}
                    <div className="col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 flex flex-col">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider font-mono mb-3">Training Loss · Epoch Progress</p>
                      <div className="flex-1 relative">
                        <svg viewBox="0 0 300 80" className="w-full h-full" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <path d="M0,70 C30,65 50,55 80,40 S130,20 160,15 S220,10 260,8 S290,7 300,7" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M0,70 C30,65 50,55 80,40 S130,20 160,15 S220,10 260,8 S290,7 300,7 L300,80 L0,80 Z" fill="url(#heroChartGrad)"/>
                          {/* Dot at end */}
                          <circle cx="300" cy="7" r="3" fill="#a855f7" />
                          <circle cx="300" cy="7" r="6" fill="#a855f7" fillOpacity="0.2" />
                        </svg>
                      </div>
                      <div className="flex justify-between mt-2">
                        {['Ep 1','Ep 2','Ep 3','Ep 4','Ep 5','Ep 6'].map(e => (
                          <span key={e} className="text-[8px] text-gray-600 font-mono">{e}</span>
                        ))}
                      </div>
                    </div>

                    {/* Recent jobs */}
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex flex-col gap-2 overflow-hidden">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">Recent Jobs</p>
                      {[
                        { name: 'llama3-finetune', status: 'running', color: 'text-green-400', dot: 'bg-green-400' },
                        { name: 'gpt2-sentiment', status: 'done', color: 'text-gray-400', dot: 'bg-gray-600' },
                        { name: 'clip-vision-v2', status: 'queued', color: 'text-yellow-400', dot: 'bg-yellow-400' },
                        { name: 'bert-ner-run', status: 'done', color: 'text-gray-400', dot: 'bg-gray-600' },
                      ].map((job) => (
                        <div key={job.name} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${job.dot} shrink-0`} />
                            <span className="text-[9px] text-gray-300 font-mono truncate max-w-[85px]">{job.name}</span>
                          </div>
                          <span className={`text-[8px] font-mono ${job.color}`}>{job.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-12">Empowering teams at</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-30 grayscale contrast-125">
            <div className="text-2xl font-black italic">TECHFLOW</div>
            <div className="text-2xl font-black italic">NEURALIS</div>
            <div className="text-2xl font-black italic">OPTIX</div>
            <div className="text-2xl font-black italic">VOID.AI</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <p className="text-xs font-mono uppercase tracking-widest text-purple-400 mb-3">What's inside</p>
            <h2 className="text-4xl font-bold mb-4">Everything you need to ship AI</h2>
            <p className="text-gray-400 max-w-xl mx-auto">A complete ecosystem for the modern AI engineer. Every feature below is either live in your dashboard or coming very soon.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Dataset Engine',
                desc: 'Upload, version, and auto-clean training data at scale.',
                icon: Database,
                status: 'live',
                href: '/dashboard/datasets',
                color: 'from-blue-500/10 to-transparent',
                border: 'hover:border-blue-500/30',
                iconColor: 'text-blue-400',
                iconBg: 'bg-blue-500/10 border-blue-500/20',
                bullets: ['CSV / JSON / Parquet upload', 'Auto schema validation & cleaning', 'Dataset versioning with diff viewer', 'Train/validation auto-split'],
              },
              {
                title: 'Training Orchestrator',
                desc: 'Fine-tune LLMs with LoRA, visualize loss curves in real time.',
                icon: Cpu,
                status: 'live',
                href: '/dashboard/training',
                color: 'from-purple-500/10 to-transparent',
                border: 'hover:border-purple-500/30',
                iconColor: 'text-purple-400',
                iconBg: 'bg-purple-500/10 border-purple-500/20',
                bullets: ['LoRA / QLoRA fine-tuning configs', 'Interactive pipeline visualizer', 'Live loss / accuracy tracking', 'Checkpoint auto-save & restore'],
              },
              {
                title: 'Model Playground',
                desc: 'Test, benchmark, and compare models side-by-side.',
                icon: MessageSquare,
                status: 'live',
                href: '/dashboard/playground',
                color: 'from-pink-500/10 to-transparent',
                border: 'hover:border-pink-500/30',
                iconColor: 'text-pink-400',
                iconBg: 'bg-pink-500/10 border-pink-500/20',
                bullets: ['Chat with any fine-tuned model', 'Side-by-side Model Arena', 'Latency & token usage telemetry', 'Confidence scoring per response'],
              },
              {
                title: 'API Deployments',
                desc: 'One-click deploy to low-latency edge endpoints with auto-scaling.',
                icon: Rocket,
                status: 'live',
                href: '/dashboard/deployments',
                color: 'from-green-500/10 to-transparent',
                border: 'hover:border-green-500/30',
                iconColor: 'text-green-400',
                iconBg: 'bg-green-500/10 border-green-500/20',
                bullets: ['Globally distributed endpoints', 'Real-time RPS & latency monitoring', 'Sleep / wake auto-scaling', 'One-click rollback'],
              },
              {
                title: 'Secure Gateway',
                desc: 'Enterprise-grade API keys with RBAC scopes and audit logs.',
                icon: Shield,
                status: 'live',
                href: '/dashboard/security',
                color: 'from-amber-500/10 to-transparent',
                border: 'hover:border-amber-500/30',
                iconColor: 'text-amber-400',
                iconBg: 'bg-amber-500/10 border-amber-500/20',
                bullets: ['Scoped API key generation', 'Per-key usage analytics', 'Instant key revocation', 'Encrypted key storage'],
              },
              {
                title: 'Team Collaboration',
                desc: 'Shared workspaces, role management, and real-time co-editing.',
                icon: Globe,
                status: 'soon',
                href: null,
                color: 'from-white/5 to-transparent',
                border: 'hover:border-white/10',
                iconColor: 'text-gray-500',
                iconBg: 'bg-white/5 border-white/10',
                bullets: ['Multi-user workspaces', 'Role-based access (Admin/Editor/Viewer)', 'Activity feed & audit trail', 'Shared model registry'],
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`relative glass p-7 rounded-3xl border border-white/5 ${f.border} transition-all duration-500 group bg-gradient-to-b ${f.color} flex flex-col`}
              >
                {/* Status badge */}
                <div className="absolute top-5 right-5">
                  {f.status === 'live' ? (
                    <span className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Live
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/10">
                      Coming Soon
                    </span>
                  )}
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border ${f.iconBg}`}>
                  <f.icon className={`w-6 h-6 ${f.iconColor}`} />
                </div>

                <h3 className="text-lg font-bold mb-2 text-white">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">{f.desc}</p>

                {/* Feature bullets */}
                <ul className="space-y-2 mb-6 flex-1">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-gray-500">
                      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${f.iconColor} bg-current opacity-60`} />
                      {b}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {f.href ? (
                  <Link
                    href={f.href}
                    className={`mt-auto inline-flex items-center gap-2 text-xs font-semibold ${f.iconColor} group-hover:underline`}
                  >
                    Open {f.title}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <span className="mt-auto text-xs text-gray-600 font-mono">In development</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Zap className="w-5 h-5 text-purple-400" />
            <span>Nemix</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 Nemix Infrastructure Inc. All rights reserved.</p>
          <div className="flex gap-6 text-gray-500 text-sm">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
