"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Database, 
  Hash, 
  TrendingDown, 
  GitMerge, 
  Terminal, 
  Flame, 
  FastForward, 
  CheckCircle2, 
  ArrowLeft,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LogLine {
  timestamp: string;
  module: 'DATA' | 'TOKEN' | 'TRAIN' | 'MERGE' | 'SYS';
  text: string;
  type: 'info' | 'success' | 'warn' | 'debug';
}

export default function TrainingVisualizer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1); // 1x, 2x, 4x
  const [activeStep, setActiveStep] = useState<number>(-1); // -1: idle, 0: Data, 1: Tokenizer, 2: Training, 3: Merging, 4: Done
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<LogLine[]>([
    { timestamp: '12:00:00', module: 'SYS', text: 'Visualizer initialized. Ready for training pipeline simulation.', type: 'info' }
  ]);
  const [epochCount, setEpochCount] = useState<number>(1);
  const [currentLoss, setCurrentLoss] = useState<number>(0.95);
  const [currentAcc, setCurrentAcc] = useState<number>(0.42);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const stepTimerRef = useRef<any>(null);
  const logTimerRef = useRef<any>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      if (logTimerRef.current) clearInterval(logTimerRef.current);
    };
  }, []);

  const addLog = (module: LogLine['module'], text: string, type: LogLine['type'] = 'info') => {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    setLogs(prev => [...prev, { timestamp, module, text, type }]);
  };

  const startSimulation = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    addLog('SYS', `Starting training pipeline simulation at speed ${speed}x...`, 'info');
    
    let currentStage = activeStep === -1 || activeStep === 4 ? 0 : activeStep;
    setActiveStep(currentStage);
    runStage(currentStage);
  };

  const pauseSimulation = () => {
    setIsPlaying(false);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (logTimerRef.current) clearInterval(logTimerRef.current);
    addLog('SYS', 'Simulation paused by user.', 'warn');
  };

  const resetSimulation = () => {
    setIsPlaying(false);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (logTimerRef.current) clearInterval(logTimerRef.current);
    setActiveStep(-1);
    setProgress(0);
    setEpochCount(1);
    setCurrentLoss(0.95);
    setCurrentAcc(0.42);
    setLogs([
      { timestamp: new Date().toTimeString().split(' ')[0], module: 'SYS', text: 'Visualizer reset. Pipelines cleared.', type: 'info' }
    ]);
  };

  const runStage = (stage: number) => {
    setActiveStep(stage);
    if (stage === 0) {
      // 1. DATA PROCESSING STAGE
      addLog('DATA', 'Initiating dataset loader for "sentiment_alpaca_dataset.json"...', 'info');
      
      let percent = 0;
      const intervalTime = 800 / speed;
      
      logTimerRef.current = setInterval(() => {
        percent += 20;
        setProgress(percent);
        if (percent === 20) addLog('DATA', 'Scanning file system records & validating JSON syntax structure...', 'debug');
        if (percent === 60) addLog('DATA', 'Cleaning input tokens: Removed 12 empty prompt objects.', 'success');
        if (percent === 80) addLog('DATA', 'Shuffling 8,500 validated instruction pairs...', 'debug');
        
        if (percent >= 100) {
          clearInterval(logTimerRef.current);
          addLog('DATA', 'Dataset processing complete! Transferred 8,488 records to active vocabulary parser.', 'success');
          
          stepTimerRef.current = setTimeout(() => {
            runStage(1);
          }, 600 / speed);
        }
      }, intervalTime);
    } 
    else if (stage === 1) {
      // 2. TOKENIZATION STAGE
      addLog('TOKEN', 'Initializing Byte-Pair Encoding (BPE) vocab tokenizer...', 'info');
      setProgress(0);
      
      let percent = 0;
      const intervalTime = 700 / speed;

      logTimerRef.current = setInterval(() => {
        percent += 25;
        setProgress(percent);
        if (percent === 25) addLog('TOKEN', 'Loading pre-compiled BPE dictionary containing 32,000 merge rules...', 'debug');
        if (percent === 50) addLog('TOKEN', 'Formatting tokens into tensor matrix dimensions [Batch: 8, SeqLen: 512]...', 'debug');
        if (percent === 75) addLog('TOKEN', 'Applying truncation padding & calculating initial attention masks...', 'debug');

        if (percent >= 100) {
          clearInterval(logTimerRef.current);
          addLog('TOKEN', 'Tokenizer compilation complete. Vectorized tensors generated successfully.', 'success');
          
          stepTimerRef.current = setTimeout(() => {
            runStage(2);
          }, 600 / speed);
        }
      }, intervalTime);
    }
    else if (stage === 2) {
      // 3. GRADIENT DESCENT (TRAINING) STAGE
      addLog('TRAIN', 'Mounting training model onto GPU CUDA-0 device...', 'info');
      addLog('TRAIN', 'Applying LoRA parameters (Rank: 8, Alpha: 16, Target Modules: q_proj, v_proj)...', 'debug');
      setProgress(0);
      
      let step = 0;
      let totalSteps = 10;
      const intervalTime = 600 / speed;

      logTimerRef.current = setInterval(() => {
        step += 1;
        const trainProgress = Math.round((step / totalSteps) * 100);
        setProgress(trainProgress);

        // Adjust validation loss and accuracy
        const calculatedLoss = Math.max(0.08, 0.95 - (step * 0.08) - (Math.random() * 0.03));
        const calculatedAcc = Math.min(0.98, 0.42 + (step * 0.05) + (Math.random() * 0.02));
        
        setCurrentLoss(parseFloat(calculatedLoss.toFixed(3)));
        setCurrentAcc(parseFloat(calculatedAcc.toFixed(3)));

        if (step % 2 === 0) {
          addLog('TRAIN', `Epoch 1/1 | Step ${step * 100}/${totalSteps * 100} | Loss: ${calculatedLoss.toFixed(4)} | Accuracy: ${calculatedAcc.toFixed(4)}`, 'info');
        }

        if (step >= totalSteps) {
          clearInterval(logTimerRef.current);
          addLog('TRAIN', 'Gradient Descent optimization converged successfully. Target weights calculated.', 'success');
          
          stepTimerRef.current = setTimeout(() => {
            runStage(3);
          }, 600 / speed);
        }
      }, intervalTime);
    }
    else if (stage === 3) {
      // 4. WEIGHT MERGING STAGE
      addLog('MERGE', 'Compressing adapter weights & preparing foundation merge...', 'info');
      setProgress(0);
      
      let percent = 0;
      const intervalTime = 600 / speed;

      logTimerRef.current = setInterval(() => {
        percent += 20;
        setProgress(percent);
        if (percent === 20) addLog('MERGE', 'Reading primary base foundation model weights...', 'debug');
        if (percent === 60) addLog('MERGE', 'Injecting LoRA rank coefficients and calculating dot-product offsets...', 'debug');
        if (percent === 80) addLog('MERGE', 'Writing consolidated 16-bit float tensor binaries to storage disk...', 'debug');

        if (percent >= 100) {
          clearInterval(logTimerRef.current);
          addLog('MERGE', 'Weights consolidated! Merged checkpoint saved to local model directory.', 'success');
          
          stepTimerRef.current = setTimeout(() => {
            setActiveStep(4);
            setIsPlaying(false);
            setProgress(100);
            addLog('SYS', 'FINE-TUNING PIPELINE SIMULATION COMPLETED SUCCESSFULLY!', 'success');
          }, 600 / speed);
        }
      }, intervalTime);
    }
  };

  const getSpeedLabel = () => {
    return `${speed}x`;
  };

  const cycleSpeed = () => {
    const nextSpeed = speed === 1 ? 2 : speed === 2 ? 4 : 1;
    setSpeed(nextSpeed);
    addLog('SYS', `Simulation speed multiplier updated to ${nextSpeed}x.`, 'info');
  };

  const stages = [
    { title: 'Data Processing', icon: Database, desc: 'Syntax checks & sanitization' },
    { title: 'Tokenization', icon: Hash, desc: 'Encoding text to subwords' },
    { title: 'Gradient Descent', icon: TrendingDown, desc: 'LoRA weight optimizations' },
    { title: 'Weight Merging', icon: GitMerge, desc: 'Consolidating parameters' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/training">
              <div className="p-2 rounded-xl border transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                style={{ background: 'var(--md-surface-1)', borderColor: 'var(--md-outline)', color: 'var(--md-on-surface-var)' }}>
                <ArrowLeft className="w-5 h-5" />
              </div>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2" style={{ color: 'var(--md-on-surface)' }}>
                <Flame className="w-7 h-7 text-purple-400 animate-pulse animate-duration-1000" />
                Fine-Tuning Visualizer
              </h1>
              <p className="text-sm" style={{ color: 'var(--md-on-surface-var)' }}>Interactive live pipeline tracking weights optimization and tokens flow.</p>
            </div>
          </div>

          {/* Quick Simulation controls */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl border backdrop-blur-md"
            style={{ background: 'var(--md-surface-2)', borderColor: 'var(--md-outline)' }}>
            {isPlaying ? (
              <button 
                onClick={pauseSimulation} 
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ background: 'var(--md-surface-1)', borderColor: 'var(--md-outline)', color: 'var(--md-on-surface)' }}
              >
                <Pause className="w-3.5 h-3.5 text-amber-500" />
                Pause
              </button>
            ) : (
              <button 
                onClick={startSimulation} 
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ background: 'var(--md-surface-1)', borderColor: 'var(--md-outline)', color: 'var(--md-on-surface)' }}
              >
                <Play className="w-3.5 h-3.5 text-emerald-500" />
                {activeStep === 4 ? "Restart" : "Start"}
              </button>
            )}

            <button 
              onClick={cycleSpeed} 
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border text-xs font-mono font-semibold cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ background: 'var(--md-surface-1)', borderColor: 'var(--md-outline)', color: 'var(--md-on-surface)' }}
            >
              <FastForward className="w-3.5 h-3.5 text-blue-500" />
              {getSpeedLabel()}
            </button>

            <button 
              onClick={resetSimulation} 
              className="flex items-center py-1.5 px-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ background: 'var(--md-surface-1)', borderColor: 'var(--md-outline)', color: 'var(--md-on-surface)' }}
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            </button>
          </div>
        </div>

        {/* Core Canvas Interactive Section */}
        <div className="rounded-3xl border p-8 relative overflow-hidden backdrop-blur-xl min-h-[380px] flex flex-col justify-center transition-all"
          style={{ background: 'var(--md-surface-1)', borderColor: 'var(--md-outline)', boxShadow: 'var(--shadow-2)' }}>
          {/* Animated grid-bg pattern */}
          <div className="absolute inset-0 grid-bg opacity-[0.07] dark:opacity-[0.15] pointer-events-none" />

          {/* SVG Pipeline Lines Container */}
          <div className="absolute inset-0 w-full h-full pointer-events-none hidden md:block">
            <svg className="w-full h-full">
              {/* Pipe 1 -> 2 */}
              <path 
                d="M 190 190 L 370 190" 
                stroke="var(--md-outline)" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeOpacity="0.4"
              />
              {isPlaying && activeStep === 0 && (
                <path 
                  d="M 190 190 L 370 190" 
                  stroke="url(#dataStreamGradient)" 
                  strokeWidth="4.5" 
                  strokeLinecap="round" 
                  strokeDasharray="8 8"
                  className="animate-[dash_8s_linear_infinite]"
                  style={{ animationDuration: `${3 / speed}s` }}
                />
              )}

              {/* Pipe 2 -> 3 */}
              <path 
                d="M 450 190 L 630 190" 
                stroke="var(--md-outline)" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeOpacity="0.4"
              />
              {isPlaying && activeStep === 1 && (
                <path 
                  d="M 450 190 L 630 190" 
                  stroke="url(#tokenStreamGradient)" 
                  strokeWidth="4.5" 
                  strokeLinecap="round" 
                  strokeDasharray="8 8"
                  className="animate-[dash_8s_linear_infinite]"
                  style={{ animationDuration: `${3 / speed}s` }}
                />
              )}

              {/* Pipe 3 -> 4 */}
              <path 
                d="M 710 190 L 890 190" 
                stroke="var(--md-outline)" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeOpacity="0.4"
              />
              {isPlaying && activeStep === 2 && (
                <path 
                  d="M 710 190 L 890 190" 
                  stroke="url(#trainStreamGradient)" 
                  strokeWidth="4.5" 
                  strokeLinecap="round" 
                  strokeDasharray="8 8"
                  className="animate-[dash_8s_linear_infinite]"
                  style={{ animationDuration: `${3 / speed}s` }}
                />
              )}

              {/* Defs containing pipe colors */}
              <defs>
                <linearGradient id="dataStreamGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
                <linearGradient id="tokenStreamGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <linearGradient id="trainStreamGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Node Cards flex container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 z-10 relative">
            {stages.map((stage, i) => {
              const isCurrent = activeStep === i;
              const isDone = activeStep > i || activeStep === 4;
              
              return (
                <div 
                  key={i} 
                  className={cn(
                    "p-6 rounded-3xl border text-center transition-all duration-300 flex flex-col justify-between min-h-[220px]",
                    isCurrent ? "scale-105" : "opacity-75"
                  )}
                  style={{
                    background: isCurrent
                      ? 'var(--md-surface-1)'
                      : isDone
                      ? 'var(--md-surface-1)'
                      : 'var(--md-surface-2)',
                    borderColor: isCurrent
                      ? 'var(--md-primary)'
                      : isDone
                      ? 'var(--md-success)'
                      : 'var(--md-outline-var)',
                    boxShadow: isCurrent ? '0 0 25px var(--md-primary-container)' : 'none',
                  }}
                >
                  <div className="flex flex-col items-center">
                    {/* Glowing active pulse circle */}
                    <div className="relative mb-4">
                      {isCurrent && (
                        <span className="absolute -inset-2 rounded-full bg-purple-500/20 animate-ping" />
                      )}
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors"
                        style={{
                          background: isCurrent 
                            ? 'var(--md-primary-container)' 
                            : isDone 
                            ? 'var(--md-success-cont)' 
                            : 'var(--md-surface-3)',
                          borderColor: isCurrent 
                            ? 'var(--md-primary)' 
                            : isDone 
                            ? 'var(--md-success)' 
                            : 'var(--md-outline)',
                          color: isCurrent 
                            ? 'var(--md-primary)' 
                            : isDone 
                            ? 'var(--md-success)' 
                            : 'var(--md-on-surface-var)',
                        }}>
                        {isDone ? <CheckCircle2 className="w-6 h-6" /> : <stage.icon className="w-6 h-6" />}
                      </div>
                    </div>

                    <h3 className="font-semibold text-sm tracking-tight" style={{ color: 'var(--md-on-surface)' }}>{stage.title}</h3>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--md-on-surface-var)' }}>{stage.desc}</p>
                  </div>

                  {/* Progress Indicator inside nodes */}
                  <div className="mt-6 space-y-2">
                    {isCurrent ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-mono px-1" style={{ color: 'var(--md-primary)' }}>
                          <span>STAGE PROGRESS</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--md-surface-3)' }}>
                          <motion.div 
                            className="h-full rounded-full"
                            style={{ width: `${progress}%`, background: 'var(--md-primary)' }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                      </div>
                    ) : isDone ? (
                      <span className="inline-block text-[9px] uppercase tracking-wider font-mono px-2.5 py-1 rounded-full font-semibold border"
                        style={{ background: 'var(--md-success-cont)', color: 'var(--md-success)', borderColor: 'var(--md-success)' }}>
                        COMPLETED
                      </span>
                    ) : (
                      <span className="inline-block text-[9px] uppercase tracking-wider font-mono px-2.5 py-1 rounded-full border"
                        style={{ background: 'var(--md-surface-3)', color: 'var(--md-on-surface-var)', borderColor: 'var(--md-outline-var)' }}>
                        IDLE
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SVG Pipeline Animation Styles */}
          <style jsx global>{`
            @keyframes dash {
              to {
                stroke-dashoffset: -160;
              }
            }
          `}</style>
        </div>

        {/* Live Metrics Overlay & Logs Window */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real-time Loss/Accuracy Graph Overlay (Updated dynamically!) */}
          <div className="rounded-3xl border p-6 space-y-6 flex flex-col justify-between transition-all"
            style={{ background: 'var(--md-surface-1)', borderColor: 'var(--md-outline)', boxShadow: 'var(--shadow-1)' }}>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--md-on-surface-var)' }}>
                <Settings className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />
                Simulation Metrics
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--md-on-surface-var)' }}>Live metrics calculated during optimization stage.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Training Loss */}
              <div className="p-4 rounded-2xl border" style={{ background: 'var(--md-surface-2)', borderColor: 'var(--md-outline-var)' }}>
                <span className="text-[10px] font-mono block" style={{ color: 'var(--md-on-surface-var)' }}>VAL LOSS</span>
                <span className="text-2xl font-bold font-mono mt-1 block" style={{ color: 'var(--md-primary)' }}>
                  {activeStep === 2 || activeStep === 3 || activeStep === 4 ? currentLoss.toFixed(3) : "—"}
                </span>
              </div>

              {/* Accuracy */}
              <div className="p-4 rounded-2xl border" style={{ background: 'var(--md-surface-2)', borderColor: 'var(--md-outline-var)' }}>
                <span className="text-[10px] font-mono block" style={{ color: 'var(--md-on-surface-var)' }}>ACCURACY</span>
                <span className="text-2xl font-bold font-mono mt-1 block" style={{ color: 'var(--md-success)' }}>
                  {activeStep === 2 || activeStep === 3 || activeStep === 4 ? `${(currentAcc * 100).toFixed(1)}%` : "—"}
                </span>
              </div>
            </div>

            <div className="text-[10px] font-mono uppercase tracking-wider text-center pt-2" style={{ color: 'var(--md-on-surface-var)' }}>
              Optimizer: AdamW (lr: 2e-5, weight_decay: 0.01)
            </div>
          </div>

          {/* Real-Time Terminal Log Stream */}
          <div className="lg:col-span-2 rounded-3xl border p-6 flex flex-col h-[280px] transition-all"
            style={{ background: 'var(--md-surface-1)', borderColor: 'var(--md-outline)', boxShadow: 'var(--shadow-1)' }}>
            <div className="flex justify-between items-center border-b pb-3 mb-3" style={{ borderColor: 'var(--md-outline-var)' }}>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" style={{ color: 'var(--md-on-surface-var)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--md-on-surface)' }}>Live Console Execution Stream</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse animate-duration-1000" />
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 scrollbar-none pr-2 p-4 rounded-2xl border"
              style={{ background: 'var(--md-surface-2)', borderColor: 'var(--md-outline-var)' }}>
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span className="select-none shrink-0" style={{ color: 'var(--md-on-surface-var)', opacity: 0.6 }}>{log.timestamp}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 uppercase select-none",
                    log.module === 'DATA' ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                    log.module === 'TOKEN' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                    log.module === 'TRAIN' ? "bg-purple-500/10 text-purple-500 border border-purple-500/20" :
                    log.module === 'MERGE' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : 
                    "bg-neutral-500/10 text-neutral-500 border border-neutral-500/20"
                  )}>
                    {log.module}
                  </span>
                  <span className={cn(
                    "flex-1",
                    log.type === 'success' ? "text-emerald-500" :
                    log.type === 'warn' ? "text-amber-500" :
                    log.type === 'debug' ? "text-blue-500" : ""
                  )}
                    style={{ color: log.type === 'info' ? 'var(--md-on-surface)' : undefined }}>
                    {log.text}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
