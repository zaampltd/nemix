"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, Zap, Database, Cpu, Rocket, Shield, MessageSquare,
  Check, BarChart2, BookOpen, FlaskConical, Sun, Moon, Star,
  Users, Globe, ChevronRight, Play, MessageCircle,
  GitBranch, Link2, Activity, Clock, Lock,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { motion } from "framer-motion";

// ─── Data ──────────────────────────────────────────────────────────

const STATS = [
  { value: "50K+",  label: "Models trained",      icon: Cpu      },
  { value: "1.8B",  label: "API calls served",    icon: Activity },
  { value: "12K+",  label: "Developers",          icon: Users    },
  { value: "99.9%", label: "Uptime SLA",          icon: Clock    },
];

const TESTIMONIALS = [
  {
    quote: "Nemix cut our model deployment time from 3 weeks to 4 hours. The fine-tuning pipeline is genuinely production-grade.",
    name: "Sarah Chen",    role: "ML Lead @ Vercel",        avatar: "SC", color: "#5b5bd6",
  },
  {
    quote: "We fine-tuned a customer support model on our own data and deployed it in a single afternoon. The ROI was immediate.",
    name: "James Wilson",  role: "CTO @ Notion",            avatar: "JW", color: "#3dd68c",
  },
  {
    quote: "The evaluation suite alone is worth it. We finally have confidence our models won't hallucinate in production.",
    name: "Amira Patel",   role: "AI Engineer @ Stripe",    avatar: "AP", color: "#f59e0b",
  },
  {
    quote: "Best-in-class LLM tooling. The playground arena lets us compare models head-to-head before committing to deployment.",
    name: "Tom Bradley",   role: "Principal Eng @ Linear",  avatar: "TB", color: "#e5534b",
  },
  {
    quote: "Our latency dropped 40% after switching to Nemix endpoints. Their auto-scaling just works.",
    name: "Maya Rodriguez", role: "Platform Eng @ Figma",   avatar: "MR", color: "#8b5cf6",
  },
  {
    quote: "Dataset versioning + training pipelines all in one place. No more Jupyter notebook hell.",
    name: "Alex Kim",      role: "Research Eng @ Anthropic", avatar: "AK", color: "#0ea5e9",
  },
];

const FEATURES = [
  { title: "Dataset Engine",       icon: Database,      desc: "Upload CSV/JSON/Parquet, auto-validate, version, and split datasets with one click.",       bullets: ["Drag & drop upload", "Auto schema detection", "Version control", "Train/val splits"],     href: "/dashboard/datasets"    },
  { title: "Training Orchestrator",icon: Cpu,           desc: "LoRA fine-tuning with real-time loss curves, checkpoint management and GPU auto-selection.",  bullets: ["LoRA & QLoRA", "Live loss chart", "Checkpoint restore", "Pipeline visualizer"],  href: "/dashboard/training"    },
  { title: "Model Playground",     icon: MessageSquare, desc: "Chat with any model. Compare side-by-side in arena mode with latency and cost metrics.",      bullets: ["Real-time chat", "Side-by-side arena", "Token counting", "Latency stats"],       href: "/dashboard/playground"  },
  { title: "API Deployments",      icon: Rocket,        desc: "One-click deploy to low-latency global endpoints with auto-scaling and monitoring.",          bullets: ["Global CDN endpoints", "RPS monitoring", "Auto sleep/wake", "Rollback support"], href: "/dashboard/deployments" },
  { title: "Evaluations",          icon: FlaskConical,  desc: "Benchmark on accuracy, latency, robustness and hallucination rate with scored reports.",      bullets: ["4 benchmark types", "Live progress bar", "Score breakdown", "Run history"],      href: "/dashboard/evaluations" },
  { title: "Analytics",            icon: BarChart2,     desc: "API call volume, latency trends, and model traffic — drill down by day, week, or month.",     bullets: ["Area & bar charts", "7d/30d/90d views", "Per-model traffic", "Error rate"],      href: "/dashboard/analytics"   },
  { title: "Team Collaboration",   icon: Users,         desc: "Invite teammates with role-based access. Audit logs track every action in your workspace.",    bullets: ["Admin/Dev/Viewer roles", "Invite by email", "Permissions matrix", "Activity log"],  href: "/dashboard/team"        },
  { title: "Secure Gateway",       icon: Shield,        desc: "Scoped API keys, audit logs, 2FA, and one-click revoke — enterprise-ready security.",          bullets: ["Scoped permissions", "Usage per key", "Encrypted storage", "Revoke instantly"],   href: "/dashboard/security"    },
];

