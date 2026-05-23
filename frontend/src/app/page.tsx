"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  ArrowRight, Zap, Database, Cpu, Rocket, Shield, MessageSquare,
  Check, BarChart2, BookOpen, FlaskConical, Sun, Moon, Star,
  Users, Globe, ChevronRight, Play, MessageCircle,
  GitBranch, Link2, Activity, Clock, Lock, Calculator, Server
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";

// ─── Constants ──────────────────────────────────────────────────────
const STATS = [
  { value: "50K+",  label: "Models trained",      icon: Cpu      },
  { value: "1.8B",  label: "API calls served",    icon: Activity },
  { value: "12K+",  label: "Developers active",   icon: Users    },
  { value: "99.99%", label: "Uptime SLA",          icon: Clock    },
];

const TESTIMONIALS = [
  {
    quote: "Nemix cut our model fine-tuning time from weeks to just an afternoon. Their auto-scaling endpoints are incredibly fast and low latency.",
    name: "Sarah Chen",    role: "ML Lead @ Vercel",        avatar: "SC", color: "var(--md-primary)"
  },
  {
    quote: "We trained a customized BERT encoder on our private logs and deployed the API gateway in 10 minutes. The ROI was immediate.",
    name: "James Wilson",  role: "CTO @ Notion",            avatar: "JW", color: "var(--md-success)"
  },
  {
    quote: "The visual training charts and edge router deployments are awesome. Standardizing on Nemix saved us $15k/mo in AWS server costs.",
    name: "Amira Patel",   role: "AI Architect @ Stripe",   avatar: "AP", color: "var(--md-warning)"
  },
  {
    quote: "Best-in-class fine-tuning UX. The side-by-side Playground Arena lets our team review models before going to production.",
    name: "Tom Bradley",   role: "Principal Eng @ Linear",  avatar: "TB", color: "var(--md-error)"
  },
  {
    quote: "Auto-scaling Warm Pods and scoped deployment tokens made SOC 2 compliance a breeze for our enterprise security audits.",
    name: "Maya Rodriguez", role: "Platform Eng @ Figma",   avatar: "MR", color: "var(--md-primary)"
  },
  {
    quote: "Dataset split engines and live loss monitoring are beautifully configured. No more messy Jupyter notebooks.",
    name: "Alex Kim",      role: "Research Eng @ Anthropic", avatar: "AK", color: "var(--md-success)"
  },
];

const FEATURES = [
  {
    title: "Dataset Splitting Engine",
    icon: Database,
    desc: "Upload CSV, JSON, or Parquet. Auto-format schemas, version datasets, and split train/val blocks in a single click.",
    bullets: ["Automatic Schema Detection", "Dataset Version Control", "Train/Val Custom Splits", "JSONL drag & drop validation"],
    href: "/dashboard/datasets"
  },
  {
    title: "Training Orchestrator",
    icon: Cpu,
    desc: "Execute LoRA and QLoRA training on high-performance GPUs with active loss progression metrics and automatic checkpointing.",
    bullets: ["Zero-Setup LoRA & QLoRA", "Live Epoch Loss Tracking", "Automatic Checkpoints", "Base Model Hub Integration"],
    href: "/dashboard/training"
  },
  {
    title: "Model Playground Arena",
    icon: MessageSquare,
    desc: "Compare models side-by-side. Calculate exact token consumption, latency response profiles, and output quality instantly.",
    bullets: ["Double-Pane comparison", "Accurate token meters", "Latency breakdown ms", "Prompt library history"],
    href: "/dashboard/playground"
  },
  {
    title: "Intelligent API Gateways",
    icon: Rocket,
    desc: "Deploy fine-tuned models to globally distributed endpoints. Configurable as individual Inference endpoints or Edge Routers.",
    bullets: ["One-click deploy CDN", "Intelligent Edge Routers", "Automatic sleep/wake", "Usage logging metrics"],
    href: "/dashboard/deployments"
  },
  {
    title: "Rigorous Evaluations",
    icon: FlaskConical,
    desc: "Run structured benchmarks for toxicity, hallucination rates, contextual accuracy, and speed profiles automatically.",
    bullets: ["4 evaluation categories", "Comprehensive metrics", "Historical run comparisons", "Toxicity guardrails"],
    href: "/dashboard/evaluations"
  },
  {
    title: "Comprehensive Analytics",
    icon: BarChart2,
    desc: "Trace requests volumes, token costs, error rates, and peak usage periods using premium interactive dashboard layouts.",
    bullets: ["7d / 30d usage traces", "Per-model telemetry", "Overage expense calculators", "Response code splits"],
    href: "/dashboard/analytics"
  },
];

