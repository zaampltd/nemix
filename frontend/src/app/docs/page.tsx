"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Zap, Search, ChevronRight, ChevronDown, Menu, X, Copy,
  CheckCircle2, ExternalLink, BookOpen, Rocket, Database,
  Cpu, Shield, Zap as ZapIcon, BarChart2, Users, Webhook,
  Key, Terminal, Play, AlertCircle, Info, Sun, Moon,
} from "lucide-react";
import { useTheme } from "@/lib/theme";

// ─── Sidebar structure ─────────────────────────────────────────────
const NAV = [
  {
    section: "Getting Started",
    icon: Play,
    items: [
      { id: "quickstart",      label: "Quickstart"             },
      { id: "installation",    label: "Installation"           },
      { id: "authentication",  label: "Authentication"         },
      { id: "first-model",     label: "Your First Fine-tune"   },
    ],
  },
  {
    section: "Datasets",
    icon: Database,
    items: [
      { id: "upload-datasets", label: "Uploading Datasets"     },
      { id: "dataset-formats", label: "Supported Formats"      },
      { id: "versioning",      label: "Dataset Versioning"     },
      { id: "preprocessing",   label: "Preprocessing & Splits" },
    ],
  },
  {
    section: "Training",
    icon: Cpu,
    items: [
      { id: "training-overview", label: "Overview"             },
      { id: "lora",              label: "LoRA Fine-tuning"     },
      { id: "qlora",             label: "QLoRA (4-bit)"        },
      { id: "hyperparams",       label: "Hyperparameters"      },
      { id: "checkpoints",       label: "Checkpoints"          },
    ],
  },
  {
    section: "Deployments",
    icon: Rocket,
    items: [
      { id: "deploy-overview",  label: "Deploy Overview"       },
      { id: "endpoints",        label: "Endpoints"             },
      { id: "autoscaling",      label: "Auto-scaling"          },
      { id: "rollbacks",        label: "Rollbacks"             },
    ],
  },
  {
    section: "API Reference",
    icon: Terminal,
    items: [
      { id: "api-auth",       label: "Authentication"          },
      { id: "api-inference",  label: "Inference"               },
      { id: "api-training",   label: "Training Jobs"           },
      { id: "api-datasets",   label: "Datasets"                },
      { id: "api-webhooks",   label: "Webhooks"                },
    ],
  },
  {
    section: "Security",
    icon: Shield,
    items: [
      { id: "api-keys",     label: "API Keys"                  },
      { id: "team-roles",   label: "Team Roles"                },
      { id: "audit-logs",   label: "Audit Logs"                },
    ],
  },
];

