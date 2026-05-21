"use client";

import Link from 'next/link';
import { ArrowRight, Zap, Database, Cpu, Rocket, Shield, MessageSquare, CheckCircle, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#0a0a0b', color: '#f0f0f2' }}>

      {/* Nav */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,10,11,0.9)', backdropFilter: 'blur(12px)' }} className="fixed top-0 w-full z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-base">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#7c6af7' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            Nemix
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {['Features', 'Pricing', 'Docs', 'Blog'].map(item => (
              <a key={item} href="#" className="px-3 py-1.5 text-sm rounded-md transition-colors" style={{ color: '#8b8b99' }}
                onMouseOver={e => (e.currentTarget.style.color = '#f0f0f2')}
                onMouseOut={e => (e.currentTarget.style.color = '#8b8b99')}>
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="px-3 py-1.5 text-sm rounded-md transition-colors" style={{ color: '#8b8b99' }}>
              Sign in
            </Link>
            <Link href="/auth/register" className="px-3.5 py-1.5 text-sm font-medium rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ background: '#7c6af7' }}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-8"
              style={{ background: 'rgba(124,106,247,0.12)', border: '1px solid rgba(124,106,247,0.2)', color: '#a78bfa' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              v1.0 is live — try it free
            </div>

            <h1 className="text-5xl font-bold tracking-tight leading-tight mb-5" style={{ letterSpacing: '-0.02em' }}>
              Train and deploy
              <br />
              <span style={{ color: '#7c6af7' }}>AI models faster.</span>
            </h1>

            <p className="text-lg mb-8 leading-relaxed" style={{ color: '#8b8b99', maxWidth: '520px' }}>
              Fine-tune LLMs, manage datasets, and ship production API endpoints — all in one platform built for engineers.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: '#7c6af7' }}>
                Start building
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard/playground" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#8b8b99', background: 'rgba(255,255,255,0.03)' }}>
                View demo
              </Link>
            </div>

            <div className="flex items-center gap-6">
              {[['No credit card required', true], ['LoRA fine-tuning', true], ['Auto-scaling APIs', true]].map(([text, ok]) => (
                <div key={text as string} className="flex items-center gap-1.5 text-sm" style={{ color: '#8b8b99' }}>
                  <CheckCircle className="w-3.5 h-3.5" style={{ color: '#3dd68c' }} />
                  {text as string}
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="mt-16 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#111114' }}>
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0f0f12' }}>
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: '#e5534b' }} />
                <span className="w-3 h-3 rounded-full" style={{ background: '#f5a623' }} />
                <span className="w-3 h-3 rounded-full" style={{ background: '#3dd68c' }} />
              </div>
              <div className="mx-auto text-xs px-8 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#55555f' }}>
                nemix.app/dashboard
              </div>
            </div>

            {/* Mini dashboard */}
            <div className="flex" style={{ height: '360px' }}>
              {/* Sidebar */}
              <div className="w-48 shrink-0 flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.05)', background: '#0d0d10' }}>
                <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-5 h-5 rounded" style={{ background: '#7c6af7' }} />
                  <span className="text-xs font-semibold">Nemix</span>
                </div>
                <nav className="p-2 space-y-0.5">
                  {[
                    { label: 'Overview', active: true },
                    { label: 'Datasets' },
                    { label: 'Models' },
                    { label: 'Training' },
                    { label: 'Playground' },
                    { label: 'Deployments' },
                    { label: 'Security' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px]"
                      style={{
                        background: item.active ? 'rgba(124,106,247,0.12)' : 'transparent',
                        color: item.active ? '#a78bfa' : '#55555f',
                      }}>
                      {item.label}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Content */}
              <div className="flex-1 p-5 overflow-hidden">
                <p className="text-xs font-semibold mb-4" style={{ color: '#f0f0f2' }}>Overview</p>

                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Models', value: '12', color: '#7c6af7' },
                    { label: 'Datasets', value: '38', color: '#3dd68c' },
                    { label: 'API Calls', value: '1.2M', color: '#7c6af7' },
                    { label: 'Endpoints', value: '4', color: '#f5a623' },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg p-3" style={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[9px] mb-1" style={{ color: '#55555f' }}>{s.label}</p>
                      <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg p-4" style={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] mb-3" style={{ color: '#55555f' }}>Training loss · Last run</p>
                  <svg viewBox="0 0 320 70" className="w-full h-14">
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c6af7" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#7c6af7" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[0, 20, 40, 60].map(y => (
                      <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    ))}
                    <path d="M0,62 C40,55 80,42 120,28 S200,12 260,8 S300,7 320,6.5" fill="none" stroke="#7c6af7" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M0,62 C40,55 80,42 120,28 S200,12 260,8 S300,7 320,6.5 L320,70 L0,70Z" fill="url(#g)" />
                    <circle cx="320" cy="6.5" r="2.5" fill="#7c6af7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos bar */}
      <section className="py-10 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs mb-6 uppercase tracking-widest" style={{ color: '#55555f' }}>Used by engineering teams at</p>
          <div className="flex flex-wrap justify-center gap-8">
            {['Techflow', 'Neuralis', 'Optix', 'Void AI', 'Synthos', 'DataVex'].map(name => (
              <span key={name} className="text-sm font-semibold" style={{ color: '#2e2e35' }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#7c6af7' }}>Platform</p>
            <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ letterSpacing: '-0.02em' }}>
              Everything in one place
            </h2>
            <p className="text-base" style={{ color: '#8b8b99', maxWidth: '460px' }}>
              From raw data to deployed API. No stitching tools together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Dataset Engine',
                desc: 'Upload, version, and auto-clean training data.',
                icon: Database,
                status: 'live',
                href: '/dashboard/datasets',
                bullets: ['CSV / JSON / Parquet support', 'Auto validation & cleaning', 'Train/val split', 'Version history'],
              },
              {
                title: 'Training Orchestrator',
                desc: 'Fine-tune models with LoRA. Watch loss curves live.',
                icon: Cpu,
                status: 'live',
                href: '/dashboard/training',
                bullets: ['LoRA & QLoRA configs', 'Live loss/accuracy chart', 'Pipeline visualizer', 'Checkpoint restore'],
              },
              {
                title: 'Model Playground',
                desc: 'Chat with your models. Compare them side by side.',
                icon: MessageSquare,
                status: 'live',
                href: '/dashboard/playground',
                bullets: ['Chat interface', 'Side-by-side Arena', 'Token & latency stats', 'Confidence scoring'],
              },
              {
                title: 'API Deployments',
                desc: 'One click to a live inference endpoint.',
                icon: Rocket,
                status: 'live',
                href: '/dashboard/deployments',
                bullets: ['Global edge endpoints', 'RPS & latency metrics', 'Auto sleep/wake', 'Instant rollback'],
              },
              {
                title: 'Secure Gateway',
                desc: 'API keys with scoped permissions and audit logs.',
                icon: Shield,
                status: 'live',
                href: '/dashboard/security',
                bullets: ['Scoped key generation', 'Per-key analytics', 'One-click revoke', 'Encrypted storage'],
              },
              {
                title: 'Team Workspace',
                desc: 'Shared environments and role-based access.',
                icon: Zap,
                status: 'soon',
                href: null,
                bullets: ['Multi-user access', 'Admin/Editor/Viewer', 'Shared model registry', 'Activity log'],
              },
            ].map((f) => (
              <div key={f.title} className="rounded-xl p-5 flex flex-col transition-colors group"
                style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>

                <div className="flex items-start justify-between mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.15)' }}>
                    <f.icon className="w-4 h-4" style={{ color: '#7c6af7' }} />
                  </div>
                  {f.status === 'live' ? (
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full" style={{ background: 'rgba(61,214,140,0.1)', color: '#3dd68c', border: '1px solid rgba(61,214,140,0.2)' }}>
                      Live
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: '#55555f', border: '1px solid rgba(255,255,255,0.08)' }}>
                      Soon
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: '#8b8b99' }}>{f.desc}</p>

                <ul className="space-y-1.5 mb-5 flex-1">
                  {f.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2 text-xs" style={{ color: '#55555f' }}>
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ background: '#7c6af7' }} />
                      {b}
                    </li>
                  ))}
                </ul>

                {f.href ? (
                  <Link href={f.href} className="flex items-center gap-1 text-xs font-medium transition-colors mt-auto"
                    style={{ color: '#7c6af7' }}>
                    Open {f.title} <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="text-xs mt-auto" style={{ color: '#2e2e35' }}>In development</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
            Ready to ship your first model?
          </h2>
          <p className="mb-8" style={{ color: '#8b8b99' }}>
            Join 500+ engineers using Nemix. Free to start, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: '#7c6af7' }}>
              Create free account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#8b8b99', background: 'rgba(255,255,255,0.02)' }}>
              View dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2">
              <div className="flex items-center gap-2 font-semibold mb-3">
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: '#7c6af7' }}>
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                Nemix
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#55555f', maxWidth: '220px' }}>
                AI training infrastructure for modern engineering teams.
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#3dd68c' }} />
                <span className="text-xs" style={{ color: '#55555f' }}>All systems operational</span>
              </div>
            </div>
            {[
              { title: 'Product', links: ['Dashboard', 'Training', 'Deployments', 'Security'] },
              { title: 'Developers', links: ['Docs', 'API Reference', 'Status', 'Changelog'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Privacy'] },
            ].map(col => (
              <div key={col.title}>
                <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: '#8b8b99' }}>{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm transition-colors" style={{ color: '#55555f' }}
                        onMouseOver={e => (e.currentTarget.style.color = '#8b8b99')}
                        onMouseOut={e => (e.currentTarget.style.color = '#55555f')}>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
            <p className="text-xs" style={{ color: '#2e2e35' }}>© 2026 Nemix Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
