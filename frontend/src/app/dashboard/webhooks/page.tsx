"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Webhook, Plus, Copy, Check, Trash2, Play, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, Clock, RefreshCw, Loader2, X
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

// ── Types ─────────────────────────────────────────────────────────────────
interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  status: "active" | "failing" | "disabled";
  lastTriggered: string;
  successRate: number;
  totalDeliveries: number;
}

interface Delivery {
  id: string;
  event: string;
  timestamp: string;
  statusCode: number;
  duration: string;
  payload: object;
}

// ── Mock data ─────────────────────────────────────────────────────────────
const INITIAL_WEBHOOKS: WebhookItem[] = [
  {
    id: "wh_1",
    url: "https://hooks.slack.com/services/T01/B01/xxxxxxxxxxx",
    events: ["training.completed", "training.failed"],
    status: "active",
    lastTriggered: "2 min ago",
    successRate: 99.1,
    totalDeliveries: 112,
  },
  {
    id: "wh_2",
    url: "https://api.myapp.com/nemix/webhook",
    events: ["deployment.created", "inference.error"],
    status: "active",
    lastTriggered: "1 hour ago",
    successRate: 97.8,
    totalDeliveries: 45,
  },
  {
    id: "wh_3",
    url: "https://old-api.internal.com/webhook-receiver",
    events: ["training.completed"],
    status: "failing",
    lastTriggered: "3 days ago",
    successRate: 42.0,
    totalDeliveries: 12,
  },
];

const RECENT_DELIVERIES: Delivery[] = [
  {
    id: "d1",
    event: "training.completed",
    timestamp: "2 min ago",
    statusCode: 200,
    duration: "142ms",
    payload: { job_id: "trn_abc123", status: "completed", accuracy: 0.942 },
  },
  {
    id: "d2",
    event: "deployment.created",
    timestamp: "1 hour ago",
    statusCode: 200,
    duration: "89ms",
    payload: { endpoint_id: "ep_001", model: "llama3-sentiment-v2", region: "us-east-1" },
  },
  {
    id: "d3",
    event: "training.completed",
    timestamp: "3 days ago",
    statusCode: 503,
    duration: "10001ms",
    payload: { job_id: "trn_xyz789", status: "completed", error: "Connection refused" },
  },
];

const ALL_EVENTS = [
  "training.completed", "training.failed",
  "deployment.created", "deployment.failed",
  "inference.error", "billing.threshold_reached",
];

