"use client";

import React from 'react';
import { motion } from 'framer-motion';

// ─── Floating Code Panel Component ──────────────────────────────────────────
const FloatingCodePanel = ({ className = '', delay = 0, x = 0, y = 0, title = 'MODEL_CONFIG' }) => (
  <motion.div
    className={`absolute bg-white/80 dark:bg-slate-950/80 border border-violet-500/20 dark:border-violet-500/20 rounded-xl p-3.5 backdrop-blur-md shadow-2xl select-none pointer-events-none font-mono text-[10px] text-violet-600 dark:text-violet-300 w-44 z-20 ${className}`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{
      opacity: [0.85, 0.95, 0.85],
      scale: 1,
      x: [x, x + 5, x - 5, x],
      y: [y, y - 8, y + 8, y],
    }}
    transition={{
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  >
    <div className="flex items-center gap-1.5 border-b border-gray-200 dark:border-white/5 pb-1.5 mb-2 text-gray-400 dark:text-gray-500 font-bold text-[8px]">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      <span className="ml-1 uppercase tracking-wider">{title}</span>
    </div>
    <div className="space-y-1 text-gray-600 dark:text-gray-400">
      <p><span className="text-pink-600 dark:text-pink-400 font-semibold">const</span> <span className="text-violet-600 dark:text-violet-400">model</span> = <span className="text-blue-600 dark:text-blue-400">Nemix</span>();</p>
      <p><span className="text-violet-600 dark:text-violet-400">model</span>.<span className="text-yellow-600 dark:text-yellow-400">train</span>({'{'}</p>
      <p className="pl-3">epochs: <span className="text-amber-600 dark:text-amber-400">150</span>,</p>
      <p className="pl-3">lr: <span className="text-amber-600 dark:text-amber-400">1e-4</span>,</p>
      <p className="pl-3">loss: <span className="text-emerald-600 dark:text-emerald-400">"LoRA"</span></p>
      <p>{'}'});</p>
    </div>
  </motion.div>
);

// ─── Floating Loss Graph Panel Component ─────────────────────────────────────
const FloatingGraphPanel = ({ className = '', delay = 0, x = 0, y = 0 }) => (
  <motion.div
    className={`absolute bg-white/80 dark:bg-slate-950/80 border border-fuchsia-500/20 dark:border-fuchsia-500/20 rounded-xl p-3.5 backdrop-blur-md shadow-2xl select-none pointer-events-none w-44 z-20 ${className}`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{
      opacity: [0.85, 0.95, 0.85],
      scale: 1,
      x: [x, x - 6, x + 6, x],
      y: [y, y + 8, y - 8, y],
    }}
    transition={{
      duration: 7,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  >
    <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/5 pb-1.5 mb-2 text-gray-400 dark:text-gray-500 font-mono font-bold text-[8px] uppercase tracking-wider">
      <span>LOSS_GRADIENT</span>
      <span className="text-emerald-600 dark:text-emerald-400 animate-pulse">● LIVE</span>
    </div>
    
    {/* SVG Graph Curve */}
    <div className="h-16 w-full flex items-end">
      <svg className="w-full h-full" viewBox="0 0 120 50">
        <path
          d="M0,45 Q20,38 35,20 T70,12 T100,5 T120,4"
          fill="none"
          stroke="url(#graphGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Pulsing endpoint */}
        <motion.circle
          cx="120"
          cy="4"
          r="4"
          fill="#3dd68c"
          animate={{ r: [3, 5, 3], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
        <defs>
          <linearGradient id="graphGrad" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#a855f7" />
            <stop offset="0.5" stopColor="#d946ef" />
            <stop offset="1" stopColor="#3dd68c" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div className="flex justify-between text-[8px] font-mono text-gray-500 mt-1">
      <span>LOSS: 0.0124</span>
      <span>STEP: 4.8K</span>
    </div>
  </motion.div>
);

// ─── Floating Synapse Synch Component ────────────────────────────────────────
const FloatingSynapsePanel = ({ className = '', delay = 0, x = 0, y = 0 }) => (
  <motion.div
    className={`absolute bg-white/80 dark:bg-slate-950/80 border border-blue-500/20 dark:border-blue-500/20 rounded-xl p-3 backdrop-blur-md shadow-2xl select-none pointer-events-none w-36 z-20 ${className}`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{
      opacity: [0.85, 0.95, 0.85],
      scale: 1,
      x: [x, x + 4, x - 4, x],
      y: [y, y - 6, y + 6, y],
    }}
    transition={{
      duration: 6.5,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  >
    <div className="border-b border-gray-200 dark:border-white/5 pb-1 mb-2 text-gray-400 dark:text-gray-500 font-mono font-bold text-[8px] uppercase tracking-wider text-center">
      SYNAPSE_MATRIX
    </div>
    <div className="flex items-center justify-center py-1">
      <svg className="w-14 h-14" viewBox="0 0 60 60">
        {/* Core circle */}
        <circle cx="30" cy="30" r="4" fill="#60a5fa" />
        
        {/* Connecting arms */}
        <line x1="30" y1="30" x2="12" y2="12" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="30" y1="30" x2="48" y2="12" stroke="#3b82f6" strokeWidth="1" />
        <line x1="30" y1="30" x2="12" y2="48" stroke="#3b82f6" strokeWidth="1" />
        <line x1="30" y1="30" x2="48" y2="48" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" />

        {/* Orbiting nodes */}
        <motion.circle cx="12" cy="12" r="3.5" fill="#f43f5e" animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 0.2 }} />
        <motion.circle cx="48" cy="12" r="3" fill="#a855f7" animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2.2, delay: 0.5 }} />
        <motion.circle cx="12" cy="48" r="2.5" fill="#3dd68c" animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.8 }} />
        <motion.circle cx="48" cy="48" r="4" fill="#eab308" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2.5, delay: 0 }} />
      </svg>
    </div>
  </motion.div>
);

