"use client";
import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Zap, Database, Cpu, Rocket, Shield, MessageSquare, Check, BarChart2, BookOpen, FlaskConical, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";

export default function LandingPage() {
  const { theme, toggle } = useTheme();

  return (
    <div style={{ minHeight: "100vh", background: "var(--md-surface)", color: "var(--md-on-surface)" }}>

      {/* ── Nav ───────────────────────────────── */}
      <header style={{ borderBottom: "1px solid var(--md-outline)", background: "var(--md-surface-1)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "15px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "var(--md-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap style={{ width: "16px", height: "16px", color: "var(--md-on-primary)" }} />
            </div>
            Nemix
          </div>

          <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {["Features", "Pricing", "Docs"].map(item => (
              <a key={item} href="#" style={{ padding: "6px 14px", fontSize: "14px", color: "var(--md-on-surface-var)", borderRadius: "8px", textDecoration: "none" }}>
                {item}
              </a>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={toggle} style={{ padding: "8px", borderRadius: "8px", background: "transparent", border: "1px solid var(--md-outline)", color: "var(--md-on-surface-var)", cursor: "pointer", display: "flex", alignItems: "center" }}>
              {theme === "dark" ? <Sun style={{ width: "16px", height: "16px" }} /> : <Moon style={{ width: "16px", height: "16px" }} />}
            </button>
            <Link href="/auth/login" style={{ padding: "8px 16px", fontSize: "14px", color: "var(--md-on-surface-var)", textDecoration: "none", borderRadius: "8px" }}>
              Sign in
            </Link>
            <Link href="/auth/register" style={{ padding: "8px 18px", fontSize: "14px", fontWeight: 500, color: "var(--md-on-primary)", background: "var(--md-primary)", borderRadius: "100px", textDecoration: "none" }}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "72px 24px 56px" }}>
        <div style={{ maxWidth: "640px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "100px", background: "var(--md-primary-container)", color: "var(--md-on-primary-cont)", fontSize: "12px", fontWeight: 500, marginBottom: "24px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--md-success)", display: "inline-block" }} />
            Now in public beta — try it free
          </div>

          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.025em", marginBottom: "20px", color: "var(--md-on-surface)" }}>
            Train and deploy<br />
            <span style={{ color: "var(--md-primary)" }}>AI models faster.</span>
          </h1>

          <p style={{ fontSize: "17px", lineHeight: 1.65, color: "var(--md-on-surface-var)", marginBottom: "32px", maxWidth: "500px" }}>
            Fine-tune LLMs, manage datasets, evaluate quality, and deploy production APIs — all in one place. Built for engineers.
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "40px" }}>
            <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "100px", background: "var(--md-primary)", color: "var(--md-on-primary)", fontSize: "14px", fontWeight: 500, textDecoration: "none" }}>
              Start building <ArrowRight style={{ width: "16px", height: "16px" }} />
            </Link>
            <Link href="/dashboard/playground" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "100px", fontSize: "14px", fontWeight: 500, textDecoration: "none", border: "1px solid var(--md-outline)", color: "var(--md-on-surface-var)", background: "transparent" }}>
              View demo
            </Link>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            {["No credit card required", "LoRA fine-tuning", "Auto-scaling APIs", "Open model hub"].map(feat => (
              <div key={feat} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--md-on-surface-var)" }}>
                <Check style={{ width: "14px", height: "14px", color: "var(--md-success)" }} />
                {feat}
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard screenshot mockup */}
        <div style={{ marginTop: "56px", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-3)", background: "var(--md-surface-1)" }}>
          {/* Window chrome */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderBottom: "1px solid var(--md-outline)", background: "var(--md-surface-2)" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#e5534b" }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f5a623" }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#3dd68c" }} />
            <div style={{ marginLeft: "auto", padding: "2px 12px", borderRadius: "6px", fontSize: "11px", background: "var(--md-surface-3)", color: "var(--md-on-surface-var)" }}>
              nemix.app/dashboard
            </div>
          </div>
          {/* Mock content */}
          <div style={{ display: "flex", height: "320px" }}>
            {/* Sidebar */}
            <div style={{ width: "160px", borderRight: "1px solid var(--md-outline)", padding: "12px", background: "var(--md-surface-1)", display: "flex", flexDirection: "column", gap: "2px" }}>
              {["Overview", "Datasets", "Models", "Training", "Playground", "Model Hub", "Analytics"].map((item, i) => (
                <div key={item} style={{ padding: "6px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 500, background: i === 0 ? "var(--md-primary-container)" : "transparent", color: i === 0 ? "var(--md-on-primary-cont)" : "var(--md-on-surface-var)" }}>
                  {item}
                </div>
              ))}
            </div>
            {/* Content */}
            <div style={{ flex: 1, padding: "20px", overflow: "hidden" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "14px", color: "var(--md-on-surface)" }}>Dashboard</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
                {[["Models", "12", "var(--md-primary)"], ["Datasets", "38", "#34d399"], ["API Calls", "1.2M", "var(--md-primary)"], ["Jobs", "2", "#f59e0b"]].map(([l, v, c]) => (
                  <div key={l} style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", borderRadius: "12px", padding: "12px" }}>
                    <p style={{ fontSize: "9px", color: "var(--md-on-surface-var)", marginBottom: "4px" }}>{l}</p>
                    <p style={{ fontSize: "18px", fontWeight: 700, color: c as string }}>{v}</p>
                  </div>
                ))}
              </div>
              {/* Mini chart */}
              <div style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", borderRadius: "12px", padding: "14px" }}>
                <p style={{ fontSize: "10px", color: "var(--md-on-surface-var)", marginBottom: "10px" }}>Training Loss · Last run</p>
                <svg viewBox="0 0 400 60" style={{ width: "100%", height: "50px" }}>
                  <defs>
                    <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--md-primary)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--md-primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,55 C60,48 120,35 180,22 S290,8 360,5 S390,4.5 400,4" fill="none" stroke="var(--md-primary)" strokeWidth="2" />
                  <path d="M0,55 C60,48 120,35 180,22 S290,8 360,5 S390,4.5 400,4 L400,60 L0,60Z" fill="url(#hg)" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--md-outline)", padding: "64px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ marginBottom: "48px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--md-primary)", marginBottom: "8px" }}>Platform</p>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "12px", color: "var(--md-on-surface)" }}>
              Everything you need to ship AI
            </h2>
            <p style={{ fontSize: "15px", color: "var(--md-on-surface-var)", maxWidth: "480px" }}>
              From raw dataset to production API endpoint — no glue code required.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {[
              { title: "Dataset Engine", icon: Database, desc: "Upload CSV/JSON/Parquet, auto-validate, version, and split datasets.", href: "/dashboard/datasets", live: true, bullets: ["Drag & drop upload", "Auto schema detection", "Version control", "Train/val splits"] },
              { title: "Training Orchestrator", icon: Cpu, desc: "LoRA fine-tuning with real-time loss curves and checkpoint management.", href: "/dashboard/training", live: true, bullets: ["LoRA & QLoRA", "Live loss chart", "Checkpoint restore", "Pipeline visualizer"] },
              { title: "Model Playground", icon: MessageSquare, desc: "Chat with any model. Compare side-by-side with latency metrics.", href: "/dashboard/playground", live: true, bullets: ["Real-time chat", "Side-by-side arena", "Token counting", "Latency stats"] },
              { title: "Model Hub", icon: BookOpen, desc: "Browse 12+ open-source models and add them to your workspace instantly.", href: "/dashboard/hub", live: true, bullets: ["LLaMA, Mistral, BERT", "CLIP, Whisper, Phi-3", "One-click import", "License info"] },
              { title: "Evaluations", icon: FlaskConical, desc: "Benchmark your models on accuracy, latency, robustness and hallucination.", href: "/dashboard/evaluations", live: true, bullets: ["4 benchmark types", "Live progress bar", "Score breakdown", "Run history"] },
              { title: "Analytics", icon: BarChart2, desc: "API call volume, latency trends, and model traffic — by day, week or month.", href: "/dashboard/analytics", live: true, bullets: ["Area & bar charts", "7d/30d/90d views", "Per-model traffic", "Error rate tracking"] },
              { title: "API Deployments", icon: Rocket, desc: "One-click deploy to low-latency edge endpoints with auto scaling.", href: "/dashboard/deployments", live: true, bullets: ["Global endpoints", "RPS monitoring", "Auto sleep/wake", "Rollback support"] },
              { title: "Secure Gateway", icon: Shield, desc: "Scoped API keys, audit logs, and one-click revoke.", href: "/dashboard/security", live: true, bullets: ["Scoped permissions", "Usage per key", "Encrypted storage", "Revoke instantly"] },
            ].map(f => (
              <Link key={f.title} href={f.href} style={{ textDecoration: "none" }}>
                <div style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", borderRadius: "16px", padding: "20px", height: "100%", boxShadow: "var(--shadow-1)", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--md-primary-container)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <f.icon style={{ width: "18px", height: "18px", color: "var(--md-on-primary-cont)" }} />
                    </div>
                    {f.live && (
                      <span style={{ fontSize: "10px", fontWeight: 500, padding: "2px 8px", borderRadius: "100px", background: "var(--md-success-cont)", color: "var(--md-success)" }}>
                        Live
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "6px", color: "var(--md-on-surface)" }}>{f.title}</h3>
                  <p style={{ fontSize: "13px", color: "var(--md-on-surface-var)", lineHeight: 1.5, marginBottom: "14px", flex: 1 }}>{f.desc}</p>
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

      {/* ── CTA ───────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--md-outline)", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "520px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "12px", color: "var(--md-on-surface)" }}>
            Ready to ship your first model?
          </h2>
          <p style={{ fontSize: "15px", color: "var(--md-on-surface-var)", marginBottom: "28px" }}>
            Free to start. No credit card. Takes 2 minutes.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/register" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 28px", borderRadius: "100px", background: "var(--md-primary)", color: "var(--md-on-primary)", fontWeight: 500, fontSize: "14px", textDecoration: "none" }}>
              Create free account <ArrowRight style={{ width: "16px", height: "16px" }} />
            </Link>
            <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 28px", borderRadius: "100px", border: "1px solid var(--md-outline)", color: "var(--md-on-surface-var)", fontWeight: 500, fontSize: "14px", textDecoration: "none", background: "transparent" }}>
              View dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--md-outline)", padding: "40px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "32px", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "14px", marginBottom: "8px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "var(--md-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap style={{ width: "13px", height: "13px", color: "var(--md-on-primary)" }} />
              </div>
              Nemix
            </div>
            <p style={{ fontSize: "12px", color: "var(--md-on-surface-var)", maxWidth: "200px" }}>AI training infrastructure for modern teams.</p>
          </div>
          <div style={{ display: "flex", gap: "48px" }}>
            {[{ title: "Product", links: ["Dashboard", "Training", "Analytics", "Security"] }, { title: "Developers", links: ["Docs", "API Reference", "Status", "Changelog"] }, { title: "Company", links: ["About", "Blog", "Careers", "Privacy"] }].map(col => (
              <div key={col.title}>
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--md-on-surface-var)", marginBottom: "10px" }}>{col.title}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {col.links.map(l => (
                    <a key={l} href="#" style={{ fontSize: "13px", color: "var(--md-on-surface-var)", textDecoration: "none" }}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: "1100px", margin: "28px auto 0", paddingTop: "20px", borderTop: "1px solid var(--md-outline)" }}>
          <p style={{ fontSize: "11px", color: "var(--md-on-surface-var)" }}>© 2026 Nemix Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
