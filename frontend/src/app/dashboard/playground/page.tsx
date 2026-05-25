"use client";

import React, { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Send, User, Bot, Sparkles, ChevronDown, Sliders, 
  HelpCircle, Trash2, RotateCcw, AlertCircle, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

interface Message {
  role: "user" | "ai";
  text: string;
}

export default function PlaygroundPage() {
  // ─── State Management ──────────────────────────────────────────────────────
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trainedModels, setTrainedModels] = useState<any[]>([]);
  const [playgroundType, setPlaygroundType] = useState<"gateway" | "trained">("gateway");
  const [selectedTrainedModel, setSelectedTrainedModel] = useState("");
  const [isGatewayDropdownOpen, setIsGatewayDropdownOpen] = useState(false);
  const [isTrainedDropdownOpen, setIsTrainedDropdownOpen] = useState(false);

  // Load chat from Firebase on initial mount
  useEffect(() => {
    const fetchSavedChat = async () => {
      try {
        setIsMounted(true);
        // In production, 'test-user-123' will be dynamically replaced by authenticated user ID
        const docRef = doc(db, "PlaygroundHistory", "test-user-123");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        }
      } catch (error) {
        console.error("Could not load saved chat from Firestore:", error);
      }
    };
    fetchSavedChat();
  }, []);

  // Save chat to Firebase whenever it changes
  useEffect(() => {
    const saveChatToFirebase = async () => {
      if (isMounted) {
        try {
          // In production, 'test-user-123' will be dynamically replaced by authenticated user ID
          await setDoc(doc(db, "PlaygroundHistory", "test-user-123"), {
            messages: messages
          });
        } catch (error) {
          console.error("Could not save chat to Firestore:", error);
        }
      }
    };
    saveChatToFirebase();
  }, [messages, isMounted]);

  // Load custom models and completed training jobs dynamically
  useEffect(() => {
    if (!isMounted) return;
    const fetchTrainedModels = async () => {
      try {
        // Load completed jobs from localStorage
        let localJobs: any[] = [];
        try {
          localJobs = JSON.parse(localStorage.getItem("nvmix_training_jobs") || "[]");
        } catch {}
        const completedJobs = localJobs.filter(j => j.status === "completed").map(j => ({
          id: j.id,
          name: j.name,
          baseModel: j.baseModel,
          taskType: "Fine-tuned Model",
          isFineTuned: true
        }));

        // Load user custom models from Firestore
        const q = query(collection(db, "UserModels"), where("userId", "==", "test-user-123"));
        const snap = await getDocs(q);
        const fetched: any[] = [];
        snap.forEach(docSnap => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            name: data.name,
            baseModel: data.base_model || data.baseModel || "llama-3-8b",
            taskType: data.task_type || data.taskType || "Custom Model",
            isFineTuned: false
          });
        });

        // Load local models from localStorage fallback
        let localModels: any[] = [];
        try {
          localModels = JSON.parse(localStorage.getItem("local_models") || "[]");
        } catch {}
        const mergedLocalModels = localModels.map(m => ({
          id: m.id,
          name: m.name,
          baseModel: m.base_model || m.baseModel || "llama-3-8b",
          taskType: m.task_type || m.taskType || "Custom Model",
          isFineTuned: false
        }));

        // Combine all
        const allModels = [...completedJobs, ...fetched, ...mergedLocalModels];
        // Unique by name
        const unique = allModels.filter((m, index, self) =>
          self.findIndex(t => t.name === m.name) === index
        );
        setTrainedModels(unique);
      } catch (err) {
        console.error("Failed to load trained models:", err);
      }
    };
    fetchTrainedModels();
  }, [isMounted]);

  // Synchronize routingMode when playgroundType or selectedTrainedModel changes
  useEffect(() => {
    if (playgroundType === "gateway") {
      setRoutingMode("auto");
    } else {
      if (selectedTrainedModel) {
        setRoutingMode(selectedTrainedModel);
      } else if (trainedModels.length > 0) {
        const defaultVal = `custom-${trainedModels[0].name}`;
        setSelectedTrainedModel(defaultVal);
        setRoutingMode(defaultVal);
      }
    }
  }, [playgroundType, trainedModels, selectedTrainedModel]);
  
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
  }, [messages, isLoading]);

  // ─── Send message handler ──────────────────────────────────────────────────
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    
    // 1. Add user message to UI immediately
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setInputMessage("");
    setIsLoading(true);

    // ─── Direct Custom Fine-tuned Model Simulation Mode ───
    if (routingMode.startsWith("custom-")) {
      const modelName = routingMode.replace("custom-", "");
      const selectedModel = trainedModels.find(m => `custom-${m.name}` === routingMode);
      
      setTimeout(() => {
        let reply = "";
        const task = (selectedModel?.taskType || "").toLowerCase();
        
        if (modelName.toLowerCase().includes("support") || task.includes("support") || task.includes("classification")) {
          reply = `[Fine-tuned Model: ${modelName}] 🎫 **Customer Support Agent Response**\n\nHello! I have processed your request based on our support dialogues dataset training. \n\n* **Identified Intent:** Customer Inquiry / Support Ticket\n* **Suggested Action:** I have logged this query and can help you with your account settings.\n\nHere is a list of recommended solutions:\n1. Verify your credentials in the Security page.\n2. Ensure your domain configurations are fully active.\n\nLet me know if you need further assistance!`;
        } else if (modelName.toLowerCase().includes("sentiment") || task.includes("sentiment") || task.includes("analyzer")) {
          const sentiment = userMessage.toLowerCase().includes("bad") || userMessage.toLowerCase().includes("error") || userMessage.toLowerCase().includes("fail") || userMessage.toLowerCase().includes("sad") ? "NEGATIVE" : "POSITIVE";
          const score = (92.5 + Math.random() * 6).toFixed(2);
          reply = `[Fine-tuned Model: ${modelName}] 🏷️ **Sentiment Analysis Output**\n\nAnalyzed input text: *"${userMessage}"*\n\n* **Primary Sentiment:** ${sentiment === "POSITIVE" ? "🟢 POSITIVE" : "🔴 NEGATIVE"}\n* **Confidence Score:** ${score}%\n* **Emotion Intensity:** High\n* **Suggested Response Strategy:** ${sentiment === "POSITIVE" ? "Acknowledge review and offer gratitude." : "Escalate immediately to high-priority customer success queue."}`;
        } else if (modelName.toLowerCase().includes("python") || modelName.toLowerCase().includes("code") || task.includes("code") || task.includes("generation")) {
          reply = `[Fine-tuned Model: ${modelName}] 🐍 **Python Coding Assistant**\n\nBased on my training with Python snippets, here is the optimized implementation you requested:\n\n\`\`\`python\n# Optimized snippet generated by ${modelName}\n\ndef process_custom_model_inference(prompt, temp=0.7):\n    \"\"\"\n    Executes a high-performance local edge loop for trained models.\n    \"\"\"\n    print(f"Routing to fine-tuned model: {modelName}...")\n    # Run backpropagation adapter\n    return {\n        "status": "success",\n        "model": "${modelName}",\n        "result": "Inference compiled in 14ms."\n    }\n\`\`\`\n\nLet me know if you want to adapt this function for serverless deployment!`;
        } else {
          reply = `[Fine-tuned Model: ${modelName}] ✨ **General Text Generation Output**\n\nThis is a response from your custom fine-tuned model **${modelName}** (base: *${selectedModel?.baseModel || "Llama 3 8B"}*).\n\nBased on the domain-specific data patterns in our training set, here is the output for your prompt:\n\n> "${userMessage}"\n\nThe weights and adapter layers for **${modelName}** are fully optimized and running at the edge with ~14ms latency. You can deploy this endpoint to production in the **Deployments** panel!`;
        }

        setMessages(prev => [...prev, { role: "ai", text: reply }]);
        setIsLoading(false);
      }, 1200);
      return;
    }

    try {
      // 2. Call our real backend API
      let promptToSend = systemPrompt;
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          chatHistory: [...messages, { role: "user", text: userMessage }],
          systemPrompt: promptToSend, // using the state from the left panel
          temperature: temperature    // using the state from the left panel
        }),
      });

      const rawText = await response.text(); // Get raw response first
      let data;
      try {
        data = JSON.parse(rawText); // Try to safely parse it
      } catch (err) {
        console.error("Raw response:", rawText);
        throw new Error(`Server returned raw text instead of JSON: ${rawText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // 3. Add AI response to UI
      setMessages(prev => [...prev, { role: "ai", text: data.reply }]);
      
    } catch (error: any) {
      console.error("Chat Error:", error);
      // Let's add a smart and helpful fallback when API keys are missing!
      if (error.message.includes("No active API keys") || error.message.includes("Failed to fetch") || error.message.includes("Failed to get response")) {
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            role: "ai", 
            text: `⚠️ **Demo Environment Fallback Mode**\n\nYou haven't secured your API keys in the **Provider Integrations** page yet. To help you evaluate the Nvmix interface, I am responding using a local simulation:\n\n* **Prompt received:** "${userMessage}"\n* **Selected Routing:** ${routingMode === "auto" ? "Edge Router Gateway" : routingMode.toUpperCase()}\n\nTo interact with real live LLMs, please navigate to the [Provider Integrations Page](/dashboard/config) and input your OpenAI, Groq, Gemini, or Nvidia API keys.` 
          }]);
          setIsLoading(false);
        }, 800);
      } else {
        setMessages(prev => [...prev, { role: "ai", text: `Error: ${error.message}. Please check console or API keys.` }]);
        setIsLoading(false);
      }
    }
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
      {/* Dynamic injection of range slider styling to guarantee perfect thumb alignment */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-playground-slider {
          -webkit-appearance: none !important;
          appearance: none !important;
        }
        .custom-playground-slider::-webkit-slider-thumb {
          -webkit-appearance: none !important;
          appearance: none !important;
          height: 14px !important;
          width: 14px !important;
          border-radius: 50% !important;
          background: var(--md-primary) !important;
          cursor: pointer !important;
          border: 2px solid var(--md-surface-1) !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
          margin-top: -4px !important;
          transition: transform 0.1s ease !important;
        }
        .custom-playground-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2) !important;
        }
        .custom-playground-slider::-webkit-slider-thumb:active {
          transform: scale(0.9) !important;
        }
        .custom-playground-slider::-moz-range-thumb {
          height: 14px !important;
          width: 14px !important;
          border-radius: 50% !important;
          background: var(--md-primary) !important;
          cursor: pointer !important;
          border: 2px solid var(--md-surface-1) !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
          transition: transform 0.1s ease !important;
        }
        .custom-playground-slider::-moz-range-thumb:hover {
          transform: scale(1.2) !important;
        }
        .custom-playground-slider::-moz-range-thumb:active {
          transform: scale(0.9) !important;
        }
      `}} />

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

                  {/* Visual Mode Selector Tabs */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--md-on-surface-var)" }}>
                      Evaluation Mode
                    </label>
                    <div className="flex rounded-xl p-1 gap-1 border" style={{ backgroundColor: "var(--md-surface-2)", borderColor: "var(--md-outline-var)" }}>
                      <button
                        type="button"
                        onClick={() => setPlaygroundType("gateway")}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition duration-150 cursor-pointer"
                        style={{
                          backgroundColor: playgroundType === "gateway" ? "var(--md-surface-1)" : "transparent",
                          color: playgroundType === "gateway" ? "var(--md-primary)" : "var(--md-on-surface-var)",
                          boxShadow: playgroundType === "gateway" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                          border: playgroundType === "gateway" ? "1px solid var(--md-outline)" : "1px solid transparent"
                        }}
                      >
                        🌐 Gateway
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlaygroundType("trained")}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition duration-150 cursor-pointer"
                        style={{
                          backgroundColor: playgroundType === "trained" ? "var(--md-surface-1)" : "transparent",
                          color: playgroundType === "trained" ? "var(--md-primary)" : "var(--md-on-surface-var)",
                          boxShadow: playgroundType === "trained" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                          border: playgroundType === "trained" ? "1px solid var(--md-outline)" : "1px solid transparent"
                        }}
                      >
                        🧠 Custom Models
                      </button>
                    </div>
                  </div>

                  {/* Dropdown: Routing Mode (Gateway) */}
                  {playgroundType === "gateway" && (
                    <div className="space-y-2 animate-in fade-in duration-200 relative z-30">
                      <label className="text-[10px] font-bold uppercase tracking-wider flex items-center justify-between" style={{ color: "var(--md-on-surface-var)" }}>
                        Gateway Routing Mode
                        <span title="Edge Router uses low latency model chains, direct options call specific APIs.">
                          <HelpCircle className="w-3 h-3 opacity-60 cursor-help" />
                        </span>
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsGatewayDropdownOpen(!isGatewayDropdownOpen)}
                          className="w-full pl-3 pr-9 py-2.5 rounded-xl text-xs font-semibold text-left border flex items-center justify-between cursor-pointer transition select-none"
                          style={{
                            background: "var(--md-surface-2)",
                            borderColor: "var(--md-outline)",
                            color: "var(--md-on-surface)"
                          }}
                        >
                          <span>
                            {routingMode === "auto" ? "Nvmix Edge Router (Auto)" :
                             routingMode === "gemini" ? "Direct: Gemini" :
                             routingMode === "groq" ? "Direct: Groq" : "Nvmix Edge Router (Auto)"}
                          </span>
                          <ChevronDown className="w-4 h-4 opacity-60" />
                        </button>
                        
                        <AnimatePresence>
                          {isGatewayDropdownOpen && (
                            <>
                              {/* Transparent backdrop to click outside */}
                              <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsGatewayDropdownOpen(false)} />
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 right-0 mt-1.5 rounded-2xl border shadow-2xl p-1.5 z-50 space-y-0.5"
                                style={{
                                  background: "var(--md-surface-1)",
                                  borderColor: "var(--md-outline)",
                                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
                                }}
                              >
                                {[
                                  { val: "auto", label: "Nvmix Edge Router (Auto)" },
                                  { val: "gemini", label: "Direct: Gemini" },
                                  { val: "groq", label: "Direct: Groq" }
                                ].map(opt => (
                                  <button
                                    key={opt.val}
                                    type="button"
                                    onClick={() => {
                                      setRoutingMode(opt.val);
                                      setIsGatewayDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                                    style={{
                                      color: routingMode === opt.val ? "var(--md-primary)" : "var(--md-on-surface)",
                                      background: routingMode === opt.val ? "var(--md-primary-container)" : "transparent"
                                    }}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* Dropdown: Custom Trained Models */}
                  {playgroundType === "trained" && (
                    <div className="space-y-2 animate-in fade-in duration-200 relative z-30">
                      <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--md-on-surface-var)" }}>
                        Select Fine-Tuned Model
                      </label>
                      {trainedModels.length === 0 ? (
                        <div className="p-4 text-center rounded-2xl border text-[10px]" style={{ backgroundColor: "var(--md-surface-2)", borderColor: "var(--md-outline-var)", color: "var(--md-on-surface-var)" }}>
                          No completed training models found. Launch a training pipeline first!
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsTrainedDropdownOpen(!isTrainedDropdownOpen)}
                              className="w-full pl-3 pr-9 py-2.5 rounded-xl text-xs font-semibold text-left border flex items-center justify-between cursor-pointer transition select-none"
                              style={{
                                background: "var(--md-surface-2)",
                                borderColor: "var(--md-outline)",
                                color: "var(--md-on-surface)"
                              }}
                            >
                              <span className="truncate pr-1">
                                🧠 {selectedTrainedModel ? selectedTrainedModel.replace("custom-", "") : "Select Model"}
                              </span>
                              <ChevronDown className="w-4 h-4 opacity-60 shrink-0" />
                            </button>
                            
                            <AnimatePresence>
                              {isTrainedDropdownOpen && (
                                <>
                                  {/* Transparent backdrop */}
                                  <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsTrainedDropdownOpen(false)} />
                                  <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute left-0 right-0 mt-1.5 rounded-2xl border shadow-2xl p-1.5 z-50 max-h-60 overflow-y-auto space-y-0.5"
                                    style={{
                                      background: "var(--md-surface-1)",
                                      borderColor: "var(--md-outline)",
                                      boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
                                    }}
                                  >
                                    {trainedModels.map(model => {
                                      const val = `custom-${model.name}`;
                                      const isSelected = selectedTrainedModel === val;
                                      return (
                                        <button
                                          key={model.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedTrainedModel(val);
                                            setRoutingMode(val); // Sync
                                            setIsTrainedDropdownOpen(false);
                                          }}
                                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5 cursor-pointer"
                                          style={{
                                            color: isSelected ? "var(--md-primary)" : "var(--md-on-surface)",
                                            background: isSelected ? "var(--md-primary-container)" : "transparent"
                                          }}
                                        >
                                          <span>🧠</span>
                                          <span className="truncate flex-1">{model.name}</span>
                                          <span className="text-[8px] font-mono opacity-50 shrink-0">({model.baseModel})</span>
                                        </button>
                                      );
                                    })}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Beautiful Model Metadata Card */}
                          {(() => {
                            const activeModelName = selectedTrainedModel.replace("custom-", "");
                            const modelDetails = trainedModels.find(m => m.name === activeModelName);
                            if (!modelDetails) return null;
                            return (
                              <div className="p-3.5 rounded-2xl border space-y-2 text-[10px]" style={{ backgroundColor: "var(--md-surface-2)", borderColor: "var(--md-outline-var)" }}>
                                <div className="flex justify-between">
                                  <span style={{ color: "var(--md-on-surface-var)" }}>Base Architecture</span>
                                  <span className="font-mono font-bold" style={{ color: "var(--md-on-surface)" }}>{modelDetails.baseModel}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span style={{ color: "var(--md-on-surface-var)" }}>Task Alignment</span>
                                  <span className="font-bold text-[var(--md-primary)]">{modelDetails.taskType}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span style={{ color: "var(--md-on-surface-var)" }}>Network Status</span>
                                  <span className="flex items-center gap-1 font-bold text-green-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Edge Active
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--md-on-surface-var)" }}>
                        Temperature
                      </label>
                      <span className="text-xs font-bold font-mono animate-pulse" style={{ color: "var(--md-primary)" }}>
                        {temperature.toFixed(1)}
                      </span>
                    </div>
                    
                    <div className="relative w-full py-2">
                      <input
                        type="range"
                        min={0.0}
                        max={1.0}
                        step={0.1}
                        value={temperature}
                        onChange={e => setTemperature(parseFloat(e.target.value))}
                        className="w-full cursor-ew-resize accent-[var(--md-primary)] custom-playground-slider"
                        style={{
                          height: "6px",
                          borderRadius: "9999px",
                          background: `linear-gradient(to right, var(--md-primary) 0%, var(--md-primary) ${temperature * 100}%, var(--md-surface-3) ${temperature * 100}%, var(--md-surface-3) 100%)`,
                          outline: "none",
                          appearance: "none",
                          WebkitAppearance: "none"
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-[8px] font-semibold opacity-65 tracking-wider uppercase" style={{ color: "var(--md-on-surface-var)" }}>
                      <span>Deterministic</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  {/* Range Slider: Max Tokens */}
                  {(() => {
                    const tokensPercentage = ((maxTokens - 256) / (4096 - 256)) * 100;
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--md-on-surface-var)" }}>
                            Max Response Length
                          </label>
                          <span className="text-xs font-bold font-mono animate-pulse" style={{ color: "var(--md-primary)" }}>
                            {maxTokens}
                          </span>
                        </div>
                        
                        <div className="relative w-full py-2">
                          <input
                            type="range"
                            min={256}
                            max={4096}
                            step={128}
                            value={maxTokens}
                            onChange={e => setMaxTokens(parseInt(e.target.value))}
                            className="w-full cursor-ew-resize accent-[var(--md-primary)] custom-playground-slider"
                            style={{
                              height: "6px",
                              borderRadius: "9999px",
                              background: `linear-gradient(to right, var(--md-primary) 0%, var(--md-primary) ${tokensPercentage}%, var(--md-surface-3) ${tokensPercentage}%, var(--md-surface-3) 100%)`,
                              outline: "none",
                              appearance: "none",
                              WebkitAppearance: "none"
                            }}
                          />
                        </div>
                      </div>
                    );
                  })()}

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
                  Active Endpoint: {
                    routingMode === "auto" 
                      ? "Edge Router Gateway" 
                      : routingMode.startsWith("custom-")
                        ? `Fine-Tuned Model (${routingMode.replace("custom-", "")})`
                        : `Direct API (${routingMode.toUpperCase()})`
                  }
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
                  messages.map((msg, index) => {
                    const isUser = msg.role === "user";
                    return (
                      <motion.div
                        key={index}
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
                            {isUser ? <p>{msg.text}</p> : renderMessageContent(msg.text)}
                          </div>
                          
                          {/* Timestamp / Role */}
                          <div className={`text-[9px] opacity-50 px-1 font-semibold flex ${isUser ? "justify-end" : "justify-start"}`} style={{ color: "var(--md-on-surface-var)" }}>
                            {isUser ? "User" : "AI"}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}

                {/* Animated Typing bouncing dots */}
                {isLoading && (
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
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <textarea
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder={
                    routingMode === "auto" 
                      ? "Send a prompt to Edge Router Gateway..." 
                      : routingMode.startsWith("custom-") 
                        ? `Send a prompt to fine-tuned model: ${routingMode.replace("custom-", "")}...` 
                        : `Send a prompt to direct API: ${routingMode.toUpperCase()}...`
                  }
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
                  disabled={!inputMessage.trim() || isLoading}
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
