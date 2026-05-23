"use client";
import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  GitBranch, Plus, ChevronDown, RefreshCw, Trash2, CheckCircle2, 
  Clock, AlertCircle, Play, Terminal, Download, X, ArrowRight, ArrowLeft,
  Sparkles, Key, Check, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Pipeline {
  id: string;
  name: string;
  trigger: "manual" | "schedule" | "dataset_update";
  schedule?: string;
  datasetTrigger?: string;
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
    trigger: "dataset_update", datasetTrigger: "support_tickets_v2.csv",
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

  // Dynamic datasets dropdown options inside wizard
  const [datasetsOptions, setDatasetsOptions] = useState<string[]>([]);

  // Stepper Wizard states
  const [wizardStep, setWizardStep] = useState(1);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState<"manual" | "schedule" | "dataset_update">("manual");
  const [newSchedule, setNewSchedule] = useState("0 2 * * *");
  const [selectedDataset, setSelectedDataset] = useState("");
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  
  // Integrations states
  const [slackWebhook, setSlackWebhook] = useState("");
  const [emailAlert, setEmailAlert] = useState(false);

  useEffect(() => {
    try {
      const local = JSON.parse(localStorage.getItem("local_datasets") || "[]");
      const list = local.map((d: any) => d.name);
      setDatasetsOptions([...list, "support_tickets_v2.csv", "twitter_feedback.jsonl", "python_snippets.jsonl"]);
      if (list.length > 0) setSelectedDataset(list[0]);
      else setSelectedDataset("support_tickets_v2.csv");
    } catch {
      setDatasetsOptions(["support_tickets_v2.csv", "twitter_feedback.jsonl", "python_snippets.jsonl"]);
      setSelectedDataset("support_tickets_v2.csv");
    }
  }, []);

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
      datasetTrigger: newTrigger === "dataset_update" ? selectedDataset : undefined,
      steps: selectedSteps,
      status: "idle",
    };
    setPipelines(prev => [np, ...prev]);
    
    // Reset parameters
    setNewName(""); 
    setSelectedSteps([]); 
    setNewTrigger("manual"); 
    setSlackWebhook("");
    setEmailAlert(false);
    setWizardStep(1);
    setShowCreate(false);
  };

  const addStepToTimeline = (step: string) => {
    setSelectedSteps(prev => [...prev, step]);
  };

  const removeStepFromTimeline = (index: number) => {
    setSelectedSteps(prev => prev.filter((_, idx) => idx !== index));
  };

  const generateYamlManifest = () => {
    return `version: "1.0"\nname: "${newName || "Untitled Pipeline"}"\ntrigger: "${newTrigger}"\n${
      newTrigger === "schedule" ? `schedule: "${newSchedule}"\n` : 
      newTrigger === "dataset_update" ? `dataset_event: "${selectedDataset}"\n` : ""
    }\nsteps:\n${selectedSteps.map((s, idx) => `  - id: step_${idx + 1}\n    type: "${s.toLowerCase().replace(/[^a-z0-9]/gi, '_')}"\n    name: "${s}"`).join("\n")}\n\nnotifications:\n  slack: ${slackWebhook ? `"${slackWebhook}"` : "disabled"}\n  email_alerts: ${emailAlert ? "enabled" : "disabled"}`;
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--md-on-surface)" }}>Pipelines</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--md-on-surface-var)" }}>
              Automate fine-tune → evaluate → deploy workflows on a schedule or trigger.
            </p>
          </div>
          <button onClick={() => { setWizardStep(1); setShowCreate(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-90 cursor-pointer shadow-sm"
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
                className="rounded-2xl p-5 border shadow-sm"
                style={{ background: "var(--md-surface-1)", borderColor: "var(--md-outline)", boxShadow: "var(--shadow-1)" }}>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "var(--md-primary-container)" }}>
                      <GitBranch className="w-4.5 h-4.5" style={{ color: "var(--md-on-primary-cont)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-extrabold text-sm truncate" style={{ color: "var(--md-on-surface)" }}>{p.name}</h3>
                        <StatusBadge status={running === p.id ? "running" : p.status} />
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border"
                          style={{ background: "var(--md-surface-2)", color: "var(--md-on-surface-var)", borderColor: "var(--md-outline-var)" }}>
                          {p.trigger === "schedule" ? `⏱ ${p.schedule}` : p.trigger === "dataset_update" ? `🔔 ${p.datasetTrigger || "Dataset update"}` : "▶ Manual"}
                        </span>
                      </div>

                      {/* Steps badges horizontal flow */}
                      <div className="flex flex-wrap gap-1.5 mb-3.5">
                        {p.steps.map((s, idx) => (
                          <span key={s} className="flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full border font-semibold"
                            style={{ background: "var(--md-surface-2)", color: "var(--md-on-surface-var)", borderColor: "var(--md-outline-var)" }}>
                            <span className="font-bold text-[var(--md-primary)]">{idx + 1}</span>
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Progress bar while running */}
                      {running === p.id && p.progress !== undefined && (
                        <div className="mb-3.5">
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--md-surface-3)" }}>
                            <motion.div animate={{ width: `${p.progress}%` }} transition={{ duration: 0.3 }}
                              className="h-full rounded-full" style={{ background: "var(--md-primary)" }} />
                          </div>
                          <p className="text-[10px] mt-1.5 font-bold" style={{ color: "var(--md-on-surface-var)" }}>{p.progress}% complete</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-[10px] font-semibold" style={{ color: "var(--md-on-surface-var)" }}>
                        {p.lastRun && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[var(--md-primary)]" />Last: {p.lastRun}</span>}
                        {p.duration && <span>Duration: {p.duration}</span>}
                        {(MOCK_LOGS[p.id] || running === p.id) && (
                          <button onClick={() => { setViewLogs(p); setLiveLogs(running === p.id ? liveLogs : MOCK_LOGS[p.id] || []); }}
                            className="flex items-center gap-1 transition-colors cursor-pointer text-[var(--md-primary)] hover:opacity-85">
                            <Terminal className="w-3.5 h-3.5" /> View logs
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    <button onClick={() => handleRun(p.id)} disabled={!!running}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer hover:scale-[1.02]"
                      style={{
                        background: running === p.id ? "var(--md-surface-3)" : "var(--md-primary-container)",
                        color: running === p.id ? "var(--md-on-surface-var)" : "var(--md-on-primary-cont)",
                      }}>
                      {running === p.id
                        ? <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />Running</>
                        : <><Play className="w-3 h-3 text-[var(--md-primary)]" />Run</>}
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-xl transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: "var(--md-on-surface-var)" }}>
                      <Trash2 className="w-3.5 h-3.5 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 3-Step Create pipeline stepper modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "var(--md-scrim)" }} onClick={() => setShowCreate(false)}>
              <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
                className="w-full max-w-xl rounded-3xl p-6 max-h-[92vh] overflow-y-auto"
                style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-3)" }}
                onClick={e => e.stopPropagation()}>

                {/* Modal Top Header */}
                <div className="flex items-center justify-between mb-5 border-b pb-3" style={{ borderColor: "var(--md-outline-var)" }}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                    <h2 className="font-bold text-base" style={{ color: "var(--md-on-surface)" }}>Create Automation Pipeline</h2>
                  </div>
                  <button onClick={() => setShowCreate(false)} className="cursor-pointer" style={{ color: "var(--md-on-surface-var)" }}><X className="w-4 h-4" /></button>
                </div>

                {/* Stepper Header Progress Tracker */}
                <div className="mb-6 relative py-2">
                  <div className="flex justify-between items-center relative z-10">
                    {[
                      { num: 1, label: "Info & Trigger" },
                      { num: 2, label: "Workflow Steps" },
                      { num: 3, label: "Integrations" }
                    ].map(s => (
                      <div key={s.num} className="flex flex-col items-center gap-1.5 flex-1">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border"
                          style={{
                            background: wizardStep >= s.num ? "var(--md-primary)" : "var(--md-surface-2)",
                            borderColor: wizardStep >= s.num ? "var(--md-primary)" : "var(--md-outline)",
                            color: wizardStep >= s.num ? "var(--md-on-primary)" : "var(--md-on-surface-var)",
                            boxShadow: wizardStep === s.num ? "0 0 10px rgba(124, 106, 247, 0.3)" : "none"
                          }}
                        >
                          {s.num}
                        </div>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-center"
                          style={{ color: wizardStep >= s.num ? "var(--md-primary)" : "var(--md-on-surface-var)" }}>
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Connector Line */}
                  <div className="absolute top-[21px] left-[16.6%] right-[16.6%] h-[2px] bg-[var(--md-outline-var)] z-0">
                    <motion.div
                      className="h-full bg-[var(--md-primary)]"
                      animate={{ width: wizardStep === 1 ? "0%" : wizardStep === 2 ? "50%" : "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* STEP 1: Basic Config & Triggers */}
                {wizardStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>Pipeline Name *</label>
                      <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Daily fine-tune and deploy"
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold outline-none"
                        style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)" }} />
                    </div>

                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>Choose Execution Trigger</label>
                      <div className="flex gap-2">
                        {(["manual", "schedule", "dataset_update"] as const).map(t => (
                          <button key={t} type="button" onClick={() => setNewTrigger(t)}
                            className="flex-1 py-2 rounded-xl text-[10px] font-bold transition-all capitalize border cursor-pointer"
                            style={{
                              background: newTrigger === t ? "var(--md-primary-container)" : "var(--md-surface-2)",
                              color: newTrigger === t ? "var(--md-on-primary-cont)" : "var(--md-on-surface-var)",
                              borderColor: newTrigger === t ? "var(--md-primary)" : "var(--md-outline)",
                            }}>
                            {t.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </div>

                    {newTrigger === "schedule" && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                        <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>Cron Interval Expression</label>
                        <input value={newSchedule} onChange={e => setNewSchedule(e.target.value)}
                          placeholder="Cron expression e.g. 0 2 * * *"
                          className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold outline-none"
                          style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)" }} />
                        <span className="text-[9px] opacity-75 mt-1 block px-1" style={{ color: "var(--md-on-surface-var)" }}>
                          Standard notation format: Min, Hour, Day of Month, Month, Day of Week.
                        </span>
                      </motion.div>
                    )}

                    {newTrigger === "dataset_update" && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                        <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>Triggering Dataset Event</label>
                        <div className="relative">
                          <select value={selectedDataset} onChange={e => setSelectedDataset(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border appearance-none outline-none cursor-pointer"
                            style={{ background: "var(--md-surface-2)", borderColor: "var(--md-outline)", color: "var(--md-on-surface)" }}>
                            {datasetsOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-60" style={{ color: "var(--md-on-surface)" }} />
                        </div>
                        <span className="text-[9px] opacity-75 mt-1 block px-1" style={{ color: "var(--md-on-surface-var)" }}>
                          Pipeline triggers automatically when new records are written or uploaded to this dataset.
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* STEP 2: Workflow Steps Configuration */}
                {wizardStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Left: Available Steps Catalog */}
                      <div>
                        <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--md-on-surface-var)" }}>Available Actions Library</label>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {STEP_TEMPLATES.map(step => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => addStepToTimeline(step)}
                              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                              style={{ background: "var(--md-surface-2)", borderColor: "var(--md-outline)", color: "var(--md-on-surface)" }}
                            >
                              <span>{step}</span>
                              <Plus className="w-3.5 h-3.5 text-[var(--md-primary)]" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Right: Ordered Timeline Execution Sequence */}
                      <div className="flex flex-col">
                        <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--md-on-surface-var)" }}>
                          Timeline Sequence ({selectedSteps.length} steps)
                        </label>
                        <div className="flex-1 rounded-2xl p-3 max-h-56 overflow-y-auto space-y-1.5 border"
                          style={{ background: "var(--md-surface-2)", borderColor: "var(--md-outline)" }}>
                          {selectedSteps.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-10">
                              <Info className="w-6 h-6 mb-1 text-[var(--md-primary)] animate-pulse" />
                              <p className="text-[10px] font-bold">Timeline is empty</p>
                              <p className="text-[9px] max-w-xs mt-0.5">Click actions in the library to build the sequential MLOps pipeline chain in order.</p>
                            </div>
                          ) : (
                            selectedSteps.map((step, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-1.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in"
                                style={{ background: "var(--md-surface-1)", borderColor: "var(--md-outline)" }}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold bg-[var(--md-primary-container)] text-[var(--md-on-primary-cont)]">
                                    {idx + 1}
                                  </span>
                                  <span className="truncate">{step}</span>
                                </div>
                                <button type="button" onClick={() => removeStepFromTimeline(idx)} className="cursor-pointer shrink-0 ml-1 hover:text-red-400">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Integrations & Live Manifest Preview */}
                {wizardStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Left: Integration Options */}
                      <div className="space-y-3.5">
                        <label className="text-xs font-semibold block" style={{ color: "var(--md-on-surface-var)" }}>Integrations & Alerts</label>
                        
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70" style={{ color: "var(--md-on-surface-var)" }}>Slack Webhook Integration</span>
                          <input value={slackWebhook} onChange={e => setSlackWebhook(e.target.value)}
                            placeholder="https://hooks.slack.com/services/..."
                            className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                            style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)" }} />
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-2xl border" style={{ backgroundColor: "var(--md-surface-2)", borderColor: "var(--md-outline)" }}>
                          <div>
                            <span className="text-xs font-bold block" style={{ color: "var(--md-on-surface)" }}>Email Alert Notifier</span>
                            <span className="text-[9px] opacity-75 mt-0.5 block" style={{ color: "var(--md-on-surface-var)" }}>Send pipeline failures reports to developer</span>
                          </div>
                          <input type="checkbox" checked={emailAlert} onChange={e => setEmailAlert(e.target.checked)}
                            className="w-4 h-4 cursor-pointer accent-[var(--md-primary)]" />
                        </div>
                      </div>

                      {/* Right: Live Blueprint YAML Manifest */}
                      <div className="flex flex-col text-left">
                        <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--md-on-surface-var)" }}>Live Pipeline Manifest Blueprint</label>
                        <pre className="flex-1 p-3.5 rounded-2xl font-mono text-[9px] leading-relaxed overflow-x-auto border max-h-48"
                          style={{ background: "#0D1117", borderColor: "var(--md-outline-var)", color: "#3dd68c" }}>
                          {generateYamlManifest()}
                        </pre>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* Footer buttons */}
                <div className="flex justify-between items-center gap-3 mt-6 pt-3 border-t" style={{ borderColor: "var(--md-outline-var)" }}>
                  
                  {/* Left Cancel / Back */}
                  {wizardStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setWizardStep(prev => prev - 1)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-1 cursor-pointer"
                      style={{ background: "transparent", borderColor: "var(--md-outline)", color: "var(--md-on-surface-var)" }}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer"
                      style={{ background: "transparent", borderColor: "var(--md-outline)", color: "var(--md-on-surface-var)" }}
                    >
                      Cancel
                    </button>
                  )}

                  {/* Right Next / Submit */}
                  {wizardStep < 3 ? (
                    <button
                      type="button"
                      disabled={wizardStep === 1 ? !newName.trim() : selectedSteps.length === 0}
                      onClick={() => setWizardStep(prev => prev + 1)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      style={{ background: "var(--md-primary)", color: "var(--md-on-primary)" }}
                    >
                      Next <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreate}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold transition-opacity hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
                      style={{ background: "var(--md-primary)", color: "var(--md-on-primary)", boxShadow: "var(--shadow-1)" }}>
                      <Check className="w-4 h-4" /> Create Pipeline
                    </button>
                  )}
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
                className="w-full max-w-2xl rounded-3xl overflow-hidden border shadow-3xl"
                style={{ background: "var(--md-surface)", borderColor: "var(--md-outline)" }}
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--md-outline)" }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--md-on-surface)" }}>Logs — {viewLogs.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--md-on-surface-var)" }}>Last run: {viewLogs.lastRun || "now"}</p>
                  </div>
                  <button onClick={() => setViewLogs(null)} className="cursor-pointer" style={{ color: "var(--md-on-surface-var)" }}><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 h-72 overflow-y-auto scrollbar-none font-mono text-xs space-y-1"
                  style={{ background: "var(--md-surface-2)" }}>
                  {(running === viewLogs.id ? liveLogs : MOCK_LOGS[viewLogs.id] || []).map((log, i) => (
                    <div key={i} style={{ color: log.includes("✓") ? "var(--md-success)" : log.includes("✗") || log.includes("FAIL") ? "var(--md-error)" : "var(--md-on-surface-var)" }}>
                      {log}
                    </div>
                  ))}
                  {running === viewLogs.id && (
                    <div className="flex items-center gap-2 mt-1.5" style={{ color: "var(--md-primary)" }}>
                      <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Processing sequential tasks...
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
