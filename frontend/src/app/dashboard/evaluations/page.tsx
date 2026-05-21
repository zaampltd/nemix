"use client";
import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FlaskConical, Play, Check, Clock, AlertCircle, ChevronDown, BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MODELS_AVAILABLE = [
  "llama3-sentiment-v2",
  "gpt2-code-assistant",
  "bert-ner-pipeline",
];

const BENCHMARKS = [
  { id: "accuracy", name: "Accuracy Test", desc: "Measures correct answer rate on 100 classification samples.", tasks: 100 },
  { id: "latency", name: "Latency Benchmark", desc: "Measures p50/p95/p99 inference times over 500 requests.", tasks: 500 },
  { id: "robustness", name: "Robustness Test", desc: "Tests performance on noisy, adversarial, and edge-case inputs.", tasks: 200 },
  { id: "hallucination", name: "Hallucination Rate", desc: "Evaluates factual consistency and hallucination frequency.", tasks: 150 },
];

interface RunResult {
  id: string;
  model: string;
  benchmark: string;
  status: "running" | "done" | "failed";
  progress: number;
  score?: number;
  metrics?: Record<string, string | number>;
  startedAt: string;
  duration?: string;
}

function randomScore(benchId: string) {
  const bases: Record<string, number> = { accuracy: 85, latency: 80, robustness: 72, hallucination: 88 };
  return Math.round((bases[benchId] || 80) + (Math.random() * 10 - 5));
}

function randomMetrics(benchId: string, score: number): Record<string, string | number> {
  if (benchId === "accuracy") return { "Accuracy": `${score}%`, "F1 Score": `${(score * 0.97).toFixed(1)}%`, "Precision": `${Math.round(score + 1)}%`, "Recall": `${Math.round(score - 2)}%` };
  if (benchId === "latency") return { "p50": `${Math.round(80 + Math.random() * 40)}ms`, "p95": `${Math.round(150 + Math.random() * 80)}ms`, "p99": `${Math.round(250 + Math.random() * 120)}ms`, "Throughput": `${Math.round(30 + Math.random() * 20)} req/s` };
  if (benchId === "robustness") return { "Clean acc": `${score + 5}%`, "Noisy acc": `${score - 8}%`, "Adversarial": `${score - 15}%`, "Edge cases": `${score - 3}%` };
  return { "Hallucination rate": `${(100 - score).toFixed(1)}%`, "Factual accuracy": `${score}%`, "Consistency": `${score + 2}%`, "Self-contradiction": `${Math.round(Math.random() * 5)}%` };
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? "var(--md-success)" : score >= 70 ? "var(--md-warning)" : "var(--md-error)";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium" style={{ color: "var(--md-on-surface)" }}>Score</span>
        <span className="text-lg font-bold" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--md-surface-3)" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}

