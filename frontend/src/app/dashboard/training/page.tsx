"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Database, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  ChevronDown, 
  Plus, 
  Cpu, 
  Terminal, 
  RefreshCw, 
  Layers, 
  ArrowUpRight, 
  Search,
  Download,
  Settings2,
  Trash2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

// ── Types ─────────────────────────────────────────────────────────────
interface Job {
  id: string;
  name: string;
  baseModel: string;
  dataset: string;
  status: "running" | "completed" | "failed";
  progress: number;
  duration: string;
  epochs?: number;
  learningRate?: string;
  batchSize?: number;
}

// ── User's Exact Mock Data ────────────────────────────────────────────
const mockJobs: Job[] = [
  { id: "ft-9823", name: "Customer-Support-Bot", baseModel: "llama-3-8b", dataset: "support_tickets_v2.csv", status: "running", progress: 68, duration: "1h 15m (est)", epochs: 3, learningRate: "2e-4", batchSize: 8 },
  { id: "ft-9822", name: "Sentiment-Analyzer", baseModel: "mistral-7b", dataset: "twitter_feedback.jsonl", status: "completed", progress: 100, duration: "3h 42m", epochs: 3, learningRate: "1e-4", batchSize: 16 },
  { id: "ft-9821", name: "Code-Assistant-Python", baseModel: "gpt2-xl", dataset: "python_snippets.jsonl", status: "failed", progress: 12, duration: "14m", epochs: 1, learningRate: "5e-5", batchSize: 4 }
];

