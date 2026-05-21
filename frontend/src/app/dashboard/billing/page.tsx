"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Zap, TrendingUp, AlertCircle, CheckCircle2,
  ArrowUpRight, Download, Clock, Activity, DollarSign,
  BarChart2, Plus, Sparkles, ChevronRight, X
} from 'lucide-react';

// ─── Simulated live usage data ─────────────────────────────
const PLANS = [
  {
    id: 'free', name: 'Free', price: 0, color: 'var(--md-on-surface-var)',
    features: ['1,000 API calls/mo', '1 model', '1 deployment', 'Community support'],
  },
  {
    id: 'pro', name: 'Pro', price: 49, color: 'var(--md-primary)',
    features: ['100K API calls/mo', '10 models', '5 deployments', 'Priority support', 'Custom domains'],
    popular: true,
  },
  {
    id: 'business', name: 'Business', price: 199, color: 'var(--md-success)',
    features: ['5M API calls/mo', 'Unlimited models', 'Unlimited deployments', '24/7 support', 'SLA guarantee', 'Team seats (10)'],
  },
];

const RATE_CARD = [
  { name: 'Inference API calls', unit: 'per 1K calls', rate: 0.001, icon: Zap },
  { name: 'GPU Training time',   unit: 'per GPU-hour',  rate: 0.45,  icon: Activity },
  { name: 'Storage',             unit: 'per GB/month',  rate: 0.023, icon: BarChart2 },
  { name: 'Data transfer',       unit: 'per GB out',    rate: 0.09,  icon: TrendingUp },
];

function generateUsageHistory() {
  const months = ['Nov','Dec','Jan','Feb','Mar','Apr','May'];
  return months.map((m, i) => ({
    month: m,
    calls: Math.floor(Math.random() * 80000 + 10000),
    cost: parseFloat((Math.random() * 40 + 5).toFixed(2)),
    current: i === months.length - 1,
  }));
}

function usagePercent(used: number, limit: number) {
  return Math.min((used / limit) * 100, 100);
}

