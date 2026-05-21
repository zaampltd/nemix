"use client";
import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GitBranch, Plus, ChevronDown, RefreshCw, Trash2, CheckCircle2, Clock, AlertCircle, Play, Terminal, Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Pipeline {
  id: string;
  name: string;
  trigger: "manual" | "schedule" | "dataset_update";
  schedule?: string;
  steps: string[];
  status: "idle" | "running" | "success" | "failed";
  lastRun?: string;
  duration?: string;
  progress?: number;
  logs?: string[];
}

const INITIAL_PIPELINES: Pipeline[] = [
  {
    id: "p1", name: "Daily Fine-tune → Deploy",
    trigger: "schedule", schedule: "0 2 * * *",
    steps: ["Validate dataset", "LoRA fine-tune", "Run evaluation", "Deploy if score > 85"],
    status: "success", lastRun: "Today at 02:00", duration: "42m 18s",
  },
  {
    id: "p2", name: "RAG Embedding Refresh",
    trigger: "dataset_update",
    steps: ["Detect new documents", "Chunk text", "Generate embeddings", "Update vector store"],
    status: "idle", lastRun: "Yesterday",
  },
  {
    id: "p3", name: "Weekly Benchmark Suite",
    trigger: "schedule", schedule: "0 9 * * 1",
    steps: ["Run accuracy test", "Run latency benchmark", "Run robustness test", "Send report"],
    status: "failed", lastRun: "Monday 09:00", duration: "18m 04s",
  },
];

const STEP_TEMPLATES = [
  "Validate dataset",
  "Preprocess & clean data",
  "LoRA fine-tune",
  "Run accuracy evaluation",
  "Run latency benchmark",
  "Deploy to staging",
  "Deploy to production",
  "Send Slack notification",
  "Generate embeddings",
  "Update vector store",
];

const MOCK_LOGS: Record<string, string[]> = {
  p1: [
    "[02:00:01] Pipeline started: Daily Fine-tune → Deploy",
    "[02:00:03] ✓ Validate dataset — 2,418 samples OK",
    "[02:00:04] → Starting LoRA fine-tune on llama3-sentiment-v2",
    "[02:31:22] ✓ LoRA fine-tune complete — loss: 0.082",
    "[02:31:25] → Running evaluation suite",
    "[02:41:18] ✓ Evaluation score: 91.4 (threshold: 85) — PASS",
    "[02:41:20] → Deploying to production endpoint",
    "[02:42:18] ✓ Deployment complete — nemix.app/api/llama3-sentiment-v2",
    "[02:42:18] Pipeline finished in 42m 17s ✓",
  ],
  p3: [
    "[09:00:01] Pipeline started: Weekly Benchmark Suite",
    "[09:00:03] → Running accuracy test (100 samples)",
    "[09:06:14] ✓ Accuracy test done — 88.2%",
    "[09:06:15] → Running latency benchmark (500 requests)",
    "[09:12:44] ✓ Latency benchmark done — p50: 134ms",
    "[09:12:45] → Running robustness test",
    "[09:18:04] ✗ ERROR: OOM on adversarial batch — CUDA out of memory",
    "[09:18:04] Pipeline FAILED at step 3/4",
  ],
};

