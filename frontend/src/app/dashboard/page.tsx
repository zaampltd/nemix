"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Database, 
  Cpu, 
  Layers, 
  Activity, 
  Clock,
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  Rocket, 
  Shield, 
  MessageSquare, 
  Plus, 
  Zap, 
  ChevronRight,
  Play,
  Key,
  Bell,
  Info
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────
interface ActivityItem {
  id: string;
  action: string;
  target: string;
  time: string;
  status: "completed" | "failed" | "running";
  timestamp: number;
}

interface ActiveJob {
  id: string;
  name: string;
  progress: number;
  epoch: string;
  eta: string;
}

const S = {
  card: { background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" } as React.CSSProperties,
  divider: { borderBottom: "1px solid var(--md-outline-var)" } as React.CSSProperties,
  textPrimary: { color: "var(--md-on-surface)" } as React.CSSProperties,
  textSecondary: { color: "var(--md-on-surface-var)" } as React.CSSProperties,
  primary: { color: "var(--md-primary)" } as React.CSSProperties,
};

export default function Dashboard() {
  const router = useRouter();

  // Local & Firestore counts
  const [modelCount, setModelCount] = useState(0);
  const [datasetCount, setDatasetCount] = useState(0);
  const [apiKeyCount, setApiKeyCount] = useState(0);
  const [activeJobsCount, setActiveJobsCount] = useState(0);

  // States
  const [userName, setUserName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [activeJobsList, setActiveJobsList] = useState<ActiveJob[]>([]);
  const [activitiesList, setActivitiesList] = useState<ActivityItem[]>([]);
  const [activeRouterModel, setActiveRouterModel] = useState("Llama 3 8B");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Calculate greeting based on local clock
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");

    // 2. Fetch logged-in user profile
    const rawUser = localStorage.getItem("current_user");
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        setUserName(parsed.full_name?.split(" ")[0] || "");
      } catch (e) {
        console.error("Failed to parse current user info", e);
      }
    }

    const loadAllMetrics = async () => {
      setIsLoading(true);
      
      // -- Load local datasets & models from localStorage
      let localModels: any[] = [];
      let localDatasets: any[] = [];
      let localJobs: any[] = [];

      try {
        localModels = JSON.parse(localStorage.getItem("local_models") || "[]");
      } catch (e) {}

      try {
        localDatasets = JSON.parse(localStorage.getItem("local_datasets") || "[]");
      } catch (e) {}

      try {
        localJobs = JSON.parse(localStorage.getItem("nvmix_training_jobs") || localStorage.getItem("local_jobs") || "[]");
      } catch (e) {}

      // -- Query models from backend API & combine with localStorage
      let totalModels = localModels.length;
      try {
        const res = await api.get("/models");
        const dbCount = Array.isArray(res.data) ? res.data.length : 0;
        totalModels = dbCount + localModels.length;
      } catch (e) {}
      setModelCount(totalModels);

      // -- Query datasets from backend API & combine with localStorage
      let totalDatasets = localDatasets.length;
      try {
        const res = await api.get("/datasets");
        const dbCount = Array.isArray(res.data) ? res.data.length : 0;
        totalDatasets = dbCount + localDatasets.length;
      } catch (e) {}
      setDatasetCount(totalDatasets);

      // -- Query API Keys dynamically from Firebase Firestore!
      let totalKeys = 0;
      let dbApiKeysList: any[] = [];
      try {
        const keysRef = collection(db, "UserNvmixAPIKeys");
        const keysQuery = query(keysRef, where("userId", "==", "test-user-123"));
        const keysSnap = await getDocs(keysQuery);
        totalKeys = keysSnap.size;
        keysSnap.forEach(docSnap => {
          const keyData = docSnap.data();
          dbApiKeysList.push({
            id: docSnap.id,
            name: keyData.name || "Unnamed API Key",
            created: keyData.created || Date.now(),
            timestamp: keyData.created ? new Date(keyData.created).getTime() : Date.now()
          });
        });
      } catch (e) {
        console.error("Failed to query API keys from Firestore", e);
      }
      setApiKeyCount(totalKeys);

      // -- Load active fine-tuning jobs dynamically from Training Page logs
      const runningJobs = localJobs.filter(j => j.status === "running");
      setActiveJobsCount(runningJobs.length);

      const formattedActiveJobs: ActiveJob[] = runningJobs.map(j => ({
        id: j.id,
        name: j.name || `Job #${j.id}`,
        progress: j.progress || 0,
        epoch: j.epochs ? `1/${j.epochs}` : "1/3",
        eta: j.duration || "~45m"
      }));
      setActiveJobsList(formattedActiveJobs);

      // -- Query Router Configs from Firebase Firestore to find the active model
      try {
        const routerRef = collection(db, "RouterConfigs");
        const routerQuery = query(routerRef, orderBy("created", "desc"), limit(1));
        const routerSnap = await getDocs(routerQuery);
        if (!routerSnap.empty) {
          const configData = routerSnap.docs[0].data();
          if (configData.model) {
            setActiveRouterModel(configData.model);
          }
        }
      } catch (e) {
        console.error("Failed to query Router configurations from Firestore", e);
      }

      // -- Build and merge dynamic activities feed chronologically
      const dynamicActivities: ActivityItem[] = [];

      // Add Model creations
      localModels.forEach((m: any) => {
        dynamicActivities.push({
          id: `model-${m.id || Math.random()}`,
          action: "Model initiated",
          target: m.name,
          time: "Recently",
          status: "completed",
          timestamp: m.id || Date.now() - 3600000
        });
      });

      // Add Dataset uploads
      localDatasets.forEach((d: any) => {
        dynamicActivities.push({
          id: `dataset-${d.id || Math.random()}`,
          action: "Dataset uploaded",
          target: d.name,
          time: "Recently",
          status: "completed",
          timestamp: d.id || Date.now() - 7200000
        });
      });

      // Add Fine-Tuning job runs
      localJobs.forEach((j: any) => {
        let timeStr = "Recently";
        let numericId = Date.now() - 10000000;
        if (j.id && j.id.startsWith("ft-")) {
          const seed = parseInt(j.id.split("-")[1]) || 9823;
          numericId = Date.now() - (10000 - seed) * 1000;
        }

        if (j.status === "running") {
          timeStr = "Running now";
        } else if (j.status === "completed") {
          timeStr = "Completed";
        } else {
          timeStr = "Failed";
        }

        dynamicActivities.push({
          id: `job-${j.id || Math.random()}`,
          action: j.status === "completed" ? "Fine-tuning completed" : j.status === "failed" ? "Training failed" : "Fine-tuning running",
          target: `${j.name} (${j.baseModel})`,
          time: timeStr,
          status: j.status === "running" ? "running" : j.status === "completed" ? "completed" : "failed",
          timestamp: numericId
        });
      });

      // Add Programmatic API Key generations from Firestore!
      dbApiKeysList.forEach((k: any) => {
        dynamicActivities.push({
          id: `key-${k.id}`,
          action: "API Credential Issued",
          target: k.name,
          time: "Active",
          status: "completed",
          timestamp: k.timestamp
        });
      });

      // Standard static fallback list to ensure visual density
      const staticFallbacks: ActivityItem[] = [
        { id: "fallback-1", action: "System connection established", target: "Nvidia NIM Router", time: "1 day ago", status: "completed", timestamp: Date.now() - 86400000 },
        { id: "fallback-2", action: "Cloud server connected", target: "Groq LLaMA Gateway", time: "2 days ago", status: "completed", timestamp: Date.now() - 172800000 }
      ];

      // Merge, sort, and slice to top 6 activities
      const combined = [...dynamicActivities, ...staticFallbacks];
      combined.sort((a, b) => b.timestamp - a.timestamp);
      setActivitiesList(combined.slice(0, 6));
      
      setIsLoading(false);
    };

    loadAllMetrics();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* ── Page Header ── */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={S.textPrimary}>
              {greeting}{userName ? `, ${userName}` : ""}.
            </h1>
            <p className="text-sm" style={S.textSecondary}>
              Here is a live summary of your Nvmix AI Saas workspace configurations and GPU clusters.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/training")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ 
              backgroundColor: "var(--md-primary)", 
              color: "var(--md-on-primary)",
              boxShadow: "0 4px 14px 0 rgba(124, 106, 247, 0.2)"
            }}
          >
            <Plus className="w-4 h-4" /> 
            New Training Run
          </button>
        </motion.div>

        {/* ── Live Stats grid ── */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: "Models Registry", value: modelCount, href: "/dashboard/models", delta: "active foundation repos" },
            { label: "Datasets Library", value: datasetCount, href: "/dashboard/datasets", delta: "domain specific files" },
            { label: "API Credentials", value: apiKeyCount, href: "/dashboard/security", delta: "Firestore secured keys" },
            { label: "GPU Active Runs", value: activeJobsCount, href: "/dashboard/training", delta: activeJobsCount > 0 ? "executing pipelines" : "cluster nodes idle" },
          ].map(s => (
            <Link key={s.label} href={s.href}>
              <div 
                className="rounded-2xl p-5 group cursor-pointer transition duration-200 hover:shadow-md hover:scale-[1.01] border" 
                style={S.card}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={S.textSecondary}>{s.label}</p>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={S.primary} />
                </div>
                <p className="text-3xl font-extrabold mb-1.5" style={S.textPrimary}>{s.value}</p>
                <p className="text-[11px]" style={S.textSecondary}>{s.delta}</p>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* ── Quick Action Tiles ── */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3.5" style={S.textSecondary}>Programmatic Quick Actions</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Upload Dataset", icon: Database, href: "/dashboard/datasets" },
              { label: "Register Model", icon: Layers, href: "/dashboard/models" },
              { label: "Launch Training", icon: Cpu, href: "/dashboard/training" },
              { label: "Test Playground", icon: MessageSquare, href: "/dashboard/playground" },
              { label: "Deploy Edge Endpoint", icon: Rocket, href: "/dashboard/deployments" },
              { label: "Manage Keys", icon: Shield, href: "/dashboard/security" },
            ].map(a => (
              <Link key={a.label} href={a.href}>
                <div 
                  className="rounded-2xl p-4 flex flex-col items-center gap-2 text-center transition duration-200 hover:shadow-md hover:scale-[1.02] border cursor-pointer" 
                  style={S.card}
                >
                  <a.icon className="w-5 h-5" style={S.primary} />
                  <span className="text-xs font-bold leading-tight mt-1" style={S.textSecondary}>{a.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── Performance Chart & Dynamic Activities ── */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >

          {/* Loss Convergence Chart Card */}
          <div className="lg:col-span-2 rounded-2xl p-6 border" style={S.card}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-bold mb-1" style={S.textPrimary}>Active Optimizer Metrics</p>
                <p className="text-xs" style={S.textSecondary}>Auto-Router Gateway Model: <span className="font-mono text-xs text-purple-400 font-bold">{activeRouterModel}</span></p>
              </div>
              <Link href="/dashboard/training" className="flex items-center gap-1 text-xs font-bold transition hover:opacity-85" style={S.primary}>
                Visualizer Pipeline <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            {/* SVG Plot Graph */}
            <div style={{ height: "170px" }} className="w-full">
              <svg viewBox="0 0 560 140" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--md-primary)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--md-primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 35, 70, 105, 140].map(y => (
                  <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="var(--md-outline)" strokeWidth="0.8" strokeOpacity="0.4" />
                ))}
                <path d="M0,125 C80,108 160,85 240,58 S380,22 480,12 S530,10 560,8" fill="none" stroke="var(--md-primary)" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0,125 C80,108 160,85 240,58 S380,22 480,12 S530,10 560,8 L560,140 L0,140Z" fill="url(#lossGrad)" />
                <path d="M0,135 C80,125 160,108 240,88 S380,58 480,38 S530,30 560,26" fill="none" stroke="var(--md-success)" strokeWidth="1.5" strokeDasharray="5 3" strokeLinecap="round" />
                <circle cx="560" cy="8" r="4.5" fill="var(--md-primary)" />
                <circle cx="560" cy="26" r="3.5" fill="var(--md-success)" />
              </svg>
            </div>
            
            <div className="flex items-center gap-5 mt-4 pt-4 border-t" style={{ borderColor: "var(--md-outline-var)" }}>
              <div className="flex items-center gap-2 text-xs font-semibold" style={S.textSecondary}>
                <span className="w-4.5 h-1 rounded inline-block" style={{ background: "var(--md-primary)" }} />
                Step Optimizer Loss — 0.08
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold" style={S.textSecondary}>
                <span className="w-4.5 inline-block" style={{ borderTop: "2px dashed var(--md-success)" }} />
                Validation Accuracy — 98.2%
              </div>
            </div>
          </div>

          {/* Activities Feed Card */}
          <div className="rounded-2xl p-6 border" style={S.card}>
            <p className="text-sm font-bold mb-4" style={S.textPrimary}>Live Workspace Activity</p>
            <div className="space-y-0.5 max-h-[250px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : activitiesList.length === 0 ? (
                <p className="text-xs py-8 text-center" style={S.textSecondary}>No recent actions recorded</p>
              ) : (
                activitiesList.map(item => (
                  <div key={item.id} className="flex items-start gap-3 py-3" style={S.divider}>
                    <div className="mt-0.5 shrink-0">
                      {item.status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {item.status === "failed" && <AlertCircle className="w-4 h-4 text-red-500" />}
                      {item.status === "running" && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold leading-tight" style={S.textPrimary}>{item.action}</p>
                      <p className="text-[10px] font-mono truncate mt-0.5" style={S.textSecondary}>{item.target}</p>
                    </div>
                    <span className="text-[10px] font-semibold shrink-0 mt-0.5" style={S.textSecondary}>{item.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </motion.div>

        {/* ── Dynamic System Status, Webhooks & Active Pipeline Gauge ── */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >

          {/* Operational Status Card */}
          <div className="rounded-2xl p-6 border flex flex-col justify-between" style={S.card}>
            <div>
              <p className="text-sm font-bold mb-4" style={S.textPrimary}>Nvmix Cluster Telemetry</p>
              <div className="space-y-1">
                {[
                  { name: "Serverless Training Nodes", latency: "14ms", status: "operational" },
                  { name: "Model Router Gateway", latency: "6ms", status: "operational" },
                  { name: "Vector Dataset Vault", latency: "3ms", status: "operational" },
                  { name: "Model Compiler System", latency: "9ms", status: "operational" },
                ].map(svc => (
                  <div key={svc.name} className="flex items-center justify-between py-2.5" style={S.divider}>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--md-success)" }} />
                      <span className="text-xs font-semibold" style={S.textSecondary}>{svc.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-medium" style={S.textSecondary}>{svc.latency}</span>
                      <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full" style={{ background: "var(--md-success-cont)", color: "var(--md-success)" }}>
                        {svc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Workspace Notifications Card */}
          <div className="rounded-2xl p-6 border flex flex-col justify-between" style={S.card}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4.5 h-4.5" style={S.primary} />
                  <p className="text-sm font-bold" style={S.textPrimary}>Recent Notifications</p>
                </div>
                <button
                  onClick={() => router.push("/dashboard/notifications")}
                  className="flex items-center gap-0.5 text-xs font-bold transition hover:opacity-85"
                  style={S.primary}
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="space-y-3">
                {[
                  { id: 'n1', type: 'success', title: 'Training Complete', body: 'llama3-sentiment-v2 finished training with 94.2% accuracy.', time: '2m ago' },
                  { id: 'n2', type: 'error', title: 'Deployment Failed', body: 'bert-ner-pipeline deployment to ap-southeast-1 failed.', time: '15m ago' },
                  { id: 'n3', type: 'warning', title: 'API Limit Warning', body: "You've used 87% of your monthly API call quota.", time: '1h ago' },
                ].map(notif => {
                  let badgeColor = 'var(--md-primary)';
                  let badgeBg = 'var(--md-primary-container)';
                  let IconComp = Info;
                  
                  if (notif.type === 'success') {
                    badgeColor = 'var(--md-success)';
                    badgeBg = 'var(--md-success-cont)';
                    IconComp = CheckCircle2;
                  } else if (notif.type === 'error') {
                    badgeColor = 'var(--md-error)';
                    badgeBg = 'var(--md-error-cont)';
                    IconComp = AlertCircle;
                  } else if (notif.type === 'warning') {
                    badgeColor = 'var(--md-warning)';
                    badgeBg = 'var(--md-warning-cont)';
                    IconComp = AlertCircle;
                  }
                  
                  return (
                    <div key={notif.id} className="flex gap-3 py-2 items-start" style={S.divider}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: badgeBg }}>
                        <IconComp className="w-4 h-4" style={{ color: badgeColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold truncate" style={S.textPrimary}>{notif.title}</p>
                          <span className="text-[9px] shrink-0 font-semibold" style={S.textSecondary}>{notif.time}</span>
                        </div>
                        <p className="text-[11px] truncate mt-0.5" style={S.textSecondary}>{notif.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active fine-tuning job gauge */}
          <div className="rounded-2xl p-6 border flex flex-col justify-between" style={S.card}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold" style={S.textPrimary}>Cluster Training Monitor</p>
                <Link href="/dashboard/training" className="flex items-center gap-1 text-xs font-bold transition hover:opacity-85" style={S.primary}>
                  Training Console <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="flex flex-col justify-center space-y-4 pt-1">
                {activeJobsList.length === 0 ? (
                  <div className="py-6 text-center flex flex-col items-center justify-center gap-2.5">
                    <Activity className="w-8 h-8 text-zinc-500 opacity-60 animate-pulse" />
                    <p className="text-xs font-bold" style={S.textSecondary}>No active jobs running on cluster</p>
                    <Link href="/dashboard/training">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 hover:underline">Start a training run &rarr;</span>
                    </Link>
                  </div>
                ) : (
                  activeJobsList.map(job => (
                    <div key={job.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--md-primary)" }}></span>
                            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "var(--md-primary)" }}></span>
                          </span>
                          <span className="text-xs font-mono font-bold truncate max-w-[120px]" style={S.textSecondary}>{job.name}</span>
                        </div>
                        <span className="text-[9px] font-mono font-semibold" style={S.textSecondary}>Epoch {job.epoch} • {job.eta}</span>
                      </div>
                      
                      {/* Linear Progress bar */}
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--md-surface-3)" }}>
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${job.progress}%` }} 
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full" 
                          style={{ backgroundColor: "var(--md-primary)" }} 
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-bold" style={S.textSecondary}>
                        <span>Fine-tuning Active</span>
                        <span>{job.progress}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </DashboardLayout>
  );
}

// ── Simple Loader Icon ────────────────────────────────────────────────
function Loader2({ className }: { className?: string }) {
  return (
    <svg 
      className={`animate-spin ${className}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