const PRICING = [
  {
    name: "Free", price: "$0", period: "/mo", color: "var(--md-on-surface-var)", popular: false,
    desc: "For personal projects and exploration.",
    features: ["1,000 API calls/mo", "1 model", "1 deployment", "Community support", "Model Playground", "Basic analytics"],
    cta: "Start for free", href: "/auth/register",
  },
  {
    name: "Pro",  price: "$49", period: "/mo", color: "var(--md-primary)", popular: true,
    desc: "For professional developers shipping real products.",
    features: ["100K API calls/mo", "10 models", "5 deployments", "Priority support", "Custom domains", "Team collaboration (3)", "Advanced evaluations", "Usage analytics"],
    cta: "Get started", href: "/auth/register",
  },
  {
    name: "Business", price: "$199", period: "/mo", color: "var(--md-success)", popular: false,
    desc: "For teams that need scale, SLA, and enterprise features.",
    features: ["5M API calls/mo", "Unlimited models", "Unlimited deployments", "24/7 dedicated support", "SLA guarantee", "Team seats (10)", "Audit logs", "SSO / SAML", "On-prem option"],
    cta: "Contact sales", href: "/auth/register",
  },
];

const LOGOS = ["Vercel", "Stripe", "Linear", "Notion", "Figma", "Anthropic", "GitHub", "Cloudflare"];

