"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Trash2,
  Sparkles,
  MessageSquare
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

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
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("ft-9823");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "running" | "completed" | "failed">("all");
  const [isMounted, setIsMounted] = useState(false);

  // New job modal & wizard states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newJobName, setNewJobName] = useState("");
  const [newJobModel, setNewJobModel] = useState("llama-3-8b");
  const [customBaseModel, setCustomBaseModel] = useState("");
  const [newJobDataset, setNewJobDataset] = useState("support_tickets_v2.csv");
  const [newJobEpochs, setNewJobEpochs] = useState(3);
  const [newJobLR, setNewJobLR] = useState("2e-4");
  const [newJobBatchSize, setNewJobBatchSize] = useState(8);
  const [userCreatedModels, setUserCreatedModels] = useState<any[]>([]);
  const [userDatasets, setUserDatasets] = useState<any[]>([]);
  const [modelSource, setModelSource] = useState<"foundation" | "created">("foundation");

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [streamedLogs, setStreamedLogs] = useState<string[]>([]);
  const lastJobIdRef = useRef<string>("");

  // Stream logs dynamically line by line
  useEffect(() => {
    const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];
    if (!selectedJob) return;

    const targetLogs = getLogsForActiveJob(selectedJob);
    
    // If the job changed, clear streamed logs immediately and start from index 0
    if (selectedJobId !== lastJobIdRef.current) {
      lastJobIdRef.current = selectedJobId;
      setStreamedLogs([]);
      
      let index = 0;
      const delay = selectedJob.status === "running" ? 250 : 100;
      const timer = setInterval(() => {
        if (index < targetLogs.length) {
          const line = targetLogs[index];
          setStreamedLogs(prev => [...prev, line]);
          index++;
        } else {
          clearInterval(timer);
        }
      }, delay);
      return () => clearInterval(timer);
    } else {
      // Same job: logs might have grown because of a progress update.
      // Catch up smoothly from streamedLogs.length to targetLogs.length.
      const delay = selectedJob.status === "running" ? 250 : 100;
      const timer = setInterval(() => {
        setStreamedLogs(current => {
          if (current.length < targetLogs.length) {
            return [...current, targetLogs[current.length]];
          } else {
            clearInterval(timer);
            return current;
          }
        });
      }, delay);
      return () => clearInterval(timer);
    }
  }, [selectedJobId, jobs]);

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

  // Fetch user created models from Firestore & localStorage fallbacks
  useEffect(() => {
    if (!isMounted) return;

    const loadUserModels = async () => {
      try {
        const q = query(collection(db, "UserModels"), where("userId", "==", "test-user-123"));
        const snapshot = await getDocs(q);
        const fetched: any[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          fetched.push({
            id: doc.id,
            name: data.name,
            baseModel: data.base_model || data.baseModel || "llama-3-8b",
            taskType: data.task_type || data.taskType || "Text Generation",
            status: data.status || "Ready",
            version: data.version || "1.0.0"
          });
        });
        
        if (fetched.length > 0) {
          setUserCreatedModels(fetched);
          localStorage.setItem("nemix_user_created_models", JSON.stringify(fetched));
        } else {
          // Try loading from localStorage fallback
          const cachedModels = localStorage.getItem("nemix_user_created_models");
          if (cachedModels) {
            setUserCreatedModels(JSON.parse(cachedModels));
          } else {
            // Safe mock fallback for user created models
            setUserCreatedModels([
              { id: "m-001", name: "Finance-Sentiment-Llama", baseModel: "llama-3-8b", taskType: "Text Classification", status: "Ready", version: "1.0.0" },
              { id: "m-002", name: "Health-QA-Mistral", baseModel: "mistral-7b", taskType: "Question Answering", status: "Ready", version: "1.0.2" }
            ]);
          }
        }
      } catch (err) {
        console.error("Error loading user models:", err);
        const cachedModels = localStorage.getItem("nemix_user_created_models");
        if (cachedModels) {
          setUserCreatedModels(JSON.parse(cachedModels));
        } else {
          setUserCreatedModels([
            { id: "m-001", name: "Finance-Sentiment-Llama", baseModel: "llama-3-8b", taskType: "Text Classification", status: "Ready", version: "1.0.0" },
            { id: "m-002", name: "Health-QA-Mistral", baseModel: "mistral-7b", taskType: "Question Answering", status: "Ready", version: "1.0.2" }
          ]);
        }
      }
    };

    loadUserModels();
  }, [isMounted]);

  // Fetch datasets from Firestore UserDatasets & localStorage cache
  useEffect(() => {
    if (!isMounted) return;

    const loadDatasets = async () => {
      try {
        const q = query(collection(db, "UserDatasets"), where("userId", "==", "test-user-123"));
        const snapshot = await getDocs(q);
        const fetched: any[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            name: data.name || "Unnamed Dataset",
            size: data.row_count ? `${(data.row_count / 1000).toFixed(0)}K rows` : "0 rows",
            desc: data.description || "Custom user dataset file.",
            icon: data.file_type === "csv" ? "🎫" : data.file_type === "jsonl" ? "🐦" : "📁"
          });
        });

        // Load from LocalStorage
        let locals: any[] = [];
        try {
          const cached = localStorage.getItem("local_datasets");
          if (cached) {
            locals = JSON.parse(cached).map((d: any) => ({
              id: d.id,
              name: d.name,
              size: d.row_count ? `${(d.row_count / 1000).toFixed(0)}K rows` : "0 rows",
              desc: d.description || "Custom user dataset file.",
              icon: d.file_type === "csv" ? "🎫" : d.file_type === "jsonl" ? "🐦" : "📁"
            }));
          }
        } catch {}

        const initialPresets = [
          { id: "support_tickets_v2.csv", name: "support_tickets_v2.csv", size: "14K rows", desc: "Customer support tickets & dialogues.", icon: "🎫" },
          { id: "twitter_feedback.jsonl", name: "twitter_feedback.jsonl", size: "8K rows", desc: "Social media reviews & sentiment data.", icon: "🐦" },
          { id: "python_snippets.jsonl", name: "python_snippets.jsonl", size: "50K rows", desc: "Python coding samples & syntax structures.", icon: "🐍" },
          { id: "medical_dialogues.csv", name: "medical_dialogues.csv", size: "22K rows", desc: "Doctor-patient conversation dialogues.", icon: "🏥" }
        ];

        // Merge them cleanly
        const combined = [...fetched, ...locals];
        // Filter presets to avoid duplicates
        const nonDuplicates = initialPresets.filter(p => !combined.some(c => c.name === p.name));
        setUserDatasets([...combined, ...nonDuplicates]);
      } catch (err) {
        console.error("Failed to load user datasets:", err);
        // Fallback to presets
        setUserDatasets([
          { id: "support_tickets_v2.csv", name: "support_tickets_v2.csv", size: "14K rows", desc: "Customer support tickets & dialogues.", icon: "🎫" },
          { id: "twitter_feedback.jsonl", name: "twitter_feedback.jsonl", size: "8K rows", desc: "Social media reviews & sentiment data.", icon: "🐦" },
          { id: "python_snippets.jsonl", name: "python_snippets.jsonl", size: "50K rows", desc: "Python coding samples & syntax structures.", icon: "🐍" },
          { id: "medical_dialogues.csv", name: "medical_dialogues.csv", size: "22K rows", desc: "Doctor-patient conversation dialogues.", icon: "🏥" }
        ]);
      }
    };

    loadDatasets();
  }, [isMounted]);

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

  // Auto-scroll terminal when active job logs stream/grow
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamedLogs]);

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
      baseModel: newJobModel === "custom" ? (customBaseModel.trim() || "custom-model") : newJobModel,
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
    setCustomBaseModel("");
    setNewJobEpochs(3);
    setNewJobLR("2e-4");
    setNewJobBatchSize(8);
    setWizardStep(1);
    setModelSource("foundation");
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
                        onClick={() => {
                          const newDepID = `ep_${Date.now()}`;
                          const newDep = {
                            id: newDepID,
                            name: `${selectedJob.name}-endpoint`.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
                            model: selectedJob.name,
                            region: 'us-east-1',
                            status: 'provisioning',
                            latency: 0,
                            rps: 0,
                            uptime: '—',
                            calls: '0',
                            url: `https://api.nemix.ai/v1/${newDepID}/infer`,
                            created: new Date().toISOString().split('T')[0],
                            local: true
                          };

                          try {
                            const existing = JSON.parse(localStorage.getItem('local_deployments') || '[]');
                            localStorage.setItem('local_deployments', JSON.stringify([newDep, ...existing]));
                          } catch (e) {
                            localStorage.setItem('local_deployments', JSON.stringify([newDep]));
                          }

                          router.push('/dashboard/deployments');
                        }}
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
                        const logs = streamedLogs.join("\n");
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
                  {streamedLogs.map((line, idx) => {
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
            className="relative w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl border transition duration-300 transform scale-100 z-10 overflow-hidden flex flex-col"
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

            {/* Stepper Progress Bar */}
            <div className="mb-8 relative flex items-center justify-between px-6">
              {/* Connector line */}
              <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-0.5 bg-[var(--md-surface-3)] z-0" />
              <div 
                className="absolute left-[10%] top-1/2 -translate-y-1/2 h-0.5 bg-[var(--md-primary)] z-0 transition-all duration-300" 
                style={{ width: wizardStep === 1 ? "0%" : wizardStep === 2 ? "33%" : wizardStep === 3 ? "66%" : "100%" }}
              />

              {/* Step 1 */}
              <button
                type="button"
                onClick={() => newJobName.trim() && setWizardStep(1)}
                className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none"
                disabled={!newJobName.trim()}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition duration-200 ${
                    wizardStep >= 1 ? "bg-[var(--md-primary)] text-[var(--md-on-primary)]" : "bg-[var(--md-surface-2)] text-[var(--md-on-surface-var)]"
                  } border`}
                  style={{ borderColor: wizardStep >= 1 ? "var(--md-primary)" : "var(--md-outline)" }}
                >
                  1
                </div>
                <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: wizardStep === 1 ? "var(--md-primary)" : "var(--md-on-surface-var)" }}>
                  Pipeline
                </span>
              </button>

              {/* Step 2 */}
              <button
                type="button"
                onClick={() => newJobName.trim() && setWizardStep(2)}
                className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none"
                disabled={!newJobName.trim()}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition duration-200 ${
                    wizardStep >= 2 ? "bg-[var(--md-primary)] text-[var(--md-on-primary)]" : "bg-[var(--md-surface-2)] text-[var(--md-on-surface-var)]"
                  } border`}
                  style={{ borderColor: wizardStep >= 2 ? "var(--md-primary)" : "var(--md-outline)" }}
                >
                  2
                </div>
                <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: wizardStep === 2 ? "var(--md-primary)" : "var(--md-on-surface-var)" }}>
                  Source
                </span>
              </button>

              {/* Step 3 */}
              <button
                type="button"
                onClick={() => newJobName.trim() && setWizardStep(3)}
                className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none"
                disabled={!newJobName.trim()}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition duration-200 ${
                    wizardStep >= 3 ? "bg-[var(--md-primary)] text-[var(--md-on-primary)]" : "bg-[var(--md-surface-2)] text-[var(--md-on-surface-var)]"
                  } border`}
                  style={{ borderColor: wizardStep >= 3 ? "var(--md-primary)" : "var(--md-outline)" }}
                >
                  3
                </div>
                <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: wizardStep === 3 ? "var(--md-primary)" : "var(--md-on-surface-var)" }}>
                  Model
                </span>
              </button>

              {/* Step 4 */}
              <button
                type="button"
                onClick={() => newJobName.trim() && setWizardStep(4)}
                className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none"
                disabled={!newJobName.trim()}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition duration-200 ${
                    wizardStep >= 4 ? "bg-[var(--md-primary)] text-[var(--md-on-primary)]" : "bg-[var(--md-surface-2)] text-[var(--md-on-surface-var)]"
                  } border`}
                  style={{ borderColor: wizardStep >= 4 ? "var(--md-primary)" : "var(--md-outline)" }}
                >
                  4
                </div>
                <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: wizardStep === 4 ? "var(--md-primary)" : "var(--md-on-surface-var)" }}>
                  Compute
                </span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateJob} className="space-y-6 flex-1 overflow-y-auto pr-1">
              
              {/* STEP 1: General Info & Target Dataset */}
              {wizardStep === 1 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-250">
                  {/* Job Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--md-on-surface-var)" }}>
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

                  {/* Dataset Selector Grid */}
                  <div className="space-y-3">
                    <label className="block text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--md-on-surface-var)" }}>
                      Select Target Training Dataset
                    </label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                      {userDatasets.map(dataset => {
                        const isSelected = newJobDataset === dataset.id || newJobDataset === dataset.name;
                        return (
                          <div
                            key={dataset.id}
                            onClick={() => setNewJobDataset(dataset.name || dataset.id)}
                            className="p-4 rounded-2xl border text-left cursor-pointer transition duration-150 flex items-start gap-3 hover:scale-[1.01]"
                            style={{
                              backgroundColor: isSelected ? "var(--md-primary-container)" : "var(--md-surface-2)",
                              borderColor: isSelected ? "var(--md-primary)" : "var(--md-outline-var)",
                              boxShadow: isSelected ? "0 0 10px rgba(124, 106, 247, 0.1)" : "none"
                            }}
                          >
                            <span className="text-2xl">{dataset.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate" style={{ color: "var(--md-on-surface)" }}>
                                {dataset.name}
                              </p>
                              <p className="text-[10px] mt-0.5" style={{ color: isSelected ? "var(--md-primary)" : "var(--md-on-surface-var)" }}>
                                {dataset.size}
                              </p>
                              <p className="text-[9px] mt-1 line-clamp-2" style={{ color: "var(--md-on-surface-var)" }}>
                                {dataset.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Model Source Selection */}
              {wizardStep === 2 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-250">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-center" style={{ color: "var(--md-on-surface-var)" }}>
                    Where is the target model coming from?
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Source 1: Foundation Models */}
                    <div
                      onClick={() => {
                        setModelSource("foundation");
                        setNewJobModel("llama-3-8b");
                        setCustomBaseModel("");
                        setWizardStep(3); // Auto-advance!
                      }}
                      className={`p-6 rounded-3xl border text-left cursor-pointer transition duration-200 flex flex-col items-center text-center gap-4 hover:scale-[1.02] ${
                        modelSource === "foundation" ? "border-[var(--md-primary)] bg-[var(--md-primary-container)]" : "border-[var(--md-outline-var)] bg-[var(--md-surface-2)]"
                      }`}
                      style={{
                        boxShadow: modelSource === "foundation" ? "0 8px 30px rgba(124, 106, 247, 0.12)" : "none"
                      }}
                    >
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-purple-500/10 text-[var(--md-primary)] text-3xl">
                        🤗
                      </div>
                      <div>
                        <h4 className="text-sm font-bold" style={{ color: "var(--md-on-surface)" }}>Foundation Models</h4>
                        <p className="text-[10px] mt-2 leading-relaxed" style={{ color: "var(--md-on-surface-var)" }}>
                          Fine-tune standard pre-cached LLMs (Llama 3, Mistral, Gemma 2, GPT-2 XL) or specify a Hugging Face hub repository path.
                        </p>
                      </div>
                    </div>

                    {/* Source 2: User Created Models */}
                    <div
                      onClick={() => {
                        setModelSource("created");
                        if (userCreatedModels.length > 0) {
                          setNewJobModel(userCreatedModels[0].name);
                        } else {
                          setNewJobModel("");
                        }
                        setCustomBaseModel("");
                        setWizardStep(3); // Auto-advance!
                      }}
                      className={`p-6 rounded-3xl border text-left cursor-pointer transition duration-200 flex flex-col items-center text-center gap-4 hover:scale-[1.02] ${
                        modelSource === "created" ? "border-[var(--md-primary)] bg-[var(--md-primary-container)]" : "border-[var(--md-outline-var)] bg-[var(--md-surface-2)]"
                      }`}
                      style={{
                        boxShadow: modelSource === "created" ? "0 8px 30px rgba(124, 106, 247, 0.12)" : "none"
                      }}
                    >
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-purple-500/10 text-[var(--md-primary)] text-3xl">
                        🧠
                      </div>
                      <div>
                        <h4 className="text-sm font-bold" style={{ color: "var(--md-on-surface)" }}>Your Custom Models</h4>
                        <p className="text-[10px] mt-2 leading-relaxed" style={{ color: "var(--md-on-surface-var)" }}>
                          Fine-tune one of your custom model configurations created on the Models Page (fetched from Firestore database).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Model Selection Grid (Dynamic based on Step 2 Source) */}
              {wizardStep === 3 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-250">
                  <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--md-outline-var)" }}>
                    <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--md-on-surface-var)" }}>
                      Choose Model to Fine-Tune
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--md-surface-3)] capitalize" style={{ color: "var(--md-primary)" }}>
                      Source: {modelSource === "foundation" ? "Foundation" : "Custom Created"}
                    </span>
                  </div>

                  {/* A: Foundation Models List */}
                  {modelSource === "foundation" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                        {[
                          { id: "llama-3-8b", name: "Llama 3 (8B)", desc: "Meta's recommended dialog and instruct model.", icon: "🦙" },
                          { id: "mistral-7b", name: "Mistral (7B)", desc: "High reasoning compact task model.", icon: "🌀" },
                          { id: "gemma-2-9b", name: "Gemma 2 (9B)", desc: "Google lightweight high-performance SOTA.", icon: "💎" },
                          { id: "gpt2-xl", name: "GPT-2 XL (1.5B)", desc: "Classic light text autoregressive model.", icon: "⚙️" },
                          { id: "custom", name: "Custom Path", desc: "Specify any custom Hugging Face model repository.", icon: "🤗" }
                        ].map(model => {
                          const isSelected = newJobModel === model.id;
                          return (
                            <div
                              key={model.id}
                              onClick={() => {
                                setNewJobModel(model.id);
                                if (model.id !== "custom") setCustomBaseModel("");
                              }}
                              className="p-4 rounded-2xl border text-left cursor-pointer transition duration-150 flex items-start gap-3 hover:scale-[1.01]"
                              style={{
                                backgroundColor: isSelected ? "var(--md-primary-container)" : "var(--md-surface-2)",
                                borderColor: isSelected ? "var(--md-primary)" : "var(--md-outline-var)",
                                boxShadow: isSelected ? "0 0 10px rgba(124, 106, 247, 0.1)" : "none"
                              }}
                            >
                              <span className="text-2xl">{model.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate" style={{ color: "var(--md-on-surface)" }}>
                                  {model.name}
                                </p>
                                <p className="text-[9px] mt-1 line-clamp-2" style={{ color: "var(--md-on-surface-var)" }}>
                                  {model.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Custom Model Input path */}
                      {newJobModel === "custom" && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                          <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--md-on-surface-var)" }}>
                            Hugging Face Model Repo / Path
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. meta-llama/Meta-Llama-3-8B-Instruct"
                            value={customBaseModel}
                            onChange={e => setCustomBaseModel(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            style={{
                              backgroundColor: "var(--md-surface-2)",
                              borderColor: "var(--md-outline)",
                              color: "var(--md-on-surface)"
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* B: User Created Models List */}
                  {modelSource === "created" && (
                    <div className="space-y-4">
                      {userCreatedModels.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl border" style={{ backgroundColor: "var(--md-surface-2)", borderColor: "var(--md-outline-var)" }}>
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-zinc-500" />
                          <p className="text-xs font-bold" style={{ color: "var(--md-on-surface)" }}>No user models found</p>
                          <p className="text-[10px] mt-1" style={{ color: "var(--md-on-surface-var)" }}>Create a custom model configuration in the Models page to select it here.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                          {userCreatedModels.map(model => {
                            const isSelected = newJobModel === model.name;
                            return (
                              <div
                                key={model.id}
                                onClick={() => {
                                  setNewJobModel(model.name);
                                  setCustomBaseModel("");
                                }}
                                className="p-4 rounded-2xl border text-left cursor-pointer transition duration-150 flex items-start gap-3 hover:scale-[1.01]"
                                style={{
                                  backgroundColor: isSelected ? "var(--md-primary-container)" : "var(--md-surface-2)",
                                  borderColor: isSelected ? "var(--md-primary)" : "var(--md-outline-var)",
                                  boxShadow: isSelected ? "0 0 10px rgba(124, 106, 247, 0.1)" : "none"
                                }}
                              >
                                <span className="text-2xl">🧠</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 justify-between">
                                    <p className="text-xs font-bold truncate max-w-[120px]" style={{ color: "var(--md-on-surface)" }}>
                                      {model.name}
                                    </p>
                                    <span className="text-[7px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                      v{model.version}
                                    </span>
                                  </div>
                                  <p className="text-[9px] mt-1" style={{ color: "var(--md-on-surface-var)" }}>
                                    Base: <span className="font-mono text-[8px]">{model.baseModel}</span>
                                  </p>
                                  <p className="text-[9px] mt-0.5" style={{ color: "var(--md-on-surface-var)" }}>
                                    Task: <span className="font-bold text-[8px]">{model.taskType}</span>
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* STEP 4: Hyperparameter & Compute Configurations */}
              {wizardStep === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-250">
                  {/* Epochs count slider */}
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

                  {/* Learning Rate & Batch Size Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Learning Rate Selector */}
                    <div className="space-y-2">
                      <label className="block text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--md-on-surface-var)" }}>
                        Learning Rate
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { val: "5e-4", tag: "Aggressive" },
                          { val: "2e-4", tag: "Recommend" },
                          { val: "1e-4", tag: "Standard" },
                          { val: "5e-5", tag: "Conservative" }
                        ].map(lr => {
                          const isSel = newJobLR === lr.val;
                          return (
                            <button
                              key={lr.val}
                              type="button"
                              onClick={() => setNewJobLR(lr.val)}
                              className="px-2.5 py-2 rounded-xl border text-[10px] font-bold text-left transition"
                              style={{
                                backgroundColor: isSel ? "var(--md-primary-container)" : "var(--md-surface-2)",
                                borderColor: isSel ? "var(--md-primary)" : "var(--md-outline-var)",
                                color: isSel ? "var(--md-primary)" : "var(--md-on-surface)"
                              }}
                            >
                              <div>{lr.val}</div>
                              <div className="text-[7px] font-medium opacity-80 mt-0.5">{lr.tag}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Batch Size Selector */}
                    <div className="space-y-2">
                      <label className="block text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--md-on-surface-var)" }}>
                        Optimizer Batch Size
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[2, 4, 8, 16, 32].map(bs => {
                          const isSel = newJobBatchSize === bs;
                          let desc = "Low memory";
                          if (bs === 8) desc = "Recommend";
                          if (bs === 16) desc = "High VRAM";
                          if (bs === 32) desc = "A100 Req.";
                          return (
                            <button
                              key={bs}
                              type="button"
                              onClick={() => setNewJobBatchSize(bs)}
                              className="py-2.5 rounded-xl border text-[10px] font-bold text-center transition flex flex-col items-center justify-center"
                              style={{
                                backgroundColor: isSel ? "var(--md-primary-container)" : "var(--md-surface-2)",
                                borderColor: isSel ? "var(--md-primary)" : "var(--md-outline-var)",
                                color: isSel ? "var(--md-primary)" : "var(--md-on-surface)"
                              }}
                            >
                              <div className="text-xs font-bold">{bs}</div>
                              <span className="text-[6px] font-medium opacity-70 mt-0.5 uppercase tracking-wide truncate max-w-[45px]">{desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Monospace real-time Cluster manifest YAML block */}
                  <div className="p-4 rounded-2xl border" style={{ backgroundColor: "var(--md-surface-2)", borderColor: "var(--md-outline-var)", fontFamily: "monospace", fontSize: "11px" }}>
                    <div style={{ color: "var(--md-primary)", marginBottom: "4px" }}># Pipeline cluster configuration</div>
                    <div style={{ color: "var(--md-on-surface-var)" }}>resource_class: <span style={{ color: "var(--md-success)" }}>"on-demand.nvidia-l40s"</span></div>
                    <div style={{ color: "var(--md-on-surface-var)" }}>dataset: <span style={{ color: "rgb(59, 130, 246)" }}>"{newJobDataset}"</span></div>
                    <div style={{ color: "var(--md-on-surface-var)" }}>base_model: <span style={{ color: "var(--md-primary)" }}>"{newJobModel === "custom" ? (customBaseModel || "custom-model") : newJobModel}"</span></div>
                    <div style={{ color: "var(--md-on-surface-var)" }}>hyperparameters: &#123; epochs: {newJobEpochs}, lr: "{newJobLR}", batch_size: {newJobBatchSize} &#125;</div>
                  </div>
                </div>
              )}

              {/* Submit / Navigation Footer Buttons */}
              <div className="flex items-center gap-3 pt-5 border-t mt-4" style={{ borderColor: "var(--md-outline-var)" }}>
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(wizardStep - 1)}
                    className="flex-1 py-2.5 rounded-xl border font-bold text-sm transition"
                    style={{
                      backgroundColor: "var(--md-surface-2)",
                      borderColor: "var(--md-outline)",
                      color: "var(--md-on-surface)"
                    }}
                  >
                    Back
                  </button>
                ) : (
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
                )}

                {wizardStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(wizardStep + 1)}
                    disabled={!newJobName.trim()}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm hover:scale-[1.01] active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: "var(--md-primary)",
                      color: "var(--md-on-primary)"
                    }}
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm hover:scale-[1.01] active:scale-[0.98] transition"
                    style={{
                      backgroundColor: "var(--md-primary)",
                      color: "var(--md-on-primary)",
                      boxShadow: "0 4px 14px 0 rgba(124, 106, 247, 0.3)"
                    }}
                  >
                    Launch Pipeline
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
