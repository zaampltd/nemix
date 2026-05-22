"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  GitBranch, Plus, Trash2, ArrowUp, ArrowDown, Sparkles,
  Copy, Check, Wrench, Search, Calculator, Database, Info,
  CloudLightning, Code2, Save, FileCode, CheckCircle2, AlertTriangle, ChevronDown
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

// ─── Constants & Available Models ──────────────────────────────────────────
const PROVIDERS = {
  "Groq": [
    "llama3-70b-8192",
    "llama3-8b-8192",
    "mixtral-8x7b-32768"
  ],
  "Google Gemini": [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemma-2-9b"
  ],
  "Together AI": [
    "llama3-70b-instruct",
    "mistral-7b-instruct-v0.3",
    "qwen-2-72b"
  ],
  "Hugging Face": [
    "zephyr-7b-beta",
    "starcoder-2-15b",
    "phi-3-mini-4k"
  ],
  "Mistral AI": [
    "mistral-large-latest",
    "codestral-22b",
    "mistral-nemo"
  ],
  "OpenAI": [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-3.5-turbo"
  ],
  "Anthropic": [
    "claude-3-5-sonnet",
    "claude-3-haiku",
    "claude-3-opus"
  ]
} as const;

type ProviderName = keyof typeof PROVIDERS;

interface FallbackNode {
  id: string;
  provider: ProviderName;
  model: string;
  trigger: string;
}

interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "warning" | "info";
}

const TRIGGERS = [
  "Rate Limit (429)",
  "Server Error (5xx)",
  "Timeout (> 1500ms)",
  "Any Failure (Trigger on any error)"
];

const TOOLS_CONFIG = [
  { id: "web_search", name: "Web Search", description: "Fetch real-time search queries at the edge", icon: Search },
  { id: "math_calculator", name: "Math Calculator", description: "Solve complex arithmetic equations locally", icon: Calculator },
  { id: "db_query", name: "SQL DB Query", description: "Inspect data warehouses directly from client nodes", icon: Database }
];