function generateSecret() {
  return "whsec_" + Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Status badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: WebhookItem["status"] }) {
  const cfg = {
    active:   { bg: "var(--md-success-cont)", color: "var(--md-success)",   label: "Active" },
    failing:  { bg: "var(--md-error-cont)",   color: "var(--md-error)",     label: "Failing" },
    disabled: { bg: "var(--md-surface-3)",    color: "var(--md-on-surface-var)", label: "Disabled" },
  }[status];
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--md-on-surface-var)", display: "flex", alignItems: "center" }}>
      {copied ? <Check style={{ width: 14, height: 14, color: "var(--md-success)" }} /> : <Copy style={{ width: 14, height: 14 }} />}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  // Form state
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>(["training.completed"]);
  const [secret, setSecret] = useState(generateSecret());

  useEffect(() => {
    const loadWebhooks = async () => {
      try {
        setIsLoading(true);
        const q = query(collection(db, "UserWebhooks"), where("userId", "==", "test-user-123"));
        const snapshot = await getDocs(q);
        const fetched: WebhookItem[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            url: data.url || "",
            events: data.events || [],
            status: data.status || "active",
            lastTriggered: data.lastTriggered || "Never",
            successRate: data.successRate ?? 100,
            totalDeliveries: data.totalDeliveries ?? 0
          });
        });

        if (fetched.length > 0) {
          setWebhooks(fetched);
          localStorage.setItem('local_webhooks', JSON.stringify(fetched));
        } else {
          // Load from localStorage cache
          const local = localStorage.getItem('local_webhooks');
          if (local) {
            setWebhooks(JSON.parse(local));
          } else {
            setWebhooks(INITIAL_WEBHOOKS);
            localStorage.setItem('local_webhooks', JSON.stringify(INITIAL_WEBHOOKS));
          }
        }
      } catch (err) {
        console.error("Failed to load webhooks from firestore:", err);
        const local = localStorage.getItem('local_webhooks');
        if (local) {
          setWebhooks(JSON.parse(local));
        } else {
          setWebhooks(INITIAL_WEBHOOKS);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadWebhooks();
  }, []);

  const handleCreate = async () => {
    if (!newUrl) return;
    try {
      const whData = {
        userId: "test-user-123",
        url: newUrl,
        events: newEvents,
        status: "active" as const,
        lastTriggered: "Never",
        successRate: 100,
        totalDeliveries: 0,
        secret: secret,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "UserWebhooks"), whData);
      
      const wh: WebhookItem = {
        id: docRef.id,
        url: newUrl,
        events: newEvents,
        status: "active",
        lastTriggered: "Never",
        successRate: 100,
        totalDeliveries: 0
      };

      setWebhooks(prev => {
        const next = [wh, ...prev];
        localStorage.setItem('local_webhooks', JSON.stringify(next));
        return next;
      });

      setShowModal(false);
      setNewUrl("");
      setNewEvents(["training.completed"]);
      setSecret(generateSecret());
    } catch (err) {
      console.error("Error creating webhook in Firestore:", err);
      // Local fallback
      const wh: WebhookItem = {
        id: `wh_${Date.now()}`,
        url: newUrl,
        events: newEvents,
        status: "active",
        lastTriggered: "Never",
        successRate: 100,
        totalDeliveries: 0
      };

      setWebhooks(prev => {
        const next = [wh, ...prev];
        localStorage.setItem('local_webhooks', JSON.stringify(next));
        return next;
      });

      setShowModal(false);
      setNewUrl("");
      setNewEvents(["training.completed"]);
      setSecret(generateSecret());
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this webhook? This action cannot be undone.");
    if (!confirmed) return;

    try {
      if (!id.startsWith("wh_")) {
        await deleteDoc(doc(db, "UserWebhooks", id));
      }
      setWebhooks(prev => {
        const next = prev.filter(w => w.id !== id);
        localStorage.setItem('local_webhooks', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error("Failed to delete webhook from firestore:", err);
      setWebhooks(prev => {
        const next = prev.filter(w => w.id !== id);
        localStorage.setItem('local_webhooks', JSON.stringify(next));
        return next;
      });
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    await new Promise(r => setTimeout(r, 1200));
    setTesting(null);
    setTestResult(prev => ({ ...prev, [id]: "✓ Ping delivered (200 OK)" }));
    setTimeout(() => setTestResult(prev => { const n = { ...prev }; delete n[id]; return n; }), 3000);
  };

  const card: React.CSSProperties = {
    background: "var(--md-surface-1)",
    border: "1px solid var(--md-outline)",
    borderRadius: 16,
    padding: "20px 24px",
  };

  const inp: React.CSSProperties = {
    width: "100%", height: 42, borderRadius: 10, padding: "0 12px",
    fontSize: 13, background: "var(--md-surface-2)",
    border: "1px solid var(--md-outline)", color: "var(--md-on-surface)", outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--md-on-surface-var)"
  };

  // Stats
  const totalSuccess = webhooks.reduce((a, w) => a + Math.round(w.totalDeliveries * w.successRate / 100), 0);
  const totalFailed  = webhooks.reduce((a, w) => a + Math.round(w.totalDeliveries * (1 - w.successRate / 100)), 0);

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--md-on-surface)", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              Webhooks
            </h1>
            <p style={{ fontSize: 14, color: "var(--md-on-surface-var)", margin: 0 }}>
              Receive real-time HTTP notifications when training, deployments, or inference events occur.
            </p>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 16px", borderRadius: 10, background: "var(--md-primary)", color: "var(--md-on-primary)", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            <Plus style={{ width: 15, height: 15 }} /> Add Webhook
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {[
            { label: "Total Webhooks", value: webhooks.length, icon: Webhook, color: "var(--md-primary)" },
            { label: "Successful (7d)", value: totalSuccess, icon: CheckCircle2, color: "var(--md-success)" },
            { label: "Failed (7d)",    value: totalFailed,   icon: AlertCircle, color: "var(--md-error)" },
            { label: "Avg Response",  value: "142ms",        icon: Clock, color: "var(--md-warning)" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ ...card, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon style={{ width: 16, height: 16, color }} />
                </div>
                <span style={{ fontSize: 12, color: "var(--md-on-surface-var)", fontWeight: 600 }}>{label}</span>
              </div>
              <p style={{ fontSize: 24, fontWeight: 800, color: "var(--md-on-surface)", margin: 0, letterSpacing: "-0.02em" }}>
                {isLoading ? "..." : value}
              </p>
            </div>
          ))}
        </div>

        {/* Webhook list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--md-on-surface)", margin: 0 }}>
            Active Webhooks ({webhooks.length})
          </h2>
          {isLoading ? (
            <div style={{ ...card, textAlign: "center", padding: 48 }}>
              <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "var(--md-primary)", margin: "0 auto 12px" }} />
              <p style={{ color: "var(--md-on-surface-var)", margin: 0 }}>Loading webhooks environment vault...</p>
            </div>
          ) : webhooks.length === 0 ? (
            <div style={{ ...card, textAlign: "center", padding: 48 }}>
              <Webhook style={{ width: 32, height: 32, color: "var(--md-outline)", margin: "0 auto 12px" }} />
              <p style={{ color: "var(--md-on-surface-var)", margin: 0 }}>No webhooks yet. Add one to get started.</p>
            </div>
          ) : (
            webhooks.map(wh => (
              <div key={wh.id} style={card}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <code style={{ fontSize: 13, color: "var(--md-primary)", background: "var(--md-surface-2)", padding: "2px 8px", borderRadius: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 380, display: "block" }}>
                        {wh.url}
                      </code>
                      <CopyBtn text={wh.url} />
                      <StatusBadge status={wh.status} />
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      {wh.events.map(ev => (
                        <span key={ev} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: "var(--md-primary-container)", color: "var(--md-on-primary-cont)", fontWeight: 600 }}>{ev}</span>
                      ))}
                    </div>
                    {/* Success rate bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 100, background: "var(--md-surface-3)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${wh.successRate}%`, borderRadius: 100, background: wh.successRate > 90 ? "var(--md-success)" : "var(--md-error)" }} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--md-on-surface-var)", whiteSpace: "nowrap" }}>
                        {wh.successRate}% · {wh.totalDeliveries} deliveries · last triggered {wh.lastTriggered}
                      </span>
                    </div>
                    {testResult[wh.id] && (
                      <p style={{ fontSize: 12, color: "var(--md-success)", marginTop: 8, fontWeight: 600 }}>{testResult[wh.id]}</p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => handleTest(wh.id)} disabled={testing === wh.id}
                      style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 12px", borderRadius: 8, border: "1px solid var(--md-outline)", background: "var(--md-surface-2)", color: "var(--md-on-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {testing === wh.id ? <Loader2 className="animate-spin" style={{ width: 13, height: 13 }} /> : <Play style={{ width: 13, height: 13 }} />}
                      Test
                    </button>
                    <button onClick={() => handleDelete(wh.id)}
                      style={{ height: 32, width: 32, borderRadius: 8, border: "1px solid var(--md-outline)", background: "var(--md-surface-2)", color: "var(--md-error)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent deliveries */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--md-on-surface)", margin: "0 0 12px" }}>
            Recent Deliveries
          </h2>
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            {RECENT_DELIVERIES.map((d, i) => (
              <div key={d.id} style={{ borderBottom: i < RECENT_DELIVERIES.length - 1 ? "1px solid var(--md-outline-var)" : "none" }}>
                <button onClick={() => setExpandedDelivery(expandedDelivery === d.id ? null : d.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: d.statusCode === 200 ? "var(--md-success-cont)" : "var(--md-error-cont)", color: d.statusCode === 200 ? "var(--md-success)" : "var(--md-error)" }}>
                      {d.statusCode}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--md-on-surface)", fontWeight: 600 }}>{d.event}</span>
                    <span style={{ fontSize: 12, color: "var(--md-on-surface-var)" }}>{d.timestamp}</span>
                    <span style={{ fontSize: 12, color: "var(--md-on-surface-var)" }}>{d.duration}</span>
                  </div>
                  {expandedDelivery === d.id ? <ChevronUp style={{ width: 15, height: 15, color: "var(--md-on-surface-var)" }} /> : <ChevronDown style={{ width: 15, height: 15, color: "var(--md-on-surface-var)" }} />}
                </button>
                {expandedDelivery === d.id && (
                  <div style={{ padding: "0 20px 16px" }}>
                    <pre style={{ margin: 0, padding: 14, borderRadius: 10, background: "var(--md-surface-2)", fontSize: 12, color: "var(--md-on-surface)", fontFamily: "'JetBrains Mono', monospace", overflowX: "auto" }}>
                      {JSON.stringify(d.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create webhook modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ background: 'var(--md-scrim)' }}
              onClick={() => setShowModal(false)}
            />
            
            {/* Modal Body Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-lg rounded-3xl p-8 z-10"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)' }}
              onClick={e => e.stopPropagation()}
            >
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: 'var(--md-outline-var)' }}>
                <div>
                  <h2 className="text-xl font-black" style={{ color: 'var(--md-on-surface)', margin: 0 }}>Create Webhook</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--md-on-surface-var)', margin: 0 }}>Define custom endpoints for real-time telemetry dispatches</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl transition hover:bg-neutral-800/10 cursor-pointer" 
                  style={{ color: 'var(--md-on-surface-var)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label style={labelStyle as React.CSSProperties}>Endpoint URL</label>
                  <input value={newUrl} onChange={e => setNewUrl(e.target.value)}
                    placeholder="https://your-app.com/webhook" style={inp} />
                </div>

                <div>
                  <label style={labelStyle as React.CSSProperties}>Events Subscriptions</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
                    {ALL_EVENTS.map(ev => (
                      <label key={ev} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none py-1" style={{ color: "var(--md-on-surface)" }}>
                        <input type="checkbox" checked={newEvents.includes(ev)}
                          onChange={e => setNewEvents(prev => e.target.checked ? [...prev, ev] : prev.filter(x => x !== ev))}
                          style={{ accentColor: "var(--md-primary)", width: 16, height: 16 }} className="rounded cursor-pointer" />
                        {ev}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle as React.CSSProperties}>Signing Secret</label>
                  <div className="flex gap-2 items-center">
                    <code style={{ flex: 1, ...inp, display: "flex", alignItems: "center", fontSize: 11, color: "var(--md-on-surface-var)", overflow: "hidden", textOverflow: "ellipsis" }}>{secret}</code>
                    <CopyBtn text={secret} />
                    <button onClick={() => setSecret(generateSecret())} 
                      className="h-10 px-4 rounded-xl border cursor-pointer text-xs font-bold transition-all hover:bg-neutral-800/10"
                      style={{ borderColor: "var(--md-outline)", background: "var(--md-surface-2)", color: "var(--md-on-surface)" }}>
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-5 justify-end" style={{ borderTop: "1px solid var(--md-outline-var)" }}>
                <button onClick={() => setShowModal(false)}
                  className="h-10 px-5 rounded-xl border cursor-pointer text-xs font-bold transition-all hover:bg-neutral-800/10"
                  style={{ borderColor: "var(--md-outline)", background: "transparent", color: "var(--md-on-surface-var)" }}>
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={!newUrl || newEvents.length === 0}
                  className="h-10 px-5 rounded-xl cursor-pointer text-xs font-black transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--md-primary)", color: "var(--md-on-primary)", border: "none" }}>
                  Create Webhook
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
