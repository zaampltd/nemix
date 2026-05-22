"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Zap, Search, Clock, ArrowRight, Sun, Moon, Tag, ChevronRight } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";

// ─── Blog data ──────────────────────────────────────────────────────
const POSTS = [
  {
    slug: "lora-vs-qlora",
    title: "LoRA vs QLoRA: Which Fine-tuning Method Should You Use?",
    excerpt: "A practical comparison of LoRA and QLoRA for fine-tuning large language models — covering GPU memory, training speed, and output quality across six benchmark tasks.",
    category: "Technical",
    tags: ["LoRA", "QLoRA", "Fine-tuning", "LLMs"],
    author: { name: "Sarah Chen",    role: "ML Lead",       avatar: "SC", color: "#5b5bd6" },
    date: "May 20, 2026",
    readTime: "8 min read",
    featured: true,
    gradient: "linear-gradient(135deg, #5b5bd633, #3dd68c22)",
  },
  {
    slug: "deploy-llm-60-seconds",
    title: "How to Deploy a Fine-tuned LLM in 60 Seconds",
    excerpt: "Step-by-step walkthrough of deploying a LLaMA 3 model from training checkpoint to a live HTTPS endpoint — with zero DevOps knowledge required.",
    category: "Tutorial",
    tags: ["Deployment", "LLaMA 3", "API"],
    author: { name: "James Wilson",  role: "DevRel Eng",    avatar: "JW", color: "#3dd68c" },
    date: "May 18, 2026",
    readTime: "5 min read",
    featured: false,
    gradient: "linear-gradient(135deg, #3dd68c33, #0ea5e922)",
  },
  {
    slug: "evaluating-llm-hallucination",
    title: "Measuring Hallucination in Fine-tuned LLMs: A Practical Guide",
    excerpt: "Hallucination is the silent killer of production AI. This guide covers four benchmarking strategies and how to use Nemix Evaluations to catch it before deployment.",
    category: "Research",
    tags: ["Evaluation", "Hallucination", "Benchmarks"],
    author: { name: "Amira Patel",   role: "AI Researcher", avatar: "AP", color: "#f59e0b" },
    date: "May 15, 2026",
    readTime: "12 min read",
    featured: false,
    gradient: "linear-gradient(135deg, #f59e0b33, #ef444422)",
  },
  {
    slug: "stripe-ai-billing",
    title: "How We Built Metered Billing for an AI Platform (with Stripe)",
    excerpt: "A behind-the-scenes look at how Nemix tracks per-inference costs, GPU-hour usage, and storage consumption — and bills customers accurately at scale.",
    category: "Engineering",
    tags: ["Billing", "Stripe", "Infrastructure"],
    author: { name: "Tom Bradley",   role: "Backend Eng",   avatar: "TB", color: "#e5534b" },
    date: "May 12, 2026",
    readTime: "10 min read",
    featured: false,
    gradient: "linear-gradient(135deg, #e5534b33, #8b5cf622)",
  },
  {
    slug: "dataset-versioning",
    title: "Why Dataset Versioning is the Most Underrated MLOps Practice",
    excerpt: "Teams that version their datasets reproduce results 3× faster and catch data drift before it hits production. Here's how to set it up in Nemix.",
    category: "MLOps",
    tags: ["Datasets", "Versioning", "MLOps"],
    author: { name: "Maya Rodriguez", role: "ML Eng",        avatar: "MR", color: "#8b5cf6" },
    date: "May 10, 2026",
    readTime: "7 min read",
    featured: false,
    gradient: "linear-gradient(135deg, #8b5cf633, #5b5bd622)",
  },
  {
    slug: "mistral-vs-llama3",
    title: "Mistral 7B vs LLaMA 3 8B: Fine-tuning Head-to-Head",
    excerpt: "We fine-tuned both models on the same customer support dataset and benchmarked accuracy, latency, GPU cost, and hallucination rate. The results surprised us.",
    category: "Research",
    tags: ["Mistral", "LLaMA 3", "Benchmarks"],
    author: { name: "Alex Kim",      role: "Research Eng",  avatar: "AK", color: "#0ea5e9" },
    date: "May 7, 2026",
    readTime: "15 min read",
    featured: false,
    gradient: "linear-gradient(135deg, #0ea5e933, #10b98122)",
  },
  {
    slug: "autoscaling-inference",
    title: "Auto-scaling LLM Inference: From Zero to 10K RPS",
    excerpt: "How Nemix's inference layer handles traffic spikes — including cold start optimization, request queuing, and GPU scheduling across multiple regions.",
    category: "Engineering",
    tags: ["Scaling", "Inference", "Architecture"],
    author: { name: "Sarah Chen",    role: "ML Lead",       avatar: "SC", color: "#5b5bd6" },
    date: "May 3, 2026",
    readTime: "9 min read",
    featured: false,
    gradient: "linear-gradient(135deg, #5b5bd633, #0ea5e922)",
  },
  {
    slug: "prompt-engineering-guide",
    title: "The Complete Prompt Engineering Guide for Fine-tuned Models",
    excerpt: "System prompts, few-shot examples, chain-of-thought, and output formatting — everything you need to get consistent, production-quality outputs from your model.",
    category: "Tutorial",
    tags: ["Prompts", "LLMs", "Best Practices"],
    author: { name: "Amira Patel",   role: "AI Researcher", avatar: "AP", color: "#f59e0b" },
    date: "Apr 28, 2026",
    readTime: "11 min read",
    featured: false,
    gradient: "linear-gradient(135deg, #f59e0b33, #5b5bd622)",
  },
];