export default function TrainingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("ft-9823");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "running" | "completed" | "failed">("all");
  const [isMounted, setIsMounted] = useState(false);

  // New job modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJobName, setNewJobName] = useState("");
  const [newJobModel, setNewJobModel] = useState("llama-3-8b");
  const [newJobDataset, setNewJobDataset] = useState("support_tickets_v2.csv");
  const [newJobEpochs, setNewJobEpochs] = useState(3);
  const [newJobLR, setNewJobLR] = useState("2e-4");
  const [newJobBatchSize, setNewJobBatchSize] = useState(8);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount safely
  useEffect(() => {
    setIsMounted(true);
    const cached = localStorage.getItem("nemix_training_jobs");
    if (cached) {
      try {
        setJobs(JSON.parse(cached));
      } catch (e) {
        setJobs(mockJobs);
      }
    } else {
      setJobs(mockJobs);
      localStorage.setItem("nemix_training_jobs", JSON.stringify(mockJobs));
    }
  }, []);

  // Save to localStorage when jobs change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("nemix_training_jobs", JSON.stringify(jobs));
    }
  }, [jobs, isMounted]);

  // Real-time background simulation for active running training jobs
  useEffect(() => {
    if (!isMounted) return;

    const interval = setInterval(() => {
      setJobs(prevJobs => {
        let updated = false;
        const nextJobs = prevJobs.map(job => {
          if (job.status === "running") {
            updated = true;
            const newProgress = Math.min(100, job.progress + Math.floor(Math.random() * 4) + 2);
            const isFinished = newProgress >= 100;
              return {
                ...job,
                progress: newProgress,
                status: (isFinished ? "completed" : "running") as "running" | "completed" | "failed",
                duration: isFinished ? (job.duration.includes("(est)") ? "1h 48m" : job.duration) : job.duration
              };
          }
          return job;
        });

        if (updated) {
          return nextJobs;
        }
        return prevJobs;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isMounted]);

  // Auto-scroll terminal when active job logs grow
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [jobs, selectedJobId]);

  // Reset demo states back to clean mocks
  const handleResetData = () => {
    setJobs(mockJobs);
    setSelectedJobId("ft-9823");
  };

  // Launch a new training job simulation
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedName = newJobName.trim().replace(/\s+/g, "-") || `custom-fine-tune-${Math.floor(100 + Math.random() * 900)}`;
    const newJobId = `ft-${Math.floor(9824 + Math.random() * 1000)}`;

    const freshJob: Job = {
      id: newJobId,
      name: formattedName,
      baseModel: newJobModel,
      dataset: newJobDataset,
      status: "running",
      progress: 0,
      duration: "45m (est)",
      epochs: newJobEpochs,
      learningRate: newJobLR,
      batchSize: newJobBatchSize
    };

    setJobs(prev => [freshJob, ...prev]);
    setSelectedJobId(newJobId);
    setIsModalOpen(false);

    // Reset fields
    setNewJobName("");
    setNewJobEpochs(3);
    setNewJobLR("2e-4");
    setNewJobBatchSize(8);
  };

  // Abort/Cancel a running job
  const handleCancelJob = (id: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id === id && j.status === "running") {
        return {
          ...j,
          status: "failed",
          duration: "8m",
        };
      }
      return j;
    }));
  };

  // Delete a job from list
  const handleDeleteJob = (id: string) => {
    const nextJobs = jobs.filter(j => j.id !== id);
    setJobs(nextJobs);
    if (selectedJobId === id && nextJobs.length > 0) {
      setSelectedJobId(nextJobs[0].id);
    }
  };

  // Pre-generate dynamic realistic logs based on active selected job status & progress
  const getLogsForActiveJob = (job: Job) => {
    const lines: string[] = [];
    const timestamp = "2026-05-23T03:";

    if (job.status === "failed") {
      lines.push(`[${timestamp}14:02] [SYSTEM] Initializing Kubernetes orchestration node on Nvidia L40S Cluster...`);
      lines.push(`[${timestamp}14:04] [SYSTEM] Allocating GPU device VRAM blocks (24GB virtual cluster limit)...`);
      lines.push(`[${timestamp}14:08] [PIPELINE] Fetching foundation weights for base model: ${job.baseModel}...`);
      lines.push(`[${timestamp}14:15] [PIPELINE] Base model weights pulled securely from Nemix Model Vault.`);
      lines.push(`[${timestamp}14:18] [DATASET] Reading training dataset file: ${job.dataset}...`);
      lines.push(`[${timestamp}14:24] [DATASET] Parsed ${job.dataset} successfully. Detected raw text patterns.`);
      lines.push(`[${timestamp}14:28] [TOKENIZER] Initializing BPE tokenizer dictionary. Running mapping array...`);
      lines.push(`[${timestamp}14:32] [TOKENIZER] Generated token indexes. Batch sequences sized at 2048 context length.`);
      lines.push(`[${timestamp}14:35] [HYPERPARAMETERS] Configured: epochs=${job.epochs || 1}, lr=${job.learningRate || "5e-5"}, batch_size=${job.batchSize || 4}`);
      lines.push(`[${timestamp}14:40] [TRAIN] Starting Phase 1 adapter optimizer warm-up (step size: 100)...`);
      lines.push(`[${timestamp}14:45] [TRAIN] Step 10/1250 | Loss: 4.8210 | Perplexity: 124.09`);
      lines.push(`[${timestamp}14:50] [TRAIN] Step 50/1250 | Loss: 3.9421 | Perplexity: 51.52`);
      lines.push(`[${timestamp}14:58] [TRAIN] Step 120/1250 | Loss: 3.1205 | Perplexity: 22.65`);
      lines.push(`[${timestamp}15:00] [SYSTEM] ERROR: CUDA out of memory. Tried to allocate 18.52 GiB (GPU 0; 24.00 GiB total capacity; 21.32 GiB already allocated).`);
      lines.push(`[${timestamp}15:01] [SYSTEM] ERROR: Process 182390 terminated with non-zero exit status code [SIGSEGV].`);
      lines.push(`[${timestamp}15:01] [PIPELINE] FATAL: Training crashed at progress: ${job.progress}%. Hyperparameters may exceed resource constraints.`);
      return lines;
    }

    if (job.status === "completed") {
      lines.push(`[${timestamp}00:01] [SYSTEM] Initializing Kubernetes orchestration node on Nvidia L40S Cluster...`);
      lines.push(`[${timestamp}00:03] [SYSTEM] Allocating GPU device VRAM blocks (24GB virtual cluster limit)...`);
      lines.push(`[${timestamp}00:07] [PIPELINE] Fetching foundation weights for base model: ${job.baseModel}...`);
      lines.push(`[${timestamp}00:15] [PIPELINE] Base model weights pulled securely from Nemix Model Vault.`);
      lines.push(`[${timestamp}00:18] [DATASET] Reading training dataset file: ${job.dataset}...`);
      lines.push(`[${timestamp}00:24] [DATASET] Parsed ${job.dataset} successfully. Detected raw text patterns.`);
      lines.push(`[${timestamp}00:28] [TOKENIZER] Initializing BPE tokenizer dictionary. Running mapping array...`);
      lines.push(`[${timestamp}00:32] [TOKENIZER] Generated token indexes. Batch sequences sized at 2048 context length.`);
      lines.push(`[${timestamp}00:35] [HYPERPARAMETERS] Configured: epochs=${job.epochs || 3}, lr=${job.learningRate || "1e-4"}, batch_size=${job.batchSize || 8}`);
      lines.push(`[${timestamp}00:40] [TRAIN] Starting Phase 1 adapter optimizer warm-up (step size: 150)...`);
      lines.push(`[${timestamp}01:25] [TRAIN] Epoch 1/3 | Step 500/1500 | Loss: 1.8415 | Perplexity: 6.30 | Val Loss: 1.9841`);
      lines.push(`[${timestamp}02:10] [TRAIN] Epoch 2/3 | Step 1000/1500 | Loss: 0.9421 | Perplexity: 2.56 | Val Loss: 1.0205`);
      lines.push(`[${timestamp}03:15] [TRAIN] Epoch 3/3 | Step 1500/1500 | Loss: 0.3541 | Perplexity: 1.42 | Val Loss: 0.4902`);
      lines.push(`[${timestamp}03:32] [PIPELINE] Merging training LoRA parameters with base weights...`);
      lines.push(`[${timestamp}03:38] [PIPELINE] Optimizing fused model layers to BF16 float precision...`);
      lines.push(`[${timestamp}03:41] [PIPELINE] Compressing weights structure for serverless edge inference layout...`);
      lines.push(`[${timestamp}03:42] [SYSTEM] Saved adapter output reference: 'nemix-checkpoint-${job.name}'.`);
      lines.push(`[${timestamp}03:42] [SYSTEM] SUCCESS: Fine-tuning pipeline finished cleanly in ${job.duration}. Model weights compiled!`);
      return lines;
    }

    // Running / Simulated states
    lines.push(`[${timestamp}00:01] [SYSTEM] Initializing Kubernetes orchestration node on Nvidia L40S Cluster...`);
    
    if (job.progress > 5) {
      lines.push(`[${timestamp}00:04] [SYSTEM] GPU VRAM allocated. Pre-caching target foundation model ${job.baseModel}...`);
    }
    if (job.progress > 15) {
      lines.push(`[${timestamp}00:15] [PIPELINE] Successfully downloaded weights. Loading customer dataset file: ${job.dataset}...`);
    }
    if (job.progress > 25) {
      lines.push(`[${timestamp}00:32] [DATASET] Dataset validation pass: OK. Running token conversion mapping...`);
      lines.push(`[${timestamp}00:40] [TOKENIZER] Generated dictionary tokens. Launching backprop adamw optimizer...`);
    }
    if (job.progress > 45) {
      const step = Math.floor(job.progress * 8.5);
      const loss = (2.85 - (job.progress * 0.02) + Math.random() * 0.08).toFixed(4);
      lines.push(`[${timestamp}01:05] [TRAIN] Epoch 1/3 | Step ${step}/1500 | Average Training Loss: ${loss} | GPU Temp: 71°C`);
    }
    if (job.progress > 70) {
      const step = Math.floor(job.progress * 9.2);
      const loss = (1.45 - (job.progress * 0.008) + Math.random() * 0.04).toFixed(4);
      lines.push(`[${timestamp}01:25] [TRAIN] Epoch 2/3 | Step ${step}/1500 | Average Training Loss: ${loss} | GPU Memory Utility: 89.2%`);
    }
    if (job.progress > 85) {
      const loss = (0.65 - (job.progress * 0.002) + Math.random() * 0.02).toFixed(4);
      lines.push(`[${timestamp}01:42] [TRAIN] Epoch 3/3 | Step 1320/1500 | Average Training Loss: ${loss} | Perplexity: 1.91`);
    }
    
    // Pulse indicator for active training loop
    lines.push(`[${timestamp}${Math.floor(job.progress * 0.4)}:50] [ACTIVE] Step running... Batch Loss: ${(2.1 - (job.progress * 0.018)).toFixed(4)} ▋`);
    
    return lines;
  };

  if (!isMounted) {
    return (
      <DashboardLayout>
        <div className="flex h-[70vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin" style={{ color: "var(--md-primary)" }} />
        </div>
      </DashboardLayout>
    );
  }

  // Filtered lists
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.baseModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" ? true : job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 mb-8" style={{ borderColor: "var(--md-outline-var)" }}>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: "var(--md-on-surface)" }}>
              Fine-Tuning Hub
            </h1>
            <p className="text-sm" style={{ color: "var(--md-on-surface-var)" }}>
              Tailor powerful foundation LLMs to your domain-specific datasets using dedicated cloud GPU pipelines.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold hover:opacity-85 transition"
              style={{ 
                backgroundColor: "var(--md-surface-2)", 
                borderColor: "var(--md-outline)", 
                color: "var(--md-on-surface)" 
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Demo
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition duration-200"
              style={{ 
                backgroundColor: "var(--md-primary)", 
                color: "var(--md-on-primary)",
                boxShadow: "0 4px 14px 0 rgba(124, 106, 247, 0.3)"
              }}
            >
              <Plus className="h-4 w-4" />
              New Training Job
            </button>
          </div>
        </div>

        {/* ── KPI Stats Grid ── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          
          <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--md-surface-1)", borderColor: "var(--md-outline)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--md-on-surface-var)" }}>Total Run History</span>
              <Layers className="h-5 w-5" style={{ color: "var(--md-primary)" }} />
            </div>
            <p className="text-3xl font-bold mt-2" style={{ color: "var(--md-on-surface)" }}>{jobs.length}</p>
            <div className="mt-2 text-xs flex items-center gap-1.5" style={{ color: "var(--md-on-surface-var)" }}>
              <span className="font-semibold text-green-500">✓ 100%</span> cloud orchestration
            </div>
          </div>

          <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--md-surface-1)", borderColor: "var(--md-outline)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--md-on-surface-var)" }}>Active Training Runs</span>
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--md-primary)" }}></span>
                <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: "var(--md-primary)" }}></span>
              </div>
            </div>
            <p className="text-3xl font-bold mt-2" style={{ color: "var(--md-on-surface)" }}>
              {jobs.filter(j => j.status === "running").length}
            </p>
            <div className="mt-2 text-xs" style={{ color: "var(--md-on-surface-var)" }}>
              {jobs.some(j => j.status === "running") ? "GPU execution pipeline hot" : "All nodes in idle queue"}
            </div>
          </div>

          <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--md-surface-1)", borderColor: "var(--md-outline)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--md-on-surface-var)" }}>Pipeline Success Rate</span>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold mt-2" style={{ color: "var(--md-on-surface)" }}>
              {jobs.length > 0 ? `${Math.round((jobs.filter(j => j.status === "completed").length / jobs.length) * 100)}%` : "0%"}
            </p>
            <div className="mt-2 text-xs flex items-center gap-1" style={{ color: "var(--md-on-surface-var)" }}>
              <span className="font-semibold text-red-500">
                {jobs.filter(j => j.status === "failed").length} failed
              </span>
              crashes recorded
            </div>
          </div>

          <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--md-surface-1)", borderColor: "var(--md-outline)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--md-on-surface-var)" }}>Aggregated GPU Compute</span>
              <Activity className="h-5 w-5" style={{ color: "var(--md-warning)" }} />
            </div>
            <p className="text-3xl font-bold mt-2" style={{ color: "var(--md-on-surface)" }}>5.2 Hours</p>
            <div className="mt-2 text-xs" style={{ color: "var(--md-on-surface-var)" }}>
              On-demand Nvidia A100/L40S
            </div>
          </div>

        </div>

        {/* ── Main Two-Column Structure ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT COLUMN: Sidebar & Search List */}
          <div className="space-y-4">
            
            {/* Search and Filters Card */}
            <div className="p-4 rounded-2xl border space-y-3" style={{ backgroundColor: "var(--md-surface-1)", borderColor: "var(--md-outline)" }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--md-on-surface-var)" }} />
                <input
                  type="text"
                  placeholder="Search by ID, name or base..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border focus:outline-none transition"
                  style={{
                    backgroundColor: "var(--md-surface-2)",
                    borderColor: "var(--md-outline)",
                    color: "var(--md-on-surface)"
                  }}
                />
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(["all", "running", "completed", "failed"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition"
                    style={{
                      backgroundColor: statusFilter === tab ? "var(--md-primary-container)" : "transparent",
                      color: statusFilter === tab ? "var(--md-on-primary-cont)" : "var(--md-on-surface-var)",
                      border: `1px solid ${statusFilter === tab ? "var(--md-primary)" : "transparent"}`
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Jobs */}
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {filteredJobs.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border" style={{ backgroundColor: "var(--md-surface-1)", borderColor: "var(--md-outline-var)" }}>
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--md-on-surface-var)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>No jobs found</p>
                  <p className="text-xs mt-1" style={{ color: "var(--md-on-surface-var)" }}>Try modifying filters or start a new training run.</p>
                </div>
              ) : (
                filteredJobs.map(job => {
                  const isActive = selectedJobId === job.id;
                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className="group p-5 rounded-2xl border text-left cursor-pointer transition duration-200 hover:scale-[1.01]"
                      style={{
                        backgroundColor: isActive ? "var(--md-primary-container)" : "var(--md-surface-1)",
                        borderColor: isActive ? "var(--md-primary)" : "var(--md-outline)",
                        boxShadow: isActive ? "0 4px 20px -2px rgba(124, 106, 247, 0.12)" : "none"
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4" style={{ color: isActive ? "var(--md-primary)" : "var(--md-on-surface-var)" }} />
                          <span className="font-bold text-sm truncate max-w-[140px]" style={{ color: "var(--md-on-surface)" }}>
                            {job.name}
                          </span>
                        </div>
                        {/* Status Icon */}
                        {job.status === "completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {job.status === "failed" && <AlertCircle className="h-4 w-4 text-red-500" />}
                        {job.status === "running" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                      </div>

                      {/* Info Row */}
                      <div className="flex items-center justify-between text-xs mb-3" style={{ color: "var(--md-on-surface-var)" }}>
                        <span className="font-mono">{job.id}</span>
                        <span>{job.duration}</span>
                      </div>

                      {/* Progress Bar Container */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]" style={{ color: "var(--md-on-surface-var)" }}>
                          <span>Fine-tuning Progress</span>
                          <span className="font-bold" style={{ color: "var(--md-on-surface)" }}>{job.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: "var(--md-surface-3)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${job.progress}%`,
                              backgroundColor: job.status === "completed" ? "var(--md-success)" : 
                                               job.status === "failed" ? "var(--md-error)" : 
                                               "var(--md-primary)"
                            }}
                          />
                        </div>
                      </div>

                      {/* Hover action elements */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t text-[10px]" style={{ borderColor: isActive ? "rgba(124, 106, 247, 0.15)" : "var(--md-outline-var)" }}>
                        <div className="flex items-center gap-1.5" style={{ color: "var(--md-on-surface-var)" }}>
                          <Cpu className="h-3 w-3" />
                          <span>{job.baseModel}</span>
                        </div>
                        <div className="flex items-center gap-1.5" style={{ color: "var(--md-on-surface-var)" }}>
                          <Database className="h-3 w-3" />
                          <span className="truncate max-w-[80px]">{job.dataset}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Active Job detailed console & monitor logs */}
          {selectedJob && (
            <div className="lg:col-span-2 space-y-6">
              
              {/* Detailed Summary Card */}
              <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--md-surface-1)", borderColor: "var(--md-outline)" }}>
                
                {/* Header info */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: "var(--md-surface-2)", color: "var(--md-on-surface)" }}>
                        {selectedJob.id}
                      </span>
                      <h2 className="text-xl font-bold" style={{ color: "var(--md-on-surface)" }}>
                        {selectedJob.name}
                      </h2>
                    </div>
                    <p className="text-xs" style={{ color: "var(--md-on-surface-var)" }}>
                      Base Model: <span className="font-mono text-xs">{selectedJob.baseModel}</span> • Dataset: <span className="font-mono text-xs">{selectedJob.dataset}</span>
                    </p>
                  </div>
                  
                  {/* Status Badge & Actions */}
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5"
                      style={{
                        backgroundColor: selectedJob.status === "completed" ? "var(--md-success-cont)" :
                                         selectedJob.status === "failed" ? "var(--md-error-cont)" :
                                         "rgba(59, 130, 246, 0.1)",
                        borderColor: selectedJob.status === "completed" ? "var(--md-success)" :
                                     selectedJob.status === "failed" ? "var(--md-error)" :
                                     "rgb(59, 130, 246)",
                        color: selectedJob.status === "completed" ? "var(--md-success)" :
                               selectedJob.status === "failed" ? "var(--md-error)" :
                               "rgb(59, 130, 246)"
                      }}
                    >
                      {selectedJob.status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
                      {selectedJob.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                      {selectedJob.status === "failed" && <AlertCircle className="h-3 w-3" />}
                      <span className="capitalize">{selectedJob.status}</span>
                    </span>

                    {/* Quick actions for state */}
                    {selectedJob.status === "running" && (
                      <button
                        onClick={() => handleCancelJob(selectedJob.id)}
                        className="px-3 py-1 rounded-lg text-xs font-bold transition hover:opacity-85"
                        style={{ backgroundColor: "var(--md-error-cont)", color: "var(--md-error)", border: "1px solid var(--md-error)" }}
                      >
                        Abort Run
                      </button>
                    )}
                    {selectedJob.status === "completed" && (
                      <button
                        onClick={() => alert(`Initiating seamless edge deployment for ${selectedJob.name}...`)}
                        className="px-3 py-1 rounded-lg text-xs font-bold transition hover:opacity-85 flex items-center gap-1"
                        style={{ backgroundColor: "var(--md-primary)", color: "var(--md-on-primary)" }}
                      >
                        Deploy
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteJob(selectedJob.id)}
                      className="p-1.5 rounded-lg border hover:bg-red-500/10 hover:text-red-500 transition"
                      style={{ borderColor: "var(--md-outline)", color: "var(--md-on-surface-var)" }}
                      title="Delete record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Hyperparameters Config Block */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl mb-6 border" style={{ backgroundColor: "var(--md-surface-2)", borderColor: "var(--md-outline)" }}>
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: "var(--md-on-surface-var)" }}>Epochs Count</span>
                    <span className="font-mono text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>{selectedJob.epochs || 3}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: "var(--md-on-surface-var)" }}>Learning Rate</span>
                    <span className="font-mono text-sm font-semibold text-purple-400" style={{ color: "var(--md-primary)" }}>{selectedJob.learningRate || "2e-4"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: "var(--md-on-surface-var)" }}>Optimizer Batch</span>
                    <span className="font-mono text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>{selectedJob.batchSize || 8}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: "var(--md-on-surface-var)" }}>Job Duration</span>
                    <span className="font-mono text-sm font-semibold flex items-center gap-1" style={{ color: "var(--md-on-surface)" }}>
                      <Clock className="h-3.5 w-3.5" style={{ color: "var(--md-warning)" }} />
                      {selectedJob.duration}
                    </span>
                  </div>
                </div>

                {/* Main Progress Bar detail */}
                <div className="space-y-2 mb-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span style={{ color: "var(--md-on-surface-var)" }}>Progress Gauge</span>
                    <span style={{ color: "var(--md-on-surface)" }}>{selectedJob.progress}%</span>
                  </div>
                  <div className="h-3.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: "var(--md-surface-3)" }}>
                    <div 
                      className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                      style={{ 
                        width: `${selectedJob.progress}%`,
                        backgroundColor: selectedJob.status === "completed" ? "var(--md-success)" : 
                                         selectedJob.status === "failed" ? "var(--md-error)" : 
                                         "var(--md-primary)"
                      }}
                    >
                      {selectedJob.status === "running" && (
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Logs Terminal console */}
              <div className="rounded-2xl border overflow-hidden flex flex-col shadow-lg" style={{ backgroundColor: "var(--md-surface-1)", borderColor: "var(--md-outline)" }}>
                
                {/* Terminal Header */}
                <div className="px-5 py-3 border-b flex items-center justify-between" style={{ backgroundColor: "var(--md-surface-2)", borderColor: "var(--md-outline)" }}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
                      <span className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
                    </div>
                    <Terminal className="h-4 w-4 ml-2" style={{ color: "var(--md-on-surface-var)" }} />
                    <span className="text-xs font-mono font-bold" style={{ color: "var(--md-on-surface)" }}>
                      stdout.log • fine-tune-console
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const logs = getLogsForActiveJob(selectedJob).join("\n");
                        navigator.clipboard.writeText(logs);
                        alert("Console logs copied to clipboard!");
                      }}
                      className="p-1 px-2.5 rounded text-[10px] font-bold border transition duration-150 hover:bg-neutral-800"
                      style={{ backgroundColor: "var(--md-surface-1)", borderColor: "var(--md-outline)", color: "var(--md-on-surface-var)" }}
                    >
                      Copy Logs
                    </button>
                  </div>
                </div>

                {/* Console Terminal Screen */}
                <div className="p-6 h-[340px] overflow-y-auto font-mono text-[11px] leading-relaxed scroll-smooth flex flex-col space-y-1.5" style={{ backgroundColor: "#060608" }}>
                  {getLogsForActiveJob(selectedJob).map((line, idx) => {
                    let textColor = "text-zinc-400";
                    if (line.includes("[ERROR]") || line.includes("CRITICAL") || line.includes("FATAL")) {
                      textColor = "text-red-400 font-medium";
                    } else if (line.includes("SUCCESS")) {
                      textColor = "text-green-400 font-bold";
                    } else if (line.includes("[ACTIVE]") || line.includes("[TRAIN]")) {
                      textColor = "text-blue-400";
                    } else if (line.includes("[SYSTEM]")) {
                      textColor = "text-purple-400/90";
                    } else if (line.includes("Downloading") || line.includes("Reading")) {
                      textColor = "text-yellow-400/80";
                    }

                    return (
                      <div key={idx} className={`${textColor} break-all hover:bg-white/5 px-1 py-0.5 rounded transition`}>
                        {line}
                      </div>
                    );
                  })}
                  <div ref={terminalEndRef} />
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* ── New Job Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop blur overlay */}
          <div 
            onClick={() => setIsModalOpen(false)} 
            className="absolute inset-0 backdrop-blur-sm transition duration-300"
            style={{ backgroundColor: "var(--md-scrim)" }}
          />

          {/* Modal Container */}
          <div 
            className="relative w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border transition duration-300 transform scale-100 z-10"
            style={{ backgroundColor: "var(--md-surface-1)", borderColor: "var(--md-outline)" }}
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: "var(--md-outline-var)" }}>
              <div>
                <h3 className="text-xl font-bold" style={{ color: "var(--md-on-surface)" }}>
                  Configure New Training Job
                </h3>
                <p className="text-xs" style={{ color: "var(--md-on-surface-var)" }}>
                  Provision secure cluster resources and custom parameters for fine-tuning.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg border hover:bg-neutral-800 transition"
                style={{ borderColor: "var(--md-outline)", color: "var(--md-on-surface-var)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateJob} className="space-y-5">
              
              {/* Job Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--md-on-surface-var)" }}>
                  Job Reference Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Finance-Risk-Classifier"
                  required
                  value={newJobName}
                  onChange={e => setNewJobName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  style={{
                    backgroundColor: "var(--md-surface-2)",
                    borderColor: "var(--md-outline)",
                    color: "var(--md-on-surface)"
                  }}
                />
              </div>

              {/* Models & Datasets dropdown row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Select Base Model */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--md-on-surface-var)" }}>
                    Foundation Base Model
                  </label>
                  <div className="relative">
                    <select
                      value={newJobModel}
                      onChange={e => setNewJobModel(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border text-sm appearance-none cursor-pointer focus:outline-none"
                      style={{
                        backgroundColor: "var(--md-surface-2)",
                        borderColor: "var(--md-outline)",
                        color: "var(--md-on-surface)"
                      }}
                    >
                      <option value="llama-3-8b">Llama 3 (8B) - Recommended</option>
                      <option value="mistral-7b">Mistral (7B)</option>
                      <option value="gemma-2-9b">Gemma 2 (9B)</option>
                      <option value="gpt2-xl">GPT-2 XL (1.5B)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--md-on-surface-var)" }} />
                  </div>
                </div>

                {/* Select Dataset */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--md-on-surface-var)" }}>
                    Target Dataset
                  </label>
                  <div className="relative">
                    <select
                      value={newJobDataset}
                      onChange={e => setNewJobDataset(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border text-sm appearance-none cursor-pointer focus:outline-none"
                      style={{
                        backgroundColor: "var(--md-surface-2)",
                        borderColor: "var(--md-outline)",
                        color: "var(--md-on-surface)"
                      }}
                    >
                      <option value="support_tickets_v2.csv">support_tickets_v2.csv (14K rows)</option>
                      <option value="twitter_feedback.jsonl">twitter_feedback.jsonl (8K rows)</option>
                      <option value="python_snippets.jsonl">python_snippets.jsonl (50K rows)</option>
                      <option value="medical_dialogues.csv">medical_dialogues.csv (22K rows)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--md-on-surface-var)" }} />
                  </div>
                </div>

              </div>

              {/* Slider for Epochs */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--md-on-surface-var)" }}>
                    Training Epochs
                  </label>
                  <span className="text-xs font-bold" style={{ color: "var(--md-primary)" }}>
                    {newJobEpochs} epoch{newJobEpochs > 1 ? "s" : ""}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={newJobEpochs}
                  onChange={e => setNewJobEpochs(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px]" style={{ color: "var(--md-on-surface-var)" }}>
                  <span>1 (Fast adapter)</span>
                  <span>5</span>
                  <span>10 (Full converge)</span>
                </div>
              </div>

              {/* Learning Rate & Batch Size row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Select Learning Rate */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--md-on-surface-var)" }}>
                    Learning Rate
                  </label>
                  <div className="relative">
                    <select
                      value={newJobLR}
                      onChange={e => setNewJobLR(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border text-sm appearance-none cursor-pointer focus:outline-none"
                      style={{
                        backgroundColor: "var(--md-surface-2)",
                        borderColor: "var(--md-outline)",
                        color: "var(--md-on-surface)"
                      }}
                    >
                      <option value="5e-4">5e-4 (Aggressive)</option>
                      <option value="2e-4">2e-4 (Recommended)</option>
                      <option value="1e-4">1e-4 (Standard)</option>
                      <option value="5e-5">5e-5 (Conservative)</option>
                      <option value="1e-5">1e-5 (Extremely slow)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--md-on-surface-var)" }} />
                  </div>
                </div>

                {/* Select Batch Size */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--md-on-surface-var)" }}>
                    Optimizer Batch Size
                  </label>
                  <div className="relative">
                    <select
                      value={newJobBatchSize}
                      onChange={e => setNewJobBatchSize(Number(e.target.value))}
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border text-sm appearance-none cursor-pointer focus:outline-none"
                      style={{
                        backgroundColor: "var(--md-surface-2)",
                        borderColor: "var(--md-outline)",
                        color: "var(--md-on-surface)"
                      }}
                    >
                      <option value="2">2 (Very low memory)</option>
                      <option value="4">4 (Low memory)</option>
                      <option value="8">8 (Recommended)</option>
                      <option value="16">16 (High memory/fused)</option>
                      <option value="32">32 (A100 required)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--md-on-surface-var)" }} />
                  </div>
                </div>

              </div>

              {/* Hyperparameters Config Block */}
              <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--md-surface-2)", borderColor: "var(--md-outline-var)", fontFamily: "monospace", fontSize: "11px" }}>
                <div style={{ color: "var(--md-primary)", marginBottom: "4px" }}># Pipeline cluster manifest</div>
                <div style={{ color: "var(--md-on-surface-var)" }}>resource_class: <span style={{ color: "var(--md-success)" }}>"on-demand.nvidia-l40s"</span></div>
                <div style={{ color: "var(--md-on-surface-var)" }}>dataset: <span style={{ color: "rgb(59, 130, 246)" }}>"{newJobDataset}"</span></div>
                <div style={{ color: "var(--md-on-surface-var)" }}>hyperparameters: &#123; epochs: {newJobEpochs}, lr: "{newJobLR}", batch_size: {newJobBatchSize} &#125;</div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: "var(--md-outline-var)" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border font-bold text-sm transition"
                  style={{
                    backgroundColor: "var(--md-surface-2)",
                    borderColor: "var(--md-outline)",
                    color: "var(--md-on-surface)"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm hover:scale-[1.01] transition"
                  style={{
                    backgroundColor: "var(--md-primary)",
                    color: "var(--md-on-primary)"
                  }}
                >
                  Launch Pipeline
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
