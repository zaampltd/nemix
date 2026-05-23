"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StripeProvider } from '@/components/StripeProvider';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import {
  CreditCard, Zap, TrendingUp, AlertCircle, CheckCircle2,
  Download, Clock, Activity, DollarSign, BarChart2,
  Sparkles, ChevronRight, X, Shield, Lock, Calculator, HelpCircle
} from 'lucide-react';

// ─── Plan Definitions with Quotas & Rates ──────────────────────────
const PLANS = [
  {
    id: 'free',
    name: 'Free Sandbox',
    monthlyPrice: 0,
    annualPrice: 0,
    color: 'var(--md-on-surface-var)',
    accent: 'rgba(139, 139, 153, 0.15)',
    features: ['1,000 API calls/mo', '1 GB dataset storage', '1 GPU training hour/mo', 'Community support', 'Shared CPU sandbox'],
    quotas: { api: 1000, gpu: 1, storage: 1 }
  },
  {
    id: 'pro',
    name: 'Developer Pro',
    monthlyPrice: 49,
    annualPrice: 39,
    color: 'var(--md-primary)',
    accent: 'var(--md-primary-container)',
    features: ['100,000 API calls/mo', '20 GB dataset storage', '20 GPU training hours/mo', 'Priority support', 'Dedicated L4 GPUs', 'Custom domain mapping'],
    popular: true,
    quotas: { api: 100000, gpu: 20, storage: 20 }
  },
  {
    id: 'business',
    name: 'Business Enterprise',
    monthlyPrice: 199,
    annualPrice: 159,
    color: 'var(--md-success)',
    accent: 'var(--md-success-cont)',
    features: ['5,000,000 API calls/mo', '100 GB dataset storage', '100 GPU training hours/mo', '24/7 dedicated support', 'Always-warm warm endpoints', '10 team seats included'],
    quotas: { api: 5000000, gpu: 100, storage: 100 }
  },
];

const RATE_CARD = [
  { name: 'Inference API calls', unit: 'per 1K calls',  rate: 0.001, icon: Zap },
  { name: 'GPU Training time',   unit: 'per GPU-hour',  rate: 0.45,  icon: Activity },
  { name: 'Storage',             unit: 'per GB/month',  rate: 0.023, icon: BarChart2 },
  { name: 'Data transfer',       unit: 'per GB out',    rate: 0.09,  icon: TrendingUp },
];

function generateHistory() {
  return ['Nov','Dec','Jan','Feb','Mar','Apr','May'].map((month, i, arr) => ({
    month, calls: Math.floor(Math.random() * 80000 + 10000),
    current: i === arr.length - 1,
  }));
}

