"use client";

import React, { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ThemeSelector() {
  const [activeTheme, setActiveTheme] = useState<string>('obsidian');

  useEffect(() => {
    const savedTheme = localStorage.getItem('nemix_theme') || 'obsidian';
    setActiveTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeName: string) => {
    const root = document.documentElement;
    root.classList.remove('theme-cyberpunk', 'theme-emerald');
    if (themeName === 'cyberpunk') {
      root.classList.add('theme-cyberpunk');
    } else if (themeName === 'emerald') {
      root.classList.add('theme-emerald');
    }
  };

  const selectTheme = (themeName: string) => {
    setActiveTheme(themeName);
    localStorage.setItem('nemix_theme', themeName);
    applyTheme(themeName);
  };

  const themes = [
    { id: 'obsidian', name: 'Obsidian', color: 'bg-neutral-800 border-neutral-600', dot: 'bg-purple-500' },
    { id: 'cyberpunk', name: 'Neon', color: 'bg-fuchsia-950 border-fuchsia-700', dot: 'bg-fuchsia-500' },
    { id: 'emerald', name: 'Aurora', color: 'bg-emerald-950 border-emerald-700', dot: 'bg-emerald-500' },
  ];

  return (
    <div className="px-4 py-3 border-t border-white/5 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-widest px-2">
        <Palette className="w-3.5 h-3.5 text-gray-500" />
        <span>Aesthetic Theme</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white/[0.02] border border-white/5">
        {themes.map((theme) => {
          const isActive = activeTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => selectTheme(theme.id)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1.5 rounded-lg border text-[11px] font-medium transition-all active:scale-95 cursor-pointer",
                isActive
                  ? "bg-white/10 text-white border-white/10 shadow-sm"
                  : "bg-transparent text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/[0.02]"
              )}
            >
              <div className="w-3.5 h-3.5 rounded-full mb-1 flex items-center justify-center border border-white/10 shadow-[0_0_8px_rgba(255,255,255,0.05)] bg-black/40">
                <div className={cn("w-2 h-2 rounded-full", theme.dot)} />
              </div>
              <span>{theme.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
