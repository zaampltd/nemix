"use client";
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { BarChart2, TrendingUp, Activity, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";

const PERIODS = ["7d", "30d", "90d"] as const;
type Period = typeof PERIODS[number];

const DATA: Record<Period, number[]> = {
  "7d":  [12400, 18300, 15600, 22100, 19800, 27400, 31200],
  "30d": [8200, 11400, 9800, 14200, 16800, 13400, 18900, 21200, 17600, 23800, 26400, 24100, 28900, 31200, 27800, 33400, 36200, 34100, 38900, 41200, 37800, 43400, 46200, 44100, 48900, 51200, 47800, 53400, 56200, 54100],
  "90d": Array.from({ length: 90 }, (_, i) => Math.floor(8000 + i * 600 + Math.sin(i * 0.3) * 5000)),
};

const LATENCY_DATA: Record<Period, number[]> = {
  "7d":  [142, 138, 156, 134, 128, 145, 121],
  "30d": Array.from({ length: 30 }, (_, i) => Math.floor(130 + Math.sin(i * 0.5) * 30)),
  "90d": Array.from({ length: 90 }, (_, i) => Math.floor(145 - i * 0.3 + Math.sin(i * 0.4) * 20)),
};

const MODELS_DATA = [
  { name: "llama3-sentiment-v2", calls: 486400, pct: 39, color: "var(--md-primary)" },
  { name: "gpt2-code-assistant", calls: 289200, pct: 23, color: "#a78bfa" },
  { name: "bert-ner-pipeline",   calls: 211800, pct: 17, color: "#34d399" },
  { name: "clip-vision-v1",      calls: 162400, pct: 13, color: "#f59e0b" },
  { name: "Other",               calls: 100000, pct: 8,  color: "var(--md-outline)" },
];

function AreaChart({ data, color = "var(--md-primary)", height = 120 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 560; const h = height;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 8) - 4,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace(/[^a-z]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1="0" y1={h * t} x2={w} y2={h * t}
          stroke="var(--md-outline)" strokeWidth="1" />
      ))}
      <path d={area} fill={`url(#grad-${color.replace(/[^a-z]/gi, '')})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="4" fill={color} />
    </svg>
  );
}

function BarChartComp({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(v / max) * 100}%` }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
            className="w-full rounded-t-lg"
            style={{ background: "var(--md-primary)", opacity: 0.7 + (v / max) * 0.3 }}
          />
          <span className="text-[9px]" style={{ color: "var(--md-on-surface-var)" }}>{labels[i % 7]}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("7d");
  const data = DATA[period];
  const latencyData = LATENCY_DATA[period];
  const totalCalls = data.reduce((a, b) => a + b, 0);
  const prevTotal = Math.floor(totalCalls * 0.84);
  const growth = (((totalCalls - prevTotal) / prevTotal) * 100).toFixed(1);
  const avgLatency = Math.round(latencyData.reduce((a, b) => a + b, 0) / latencyData.length);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--md-on-surface)" }}>Analytics</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--md-on-surface-var)" }}>
              API usage, latency, and model traffic insights.
            </p>
          </div>
          {/* Period selector */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--md-surface-2)" }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: period === p ? "var(--md-primary-container)" : "transparent",
                  color: period === p ? "var(--md-on-primary-cont)" : "var(--md-on-surface-var)",
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total API Calls", value: totalCalls.toLocaleString(), delta: `+${growth}%`, up: true, icon: Activity },
            { label: "Avg Latency", value: `${avgLatency}ms`, delta: "-8ms vs prev", up: true, icon: Clock },
            { label: "Unique Models", value: "5", delta: "+1 this period", up: true, icon: BarChart2 },
            { label: "Error Rate", value: "0.12%", delta: "-0.04% vs prev", up: true, icon: TrendingUp },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-5" style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium" style={{ color: "var(--md-on-surface-var)" }}>{kpi.label}</p>
                <kpi.icon className="w-4 h-4" style={{ color: "var(--md-primary)" }} />
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: "var(--md-on-surface)" }}>{kpi.value}</p>
              <div className="flex items-center gap-1">
                {kpi.up ? <ArrowUpRight className="w-3.5 h-3.5" style={{ color: "var(--md-success)" }} />
                        : <ArrowDownRight className="w-3.5 h-3.5" style={{ color: "var(--md-error)" }} />}
                <span className="text-xs" style={{ color: "var(--md-on-surface-var)" }}>{kpi.delta}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* API calls area chart */}
          <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>API Call Volume</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--md-on-surface-var)" }}>Total requests over selected period</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: "var(--md-primary-container)", color: "var(--md-on-primary-cont)" }}>
                {period}
              </span>
            </div>
            <AreaChart data={data} height={160} />
            <div className="flex justify-between mt-3">
              <span className="text-[10px]" style={{ color: "var(--md-on-surface-var)" }}>Start</span>
              <span className="text-[10px]" style={{ color: "var(--md-on-surface-var)" }}>End</span>
            </div>
          </div>

          {/* Latency chart */}
          <div className="rounded-2xl p-5" style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>Avg Latency</p>
            <p className="text-xs mb-4" style={{ color: "var(--md-on-surface-var)" }}>p50 response time (ms)</p>
            <AreaChart data={latencyData} color="#34d399" height={120} />
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--md-outline)" }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--md-on-surface-var)" }}>Min: {Math.min(...latencyData)}ms</span>
                <span style={{ color: "var(--md-on-surface-var)" }}>Max: {Math.max(...latencyData)}ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily breakdown bar chart */}
          <div className="rounded-2xl p-5" style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>Daily Breakdown</p>
            <p className="text-xs mb-4" style={{ color: "var(--md-on-surface-var)" }}>Requests per day (last 7)</p>
            <BarChartComp data={DATA["7d"]} />
          </div>

          {/* Model traffic */}
          <div className="rounded-2xl p-5" style={{ background: "var(--md-surface-1)", border: "1px solid var(--md-outline)", boxShadow: "var(--shadow-1)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>Traffic by Model</p>
            <p className="text-xs mb-4" style={{ color: "var(--md-on-surface-var)" }}>Share of total API calls</p>
            <div className="space-y-3">
              {MODELS_DATA.map(m => (
                <div key={m.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono truncate max-w-[160px]" style={{ color: "var(--md-on-surface)" }}>{m.name}</span>
                    <span className="text-xs" style={{ color: "var(--md-on-surface-var)" }}>{m.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--md-surface-3)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.pct}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: m.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