export default function BillingPage() {
  const [currentPlan] = useState('free');
  const [usageHistory] = useState(generateUsageHistory);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  // Live usage simulation
  const [liveUsage, setLiveUsage] = useState({
    apiCalls:   743,
    apiLimit:   1000,
    gpuHours:   0.8,
    gpuLimit:   5,
    storageGB:  0.23,
    storageLimit: 1,
  });

  useEffect(() => {
    const t = setInterval(() => {
      setLiveUsage(prev => ({
        ...prev,
        apiCalls: Math.min(prev.apiCalls + Math.floor(Math.random() * 3), prev.apiLimit),
      }));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaying(true);
    await new Promise(r => setTimeout(r, 1800));
    setPaying(false);
    setPaySuccess(true);
    setTimeout(() => { setPaySuccess(false); setShowUpgrade(false); }, 2500);
  };

  const currentMonth = usageHistory[usageHistory.length - 1];
  const maxBar = Math.max(...usageHistory.map(h => h.calls));

  const S = {
    card:  { background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-1)' } as React.CSSProperties,
    text:  { color: 'var(--md-on-surface)' } as React.CSSProperties,
    muted: { color: 'var(--md-on-surface-var)' } as React.CSSProperties,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={S.text}>Billing & Usage</h1>
            <p className="text-sm mt-1" style={S.muted}>Pay only for what you use — transparent usage-based pricing.</p>
          </div>
          <button onClick={() => setShowUpgrade(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
            <Sparkles className="w-4 h-4" /> Upgrade Plan
          </button>
        </div>

        {/* Current plan banner */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 flex items-center justify-between gap-4"
          style={{ background: 'var(--md-primary-container)', border: '1px solid var(--md-outline)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--md-primary)' }}>
              <Zap className="w-6 h-6" style={{ color: 'var(--md-on-primary)' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={S.muted}>Current Plan</p>
              <p className="text-2xl font-bold" style={S.text}>Free Tier</p>
              <p className="text-xs mt-0.5" style={S.muted}>Resets on June 1, 2026</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: 'var(--md-primary)' }}>$0</p>
            <p className="text-xs" style={S.muted}>/month</p>
            <button onClick={() => setShowUpgrade(true)}
              className="mt-2 text-xs font-semibold flex items-center gap-1 ml-auto"
              style={{ color: 'var(--md-primary)' }}>
              Upgrade <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Live usage meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'API Calls', used: liveUsage.apiCalls, limit: liveUsage.apiLimit, unit: 'calls', color: 'var(--md-primary)', live: true },
            { label: 'GPU Hours', used: liveUsage.gpuHours, limit: liveUsage.gpuLimit, unit: 'hrs', color: 'var(--md-success)', live: false },
            { label: 'Storage', used: liveUsage.storageGB, limit: liveUsage.storageLimit, unit: 'GB', color: 'var(--md-warning)', live: false },
          ].map(meter => {
            const pct = usagePercent(meter.used, meter.limit);
            const critical = pct > 85;
            return (
              <motion.div key={meter.label} className="rounded-2xl p-5" style={S.card}
                animate={meter.live ? { borderColor: ['var(--md-outline)', 'var(--md-primary)', 'var(--md-outline)'] } : {}}
                transition={{ duration: 3, repeat: Infinity }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium" style={S.muted}>{meter.label}</p>
                  <div className="flex items-center gap-1">
                    {meter.live && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--md-primary)' }} />}
                    {critical && <AlertCircle className="w-4 h-4" style={{ color: 'var(--md-warning)' }} />}
                  </div>
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color: meter.color }}>
                  {typeof meter.used === 'number' && meter.used < 10 ? meter.used.toFixed(2) : meter.used.toLocaleString()}
                  <span className="text-sm font-normal ml-1" style={S.muted}>{meter.unit}</span>
                </p>
                <div className="w-full h-2 rounded-full mb-2" style={{ background: 'var(--md-surface-3)' }}>
                  <motion.div className="h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                    style={{ background: critical ? 'var(--md-error)' : meter.color }} />
                </div>
                <p className="text-[11px]" style={S.muted}>
                  {pct.toFixed(0)}% of {meter.limit} {meter.unit} used
                  {critical && <span className="ml-1" style={{ color: 'var(--md-error)' }}>— Almost full!</span>}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* This month's cost estimate */}
        <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6" style={S.card}>
          <div>
            <p className="text-sm font-medium mb-1" style={S.muted}>Estimated Cost This Month</p>
            <p className="text-4xl font-bold" style={{ color: 'var(--md-primary)' }}>$0.00</p>
            <p className="text-xs mt-1" style={S.muted}>You're on the Free tier — no charges until you upgrade.</p>
          </div>
          <div className="flex flex-col gap-2 min-w-[200px]">
            {[
              { label: 'API calls (743 × $0.001)', value: '$0.00' },
              { label: 'GPU time (0.8 hrs × $0.45)', value: '$0.36' },
              { label: 'Storage (0.23 GB × $0.023)', value: '$0.01' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between text-xs">
                <span style={S.muted}>{row.label}</span>
                <span className="font-semibold" style={S.text}>{row.value}</span>
              </div>
            ))}
            <div className="h-px my-1" style={{ background: 'var(--md-outline)' }} />
            <div className="flex items-center justify-between text-sm font-bold">
              <span style={S.text}>Total (Free tier cap)</span>
              <span style={{ color: 'var(--md-success)' }}>$0.00</span>
            </div>
          </div>
        </div>

        {/* Usage history chart */}
        <div className="rounded-2xl p-6" style={S.card}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold" style={S.text}>API Call History</h2>
              <p className="text-sm" style={S.muted}>Last 7 months</p>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)' }}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="flex items-end gap-3 h-40">
            {usageHistory.map(h => {
              const heightPct = (h.calls / maxBar) * 100;
              return (
                <div key={h.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <p className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: h.current ? 'var(--md-primary)' : 'var(--md-on-surface-var)' }}>
                    {h.calls.toLocaleString()}
                  </p>
                  <div className="w-full rounded-t-lg relative overflow-hidden transition-all"
                    style={{ height: `${Math.max(heightPct, 8)}%`, background: h.current ? 'var(--md-primary)' : 'var(--md-surface-3)' }}>
                    {h.current && (
                      <div className="absolute inset-0 animate-pulse opacity-30" style={{ background: 'var(--md-primary)' }} />
                    )}
                  </div>
                  <p className="text-[10px]" style={{ color: h.current ? 'var(--md-primary)' : 'var(--md-on-surface-var)' }}>
                    {h.month}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rate card */}
        <div className="rounded-2xl p-6" style={S.card}>
          <h2 className="font-semibold mb-4" style={S.text}>Pricing Rate Card</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RATE_CARD.map(item => (
              <div key={item.name} className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline-var)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--md-primary-container)' }}>
                  <item.icon className="w-5 h-5" style={{ color: 'var(--md-on-primary-cont)' }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={S.text}>{item.name}</p>
                  <p className="text-xs" style={S.muted}>{item.unit}</p>
                </div>
                <p className="text-base font-bold" style={{ color: 'var(--md-primary)' }}>${item.rate}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice history */}
        <div className="rounded-2xl overflow-hidden" style={S.card}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--md-outline)' }}>
            <h2 className="font-semibold" style={S.text}>Invoice History</h2>
          </div>
          <div className="p-12 text-center">
            <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--md-outline)' }} />
            <p className="font-medium" style={S.text}>No invoices yet</p>
            <p className="text-sm mt-1" style={S.muted}>Invoices appear here once you upgrade to a paid plan.</p>
          </div>
        </div>
      </div>

      {/* ── Upgrade Modal ─────────────────────────────── */}
      <AnimatePresence>
        {showUpgrade && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-sm" style={{ background: 'var(--md-scrim)' }}
              onClick={() => !paying && setShowUpgrade(false)} />

            <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl rounded-3xl p-8 overflow-y-auto max-h-[90vh]"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)' }}>

              {/* Close */}
              <button onClick={() => setShowUpgrade(false)}
                className="absolute top-5 right-5 p-2 rounded-xl" style={S.muted}>
                <X className="w-5 h-5" />
              </button>

              {paySuccess ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: 'var(--md-success-cont)' }}>
                    <CheckCircle2 className="w-9 h-9" style={{ color: 'var(--md-success)' }} />
                  </div>
                  <h2 className="text-xl font-bold" style={S.text}>Payment Successful!</h2>
                  <p className="text-sm mt-2" style={S.muted}>Your plan has been upgraded. Enjoy the new limits!</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-1" style={S.text}>Choose Your Plan</h2>
                  <p className="text-sm mb-6" style={S.muted}>Upgrade anytime. Cancel anytime. No hidden fees.</p>

                  {/* Plan cards */}
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {PLANS.map(plan => (
                      <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                        className="relative rounded-2xl p-4 text-left transition-all"
                        style={{
                          background: selectedPlan === plan.id ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                          border: `2px solid ${selectedPlan === plan.id ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                        }}>
                        {plan.popular && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
                            POPULAR
                          </span>
                        )}
                        <p className="font-bold text-sm mb-1" style={S.text}>{plan.name}</p>
                        <p className="text-2xl font-black" style={{ color: plan.color }}>
                          ${plan.price}<span className="text-xs font-normal" style={S.muted}>/mo</span>
                        </p>
                        <ul className="mt-3 space-y-1.5">
                          {plan.features.map(f => (
                            <li key={f} className="flex items-start gap-1.5 text-[11px]" style={S.muted}>
                              <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" style={{ color: plan.color }} />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </button>
                    ))}
                  </div>

                  {/* Payment form */}
                  {selectedPlan !== 'free' && (
                    <form onSubmit={handlePay} className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-5 h-5" style={{ color: 'var(--md-primary)' }} />
                        <h3 className="font-semibold" style={S.text}>Payment Details</h3>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--md-success-cont)', color: 'var(--md-success)' }}>
                          🔒 Secure
                        </span>
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={S.muted}>Card Number</label>
                        <input type="text" maxLength={19} placeholder="4242 4242 4242 4242"
                          value={cardNumber}
                          onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                          className="w-full h-11 rounded-xl px-4 text-sm font-mono"
                          style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)', outline: 'none' }} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium mb-1 block" style={S.muted}>Expiry</label>
                          <input type="text" maxLength={5} placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={e => {
                              const v = e.target.value.replace(/\D/g, '');
                              setCardExpiry(v.length >= 2 ? v.slice(0,2) + '/' + v.slice(2) : v);
                            }}
                            className="w-full h-11 rounded-xl px-4 text-sm font-mono"
                            style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)', outline: 'none' }} />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block" style={S.muted}>CVC</label>
                          <input type="text" maxLength={3} placeholder="123"
                            value={cardCVC} onChange={e => setCardCVC(e.target.value.replace(/\D/g, ''))}
                            className="w-full h-11 rounded-xl px-4 text-sm font-mono"
                            style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface)', outline: 'none' }} />
                        </div>
                      </div>
                      <button type="submit" disabled={paying || cardNumber.length < 19}
                        className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
                        {paying ? (
                          <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--md-on-primary)', borderTopColor: 'transparent' }} /> Processing...</>
                        ) : (
                          <><DollarSign className="w-4 h-4" /> Subscribe — ${PLANS.find(p => p.id === selectedPlan)?.price}/mo</>
                        )}
                      </button>
                      <p className="text-center text-[11px]" style={S.muted}>
                        Cancel anytime · No contracts · Prorated upgrades
                      </p>
                    </form>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