const FAQS = [
  { q: "How does Nemix keep training costs so low?", a: "We run on a serverless GPU scheduling matrix. Unlike AWS where you rent an entire idle machine, Nemix spins up high-performance NVIDIA L4 chips only when training begins, billing you to the exact millisecond." },
  { q: "Can I deploy custom open-source models?", a: "Absolutely. We support LLaMA 3, Mistral 7B, GPT-2, BERT, RoBERTa, Whisper, CLIP, and standard Hugging Face model imports right out of the box." },
  { q: "How does the Intelligent Edge Router compare to standard endpoints?", a: "Standard endpoints route traffic directly to a single deployed container. Edge Routers act as a smart gateway, combining multiple models with fallback rules, token limiters, and smart semantic load balancing." },
  { q: "Is my training data secure?", a: "Yes. All uploaded datasets and trained weights are isolated in private, SOC 2 compliant database vaults. We never share your data or use it to train global models." },
  { q: "Do you offer annual discounts?", a: "Yes. Billed annually subscriptions receive a 20% discount on both Developer Pro ($39/mo) and Business Enterprise ($159/mo) plan tiers." },
];

const LOGOS = ["Vercel", "Stripe", "Linear", "Notion", "Figma", "Anthropic", "GitHub", "Cloudflare"];

