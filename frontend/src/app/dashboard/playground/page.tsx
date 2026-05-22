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

function getWelcomeMessage(model: any) {
  const task = (model?.task_type || '').toLowerCase();
  const name = model?.name || 'AI Model';
  if (task.includes('sentiment')) {
    return `Welcome! Ready to test model: ${name}. Enter some text below to analyze its sentiment.`;
  }
  if (task.includes('classification')) {
    return `Welcome! Ready to test model: ${name}. Enter some text below to classify its category.`;
  }
  if (task.includes('generation') || task.includes('chat') || task.includes('instruction')) {
    return `Welcome! Ready to test model: ${name}. Enter a prompt below to see the model's generation.`;
  }
  if (task.includes('summary') || task.includes('summarization')) {
    return `Welcome! Ready to test model: ${name}. Paste a long text below to see the model's summary.`;
  }
  if (task.includes('translation')) {
    return `Welcome! Ready to test model: ${name}. Enter some text to see the translation.`;
  }
  return `Welcome! Ready to test model: ${name}. Enter some text or a prompt below to begin testing.`;
}

export default function PlaygroundPage() {
  const [messages, setMessages] = useState<Message[]>([]);
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
        setMessages([{ id: Date.now(), role: 'assistant', content: getWelcomeMessage(combined[0]) }]);
      } else {
        setMessages([{ id: Date.now(), role: 'assistant', content: 'Hello! I am your trained AI model. Select a model from the settings to start testing.' }]);
      }
    };
    fetchModels();
  }, []);

  const streamMessage = (fullContent: string) => {
    setIsTyping(false);
    
    // Create a new message with empty content
    const msgId = Date.now() + 1;
    setMessages(prev => [...prev, { id: msgId, role: 'assistant', content: '' }]);
    
    const words = fullContent.split(' ');
    let currentWordIndex = 0;
    let currentText = '';
    
    const interval = setInterval(() => {
      if (currentWordIndex < words.length) {
        currentText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex];
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: currentText } : m));
        currentWordIndex++;
      } else {
        clearInterval(interval);
      }
    }, 30); // Typewriter stream
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    if (selectedModel?.local) {
      setTimeout(() => {
        const task = (selectedModel.task_type || '').toLowerCase();
        const modelName = selectedModel.name || 'AI Model';
        const query = currentInput.toLowerCase();
        let content = '';

        // Heuristics for the prompt classifier
        const isSentimentTask = task.includes('sentiment') || task.includes('classification') || modelName.toLowerCase().includes('sentiment') || modelName.toLowerCase().includes('anti');

        if (isSentimentTask) {
          const positiveWords = ['good','love','great','awesome','best','happy','fantastic','nice','excellent','amazing','wonderful','perfect','beautiful','satisfy'];
          const negativeWords = ['bad','sad','hate','terrible','worst','broken','fail','error','issue','bug','poor','worse','awful','annoy','frustrate'];
          
          const matchedPos = positiveWords.filter(w => query.includes(w));
          const matchedNeg = negativeWords.filter(w => query.includes(w));
          
          const pos = matchedPos.length >= matchedNeg.length;
          const confidence = Math.round(75 + Math.random() * 23);
          
          content = `[Local Simulation — ${modelName}]\n\n### 📊 Sentiment Analysis Report\n* **Classification**: **${pos ? 'POSITIVE' : 'NEGATIVE'}**\n* **Confidence Score**: \`${confidence}.0%\`\n* **Analyzed Metrics**:\n  - Primary Emotion: ${pos ? 'Satisfaction / Approval' : 'Frustration / Concern'}\n  - Keywords Detected: ${[...matchedPos, ...matchedNeg].join(', ') || 'neutral context'}\n  - Inference Latency: \`12ms\``;
        } 
        else if (query.includes('explain') && (query.includes('code') || query.includes('function') || query.includes('class') || query.includes('const') || query.includes('def') || query.includes('var') || query.includes('let'))) {
          content = `[Local Simulation — ${modelName}]\n\n### 💻 Senior Developer Code Analysis\nHere is a breakdown of the code structure and potential improvements:\n\n1. **Functional Intent**:\n   - This code snippet implements a component-level modular pattern managing state orchestration, execution parameters, and fallback rendering pipelines.\n\n2. **Architecture & Design**:\n   - **State Isolation**: Utilizes localized state streams to decouple rendering cycles from heavy network payloads.\n   - **Memoization**: Implements virtual updates for sub-nodes to minimize expensive DOM refreshes.\n\n3. **Potential Enhancements & Issues**:\n   - **Resource Cleanup**: Ensure all event listeners and background tickers are properly unsubscribed inside cleanup hooks to prevent memory leaks.\n   - **Performance Optimization**: Consider lazy-loading non-critical subcomponents to accelerate initial paint times.`;
        }
        else if (query.includes('write') || query.includes('create') || query.includes('code') || query.includes('function') || query.includes('how to')) {
          content = `[Local Simulation — ${modelName}]\n\n### 🛠️ Generated Code Snippet\nHere is a clean, optimized implementation that meets your request:\n\n\`\`\`javascript\n// Optimized pipeline handler with integrated error boundaries\nasync function executePipeline(tasks, options = {}) {\n  const results = [];\n  const limit = options.concurrencyLimit || 3;\n  \n  for (let i = 0; i < tasks.length; i += limit) {\n    const batch = tasks.slice(i, i + limit);\n    const batchResults = await Promise.all(\n      batch.map(task => task().catch(err => ({ error: err.message })))\n    );\n    results.push(...batchResults);\n  }\n  return results;\n}\n\`\`\`\n\n**Key Features**:\n* **Concurrency Control**: Prevents execution overload by throttling tasks.\n* **Error Isolation**: Catches failures at the task level, allowing the rest of the batch to run.`;
        }
        else if (query.includes('hello') || query.includes('hi') || query.includes('greet') || query.includes('hey')) {
          content = `[Local Simulation — ${modelName}]\n\nHello! I am ${modelName}, a custom-tailored AI model trained on your training hub datasets. I can perform instruction following, text generation, code explanation, and analysis. Feel free to type in any prompt or coding challenge!`;
        }
        else {
          content = `[Local Simulation — ${modelName}]\n\n### 📝 Model Inference Response\nThank you for your message! Your UI integration is fully functional and optimized.\n\n* **Model Context**: Deployed and simulated locally.\n* **Input Length**: ${currentInput.length} characters.\n* **Status**: Ready for production fine-tuning and deployment.`;
        }
        
        streamMessage(content);
      }, 600);
      return;
    }

    try {
      const response = await api.post('/inference/chat', { model_id: selectedModel?.id || 1, message: currentInput });
      streamMessage(response.data.response);
    } catch {
      streamMessage('Sorry, I encountered an error. Make sure your model has been trained successfully and your API keys are configured correctly.');
    }
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeLines: string[] = [];
    
    return lines.map((line, idx) => {
      // Code block toggle
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const codeText = codeLines.join('\n');
          codeLines = [];
          return (
            <pre key={idx} className="bg-black/20 dark:bg-black/40 p-4 rounded-xl font-mono text-xs my-2 overflow-x-auto border"
              style={{ borderColor: 'var(--md-outline-var)', color: 'var(--md-on-surface)' }}>
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
      
      // Subtitle
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-bold mt-3 mb-1" style={{ color: 'var(--md-primary)' }}>{line.slice(4)}</h4>;
      }
      
      // Bullet point
      if (line.startsWith('* ')) {
        const parts = line.slice(2).split('**');
        return (
          <li key={idx} className="list-none pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-purple-500 my-0.5">
            {parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="font-semibold">{p}</strong> : p)}
          </li>
        );
      }
      
      // Numbered list
      if (/^\d+\.\s/.test(line)) {
        const numIndex = line.indexOf('. ') + 2;
        const parts = line.slice(numIndex).split('**');
        return (
          <div key={idx} className="pl-4 my-1">
            <span className="font-semibold text-purple-500 mr-1.5">{line.split('. ')[0]}.</span>
            {parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="font-semibold">{p}</strong> : p)}
          </div>
        );
      }
      
      // Regular line
      if (!line.trim()) return <div key={idx} className="h-2" />;
      
      const parts = line.split('**');
      return (
        <p key={idx} className="my-0.5">
          {parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="font-semibold">{p}</strong> : p)}
        </p>
      );
    }).filter(el => el !== null);
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
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)' }}>
                <ArrowLeftRight className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />
                Model Arena
              </button>
            </Link>

            {/* Model selector */}
            <div onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl cursor-pointer transition-all select-none border"
              style={{ background: 'var(--md-surface-1)', borderColor: 'var(--md-outline)', color: 'var(--md-on-surface)' }}>
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
                        setMessages([{ id: Date.now(), role: 'assistant', content: getWelcomeMessage(model) }]);
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col gap-0.5 cursor-pointer hover:bg-purple-500/10"
                      style={{
                        background: (selectedModel?.id === model.id && selectedModel?.local === model.local) ? 'var(--md-primary-container)' : 'transparent',
                        color: (selectedModel?.id === model.id && selectedModel?.local === model.local) ? 'var(--md-on-primary-cont)' : 'var(--md-on-surface-var)',
                      }}>
                      <span className="truncate text-sm flex items-center justify-between w-full">
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

            {/* Settings button */}
            <button className="w-10 h-10 rounded-xl flex items-center justify-center transition-all border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
              style={{ background: 'var(--md-surface-1)', borderColor: 'var(--md-outline)', color: 'var(--md-on-surface-var)' }}>
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat container */}
        <div className="flex-1 rounded-3xl flex flex-col overflow-hidden"
          style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-2)' }}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-3 max-w-[80%]', msg.role === 'user' ? 'ml-auto flex-row-reverse' : '')}>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border')}
                  style={{ background: msg.role === 'assistant' ? 'var(--md-primary)' : 'var(--md-surface-2)', borderColor: 'var(--md-outline)' }}>
                  {msg.role === 'assistant'
                    ? <Bot className="w-5 h-5" style={{ color: 'var(--md-on-primary)' }} />
                    : <User className="w-5 h-5" style={{ color: 'var(--md-on-surface-var)' }} />}
                </div>
                <div className="p-4 rounded-2xl text-sm leading-relaxed"
                  style={msg.role === 'assistant'
                    ? { background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)' }
                    : { background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
                  {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center border" style={{ background: 'var(--md-primary)', borderColor: 'var(--md-outline)' }}>
                  <Bot className="w-5 h-5" style={{ color: 'var(--md-on-primary)' }} />
                </div>
                <div className="p-4 rounded-2xl flex gap-1.5 items-center border"
                  style={{ background: 'var(--md-surface-2)', borderColor: 'var(--md-outline)' }}>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <span key={i} className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: 'var(--md-on-surface-var)', animationDelay: `${d}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
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
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer"
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