const CATEGORIES = ["All", "Technical", "Tutorial", "Research", "Engineering", "MLOps"];

// ─── Blog post full content ─────────────────────────────────────────
const POST_CONTENT: Record<string, React.ReactNode> = {
  "lora-vs-qlora": (
    <div className="prose">
      <p className="lead">Fine-tuning large language models efficiently is one of the core challenges in applied ML. LoRA and QLoRA are the two dominant approaches — but which should you use?</p>

      <h2>What is LoRA?</h2>
      <p>Low-Rank Adaptation (LoRA) freezes the original model weights and injects small trainable rank decomposition matrices into each transformer layer. Instead of updating billions of parameters, you only train a fraction — often less than 1% of the total parameter count.</p>
      <p>This results in faster training, lower memory usage, and easy model merging. The trained adapter weights can be swapped in and out without touching the base model.</p>

      <h2>What is QLoRA?</h2>
      <p>QLoRA combines quantization with LoRA. The base model is loaded in 4-bit precision (using NF4 or FP4), dramatically reducing VRAM requirements. A LoRA adapter is then trained on top in full BFloat16 precision.</p>
      <p>This means you can fine-tune a 70B parameter model on a single A100 80GB GPU — something that would be impossible with standard LoRA.</p>

      <h2>Benchmark results</h2>
      <div style={{ overflowX: "auto", margin: "20px 0" }}>
        <table className="blog-table">
          <thead><tr><th>Metric</th><th>LoRA</th><th>QLoRA</th></tr></thead>
          <tbody>
            <tr><td>GPU VRAM (7B model)</td><td>~14 GB</td><td>~6 GB</td></tr>
            <tr><td>Training speed</td><td>~120 tokens/s</td><td>~80 tokens/s</td></tr>
            <tr><td>Output quality (MMLU)</td><td>72.4%</td><td>71.8%</td></tr>
            <tr><td>Min GPU</td><td>A10 24GB</td><td>RTX 3090 24GB</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Which should you use?</h2>
      <p>Use <strong>LoRA</strong> if you have access to 24GB+ VRAM and want faster training. Use <strong>QLoRA</strong> if you're working with 13B+ parameter models or have limited GPU memory. On Nemix, both methods are available with one click — you don't need to configure quantization manually.</p>

      <h2>Conclusion</h2>
      <p>For most use cases with models under 13B parameters, LoRA is the right choice. For larger models, or when GPU memory is the constraint, QLoRA unlocks fine-tuning that would otherwise be impossible. The quality difference is minimal — less than 1% on most benchmarks.</p>
    </div>
  ),
};