export default function EdgeRouterPage() {
  // ─── State Management ──────────────────────────────────────────────────────
  const [configName, setConfigName] = useState("Production Edge Router");
  const [fallbackChain, setFallbackChain] = useState<FallbackNode[]>([
    { id: "1", provider: "Groq", model: "llama3-70b-8192", trigger: "Rate Limit (429)" },
    { id: "2", provider: "Google Gemini", model: "gemini-1.5-flash", trigger: "Any Failure (Trigger on any error)" },
    { id: "3", provider: "Hugging Face", model: "zephyr-7b-beta", trigger: "Any Failure (Trigger on any error)" }
  ]);
  const [selectedTools, setSelectedTools] = useState<string[]>(["web_search", "math_calculator"]);
  const [sdkLanguage, setSdkLanguage] = useState<"javascript" | "python">("javascript");
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ─── Helper: Show Custom Toast Alert ───────────────────────────────────────
  const showToast = (message: string, type: "success" | "warning" | "info" = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // ─── Rule Builder Handlers ─────────────────────────────────────────────────
  const addFallbackNode = () => {
    const defaultProvider = "Groq";
    const newNode: FallbackNode = {
      id: Date.now().toString(),
      provider: defaultProvider,
      model: PROVIDERS[defaultProvider][0],
      trigger: "Any Failure (Trigger on any error)"
    };
    setFallbackChain(prev => [...prev, newNode]);
    showToast("Added new fallback node to chain", "info");
  };

  const deleteNode = (id: string) => {
    if (fallbackChain.length <= 1) {
      showToast("Your fallback chain must have at least 1 provider", "warning");
      return;
    }
    setFallbackChain(prev => prev.filter(n => n.id !== id));
    showToast("Deleted fallback node", "info");
  };

  const updateNode = <K extends keyof FallbackNode>(id: string, key: K, value: FallbackNode[K]) => {
    setFallbackChain(prev => prev.map(node => {
      if (node.id === id) {
        const updatedNode = { ...node, [key]: value };
        // If provider changed, auto-select its first available model
        if (key === "provider") {
          const newProv = value as ProviderName;
          updatedNode.model = PROVIDERS[newProv][0];
        }
        return updatedNode;
      }
      return node;
    }));
  };

  // ─── Reordering Logic with Framer Motion Animations ──────────────────────
  const moveNode = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fallbackChain.length) return;

    const list = [...fallbackChain];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setFallbackChain(list);
  };

  // ─── Tools Toggle Handler ──────────────────────────────────────────────────
  const toggleTool = (toolId: string) => {
    setSelectedTools(prev =>
      prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
    );
  };

  // ─── Dynamic JSON Configuration Generator ──────────────────────────────────
  const generatedJSON = JSON.stringify({
    configName,
    fallbackChain: fallbackChain.map(n => ({
      provider: n.provider,
      model: n.model,
      trigger: n.trigger
    })),
    agenticTools: selectedTools
  }, null, 2);

  // ─── Dynamic Code Exporter Snippets ────────────────────────────────────────
  const javascriptCode = `import { NemixEdgeRouter } from 'nemix-edge-sdk';

// Initialize the Zero-Risk Edge Router
const router = new NemixEdgeRouter({
  config: ${JSON.stringify(JSON.parse(generatedJSON), null, 2).replace(/\n/g, "\n  ")},
  credentials: {
    // Loaded purely from your local secure environment variables.
    // Nemix servers NEVER touch or save your secret keys.
    ${fallbackChain.map(n => {
      const keyVar = `${n.provider.toUpperCase().replace(/\s+/g, "_")}_API_KEY`;
      return `${keyVar}: process.env.${keyVar}`;
    }).filter((value, idx, self) => self.indexOf(value) === idx).join(",\n    ")}
  }
});

// Run inferences with automatic fallback triggers
const response = await router.generate({
  prompt: "Analyze user query and return structured code.",
  temperature: 0.2
});

console.log(response.text);`;

  const pythonCode = `from nemix_edge import NemixEdgeRouter
import os

# Initialize the Zero-Risk Edge Router
router = NemixEdgeRouter(
    config=${JSON.stringify(JSON.parse(generatedJSON), null, 4).replace(/\n/g, "\n    ")},
    credentials={
        # Loaded purely from your local secure environment variables.
        # Nemix servers NEVER touch or save your secret keys.
        ${fallbackChain.map(n => {
          const keyVar = `${n.provider.toUpperCase().replace(/\s+/g, "_")}_API_KEY`;
          return `"${keyVar}": os.getenv("${keyVar}")`;
        }).filter((value, idx, self) => self.indexOf(value) === idx).join(",\n        ")}
    }
)

# Run inferences with automatic fallback triggers
response = router.generate(
    prompt="Analyze user query and return structured code.",
    temperature=0.2
)

print(response.text)`;

  const activeCode = sdkLanguage === "javascript" ? javascriptCode : pythonCode;

  // ─── Copy to Clipboard Handler ─────────────────────────────────────────────
  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    showToast("SDK code copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  // ─── Save Configuration to Firestore & Local Storage Fallback ──────────────
  const publishConfiguration = async () => {
    setPublishing(true);
    let userId = "anonymous-dev";

    try {
      const rawUser = localStorage.getItem("current_user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        userId = u.uid || u.id || userId;
      }
    } catch {}

    const payload = {
      userId,
      name: configName,
      fallbackChain: fallbackChain.map(n => ({
        provider: n.provider,
        model: n.model,
        trigger: n.trigger
      })),
      agenticTools: selectedTools,
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Attempt Cloud Publish via Firebase Firestore
      await addDoc(collection(db, "RouterConfigs"), payload);
      
      // Sync local storage as backup
      const existing = JSON.parse(localStorage.getItem("local_router_configs") || "[]");
      localStorage.setItem("local_router_configs", JSON.stringify([payload, ...existing]));

      showToast("Published router configuration to Cloud Control Plane!", "success");
    } catch (error) {
      console.warn("Firestore write skipped/offline. Activating offline sandbox fallback:", error);
      
      // 2. Offline Sandbox Backup Fallback
      const existing = JSON.parse(localStorage.getItem("local_router_configs") || "[]");
      localStorage.setItem("local_router_configs", JSON.stringify([payload, ...existing]));
      
      showToast("Offline Sandbox Active: Config saved to local browser storage.", "info");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 relative">
        
        {/* Toast Notification Container */}
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          <AnimatePresence>
            {toasts.map(t => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="p-4 rounded-2xl flex items-start gap-3 shadow-lg pointer-events-auto border"
                style={{
                  background: "var(--md-surface-2)",
                  borderColor: "var(--md-outline)",
                  boxShadow: "var(--shadow-3)",
                }}
              >
                <div className="mt-0.5">
                  {t.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {t.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  {t.type === "info" && <Sparkles className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium" style={{ color: "var(--md-on-surface)" }}>{t.message}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ background: "var(--md-primary-container)", color: "var(--md-on-primary-cont)" }}>
              <CloudLightning className="w-3 h-3" /> Client-Side Edge Execution
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ color: "var(--md-on-surface)" }}>Edge Router & Control Plane</h1>
            <p className="text-sm" style={{ color: "var(--md-on-surface-var)" }}>
              Configure visual fallback rules and capabilities. Inference runs directly on your local edge to bypass server token fees.
            </p>
          </div>
          <button
            onClick={publishConfiguration}
            disabled={publishing}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 shrink-0"
            style={{ background: "var(--md-primary)", color: "var(--md-on-primary)", boxShadow: "var(--shadow-2)" }}
          >
            {publishing ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4" /> Publish Gateway
              </>
            )}
          </button>
        </motion.div>

        {/* Workspace Layout Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: UI Fallback Engine Controls */}
          <div className="space-y-6">
            
            {/* Step 1: Config Info Card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="rounded-2xl p-5 space-y-4"
              style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-400" />
                <p className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--md-on-surface)" }}>
                  Step 1: Router Identity
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>
                  Router Configuration Name
                </label>
                <input
                  type="text"
                  value={configName}
                  onChange={e => setConfigName(e.target.value)}
                  placeholder="e.g. Production Edge Gateway"
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)" }}
                />
              </div>
            </motion.div>

            {/* Step 2: Fallback Chain Visual Rule Builder */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-2xl p-5 space-y-5"
              style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-purple-400" />
                  <p className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--md-on-surface)" }}>
                    Step 2: Fallback Chain
                  </p>
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "var(--md-primary-container)", color: "var(--md-on-primary-cont)" }}>
                  {fallbackChain.length} active steps
                </span>
              </div>

              <div className="relative flex flex-col gap-4">
                <AnimatePresence initial={false}>
                  {fallbackChain.map((node, index) => (
                    <motion.div
                      key={node.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -15 }}
                      transition={{ type: "spring", damping: 25, stiffness: 220 }}
                      className="rounded-2xl p-4 space-y-4 border relative group"
                      style={{
                        background: "var(--md-surface-2)",
                        borderColor: "var(--md-outline)",
                      }}
                    >
                      {/* Step index pill */}
                      <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--md-outline-var)" }}>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{ background: "var(--md-primary)", color: "var(--md-on-primary)" }}>
                            {index + 1}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: "var(--md-on-surface)" }}>
                            {node.provider} node
                          </span>
                        </div>
                        {/* Up/Down/Delete Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveNode(index, "up")}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" style={{ color: "var(--md-on-surface-var)" }} />
                          </button>
                          <button
                            onClick={() => moveNode(index, "down")}
                            disabled={index === fallbackChain.length - 1}
                            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" style={{ color: "var(--md-on-surface-var)" }} />
                          </button>
                          <button
                            onClick={() => deleteNode(node.id)}
                            className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors"
                            title="Remove node"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Rule configuration dropdowns */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Provider select */}
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>
                            Provider
                          </label>
                          <div className="relative">
                            <select
                              value={node.provider}
                              onChange={e => updateNode(node.id, "provider", e.target.value as ProviderName)}
                              className="w-full appearance-none px-3 py-2 rounded-xl text-xs"
                              style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)" }}
                            >
                              {Object.keys(PROVIDERS).map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--md-on-surface-var)" }} />
                          </div>
                        </div>

                        {/* Model select */}
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>
                            Model
                          </label>
                          <div className="relative">
                            <select
                              value={node.model}
                              onChange={e => updateNode(node.id, "model", e.target.value)}
                              className="w-full appearance-none px-3 py-2 rounded-xl text-xs"
                              style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)" }}
                            >
                              {PROVIDERS[node.provider].map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--md-on-surface-var)" }} />
                          </div>
                        </div>

                        {/* Fallback triggers */}
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>
                            Trigger Fallback On
                          </label>
                          <div className="relative">
                            <select
                              value={node.trigger}
                              onChange={e => updateNode(node.id, "trigger", e.target.value)}
                              className="w-full appearance-none px-3 py-2 rounded-xl text-xs"
                              style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)" }}
                            >
                              {TRIGGERS.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--md-on-surface-var)" }} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Add node CTA */}
              <button
                onClick={addFallbackNode}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-semibold transition-all hover:bg-black/5 dark:hover:bg-white/5 border border-dashed border-purple-500/30 text-purple-400"
              >
                <Plus className="w-4 h-4" /> Add Fallback Step
              </button>
            </motion.div>

            {/* Step 3: Agentic Capabilities Board */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="rounded-2xl p-5 space-y-4"
              style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-400" />
                <p className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--md-on-surface)" }}>
                  Step 3: Agentic Tools
                </p>
              </div>
              <p className="text-xs" style={{ color: "var(--md-on-surface-var)" }}>
                Attach automated tools that execute directly on your local edge to augment LLM capabilities.
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {TOOLS_CONFIG.map(tool => {
                  const active = selectedTools.includes(tool.id);
                  return (
                    <div
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className="p-3.5 rounded-2xl cursor-pointer flex items-center justify-between border transition-all hover:shadow-sm"
                      style={{
                        background: active ? "var(--md-primary-container)" : "var(--md-surface-2)",
                        borderColor: active ? "var(--md-primary)" : "var(--md-outline)",
                      }}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2 rounded-xl"
                          style={{
                            background: active ? "var(--md-on-primary)" : "var(--md-surface-1)",
                            color: active ? "var(--md-primary)" : "var(--md-on-surface-var)",
                          }}>
                          <tool.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold"
                            style={{ color: active ? "var(--md-on-primary-cont)" : "var(--md-on-surface)" }}>
                            {tool.name}
                          </p>
                          <p className="text-[10px] mt-0.5"
                            style={{ color: active ? "var(--md-on-primary-cont)" : "var(--md-on-surface-var)", opacity: active ? 0.85 : 1 }}>
                            {tool.description}
                          </p>
                        </div>
                      </div>
                      <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                        style={{
                          borderColor: active ? "var(--md-primary)" : "var(--md-outline)",
                          background: active ? "var(--md-primary)" : "transparent",
                        }}>
                        {active && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

          </div>

          {/* Right Column: Code Exporter & Live Control Room (Sticky) */}
          <div className="xl:sticky xl:top-8 space-y-6">
            
            {/* Dynamic Code Exporter Card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-2xl overflow-hidden border"
              style={{
                borderColor: "var(--md-outline)",
                boxShadow: "var(--shadow-2)"
              }}
            >
              {/* Tab Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b"
                style={{
                  background: "var(--md-surface-2)",
                  borderColor: "var(--md-outline)"
                }}
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--md-on-surface)" }}>
                    Edge SDK Exporter
                  </span>
                </div>
                
                {/* Language Selectors */}
                <div className="flex gap-1 bg-black/10 dark:bg-white/5 p-1 rounded-xl">
                  {(["javascript", "python"] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSdkLanguage(lang)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                      style={{
                        background: sdkLanguage === lang ? "var(--md-primary)" : "transparent",
                        color: sdkLanguage === lang ? "var(--md-on-primary)" : "var(--md-on-surface-var)",
                      }}
                    >
                      {lang === "javascript" ? "JS / TS" : "Python"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exporter Instructions */}
              <div className="px-4 py-3 text-[11px] leading-relaxed flex items-start gap-2"
                style={{
                  background: "var(--md-surface-3)",
                  color: "var(--md-on-surface-var)",
                  borderBottom: "1px solid var(--md-outline)",
                }}
              >
                <Info className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  Load keys securely from your server's local <code className="font-mono text-purple-400">.env</code> keys. 
                  Zero API credentials touch Nemix databases, eliminating all cloud leak risks.
                </span>
              </div>

              {/* Code console */}
              <div className="relative">
                {/* Copy overlay */}
                <button
                  onClick={copyToClipboard}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all border"
                  style={{
                    background: "rgba(20, 20, 30, 0.75)",
                    backdropFilter: "blur(4px)",
                    borderColor: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.85)"
                  }}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </>
                  )}
                </button>

                <pre className="p-5 text-[11px] font-mono overflow-auto scrollbar-none"
                  style={{
                    maxHeight: "380px",
                    lineHeight: 1.75,
                    background: "#0c0c12",
                    color: "#a9b2c3"
                  }}
                >
                  {activeCode.split("\n").map((line, i) => (
                    <div key={i} className="table-row">
                      <span className="table-cell text-right pr-4 select-none opacity-35 font-mono text-[10px] w-6">{i + 1}</span>
                      <span className="table-cell whitespace-pre-wrap">{line}</span>
                    </div>
                  ))}
                </pre>
              </div>
            </motion.div>

            {/* Live Configuration JSON Viewer */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-2xl p-5 space-y-3"
              style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--md-outline-var)" }}>
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-purple-400" />
                  <p className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--md-on-surface)" }}>
                    Rule Config Schema
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: "var(--md-surface-2)", color: "var(--md-on-surface-var)" }}>
                  JSON
                </span>
              </div>
              <pre className="p-3.5 rounded-xl text-[10px] font-mono overflow-auto scrollbar-none"
                style={{
                  maxHeight: "220px",
                  background: "var(--md-surface-2)",
                  color: "var(--md-on-surface-var)",
                  lineHeight: 1.6
                }}
              >
                {generatedJSON}
              </pre>
            </motion.div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