function StatusBadge({ status }: { status: Pipeline["status"] }) {
  const cfg = {
    idle:    { bg: "var(--md-surface-3)",       color: "var(--md-on-surface-var)", label: "Idle" },
    running: { bg: "var(--md-primary-container)", color: "var(--md-on-primary-cont)", label: "Running" },
    success: { bg: "var(--md-success-cont)",     color: "var(--md-success)",       label: "Success" },
    failed:  { bg: "var(--md-error-cont)",       color: "var(--md-error)",         label: "Failed" },
  }[status];
  return (
    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>(INITIAL_PIPELINES);
  const [showCreate, setShowCreate] = useState(false);
  const [viewLogs, setViewLogs] = useState<Pipeline | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // New pipeline form
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState<"manual" | "schedule" | "dataset_update">("manual");
  const [newSchedule, setNewSchedule] = useState("0 2 * * *");
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveLogs]);

  const handleRun = async (id: string) => {
    if (running) return;
    setRunning(id);
    const p = pipelines.find(x => x.id === id)!;
    setPipelines(prev => prev.map(x => x.id === id ? { ...x, status: "running", progress: 0 } : x));

    const fakeLogs: string[] = [];
    const stepDuration = 1200;

    for (let i = 0; i < p.steps.length; i++) {
      await new Promise(r => setTimeout(r, stepDuration));
      const pct = Math.round(((i + 1) / p.steps.length) * 100);
      const log = `[${new Date().toLocaleTimeString()}] ✓ ${p.steps[i]} — done`;
      fakeLogs.push(log);
      setLiveLogs([...fakeLogs]);
      setPipelines(prev => prev.map(x => x.id === id ? { ...x, progress: pct } : x));
    }

    await new Promise(r => setTimeout(r, 500));
    setPipelines(prev => prev.map(x => x.id === id ? {
      ...x, status: "success", progress: 100,
      lastRun: "Just now", duration: `${(p.steps.length * 1.2).toFixed(0)}m`,
    } : x));
    setRunning(null);
  };

  const handleDelete = (id: string) => {
    setPipelines(prev => prev.filter(x => x.id !== id));
  };

  const handleCreate = () => {
    if (!newName.trim() || selectedSteps.length === 0) return;
    const np: Pipeline = {
      id: Date.now().toString(),
      name: newName.trim(),
      trigger: newTrigger,
      schedule: newTrigger === "schedule" ? newSchedule : undefined,
      steps: selectedSteps,
      status: "idle",
    };
    setPipelines(prev => [np, ...prev]);
    setNewName(""); setSelectedSteps([]); setNewTrigger("manual");
    setShowCreate(false);
  };

  const toggleStep = (step: string) =>
    setSelectedSteps(prev => prev.includes(step) ? prev.filter(s => s !== step) : [...prev, step]);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--md-on-surface)" }}>Pipelines</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--md-on-surface-var)" }}>
              Automate fine-tune → evaluate → deploy workflows on a schedule or trigger.
            </p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--md-primary)", color: "var(--md-on-primary)" }}>
            <Plus className="w-4 h-4" /> New pipeline
          </button>
        </div>

        {/* Pipelines list */}
        <div className="space-y-3">
          <AnimatePresence>
            {pipelines.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl p-5"
                style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "var(--md-primary-container)" }}>
                      <GitBranch className="w-4.5 h-4.5" style={{ color: "var(--md-on-primary-cont)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm" style={{ color: "var(--md-on-surface)" }}>{p.name}</h3>
                        <StatusBadge status={running === p.id ? "running" : p.status} />
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "var(--md-surface-2)", color: "var(--md-on-surface-var)", border: "1px solid var(--md-outline)" }}>
                          {p.trigger === "schedule" ? `⏱ ${p.schedule}` : p.trigger === "dataset_update" ? "🔔 On dataset update" : "▶ Manual"}
                        </span>
                      </div>

                      {/* Steps */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {p.steps.map((s, idx) => (
                          <span key={s} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: "var(--md-surface-2)", color: "var(--md-on-surface-var)", border: "1px solid var(--md-outline)" }}>
                            <span style={{ color: "var(--md-primary)", fontWeight: 600 }}>{idx + 1}</span>
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Progress bar while running */}
                      {running === p.id && p.progress !== undefined && (
                        <div className="mb-3">
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--md-surface-3)" }}>
                            <motion.div animate={{ width: `${p.progress}%` }} transition={{ duration: 0.3 }}
                              className="h-full rounded-full" style={{ background: "var(--md-primary)" }} />
                          </div>
                          <p className="text-[10px] mt-1" style={{ color: "var(--md-on-surface-var)" }}>{p.progress}% complete</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-[10px]" style={{ color: "var(--md-on-surface-var)" }}>
                        {p.lastRun && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Last: {p.lastRun}</span>}
                        {p.duration && <span>Duration: {p.duration}</span>}
                        {(MOCK_LOGS[p.id] || running === p.id) && (
                          <button onClick={() => { setViewLogs(p); setLiveLogs(running === p.id ? liveLogs : MOCK_LOGS[p.id] || []); }}
                            className="flex items-center gap-1 transition-colors"
                            style={{ color: "var(--md-primary)" }}>
                            <Terminal className="w-3 h-3" /> View logs
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => handleRun(p.id)} disabled={!!running}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: running === p.id ? "var(--md-surface-3)" : "var(--md-primary-container)",
                        color: running === p.id ? "var(--md-on-surface-var)" : "var(--md-on-primary-cont)",
                      }}>
                      {running === p.id
                        ? <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />Running</>
                        : <><Play className="w-3 h-3" />Run</>}
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-xl transition-colors"
                      style={{ color: "var(--md-on-surface-var)" }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Create pipeline modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "var(--md-scrim)" }} onClick={() => setShowCreate(false)}>
              <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
                className="w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
                style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-3)" }}
                onClick={e => e.stopPropagation()}>

                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-base" style={{ color: "var(--md-on-surface)" }}>New Pipeline</h2>
                  <button onClick={() => setShowCreate(false)} style={{ color: "var(--md-on-surface-var)" }}><X className="w-4 h-4" /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>Pipeline name *</label>
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Daily fine-tune and deploy"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                      style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)" }} />
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>Trigger</label>
                    <div className="flex gap-2">
                      {(["manual", "schedule", "dataset_update"] as const).map(t => (
                        <button key={t} onClick={() => setNewTrigger(t)}
                          className="flex-1 py-2 rounded-xl text-xs font-medium transition-all capitalize"
                          style={{
                            background: newTrigger === t ? "var(--md-primary-container)" : "var(--md-surface-2)",
                            color: newTrigger === t ? "var(--md-on-primary-cont)" : "var(--md-on-surface-var)",
                            border: "1px solid var(--md-outline)",
                          }}>
                          {t.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                    {newTrigger === "schedule" && (
                      <input value={newSchedule} onChange={e => setNewSchedule(e.target.value)}
                        placeholder="Cron expression e.g. 0 2 * * *"
                        className="w-full mt-2 px-3.5 py-2 rounded-xl text-xs font-mono"
                        style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)" }} />
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-2 block" style={{ color: "var(--md-on-surface-var)" }}>
                      Steps * <span className="font-normal opacity-60">({selectedSteps.length} selected)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {STEP_TEMPLATES.map(step => (
                        <button key={step} onClick={() => toggleStep(step)}
                          className="text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2"
                          style={{
                            background: selectedSteps.includes(step) ? "var(--md-primary-container)" : "var(--md-surface-2)",
                            color: selectedSteps.includes(step) ? "var(--md-on-primary-cont)" : "var(--md-on-surface-var)",
                            border: "1px solid var(--md-outline)",
                          }}>
                          {selectedSteps.includes(step) && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                          {step}
                        </button>
                      ))}
                    </div>
                    {selectedSteps.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedSteps.map((s, i) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: "var(--md-surface-3)", color: "var(--md-on-surface-var)" }}>
                            {i + 1}. {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                    style={{ border: "1px solid var(--md-outline)", color: "var(--md-on-surface-var)" }}>Cancel</button>
                  <button onClick={handleCreate} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
                    style={{ background: "var(--md-primary)", color: "var(--md-on-primary)" }}>
                    Create pipeline
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Log viewer modal */}
        <AnimatePresence>
          {viewLogs && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
              style={{ background: "var(--md-scrim)" }} onClick={() => setViewLogs(null)}>
              <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-2xl rounded-3xl overflow-hidden"
                style={{ background: "var(--md-surface)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-3)" }}
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--md-outline)" }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--md-on-surface)" }}>Logs — {viewLogs.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--md-on-surface-var)" }}>Last run: {viewLogs.lastRun || "now"}</p>
                  </div>
                  <button onClick={() => setViewLogs(null)} style={{ color: "var(--md-on-surface-var)" }}><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 h-72 overflow-y-auto scrollbar-none font-mono text-xs space-y-1"
                  style={{ background: "var(--md-surface-2)" }}>
                  {(running === viewLogs.id ? liveLogs : MOCK_LOGS[viewLogs.id] || []).map((log, i) => (
                    <div key={i} style={{ color: log.includes("✓") ? "var(--md-success)" : log.includes("✗") || log.includes("FAIL") ? "var(--md-error)" : "var(--md-on-surface-var)" }}>
                      {log}
                    </div>
                  ))}
                  {running === viewLogs.id && (
                    <div className="flex items-center gap-2" style={{ color: "var(--md-primary)" }}>
                      <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  )}
                  <div ref={logsEndRef} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
}