// ─── Stripe Payment Form (inner component) ──────────────────────────
function StripePaymentForm({
  plan, billingPeriod, clientSecret, onSuccess, onCancel,
}: {
  plan: typeof PLANS[0]; billingPeriod: 'monthly' | 'annual'; clientSecret: string; onSuccess: () => void; onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  const isAnnual = billingPeriod === 'annual';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true); setError('');
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/dashboard/billing?success=true` },
      redirect: 'if_required',
    });
    if (stripeError) {
      setError(stripeError.message || 'Payment failed. Please try again.');
      setPaying(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Lock className="w-4 h-4" style={{ color: 'var(--md-success)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--md-on-surface)' }}>
          Secure Checkout — {plan.name}
        </span>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded"
          style={{ background: 'var(--md-success-cont)', color: 'var(--md-success)' }}>
          🔒 SSL Encrypted
        </span>
      </div>

      {/* Amount preview */}
      <div className="rounded-xl p-4 flex items-center justify-between"
        style={{ background: 'var(--md-primary-container)', border: '1px solid var(--md-outline)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--md-on-surface)' }}>
            {plan.name} Subscription
          </p>
          <p className="text-xs" style={{ color: 'var(--md-on-surface-var)' }}>
            {isAnnual ? 'Billed annually (20% Discount applied)' : 'Billed monthly · Cancel anytime'}
          </p>
        </div>
        <p className="text-2xl font-black text-right" style={{ color: 'var(--md-primary)' }}>
          ${price}
          <span className="text-xs font-normal block" style={{ color: 'var(--md-on-surface-var)' }}>
            {isAnnual ? 'equivalent / month' : '/ month'}
          </span>
        </p>
      </div>

      <div className="rounded-xl p-4" style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}>
        <PaymentElement
          onReady={() => setReady(true)}
          options={{ layout: 'tabs' }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{ background: 'var(--md-error-cont)', color: 'var(--md-error)' }}>
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 h-11 rounded-xl text-sm font-medium transition-all"
          style={{ border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)', background: 'transparent' }}>
          Cancel
        </button>
        <button type="submit" disabled={!stripe || !ready || paying}
          className="flex-1 h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
          {paying
            ? <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--md-on-primary)', borderTopColor: 'transparent' }} /> Processing...</>
            : <><DollarSign className="w-4 h-4" /> Pay ${isAnnual ? price * 12 : price}</>}
        </button>
      </div>
    </form>
  );
}

// ─── Fallback Demo Payment Form (Sleek fallback) ────────────────────
function DemoPaymentForm({
  plan, billingPeriod, onSuccess, onCancel,
}: {
  plan: typeof PLANS[0]; billingPeriod: 'monthly' | 'annual'; onSuccess: () => void; onCancel: () => void;
}) {
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [paying, setPaying] = useState(false);

  const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  const isAnnual = billingPeriod === 'annual';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaying(true);
    await new Promise(r => setTimeout(r, 1600));
    setPaying(false);
    onSuccess();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '44px', borderRadius: '12px', padding: '0 16px',
    fontSize: '0.875rem', fontFamily: 'monospace',
    background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)',
    color: 'var(--md-on-surface)', outline: 'none',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-xl"
        style={{ background: 'var(--md-warning-cont)', border: '1px solid var(--md-outline)' }}>
        <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--md-warning)' }} />
        <p className="text-xs" style={{ color: 'var(--md-warning)' }}>
          <strong>Sandbox Environment</strong> — Stripe keys not specified in <code>.env</code>. Enter card number <code>4242 4242 4242 4242</code> to proceed.
        </p>
      </div>

      <div className="rounded-xl p-4 flex items-center justify-between"
        style={{ background: 'var(--md-primary-container)', border: '1px solid var(--md-outline)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--md-on-surface)' }}>{plan.name}</p>
          <p className="text-xs" style={{ color: 'var(--md-on-surface-var)' }}>
            {isAnnual ? 'Billed annually · 20% discount' : 'Billed monthly · Cancel anytime'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black" style={{ color: 'var(--md-primary)' }}>
            ${price}<span className="text-xs font-normal" style={{ color: 'var(--md-on-surface-var)' }}>/mo</span>
          </p>
          <p className="text-[10px]" style={{ color: 'var(--md-on-surface-var)' }}>
            Total: ${isAnnual ? price * 12 : price}
          </p>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--md-on-surface-var)' }}>Card Number</label>
        <input style={inputStyle} placeholder="4242 4242 4242 4242" maxLength={19}
          value={card}
          onChange={e => setCard(e.target.value.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim())} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--md-on-surface-var)' }}>Expiry</label>
          <input style={inputStyle} placeholder="MM/YY" maxLength={5}
            value={expiry}
            onChange={e => { const v = e.target.value.replace(/\D/g,''); setExpiry(v.length>=2 ? v.slice(0,2)+'/'+v.slice(2) : v); }} />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--md-on-surface-var)' }}>CVC</label>
          <input style={inputStyle} placeholder="123" maxLength={3}
            value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g,''))} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 h-11 rounded-xl text-sm font-medium transition-all"
          style={{ border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)', background: 'transparent' }}>
          Cancel
        </button>
        <button type="submit" disabled={card.length < 19 || paying}
          className="flex-1 h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
          {paying
            ? <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--md-on-primary)', borderTopColor: 'transparent' }} /> Processing...</>
            : <><DollarSign className="w-4 h-4" /> Pay ${isAnnual ? price * 12 : price}</>}
        </button>
      </div>
    </form>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function BillingPage() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]); // default: Pro
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [intentError, setIntentError] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);
  const [activePlan, setActivePlan] = useState('free');
  const [history] = useState(generateHistory);

  // Live updates simulator for API calls
  const [liveUsage, setLiveUsage] = useState({ apiCalls: 743, gpuHours: 0.8, storageGB: 0.23 });
  useEffect(() => {
    const t = setInterval(() => {
      setLiveUsage(p => {
        const currentLimit = PLANS.find(pl => pl.id === activePlan)?.quotas.api || 1000;
        return {
          ...p,
          apiCalls: Math.min(p.apiCalls + Math.floor(Math.random() * 2), currentLimit)
        };
      });
    }, 4000);
    return () => clearInterval(t);
  }, [activePlan]);

  // Read active quotas dynamically
  const activePlanQuotas = useMemo(() => {
    return PLANS.find(p => p.id === activePlan)?.quotas || { api: 1000, gpu: 1, storage: 1 };
  }, [activePlan]);

  // 100 Customers Interactive Calculator State
  const [custFree, setCustFree] = useState(80);
  const [custPro, setCustPro] = useState(15);
  const [custBiz, setCustBiz] = useState(5);

  // Calculate SaaS margins based on customer ratios
  const financialProjections = useMemo(() => {
    const totalCustomers = custFree + custPro + custBiz;
    // Pricing Revenue (Annual vs Monthly equivalent)
    const proPrice = billingPeriod === 'monthly' ? 49 : 39;
    const bizPrice = billingPeriod === 'monthly' ? 199 : 159;

    const mrr = (custPro * proPrice) + (custBiz * bizPrice);

    // Infrastructure costs (50% quota usage assumption)
    const apiCost = (custFree * 1000 + custPro * 50000 + custBiz * 2000000) * 0.0002 / 1000;
    const storageCost = (custFree * 1 + custPro * 10 + custBiz * 40) * 0.02;
    const gpuCost = (custFree * 0.5 + custPro * 10 + custBiz * 40) * 0.20;
    const generalOverhead = 50; // Vercel / db hosting

    const totalCost = apiCost + storageCost + gpuCost + generalOverhead;
    const profit = Math.max(mrr - totalCost, 0);
    const margin = mrr > 0 ? (profit / mrr) * 100 : 0;

    return { totalCustomers, mrr, totalCost, profit, margin };
  }, [custFree, custPro, custBiz, billingPeriod]);

  // Check URL Stripe redirects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setPaySuccess(true);
      window.history.replaceState({}, '', '/dashboard/billing');
      setTimeout(() => setPaySuccess(false), 4000);
    }
  }, []);

  const createPaymentIntent = useCallback(async (plan: typeof PLANS[0], period: 'monthly' | 'annual') => {
    if (plan.id === 'free') return;
    setLoadingIntent(true); setIntentError(''); setClientSecret(null);
    try {
      const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
      const planIdStr = period === 'annual' ? `${plan.id}_annual` : plan.id;
      
      const res = await api.post('/payments/create-intent', {
        plan_id: planIdStr,
        email: currentUser.email || undefined,
      });
      setClientSecret(res.data.client_secret);
    } catch (err: any) {
      setClientSecret(null);
      setIntentError(err.response?.data?.detail || 'Demo environment activation.');
    } finally {
      setLoadingIntent(false);
    }
  }, []);

  const handleSelectPlan = (plan: typeof PLANS[0]) => {
    setSelectedPlan(plan);
    if (plan.id !== 'free') createPaymentIntent(plan, billingPeriod);
  };

  const handleOpenUpgrade = () => {
    setShowUpgrade(true);
    createPaymentIntent(selectedPlan, billingPeriod);
  };

  const handleSuccess = () => {
    setActivePlan(selectedPlan.id);
    setPaySuccess(true);
    setShowUpgrade(false);
    setTimeout(() => setPaySuccess(false), 4000);
  };

  const maxBar = Math.max(...history.map(h => h.calls));

  const S = {
    card:  { background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-1)', backdropFilter: 'blur(12px)' } as React.CSSProperties,
    text:  { color: 'var(--md-on-surface)' } as React.CSSProperties,
    muted: { color: 'var(--md-on-surface-var)' } as React.CSSProperties,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={S.text}>Billing & Quota Settings</h1>
            <p className="text-sm mt-1" style={S.muted}>Deploy, manage subscriptions, and allocate infrastructure budgets.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleOpenUpgrade}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
              <Sparkles className="w-4 h-4" /> Change Quota Plan
            </button>
          </div>
        </div>

        {/* Live Payment success toast */}
        <AnimatePresence>
          {paySuccess && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: 'var(--md-success-cont)', border: '1px solid var(--md-success)' }}>
              <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--md-success)' }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--md-success)' }}>Workspace Plan Upgraded! 🎉</p>
                <p className="text-xs mt-0.5" style={S.muted}>Your subscription level {selectedPlan.name} is now fully operational.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active plan status panel */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={S.card}>
          <div className="absolute right-0 top-0 w-80 h-80 rounded-full blur-3xl opacity-10"
            style={{ background: 'var(--md-primary)' }} />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: activePlan === 'free' ? 'var(--md-surface-3)' : 'var(--md-primary)' }}>
                <Zap className="w-7 h-7" style={{ color: activePlan === 'free' ? 'var(--md-on-surface)' : 'var(--md-on-primary)' }} />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded"
                  style={{ background: 'var(--md-primary-container)', color: 'var(--md-primary)' }}>
                  Active Plan
                </span>
                <h2 className="text-2xl font-black mt-1" style={S.text}>
                  {PLANS.find(p => p.id === activePlan)?.name}
                </h2>
                <p className="text-xs mt-0.5" style={S.muted}>
                  Enterprise workspace boundaries reset on June 1, 2026.
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-4xl font-black" style={{ color: 'var(--md-primary)' }}>
                ${(activePlan === 'pro' ? (billingPeriod === 'monthly' ? 49 : 39) : activePlan === 'business' ? (billingPeriod === 'monthly' ? 199 : 159) : 0)}
              </p>
              <p className="text-xs font-semibold" style={S.muted}>
                /month {billingPeriod === 'annual' && activePlan !== 'free' && '(billed annually)'}
              </p>
            </div>
          </div>
        </div>

        {/* Responsive Usage Meter Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: 'Total API Endpoint Requests',
              used: liveUsage.apiCalls,
              limit: activePlanQuotas.api,
              unit: 'calls',
              color: 'var(--md-primary)',
              live: true,
            },
            {
              label: 'Dedicated GPU Training Hours',
              used: liveUsage.gpuHours,
              limit: activePlanQuotas.gpu,
              unit: 'hrs',
              color: 'var(--md-success)',
              live: false,
            },
            {
              label: 'Cleaned Dataset Storage',
              used: liveUsage.storageGB,
              limit: activePlanQuotas.storage,
              unit: 'GB',
              color: 'var(--md-warning)',
              live: false,
            },
          ].map(meter => {
            const pct = Math.min((meter.used / meter.limit) * 100, 100);
            const critical = pct > 80;
            return (
              <div key={meter.label} className="rounded-2xl p-5 relative overflow-hidden" style={S.card}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold" style={S.muted}>{meter.label}</p>
                  {meter.live && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--md-primary-container)', color: 'var(--md-primary)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> Live
                    </span>
                  )}
                </div>
                <p className="text-3xl font-black tracking-tight mb-2" style={{ color: meter.color }}>
                  {meter.used < 10 ? meter.used.toFixed(2) : meter.used.toLocaleString()}
                  <span className="text-sm font-medium ml-1" style={S.muted}>{meter.unit}</span>
                </p>
                <div className="w-full h-2 rounded-full mb-2" style={{ background: 'var(--md-surface-3)' }}>
                  <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }}
                    style={{ background: critical ? 'var(--md-error)' : meter.color }} />
                </div>
                <p className="text-[11px]" style={S.muted}>
                  {pct.toFixed(1)}% of {meter.limit.toLocaleString()} {meter.unit} allocated capacity.
                  {critical && <span className="ml-1 font-bold" style={{ color: 'var(--md-error)' }}>Upgrade recommended!</span>}
                </p>
              </div>
            );
          })}
        </div>

        {/* ─── 100 Customers Interactive Simulation Calculator (Urdu request) ─── */}
        <div className="rounded-2xl p-6" style={S.card}>
          <div className="flex items-center gap-2.5 mb-2">
            <Calculator className="w-5 h-5" style={{ color: 'var(--md-primary)' }} />
            <h2 className="font-bold text-lg" style={S.text}>SaaS Infrastructure Economics Calculator</h2>
          </div>
          <p className="text-sm mb-6" style={S.muted}>
            Simulate your serverless infrastructure costs and net revenue assuming 100 active monthly customers. Adjust plan ratios to optimize gross margin.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2" style={S.text}>
                <span>Free Users ({custFree})</span>
                <span style={S.muted}>Limit: 1K calls</span>
              </div>
              <input type="range" min="0" max="100" value={custFree}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  setCustFree(val);
                  // Balance other fields to keep sum close to 100
                  const diff = 100 - (val + custPro + custBiz);
                  if (diff !== 0) {
                    if (custPro + diff >= 0) setCustPro(custPro + diff);
                    else setCustBiz(Math.max(0, custBiz + (custPro + diff)));
                  }
                }}
                className="w-full accent-purple-600" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2" style={S.text}>
                <span>Pro Users ({custPro})</span>
                <span style={{ color: 'var(--md-primary)' }}>$49/mo quota</span>
              </div>
              <input type="range" min="0" max="100" value={custPro}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  setCustPro(val);
                  const diff = 100 - (custFree + val + custBiz);
                  if (diff !== 0) {
                    if (custFree + diff >= 0) setCustFree(custFree + diff);
                    else setCustBiz(Math.max(0, custBiz + (custFree + diff)));
                  }
                }}
                className="w-full accent-purple-600" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2" style={S.text}>
                <span>Business Users ({custBiz})</span>
                <span style={{ color: 'var(--md-success)' }}>$199/mo quota</span>
              </div>
              <input type="range" min="0" max="100" value={custBiz}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  setCustBiz(val);
                  const diff = 100 - (custFree + custPro + val);
                  if (diff !== 0) {
                    if (custFree + diff >= 0) setCustFree(custFree + diff);
                    else setCustPro(Math.max(0, custPro + (custFree + diff)));
                  }
                }}
                className="w-full accent-purple-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl"
            style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}>
            <div className="text-center p-2">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={S.muted}>Customers</p>
              <p className="text-2xl font-black mt-1" style={S.text}>{financialProjections.totalCustomers}</p>
            </div>
            <div className="text-center p-2 border-l" style={{ borderColor: 'var(--md-outline-var)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={S.muted}>Projected Revenue (MRR)</p>
              <p className="text-2xl font-black mt-1" style={{ color: 'var(--md-primary)' }}>
                ${financialProjections.mrr.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-2 border-l" style={{ borderColor: 'var(--md-outline-var)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={S.muted}>Est. Server Overhead</p>
              <p className="text-2xl font-black mt-1 text-red-500">
                -${financialProjections.totalCost.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-2 border-l animate-pulse" style={{ borderColor: 'var(--md-outline-var)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={S.muted}>Gross Profit Margin</p>
              <p className="text-2xl font-black mt-1" style={{ color: 'var(--md-success)' }}>
                {financialProjections.margin.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Rate Card */}
        <div className="rounded-2xl p-6" style={S.card}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg" style={S.text}>Metered Overages Rate Card</h2>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
              style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)' }}>
              Pay-as-you-go billing
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RATE_CARD.map(item => (
              <div key={item.name} className="flex items-center gap-4 p-4 rounded-xl transition-all hover:translate-x-1"
                style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline-var)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--md-primary-container)' }}>
                  <item.icon className="w-5 h-5" style={{ color: 'var(--md-primary)' }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={S.text}>{item.name}</p>
                  <p className="text-xs" style={S.muted}>{item.unit}</p>
                </div>
                <p className="font-black text-lg" style={{ color: 'var(--md-primary)' }}>${item.rate}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Graph and Invoice details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-6 flex flex-col justify-between" style={S.card}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold" style={S.text}>API Demand Cycles</h3>
                <p className="text-xs mt-0.5" style={S.muted}>Calls processed over recent months</p>
              </div>
              <button className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)' }}>
                <Download className="w-3 h-3" /> Export CSV
              </button>
            </div>
            <div className="flex items-end gap-2.5 h-32 pt-2">
              {history.map(h => (
                <div key={h.month} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: h.current ? 'var(--md-primary)' : 'var(--md-on-surface-var)' }}>
                    {(h.calls/1000).toFixed(0)}k
                  </span>
                  <div className="w-full rounded-t-md relative overflow-hidden"
                    style={{ height: `${Math.max((h.calls/maxBar)*100, 10)}%`, background: h.current ? 'var(--md-primary)' : 'var(--md-surface-3)' }}>
                    {h.current && <div className="absolute inset-0 animate-pulse bg-purple-500 opacity-20" />}
                  </div>
                  <span className="text-[10px] mt-1" style={{ color: h.current ? 'var(--md-primary)' : 'var(--md-on-surface-var)' }}>{h.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden flex flex-col justify-between" style={S.card}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--md-outline)' }}>
              <h3 className="font-bold" style={S.text}>Recent Billing Invoices</h3>
            </div>
            <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
              <Clock className="w-8 h-8 text-purple-400 mb-2" />
              <p className="font-semibold text-sm" style={S.text}>No Invoices Available</p>
              <p className="text-xs mt-0.5" style={S.muted}>Historical PDF invoices are generated at the end of billing cycles.</p>
            </div>
          </div>
        </div>

      </div>

      {/* ── Upgrade / Checkout Modal ──────────────────────────────── */}
      <AnimatePresence>
        {showUpgrade && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-sm" style={{ background: 'var(--md-scrim)' }}
              onClick={() => setShowUpgrade(false)} />

            <motion.div initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl rounded-3xl p-6 overflow-y-auto max-h-[94vh]"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)' }}>

              <button onClick={() => setShowUpgrade(false)}
                className="absolute top-4 right-4 p-2 rounded-xl" style={{ color: 'var(--md-on-surface-var)' }}>
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--md-on-surface)' }}>Configure Quota Subscription</h2>
              <p className="text-xs mb-5" style={{ color: 'var(--md-on-surface-var)' }}>Real payments powered by Stripe. Annual options include 20% discount.</p>

              {/* Billing Period Selector */}
              <div className="flex justify-center mb-6">
                <div className="flex p-1 rounded-xl" style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)' }}>
                  <button onClick={() => setBillingPeriod('monthly')}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all"
                    style={{
                      background: billingPeriod === 'monthly' ? 'var(--md-primary)' : 'transparent',
                      color: billingPeriod === 'monthly' ? 'var(--md-on-primary)' : 'var(--md-on-surface-var)'
                    }}>
                    Billed Monthly
                  </button>
                  <button onClick={() => setBillingPeriod('annual')}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                    style={{
                      background: billingPeriod === 'annual' ? 'var(--md-primary)' : 'transparent',
                      color: billingPeriod === 'annual' ? 'var(--md-on-primary)' : 'var(--md-on-surface-var)'
                    }}>
                    Billed Annually
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-green-500 text-white leading-none">
                      -20%
                    </span>
                  </button>
                </div>
              </div>

              {/* Tiers choosing grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {PLANS.map(plan => {
                  const priceVal = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
                  const isSelected = selectedPlan.id === plan.id;
                  return (
                    <button key={plan.id} onClick={() => handleSelectPlan(plan)}
                      className="relative rounded-2xl p-4 text-left transition-all hover:scale-[1.01]"
                      style={{
                        background: isSelected ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                        border: `2px solid ${isSelected ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                      }}>
                      {plan.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white whitespace-nowrap">
                          RECOMMENDED
                        </span>
                      )}
                      <p className="font-bold text-xs" style={{ color: 'var(--md-on-surface-var)' }}>{plan.name}</p>
                      <p className="text-2xl font-black mt-1" style={{ color: plan.color }}>
                        ${priceVal}
                        <span className="text-[10px] font-medium" style={{ color: 'var(--md-on-surface-var)' }}>/mo</span>
                      </p>
                      <ul className="mt-3 space-y-1">
                        {plan.features.slice(0, 4).map(f => (
                          <li key={f} className="flex items-start gap-1 text-[10px]" style={{ color: 'var(--md-on-surface-var)' }}>
                            <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0 text-green-500" />
                            <span className="leading-tight">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              {/* Actual stripe checkout panel logic */}
              {selectedPlan.id === 'free' ? (
                <div className="text-center py-6" style={{ background: 'var(--md-surface-2)', borderRadius: '16px' }}>
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p className="font-semibold text-sm" style={{ color: 'var(--md-on-surface)' }}>Free sandbox mode is active</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--md-on-surface-var)' }}>Select Developer Pro or Business levels to upgrade capacities.</p>
                </div>
              ) : loadingIntent ? (
                <div className="flex items-center justify-center gap-3 py-6">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'var(--md-primary)', borderTopColor: 'transparent' }} />
                  <span className="text-sm" style={{ color: 'var(--md-on-surface-var)' }}>Connecting with Stripe API...</span>
                </div>
              ) : clientSecret ? (
                <StripeProvider clientSecret={clientSecret}>
                  <StripePaymentForm
                    plan={selectedPlan}
                    billingPeriod={billingPeriod}
                    clientSecret={clientSecret}
                    onSuccess={handleSuccess}
                    onCancel={() => setShowUpgrade(false)}
                  />
                </StripeProvider>
              ) : (
                <DemoPaymentForm
                  plan={selectedPlan}
                  billingPeriod={billingPeriod}
                  onSuccess={handleSuccess}
                  onCancel={() => setShowUpgrade(false)}
                />
              )}

              <div className="flex items-center justify-center gap-2 mt-6 pt-4"
                style={{ borderTop: '1px solid var(--md-outline)' }}>
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-[10px]" style={{ color: 'var(--md-on-surface-var)' }}>
                  SSL encrypted card data processed securely using Stripe Inc.
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
