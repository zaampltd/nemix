"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function DashboardMockup() {
  // Sidebar item helper
  const sidebarItems = [
    { name: 'Overview', active: true },
    { name: 'Datasets', active: false },
    { name: 'Models', active: false },
    { name: 'Training', active: false },
    { name: 'Playground', active: false },
    { name: 'Deployments', active: false },
    { name: 'Analytics', active: false },
    { name: 'Team', active: false }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="w-full max-w-[620px] rounded-2xl bg-white dark:bg-[#111118] border border-gray-200/80 dark:border-white/[0.08] shadow-[0_25px_60px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 z-20 font-sans"
    >
      
      {/* ── Browser Window Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 dark:bg-slate-950/30 border-b border-gray-200/60 dark:border-white/[0.06] select-none">
        {/* Window controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-3 h-3 rounded-full bg-rose-500/90 shadow-sm" />
          <span className="w-3 h-3 rounded-full bg-amber-500/90 shadow-sm" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/90 shadow-sm" />
        </div>
        {/* Address Bar */}
        <div className="flex-1 max-w-[280px] mx-auto h-6 rounded bg-gray-200/50 dark:bg-white/[0.04] text-[10px] text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center px-4 tracking-wide font-mono">
          nemix.ai/dashboard
        </div>
        {/* Spacer for alignment */}
        <div className="w-12 shrink-0" />
      </div>

      {/* ── Dashboard Layout ─────────────────────────────────────────────── */}
      <div className="flex min-h-[340px] md:min-h-[360px] bg-gray-50/30 dark:bg-slate-950/10">
        
        {/* ── Left Sidebar Mockup ────────────────────────────────────────── */}
        <div className="w-[125px] sm:w-[140px] border-r border-gray-200/60 dark:border-white/[0.06] p-3 sm:p-4 flex flex-col justify-between shrink-0 select-none">
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <div
                key={item.name}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all ${
                  item.active
                    ? 'bg-violet-100/80 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 font-bold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {item.name}
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Dashboard content mockup ──────────────────────────────── */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-4">
          
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">
                Dashboard Overview
              </h3>
            </div>

            {/* Grid of stats */}
            <div className="grid grid-cols-2 gap-3.5 select-none">
              
              {/* Models */}
              <div className="p-3 bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.06] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-colors duration-300">
                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Models</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">12</p>
              </div>

              {/* Datasets */}
              <div className="p-3 bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.06] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-colors duration-300">
                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Datasets</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">38</p>
              </div>

              {/* API Calls */}
              <div className="p-3 bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.06] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-colors duration-300">
                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">API Calls</p>
                <p className="text-xl font-bold text-violet-600 dark:text-violet-400">1.2M</p>
              </div>

              {/* GPU Hours */}
              <div className="p-3 bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.06] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-colors duration-300">
                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">GPU hrs</p>
                <p className="text-xl font-bold text-amber-500 dark:text-amber-400">24.8</p>
              </div>

            </div>

            {/* Bottom Chart Card */}
            <div className="p-3.5 bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.06] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-colors duration-300 space-y-2.5">
              <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                <span>Training Loss · llama3-sentiment-v2</span>
              </div>
              
              {/* Smooth Area Gradient Chart */}
              <div className="h-16 w-full relative flex items-end">
                <svg className="w-full h-full" viewBox="0 0 320 60" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Fill area */}
                  <path
                    d="M0,55 Q50,54 100,52 T200,40 T300,10 L320,8 L320,60 L0,60 Z"
                    fill="url(#areaGrad)"
                  />
                  
                  {/* Stroke path */}
                  <motion.path
                    d="M0,55 Q50,54 100,52 T200,40 T300,10 L320,8"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
              </div>
            </div>

          </div>

          {/* Active members overlay */}
          <div className="flex items-center justify-between pt-1 select-none">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">Active now:</span>
              <div className="flex items-center -space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-violet-600 text-white font-black text-[7px] flex items-center justify-center border border-white dark:border-[#111118]">SC</span>
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white font-black text-[7px] flex items-center justify-center border border-white dark:border-[#111118]">JW</span>
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-black text-[7px] flex items-center justify-center border border-white dark:border-[#111118]">AP</span>
              </div>
              <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 3 online
              </span>
            </div>
          </div>

        </div>

      </div>

    </motion.div>
  );
}
