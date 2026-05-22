"use client";

import React, { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Send, User, Bot, Sparkles, ChevronDown, Sliders, 
  HelpCircle, Trash2, RotateCcw, AlertCircle, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function PlaygroundPage() {
  // ─── State Management ──────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "user",
      content: "How can I deploy a local edge routing gateway?",
      timestamp: "10:24 AM"
    },
    {
      id: 2,
      role: "assistant",
      content: "You can deploy it using the Nemix Edge SDK. Navigate to the Edge Router section in the sidebar to download the edge configuration, install `@nemix/sdk` via npm, and initialize it with your secure client-side encryption key.\n\n```javascript\nimport { NemixRouter } from '@nemix/sdk';\n\nconst router = new NemixRouter({\n  apiKey: process.env.NEMIX_API_KEY,\n  fallbackChain: ['openai', 'anthropic', 'gemini']\n});\n```\nThis setup allows full local client execution with absolute offline-first protection.",
      timestamp: "10:25 AM"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Sidebar config settings
  const [routingMode, setRoutingMode] = useState("auto");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant specialized in SaaS systems.");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // ─── Send message handler ──────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    // Simulate ChatGPT-style typing latency & response
    setTimeout(() => {
      let aiResponseText = "";
      const query = currentInput.toLowerCase();

      if (query.includes("hello") || query.includes("hi ") || query.includes("hey")) {
        aiResponseText = `Hello! I am your AI assistant running in **${routingMode === "auto" ? "Nemix Edge Router (Auto)" : routingMode === "gemini" ? "Direct: Gemini" : "Direct: Groq"}** mode. I have loaded your system prompt:\n\n> "${systemPrompt}"\n\nHow can I help you today?`;
      } else if (query.includes("code") || query.includes("write") || query.includes("function")) {
        aiResponseText = "Here is a clean implementation for your request:\n\n```typescript\ninterface RouterConfig {\n  provider: string;\n  latency: number;\n  active: boolean;\n}\n\nexport function validateActiveRoute(routes: RouterConfig[]): RouterConfig | null {\n  return routes.find(r => r.active && r.latency < 100) || null;\n}\n```\nThis checks for active routes and prioritizes models with a latency lower than 100ms.";
      } else {
        aiResponseText = `I have received your prompt: "${currentInput}".\n\nHere are the details under current parameters:\n* **Routing Engine**: \`${routingMode.toUpperCase()}\`\n* **Temperature**: \`${temperature}\`\n* **System Context Length**: \`${systemPrompt.length} chars\`\n* **Max Completion Limit**: \`${maxTokens} tokens\``;
      }

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  // Clear chat handler
  const handleClear = () => {
    setMessages([]);
  };

  // Render markdown code blocks & bold text helper
  const renderMessageContent = (content: string) => {
    const lines = content.split("\n");
    let inCodeBlock = false;
    let codeLines: string[] = [];

    return lines.map((line, idx) => {
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const codeText = codeLines.join("\n");
          codeLines = [];
          return (
            <pre 
              key={idx} 
              className="bg-black/15 dark:bg-black/35 p-4 rounded-xl font-mono text-xs my-3 overflow-x-auto border"
              style={{ borderColor: "var(--md-outline-var)", color: "var(--md-on-surface)" }}
            >
              <code>{codeText}</code>
            </pre>
          );
        } else {
          inCodeBlock = true;
          return null;
        }
      }

      if (inCodeBlock) {
        codeLines.push(line);
        return null;
      }

      // Quote block
      if (line.startsWith("> ")) {
        return (
          <blockquote key={idx} className="border-l-4 pl-3 my-2 italic opacity-80" style={{ borderColor: "var(--md-primary)" }}>
            {line.slice(2)}
          </blockquote>
        );
      }

      // Bold text parser
      const parts = line.split("**");
      return (
        <p key={idx} className="my-1.5 min-h-[1.2rem]">
          {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold">{part}</strong> : part)}
        </p>
      );
    }).filter(el => el !== null);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-9.5rem)] relative gap-4">
        
        {/* Playground Top Bar */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--md-on-surface)" }}>
              Model Playground
            </h1>
            <p className="text-xs" style={{ color: "var(--md-on-surface-var)" }}>
              Experiment with direct model access or simulated routing parameters.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
              style={{ background: "var(--md-surface-1)", borderColor: "var(--md-outline)", color: "var(--md-on-surface-var)" }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Chat
            </button>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
              style={{ background: "var(--md-surface-1)", borderColor: "var(--md-outline)", color: "var(--md-on-surface)" }}
            >
              <Sliders className="w-3.5 h-3.5" /> Settings
            </button>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="flex-1 flex flex-row overflow-hidden gap-6">
          
          {/* LEFT/SIDE PANEL: Settings Configuration */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-80 shrink-0 hidden md:flex flex-col border rounded-3xl overflow-hidden justify-between p-5 space-y-6"
                style={{
                  background: "var(--md-surface-1)",
                  borderColor: "var(--md-outline)",
                  boxShadow: "var(--shadow-1)"
                }}
              >
                <div className="space-y-6 overflow-y-auto scrollbar-none pr-1">
                  
                  {/* Sidebar Header */}
                  <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: "var(--md-outline-var)" }}>
                    <Sliders className="w-4 h-4 text-[var(--md-primary)]" />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--md-on-surface)" }}>
                      Configuration settings
                    </span>
                  </div>

                  {/* Dropdown: Routing Mode */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider flex items-center justify-between" style={{ color: "var(--md-on-surface-var)" }}>
                      Routing Mode
                      <span title="Edge Router uses low latency model chains, direct options call specific APIs.">
                        <HelpCircle className="w-3 h-3 opacity-60 cursor-help" />
                      </span>
                    </label>
                    <div className="relative">
                      <select
                        value={routingMode}
                        onChange={e => setRoutingMode(e.target.value)}
                        className="w-full pl-3 pr-9 py-2.5 rounded-xl text-xs font-medium outline-none border cursor-pointer appearance-none transition-colors"
                        style={{
                          background: "var(--md-surface-2)",
                          borderColor: "var(--md-outline)",
                          color: "var(--md-on-surface)"
                        }}
                      >
                        <option value="auto">Nemix Edge Router (Auto)</option>
                        <option value="gemini">Direct: Gemini</option>
                        <option value="groq">Direct: Groq</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none" style={{ color: "var(--md-on-surface)" }} />
                    </div>
                  </div>

                  {/* Textarea: System Prompt */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--md-on-surface-var)" }}>
                      System Prompt
                    </label>
                    <textarea
                      value={systemPrompt}
                      onChange={e => setSystemPrompt(e.target.value)}
                      placeholder="You are a helpful AI assistant..."
                      rows={5}
                      className="w-full p-3 rounded-xl text-xs leading-relaxed outline-none border focus:border-[var(--md-primary)] resize-none transition-colors"
                      style={{
                        background: "var(--md-surface-2)",
                        borderColor: "var(--md-outline)",
                        color: "var(--md-on-surface)"
                      }}
                    />
                  </div>

                  {/* Range Slider: Temperature */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--md-on-surface-var)" }}>
                        Temperature
                      </label>
                      <span className="text-xs font-bold font-mono" style={{ color: "var(--md-primary)" }}>
                        {temperature.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.0}
                      max={1.0}
                      step={0.1}
                      value={temperature}
                      onChange={e => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-[var(--md-primary)] cursor-ew-resize bg-black/10 dark:bg-white/10 rounded-lg appearance-none h-1"
                    />
                    <div className="flex justify-between text-[8px] font-semibold opacity-65 tracking-wider uppercase" style={{ color: "var(--md-on-surface-var)" }}>
                      <span>Deterministic</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  {/* Range Slider: Max Tokens */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--md-on-surface-var)" }}>
                        Max Response Length
                      </label>
                      <span className="text-xs font-bold font-mono" style={{ color: "var(--md-primary)" }}>
                        {maxTokens}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={256}
                      max={4096}
                      step={128}
                      value={maxTokens}
                      onChange={e => setMaxTokens(parseInt(e.target.value))}
                      className="w-full accent-[var(--md-primary)] cursor-ew-resize bg-black/10 dark:bg-white/10 rounded-lg appearance-none h-1"
                    />
                  </div>

                </div>

                {/* Sidebar Info Banner */}
                <div className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl border flex gap-2" style={{ borderColor: "var(--md-outline-var)" }}>
                  <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <p className="text-[9px] leading-relaxed" style={{ color: "var(--md-on-surface-var)" }}>
                    Edge Router executes dynamic models locally for instant response latency and encrypted storage.
                  </p>
                </div>

              </motion.aside>
            )}
          </AnimatePresence>

          {/* RIGHT/MAIN PANEL: Main Chat Area */}
          <div 
            className="flex-1 flex flex-col border rounded-3xl overflow-hidden justify-between"
            style={{
              background: "var(--md-surface-1)",
              borderColor: "var(--md-outline)",
              boxShadow: "var(--shadow-1)"
            }}
          >
            {/* Top status indicator bar */}
            <div 
              className="flex items-center justify-between px-6 h-12 border-b"
              style={{ borderColor: "var(--md-outline-var)", background: "var(--md-surface-2)" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--md-on-surface)" }}>
                  Active Endpoint: {routingMode === "auto" ? "Edge Router Gateway" : `Direct API (${routingMode})`}
                </span>
              </div>
              <span className="text-[10px] opacity-60 font-semibold" style={{ color: "var(--md-on-surface-var)" }}>
                Latency: ~14ms
              </span>
            </div>

            {/* Scrollable messages area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
              <AnimatePresence initial={false}>
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <Sparkles className="w-10 h-10 text-[var(--md-primary)] animate-pulse" />
                    <div>
                      <h4 className="text-sm font-bold" style={{ color: "var(--md-on-surface)" }}>
                        Start a conversation
                      </h4>
                      <p className="text-xs max-w-sm mt-1 leading-relaxed" style={{ color: "var(--md-on-surface-var)" }}>
                        Enter a prompt below to evaluate model capabilities, edge chains, and configuration logic.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex gap-3.5 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                      >
                        {/* Bot/User Logo Avatar */}
                        <div 
                          className="w-8.5 h-8.5 rounded-xl border flex items-center justify-center shrink-0 shadow-sm"
                          style={{
                            background: isUser ? "var(--md-primary)" : "var(--md-surface-2)",
                            borderColor: "var(--md-outline)"
                          }}
                        >
                          {isUser ? (
                            <User className="w-4 h-4 text-[var(--md-on-primary)]" />
                          ) : (
                            <Bot className="w-4 h-4 text-[var(--md-primary)]" />
                          )}
                        </div>

                        {/* Speech Bubble */}
                        <div className="space-y-1">
                          <div 
                            className="p-4 rounded-2xl text-xs leading-relaxed border"
                            style={isUser ? {
                              background: "var(--md-primary-container)",
                              borderColor: "var(--md-outline)",
                              color: "var(--md-on-primary-cont)"
                            } : {
                              background: "var(--md-surface-2)",
                              borderColor: "var(--md-outline)",
                              color: "var(--md-on-surface)"
                            }}
                          >
                            {isUser ? <p>{msg.content}</p> : renderMessageContent(msg.content)}
                          </div>
                          
                          {/* Timestamp / Role */}
                          <div className={`text-[9px] opacity-50 px-1 font-semibold flex ${isUser ? "justify-end" : "justify-start"}`} style={{ color: "var(--md-on-surface-var)" }}>
                            {msg.timestamp}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}

                {/* Animated Typing bouncing dots */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3.5 mr-auto max-w-[85%]"
                  >
                    <div className="w-8.5 h-8.5 rounded-xl border flex items-center justify-center shrink-0 shadow-sm" style={{ background: "var(--md-surface-2)", borderColor: "var(--md-outline)" }}>
                      <Bot className="w-4 h-4 text-[var(--md-primary)]" />
                    </div>
                    <div className="p-4 rounded-2xl flex gap-1.5 items-center border" style={{ background: "var(--md-surface-2)", borderColor: "var(--md-outline)" }}>
                      {[0, 0.15, 0.3].map((delay, index) => (
                        <span 
                          key={index} 
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{
                            background: "var(--md-on-surface-var)",
                            animationDelay: `${delay}s`,
                            opacity: 0.6
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom input fixed message container */}
            <div className="p-4 border-t" style={{ borderColor: "var(--md-outline-var)", background: "var(--md-surface-2)" }}>
              <form onSubmit={handleSend} className="relative flex items-center">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder={routingMode === "auto" ? "Send a prompt to Edge Router Gateway..." : `Send a prompt to ${routingMode.toUpperCase()}...`}
                  rows={2}
                  className="w-full pl-4 pr-12 py-3 rounded-2xl text-xs outline-none border focus:border-[var(--md-primary)] resize-none transition-colors"
                  style={{
                    background: "var(--md-surface)",
                    borderColor: "var(--md-outline)",
                    color: "var(--md-on-surface)"
                  }}
                />
                
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-3.5 w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                  style={{
                    background: "var(--md-primary)",
                    color: "var(--md-on-primary)"
                  }}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              
              <div className="flex justify-between items-center text-[8px] mt-2.5 px-1 uppercase tracking-widest font-semibold" style={{ color: "var(--md-on-surface-var)", opacity: 0.5 }}>
                <span>Routing: AES-256 Client-Side Protected</span>
                <span>Press Enter to Send</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