// ─── Components ─────────────────────────────────────────────────────
function Avatar({ author }: { author: typeof POSTS[0]["author"] }) {
  return (
    <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: author.color + "22", border: `2px solid ${author.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "11px", color: author.color, flexShrink: 0 }}>
      {author.avatar}
    </div>
  );
}

function PostCard({ post, idx }: { post: typeof POSTS[0]; idx: number }) {
  const [reading, setReading] = useState(false);
  const content = POST_CONTENT[post.slug];

  if (reading && content) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ gridColumn: "1 / -1", background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", borderRadius: "24px", overflow: "hidden" }}>
        <div style={{ background: post.gradient, padding: "32px 40px 24px" }}>
          <button onClick={() => setReading(false)}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--md-on-surface)", background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", marginBottom: "20px" }}>
            ← Back to Blog
          </button>
          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "100px", background: "var(--md-primary)", color: "var(--md-on-primary)" }}>{post.category}</span>
          <h1 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, color: "var(--md-on-surface)", margin: "14px 0 12px", letterSpacing: "-0.025em", lineHeight: 1.2 }}>{post.title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Avatar author={post.author} />
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)" }}>{post.author.name}</p>
              <p style={{ fontSize: "11px", color: "var(--md-on-surface-var)" }}>{post.author.role} · {post.date} · {post.readTime}</p>
            </div>
          </div>
        </div>
        <div style={{ padding: "32px 40px 48px" }}>
          <style>{`
            .prose p { font-size:15px; line-height:1.75; color:var(--md-on-surface-var); margin:0 0 16px; }
            .prose .lead { font-size:17px; color:var(--md-on-surface); font-weight:500; }
            .prose h2 { font-size:20px; font-weight:700; color:var(--md-on-surface); margin:32px 0 12px; }
            .prose strong { color:var(--md-on-surface); }
            .blog-table { width:100%; border-collapse:collapse; font-size:14px; border-radius:12px; overflow:hidden; border:1px solid var(--md-outline); }
            .blog-table th { background:var(--md-surface-2); color:var(--md-on-surface-var); font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; padding:10px 16px; text-align:left; }
            .blog-table td { padding:10px 16px; color:var(--md-on-surface); border-top:1px solid var(--md-outline-var); }
          `}</style>
          {content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
      style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", borderRadius: "20px", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-1)" }}>
      {/* Color bar */}
      <div style={{ height: "4px", background: post.author.color, opacity: 0.7 }} />
      <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "100px", background: "var(--md-primary-container)", color: "var(--md-on-primary-cont)" }}>
            {post.category}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--md-on-surface-var)" }}>
            <Clock style={{ width: "11px", height: "11px" }} /> {post.readTime}
          </span>
        </div>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--md-on-surface)", marginBottom: "8px", lineHeight: 1.35, letterSpacing: "-0.01em", flex: 1 }}>{post.title}</h3>
        <p style={{ fontSize: "13px", color: "var(--md-on-surface-var)", lineHeight: 1.6, marginBottom: "16px" }}>{post.excerpt}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "16px" }}>
          {post.tags.map(t => (
            <span key={t} style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "6px", background: "var(--md-surface-2)", border: "1px solid var(--md-outline-var)", color: "var(--md-on-surface-var)" }}>
              #{t}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "14px", borderTop: "1px solid var(--md-outline-var)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Avatar author={post.author} />
            <div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--md-on-surface)" }}>{post.author.name}</p>
              <p style={{ fontSize: "11px", color: "var(--md-on-surface-var)" }}>{post.date}</p>
            </div>
          </div>
          <button onClick={() => content ? setReading(true) : null}
            style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, color: "var(--md-primary)", background: "none", border: "none", cursor: content ? "pointer" : "default" }}>
            {content ? "Read →" : <span style={{ opacity: 0.5 }}>Coming soon</span>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────
export default function BlogPage() {
  const { theme, toggle } = useTheme();
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const featured = POSTS.find(p => p.featured)!;
  const [featuredReading, setFeaturedReading] = useState(false);

  const filtered = POSTS.filter(p => {
    if (category !== "All" && p.category !== category) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.excerpt.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--md-surface)", color: "var(--md-on-surface)" }}>

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid var(--md-outline)", background: "var(--md-surface-1)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", height: "56px", display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "7px", textDecoration: "none", flexShrink: 0 }}>
            <BrandLogo size={22} />
            <span className="brand-logotype-adaptive" style={{ fontSize: "17px" }}>Nemix</span>
          </Link>
          <span style={{ color: "var(--md-outline)", fontSize: "18px" }}>/</span>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--md-on-surface-var)" }}>Blog</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <Link href="/docs" style={{ fontSize: "13px", fontWeight: 600, color: "var(--md-on-surface-var)", textDecoration: "none" }}>Docs</Link>
            <button onClick={toggle} style={{ padding: "7px", borderRadius: "8px", background: "transparent", border: "1px solid var(--md-outline)", color: "var(--md-on-surface-var)", cursor: "pointer", display: "flex" }}>
              {theme === "dark" ? <Sun style={{ width: "14px", height: "14px" }} /> : <Moon style={{ width: "14px", height: "14px" }} />}
            </button>
            <Link href="/dashboard" style={{ fontSize: "13px", fontWeight: 600, padding: "7px 14px", borderRadius: "8px", background: "var(--md-primary)", color: "var(--md-on-primary)", textDecoration: "none" }}>Dashboard →</Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "56px 24px 80px" }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--md-primary)", marginBottom: "10px" }}>Nemix Blog</p>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--md-on-surface)", marginBottom: "14px", lineHeight: 1.1 }}>
            Guides, research &<br />engineering deep-dives
          </h1>
          <p style={{ fontSize: "16px", color: "var(--md-on-surface-var)", maxWidth: "500px", margin: "0 auto 28px" }}>
            Practical content for ML engineers and developers building with AI.
          </p>
          {/* Search */}
          <div style={{ position: "relative", maxWidth: "400px", margin: "0 auto" }}>
            <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--md-on-surface-var)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search articles..."
              style={{ width: "100%", height: "44px", borderRadius: "100px", paddingLeft: "44px", paddingRight: "20px", fontSize: "14px", background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)", outline: "none" }} />
          </div>
        </div>

        {/* ── Featured post ──────────────────────────────────────── */}
        {!search && category === "All" && !featuredReading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", borderRadius: "24px", overflow: "hidden", marginBottom: "48px", boxShadow: "var(--shadow-2)" }}>
            <div style={{ background: featured.gradient, padding: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "100px", background: "var(--md-primary)", color: "var(--md-on-primary)" }}>FEATURED</span>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "100px", background: "var(--md-primary-container)", color: "var(--md-on-primary-cont)" }}>{featured.category}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--md-on-surface-var)" }}>
                  <Clock style={{ width: "12px", height: "12px" }} /> {featured.readTime}
                </span>
              </div>
              <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, color: "var(--md-on-surface)", marginBottom: "12px", letterSpacing: "-0.025em", lineHeight: 1.2, maxWidth: "680px" }}>
                {featured.title}
              </h2>
              <p style={{ fontSize: "15px", color: "var(--md-on-surface-var)", lineHeight: 1.65, marginBottom: "24px", maxWidth: "600px" }}>{featured.excerpt}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: featured.author.color + "22", border: `2px solid ${featured.author.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", color: featured.author.color }}>
                    {featured.author.avatar}
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--md-on-surface)" }}>{featured.author.name}</p>
                    <p style={{ fontSize: "12px", color: "var(--md-on-surface-var)" }}>{featured.author.role} · {featured.date}</p>
                  </div>
                </div>
                <button onClick={() => setFeaturedReading(true)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px", borderRadius: "100px", background: "var(--md-primary)", color: "var(--md-on-primary)", fontSize: "14px", fontWeight: 700, border: "none", cursor: "pointer" }}>
                  Read article <ArrowRight style={{ width: "15px", height: "15px" }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Featured reading full article inline */}
        {featuredReading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", borderRadius: "24px", overflow: "hidden", marginBottom: "48px" }}>
            <div style={{ background: featured.gradient, padding: "32px 40px 24px" }}>
              <button onClick={() => setFeaturedReading(false)}
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--md-on-surface)", background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", marginBottom: "20px" }}>
                ← Back to Blog
              </button>
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "100px", background: "var(--md-primary)", color: "var(--md-on-primary)" }}>{featured.category}</span>
              <h1 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, color: "var(--md-on-surface)", margin: "14px 0 12px", letterSpacing: "-0.025em", lineHeight: 1.2 }}>{featured.title}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: featured.author.color + "22", border: `2px solid ${featured.author.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", color: featured.author.color }}>
                  {featured.author.avatar}
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)" }}>{featured.author.name}</p>
                  <p style={{ fontSize: "11px", color: "var(--md-on-surface-var)" }}>{featured.author.role} · {featured.date} · {featured.readTime}</p>
                </div>
              </div>
            </div>
            <div style={{ padding: "32px 40px 48px", maxWidth: "720px" }}>
              <style>{`
                .prose p { font-size:15px; line-height:1.75; color:var(--md-on-surface-var); margin:0 0 16px; }
                .prose .lead { font-size:17px; color:var(--md-on-surface); font-weight:500; }
                .prose h2 { font-size:20px; font-weight:700; color:var(--md-on-surface); margin:32px 0 12px; }
                .prose strong { color:var(--md-on-surface); }
                .blog-table { width:100%; border-collapse:collapse; font-size:14px; border-radius:12px; overflow:hidden; border:1px solid var(--md-outline); }
                .blog-table th { background:var(--md-surface-2); color:var(--md-on-surface-var); font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; padding:10px 16px; text-align:left; }
                .blog-table td { padding:10px 16px; color:var(--md-on-surface); border-top:1px solid var(--md-outline-var); }
              `}</style>
              {POST_CONTENT[featured.slug]}
            </div>
          </motion.div>
        )}

        {/* ── Category filters ───────────────────────────────────── */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{ padding: "7px 16px", borderRadius: "100px", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s", border: `1px solid ${category === cat ? "var(--md-primary)" : "var(--md-outline)"}`, background: category === cat ? "var(--md-primary)" : "transparent", color: category === cat ? "var(--md-on-primary)" : "var(--md-on-surface-var)" }}>
              {cat}
            </button>
          ))}
          <div style={{ marginLeft: "auto", fontSize: "13px", color: "var(--md-on-surface-var)", display: "flex", alignItems: "center" }}>
            {filtered.length} article{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* ── Post grid ─────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {filtered.map((post, i) => (
            <PostCard key={post.slug} post={post} idx={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <Search style={{ width: "40px", height: "40px", color: "var(--md-outline)", margin: "0 auto 16px" }} />
            <p style={{ color: "var(--md-on-surface-var)" }}>No articles found. Try a different search.</p>
          </div>
        )}

        {/* ── Newsletter ─────────────────────────────────────────── */}
        <div style={{ marginTop: "64px", padding: "40px", borderRadius: "24px", textAlign: "center", background: "var(--md-primary-container)", border: "1px solid var(--md-outline)" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--md-on-surface)", marginBottom: "8px" }}>Never miss a post</h2>
          <p style={{ fontSize: "14px", color: "var(--md-on-surface-var)", marginBottom: "20px" }}>Get new articles delivered to your inbox. No spam, unsubscribe anytime.</p>
          <div style={{ display: "flex", gap: "8px", maxWidth: "420px", margin: "0 auto" }}>
            <input placeholder="you@company.com" type="email"
              style={{ flex: 1, height: "44px", borderRadius: "12px", paddingLeft: "16px", fontSize: "14px", background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)", outline: "none" }} />
            <button style={{ padding: "0 20px", borderRadius: "12px", background: "var(--md-primary)", color: "var(--md-on-primary)", fontSize: "14px", fontWeight: 700, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
              Subscribe
            </button>
          </div>
          <p style={{ fontSize: "11px", color: "var(--md-on-surface-var)", marginTop: "10px", opacity: 0.6 }}>
            Trusted by 3,500+ ML engineers. No spam ever.
          </p>
        </div>

        {/* Authors */}
        <div style={{ marginTop: "64px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--md-on-surface)", marginBottom: "24px" }}>Meet the authors</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
            {[
              { name: "Sarah Chen",     role: "ML Lead",         avatar: "SC", color: "#5b5bd6", posts: 2 },
              { name: "James Wilson",   role: "DevRel Eng",      avatar: "JW", color: "#3dd68c", posts: 1 },
              { name: "Amira Patel",    role: "AI Researcher",   avatar: "AP", color: "#f59e0b", posts: 2 },
              { name: "Tom Bradley",    role: "Backend Eng",     avatar: "TB", color: "#e5534b", posts: 1 },
              { name: "Maya Rodriguez", role: "ML Eng",          avatar: "MR", color: "#8b5cf6", posts: 1 },
              { name: "Alex Kim",       role: "Research Eng",    avatar: "AK", color: "#0ea5e9", posts: 1 },
            ].map(a => (
              <div key={a.name} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", borderRadius: "16px", background: "var(--md-surface-1)", border: "1px solid var(--md-outline)" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: a.color + "22", border: `2px solid ${a.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", color: a.color, flexShrink: 0 }}>
                  {a.avatar}
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)" }}>{a.name}</p>
                  <p style={{ fontSize: "11px", color: "var(--md-on-surface-var)" }}>{a.role}</p>
                  <p style={{ fontSize: "11px", color: "var(--md-primary)" }}>{a.posts} article{a.posts > 1 ? "s" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