export default function LandingPage() {
  const { theme, toggle } = useTheme();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // ROI Cost Calculator inputs
  const [sliderGpuHours, setSliderGpuHours] = useState(40);
  const [sliderApiCalls, setSliderApiCalls] = useState(250); // in thousands (250k)

  // Calculate infrastructure ROI comparison
  const roiMath = useMemo(() => {
    // AWS Costs: always-on dedicated A10G GPU ($1.20/hr * 730 hours/mo = $876/mo) + engineers + storage
    const awsServer = 876;
    const awsStorage = 35;
    const awsOpsCost = 450; // DevOps overhead hours equivalent
    const totalAws = awsServer + awsStorage + awsOpsCost;

    // Nemix Costs: subscription base + overage calculations
    const isAnnual = billingPeriod === 'annual';
    let basePrice = isAnnual ? 39 : 49;
    let includedGpu = 20;
    let includedApi = 100; // 100k

    // Overages rates: $0.45 per GPU hr, $0.001 per 1k API calls
    const overageGpu = Math.max(0, sliderGpuHours - includedGpu) * 0.45;
    const overageApi = Math.max(0, sliderApiCalls - includedApi) * 0.001;

    const totalNemix = basePrice + overageGpu + overageApi;
    const savings = Math.max(totalAws - totalNemix, 0);
    const savingsPercent = (savings / totalAws) * 100;

    return { totalAws, totalNemix, savings, savingsPercent };
  }, [sliderGpuHours, sliderApiCalls, billingPeriod]);

  const W = { maxWidth: "1140px", margin: "0 auto", padding: "0 24px" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--md-surface)", color: "var(--md-on-surface)", transition: "background 0.3s, color 0.3s" }}>

      {/* ── Navbar ───────────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid var(--md-outline)", background: "var(--md-surface-1)", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
        <div style={{ ...W, height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <BrandLogo size={28} />
            <span className="brand-logotype-adaptive" style={{ fontSize: "21px", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--md-on-surface)" }}>Nemix</span>
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: "6px" }} className="hidden sm:flex">
            <a href="#features" style={{ padding: "8px 12px", fontSize: "14px", color: "var(--md-on-surface-var)", borderRadius: "8px", textDecoration: "none", fontWeight: 600 }}>Features</a>
            <a href="#roi" style={{ padding: "8px 12px", fontSize: "14px", color: "var(--md-on-surface-var)", borderRadius: "8px", textDecoration: "none", fontWeight: 600 }}>Savings ROI</a>
            <a href="#pricing" style={{ padding: "8px 12px", fontSize: "14px", color: "var(--md-on-surface-var)", borderRadius: "8px", textDecoration: "none", fontWeight: 600 }}>Pricing</a>
            <a href="#faq" style={{ padding: "8px 12px", fontSize: "14px", color: "var(--md-on-surface-var)", borderRadius: "8px", textDecoration: "none", fontWeight: 600 }}>FAQ</a>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={toggle} style={{ width: "36px", height: "36px", borderRadius: "10px", background: "transparent", border: "1px solid var(--md-outline)", color: "var(--md-on-surface-var)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {theme === "dark" ? <Sun style={{ width: "16px", height: "16px" }} /> : <Moon style={{ width: "16px", height: "16px" }} />}
            </button>
            <Link href="/auth/login" style={{ padding: "8px 16px", fontSize: "14px", color: "var(--md-on-surface-var)", textDecoration: "none", borderRadius: "10px", fontWeight: 600 }}>
              Sign in
            </Link>
            <Link href="/auth/register" style={{ padding: "10px 22px", fontSize: "14px", fontWeight: 700, color: "var(--md-on-primary)", background: "var(--md-primary)", borderRadius: "12px", textDecoration: "none", boxShadow: "var(--shadow-1)", transition: "opacity 0.2s" }}>
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section style={{ ...W, padding: "72px 24px 64px" }} className="relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: "var(--md-primary)" }} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-6">
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "100px", background: "var(--md-primary-container)", color: "var(--md-primary)", fontSize: "12px", fontWeight: 700, border: "1px solid var(--md-outline)" }}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              SaaS MLOps Suite — Deploying models globally
            </div>
            <h1 style={{ fontSize: "clamp(34px, 5.5vw, 56px)", fontWeight: 950, lineHeight: 1.05, letterSpacing: "-0.04em", color: "var(--md-on-surface)" }}>
              Train & fine-tune <br />
              <span style={{ color: "var(--md-primary)" }}>your own LLMs</span> <br />
              without server headache.
            </h1>
            <p style={{ fontSize: "16px", lineHeight: 1.6, color: "var(--md-on-surface-var)", maxWidth: "480px" }}>
              Upload datasets, monitor loss curves, benchmark against hallucination parameters, and launch edge gateways with automated load balancing.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/register" className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
                style={{ background: "var(--md-primary)", color: "var(--md-on-primary)" }}>
                Start Building Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard/playground" className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm border transition-colors hover:bg-[var(--md-surface-2)]"
                style={{ border: "1px solid var(--md-outline)", color: "var(--md-on-surface)", background: "transparent" }}>
                <Play className="w-4.5 h-4.5" /> Test Playground
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4">
              {["No credit card required", "Dedicated L4 & H100 pods", "Intelligent Edge Routers", "Auto-scaling parameters"].map(feat => (
                <div key={feat} className="flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--md-on-surface-var)" }}>
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  {feat}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Dashboard Mockup */}
          <div className="rounded-3xl p-1 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, var(--md-primary) 0%, transparent 100%)" }}>
            <div className="rounded-3xl overflow-hidden p-4 space-y-4" style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)" }}>
              {/* Window Header */}
              <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--md-outline-var)" }}>
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-auto text-[10px] font-mono px-3 py-1 rounded bg-neutral-900 text-purple-400"
                  style={{ background: "var(--md-surface-2)" }}>
                  https://nemix.ai/dashboard
                </span>
              </div>

              {/* Mock Dashboard content */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Active Deployments", val: "14", color: "var(--md-primary)" },
                  { label: "Total Requests (7d)", val: "1.24M", color: "var(--md-success)" },
                  { label: "Overage Est.", val: "$0.37", color: "var(--md-warning)" }
                ].map(w => (
                  <div key={w.label} className="p-3 rounded-xl" style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline-var)" }}>
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--md-on-surface-var)" }}>{w.label}</p>
                    <p className="text-xl font-black mt-1" style={{ color: w.color }}>{w.val}</p>
                  </div>
                ))}
              </div>

              {/* Training curves preview */}
              <div className="p-3 rounded-xl space-y-2" style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline-var)" }}>
                <div className="flex justify-between text-[10px] font-bold" style={{ color: "var(--md-on-surface-var)" }}>
                  <span>Fine-Tuning Loss Curve</span>
                  <span className="text-green-400">Epoch 4/5 · Loss: 0.124</span>
                </div>
                <svg viewBox="0 0 340 50" style={{ width: "100%", height: "40px" }}>
                  <defs>
                    <linearGradient id="heroCurve" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--md-primary)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--md-primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,45 C40,38 85,25 140,12 S230,4 340,3" fill="none" stroke="var(--md-primary)" strokeWidth="2.5" />
                  <path d="M0,45 C40,38 85,25 140,12 S230,4 340,3 L340,50 L0,50Z" fill="url(#heroCurve)" />
                </svg>
              </div>

              {/* Active models row */}
              <div className="flex items-center justify-between text-[11px] font-semibold" style={{ color: "var(--md-on-surface-var)" }}>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Edge Gateway online</span>
                <span>Active Seats: Sarah, James, Tom</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand Logos Strip ─────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--md-outline)", padding: "36px 24px", background: "var(--md-surface-1)" }}>
        <div style={{ ...W }}>
          <p className="text-[10px] font-bold tracking-widest uppercase text-center mb-6" style={{ color: "var(--md-on-surface-var)" }}>
            Empowering modern product teams worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {LOGOS.map(logo => (
              <span key={logo} className="text-base font-black tracking-tight opacity-40 hover:opacity-75 transition-opacity" style={{ color: "var(--md-on-surface-var)" }}>
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features List Section ────────────────────────────────── */}
      <section id="features" style={{ borderTop: "1px solid var(--md-outline)", padding: "80px 24px" }}>
        <div style={{ ...W }}>
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--md-primary)" }}>Full Platform</span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--md-on-surface)" }}>
              No Glue Code. No Server Maintenance.
            </h2>
            <p className="text-sm" style={{ color: "var(--md-on-surface-var)" }}>
              Go from raw JSONL file to globally low-latency serving edge routers inside an hour.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-3xl p-6 flex flex-col justify-between transition-all hover:scale-[1.01]"
                style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)" }}>
                <div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "var(--md-primary-container)" }}>
                    <f.icon className="w-6 h-6" style={{ color: "var(--md-primary)" }} />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "var(--md-on-surface)" }}>{f.title}</h3>
                  <p className="text-xs leading-relaxed mb-6" style={{ color: "var(--md-on-surface-var)" }}>{f.desc}</p>
                </div>
                <ul className="space-y-2 border-t pt-4" style={{ borderColor: "var(--md-outline-var)" }}>
                  {f.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2 text-[11px] font-semibold" style={{ color: "var(--md-on-surface-var)" }}>
                      <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROI Infrastructure Savings Calculator Section (Urdu request) ─── */}
      <section id="roi" style={{ borderTop: "1px solid var(--md-outline)", padding: "80px 24px", background: "var(--md-surface-1)" }}>
        <div style={{ ...W }}>
          <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-green-500">Infrastructure Math</span>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: "var(--md-on-surface)" }}>
              Calculate Your AWS Savings
            </h2>
            <p className="text-xs" style={{ color: "var(--md-on-surface-var)" }}>
              Traditional cloud nodes cost thousands per month because they sit idle. Slide limits below to check how much you save using Nemix serverless queues.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Inputs Sliders */}
            <div className="p-6 rounded-3xl space-y-6" style={{ background: "var(--md-surface)", border: "1px solid var(--md-outline)" }}>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold" style={{ color: "var(--md-on-surface)" }}>
                  <span>GPU Training cycles per month</span>
                  <span style={{ color: "var(--md-primary)" }}>{sliderGpuHours} Hours</span>
                </div>
                <input type="range" min="5" max="200" value={sliderGpuHours}
                  onChange={e => setSliderGpuHours(parseInt(e.target.value))}
                  className="w-full accent-purple-600" />
                <p className="text-[10px]" style={{ color: "var(--md-on-surface-var)" }}>
                  Dedicated instance on AWS SageMaker (g5.2xlarge L4) runs constantly at $1.20/hr.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold" style={{ color: "var(--md-on-surface)" }}>
                  <span>Inference API requests per month</span>
                  <span style={{ color: "var(--md-primary)" }}>{(sliderApiCalls * 1000).toLocaleString()} Calls</span>
                </div>
                <input type="range" min="10" max="2000" value={sliderApiCalls}
                  onChange={e => setSliderApiCalls(parseInt(e.target.value))}
                  className="w-full accent-purple-600" />
                <p className="text-[10px]" style={{ color: "var(--md-on-surface-var)" }}>
                  Equivalent to ~(slider * 1,000) inference queries. Standard cost $0.001 per 1K calls.
                </p>
              </div>
            </div>

            {/* Right: Comparative calculations output */}
            <div className="p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[300px]"
              style={{ background: "var(--md-primary-container)", border: "2px dashed var(--md-primary)" }}>
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase bg-green-500 text-white px-2 py-0.5 rounded animate-pulse">
                  Save {(roiMath.savingsPercent).toFixed(0)}% Instantly
                </span>
                <h3 className="text-2xl font-black mt-2" style={{ color: "var(--md-on-surface)" }}>
                  Save ${roiMath.savings.toFixed(0)} every month.
                </h3>
                <p className="text-xs mt-1" style={{ color: "var(--md-on-surface-var)" }}>
                  Renting Nemix allows you to stop managing idle infrastructure pods entirely.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 border-t pt-4" style={{ borderColor: "var(--md-outline)" }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--md-on-surface-var)" }}>Always-on AWS Cost</p>
                  <p className="text-2xl font-black mt-1 text-red-500">${roiMath.totalAws.toFixed(0)}/mo</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--md-on-surface-var)" }}>Nemix Serverless Cost</p>
                  <p className="text-2xl font-black mt-1 text-green-500">${roiMath.totalNemix.toFixed(0)}/mo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Grid ─────────────────────────────────────────── */}
      <section id="pricing" style={{ borderTop: "1px solid var(--md-outline)", padding: "80px 24px" }}>
        <div style={{ ...W }}>
          <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--md-primary)" }}>Simple Pricing</span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--md-on-surface)" }}>
              Fair pricing that scales with demand
            </h2>
            <p className="text-sm" style={{ color: "var(--md-on-surface-var)" }}>
              No credit card required to start sandbox mode. Change tier levels or cancel anytime.
            </p>

            {/* Interactive Billing Period Toggle */}
            <div className="flex justify-center pt-4">
              <div className="flex p-1 rounded-xl" style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)" }}>
                <button onClick={() => setBillingPeriod('monthly')}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all"
                  style={{
                    background: billingPeriod === 'monthly' ? "var(--md-primary)" : "transparent",
                    color: billingPeriod === 'monthly' ? "var(--md-on-primary)" : "var(--md-on-surface-var)"
                  }}>
                  Billed Monthly
                </button>
                <button onClick={() => setBillingPeriod('annual')}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                  style={{
                    background: billingPeriod === 'annual' ? "var(--md-primary)" : "transparent",
                    color: billingPeriod === 'annual' ? "var(--md-on-primary)" : "var(--md-on-surface-var)"
                  }}>
                  Billed Annually
                  <span className="text-[9px] font-black bg-green-500 text-white px-1.5 py-0.5 rounded leading-none">
                    -20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {[
              {
                name: "Free Sandbox",
                monthlyPrice: 0,
                annualPrice: 0,
                color: "var(--md-on-surface-var)",
                desc: "Great for testing base configurations and sandbox API calls.",
                features: ["1,000 API calls per month", "1 GB dataset storage capacity", "1 GPU hour of training per month", "Community forum support", "Playground arena testing"],
                cta: "Start free sandbox",
                popular: false,
              },
              {
                name: "Developer Pro",
                monthlyPrice: 49,
                annualPrice: 39,
                color: "var(--md-primary)",
                desc: "Engineered for startup developers launching live applications.",
                features: ["100K API calls per month", "20 GB dataset storage capacity", "20 GPU training hours included", "Priority email assistance", "Dedicated NVIDIA L4 endpoints", "Custom domains integration"],
                cta: "Unlock developer pro",
                popular: true,
              },
              {
                name: "Business Enterprise",
                monthlyPrice: 199,
                annualPrice: 159,
                color: "var(--md-success)",
                desc: "Configured for scaling engineering groups with SLA demands.",
                features: ["5,000,000 API calls per month", "100 GB dataset storage capacity", "100 GPU training hours included", "24/7 dedicated engineering SLA", "Intelligent Edge Router gateways", "10 team member seats"],
                cta: "Contact enterprise support",
                popular: false,
              }
            ].map(plan => {
              const currentPrice = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
              return (
                <div key={plan.name} className="rounded-3xl p-6 flex flex-col justify-between min-h-[460px] relative transition-all hover:scale-[1.01]"
                  style={{
                    background: "var(--md-surface-1)",
                    border: plan.popular ? "2.5px solid var(--md-primary)" : "1px solid var(--md-outline)",
                    boxShadow: plan.popular ? "var(--shadow-3)" : "var(--shadow-1)"
                  }}>
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-black bg-purple-600 text-white px-3 py-1 rounded-full whitespace-nowrap">
                      RECOMMENDED FOR STARTUPS
                    </span>
                  )}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--md-on-surface-var)" }}>{plan.name}</p>
                    <p className="text-3xl font-black mt-2" style={{ color: plan.color }}>
                      ${currentPrice}
                      <span className="text-xs font-normal" style={{ color: "var(--md-on-surface-var)" }}>/mo</span>
                    </p>
                    <p className="text-xs mt-2" style={{ color: "var(--md-on-surface-var)" }}>{plan.desc}</p>
                  </div>

                  <Link href="/auth/register" className="w-full text-center py-2.5 rounded-xl font-bold text-xs mt-6 transition-all hover:opacity-90 block"
                    style={{
                      background: plan.popular ? "var(--md-primary)" : "transparent",
                      color: plan.popular ? "var(--md-on-primary)" : "var(--md-on-surface)",
                      border: plan.popular ? "none" : "1px solid var(--md-outline)"
                    }}>
                    {plan.cta}
                  </Link>

                  <ul className="space-y-2 border-t mt-6 pt-4" style={{ borderColor: "var(--md-outline-var)" }}>
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "var(--md-on-surface-var)" }}>
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ──────────────────────────────────────────── */}
      <section id="faq" style={{ borderTop: "1px solid var(--md-outline)", padding: "80px 24px", background: "var(--md-surface-1)" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2 className="text-2xl font-black text-center mb-8" style={{ color: "var(--md-on-surface)" }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--md-outline)" }}>
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-sm"
                  style={{ background: "var(--md-surface)", border: "none", cursor: "pointer", color: "var(--md-on-surface)" }}>
                  <span>{faq.q}</span>
                  <span className="text-base font-normal">{activeFaq === i ? "−" : "+"}</span>
                </button>
                {activeFaq === i && (
                  <div className="p-5 pt-0 text-xs leading-relaxed" style={{ background: "var(--md-surface)", color: "var(--md-on-surface-var)" }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--md-outline)", padding: "56px 24px 32px", background: "var(--md-surface-1)" }}>
        <div style={{ ...W }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BrandLogo size={22} />
                <span style={{ fontSize: "18px", fontWeight: 900, color: "var(--md-on-surface)" }}>Nemix</span>
              </div>
              <p className="text-xs leading-relaxed max-w-[200px]" style={{ color: "var(--md-on-surface-var)" }}>
                Automated ML fine-tuning and deployment gateways for startup software teams.
              </p>
            </div>
            {["Product", "Developers", "Company", "Legal"].map((col, ci) => (
              <div key={col}>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--md-on-surface)" }}>{col}</h4>
                <ul className="space-y-2 text-xs" style={{ color: "var(--md-on-surface-var)" }}>
                  <li><a href="#features" className="hover:underline">Features</a></li>
                  <li><a href="#pricing" className="hover:underline">Pricing</a></li>
                  <li><a href="#faq" className="hover:underline">Support FAQ</a></li>
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-6" style={{ borderColor: "var(--md-outline-var)" }}>
            <p className="text-xs" style={{ color: "var(--md-on-surface-var)" }}>© 2026 Nemix Inc. All rights reserved.</p>
            <div className="flex gap-2 text-xs" style={{ color: "var(--md-on-surface-var)" }}>
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>SOC 2 Type II · ISO 27001 Certified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