export default function EvaluationsPage() {
  const [selectedModel, setSelectedModel] = useState(MODELS_AVAILABLE[0]);
  const [selectedBench, setSelectedBench] = useState(BENCHMARKS[0].id);
  const [runs, setRuns] = useState<RunResult[]>([]);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleRun = () => {
    if (running) return;
    const bench = BENCHMARKS.find(b => b.id === selectedBench)!;
    const run: RunResult = {
      id: Date.now().toString(),
      model: selectedModel,
      benchmark: bench.name,
      status: "running",
      progress: 0,
      startedAt: new Date().toLocaleTimeString(),
    };
    setRuns(prev => [run, ...prev]);
    setRunning(true);

    const start = Date.now();
    const duration = 3000 + Math.random() * 2000;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 99);
      setRuns(prev => prev.map(r => r.id === run.id ? { ...r, progress: Math.round(pct) } : r));

      if (elapsed >= duration) {
        clearInterval(intervalRef.current!);
        const score = randomScore(selectedBench);
        const secs = ((Date.now() - start) / 1000).toFixed(1);
        setRuns(prev => prev.map(r => r.id === run.id ? {
          ...r, status: "done", progress: 100, score,
          metrics: randomMetrics(selectedBench, score),
          duration: `${secs}s`,
        } : r));
        setRunning(false);
      }
    }, 80);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const bench = BENCHMARKS.find(b => b.id === selectedBench)!;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--md-on-surface)" }}>Evaluations</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--md-on-surface-var)" }}>
            Benchmark your models on standardized test suites and compare results.
          </p>
        </div>

        {/* Run panel */}
        <div className="rounded-2xl p-6" style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--md-on-surface)" }}>Configure Evaluation</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Model selector */}
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>Model</label>
              <div className="relative">
                <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl text-sm"
                  style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)" }}>
                  {MODELS_AVAILABLE.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--md-on-surface-var)" }} />
              </div>
            </div>

            {/* Benchmark selector */}
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--md-on-surface-var)" }}>Benchmark</label>
              <div className="relative">
                <select value={selectedBench} onChange={e => setSelectedBench(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl text-sm"
                  style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline)", color: "var(--md-on-surface)" }}>
                  {BENCHMARKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--md-on-surface-var)" }} />
              </div>
            </div>
          </div>

          {/* Benchmark info */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "var(--md-surface-2)", border: "1px solid var(--md-outline)" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--md-on-surface)" }}>{bench.name}</p>
            <p className="text-xs mb-2" style={{ color: "var(--md-on-surface-var)" }}>{bench.desc}</p>
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--md-on-surface-var)" }}>
              <BarChart2 className="w-3.5 h-3.5" />
              {bench.tasks.toLocaleString()} test samples
            </div>
          </div>

          <button onClick={handleRun} disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity"
            style={{
              background: running ? "var(--md-surface-3)" : "var(--md-primary)",
              color: running ? "var(--md-on-surface-var)" : "var(--md-on-primary)",
              cursor: running ? "not-allowed" : "pointer",
            }}>
            {running ? (
              <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Running evaluation...</>
            ) : (
              <><Play className="w-4 h-4" />Run evaluation</>
            )}
          </button>
        </div>

        {/* Results */}
        {runs.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--md-on-surface)" }}>
              Results ({runs.length} run{runs.length > 1 ? "s" : ""})
            </h2>
            <div className="space-y-4">
              <AnimatePresence>
                {runs.map(run => (
                  <motion.div key={run.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-5"
                    style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>

                    {/* Run header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          {run.status === "running" && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--md-primary)" }} />}
                          {run.status === "done" && <Check className="w-3.5 h-3.5" style={{ color: "var(--md-success)" }} />}
                          {run.status === "failed" && <AlertCircle className="w-3.5 h-3.5" style={{ color: "var(--md-error)" }} />}
                          <span className="text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>{run.benchmark}</span>
                        </div>
                        <p className="text-xs font-mono" style={{ color: "var(--md-on-surface-var)" }}>{run.model}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--md-on-surface-var)" }}>
                          <Clock className="w-3 h-3" />
                          {run.status === "done" ? run.duration : run.startedAt}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block"
                          style={{
                            background: run.status === "done" ? "var(--md-success-cont)" : run.status === "running" ? "var(--md-primary-container)" : "var(--md-error-cont)",
                            color: run.status === "done" ? "var(--md-success)" : run.status === "running" ? "var(--md-on-primary-cont)" : "var(--md-error)",
                          }}>
                          {run.status}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar (while running) */}
                    {run.status === "running" && (
                      <div>
                        <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--md-on-surface-var)" }}>
                          <span>Processing samples...</span>
                          <span>{run.progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--md-surface-3)" }}>
                          <motion.div animate={{ width: `${run.progress}%` }} transition={{ duration: 0.2 }}
                            className="h-full rounded-full" style={{ background: "var(--md-primary)" }} />
                        </div>
                      </div>
                    )}

                    {/* Results (when done) */}
                    {run.status === "done" && run.score !== undefined && (
                      <div className="space-y-4">
                        <ScoreBar score={run.score} />
                        {run.metrics && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {Object.entries(run.metrics).map(([k, v]) => (
                              <div key={k} className="rounded-xl p-3 text-center" style={{ background: "var(--md-surface-2)" }}>
                                <p className="text-[10px] mb-0.5" style={{ color: "var(--md-on-surface-var)" }}>{k}</p>
                                <p className="text-sm font-bold" style={{ color: "var(--md-on-surface)" }}>{v}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {runs.length === 0 && (
          <div className="text-center py-16 rounded-2xl" style={{ border: "1px dashed var(--md-outline)" }}>
            <FlaskConical className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--md-outline)" }} />
            <p className="text-sm font-medium mb-1" style={{ color: "var(--md-on-surface)" }}>No evaluations yet</p>
            <p className="text-xs" style={{ color: "var(--md-on-surface-var)" }}>Select a model and benchmark above to run your first evaluation.</p>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
