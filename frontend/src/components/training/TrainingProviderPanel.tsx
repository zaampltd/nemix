"use client";
import React, { useState, useEffect } from "react";
import {
  CheckCircle2, ExternalLink, Key, Eye, EyeOff,
  AlertCircle, Save, RefreshCw, ChevronRight, ArrowDown,
  Shield, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";

interface Props {
  selectedProvider: string;
  onProviderChange: (p: string) => void;
}

const CHAIN = [
  { step: 1, label: "Together AI",  model: "LLaMA 3 8B",      logo: "🔥", color: "#f59e0b", why: "Best quality, fastest" },
  { step: 2, label: "Together AI",  model: "Mistral 7B",       logo: "🔥", color: "#f59e0b", why: "Fallback: smaller model" },
  { step: 3, label: "Together AI",  model: "GPT-2 (tiny)",     logo: "🔥", color: "#f59e0b", why: "Fallback: minimal cost" },
  { step: 4, label: "Hugging Face", model: "BERT Base",        logo: "🤗", color: "#6366f1", why: "Fallback: free CPU" },
  { step: 5, label: "Hugging Face", model: "DistilBERT (tiny)",logo: "🤗", color: "#6366f1", why: "Last resort: always works" },
];

export default function TrainingProviderPanel({ selectedProvider, onProviderChange }: Props) {
  const [togetherKey, setTogetherKey]   = useState("");
  const [hfToken, setHfToken]           = useState("");
  const [hfUsername, setHfUsername]     = useState("");
  const [showTogether, setShowTogether] = useState(false);
  const [showHf, setShowHf]             = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [expanded, setExpanded]         = useState(true);

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
  const hasAnyKey  = hasTogther || hasHf;

  // How many fallbacks are available
  const availableSteps = CHAIN.filter(c =>
    (c.label === "Together AI" && hasTogther) ||
    (c.label === "Hugging Face" && hasHf)
  );

  const inp: React.CSSProperties = {
    width: "100%", height: "40px", borderRadius: "10px",
    padding: "0 40px 0 14px", fontSize: "13px",
    background: "var(--md-surface)", border: "1px solid var(--md-outline)",
    color: "var(--md-on-surface)", outline: "none", fontFamily: "monospace",
  };

  return (
    <div style={{ border: "1px solid var(--md-outline)", borderRadius: "20px", overflow: "hidden", background: "var(--md-surface-1)", marginBottom: "24px" }}>

      {/* ── Header ── */}
      <button onClick={() => setExpanded(p => !p)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: hasAnyKey ? "var(--md-success-cont)" : "var(--md-error-cont)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {hasAnyKey
              ? <Shield style={{ width: "18px", height: "18px", color: "var(--md-success)" }} />
              : <AlertCircle style={{ width: "18px", height: "18px", color: "var(--md-error)" }} />}
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--md-on-surface)", margin: 0 }}>
              Auto Fallback Training
            </p>
            <p style={{ fontSize: "12px", margin: 0, color: hasAnyKey ? "var(--md-success)" : "var(--md-error)" }}>
              {hasAnyKey
                ? `✅ ${availableSteps.length} fallback option${availableSteps.length !== 1 ? "s" : ""} ready — auto-switches on failure`
                : "⚠️ Add an API key to enable training"}
            </p>
          </div>
        </div>
        <ChevronRight style={{ width: "16px", height: "16px", color: "var(--md-on-surface-var)", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--md-outline-var)" }}>

              {/* ── Fallback Chain Diagram ── */}
              <div style={{ margin: "16px 0 20px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--md-on-surface)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Zap style={{ width: "13px", height: "13px", color: "var(--md-primary)" }} />
                  Automatic Fallback Chain
                  <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--md-on-surface-var)" }}>— tried in order if one fails</span>
                </p>

                {CHAIN.map((step, i) => {
                  const active = (step.label === "Together AI" && hasTogther) || (step.label === "Hugging Face" && hasHf);
                  return (
                    <div key={step.step}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px",
                        borderRadius: "12px", marginBottom: "2px",
                        background: active ? "var(--md-surface-2)" : "var(--md-surface)",
                        border: `1px solid ${active ? "var(--md-outline)" : "var(--md-outline-var)"}`,
                        opacity: active ? 1 : 0.4,
                      }}>
                        {/* Step number */}
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: active ? "var(--md-primary)" : "var(--md-surface-3)", color: active ? "var(--md-on-primary)" : "var(--md-on-surface-var)", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {step.step}
                        </div>
                        {/* Logo */}
                        <span style={{ fontSize: "18px" }}>{step.logo}</span>
                        {/* Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)" }}>{step.label}</span>
                            <span style={{ fontSize: "11px", color: "var(--md-on-surface-var)" }}>→</span>
                            <span style={{ fontSize: "13px", color: "var(--md-primary)", fontWeight: 600 }}>{step.model}</span>
                          </div>
                          <p style={{ fontSize: "11px", color: "var(--md-on-surface-var)", margin: 0 }}>{step.why}</p>
                        </div>
                        {/* Status badge */}
                        <span style={{ fontSize: "10px", padding: "3px 9px", borderRadius: "100px", fontWeight: 700,
                          background: active ? "var(--md-success-cont)" : "var(--md-surface-3)",
                          color: active ? "var(--md-success)" : "var(--md-on-surface-var)" }}>
                          {active ? "✓ Ready" : "No key"}
                        </span>
                      </div>
                      {/* Arrow between steps */}
                      {i < CHAIN.length - 1 && (
                        <div style={{ display: "flex", justifyContent: "center", margin: "2px 0", opacity: 0.3 }}>
                          <ArrowDown style={{ width: "14px", height: "14px", color: "var(--md-on-surface-var)" }} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Info box */}
                <div style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "10px", background: "var(--md-primary-container)", border: "1px solid var(--md-outline-var)", display: "flex", gap: "10px" }}>
                  <Shield style={{ width: "15px", height: "15px", color: "var(--md-primary)", flexShrink: 0, marginTop: "1px" }} />
                  <p style={{ fontSize: "12px", color: "var(--md-on-surface-var)", margin: 0, lineHeight: 1.5 }}>
                    <strong style={{ color: "var(--md-on-surface)" }}>How it works:</strong> Training starts at Step 1.
                    If it fails for any reason (insufficient credits, rate limit, model unavailable, server error),
                    the backend <strong style={{ color: "var(--md-on-surface)" }}>automatically switches</strong> to the next option.
                    You can see which provider was used in the live training logs.
                  </p>
                </div>
              </div>

              {/* ── API Keys ── */}
              <div style={{ background: "var(--md-surface-2)", borderRadius: "14px", padding: "16px 18px", border: "1px solid var(--md-outline-var)" }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Key style={{ width: "13px", height: "13px" }} /> Connect API Keys
                </p>
                <p style={{ fontSize: "11px", color: "var(--md-on-surface-var)", marginBottom: "16px" }}>
                  More keys = more fallback options. Both are free to sign up.
                </p>

                {/* Together AI */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, marginBottom: "6px", color: "var(--md-on-surface-var)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    <span>🔥 Together AI Key <span style={{ color: "var(--md-success)", fontSize: "10px" }}>(enables steps 1–3)</span></span>
                    <a href="https://api.together.ai" target="_blank" rel="noreferrer"
                      style={{ fontSize: "11px", color: "var(--md-primary)", textDecoration: "none", fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>
                      Free $5 credits ↗
                    </a>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input type={showTogether ? "text" : "password"} value={togetherKey}
                      onChange={e => setTogetherKey(e.target.value)}
                      placeholder="Paste your Together AI key..."
                      style={inp} />
                    <button onClick={() => setShowTogether(p => !p)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--md-on-surface-var)" }}>
                      {showTogether ? <EyeOff style={{ width: "14px", height: "14px" }} /> : <Eye style={{ width: "14px", height: "14px" }} />}
                    </button>
                  </div>
                </div>

                {/* HF Token */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, marginBottom: "6px", color: "var(--md-on-surface-var)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    <span>🤗 Hugging Face Token <span style={{ color: "var(--md-success)", fontSize: "10px" }}>(enables steps 4–5)</span></span>
                    <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer"
                      style={{ fontSize: "11px", color: "var(--md-primary)", textDecoration: "none", fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>
                      Free token ↗
                    </a>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input type={showHf ? "text" : "password"} value={hfToken}
                      onChange={e => setHfToken(e.target.value)}
                      placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      style={inp} />
                    <button onClick={() => setShowHf(p => !p)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--md-on-surface-var)" }}>
                      {showHf ? <EyeOff style={{ width: "14px", height: "14px" }} /> : <Eye style={{ width: "14px", height: "14px" }} />}
                    </button>
                  </div>
                </div>

                {/* HF Username */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "6px", color: "var(--md-on-surface-var)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    🤗 HF Username
                  </label>
                  <input type="text" value={hfUsername}
                    onChange={e => setHfUsername(e.target.value)}
                    placeholder="your-hf-username"
                    style={{ ...inp, paddingRight: "14px" }} />
                </div>

                {/* Save button */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button onClick={handleSave} disabled={saving || (!togetherKey && !hfToken)}
                    style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 20px", borderRadius: "10px", background: "var(--md-primary)", color: "var(--md-on-primary)", fontSize: "13px", fontWeight: 700, border: "none", cursor: saving || (!togetherKey && !hfToken) ? "not-allowed" : "pointer", opacity: saving || (!togetherKey && !hfToken) ? 0.5 : 1 }}>
                    {saving ? <RefreshCw style={{ width: "13px", height: "13px" }} /> : <Save style={{ width: "13px", height: "13px" }} />}
                    {saving ? "Saving..." : "Save Keys"}
                  </button>
                  <AnimatePresence>
                    {saved && (
                      <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "var(--md-success)", fontWeight: 600 }}>
                        <CheckCircle2 style={{ width: "14px", height: "14px" }} /> Saved! Fallback chain updated.
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