// ─── Component ─────────────────────────────────────────────────────
export default function LandingPage() {
  const { theme, toggle } = useTheme();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const FAQS = [
    { q: "How does fine-tuning work on Nemix?", a: "Upload your dataset, choose a base model (LLaMA, Mistral, BERT, etc.), configure LoRA/QLoRA parameters, and hit Train. We handle GPU scheduling, checkpointing, and loss monitoring automatically." },
    { q: "What models are supported?", a: "We support 12+ open-source models including LLaMA 3, Mistral 7B, GPT-2, BERT, DistilBERT, RoBERTa, T5, CLIP, Whisper, and Phi-3. New models are added monthly." },
    { q: "How do API deployments work?", a: "After training, click Deploy. Your model is containerized and deployed to our global edge network. You get a production HTTPS endpoint in under 60 seconds with auto-scaling built in." },
    { q: "Is my data private?", a: "Yes. Your datasets and models are isolated per workspace, encrypted at rest and in transit. We never use your data to train other models." },
    { q: "Can I cancel anytime?", a: "Absolutely. No contracts, no lock-in. Cancel from the Billing page and your plan downgrades at the end of the current billing period." },
  ];

  const W = { maxWidth: "1100px", margin: "0 auto", padding: "0 24px" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--md-surface)", color: "var(--md-on-surface)" }}>

      {/* ── Navbar ───────────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid var(--md-outline)", background: "var(--md-surface-1)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ ...W, height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <img src="/logo-simple.png" style={{ width: "26px", height: "26px", objectFit: "contain" }} alt="Nemix Logo" />
            <span className="brand-logotype-adaptive" style={{ fontSize: "20px" }}>Nemix</span>
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <Link href="/docs" style={{ padding: "7px 14px", fontSize: "14px", color: "var(--md-on-surface-var)", borderRadius: "8px", textDecoration: "none", fontWeight: 500 }}>Docs</Link>
            <Link href="/blog" style={{ padding: "7px 14px", fontSize: "14px", color: "var(--md-on-surface-var)", borderRadius: "8px", textDecoration: "none", fontWeight: 500 }}>Blog</Link>
            <a href="#pricing" style={{ padding: "7px 14px", fontSize: "14px", color: "var(--md-on-surface-var)", borderRadius: "8px", textDecoration: "none", fontWeight: 500 }}>Pricing</a>
            <a href="#features" style={{ padding: "7px 14px", fontSize: "14px", color: "var(--md-on-surface-var)", borderRadius: "8px", textDecoration: "none", fontWeight: 500 }}>Features</a>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={toggle} style={{ padding: "8px", borderRadius: "8px", background: "transparent", border: "1px solid var(--md-outline)", color: "var(--md-on-surface-var)", cursor: "pointer", display: "flex", alignItems: "center" }}>
              {theme === "dark" ? <Sun style={{ width: "15px", height: "15px" }} /> : <Moon style={{ width: "15px", height: "15px" }} />}
            </button>
            <Link href="/auth/login" style={{ padding: "8px 16px", fontSize: "14px", color: "var(--md-on-surface-var)", textDecoration: "none", borderRadius: "8px", fontWeight: 500 }}>
              Sign in
            </Link>
            <Link href="/auth/register" style={{ padding: "9px 20px", fontSize: "14px", fontWeight: 600, color: "var(--md-on-primary)", background: "var(--md-primary)", borderRadius: "100px", textDecoration: "none" }}>
              Get started free →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{ ...W, padding: "88px 24px 64px" }}>
        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "100px", background: "var(--md-primary-container)", color: "var(--md-on-primary-cont)", fontSize: "12px", fontWeight: 600, marginBottom: "28px", border: "1px solid var(--md-outline)" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--md-success)", display: "inline-block" }} />
          Now in public beta — free to start, no credit card
          <ChevronRight style={{ width: "12px", height: "12px" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>
          {/* Left */}
          <div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 58px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: "20px", color: "var(--md-on-surface)" }}>
              Train & deploy<br />
              <span style={{ color: "var(--md-primary)" }}>AI models</span><br />
              <span style={{ color: "var(--md-on-surface-var)", fontWeight: 600, fontSize: "0.85em" }}>10× faster.</span>
            </h1>
            <p style={{ fontSize: "17px", lineHeight: 1.7, color: "var(--md-on-surface-var)", marginBottom: "36px", maxWidth: "480px" }}>
              Fine-tune LLMs, manage datasets, run evaluations, and deploy production APIs — all in one platform. No infrastructure headaches.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "40px" }}>
              <Link href="/auth/register" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px", borderRadius: "100px", background: "var(--md-primary)", color: "var(--md-on-primary)", fontSize: "15px", fontWeight: 600, textDecoration: "none" }}>
                Start building free <ArrowRight style={{ width: "16px", height: "16px" }} />
              </Link>
              <Link href="/dashboard/playground" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 24px", borderRadius: "100px", fontSize: "15px", fontWeight: 500, textDecoration: "none", border: "1px solid var(--md-outline)", color: "var(--md-on-surface-var)" }}>
                <Play style={{ width: "14px", height: "14px" }} /> Live demo
              </Link>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              {["No credit card required", "LoRA fine-tuning", "Auto-scaling APIs", "Open model hub"].map(feat => (
                <div key={feat} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--md-on-surface-var)" }}>
                  <Check style={{ width: "14px", height: "14px", color: "var(--md-success)" }} />
                  {feat}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Dashboard mockup */}
          <div style={{ borderRadius: "20px", overflow: "hidden", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-3)", background: "var(--md-surface-1)" }}>
            {/* Window chrome */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderBottom: "1px solid var(--md-outline)", background: "var(--md-surface-2)" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#e5534b" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f5a623" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#3dd68c" }} />
              <div style={{ marginLeft: "auto", padding: "2px 12px", borderRadius: "6px", fontSize: "11px", background: "var(--md-surface-3)", color: "var(--md-on-surface-var)" }}>
                nemix.ai/dashboard
              </div>
            </div>
            <div style={{ display: "flex", height: "340px" }}>
              {/* Sidebar */}
              <div style={{ width: "150px", borderRight: "1px solid var(--md-outline)", padding: "12px", background: "var(--md-surface-1)", display: "flex", flexDirection: "column", gap: "2px" }}>
                {["Overview", "Datasets", "Models", "Training", "Playground", "Deployments", "Analytics", "Team"].map((item, i) => (
                  <div key={item} style={{ padding: "6px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 500, background: i === 0 ? "var(--md-primary-container)" : "transparent", color: i === 0 ? "var(--md-on-primary-cont)" : "var(--md-on-surface-var)" }}>
                    {item}
                  </div>
                ))}
              </div>
              {/* Content */}
              <div style={{ flex: 1, padding: "16px", overflow: "hidden" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, marginBottom: "12px", color: "var(--md-on-surface)" }}>Dashboard Overview</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginBottom: "12px" }}>
                  {[["Models", "12", "var(--md-primary)"], ["Datasets", "38", "var(--md-success)"], ["API Calls", "1.2M", "var(--md-primary)"], ["GPU hrs", "24.8", "var(--md-warning)"]].map(([l, v, c]) => (
                    <div key={l} style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", borderRadius: "10px", padding: "10px" }}>
                      <p style={{ fontSize: "9px", color: "var(--md-on-surface-var)", marginBottom: "4px" }}>{l}</p>
                      <p style={{ fontSize: "16px", fontWeight: 700, color: c as string }}>{v}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", borderRadius: "10px", padding: "12px" }}>
                  <p style={{ fontSize: "9px", color: "var(--md-on-surface-var)", marginBottom: "8px" }}>Training Loss · llama3-sentiment-v2</p>
                  <svg viewBox="0 0 340 50" style={{ width: "100%", height: "44px" }}>
                    <defs>
                      <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--md-primary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--md-primary)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,46 C40,40 80,30 130,18 S220,6 280,4 S320,3.5 340,3" fill="none" stroke="var(--md-primary)" strokeWidth="2" />
                    <path d="M0,46 C40,40 80,30 130,18 S220,6 280,4 S320,3.5 340,3 L340,50 L0,50Z" fill="url(#heroGrad)" />
                  </svg>
                </div>
                {/* Active team members */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px" }}>
                  <p style={{ fontSize: "9px", color: "var(--md-on-surface-var)", marginRight: "4px" }}>Active now:</p>
                  {[["SC","#5b5bd6"],["JW","#3dd68c"],["AP","#f59e0b"]].map(([i,c]) => (
                    <div key={i} style={{ width: "20px", height: "20px", borderRadius: "50%", background: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7px", fontWeight: 700, color: "#fff" }}>{i}</div>
                  ))}
                  <span style={{ fontSize: "9px", color: "var(--md-success)" }}>3 online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats / Social proof ─────────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--md-outline)", padding: "56px 24px" }}>
        <div style={{ ...W }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <s.icon style={{ width: "22px", height: "22px", color: "var(--md-primary)", margin: "0 auto 10px" }} />
                <p style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "var(--md-on-surface)", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: "13px", color: "var(--md-on-surface-var)", marginTop: "6px" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Logo strip ───────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--md-outline)", padding: "36px 24px", background: "var(--md-surface-1)" }}>
        <div style={{ ...W }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--md-on-surface-var)", textAlign: "center", marginBottom: "24px", opacity: 0.6 }}>Trusted by teams at</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "32px 48px" }}>
            {LOGOS.map(logo => (
              <span key={logo} style={{ fontSize: "15px", fontWeight: 700, color: "var(--md-on-surface-var)", opacity: 0.4, letterSpacing: "-0.02em" }}>{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" style={{ borderTop: "1px solid var(--md-outline)", padding: "80px 24px" }}>
        <div style={{ ...W }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--md-primary)", marginBottom: "10px" }}>Platform</p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "14px", color: "var(--md-on-surface)" }}>
              Everything you need to ship AI
            </h2>
            <p style={{ fontSize: "16px", color: "var(--md-on-surface-var)", maxWidth: "500px", margin: "0 auto", lineHeight: 1.6 }}>
              From raw dataset to production API endpoint — no glue code, no DevOps headaches.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
            {FEATURES.map(f => (
              <Link key={f.title} href={f.href} style={{ textDecoration: "none" }}>
                <div style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", borderRadius: "20px", padding: "22px", height: "100%", boxShadow: "var(--shadow-1)", display: "flex", flexDirection: "column", transition: "box-shadow 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "var(--md-primary-container)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <f.icon style={{ width: "18px", height: "18px", color: "var(--md-on-primary-cont)" }} />
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 600, padding: "3px 9px", borderRadius: "100px", background: "var(--md-success-cont)", color: "var(--md-success)" }}>Live</span>
                  </div>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "7px", color: "var(--md-on-surface)" }}>{f.title}</h3>
                  <p style={{ fontSize: "13px", color: "var(--md-on-surface-var)", lineHeight: 1.55, marginBottom: "14px", flex: 1 }}>{f.desc}</p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {f.bullets.map(b => (
                      <li key={b} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--md-on-surface-var)" }}>
                        <Check style={{ width: "12px", height: "12px", color: "var(--md-primary)", flexShrink: 0 }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--md-outline)", padding: "80px 24px", background: "var(--md-surface-1)" }}>
        <div style={{ ...W }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--md-primary)", marginBottom: "10px" }}>Wall of love</p>
            <h2 style={{ fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--md-on-surface)" }}>
              Loved by AI engineers worldwide
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: "var(--md-surface)", border: "1px solid var(--md-outline)", borderRadius: "20px", padding: "24px", boxShadow: "var(--shadow-1)" }}>
                {/* Stars */}
                <div style={{ display: "flex", gap: "3px", marginBottom: "14px" }}>
                  {[...Array(5)].map((_, si) => <Star key={si} style={{ width: "14px", height: "14px", color: "#f5a623", fill: "#f5a623" }} />)}
                </div>
                <p style={{ fontSize: "14px", lineHeight: 1.65, color: "var(--md-on-surface)", marginBottom: "20px" }}>"{t.quote}"</p>
                {/* Avatar row */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: t.color + "22", border: `2px solid ${t.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", color: t.color, flexShrink: 0 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)" }}>{t.name}</p>
                    <p style={{ fontSize: "11px", color: "var(--md-on-surface-var)" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <section id="pricing" style={{ borderTop: "1px solid var(--md-outline)", padding: "80px 24px" }}>
        <div style={{ ...W }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--md-primary)", marginBottom: "10px" }}>Pricing</p>
            <h2 style={{ fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "12px", color: "var(--md-on-surface)" }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: "15px", color: "var(--md-on-surface-var)" }}>Start free. Scale as you grow. Cancel anytime.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", alignItems: "start" }}>
            {PRICING.map(plan => (
              <div key={plan.name} style={{
                background: "var(--md-surface-1)", border: plan.popular ? `2px solid var(--md-primary)` : "1px solid var(--md-outline)",
                borderRadius: "24px", padding: "28px", boxShadow: plan.popular ? "var(--shadow-3)" : "var(--shadow-1)", position: "relative",
              }}>
                {plan.popular && (
                  <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "var(--md-primary)", color: "var(--md-on-primary)", fontSize: "10px", fontWeight: 700, padding: "4px 14px", borderRadius: "100px", whiteSpace: "nowrap" }}>
                    MOST POPULAR
                  </div>
                )}
                <p style={{ fontSize: "14px", fontWeight: 700, color: plan.color, marginBottom: "4px" }}>{plan.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "38px", fontWeight: 800, color: "var(--md-on-surface)", letterSpacing: "-0.03em" }}>{plan.price}</span>
                  <span style={{ fontSize: "13px", color: "var(--md-on-surface-var)" }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--md-on-surface-var)", marginBottom: "20px", lineHeight: 1.5 }}>{plan.desc}</p>
                <Link href={plan.href} style={{
                  display: "block", width: "100%", padding: "11px 0", borderRadius: "12px", textAlign: "center",
                  fontSize: "14px", fontWeight: 600, textDecoration: "none", marginBottom: "20px",
                  background: plan.popular ? "var(--md-primary)" : "transparent",
                  color: plan.popular ? "var(--md-on-primary)" : "var(--md-on-surface)",
                  border: plan.popular ? "none" : "1px solid var(--md-outline)",
                }}>
                  {plan.cta}
                </Link>
                <ul style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--md-on-surface-var)" }}>
                      <Check style={{ width: "13px", height: "13px", color: plan.color, flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: "13px", color: "var(--md-on-surface-var)", marginTop: "28px" }}>
            Need more? <Link href="/auth/register" style={{ color: "var(--md-primary)", fontWeight: 600, textDecoration: "none" }}>Talk to us →</Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--md-outline)", padding: "80px 24px", background: "var(--md-surface-1)" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--md-on-surface)" }}>Frequently asked questions</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ border: "1px solid var(--md-outline)", borderRadius: "16px", overflow: "hidden" }}>
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", background: "var(--md-surface)", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--md-on-surface)" }}>{faq.q}</span>
                  <span style={{ fontSize: "20px", color: "var(--md-on-surface-var)", fontWeight: 300, lineHeight: 1, transform: activeFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
                </button>
                {activeFaq === i && (
                  <div style={{ padding: "0 20px 18px", background: "var(--md-surface)" }}>
                    <p style={{ fontSize: "14px", color: "var(--md-on-surface-var)", lineHeight: 1.65 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--md-outline)", padding: "88px 24px" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          {/* Avatar stack */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "-8px", marginBottom: "24px" }}>
            <div style={{ display: "flex" }}>
              {[["SC","#5b5bd6"],["JW","#3dd68c"],["AP","#f59e0b"],["TB","#e5534b"],["MR","#8b5cf6"]].map(([init, c], i) => (
                <div key={init} style={{ width: "44px", height: "44px", borderRadius: "50%", background: (c as string) + "33", border: `3px solid var(--md-surface)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", color: c as string, marginLeft: i > 0 ? "-12px" : 0 }}>
                  {init}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "16px" }}>
              {[...Array(5)].map((_, i) => <Star key={i} style={{ width: "14px", height: "14px", color: "#f5a623", fill: "#f5a623" }} />)}
              <span style={{ fontSize: "13px", color: "var(--md-on-surface-var)", marginLeft: "4px" }}>4.9 / 5 from 1,200+ reviews</span>
            </div>
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "14px", color: "var(--md-on-surface)" }}>
            Ready to ship your first model?
          </h2>
          <p style={{ fontSize: "16px", color: "var(--md-on-surface-var)", marginBottom: "32px" }}>
            Free to start. Takes 2 minutes. Join 12,000+ developers already building on Nemix.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/register" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 32px", borderRadius: "100px", background: "var(--md-primary)", color: "var(--md-on-primary)", fontWeight: 600, fontSize: "15px", textDecoration: "none" }}>
              Create free account <ArrowRight style={{ width: "16px", height: "16px" }} />
            </Link>
            <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px", borderRadius: "100px", border: "1px solid var(--md-outline)", color: "var(--md-on-surface-var)", fontWeight: 500, fontSize: "15px", textDecoration: "none" }}>
              View dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--md-outline)", padding: "56px 24px 32px", background: "var(--md-surface-1)" }}>
        <div style={{ ...W }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "40px", marginBottom: "40px" }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <img src="/logo-simple.png" style={{ width: "22px", height: "22px", objectFit: "contain" }} alt="Nemix Logo" />
                <span className="brand-logotype-adaptive" style={{ fontSize: "17px" }}>Nemix</span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--md-on-surface-var)", lineHeight: 1.6, maxWidth: "240px", marginBottom: "20px" }}>
                AI training infrastructure for modern teams. Build faster, scale smarter.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                {[MessageCircle, GitBranch, Link2].map((Icon, i) => (
                  <a key={i} href="#" style={{ width: "34px", height: "34px", borderRadius: "8px", background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--md-on-surface-var)" }}>
                    <Icon style={{ width: "15px", height: "15px" }} />
                  </a>
                ))}
              </div>
            </div>
            {/* Link columns */}
            {[
              { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap", "Status"] },
              { title: "Developers", links: ["Docs", "API Reference", "SDKs", "Examples", "Discord"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Press", "Privacy", "Terms"] },
            ].map(col => (
              <div key={col.title}>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--md-on-surface-var)", marginBottom: "14px", opacity: 0.6 }}>{col.title}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {col.links.map(l => (
                    <a key={l} href="#" style={{ fontSize: "13px", color: "var(--md-on-surface-var)", textDecoration: "none" }}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--md-outline)", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ fontSize: "12px", color: "var(--md-on-surface-var)" }}>© 2026 Nemix Inc. All rights reserved.</p>
            <div style={{ display: "flex", gap: "4px" }}>
              <Lock style={{ width: "12px", height: "12px", color: "var(--md-on-surface-var)", opacity: 0.5 }} />
              <span style={{ fontSize: "11px", color: "var(--md-on-surface-var)", opacity: 0.5 }}>SOC 2 Type II · GDPR · ISO 27001</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
