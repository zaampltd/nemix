"use client";
import React, { useState, useEffect } from "react";
import {
  Zap, CheckCircle2, ExternalLink, Key, Eye, EyeOff,
  AlertCircle, Info, Save, RefreshCw, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";

interface Provider {
  id: string;
  name: string;
  description: string;
  requires_key: boolean;
  free?: boolean;
  free_tier?: string;
  signup_url?: string;
  configured?: boolean;
}

const DEFAULT_PROVIDERS: Provider[] = [
  {
    id: "auto",
    name: "Auto (recommended)",
    description: "Automatically picks the best available provider based on your API keys.",
    requires_key: false,
    free: true,
  },
  {
    id: "together_ai",
    name: "Together AI",
    description: "Real fine-tuning via Together AI API. Best quality results.",
    requires_key: true,
    free_tier: "$5 free credits on signup",
    signup_url: "https://api.together.ai",
    configured: false,
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    description: "Fine-tune with Hugging Face AutoTrain. Free CPU tier available.",
    requires_key: true,
    free_tier: "Free CPU training",
    signup_url: "https://huggingface.co/settings/tokens",
    configured: false,
  },
  {
    id: "simulated",
    name: "Demo / Simulated",
    description: "High-fidelity training simulation. No API key needed. Perfect for testing the platform.",
    requires_key: false,
    free: true,
  },
];

interface Props {
  selectedProvider: string;
  onProviderChange: (p: string) => void;
}

export default function TrainingProviderPanel({ selectedProvider, onProviderChange }: Props) {
  const [providers, setProviders] = useState<Provider[]>(DEFAULT_PROVIDERS);
  const [togetherKey, setTogetherKey] = useState("");
  const [hfToken, setHfToken] = useState("");
  const [hfUsername, setHfUsername] = useState("");
  const [showTogether, setShowTogether] = useState(false);
  const [showHf, setShowHf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Load saved keys from localStorage
    try {
      const s = JSON.parse(localStorage.getItem("training_provider_keys") || "{}");
      if (s.together_api_key) setTogetherKey(s.together_api_key);
      if (s.hf_token) setHfToken(s.hf_token);
      if (s.hf_username) setHfUsername(s.hf_username);
    } catch {}

    // Try to fetch providers from backend
    api.get("/training/providers").then(res => {
      if (res.data && Array.isArray(res.data)) setProviders(res.data);
    }).catch(() => {});
  }, []);

  const handleSaveKeys = async () => {
    setSaving(true);
    const keys = {
      together_api_key: togetherKey,
      hf_token: hfToken,
      hf_username: hfUsername,
    };
    // Save to localStorage always
    localStorage.setItem("training_provider_keys", JSON.stringify(keys));

    // Try to save to backend
    try {
      await api.post("/training/api-keys", keys);
    } catch {}

    // Update configured status
    setProviders(p => p.map(prov => {
      if (prov.id === "together_ai") return { ...prov, configured: !!togetherKey };
      if (prov.id === "huggingface") return { ...prov, configured: !!hfToken && !!hfUsername };
      return prov;
    }));

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inp: React.CSSProperties = {
    width: "100%", height: "40px", borderRadius: "10px",
    padding: "0 36px 0 12px", fontSize: "13px",
    background: "var(--md-surface-2)", border: "1px solid var(--md-outline)",
    color: "var(--md-on-surface)", outline: "none", fontFamily: "monospace",
  };

  const isRealProvider = selectedProvider === "together_ai" || selectedProvider === "huggingface";
  const hasKeys = togetherKey || (hfToken && hfUsername);

  return (
    <div style={{ border: "1px solid var(--md-outline)", borderRadius: "20px", overflow: "hidden", background: "var(--md-surface-1)", marginBottom: "24px" }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(p => !p)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "var(--md-primary-container)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap style={{ width: "15px", height: "15px", color: "var(--md-on-primary-cont)" }} />
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--md-on-surface)" }}>Training Provider</p>
            <p style={{ fontSize: "12px", color: "var(--md-on-surface-var)" }}>
              {providers.find(p => p.id === selectedProvider)?.name || "Auto"} ·{" "}
              {hasKeys ? "✅ API keys configured" : "Demo mode (no keys needed)"}
            </p>
          </div>
        </div>
        <ChevronRight style={{ width: "16px", height: "16px", color: "var(--md-on-surface-var)", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--md-outline-var)" }}>

              {/* Info banner */}
              <div style={{ display: "flex", gap: "8px", padding: "10px 14px", borderRadius: "10px", background: "var(--md-primary-container)", border: "1px solid var(--md-outline)", margin: "16px 0" }}>
                <Info style={{ width: "15px", height: "15px", color: "var(--md-primary)", flexShrink: 0, marginTop: "1px" }} />
                <p style={{ fontSize: "13px", color: "var(--md-on-surface-var)", margin: 0 }}>
                  <strong style={{ color: "var(--md-on-surface)" }}>No API key? No problem.</strong> Select "Demo / Simulated" to run a realistic training simulation instantly — no account needed. Add your Together AI key to run real fine-tuning.
                </p>
              </div>

              {/* Provider cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "20px" }}>
                {providers.map(p => (
                  <button key={p.id} onClick={() => onProviderChange(p.id)}
                    style={{
                      padding: "14px 16px", borderRadius: "14px", textAlign: "left", cursor: "pointer",
                      background: selectedProvider === p.id ? "var(--md-primary-container)" : "var(--md-surface-2)",
                      border: `2px solid ${selectedProvider === p.id ? "var(--md-primary)" : "var(--md-outline)"}`,
                      transition: "all 0.15s",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: selectedProvider === p.id ? "var(--md-on-primary-cont)" : "var(--md-on-surface)", flex: 1 }}>
                        {p.name}
                      </p>
                      {p.configured && (
                        <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "100px", background: "var(--md-success-cont)", color: "var(--md-success)", fontWeight: 600 }}>Configured</span>
                      )}
                      {p.free && (
                        <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "100px", background: "var(--md-primary-container)", color: "var(--md-on-primary-cont)", fontWeight: 600 }}>Free</span>
                      )}
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--md-on-surface-var)", lineHeight: 1.4, margin: 0 }}>{p.description}</p>
                    {p.free_tier && (
                      <p style={{ fontSize: "11px", color: "var(--md-success)", marginTop: "6px", fontWeight: 600 }}>🎁 {p.free_tier}</p>
                    )}
                    {p.signup_url && (
                      <a href={p.signup_url} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--md-primary)", marginTop: "6px", textDecoration: "none" }}>
                        Get free API key <ExternalLink style={{ width: "10px", height: "10px" }} />
                      </a>
                    )}
                  </button>
                ))}
              </div>

              {/* API key inputs */}
              {(isRealProvider || selectedProvider === "auto") && (
                <div style={{ background: "var(--md-surface-2)", borderRadius: "14px", padding: "16px", border: "1px solid var(--md-outline-var)" }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Key style={{ width: "13px", height: "13px" }} /> API Keys
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--md-on-surface-var)" }}>— stored locally in your browser, never shared</span>
                  </p>

                  {/* Together AI */}
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "5px", color: "var(--md-on-surface-var)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Together AI Key
                      <a href="https://api.together.ai" target="_blank" rel="noreferrer"
                        style={{ marginLeft: "8px", fontSize: "10px", color: "var(--md-primary)", textDecoration: "none", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                        Get free key ($5 credits) ↗
                      </a>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input type={showTogether ? "text" : "password"}
                        value={togetherKey} onChange={e => setTogetherKey(e.target.value)}
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        style={inp} />
                      <button onClick={() => setShowTogether(p => !p)}
                        style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--md-on-surface-var)" }}>
                        {showTogether ? <EyeOff style={{ width: "14px", height: "14px" }} /> : <Eye style={{ width: "14px", height: "14px" }} />}
                      </button>
                    </div>
                  </div>

                  {/* HF Token */}
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "5px", color: "var(--md-on-surface-var)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Hugging Face Token
                      <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer"
                        style={{ marginLeft: "8px", fontSize: "10px", color: "var(--md-primary)", textDecoration: "none", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                        Get free token ↗
                      </a>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input type={showHf ? "text" : "password"}
                        value={hfToken} onChange={e => setHfToken(e.target.value)}
                        placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        style={inp} />
                      <button onClick={() => setShowHf(p => !p)}
                        style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--md-on-surface-var)" }}>
                        {showHf ? <EyeOff style={{ width: "14px", height: "14px" }} /> : <Eye style={{ width: "14px", height: "14px" }} />}
                      </button>
                    </div>
                  </div>

                  {/* HF Username */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "5px", color: "var(--md-on-surface-var)", textTransform: "uppercase", letterSpacing: "0.05em" }}>HF Username</label>
                    <input type="text"
                      value={hfUsername} onChange={e => setHfUsername(e.target.value)}
                      placeholder="your-hf-username"
                      style={{ ...inp, paddingRight: "12px" }} />
                  </div>

                  {/* Save button */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button onClick={handleSaveKeys} disabled={saving}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "10px", background: "var(--md-primary)", color: "var(--md-on-primary)", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                      {saving
                        ? <RefreshCw style={{ width: "13px", height: "13px" }} className="animate-spin" />
                        : <Save style={{ width: "13px", height: "13px" }} />}
                      {saving ? "Saving..." : "Save Keys"}
                    </button>
                    <AnimatePresence>
                      {saved && (
                        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                          style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "var(--md-success)" }}>
                          <CheckCircle2 style={{ width: "14px", height: "14px" }} /> Keys saved!
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* How it works */}
              <div style={{ marginTop: "16px", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--md-outline-var)", background: "var(--md-surface)" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--md-on-surface)", marginBottom: "8px" }}>How training works</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    ["1", "You upload a dataset (CSV or JSONL) in Datasets page"],
                    ["2", "Select base model (LLaMA 3, Mistral, BERT, GPT-2...)"],
                    ["3", "Click Train — we call Together AI or HF API in the backend"],
                    ["4", "Watch real-time logs & loss curve as training runs"],
                    ["5", "Deploy to a live API endpoint when done"],
                  ].map(([n, t]) => (
                    <div key={n} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "var(--md-primary)", color: "var(--md-on-primary)", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n}</div>
                      <p style={{ fontSize: "12px", color: "var(--md-on-surface-var)", margin: 0, lineHeight: 1.5 }}>{t}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
