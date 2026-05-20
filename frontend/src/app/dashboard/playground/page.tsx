"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { 
  Send, 
  User, 
  Bot, 
  Settings2,
  Sparkles,
  ChevronDown,
  ArrowLeftRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

export default function PlaygroundPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'assistant', content: 'Hello! I am your trained AI model. Select a model from the settings to start testing.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [modelsList, setModelsList] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      let dbModels: any[] = [];
      let local: any[] = [];

      try {
        const response = await api.get('/models/');
        dbModels = response.data;
      } catch (err: any) {
        if (!err.isOffline) console.error('Failed to fetch models for playground:', err);
      }

      try {
        local = JSON.parse(localStorage.getItem('local_models') || '[]');
      } catch {}

      const combined = [...dbModels, ...local];
      setModelsList(combined);

      if (combined.length > 0) {
        setSelectedModel(combined[0]);
        setMessages([
          { id: Date.now(), role: 'assistant', content: `Welcome! Ready to test model: ${combined[0].name}. Enter some text below to analyze its sentiment.` }
        ]);
      }
    };
    fetchModels();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    if (selectedModel?.local) {
      setTimeout(() => {
        let content = '';
        const task = (selectedModel.task_type || '').toLowerCase();
        
        if (task.includes('sentiment') || task.includes('classification')) {
          const positiveWords = ['good', 'love', 'great', 'awesome', 'best', 'happy', 'fantastic', 'nice', 'excellent', 'amazing'];
          const hasPositive = positiveWords.some(w => input.toLowerCase().includes(w));
          const sentiment = hasPositive ? 'Positive (confidence: 94.2%)' : 'Negative (confidence: 89.7%)';
          content = `[Local Simulation - ${selectedModel.name}] I have analyzed the sentiment of your message:\n"${input}"\n\nResult: ${sentiment}\n\nThis classification is simulated locally.`;
        } else if (task.includes('generation') || task.includes('summar') || task.includes('translat')) {
          content = `[Local Simulation - ${selectedModel.name}] I received your prompt: "${input}".\n\nHere is a simulated text completion:\n"Artificial intelligence is transforming SaaS applications. By optimizing local workflows, users enjoy zero latency, high privacy, and cost-effective prototyping. FaguV1 is running perfectly!"`;
        } else {
          content = `[Local Simulation - ${selectedModel.name}] I am your local model. Thank you for your message! Since I am running in local offline simulation mode, I am returning this static response to let you know that your UI integration is fully functional and responsive!`;
        }

        const assistantMsg: Message = { 
          id: Date.now() + 1, 
          role: 'assistant', 
          content
        };
        setMessages(prev => [...prev, assistantMsg]);
        setIsTyping(false);
      }, 800);
      return;
    }

    try {
      const response = await api.post('/inference/chat', {
        model_id: selectedModel?.id || 1,
        message: input
      });

      const assistantMsg: Message = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: response.data.response
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      if (!err.isOffline) console.error('Inference failed:', err);
      const errorMsg: Message = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while processing your request. Make sure your model has been trained successfully.' 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-12rem)] flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Model Playground</h1>
            <p className="text-gray-400">Interactive environment to test and validate your models.</p>
          </div>
          <div className="flex gap-4 relative items-center">
            <Link href="/dashboard/playground/compare">
              <Button variant="secondary" className="rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 gap-2 text-xs font-semibold">
                <ArrowLeftRight className="w-4 h-4 text-purple-400" />
                Model Arena
              </Button>
            </Link>
            <div 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="glass px-4 py-2 rounded-xl flex items-center gap-3 border border-white/5 cursor-pointer hover:bg-white/5 transition-all select-none"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">
                {selectedModel ? `${selectedModel.name} ${selectedModel.local ? '[Local]' : '[Cloud]'}` : "Select an AI model..."}
              </span>
              <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform duration-200", dropdownOpen ? "rotate-180" : "")} />
            </div>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-12 top-full mt-2 w-64 glass rounded-2xl border border-white/10 p-2 shadow-2xl z-50 flex flex-col bg-black/90 backdrop-blur-xl max-h-60 overflow-y-auto"
                >
                  {modelsList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No models found. Create one first!
                    </div>
                  ) : (
                    modelsList.map((model) => (
                      <button
                        key={`${model.local ? 'local' : 'db'}-${model.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedModel(model);
                          setDropdownOpen(false);
                          setMessages([
                            { id: Date.now(), role: 'assistant', content: `Switched to model: ${model.name}. Send a message to start classification analysis!` }
                          ]);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium transition-all hover:bg-white/5 flex flex-col gap-0.5",
                          (selectedModel?.id === model.id && selectedModel?.local === model.local) ? "bg-purple-500/20 text-purple-300 font-semibold" : "text-gray-400 hover:text-white"
                        )}
                      >
                        <span className="truncate block text-sm flex items-center justify-between">
                          {model.name}
                          <span className={cn(
                            "text-[8px] px-1.5 py-0.5 rounded",
                            model.local ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          )}>
                            {model.local ? 'Local' : 'Cloud'}
                          </span>
                        </span>
                        <span className="text-[10px] text-gray-500 truncate block font-normal">{model.base_model}</span>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <Button variant="secondary" size="icon">
              <Settings2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 glass rounded-3xl border-white/5 flex flex-col overflow-hidden bg-[#050505]/50 backdrop-blur-xl">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={cn(
                  "flex gap-4 max-w-[80%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                  msg.role === 'assistant' ? "premium-gradient" : "bg-white/10"
                )}>
                  {msg.role === 'assistant' ? <Bot className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-gray-400" />}
                </div>
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.role === 'assistant' 
                    ? "bg-white/5 border border-white/10 text-gray-100" 
                    : "bg-purple-600 text-white"
                )}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center shadow-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-black/40 border-t border-white/5">
            <form onSubmit={handleSend} className="relative">
              <input 
                type="text"
                placeholder={selectedModel ? `Send a message to ${selectedModel.name}...` : "Send a message to your model..."}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-6 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-white"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!selectedModel}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping || !selectedModel}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl premium-gradient flex items-center justify-center text-white disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-center text-[10px] text-gray-600 mt-4 uppercase tracking-[0.2em]">
              Inference Mode: Optimized for low latency
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
