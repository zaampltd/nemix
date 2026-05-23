"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  BookOpen, Plus, Search, Copy, Check, Trash2, Edit3, 
  X, Tag, Save, Sparkles, FolderDown, Award, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PREMIUM_PROMPT_TEMPLATES, PromptTemplate } from "./promptsDatabase";

interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ["All", "Summarization", "Classification", "Generation", "Extraction", "Chat", "Code", "Other"];

const DEFAULT_PROMPTS: Prompt[] = [
  { id: "1", title: "Sentiment Analyzer", category: "Classification", tags: ["sentiment", "NLP"],
    content: "Analyze the sentiment of the following text. Respond with exactly one of: POSITIVE, NEGATIVE, or NEUTRAL.\n\nText: {{input}}\n\nSentiment:",
    createdAt: "2026-05-01", updatedAt: "2026-05-01" },
  { id: "2", title: "Article Summarizer", category: "Summarization", tags: ["summary", "news"],
    content: "Summarize the following article in 3 concise bullet points. Focus on the most important facts.\n\nArticle:\n{{article}}\n\nSummary:",
    createdAt: "2026-05-05", updatedAt: "2026-05-10" },
  { id: "3", title: "Code Explainer", category: "Code", tags: ["code", "documentation"],
    content: "You are a senior software engineer. Explain the following code in simple terms that a junior developer can understand. Include what it does, how it works, and any potential issues.\n\nCode:\n```\n{{code}}\n```\n\nExplanation:",
    createdAt: "2026-05-08", updatedAt: "2026-05-08" },
  { id: "4", title: "Entity Extractor", category: "Extraction", tags: ["NER", "entities"],
    content: "Extract all named entities from the following text. Return a JSON object with keys: people, organizations, locations, dates.\n\nText: {{text}}\n\nEntities:",
    createdAt: "2026-05-12", updatedAt: "2026-05-12" },
  { id: "5", title: "Product Description Writer", category: "Generation", tags: ["e-commerce", "marketing"],
    content: "Write a compelling product description for the following product. Make it engaging, highlight key benefits, and include a call to action. Keep it under 150 words.\n\nProduct: {{product_name}}\nFeatures: {{features}}\nTarget audience: {{audience}}\n\nDescription:",
    createdAt: "2026-05-15", updatedAt: "2026-05-16" },
];

const STORAGE_KEY = "nemix-prompts";

function loadPrompts(): Prompt[] {
  if (typeof window === "undefined") return DEFAULT_PROMPTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PROMPTS;
  } catch { return DEFAULT_PROMPTS; }
}