// ─── Doc content pages ─────────────────────────────────────────────
const DOCS: Record<string, React.ReactNode> = {
  quickstart: (
    <div>
      <div className="doc-badge">Getting Started</div>
      <h1>Quickstart</h1>
      <p className="lead">Get your first AI model trained and deployed in under 10 minutes.</p>

      <div className="callout info">
        <Info className="callout-icon" style={{ color: "var(--md-primary)" }} />
        <p>No credit card required. The free tier includes 1,000 API calls and 1 deployment.</p>
      </div>

      <h2>Step 1 — Create an account</h2>
      <p>Sign up at <a href="/auth/register">nemix.ai/register</a>. You'll be taken straight to your dashboard.</p>

      <h2>Step 2 — Upload a dataset</h2>
      <p>Navigate to <strong>Datasets → Upload</strong> and drop your CSV or JSON file. Nemix auto-detects schema and validates format.</p>
      <CodeBlock lang="bash" code={`# Or use the CLI:\nnpx nemix-cli datasets upload ./my-dataset.csv --name "My Dataset"`} />

      <h2>Step 3 — Start training</h2>
      <p>Go to <strong>Training → New Job</strong>, select your dataset and base model, then click <strong>Start Training</strong>.</p>
      <CodeBlock lang="python" code={`import nemix\n\nclient = nemix.Client(api_key="nmx_live_sk_...")\n\njob = client.training.create(\n    base_model="llama3-8b",\n    dataset_id="ds_abc123",\n    method="lora",\n    epochs=3,\n)\nprint(job.id)  # trn_xyz789`} />

      <h2>Step 4 — Deploy your model</h2>
      <p>Once training completes, click <strong>Deploy</strong>. Your endpoint is live in ~60 seconds.</p>
      <CodeBlock lang="bash" code={`curl -X POST https://api.nemix.ai/v1/ep_001/infer \\\n  -H "Authorization: Bearer nmx_live_sk_..." \\\n  -H "Content-Type: application/json" \\\n  -d '{"input": "Classify this review: Great product!"}'`} />

      <div className="callout success">
        <CheckCircle2 className="callout-icon" style={{ color: "var(--md-success)" }} />
        <p>That's it! You've trained and deployed your first model. Continue to <a href="#">Your First Fine-tune →</a></p>
      </div>
    </div>
  ),

  authentication: (
    <div>
      <div className="doc-badge">Getting Started</div>
      <h1>Authentication</h1>
      <p className="lead">All API requests must be authenticated using a Bearer token.</p>

      <h2>API Keys</h2>
      <p>Generate API keys from <strong>Settings → API Keys</strong>. Two scopes are available:</p>
      <table className="doc-table">
        <thead><tr><th>Scope</th><th>Description</th><th>Use case</th></tr></thead>
        <tbody>
          <tr><td><code>Full access</code></td><td>Read + write all resources</td><td>Backend servers</td></tr>
          <tr><td><code>Read only</code></td><td>Read resources only</td><td>Analytics dashboards</td></tr>
        </tbody>
      </table>

      <h2>Using your API key</h2>
      <p>Pass your key in the <code>Authorization</code> header:</p>
      <CodeBlock lang="bash" code={`curl https://api.nemix.ai/v1/models \\\n  -H "Authorization: Bearer nmx_live_sk_YOUR_KEY"`} />

      <CodeBlock lang="python" code={`import nemix\nclient = nemix.Client(api_key="nmx_live_sk_...")\nmodels = client.models.list()`} />

      <div className="callout warning">
        <AlertCircle className="callout-icon" style={{ color: "var(--md-warning)" }} />
        <p>Never expose your API key in client-side code or public repositories. Use environment variables.</p>
      </div>

      <h2>Environment variables</h2>
      <CodeBlock lang="bash" code={`# .env\nNEMIX_API_KEY=nmx_live_sk_YOUR_KEY\n\n# Python\nimport os, nemix\nclient = nemix.Client(api_key=os.environ["NEMIX_API_KEY"])`} />
    </div>
  ),

  lora: (
    <div>
      <div className="doc-badge">Training</div>
      <h1>LoRA Fine-tuning</h1>
      <p className="lead">Low-Rank Adaptation (LoRA) lets you fine-tune large models efficiently by training only a small number of parameters.</p>

      <h2>How LoRA works</h2>
      <p>Instead of updating all model weights, LoRA adds small trainable rank decomposition matrices to each layer. This reduces trainable parameters by up to <strong>99%</strong> while preserving model quality.</p>

      <table className="doc-table">
        <thead><tr><th>Parameter</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>rank (r)</code></td><td>16</td><td>Rank of the update matrices. Higher = more capacity.</td></tr>
          <tr><td><code>alpha</code></td><td>32</td><td>LoRA scaling factor. Usually 2× rank.</td></tr>
          <tr><td><code>dropout</code></td><td>0.05</td><td>Dropout on LoRA layers for regularization.</td></tr>
          <tr><td><code>target_modules</code></td><td>q_proj, v_proj</td><td>Which attention layers to adapt.</td></tr>
        </tbody>
      </table>

      <h2>Starting a LoRA job</h2>
      <CodeBlock lang="python" code={`job = client.training.create(\n    base_model="llama3-8b",\n    dataset_id="ds_abc123",\n    method="lora",\n    config={\n        "rank": 16,\n        "alpha": 32,\n        "dropout": 0.05,\n        "target_modules": ["q_proj", "v_proj", "k_proj", "o_proj"],\n        "epochs": 3,\n        "learning_rate": 2e-4,\n        "batch_size": 4,\n    }\n)`} />

      <h2>Supported base models</h2>
      <ul className="doc-list">
        <li>LLaMA 3 (8B, 70B)</li>
        <li>Mistral 7B, Mixtral 8×7B</li>
        <li>GPT-2 (124M, 355M, 774M, 1.5B)</li>
        <li>Phi-3 Mini (3.8B)</li>
        <li>BERT, RoBERTa, DistilBERT</li>
      </ul>

      <div className="callout info">
        <Info className="callout-icon" style={{ color: "var(--md-primary)" }} />
        <p>For very large models (&gt;30B parameters), we recommend <a href="#qlora">QLoRA</a> to reduce GPU memory usage.</p>
      </div>
    </div>
  ),

  "api-inference": (
    <div>
      <div className="doc-badge">API Reference</div>
      <h1>Inference API</h1>
      <p className="lead">Run predictions against your deployed models via a simple REST API.</p>

      <h2>POST /v1/{"{endpoint_id}"}/infer</h2>
      <table className="doc-table">
        <thead><tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>input</code></td><td>string</td><td>✅</td><td>Text input to the model</td></tr>
          <tr><td><code>max_tokens</code></td><td>integer</td><td>—</td><td>Max output tokens (default: 256)</td></tr>
          <tr><td><code>temperature</code></td><td>float</td><td>—</td><td>Sampling temperature 0–2 (default: 0.7)</td></tr>
          <tr><td><code>stream</code></td><td>boolean</td><td>—</td><td>Enable streaming response (SSE)</td></tr>
        </tbody>
      </table>

      <h2>Request</h2>
      <CodeBlock lang="bash" code={`curl -X POST https://api.nemix.ai/v1/ep_001/infer \\\n  -H "Authorization: Bearer nmx_live_sk_..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "input": "Summarize: Nemix is an AI platform...",\n    "max_tokens": 128,\n    "temperature": 0.5\n  }'`} />

      <h2>Response</h2>
      <CodeBlock lang="json" code={`{\n  "id": "inf_a1b2c3",\n  "endpoint_id": "ep_001",\n  "output": "Nemix is a platform for training and deploying AI models.",\n  "usage": {\n    "prompt_tokens": 12,\n    "completion_tokens": 11,\n    "total_tokens": 23\n  },\n  "latency_ms": 142,\n  "created_at": "2026-05-21T08:00:00Z"\n}`} />

      <h2>Streaming</h2>
      <CodeBlock lang="python" code={`stream = client.inference.stream(\n    endpoint_id="ep_001",\n    input="Tell me about LoRA",\n)\nfor chunk in stream:\n    print(chunk.delta, end="", flush=True)`} />
    </div>
  ),

  "deploy-overview": (
    <div>
      <div className="doc-badge">Deployments</div>
      <h1>Deploy Overview</h1>
      <p className="lead">Turn any trained model into a production-ready HTTPS API endpoint in under 60 seconds.</p>

      <h2>How deployments work</h2>
      <ol className="doc-list">
        <li>Select a trained model checkpoint</li>
        <li>Choose a deployment region (us-east-1, eu-west-1, ap-southeast-1)</li>
        <li>Click Deploy — Nemix containerizes and deploys automatically</li>
        <li>Receive an HTTPS endpoint URL immediately</li>
      </ol>

      <h2>Deployment states</h2>
      <table className="doc-table">
        <thead><tr><th>State</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span style={{ color: "var(--md-warning)" }}>⚡ building</span></td><td>Container is being built (~30s)</td></tr>
          <tr><td><span style={{ color: "var(--md-success)" }}>● healthy</span></td><td>Endpoint is live and accepting requests</td></tr>
          <tr><td><span style={{ color: "var(--md-on-surface-var)" }}>◌ sleeping</span></td><td>Auto-sleeping after 15 min idle (wakes in ~2s)</td></tr>
          <tr><td><span style={{ color: "var(--md-error)" }}>✕ failed</span></td><td>Build or runtime error</td></tr>
        </tbody>
      </table>

      <h2>Regions</h2>
      <table className="doc-table">
        <thead><tr><th>Region</th><th>Location</th><th>Avg cold start</th></tr></thead>
        <tbody>
          <tr><td><code>us-east-1</code></td><td>Virginia, USA</td><td>~1.2s</td></tr>
          <tr><td><code>eu-west-1</code></td><td>Dublin, Ireland</td><td>~1.4s</td></tr>
          <tr><td><code>ap-southeast-1</code></td><td>Singapore</td><td>~1.8s</td></tr>
        </tbody>
      </table>

      <div className="callout info">
        <Info className="callout-icon" style={{ color: "var(--md-primary)" }} />
        <p>Pro and Business plans support multi-region deployments for lower global latency.</p>
      </div>
    </div>
  ),
};

