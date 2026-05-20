"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
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
    { title: 'Data Processing', icon: Database, color: 'text-blue-400', desc: 'Syntax checks & sanitization' },
    { title: 'Tokenization', icon: Hash, color: 'text-yellow-400', desc: 'Encoding text to subwords' },
    { title: 'Gradient Descent', icon: TrendingDown, color: 'text-purple-400', desc: 'LoRA weight optimizations' },
    { title: 'Weight Merging', icon: GitMerge, color: 'text-emerald-400', desc: 'Consolidating parameters' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/training">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
              </div>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1 premium-text-glow flex items-center gap-2">
                <Flame className="w-7 h-7 text-purple-400 animate-pulse" />
                Fine-Tuning Visualizer
              </h1>
              <p className="text-gray-400">Interactive live pipeline tracking weights optimization and tokens flow.</p>
            </div>
          </div>

          {/* Quick Simulation controls */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            {isPlaying ? (
              <Button onClick={pauseSimulation} variant="secondary" className="rounded-xl border border-white/5 hover:bg-white/10 gap-1.5 py-1 px-3 text-xs">
                <Pause className="w-3.5 h-3.5 text-yellow-400" />
                Pause
              </Button>
            ) : (
              <Button onClick={startSimulation} variant="secondary" className="rounded-xl border border-white/5 hover:bg-white/10 gap-1.5 py-1 px-3 text-xs">
                <Play className="w-3.5 h-3.5 text-green-400" />
                {activeStep === 4 ? "Restart" : "Start"}
              </Button>
            )}

            <Button onClick={cycleSpeed} variant="secondary" className="rounded-xl border border-white/5 hover:bg-white/10 gap-1.5 py-1 px-3 text-xs font-mono">
              <FastForward className="w-3.5 h-3.5 text-blue-400" />
              {getSpeedLabel()}
            </Button>

            <Button onClick={resetSimulation} variant="secondary" className="rounded-xl border border-white/5 hover:bg-white/10 p-1 px-2.5 text-xs">
              <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            </Button>
          </div>
        </div>

        {/* Core Canvas Interactive Section */}
        <div className="glass rounded-3xl border border-white/5 p-8 relative overflow-hidden bg-[#050505]/40 backdrop-blur-xl min-h-[380px] flex flex-col justify-center">
          {/* Animated Matrix grid-bg pattern */}
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

          {/* SVG Pipeline Lines Container */}
          <div className="absolute inset-0 w-full h-full pointer-events-none hidden md:block">
            <svg className="w-full h-full">
              {/* Pipe 1 -> 2 */}
              <path 
                d="M 190 190 L 370 190" 
                stroke="rgba(255,255,255,0.05)" 
                strokeWidth="4" 
                strokeLinecap="round" 
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
                stroke="rgba(255,255,255,0.05)" 
                strokeWidth="4" 
                strokeLinecap="round" 
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
                stroke="rgba(255,255,255,0.05)" 
                strokeWidth="4" 
                strokeLinecap="round" 
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
                  <stop offset="0%" stopColor="#a855f7" stopColorOpacity="0.8" />
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
                    "glass p-6 rounded-3xl border text-center transition-all duration-300 flex flex-col justify-between min-h-[220px]",
                    isCurrent 
                      ? "border-purple-500 bg-purple-500/5 shadow-[0_0_30px_rgba(168,85,247,0.1)] scale-105" 
                      : isDone 
                      ? "border-emerald-500/30 bg-emerald-500/[0.01]" 
                      : "border-white/5 opacity-60"
                  )}
                >
                  <div className="flex flex-col items-center">
                    {/* Glowing active pulse circle */}
                    <div className="relative mb-4">
                      {isCurrent && (
                        <span className="absolute -inset-2 rounded-full bg-purple-500/20 animate-ping" />
                      )}
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center border",
                        isCurrent 
                          ? "bg-purple-500/20 border-purple-400 text-purple-300"
                          : isDone 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-white/5 border-white/5 text-gray-500"
                      )}>
                        {isDone ? <CheckCircle2 className="w-6 h-6" /> : <stage.icon className="w-6 h-6" />}
                      </div>
                    </div>

                    <h3 className="font-semibold text-sm tracking-tight text-white">{stage.title}</h3>
                    <p className="text-[10px] text-gray-500 mt-1">{stage.desc}</p>
                  </div>

                  {/* Progress Indicator inside nodes */}
                  <div className="mt-6 space-y-2">
                    {isCurrent ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-mono text-purple-400 px-1">
                          <span>STAGE PROGRESS</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${progress}%` }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                      </div>
                    ) : isDone ? (
                      <span className="inline-block text-[9px] uppercase tracking-wider font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        COMPLETED
                      </span>
                    ) : (
                      <span className="inline-block text-[9px] uppercase tracking-wider font-mono text-gray-600 bg-white/[0.02] px-2 py-0.5 rounded-full">
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
          <div className="glass rounded-3xl border border-white/5 p-6 space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-purple-400" />
                Simulation Metrics
              </h3>
              <p className="text-xs text-gray-500 mt-1">Live metrics calculated during optimization stage.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Training Loss */}
              <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                <span className="text-[10px] text-gray-500 font-mono block">VAL LOSS</span>
                <span className="text-2xl font-bold font-mono text-purple-400 mt-1 block">
                  {activeStep === 2 || activeStep === 3 || activeStep === 4 ? currentLoss.toFixed(3) : "—"}
                </span>
              </div>

              {/* Accuracy */}
              <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                <span className="text-[10px] text-gray-500 font-mono block">ACCURACY</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                  {activeStep === 2 || activeStep === 3 || activeStep === 4 ? `${(currentAcc * 100).toFixed(1)}%` : "—"}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-gray-600 font-mono uppercase tracking-wider text-center pt-2">
              Optimizer: AdamW (lr: 2e-5, weight_decay: 0.01)
            </div>
          </div>

          {/* Real-Time Terminal Log Stream */}
          <div className="lg:col-span-2 glass rounded-3xl border border-white/5 p-6 flex flex-col h-[280px]">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-300">Live Console Execution Stream</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 scrollbar-none pr-2 bg-black/40 p-4 rounded-2xl border border-white/5">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span className="text-gray-600 select-none shrink-0">{log.timestamp}</span>
                  <span className={cn(
                    "px-1 py-0.25 rounded-[3px] text-[9px] font-bold shrink-0 uppercase select-none",
                    log.module === 'DATA' ? "bg-blue-500/20 text-blue-400" :
                    log.module === 'TOKEN' ? "bg-yellow-500/20 text-yellow-400" :
                    log.module === 'TRAIN' ? "bg-purple-500/20 text-purple-400" :
                    log.module === 'MERGE' ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-500/20 text-neutral-400"
                  )}>
                    {log.module}
                  </span>
                  <span className={cn(
                    "flex-1",
                    log.type === 'success' ? "text-emerald-400" :
                    log.type === 'warn' ? "text-yellow-400" :
                    log.type === 'debug' ? "text-blue-400" : "text-gray-300"
                  )}>
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
