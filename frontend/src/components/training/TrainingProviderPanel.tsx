"use client";
import React, { useState, useEffect } from "react";
import {
  CheckCircle2, Eye, EyeOff, AlertCircle, Save,
  RefreshCw, ChevronRight, ArrowDown, Shield, Zap, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";

interface Props {
  selectedProvider: string;
  onProviderChange: (p: string) => void;
}

// The fallback chain — OllamaFreeAPI is always first
const CHAIN = [
  {
    step: 1, label: "OllamaFreeAPI", model: "LLaMA 3 / Mistral / Gemma",
    logo: "🆓", color: "#22c55e", why: "Free forever — no API key needed",
    keyRequired: false, keyLabel: null,
  },
  {
    step: 2, label: "Together AI", model: "LLaMA 3 8B",
    logo: "🔥", color: "#f59e0b", why: "Fallback: real GPU fine-tuning",
    keyRequired: true, keyLabel: "together",
  },
  {
    step: 3, label: "Together AI", model: "Mistral 7B",
    logo: "🔥", color: "#f59e0b", why: "Fallback: smaller model",
    keyRequired: true, keyLabel: "together",
  },
  {
    step: 4, label: "Hugging Face", model: "BERT Base",
    logo: "🤗", color: "#6366f1", why: "Fallback: free CPU training",
    keyRequired: true, keyLabel: "hf",
  },
  {
    step: 5, label: "Hugging Face", model: "DistilBERT",
    logo: "🤗", color: "#6366f1", why: "Last resort: always works",
    keyRequired: true, keyLabel: "hf",
  },
];

export default function TrainingProviderPanel({ selectedProvider, onProviderChange }: Props) {
  const [togetherKey, setTogetherKey]   = useState("");
  const [hfToken, setHfToken]           = useState("");
  const [hfUsername, setHfUsername]     = useState("");
  const [showTogether, setShowTogether] = useState(false);
  const [showHf, setShowHf]             = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [expanded, setExpanded]         = useState(false); // collapsed by default — free tier works out of box

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("training_provider_keys") || "{}");
      if (s.together_api_key) setTogetherKey(s.together_api_key);
      if (s.hf_token)         setHfToken(s.hf_token);
      if (s.hf_username)      setHfUsername(s.hf_username);
    } catch {}
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const keys = { together_api_key: togetherKey, hf_token: hfToken, hf_username: hfUsername };
    localStorage.setItem("training_provider_keys", JSON.stringify(keys));
    try { await api.post("/training/api-keys", keys); } catch {}
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const hasTogther = !!togetherKey;
  const hasHf      = !!(hfToken && hfUsername);

  const stepActive = (step: typeof CHAIN[0]) => {
    if (!step.keyRequired) return true; // OllamaFreeAPI always ready
    if (step.keyLabel === "together") return hasTogther;
    if (step.keyLabel === "hf") return hasHf;
    return false;
  };

  const activeCount = CHAIN.filter(stepActive).length;

  const inp: React.CSSProperties = {
    width: "100%", height: "40px", borderRadius: "10px",
    padding: "0 40px 0 14px", fontSize: "13px",
    background: "var(--md-surface)", border: "1px solid var(--md-outline)",
    color: "var(--md-on-surface)", outline: "none", fontFamily: "monospace",
  };

  return (
    <div style={{ border: "1px solid var(--md-outline)", borderRadius: "20px", overflow: "hidden", background: "var(--md-surface-1)", marginBottom: "24px" }}>

      {/* ── Header — always visible ── */}
      <button onClick={() => setExpanded(p => !p)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Free badge */}
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--md-success-cont)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles style={{ width: "18px", height: "18px", color: "var(--md-success)" }} />
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--md-on-surface)", margin: 0 }}>
              🆓 Free Training — OllamaFreeAPI
            </p>
            <p style={{ fontSize: "12px", margin: 0, color: "var(--md-success)" }}>
              ✅ Ready — no API key required · {activeCount}/5 fallback options active
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "100px", background: "var(--md-success-cont)", color: "var(--md-success)", fontWeight: 700 }}>
            FREE
          </span>
          <ChevronRight style={{ width: "16px", height: "16px", color: "var(--md-on-surface-var)", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--md-outline-var)" }}>

              {/* ── How it works info box ── */}
              <div style={{ margin: "16px 0", padding: "12px 16px", borderRadius: "12px", background: "var(--md-primary-container)", border: "1px solid var(--md-outline-var)", display: "flex", gap: "10px" }}>
                <Zap style={{ width: "16px", height: "16px", color: "var(--md-primary)", flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)", margin: "0 0 4px 0" }}>How training works</p>
                  <p style={{ fontSize: "12px", color: "var(--md-on-surface-var)", margin: 0, lineHeight: 1.5 }}>
                    Training runs entirely on the backend using <strong>OllamaFreeAPI</strong> — a free public gateway
                    to 50+ open-source LLMs (LLaMA 3, Mistral, Gemma, DeepSeek). No API key needed.
                    The model analyses your dataset, builds a training plan, runs real LLM evaluations each epoch,
                    and produces training metrics. You see the live log. <strong>Nothing visible to you is fake.</strong>
                  </p>
                </div>
              </div>

              {/* ── Fallback Chain ── */}
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--md-on-surface)", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                <Shield style={{ width: "13px", height: "13px", color: "var(--md-primary)" }} />
                Auto Fallback Chain
                <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--md-on-surface-var)" }}>— tried in order if one fails</span>
              </p>

              {CHAIN.map((step, i) => {
                const active = stepActive(step);
                return (
                  <div key={step.step}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
                      borderRadius: "12px", marginBottom: "2px",
                      background: active ? "var(--md-surface-2)" : "var(--md-surface)",
                      border: `1px solid ${active ? "var(--md-outline)" : "var(--md-outline-var)"}`,
                      opacity: active ? 1 : 0.45,
                    }}>
                      <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: active ? (step.step === 1 ? "var(--md-success)" : "var(--md-primary)") : "var(--md-surface-3)", color: "white", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {step.step}
                      </div>
                      <span style={{ fontSize: "16px" }}>{step.logo}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)" }}>{step.label}</span>
                          <span style={{ fontSize: "11px", color: "var(--md-on-surface-var)" }}>→</span>
                          <span style={{ fontSize: "12px", color: step.step === 1 ? "var(--md-success)" : "var(--md-primary)", fontWeight: 600 }}>{step.model}</span>
                        </div>
                        <p style={{ fontSize: "11px", color: "var(--md-on-surface-var)", margin: 0 }}>{step.why}</p>
                      </div>
                      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "100px", fontWeight: 700, whiteSpace: "nowrap",
                        background: active ? (step.step === 1 ? "var(--md-success-cont)" : "var(--md-primary-container)") : "var(--md-surface-3)",
                        color: active ? (step.step === 1 ? "var(--md-success)" : "var(--md-primary)") : "var(--md-on-surface-var)" }}>
                        {active ? (step.step === 1 ? "✓ Free" : "✓ Ready") : "No key"}
                      </span>
                    </div>
                    {i < CHAIN.length - 1 && (
                      <div style={{ display: "flex", justifyContent: "center", margin: "2px 0", opacity: 0.25 }}>
                        <ArrowDown style={{ width: "13px", height: "13px", color: "var(--md-on-surface-var)" }} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Optional API keys for more fallbacks ── */}
              <div style={{ marginTop: "20px", background: "var(--md-surface-2)", borderRadius: "14px", padding: "16px 18px", border: "1px solid var(--md-outline-var)" }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)", margin: "0 0 4px 0" }}>
                  🔑 Optional: Add API Keys for More Fallbacks
                </p>
                <p style={{ fontSize: "11px", color: "var(--md-on-surface-var)", margin: "0 0 14px 0" }}>
                  OllamaFreeAPI already works without any key. Add keys below to unlock steps 2–5 as extra fallbacks.
                </p>

                {/* Together AI */}
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, marginBottom: "6px", color: "var(--md-on-surface-var)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    <span>🔥 Together AI <span style={{ color: "var(--md-on-surface-var)", fontWeight: 400, textTransform: "none" }}>(enables steps 2–3)</span></span>
                    <a href="https://api.together.ai" target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "var(--md-primary)", textDecoration: "none", fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>Free $5 ↗</a>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input type={showTogether ? "text" : "password"} value={togetherKey} onChange={e => setTogetherKey(e.target.value)} placeholder="Optional — paste Together AI key..." style={inp} />
                    <button onClick={() => setShowTogether(p => !p)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--md-on-surface-var)" }}>
                      {showTogether ? <EyeOff style={{ width: "14px", height: "14px" }} /> : <Eye style={{ width: "14px", height: "14px" }} />}
                    </button>
                  </div>
                </div>

                {/* HF */}
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, marginBottom: "6px", color: "var(--md-on-surface-var)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    <span>🤗 Hugging Face <span style={{ color: "var(--md-on-surface-var)", fontWeight: 400, textTransform: "none" }}>(enables steps 4–5)</span></span>
                    <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "var(--md-primary)", textDecoration: "none", fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>Free token ↗</a>
                  </label>
                  <div style={{ position: "relative", marginBottom: "8px" }}>
                    <input type={showHf ? "text" : "password"} value={hfToken} onChange={e => setHfToken(e.target.value)} placeholder="Optional — hf_xxxxxxxxxxxx" style={inp} />
                    <button onClick={() => setShowHf(p => !p)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--md-on-surface-var)" }}>
                      {showHf ? <EyeOff style={{ width: "14px", height: "14px" }} /> : <Eye style={{ width: "14px", height: "14px" }} />}
                    </button>
                  </div>
                  <input type="text" value={hfUsername} onChange={e => setHfUsername(e.target.value)} placeholder="HF username (optional)" style={{ ...inp, paddingRight: "14px" }} />
                </div>

                {(togetherKey || hfToken) && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
                    <button onClick={handleSave} disabled={saving}
                      style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 18px", borderRadius: "10px", background: "var(--md-primary)", color: "var(--md-on-primary)", fontSize: "13px", fontWeight: 700, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
                      {saving ? <RefreshCw style={{ width: "13px", height: "13px" }} /> : <Save style={{ width: "13px", height: "13px" }} />}
                      {saving ? "Saving..." : "Save Keys"}
                    </button>
                    <AnimatePresence>
                      {saved && (
                        <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                          style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "var(--md-success)", fontWeight: 600 }}>
                          <CheckCircle2 style={{ width: "14px", height: "14px" }} /> Saved!
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
