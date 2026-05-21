"use client";
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { BookOpen, Search, Plus, Check, Star, Download, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["All", "Language", "Vision", "Code", "Audio", "Embedding"];

const HUB_MODELS = [
  { id: "llama3-8b",        name: "LLaMA 3 8B",             org: "Meta",        category: "Language",  params: "8B",   stars: 48200, license: "Llama 3", desc: "Meta's latest open LLM. Excellent instruction following and reasoning. Best for chat and text tasks.", tags: ["chat", "reasoning", "text"] },
  { id: "llama3-70b",       name: "LLaMA 3 70B",            org: "Meta",        category: "Language",  params: "70B",  stars: 41800, license: "Llama 3", desc: "70B parameter version. State-of-the-art open-source performance.", tags: ["chat", "reasoning"] },
  { id: "mistral-7b",       name: "Mistral 7B v0.3",        org: "Mistral AI",  category: "Language",  params: "7B",   stars: 36400, license: "Apache 2", desc: "Fast, efficient 7B model. Outperforms LLaMA 2 13B on most benchmarks.", tags: ["efficient", "text"] },
  { id: "mixtral-8x7b",     name: "Mixtral 8×7B",           org: "Mistral AI",  category: "Language",  params: "47B",  stars: 29100, license: "Apache 2", desc: "Mixture of Experts model. High quality at reasonable inference cost.", tags: ["MoE", "efficient"] },
  { id: "phi3-mini",        name: "Phi-3 Mini",             org: "Microsoft",   category: "Language",  params: "3.8B", stars: 22600, license: "MIT", desc: "Small but mighty. Exceptional performance for its size.", tags: ["small", "efficient"] },
  { id: "codellama-7b",     name: "CodeLlama 7B",           org: "Meta",        category: "Code",      params: "7B",   stars: 19800, license: "Llama 2", desc: "Code generation and explanation. Supports 80+ programming languages.", tags: ["code", "completion"] },
  { id: "deepseek-coder",   name: "DeepSeek Coder 6.7B",    org: "DeepSeek",    category: "Code",      params: "6.7B", stars: 16400, license: "Apache 2", desc: "Strong code model trained on 2T tokens of code data.", tags: ["code", "python", "js"] },
  { id: "starcoder2-7b",    name: "StarCoder2 7B",          org: "BigCode",     category: "Code",      params: "7B",   stars: 13200, license: "BigCode", desc: "Open source code generation from The Stack v2 training data.", tags: ["code", "multiline"] },
  { id: "bert-base",        name: "BERT Base",              org: "Google",      category: "Embedding", params: "110M", stars: 61000, license: "Apache 2", desc: "Classic bidirectional encoder. Great for classification and NER.", tags: ["NER", "classification"] },
  { id: "e5-large",         name: "E5 Large v2",            org: "Microsoft",   category: "Embedding", params: "335M", stars: 14800, license: "MIT", desc: "Best-in-class text embedding model for retrieval and similarity.", tags: ["RAG", "similarity", "search"] },
  { id: "clip-vit",         name: "CLIP ViT-L/14",          org: "OpenAI",      category: "Vision",    params: "307M", stars: 31200, license: "MIT", desc: "Vision-language model for zero-shot image classification.", tags: ["image", "classification", "zero-shot"] },
  { id: "whisper-large",    name: "Whisper Large v3",       org: "OpenAI",      category: "Audio",     params: "1.5B", stars: 42100, license: "MIT", desc: "State-of-the-art automatic speech recognition for 99+ languages.", tags: ["ASR", "transcription", "multilingual"] },
];

export default function ModelHubPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = HUB_MODELS.filter(m => {
    const matchCat = category === "All" || m.category === category;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.org.toLowerCase().includes(search.toLowerCase()) ||
      m.tags.some(t => t.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleAdd = async (id: string) => {
    if (added.has(id) || adding) return;
    setAdding(id);
    await new Promise(r => setTimeout(r, 1200));
    setAdded(prev => new Set([...prev, id]));
    setAdding(null);
  };

  const selectedModel = HUB_MODELS.find(m => m.id === selected);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--md-on-surface)" }}>Model Hub</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--md-on-surface-var)" }}>
            Browse {HUB_MODELS.length} open-source models. Add any to your workspace with one click.
          </p>
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--md-on-surface-var)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search models, orgs, or tags..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm"
              style={{
                background: "var(--md-surface-1)",
                border: "1px solid var(--md-outline)",
                color: "var(--md-on-surface)",
              }}
            />
          </div>
          <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "var(--md-surface-2)" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background: category === cat ? "var(--md-primary-container)" : "transparent",
                  color: category === cat ? "var(--md-on-primary-cont)" : "var(--md-on-surface-var)",
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 text-sm" style={{ color: "var(--md-on-surface-var)" }}>
          <span>{filtered.length} models</span>
          <span>{added.size} added to workspace</span>
        </div>

        {/* Model grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((model, i) => (
              <motion.div key={model.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl p-5 flex flex-col cursor-pointer group transition-all"
                style={{
                  background: "var(--md-surface-1)",
                  border: selected === model.id ? "1.5px solid var(--md-primary)" : "1px solid var(--md-outline)",
                  boxShadow: "var(--shadow-1)",
                }}
                onClick={() => setSelected(selected === model.id ? null : model.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "var(--md-primary-container)", color: "var(--md-on-primary-cont)" }}>
                        {model.category}
                      </span>
                      <span className="text-xs" style={{ color: "var(--md-on-surface-var)" }}>{model.params}</span>
                    </div>
                    <h3 className="font-semibold text-sm mt-1.5" style={{ color: "var(--md-on-surface)" }}>{model.name}</h3>
                    <p className="text-xs" style={{ color: "var(--md-on-surface-var)" }}>by {model.org}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "var(--md-on-surface-var)" }}>
                    <Star className="w-3 h-3" style={{ color: "var(--md-warning)" }} />
                    {(model.stars / 1000).toFixed(1)}k
                  </div>
                </div>

                <p className="text-xs leading-relaxed flex-1 mb-4" style={{ color: "var(--md-on-surface-var)" }}>
                  {model.desc}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {model.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "var(--md-surface-3)", color: "var(--md-on-surface-var)", border: "1px solid var(--md-outline)" }}>
                      {tag}
                    </span>
                  ))}
                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: "var(--md-surface-3)", color: "var(--md-on-surface-var)" }}>
                    {model.license}
                  </span>
                </div>

                {/* Action button */}
                <button
                  onClick={e => { e.stopPropagation(); handleAdd(model.id); }}
                  disabled={added.has(model.id)}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: added.has(model.id) ? "var(--md-success-cont)" : "var(--md-primary-container)",
                    color: added.has(model.id) ? "var(--md-success)" : "var(--md-on-primary-cont)",
                  }}
                >
                  {adding === model.id ? (
                    <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Adding...</>
                  ) : added.has(model.id) ? (
                    <><Check className="w-3.5 h-3.5" />Added to workspace</>
                  ) : (
                    <><Plus className="w-3.5 h-3.5" />Add to workspace</>
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--md-outline)" }} />
            <p className="text-sm" style={{ color: "var(--md-on-surface-var)" }}>No models match your search.</p>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
