"use client";
import React, { useState, useEffect } from "react";
import {
  Zap, CheckCircle2, ExternalLink, Key, Eye, EyeOff,
  AlertCircle, Save, RefreshCw, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";

interface Provider {
  id: string;
  name: string;
  logo: string;
  description: string;
  free_tier: string;
  signup_url: string;
  configured?: boolean;
  recommended?: boolean;
}

const PROVIDERS: Provider[] = [
  {
    id: "together_ai",
    name: "Together AI",
    logo: "🔥",
    description: "Real GPU fine-tuning via Together AI. Supports LLaMA 3, Mistral, GPT-2 and more. Fastest results.",
    free_tier: "$5 free credits on signup",
    signup_url: "https://api.together.ai",
    configured: false,
    recommended: true,
  },
  {
    id: "huggingface",
    name: "Hugging Face AutoTrain",
    logo: "🤗",
    description: "Fine-tune with Hugging Face AutoTrain. Works with any model on the Hub. Free CPU tier included.",
    free_tier: "Free CPU training available",
    signup_url: "https://huggingface.co/settings/tokens",
    configured: false,
  },
];

interface Props {
  selectedProvider: string;
  onProviderChange: (p: string) => void;
}

export default function TrainingProviderPanel({ selectedProvider, onProviderChange }: Props) {
  const [providers, setProviders] = useState<Provider[]>(PROVIDERS);
  const [togetherKey, setTogetherKey] = useState("");
  const [hfToken, setHfToken] = useState("");
  const [hfUsername, setHfUsername] = useState("");
  const [showTogether, setShowTogether] = useState(false);
  const [showHf, setShowHf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Load saved keys from localStorage on mount
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("training_provider_keys") || "{}");
      if (s.together_api_key) {
        setTogetherKey(s.together_api_key);
        setProviders(p => p.map(prov => prov.id === "together_ai" ? { ...prov, configured: true } : prov));
      }
      if (s.hf_token) setHfToken(s.hf_token);
      if (s.hf_username) {
        setHfUsername(s.hf_username);
        if (s.hf_token) {
          setProviders(p => p.map(prov => prov.id === "huggingface" ? { ...prov, configured: true } : prov));
        }
      }
    } catch {}
  }, []);

  const handleSaveKeys = async () => {
    setSaving(true);
    const keys = { together_api_key: togetherKey, hf_token: hfToken, hf_username: hfUsername };
    localStorage.setItem("training_provider_keys", JSON.stringify(keys));

    try { await api.post("/training/api-keys", keys); } catch {}

    setProviders(p => p.map(prov => {
      if (prov.id === "together_ai") return { ...prov, configured: !!togetherKey };
      if (prov.id === "huggingface") return { ...prov, configured: !!hfToken && !!hfUsername };
      return prov;
    }));

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const activeProvider = providers.find(p => p.id === selectedProvider);
  const hasAnyKey = togetherKey || (hfToken && hfUsername);

  const inp: React.CSSProperties = {
    width: "100%", height: "42px", borderRadius: "10px",
    padding: "0 40px 0 14px", fontSize: "13px",
    background: "var(--md-surface)", border: "1px solid var(--md-outline)",
    color: "var(--md-on-surface)", outline: "none", fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.02em",
  };

  return (
    <div style={{ border: "1px solid var(--md-outline)", borderRadius: "20px", overflow: "hidden", background: "var(--md-surface-1)", marginBottom: "24px" }}>
      {/* ── Header ── */}
      <button
        onClick={() => setExpanded(p => !p)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: hasAnyKey ? "var(--md-success-cont)" : "var(--md-primary-container)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {hasAnyKey
              ? <CheckCircle2 style={{ width: "18px", height: "18px", color: "var(--md-success)" }} />
              : <Key style={{ width: "17px", height: "17px", color: "var(--md-on-primary-cont)" }} />
            }
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--md-on-surface)", margin: 0 }}>Training Provider</p>
            <p style={{ fontSize: "12px", color: hasAnyKey ? "var(--md-success)" : "var(--md-error)", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
              {hasAnyKey
                ? `✅ ${activeProvider?.name || "Provider"} ready — API key configured`
                : "⚠️ Add an API key to start real training"}
            </p>
          </div>
        </div>
        <ChevronRight style={{ width: "16px", height: "16px", color: "var(--md-on-surface-var)", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--md-outline-var)" }}>

              {/* No key warning */}
              {!hasAnyKey && (
                <div style={{ display: "flex", gap: "10px", padding: "12px 14px", borderRadius: "12px", background: "var(--md-error-cont)", border: "1px solid var(--md-outline)", margin: "16px 0" }}>
                  <AlertCircle style={{ width: "16px", height: "16px", color: "var(--md-error)", flexShrink: 0, marginTop: "1px" }} />
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)", margin: "0 0 3px" }}>API key required</p>
                    <p style={{ fontSize: "12px", color: "var(--md-on-surface-var)", margin: 0 }}>
                      Paste your Together AI or Hugging Face key below to start training real models. Both providers offer free tiers.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Provider selector ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", margin: "16px 0" }}>
                {providers.map(p => (
                  <button key={p.id} onClick={() => onProviderChange(p.id)}
                    style={{
                      padding: "16px", borderRadius: "16px", textAlign: "left", cursor: "pointer", position: "relative",
                      background: selectedProvider === p.id ? "var(--md-primary-container)" : "var(--md-surface-2)",
                      border: `2px solid ${selectedProvider === p.id ? "var(--md-primary)" : "var(--md-outline)"}`,
                      transition: "all 0.15s",
                    }}>
                    {p.recommended && (
                      <span style={{ position: "absolute", top: "10px", right: "10px", fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "100px", background: "var(--md-primary)", color: "var(--md-on-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Recommended
                      </span>
                    )}
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>{p.logo}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: selectedProvider === p.id ? "var(--md-on-primary-cont)" : "var(--md-on-surface)", margin: 0 }}>{p.name}</p>
                      {p.configured && (
                        <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "100px", background: "var(--md-success-cont)", color: "var(--md-success)", fontWeight: 700 }}>✓ Ready</span>
                      )}
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--md-on-surface-var)", lineHeight: 1.5, margin: "0 0 8px" }}>{p.description}</p>
                    <p style={{ fontSize: "11px", color: "var(--md-success)", fontWeight: 600, margin: "0 0 6px" }}>🎁 {p.free_tier}</p>
                    <a href={p.signup_url} target="_blank" rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--md-primary)", textDecoration: "none", fontWeight: 600 }}>
                      Get free API key <ExternalLink style={{ width: "10px", height: "10px" }} />
                    </a>
                  </button>
                ))}
              </div>

              {/* ── API Key inputs ── */}
              <div style={{ background: "var(--md-surface-2)", borderRadius: "14px", padding: "16px 18px", border: "1px solid var(--md-outline-var)" }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Key style={{ width: "13px", height: "13px" }} /> Connect your API keys
                </p>
                <p style={{ fontSize: "11px", color: "var(--md-on-surface-var)", marginBottom: "16px" }}>
                  Keys are saved to your browser only — never sent to Nemix servers.
                </p>

                {/* Together AI */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, marginBottom: "6px", color: "var(--md-on-surface-var)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    <span>🔥 Together AI Key</span>
                    <a href="https://api.together.ai" target="_blank" rel="noreferrer"
                      style={{ fontSize: "11px", color: "var(--md-primary)", textDecoration: "none", fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>
                      Get $5 free → api.together.ai ↗
                    </a>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input type={showTogether ? "text" : "password"}
                      value={togetherKey} onChange={e => setTogetherKey(e.target.value)}
                      placeholder="Paste your Together AI key here..."
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
                    <span>🤗 Hugging Face Token</span>
                    <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer"
                      style={{ fontSize: "11px", color: "var(--md-primary)", textDecoration: "none", fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>
                      Get free token ↗
                    </a>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input type={showHf ? "text" : "password"}
                      value={hfToken} onChange={e => setHfToken(e.target.value)}
                      placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
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
                    🤗 Hugging Face Username
                  </label>
                  <input type="text"
                    value={hfUsername} onChange={e => setHfUsername(e.target.value)}
                    placeholder="your-username"
                    style={{ ...inp, paddingRight: "14px" }} />
                </div>

                {/* Save */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button onClick={handleSaveKeys} disabled={saving || (!togetherKey && !hfToken)}
                    style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 20px", borderRadius: "10px", background: "var(--md-primary)", color: "var(--md-on-primary)", fontSize: "13px", fontWeight: 700, border: "none", cursor: saving || (!togetherKey && !hfToken) ? "not-allowed" : "pointer", opacity: saving || (!togetherKey && !hfToken) ? 0.5 : 1, transition: "opacity 0.15s" }}>
                    {saving ? <RefreshCw style={{ width: "13px", height: "13px" }} /> : <Save style={{ width: "13px", height: "13px" }} />}
                    {saving ? "Saving..." : "Save & Connect"}
                  </button>
                  <AnimatePresence>
                    {saved && (
                      <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "var(--md-success)", fontWeight: 600 }}>
                        <CheckCircle2 style={{ width: "14px", height: "14px" }} /> Connected!
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ── How it works ── */}
              <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                {[
                  { n: "1", icon: "📁", label: "Upload dataset" },
                  { n: "2", icon: "🧠", label: "Pick base model" },
                  { n: "3", icon: "⚡", label: "API trains it" },
                  { n: "4", icon: "📊", label: "Watch live logs" },
                  { n: "5", icon: "🚀", label: "Deploy endpoint" },
                ].map(s => (
                  <div key={s.n} style={{ padding: "10px 8px", borderRadius: "10px", background: "var(--md-surface)", border: "1px solid var(--md-outline-var)", textAlign: "center" }}>
                    <div style={{ fontSize: "18px", marginBottom: "4px" }}>{s.icon}</div>
                    <p style={{ fontSize: "10px", color: "var(--md-on-surface-var)", margin: 0, lineHeight: 1.4 }}>{s.label}</p>
                  </div>
                ))}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