function savePrompts(prompts: Prompt[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

function EmptyModal({ onClose, onSave, initial }: {
  onClose: () => void;
  onSave: (p: Omit<Prompt, "id" | "createdAt" | "updatedAt">) => void;
  initial?: Prompt;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [category, setCategory] = useState(initial?.category || "Other");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initial?.tags || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required";
    if (!content.trim()) e.content = "Prompt content is required";
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ title: title.trim(), content: content.trim(), category, tags });
    onClose();
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); setTagInput(""); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--md-scrim)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6"
        style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-3)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold" style={{ color: "var(--md-on-surface)" }}>
            {initial ? "Edit Prompt" : "New Prompt"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: "var(--md-on-surface-var)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>Title *</label>
            <input value={title} onChange={e => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: "" })); }}
              placeholder="e.g. Customer Support Assistant"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--md-surface-2)", border: `1px solid ${errors.title ? "var(--md-error)" : "var(--md-outline)"}`, color: "var(--md-on-surface)" }} />
            {errors.title && <p className="text-xs mt-1" style={{ color: "var(--md-error)" }}>{errors.title}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter(c => c !== "All").map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer"
                  style={{
                    background: category === cat ? "var(--md-primary-container)" : "var(--md-surface-2)",
                    color: category === cat ? "var(--md-on-primary-cont)" : "var(--md-on-surface-var)",
                    border: "1px solid var(--md-outline)",
                  }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt content */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>
              Prompt Content * <span className="font-normal opacity-60">— use {"{{variable}}"} for inputs</span>
            </label>
            <textarea value={content} onChange={e => { setContent(e.target.value); setErrors(prev => ({ ...prev, content: "" })); }}
              rows={8} placeholder="Write your prompt here..."
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono resize-none outline-none"
              style={{ background: "var(--md-surface-2)", border: `1px solid ${errors.content ? "var(--md-error)" : "var(--md-outline)"}`, color: "var(--md-on-surface)" }} />
            {errors.content && <p className="text-xs mt-1" style={{ color: "var(--md-error)" }}>{errors.content}</p>}
            <p className="text-[10px] mt-1" style={{ color: "var(--md-on-surface-var)" }}>{content.length} characters</p>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                  style={{ background: "var(--md-primary-container)", color: "var(--md-on-primary-cont)" }}>
                  {t}
                  <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="hover:opacity-70 cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTag()}
                placeholder="Add tag, press Enter"
                className="flex-1 px-3.5 py-2 rounded-xl text-xs outline-none"
                style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)" }} />
              <button onClick={addTag} className="px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                style={{ background: "var(--md-primary-container)", color: "var(--md-on-primary-cont)" }}>
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            style={{ border: "1px solid var(--md-outline)", color: "var(--md-on-surface-var)", background: "transparent" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90 cursor-pointer"
            style={{ background: "var(--md-primary)", color: "var(--md-on-primary)" }}>
            <Save className="w-4 h-4" />
            {initial ? "Save changes" : "Create prompt"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Prompt | undefined>();
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  
  // Custom states for premium system hub
  const [libraryTab, setLibraryTab] = useState<"saved" | "premium">("saved");
  const [clonedId, setClonedId] = useState<string | null>(null);

  useEffect(() => { setPrompts(loadPrompts()); }, []);

  const filteredSaved = prompts.filter(p => {
    const matchCat = category === "All" || p.category === category;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some(t => t.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const filteredPremium = PREMIUM_PROMPT_TEMPLATES.filter(p => {
    const matchCat = category === "All" || p.category === category;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some(t => t.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleCreate = (data: Omit<Prompt, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString().split("T")[0];
    const newPrompt: Prompt = { ...data, id: Date.now().toString(), createdAt: now, updatedAt: now };
    const updated = [newPrompt, ...prompts];
    setPrompts(updated);
    savePrompts(updated);
  };

  const handleEdit = (data: Omit<Prompt, "id" | "createdAt" | "updatedAt">) => {
    if (!editTarget) return;
    const now = new Date().toISOString().split("T")[0];
    const updated = prompts.map(p => p.id === editTarget.id ? { ...p, ...data, updatedAt: now } : p);
    setPrompts(updated);
    savePrompts(updated);
    setEditTarget(undefined);
  };

  const handleDelete = (id: string) => {
    const updated = prompts.filter(p => p.id !== id);
    setPrompts(updated);
    savePrompts(updated);
    if (expanded === id) setExpanded(null);
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClone = (template: PromptTemplate) => {
    const now = new Date().toISOString().split("T")[0];
    const newPrompt: Prompt = {
      id: `clone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${template.title} (Clone)`,
      content: template.content,
      tags: [...template.tags, "cloned"],
      category: template.category,
      createdAt: now,
      updatedAt: now
    };
    const updated = [newPrompt, ...prompts];
    setPrompts(updated);
    savePrompts(updated);
    
    // Set success indicator
    setClonedId(template.id);
    setTimeout(() => setClonedId(null), 2000);
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--md-on-surface)" }}>Prompt Library</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--md-on-surface-var)" }}>
              Save, organize and reuse your best prompts. Toggle between your saved prompts or browse pre-loaded templates.
            </p>
          </div>
          <button onClick={() => { setEditTarget(undefined); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-90 cursor-pointer shadow-sm"
            style={{ background: "var(--md-primary)", color: "var(--md-on-primary)" }}>
            <Plus className="w-4 h-4" />
            New prompt
          </button>
        </div>

        {/* Dynamic Dual-Tab Library Switcher */}
        <div className="flex rounded-2xl p-1 gap-1 border w-full max-w-md shrink-0" style={{ backgroundColor: "var(--md-surface-2)", borderColor: "var(--md-outline-var)" }}>
          <button
            type="button"
            onClick={() => setLibraryTab("saved")}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition duration-150 cursor-pointer flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: libraryTab === "saved" ? "var(--md-surface-1)" : "transparent",
              color: libraryTab === "saved" ? "var(--md-primary)" : "var(--md-on-surface-var)",
              boxShadow: libraryTab === "saved" ? "var(--shadow-1)" : "none",
              border: libraryTab === "saved" ? "1px solid var(--md-outline)" : "1px solid transparent"
            }}
          >
            📂 My Saved ({prompts.length})
          </button>
          <button
            type="button"
            onClick={() => setLibraryTab("premium")}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 relative overflow-hidden"
            style={{
              backgroundColor: libraryTab === "premium" ? "var(--md-surface-1)" : "transparent",
              color: libraryTab === "premium" ? "var(--md-primary)" : "var(--md-on-surface-var)",
              boxShadow: libraryTab === "premium" ? "var(--shadow-1)" : "none",
              border: libraryTab === "premium" ? "1px solid var(--md-outline)" : "1px solid transparent"
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            Nemix Premium Hub ({PREMIUM_PROMPT_TEMPLATES.length}+)
          </button>
        </div>

        {/* Search + categories filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--md-on-surface-var)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={libraryTab === "saved" ? "Search saved prompts..." : "Search 100+ premium prompt templates..."}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs outline-none"
              style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)" }} />
          </div>
          <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto scrollbar-none" style={{ background: "var(--md-surface-2)" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer"
                style={{
                  background: category === cat ? "var(--md-primary-container)" : "transparent",
                  color: category === cat ? "var(--md-on-primary-cont)" : "var(--md-on-surface-var)",
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Prompts lists */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {/* SAVED LIBRARY TAB */}
            {libraryTab === "saved" && filteredSaved.map((prompt, i) => (
              <motion.div key={prompt.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>

                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4 cursor-pointer"
                  onClick={() => setExpanded(expanded === prompt.id ? null : prompt.id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "var(--md-primary-container)" }}>
                      <BookOpen className="w-4 h-4" style={{ color: "var(--md-on-primary-cont)" }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm" style={{ color: "var(--md-on-surface)" }}>{prompt.title}</h3>
                        <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                          style={{ background: "var(--md-primary-container)", color: "var(--md-on-primary-cont)" }}>
                          {prompt.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {prompt.tags.map(t => (
                          <span key={t} className="text-[10px] font-medium" style={{ color: "var(--md-on-surface-var)" }}>#{t}</span>
                        ))}
                        <span className="text-[9px] opacity-60" style={{ color: "var(--md-on-surface-var)" }}>Updated {prompt.updatedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleCopy(prompt.id, prompt.content)}
                      className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      style={{ color: "var(--md-on-surface-var)" }}
                      title="Copy prompt">
                      {copied === prompt.id ? <Check className="w-4 h-4" style={{ color: "var(--md-success)" }} /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { setEditTarget(prompt); setShowModal(true); }}
                      className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      style={{ color: "var(--md-on-surface-var)" }}
                      title="Edit">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(prompt.id)}
                      className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      style={{ color: "var(--md-on-surface-var)" }}
                      title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {expanded === prompt.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                      className="overflow-hidden">
                      <div className="px-5 pb-4" style={{ borderTop: "1px solid var(--md-outline-var)" }}>
                        <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed mt-3 p-4 rounded-xl border"
                          style={{ background: "var(--md-surface-2)", borderColor: "var(--md-outline)", color: "var(--md-on-surface)", overflowX: "auto" }}>
                          {prompt.content}
                        </pre>
                        <p className="text-[10px] mt-2 opacity-60 font-medium" style={{ color: "var(--md-on-surface-var)" }}>
                          {prompt.content.length} chars · Created {prompt.createdAt}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* PREMIUM MARKETPLACE HUB TAB */}
            {libraryTab === "premium" && filteredPremium.map((prompt, i) => (
              <motion.div key={prompt.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.02 }}
                className="rounded-2xl overflow-hidden animate-in fade-in"
                style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>

                {/* Card header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-4 cursor-pointer gap-3"
                  onClick={() => setExpanded(expanded === prompt.id ? null : prompt.id)}>
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "var(--md-success-cont)" }}>
                      <Sparkles className="w-4 h-4" style={{ color: "var(--md-success)" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm" style={{ color: "var(--md-on-surface)" }}>{prompt.title}</h3>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                          style={{ background: "var(--md-primary-container)", color: "var(--md-on-primary-cont)" }}>
                          {prompt.category}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10" style={{ borderColor: "var(--md-warning)" }}>
                          Premium
                        </span>
                      </div>
                      <p className="text-xs opacity-75 mt-1.5 leading-relaxed max-w-2xl" style={{ color: "var(--md-on-surface-var)" }}>
                        {prompt.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {prompt.tags.map(t => (
                          <span key={t} className="text-[10px] font-medium" style={{ color: "var(--md-on-surface-var)" }}>#{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 sm:ml-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleCopy(prompt.id, prompt.content)}
                      className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      style={{ color: "var(--md-on-surface-var)" }}
                      title="Copy prompt template">
                      {copied === prompt.id ? <Check className="w-4 h-4" style={{ color: "var(--md-success)" }} /> : <Copy className="w-4 h-4" />}
                    </button>
                    
                    <button onClick={() => handleClone(prompt)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 shadow-sm"
                      style={{
                        background: clonedId === prompt.id ? "var(--md-success-cont)" : "var(--md-surface-2)",
                        borderColor: "var(--md-outline)",
                        color: clonedId === prompt.id ? "var(--md-success)" : "var(--md-on-surface-var)"
                      }}
                      title="Add to My Saved Prompts">
                      {clonedId === prompt.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Cloned!
                        </>
                      ) : (
                        <>
                          <FolderDown className="w-3.5 h-3.5 text-[var(--md-primary)]" /> Save Template
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {expanded === prompt.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                      className="overflow-hidden">
                      <div className="px-5 pb-5" style={{ borderTop: "1px solid var(--md-outline-var)" }}>
                        <div className="mt-3.5 space-y-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 block" style={{ color: "var(--md-on-surface-var)" }}>
                            Prompt System Template
                          </span>
                          <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed p-4 rounded-2xl border"
                            style={{ background: "var(--md-surface-2)", borderColor: "var(--md-outline)", color: "var(--md-on-surface)", overflowX: "auto" }}>
                            {prompt.content}
                          </pre>
                        </div>
                        <p className="text-[10px] mt-2.5 opacity-60 font-medium" style={{ color: "var(--md-on-surface-var)" }}>
                          {prompt.content.length} characters · Ready for production edge deployment
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty States */}
          {libraryTab === "saved" && filteredSaved.length === 0 && (
            <div className="text-center py-16">
              <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--md-outline)" }} />
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>No saved prompts found</p>
              <p className="text-xs mb-4" style={{ color: "var(--md-on-surface-var)" }}>
                {search ? "Try a different search" : "Create your first prompt or head over to Nemix Premium Hub to save a template!"}
              </p>
              {!search && (
                <div className="flex justify-center gap-3">
                  <button onClick={() => setLibraryTab("premium")}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border"
                    style={{ background: "var(--md-surface-2)", borderColor: "var(--md-outline)", color: "var(--md-on-surface)" }}>
                    🚀 Browse Premium Hub
                  </button>
                  <button onClick={() => setShowModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-90 cursor-pointer shadow-sm"
                    style={{ background: "var(--md-primary)", color: "var(--md-on-primary)" }}>
                    Create prompt
                  </button>
                </div>
              )}
            </div>
          )}

          {libraryTab === "premium" && filteredPremium.length === 0 && (
            <div className="text-center py-16">
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-amber-500" />
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>No premium templates found</p>
              <p className="text-xs" style={{ color: "var(--md-on-surface-var)" }}>
                Try adjusting your search criteria or categories to view prompt templates.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* New/Edit Prompt Modal */}
      <AnimatePresence>
        {showModal && (
          <EmptyModal
            onClose={() => { setShowModal(false); setEditTarget(undefined); }}
            onSave={editTarget ? handleEdit : handleCreate}
            initial={editTarget}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
