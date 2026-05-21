"use client";
import React, { useState, useEffect } from "react";
import {
  CheckCircle2, Eye, EyeOff, Save, RefreshCw, ChevronRight,
  ArrowDown, Shield, Zap, Sparkles, Plus, Trash2, ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";

interface Props {
  selectedProvider: string;
  onProviderChange: (p: string) => void;
}

interface CustomProvider { id: string; provider_id: string; api_key: string; label: string }

// ─── Provider catalogue ────────────────────────────────────────────
const PROVIDERS = {
  nvidia:    { label: "NVIDIA NIM",    emoji: "🟢", desc: "LLaMA 3.1 70B, Nemotron",          url: "https://build.nvidia.com",                        free: true,  envKey: "NVIDIA_API_KEY",    placeholder: "nvapi-..." },
  openrouter:{ label: "OpenRouter",    emoji: "🌐", desc: "Claude 3.5, GPT-4o, Gemini, 100+",  url: "https://openrouter.ai/keys",                      free: true,  envKey: "OPENROUTER_API_KEY",placeholder: "sk-or-v1-..." },
  mistral:   { label: "Mistral AI",    emoji: "🌊", desc: "Mistral Large, Medium, 7B",          url: "https://console.mistral.ai/api-keys/",            free: false, envKey: "MISTRAL_API_KEY",   placeholder: "xxxxx.yyyyy" },
  groq:      { label: "Groq",          emoji: "⚡", desc: "LLaMA 3.1 70B, Mixtral — free fast",url: "https://console.groq.com/keys",                   free: true,  envKey: "GROQ_API_KEY",      placeholder: "gsk_..." },
  together:  { label: "Together AI",   emoji: "🔥", desc: "GPU fine-tuning, $5 free",           url: "https://api.together.ai/settings/api-keys",       free: false, envKey: "TOGETHER_API_KEY",  placeholder: "..." },
  openai:    { label: "OpenAI",        emoji: "🤖", desc: "GPT-4o, GPT-4o-mini, GPT-3.5",      url: "https://platform.openai.com/api-keys",            free: false, envKey: "OPENAI_API_KEY",    placeholder: "sk-..." },
  anthropic_openrouter: { label: "Claude (Anthropic)", emoji: "🔮", desc: "Claude 3.5 Sonnet, Haiku via OpenRouter", url: "https://console.anthropic.com/settings/keys", free: false, envKey: "", placeholder: "Paste OpenRouter key to use Claude" },
  gemini_openrouter:    { label: "Google Gemini",      emoji: "✨", desc: "Gemini Pro 1.5, Flash 1.5 via OpenRouter", url: "https://aistudio.google.com/app/apikey",      free: true,  envKey: "", placeholder: "Paste OpenRouter key for Gemini" },
  hf:        { label: "Hugging Face",  emoji: "🤗", desc: "Free CPU training, AutoTrain",       url: "https://huggingface.co/settings/tokens",          free: true,  envKey: "HF_TOKEN",          placeholder: "hf_..." },
} as const;

type ProviderId = keyof typeof PROVIDERS;

// ─── Default chain (backend pre-configured) ───────────────────────
const DEFAULT_CHAIN = [
  { step: 1, id: "ollama",     label: "OllamaFreeAPI", model: "LLaMA 3 / Mistral / Gemma", emoji: "🆓", free: true,  keyRequired: false },
  { step: 2, id: "nvidia",     label: "NVIDIA NIM",    model: "LLaMA 3.1 70B / Nemotron",  emoji: "🟢", free: true,  keyRequired: true  },
  { step: 3, id: "openrouter", label: "OpenRouter",    model: "Claude 3.5 / GPT-4o / 100+",emoji: "🌐", free: true,  keyRequired: true  },
  { step: 4, id: "mistral",    label: "Mistral AI",    model: "Mistral Large / 7B",          emoji: "🌊", free: false, keyRequired: true  },
  { step: 5, id: "groq",       label: "Groq",          model: "LLaMA 3.1 70B / Mixtral",    emoji: "⚡", free: true,  keyRequired: true  },
];

const inp: React.CSSProperties = {
  width: "100%", height: "38px", borderRadius: "10px",
  padding: "0 40px 0 12px", fontSize: "13px",
  background: "var(--md-surface)", border: "1px solid var(--md-outline)",
  color: "var(--md-on-surface)", outline: "none", fontFamily: "monospace",
};

export default function TrainingProviderPanel({ selectedProvider, onProviderChange }: Props) {
  // Saved keys
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [customProviders, setCustomProviders] = useState<CustomProvider[]>([]);

  // UI state
  const [expanded, setExpanded]       = useState(false);
  const [activeTab, setActiveTab]     = useState<"chain" | "keys" | "custom">("chain");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
  const [newCustom, setNewCustom]     = useState<{ provider_id: ProviderId | ""; api_key: string }>({ provider_id: "", api_key: "" });

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("training_provider_keys") || "{}");
      setKeys(s);
      const c = JSON.parse(localStorage.getItem("training_custom_providers") || "[]");
      setCustomProviders(c);
    } catch {}
  }, []);

  const setKey = (k: string, v: string) => setKeys(prev => ({ ...prev, [k]: v }));
  const toggleShow = (k: string) => setShow(prev => ({ ...prev, [k]: !prev[k] }));

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem("training_provider_keys", JSON.stringify(keys));
    localStorage.setItem("training_custom_providers", JSON.stringify(customProviders));
    try {
      await api.post("/training/api-keys", { ...keys, custom_providers: customProviders });
    } catch {}
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addCustomProvider = () => {
    if (!newCustom.provider_id || !newCustom.api_key.trim()) return;
    const cfg = PROVIDERS[newCustom.provider_id as ProviderId];
    const entry: CustomProvider = {
      id: uuid4(),
      provider_id: newCustom.provider_id,
      api_key: newCustom.api_key.trim(),
      label: cfg.label,
    };
    setCustomProviders(prev => [...prev, entry]);
    setNewCustom({ provider_id: "", api_key: "" });
    setAddingCustom(false);
  };

  const removeCustom = (id: string) => setCustomProviders(prev => prev.filter(c => c.id !== id));

  // Count active defaults (have key set)
  const getKeyFor = (id: string) => {
    const map: Record<string, string> = {
      nvidia: "nvidia_api_key", openrouter: "openrouter_api_key",
      mistral: "mistral_api_key", groq: "groq_api_key",
      together: "together_api_key",
    };
    return keys[map[id] || id] || "";
  };

  const activeCount = DEFAULT_CHAIN.filter(c => !c.keyRequired || !!getKeyFor(c.id)).length
                    + customProviders.length;

  const tabStyle = (t: string): React.CSSProperties => ({
    padding: "6px 16px", borderRadius: "100px", fontSize: "12px", fontWeight: 700,
    border: "none", cursor: "pointer",
    background: activeTab === t ? "var(--md-primary)" : "var(--md-surface-2)",
    color: activeTab === t ? "var(--md-on-primary)" : "var(--md-on-surface-var)",
    transition: "all 0.15s",
  });

  return (
    <div style={{ border: "1px solid var(--md-outline)", borderRadius: "20px", overflow: "hidden", background: "var(--md-surface-1)", marginBottom: "24px" }}>

      {/* ── Header ── */}
      <button onClick={() => setExpanded(p => !p)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--md-success-cont)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles style={{ width: "18px", height: "18px", color: "var(--md-success)" }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--md-on-surface)" }}>
              AI Training Providers
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--md-success)" }}>
              🆓 Free training ready · {activeCount} provider{activeCount !== 1 ? "s" : ""} active in chain
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "100px", background: "var(--md-success-cont)", color: "var(--md-success)", fontWeight: 700 }}>FREE</span>
          <ChevronRight style={{ width: "16px", height: "16px", color: "var(--md-on-surface-var)", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--md-outline-var)" }}>

              {/* ── Tabs ── */}
              <div style={{ display: "flex", gap: "6px", margin: "16px 0 20px" }}>
                <button style={tabStyle("chain")} onClick={() => setActiveTab("chain")}>⛓ Chain</button>
                <button style={tabStyle("keys")}  onClick={() => setActiveTab("keys")}>🔑 API Keys</button>
                <button style={tabStyle("custom")} onClick={() => setActiveTab("custom")}>
                  ✨ Add Providers {customProviders.length > 0 && `(${customProviders.length})`}
                </button>
              </div>

              {/* ─────────── TAB: CHAIN ─────────── */}
              {activeTab === "chain" && (
                <div>
                  <p style={{ fontSize: "12px", color: "var(--md-on-surface-var)", margin: "0 0 12px 0" }}>
                    Training tries providers in order. If one fails for any reason, it auto-switches to the next.
                  </p>

                  {/* Default chain */}
                  {DEFAULT_CHAIN.map((step, i) => {
                    const active = !step.keyRequired || !!getKeyFor(step.id);
                    return (
                      <div key={step.step}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
                          borderRadius: "12px", marginBottom: "2px",
                          background: active ? "var(--md-surface-2)" : "var(--md-surface)",
                          border: `1px solid ${active ? "var(--md-outline)" : "var(--md-outline-var)"}`,
                          opacity: active ? 1 : 0.45,
                        }}>
                          <div style={{ width: "22px", height: "22px", borderRadius: "50%", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: active ? "var(--md-primary)" : "var(--md-surface-3)", color: active ? "var(--md-on-primary)" : "var(--md-on-surface-var)" }}>
                            {step.step}
                          </div>
                          <span style={{ fontSize: "16px" }}>{step.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)" }}>{step.label}</span>
                              <span style={{ fontSize: "11px", color: "var(--md-on-surface-var)" }}>→</span>
                              <span style={{ fontSize: "12px", color: "var(--md-primary)", fontWeight: 600 }}>{step.model}</span>
                              {step.free && <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "100px", background: "var(--md-success-cont)", color: "var(--md-success)", fontWeight: 700 }}>FREE</span>}
                            </div>
                          </div>
                          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "100px", fontWeight: 700, whiteSpace: "nowrap", background: active ? "var(--md-success-cont)" : "var(--md-surface-3)", color: active ? "var(--md-success)" : "var(--md-on-surface-var)" }}>
                            {active ? "✓ Ready" : "No key"}
                          </span>
                        </div>
                        {(i < DEFAULT_CHAIN.length - 1 || customProviders.length > 0) && (
                          <div style={{ display: "flex", justifyContent: "center", opacity: 0.25 }}>
                            <ArrowDown style={{ width: "13px", height: "13px", color: "var(--md-on-surface-var)" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* User custom providers in chain */}
                  {customProviders.map((cp, i) => {
                    const cfg = PROVIDERS[cp.provider_id as ProviderId];
                    return (
                      <div key={cp.id}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "12px", marginBottom: "2px", background: "var(--md-surface-2)", border: "1px solid var(--md-outline)" }}>
                          <div style={{ width: "22px", height: "22px", borderRadius: "50%", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--md-primary)", color: "var(--md-on-primary)" }}>
                            {DEFAULT_CHAIN.length + i + 1}
                          </div>
                          <span style={{ fontSize: "16px" }}>{cfg?.emoji || "🔑"}</span>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)" }}>{cfg?.label || cp.provider_id}</span>
                            <span style={{ fontSize: "11px", color: "var(--md-on-surface-var)", marginLeft: "6px" }}>→ user-added</span>
                          </div>
                          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "100px", fontWeight: 700, background: "var(--md-success-cont)", color: "var(--md-success)" }}>✓ Ready</span>
                        </div>
                        {i < customProviders.length - 1 && (
                          <div style={{ display: "flex", justifyContent: "center", opacity: 0.25 }}>
                            <ArrowDown style={{ width: "13px", height: "13px", color: "var(--md-on-surface-var)" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Explain box */}
                  <div style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "10px", background: "var(--md-primary-container)", border: "1px solid var(--md-outline-var)", display: "flex", gap: "10px" }}>
                    <Shield style={{ width: "15px", height: "15px", color: "var(--md-primary)", flexShrink: 0, marginTop: "1px" }} />
                    <p style={{ fontSize: "12px", color: "var(--md-on-surface-var)", margin: 0, lineHeight: 1.5 }}>
                      <strong style={{ color: "var(--md-on-surface)" }}>Auto-fallback:</strong> If a provider fails (credits, rate limit, server error), the next one is tried automatically.
                      You see every switch in the live training log.
                    </p>
                  </div>
                </div>
              )}

              {/* ─────────── TAB: API KEYS ─────────── */}
              {activeTab === "keys" && (
                <div>
                  <p style={{ fontSize: "12px", color: "var(--md-on-surface-var)", margin: "0 0 16px 0" }}>
                    Pre-configured keys below. All free to sign up. The more you add, the longer your fallback chain.
                  </p>

                  {(["nvidia", "openrouter", "mistral", "groq", "together", "hf"] as const).map(pid => {
                    const cfg = PROVIDERS[pid as ProviderId];
                    if (!cfg) return null;
                    const mapKey = pid === "hf" ? "hf_token" : `${pid}_api_key`;
                    const val = keys[mapKey] || "";
                    const active = !!val;
                    return (
                      <div key={pid} style={{ marginBottom: "14px" }}>
                        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, marginBottom: "6px", color: active ? "var(--md-on-surface)" : "var(--md-on-surface-var)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {cfg.emoji} {cfg.label}
                            {cfg.free && <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "100px", background: "var(--md-success-cont)", color: "var(--md-success)", fontWeight: 700, textTransform: "none", letterSpacing: 0 }}>FREE</span>}
                            {active && <span style={{ fontSize: "10px", color: "var(--md-success)", fontWeight: 700, textTransform: "none", letterSpacing: 0 }}>✓ Connected</span>}
                          </span>
                          <a href={cfg.url} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "var(--md-primary)", textDecoration: "none", fontWeight: 600, textTransform: "none", letterSpacing: 0, display: "flex", alignItems: "center", gap: "3px" }}>
                            Get key <ExternalLink style={{ width: "10px", height: "10px" }} />
                          </a>
                        </label>
                        <p style={{ fontSize: "11px", color: "var(--md-on-surface-var)", margin: "0 0 6px 0" }}>{cfg.desc}</p>
                        <div style={{ position: "relative" }}>
                          <input
                            type={show[mapKey] ? "text" : "password"}
                            value={val}
                            onChange={e => setKey(mapKey, e.target.value)}
                            placeholder={cfg.placeholder}
                            style={inp}
                          />
                          <button onClick={() => toggleShow(mapKey)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--md-on-surface-var)" }}>
                            {show[mapKey] ? <EyeOff style={{ width: "13px", height: "13px" }} /> : <Eye style={{ width: "13px", height: "13px" }} />}
                          </button>
                        </div>
                        {pid === "hf" && (
                          <input type="text" value={keys["hf_username"] || ""} onChange={e => setKey("hf_username", e.target.value)} placeholder="HF username" style={{ ...inp, paddingRight: "12px", marginTop: "6px" }} />
                        )}
                      </div>
                    );
                  })}

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px" }}>
                    <button onClick={handleSave} disabled={saving}
                      style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 20px", borderRadius: "10px", background: "var(--md-primary)", color: "var(--md-on-primary)", fontSize: "13px", fontWeight: 700, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
                      {saving ? <RefreshCw style={{ width: "13px", height: "13px" }} /> : <Save style={{ width: "13px", height: "13px" }} />}
                      {saving ? "Saving..." : "Save All Keys"}
                    </button>
                    <AnimatePresence>
                      {saved && (
                        <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                          style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "var(--md-success)", fontWeight: 600 }}>
                          <CheckCircle2 style={{ width: "14px", height: "14px" }} /> Saved & chain updated!
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* ─────────── TAB: ADD PROVIDERS ─────────── */}
              {activeTab === "custom" && (
                <div>
                  <p style={{ fontSize: "12px", color: "var(--md-on-surface-var)", margin: "0 0 14px 0" }}>
                    Add any additional AI provider. They'll be appended to the fallback chain.
                  </p>

                  {/* Existing custom */}
                  {customProviders.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      {customProviders.map(cp => {
                        const cfg = PROVIDERS[cp.provider_id as ProviderId];
                        return (
                          <div key={cp.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "12px", marginBottom: "8px", background: "var(--md-surface-2)", border: "1px solid var(--md-outline)" }}>
                            <span style={{ fontSize: "16px" }}>{cfg?.emoji || "🔑"}</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)" }}>{cfg?.label}</p>
                              <p style={{ margin: 0, fontSize: "11px", color: "var(--md-on-surface-var)" }}>
                                {cp.api_key.slice(0, 8)}••••••••••••
                              </p>
                            </div>
                            <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "100px", background: "var(--md-success-cont)", color: "var(--md-success)", fontWeight: 700 }}>✓ Active</span>
                            <button onClick={() => removeCustom(cp.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--md-error)", padding: "4px" }}>
                              <Trash2 style={{ width: "14px", height: "14px" }} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add new */}
                  {addingCustom ? (
                    <div style={{ padding: "16px", borderRadius: "14px", background: "var(--md-surface-2)", border: "1px solid var(--md-outline)" }}>
                      <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: "var(--md-on-surface)" }}>Add Provider</p>

                      {/* Provider selector */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                        {(Object.keys(PROVIDERS) as ProviderId[]).map(pid => {
                          const cfg = PROVIDERS[pid];
                          const sel = newCustom.provider_id === pid;
                          return (
                            <button key={pid} onClick={() => setNewCustom(p => ({ ...p, provider_id: pid }))}
                              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, border: `1.5px solid ${sel ? "var(--md-primary)" : "var(--md-outline)"}`, background: sel ? "var(--md-primary-container)" : "var(--md-surface)", color: sel ? "var(--md-primary)" : "var(--md-on-surface-var)", cursor: "pointer" }}>
                              {cfg.emoji} {cfg.label}
                              {cfg.free && <span style={{ fontSize: "9px", color: "var(--md-success)", fontWeight: 800 }}>FREE</span>}
                            </button>
                          );
                        })}
                      </div>

                      {newCustom.provider_id && (
                        <>
                          <p style={{ fontSize: "11px", color: "var(--md-on-surface-var)", margin: "0 0 8px" }}>
                            {PROVIDERS[newCustom.provider_id as ProviderId]?.desc}
                            {" · "}
                            <a href={PROVIDERS[newCustom.provider_id as ProviderId]?.url} target="_blank" rel="noreferrer" style={{ color: "var(--md-primary)" }}>Get key ↗</a>
                          </p>
                          <div style={{ position: "relative", marginBottom: "12px" }}>
                            <input type="password" value={newCustom.api_key}
                              onChange={e => setNewCustom(p => ({ ...p, api_key: e.target.value }))}
                              placeholder={PROVIDERS[newCustom.provider_id as ProviderId]?.placeholder}
                              style={inp}
                            />
                          </div>
                        </>
                      )}

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={addCustomProvider}
                          disabled={!newCustom.provider_id || !newCustom.api_key}
                          style={{ padding: "8px 16px", borderRadius: "10px", background: "var(--md-primary)", color: "var(--md-on-primary)", fontSize: "13px", fontWeight: 700, border: "none", cursor: !newCustom.provider_id || !newCustom.api_key ? "not-allowed" : "pointer", opacity: !newCustom.provider_id || !newCustom.api_key ? 0.5 : 1 }}>
                          Add to Chain
                        </button>
                        <button onClick={() => { setAddingCustom(false); setNewCustom({ provider_id: "", api_key: "" }); }}
                          style={{ padding: "8px 16px", borderRadius: "10px", background: "var(--md-surface-3)", color: "var(--md-on-surface-var)", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setAddingCustom(true)}
                      style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "12px 16px", borderRadius: "12px", background: "var(--md-surface-2)", border: "2px dashed var(--md-outline)", color: "var(--md-primary)", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                      <Plus style={{ width: "16px", height: "16px" }} />
                      Add Claude, OpenAI, Gemini, or any other provider...
                    </button>
                  )}

                  {customProviders.length > 0 && (
                    <button onClick={handleSave} disabled={saving}
                      style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 20px", borderRadius: "10px", background: "var(--md-primary)", color: "var(--md-on-primary)", fontSize: "13px", fontWeight: 700, border: "none", cursor: "pointer", marginTop: "14px" }}>
                      {saving ? <RefreshCw style={{ width: "13px", height: "13px" }} /> : <Save style={{ width: "13px", height: "13px" }} />}
                      Save Changes
                    </button>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function uuid4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