// ─── Code block component ──────────────────────────────────────────
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: "relative", margin: "16px 0", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--md-outline)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: "var(--md-surface-3)" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--md-on-surface-var)", textTransform: "uppercase" }}>{lang}</span>
        <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", background: "none", border: "none", cursor: "pointer", color: copied ? "var(--md-success)" : "var(--md-on-surface-var)" }}>
          {copied ? <CheckCircle2 style={{ width: "13px", height: "13px" }} /> : <Copy style={{ width: "13px", height: "13px" }} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "16px", fontSize: "13px", overflowX: "auto", background: "var(--md-surface-2)", color: "var(--md-on-surface)", fontFamily: "'Fira Code', 'JetBrains Mono', monospace", lineHeight: 1.6 }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────
export default function DocsPage() {
  const { theme, toggle } = useTheme();
  const [activeDoc, setActiveDoc] = useState("quickstart");
  const [openSections, setOpenSections] = useState<string[]>(["Getting Started", "Training", "API Reference"]);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSection = (s: string) =>
    setOpenSections(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const filteredNav = useMemo(() => {
    if (!search) return NAV;
    const q = search.toLowerCase();
    return NAV.map(s => ({ ...s, items: s.items.filter(i => i.label.toLowerCase().includes(q)) })).filter(s => s.items.length > 0);
  }, [search]);

  const content = DOCS[activeDoc] ?? (
    <div style={{ textAlign: "center", padding: "64px 0" }}>
      <BookOpen style={{ width: "40px", height: "40px", color: "var(--md-outline)", margin: "0 auto 16px" }} />
      <p style={{ color: "var(--md-on-surface-var)" }}>Select a topic from the sidebar.</p>
    </div>
  );

  const S = {
    text:  { color: "var(--md-on-surface)" },
    muted: { color: "var(--md-on-surface-var)" },
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--md-surface)", display: "flex", flexDirection: "column" }}>
      {/* Styles */}
      <style>{`
        .doc-badge { display:inline-block; font-size:11px; font-weight:600; padding:3px 10px; border-radius:100px; background:var(--md-primary-container); color:var(--md-on-primary-cont); margin-bottom:12px; }
        h1 { font-size:clamp(22px,3vw,32px); font-weight:800; color:var(--md-on-surface); margin:0 0 12px; letter-spacing:-0.02em; }
        h2 { font-size:18px; font-weight:700; color:var(--md-on-surface); margin:28px 0 10px; letter-spacing:-0.01em; }
        h3 { font-size:15px; font-weight:600; color:var(--md-on-surface); margin:20px 0 8px; }
        p  { font-size:15px; line-height:1.7; color:var(--md-on-surface-var); margin:0 0 12px; }
        .lead { font-size:17px; color:var(--md-on-surface-var); margin-bottom:24px; }
        a  { color:var(--md-primary); text-decoration:none; font-weight:500; }
        a:hover { text-decoration:underline; }
        code { font-family:'JetBrains Mono',monospace; font-size:13px; background:var(--md-surface-2); padding:2px 6px; border-radius:5px; color:var(--md-primary); }
        .doc-table { width:100%; border-collapse:collapse; font-size:13.5px; margin:16px 0; border-radius:12px; overflow:hidden; border:1px solid var(--md-outline); }
        .doc-table th { background:var(--md-surface-2); color:var(--md-on-surface-var); font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:0.06em; padding:10px 14px; text-align:left; }
        .doc-table td { padding:10px 14px; color:var(--md-on-surface); border-top:1px solid var(--md-outline-var); }
        .doc-list { padding-left:20px; margin:12px 0; display:flex; flex-direction:column; gap:7px; }
        .doc-list li { font-size:14px; color:var(--md-on-surface-var); line-height:1.5; }
        .callout { display:flex; align-items:flex-start; gap:10px; padding:14px 16px; border-radius:12px; margin:16px 0; }
        .callout.info { background:var(--md-primary-container); border:1px solid var(--md-outline); }
        .callout.success { background:var(--md-success-cont); border:1px solid var(--md-outline); }
        .callout.warning { background:var(--md-warning-cont); border:1px solid var(--md-outline); }
        .callout p { margin:0; font-size:14px; }
        .callout-icon { width:16px; height:16px; flex-shrink:0; margin-top:2px; }
      `}</style>

      {/* ── Top nav ───────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid var(--md-outline)", background: "var(--md-surface-1)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px", height: "56px", display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "7px", fontWeight: 700, fontSize: "15px", textDecoration: "none", color: "var(--md-on-surface)", flexShrink: 0 }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "var(--md-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap style={{ width: "14px", height: "14px", color: "var(--md-on-primary)" }} />
            </div>
            Nemix
          </Link>
          <span style={{ color: "var(--md-outline)", fontSize: "18px" }}>/</span>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--md-on-surface-var)" }}>Docs</span>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: "360px", position: "relative", marginLeft: "auto" }}>
            <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "15px", height: "15px", color: "var(--md-on-surface-var)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search docs..."
              style={{ width: "100%", height: "36px", borderRadius: "10px", paddingLeft: "36px", paddingRight: "12px", fontSize: "13px", background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)", outline: "none" }} />
          </div>

          <button onClick={toggle} style={{ padding: "7px", borderRadius: "8px", background: "transparent", border: "1px solid var(--md-outline)", color: "var(--md-on-surface-var)", cursor: "pointer", display: "flex" }}>
            {theme === "dark" ? <Sun style={{ width: "14px", height: "14px" }} /> : <Moon style={{ width: "14px", height: "14px" }} />}
          </button>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 600, padding: "7px 14px", borderRadius: "8px", background: "var(--md-primary)", color: "var(--md-on-primary)", textDecoration: "none" }}>
            Dashboard <ChevronRight style={{ width: "13px", height: "13px" }} />
          </Link>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside style={{ width: "260px", flexShrink: 0, borderRight: "1px solid var(--md-outline)", padding: "24px 0", overflowY: "auto", position: "sticky", top: "56px", height: "calc(100vh - 56px)" }}>
          {filteredNav.map(group => (
            <div key={group.section} style={{ marginBottom: "4px" }}>
              <button onClick={() => toggleSection(group.section)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "8px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <group.icon style={{ width: "14px", height: "14px", color: "var(--md-on-surface-var)", flexShrink: 0 }} />
                <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--md-on-surface-var)", flex: 1 }}>{group.section}</span>
                <ChevronDown style={{ width: "13px", height: "13px", color: "var(--md-on-surface-var)", transform: openSections.includes(group.section) ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              {openSections.includes(group.section) && (
                <div style={{ paddingBottom: "8px" }}>
                  {group.items.map(item => (
                    <button key={item.id} onClick={() => setActiveDoc(item.id)}
                      style={{ width: "100%", display: "block", padding: "7px 20px 7px 42px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: "13.5px", fontWeight: activeDoc === item.id ? 600 : 400, color: activeDoc === item.id ? "var(--md-primary)" : "var(--md-on-surface-var)", borderLeft: `2px solid ${activeDoc === item.id ? "var(--md-primary)" : "transparent"}`, marginLeft: "20px", transition: "all 0.1s" }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Links */}
          <div style={{ padding: "20px 20px 0", borderTop: "1px solid var(--md-outline-var)", marginTop: "12px" }}>
            {[["API Reference", "https://api.nemix.ai"], ["GitHub", "https://github.com"], ["Discord", "https://discord.gg"], ["Status", "https://status.nemix.ai"]].map(([l, h]) => (
              <a key={l} href={h} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 0", fontSize: "13px", color: "var(--md-on-surface-var)", textDecoration: "none" }}>
                <ExternalLink style={{ width: "12px", height: "12px" }} /> {l}
              </a>
            ))}
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────── */}
        <main style={{ flex: 1, padding: "40px 56px 80px", overflowX: "hidden", maxWidth: "800px" }}>
          {content}

          {/* Prev / Next */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--md-outline-var)" }}>
            <div />
            <button onClick={() => setActiveDoc("lora")}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--md-primary)", background: "none", border: "none", cursor: "pointer" }}>
              Next: LoRA Fine-tuning <ChevronRight style={{ width: "14px", height: "14px" }} />
            </button>
          </div>

          {/* Edit on GitHub */}
          <div style={{ marginTop: "24px" }}>
            <a href="https://github.com" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--md-on-surface-var)" }}>
              <ExternalLink style={{ width: "12px", height: "12px" }} /> Edit this page on GitHub
            </a>
          </div>
        </main>

        {/* ── Right TOC ─────────────────────────────────────────── */}
        <aside style={{ width: "200px", flexShrink: 0, padding: "40px 20px", position: "sticky", top: "56px", height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--md-on-surface-var)", marginBottom: "8px" }}>On this page</p>
          {["Overview", "Step 1 — Account", "Step 2 — Dataset", "Step 3 — Training", "Step 4 — Deploy"].map(h => (
            <a key={h} href="#" style={{ fontSize: "12.5px", color: "var(--md-on-surface-var)", textDecoration: "none", lineHeight: 1.4 }}>{h}</a>
          ))}

          <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid var(--md-outline-var)" }}>
            <p style={{ fontSize: "11px", color: "var(--md-on-surface-var)", opacity: 0.6, marginBottom: "8px" }}>Was this helpful?</p>
            <div style={{ display: "flex", gap: "6px" }}>
              {["👍 Yes", "👎 No"].map(v => (
                <button key={v} style={{ flex: 1, padding: "5px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--md-outline)", background: "transparent", cursor: "pointer", color: "var(--md-on-surface-var)" }}>{v}</button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