export default function AnimatedMascot() {
  return (
    <div className="relative w-[340px] h-[360px] flex items-center justify-center select-none">
      
      {/* ── Floating Hologram Panels ────────────────────────────────────── */}
      <FloatingCodePanel className="-top-4 -left-12" delay={0.4} x={0} y={0} title="TRAINING_CONFIG" />
      <FloatingGraphPanel className="top-20 -right-16" delay={1.2} x={0} y={0} />
      <FloatingSynapsePanel className="bottom-8 -left-10" delay={0.8} x={0} y={0} />

      {/* ── Base glowing circular tracks ────────────────────────────────── */}
      <div className="absolute bottom-2 w-[240px] h-[40px] bg-black/60 rounded-full blur-[8px]" />
      
      {/* Platform disc */}
      <div 
        className="absolute bottom-6 w-[210px] h-[24px] bg-gradient-to-t from-violet-950/80 via-violet-800/40 to-violet-500/20 rounded-full border border-violet-500/30 shadow-[0_12px_35px_rgba(139,92,246,0.4)]"
        style={{ transform: 'rotateX(55deg)' }}
      />
      
      {/* Neon Spotlight */}
      <div className="absolute bottom-7 w-[140px] h-[140px] bg-violet-500/20 rounded-full blur-2xl animate-pulse" />

      {/* ── Pure Vector Animated Robot Mascot ────────────────────────────── */}
      <motion.div
        animate={{
          y: [0, -16, 0],
        }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-[200px] h-[250px] relative z-10 flex items-center justify-center drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 200 250"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ROBOT COLLAR / THORAX CONNECTOR */}
          <ellipse cx="100" cy="195" rx="35" ry="10" fill="#2e1b4e" />
          <path d="M78 185 L122 185 L115 205 L85 205 Z" fill="#6d28d9" stroke="#8b5cf6" strokeWidth="2" />
          {/* Glowing thorax power core */}
          <motion.circle 
            cx="100" 
            cy="195" 
            r="4.5" 
            fill="#3dd68c" 
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.2, 0.9] }} 
            transition={{ repeat: Infinity, duration: 2 }}
          />

          {/* HEAD BASE SHAPE (METALLIC CYBORG HELMET) */}
          <rect x="52" y="72" width="96" height="96" rx="42" fill="url(#metallicGrad)" stroke="#a78bfa" strokeWidth="3" />

          {/* CUTE ROBOT EARS (HELMET SIDES) */}
          <rect x="42" y="104" width="10" height="32" rx="4" fill="#4c1d95" stroke="#8b5cf6" strokeWidth="2" />
          <rect x="148" y="104" width="10" height="32" rx="4" fill="#4c1d95" stroke="#8b5cf6" strokeWidth="2" />

          {/* VISOR FACEPLATE (GLASSMORPHIC BLUE FACEPLATE) */}
          <rect x="62" y="86" width="76" height="66" rx="20" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

          {/* Visor internal cyan neon glow grid */}
          <rect x="66" y="90" width="68" height="58" rx="16" fill="#020617" opacity="0.9" />

          {/* Visor high-tech telemetry bars */}
          <line x1="72" y1="96" x2="84" y2="96" stroke="#ec4899" strokeWidth="1.5" opacity="0.6" />
          <line x1="116" y1="96" x2="128" y2="96" stroke="#3b82f6" strokeWidth="1.5" opacity="0.6" />

          {/* VISOR EYES (BLINKING & SMILING LED CYAN DOTS) */}
          {/* Left Eye */}
          <motion.ellipse
            cx="84"
            cy="116"
            rx="7"
            ry="6"
            fill="#22d3ee"
            animate={{
              scaleY: [1, 1, 0.1, 1, 1],
              ry: [6, 6, 1, 6, 6]
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              repeatDelay: 2
            }}
            style={{ transformOrigin: '84px 116px' }}
          />
          {/* Left Eye Pupil reflection glow */}
          <circle cx="82" cy="113" r="2" fill="#ffffff" opacity="0.8" />

          {/* Right Eye */}
          <motion.ellipse
            cx="116"
            cy="116"
            rx="7"
            ry="6"
            fill="#22d3ee"
            animate={{
              scaleY: [1, 1, 0.1, 1, 1],
              ry: [6, 6, 1, 6, 6]
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              repeatDelay: 2
            }}
            style={{ transformOrigin: '116px 116px' }}
          />
          {/* Right Eye Pupil reflection glow */}
          <circle cx="114" cy="113" r="2" fill="#ffffff" opacity="0.8" />

          {/* VISOR SMILE */}
          <path
            d="M93 134 Q100 140 107 134"
            stroke="#22d3ee"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* HELMET HEADPHONES OVER-EAR BAND */}
          <path
            d="M48 95 C48 40, 152 40, 152 95"
            stroke="url(#headphonesGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Glowing central antenna / head indicator */}
          <circle cx="100" cy="46" r="5" fill="#f43f5e" />
          <motion.circle 
            cx="100" 
            cy="46" 
            r="10" 
            stroke="#f43f5e" 
            strokeWidth="1.5" 
            fill="none" 
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <line x1="100" y1="46" x2="100" y2="56" stroke="#f43f5e" strokeWidth="2.5" />

          {/* Neon side glowing ear plates */}
          <circle cx="47" cy="120" r="9" fill="#1e1b4b" stroke="#d946ef" strokeWidth="2.5" />
          <motion.circle cx="47" cy="120" r="5" fill="#d946ef" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} />

          <circle cx="153" cy="120" r="9" fill="#1e1b4b" stroke="#d946ef" strokeWidth="2.5" />
          <motion.circle cx="153" cy="120" r="5" fill="#d946ef" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} />

          {/* Cheek high-tech hardware micro-details */}
          <rect x="66" y="146" width="6" height="4" rx="1.5" fill="#475569" />
          <rect x="128" y="146" width="6" height="4" rx="1.5" fill="#475569" />

          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="metallicGrad" x1="52" y1="72" x2="148" y2="168" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1e1b4b" />
              <stop offset="0.5" stopColor="#4c1d95" />
              <stop offset="1" stopColor="#2e1b4e" />
            </linearGradient>
            <linearGradient id="headphonesGrad" x1="48" y1="40" x2="152" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#d946ef" />
              <stop offset="0.5" stopColor="#8b5cf6" />
              <stop offset="1" stopColor="#d946ef" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
}
