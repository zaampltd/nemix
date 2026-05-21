"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import {
  Send, User, Bot, Settings2, Sparkles, ChevronDown, ArrowLeftRight
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
      try { local = JSON.parse(localStorage.getItem('local_models') || '[]'); } catch {}
      const combined = [...dbModels, ...local];
      setModelsList(combined);
      if (combined.length > 0) {
        setSelectedModel(combined[0]);
        setMessages([{ id: Date.now(), role: 'assistant', content: `Welcome! Ready to test model: ${combined[0].name}. Enter some text below to analyze its sentiment.` }]);
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
        const task = (selectedModel.task_type || '').toLowerCase();
        let content = '';
        if (task.includes('sentiment') || task.includes('classification')) {
          const pos = ['good','love','great','awesome','best','happy','fantastic','nice','excellent','amazing'].some(w => input.toLowerCase().includes(w));
          content = `[Local Simulation — ${selectedModel.name}]\n\nResult: ${pos ? 'Positive (94.2%)' : 'Negative (89.7%)'}\n\nThis classification is simulated locally.`;
        } else {
          content = `[Local Simulation — ${selectedModel.name}]\n\nThank you for your message! Your UI integration is fully functional.`;
        }
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content }]);
        setIsTyping(false);
      }, 800);
      return;
    }

    try {
      const response = await api.post('/inference/chat', { model_id: selectedModel?.id || 1, message: input });
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: response.data.response }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: 'Sorry, I encountered an error. Make sure your model has been trained successfully.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-12rem)] flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--md-on-surface)' }}>Model Playground</h1>
            <p className="text-sm" style={{ color: 'var(--md-on-surface-var)' }}>Interactive environment to test and validate your models.</p>
          </div>
          <div className="flex gap-3 relative items-center">
            {/* Model Arena button */}
            <Link href="/dashboard/playground/compare">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border"
                style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)' }}>
                <ArrowLeftRight className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />
                Model Arena
              </button>
            </Link>

            {/* Model selector */}
            <div onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl cursor-pointer transition-all select-none"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)' }}>
              <Sparkles className="w-4 h-4 shrink-0" style={{ color: 'var(--md-primary)' }} />
              <span className="text-sm font-medium">
                {selectedModel ? `${selectedModel.name}${selectedModel.local ? ' [Local]' : ''}` : 'Select an AI model...'}
              </span>
              <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', dropdownOpen ? 'rotate-180' : '')}
                style={{ color: 'var(--md-on-surface-var)' }} />
            </div>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-14 top-full mt-2 w-64 rounded-2xl p-2 z-50 flex flex-col max-h-60 overflow-y-auto"
                  style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)' }}>
                  {modelsList.length === 0 ? (
                    <div className="p-4 text-center text-xs" style={{ color: 'var(--md-on-surface-var)' }}>
                      No models found. Create one first!
                    </div>
                  ) : modelsList.map(model => (
                    <button key={`${model.local ? 'local' : 'db'}-${model.id}`} type="button"
                      onClick={() => {
                        setSelectedModel(model); setDropdownOpen(false);
                        setMessages([{ id: Date.now(), role: 'assistant', content: `Switched to model: ${model.name}. Send a message to start testing!` }]);
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col gap-0.5"
                      style={{
                        background: (selectedModel?.id === model.id && selectedModel?.local === model.local) ? 'var(--md-primary-container)' : 'transparent',
                        color: (selectedModel?.id === model.id && selectedModel?.local === model.local) ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface-var)',
                      }}>
                      <span className="truncate text-sm flex items-center justify-between">
                        {model.name}
                        <span className="text-[8px] px-1.5 py-0.5 rounded ml-1"
                          style={{ background: model.local ? 'var(--md-primary-container)' : 'var(--md-surface-2)', color: 'var(--md-on-primary-cont)' }}>
                          {model.local ? 'Local' : 'Cloud'}
                        </span>
                      </span>
                      <span className="text-[10px] truncate font-normal" style={{ color: 'var(--md-on-surface-var)', opacity: 0.7 }}>{model.base_model}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Settings button — FIXED */}
            <button className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)' }}>
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat container — FIXED dark background */}
        <div className="flex-1 rounded-3xl flex flex-col overflow-hidden"
          style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-2)' }}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-3 max-w-[80%]', msg.role === 'user' ? 'ml-auto flex-row-reverse' : '')}>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0')}
                  style={{ background: msg.role === 'assistant' ? 'var(--md-primary)' : 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}>
                  {msg.role === 'assistant'
                    ? <Bot className="w-5 h-5" style={{ color: 'var(--md-on-primary)' }} />
                    : <User className="w-5 h-5" style={{ color: 'var(--md-on-surface-var)' }} />}
                </div>
                <div className="p-4 rounded-2xl text-sm leading-relaxed"
                  style={msg.role === 'assistant'
                    ? { background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)' }
                    : { background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
                  {msg.content}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--md-primary)' }}>
                  <Bot className="w-5 h-5" style={{ color: 'var(--md-on-primary)' }} />
                </div>
                <div className="p-4 rounded-2xl flex gap-1.5 items-center"
                  style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <span key={i} className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: 'var(--md-on-surface-var)', animationDelay: `${d}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input area — FIXED dark background */}
          <div className="p-4" style={{ borderTop: '1px solid var(--md-outline)', background: 'var(--md-surface-2)' }}>
            <form onSubmit={handleSend} className="relative">
              <input type="text"
                placeholder={selectedModel ? `Send a message to ${selectedModel.name}...` : 'Send a message to your model...'}
                className="w-full h-12 rounded-2xl pl-5 pr-14 text-sm focus:outline-none transition-all"
                style={{
                  background: 'var(--md-surface)',
                  border: '1px solid var(--md-outline)',
                  color: 'var(--md-on-surface)',
                }}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={!selectedModel}
              />
              <button type="submit" disabled={!input.trim() || isTyping || !selectedModel}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-center text-[10px] mt-3 uppercase tracking-widest" style={{ color: 'var(--md-on-surface-var)', opacity: 0.5 }}>
              Inference Mode: Optimized for low latency
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
