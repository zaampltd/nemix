"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StripeProvider } from '@/components/StripeProvider';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import {
  CreditCard, Zap, TrendingUp, AlertCircle, CheckCircle2,
  Download, Clock, Activity, DollarSign, BarChart2,
  Sparkles, ChevronRight, X, Shield, Lock,
} from 'lucide-react';

// ─── Plans ────────────────────────────────────────────────────────
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
    features: ['5M API calls/mo', 'Unlimited models', 'Unlimited deployments', '24/7 SLA', 'Team seats (10)'],
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

// ─── Stripe Payment Form (inner component, must be inside <Elements>) ─
function StripePaymentForm({
  plan, clientSecret, onSuccess, onCancel,
}: {
  plan: typeof PLANS[0]; clientSecret: string; onSuccess: () => void; onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

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
          Secure Payment — {plan.name} Plan
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
          <p className="text-sm font-medium" style={{ color: 'var(--md-on-surface)' }}>{plan.name} Subscription</p>
          <p className="text-xs" style={{ color: 'var(--md-on-surface-var)' }}>Billed monthly · Cancel anytime</p>
        </div>
        <p className="text-2xl font-bold" style={{ color: 'var(--md-primary)' }}>${plan.price}<span className="text-sm font-normal">/mo</span></p>
      </div>

      {/* Stripe PaymentElement — real card input */}
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
          className="flex-2 flex-1 h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
          {paying
            ? <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--md-on-primary)', borderTopColor: 'transparent' }} /> Processing...</>
            : <><DollarSign className="w-4 h-4" /> Pay ${plan.price}/month</>}
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 pt-1">
        {['Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay'].map(b => (
          <span key={b} className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--md-on-surface-var)', opacity: 0.5 }}>{b}</span>
        ))}
      </div>
    </form>
  );
}

// ─── Fallback form (when backend not configured) ────────────────────
function DemoPaymentForm({
  plan, onSuccess, onCancel,
}: {
  plan: typeof PLANS[0]; onSuccess: () => void; onCancel: () => void;
}) {
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [paying, setPaying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaying(true);
    await new Promise(r => setTimeout(r, 1800));
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 p-3 rounded-xl"
        style={{ background: 'var(--md-warning-cont)', border: '1px solid var(--md-outline)' }}>
        <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--md-warning)' }} />
        <p className="text-xs" style={{ color: 'var(--md-warning)' }}>
          <strong>Demo mode</strong> — Add your Stripe keys to enable real payments. Use card <code>4242 4242 4242 4242</code> to test.
        </p>
      </div>

      <div className="rounded-xl p-4 flex items-center justify-between"
        style={{ background: 'var(--md-primary-container)', border: '1px solid var(--md-outline)' }}>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--md-on-surface)' }}>{plan.name} Subscription</p>
          <p className="text-xs" style={{ color: 'var(--md-on-surface-var)' }}>Billed monthly · Cancel anytime</p>
        </div>
        <p className="text-2xl font-bold" style={{ color: 'var(--md-primary)' }}>${plan.price}<span className="text-sm font-normal">/mo</span></p>
      </div>

      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--md-on-surface-var)' }}>Card Number</label>
        <input style={inputStyle} placeholder="4242 4242 4242 4242" maxLength={19}
          value={card}
          onChange={e => setCard(e.target.value.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim())} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--md-on-surface-var)' }}>Expiry</label>
          <input style={inputStyle} placeholder="MM/YY" maxLength={5}
            value={expiry}
            onChange={e => { const v = e.target.value.replace(/\D/g,''); setExpiry(v.length>=2 ? v.slice(0,2)+'/'+v.slice(2) : v); }} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--md-on-surface-var)' }}>CVC</label>
          <input style={inputStyle} placeholder="123" maxLength={3}
            value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g,''))} />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 h-11 rounded-xl text-sm font-medium"
          style={{ border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)', background: 'transparent' }}>
          Cancel
        </button>
        <button type="submit" disabled={card.length < 19 || paying}
          className="flex-1 h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
          {paying
            ? <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--md-on-primary)', borderTopColor: 'transparent' }} /> Processing...</>
            : <><DollarSign className="w-4 h-4" /> Pay ${plan.price}/month</>}
        </button>
      </div>
    </form>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function BillingPage() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]); // default: Pro
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [intentError, setIntentError] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);
  const [activePlan, setActivePlan] = useState('free');
  const [history] = useState(generateHistory);

  const [liveUsage, setLiveUsage] = useState({ apiCalls: 743, apiLimit: 1000, gpuHours: 0.8, storageGB: 0.23 });
  useEffect(() => {
    const t = setInterval(() => setLiveUsage(p => ({ ...p, apiCalls: Math.min(p.apiCalls + Math.floor(Math.random()*3), p.apiLimit) })), 3000);
    return () => clearInterval(t);
  }, []);

  // Check URL for Stripe redirect success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setPaySuccess(true);
      window.history.replaceState({}, '', '/dashboard/billing');
      setTimeout(() => setPaySuccess(false), 4000);
    }
  }, []);

  const createPaymentIntent = useCallback(async (plan: typeof PLANS[0]) => {
    if (plan.id === 'free') return;
    setLoadingIntent(true); setIntentError(''); setClientSecret(null);
    try {
      const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
      const res = await api.post('/payments/create-intent', {
        plan_id: plan.id,
        email: currentUser.email || undefined,
      });
      setClientSecret(res.data.client_secret);
    } catch (err: any) {
      // Backend not configured — use demo mode
      setClientSecret(null);
      setIntentError(err.response?.data?.detail || '');
    } finally {
      setLoadingIntent(false);
    }
  }, []);

  const handleSelectPlan = (plan: typeof PLANS[0]) => {
    setSelectedPlan(plan);
    if (plan.id !== 'free') createPaymentIntent(plan);
  };

  const handleOpenUpgrade = () => {
    setShowUpgrade(true);
    createPaymentIntent(selectedPlan);
  };

  const handleSuccess = () => {
    setActivePlan(selectedPlan.id);
    setPaySuccess(true);
    setShowUpgrade(false);
    setTimeout(() => setPaySuccess(false), 4000);
  };

  const maxBar = Math.max(...history.map(h => h.calls));

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
            <p className="text-sm mt-1" style={S.muted}>Pay only for what you use — real Stripe-powered payments.</p>
          </div>
          <button onClick={handleOpenUpgrade}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
            <Sparkles className="w-4 h-4" /> Upgrade Plan
          </button>
        </div>

        {/* Pay success toast */}
        <AnimatePresence>
          {paySuccess && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: 'var(--md-success-cont)', border: '1px solid var(--md-outline)' }}>
              <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--md-success)' }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--md-success)' }}>Payment successful! 🎉</p>
                <p className="text-xs mt-0.5" style={S.muted}>Your {selectedPlan.name} plan is now active.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current plan banner */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 flex items-center justify-between gap-4"
          style={{ background: 'var(--md-primary-container)', border: '1px solid var(--md-outline)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--md-primary)' }}>
              <Zap className="w-6 h-6" style={{ color: 'var(--md-on-primary)' }} />
            </div>
            <div>
              <p className="text-xs font-medium mb-0.5" style={S.muted}>Current Plan</p>
              <p className="text-xl font-bold" style={S.text}>{PLANS.find(p => p.id === activePlan)?.name} Tier</p>
              <p className="text-xs mt-0.5" style={S.muted}>Resets June 1, 2026</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: 'var(--md-primary)' }}>
              ${PLANS.find(p => p.id === activePlan)?.price ?? 0}
            </p>
            <p className="text-xs" style={S.muted}>/month</p>
            <button onClick={handleOpenUpgrade} className="mt-2 text-xs font-semibold flex items-center gap-1 ml-auto"
              style={{ color: 'var(--md-primary)' }}>
              Upgrade <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Usage meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'API Calls',   used: liveUsage.apiCalls, limit: 1000, unit: 'calls', color: 'var(--md-primary)', live: true },
            { label: 'GPU Hours',   used: liveUsage.gpuHours, limit: 5,    unit: 'hrs',   color: 'var(--md-success)', live: false },
            { label: 'Storage',     used: liveUsage.storageGB, limit: 1,   unit: 'GB',    color: 'var(--md-warning)', live: false },
          ].map(meter => {
            const pct = Math.min((meter.used / meter.limit) * 100, 100);
            const critical = pct > 85;
            return (
              <div key={meter.label} className="rounded-2xl p-5" style={S.card}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium" style={S.muted}>{meter.label}</p>
                  <div className="flex items-center gap-1.5">
                    {meter.live && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--md-primary)' }} />}
                    {critical && <AlertCircle className="w-4 h-4" style={{ color: 'var(--md-error)' }} />}
                  </div>
                </div>
                <p className="text-2xl font-bold mb-2" style={{ color: meter.color }}>
                  {meter.used < 10 ? meter.used.toFixed(2) : meter.used.toLocaleString()}
                  <span className="text-sm font-normal ml-1" style={S.muted}>{meter.unit}</span>
                </p>
                <div className="w-full h-2 rounded-full mb-1.5" style={{ background: 'var(--md-surface-3)' }}>
                  <motion.div className="h-2 rounded-full" initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                    style={{ background: critical ? 'var(--md-error)' : meter.color }} />
                </div>
                <p className="text-[11px]" style={S.muted}>
                  {pct.toFixed(0)}% of {meter.limit} {meter.unit}
                  {critical && <span className="ml-1 font-bold" style={{ color: 'var(--md-error)' }}> — Near limit!</span>}
                </p>
              </div>
            );
          })}
        </div>

        {/* Cost breakdown */}
        <div className="rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start" style={S.card}>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1" style={S.muted}>Estimated This Month</p>
            <p className="text-4xl font-bold" style={{ color: 'var(--md-primary)' }}>$0.37</p>
            <p className="text-xs mt-1" style={S.muted}>Would be charged if on pay-as-you-go</p>
          </div>
          <div className="flex-1 space-y-2">
            {[
              { label: 'API calls (743 × $0.001/k)', value: '$0.00' },
              { label: 'GPU time (0.8h × $0.45)',    value: '$0.36' },
              { label: 'Storage (0.23 GB × $0.023)', value: '$0.01' },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-xs">
                <span style={S.muted}>{r.label}</span>
                <span className="font-semibold" style={S.text}>{r.value}</span>
              </div>
            ))}
            <div className="h-px" style={{ background: 'var(--md-outline)' }} />
            <div className="flex justify-between text-sm font-bold">
              <span style={S.text}>Total</span>
              <span style={{ color: 'var(--md-success)' }}>$0.37</span>
            </div>
          </div>
        </div>

        {/* API call history chart */}
        <div className="rounded-2xl p-6" style={S.card}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold" style={S.text}>API Call History</h2>
              <p className="text-xs mt-0.5" style={S.muted}>Last 7 months</p>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--md-surface-2)', border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)' }}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="flex items-end gap-3 h-36">
            {history.map(h => (
              <div key={h.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                <p className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: h.current ? 'var(--md-primary)' : 'var(--md-on-surface-var)' }}>
                  {h.calls.toLocaleString()}
                </p>
                <div className="w-full rounded-t-lg relative overflow-hidden"
                  style={{ height: `${Math.max((h.calls/maxBar)*100, 8)}%`, background: h.current ? 'var(--md-primary)' : 'var(--md-surface-3)' }}>
                  {h.current && <div className="absolute inset-0 animate-pulse opacity-30" style={{ background: 'var(--md-primary)' }} />}
                </div>
                <p className="text-[10px]" style={{ color: h.current ? 'var(--md-primary)' : 'var(--md-on-surface-var)' }}>{h.month}</p>
              </div>
            ))}
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
                <p className="font-bold" style={{ color: 'var(--md-primary)' }}>${item.rate}</p>
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
            <p className="text-sm mt-1" style={S.muted}>Invoices appear once you're on a paid plan.</p>
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

            <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl rounded-3xl p-8 overflow-y-auto max-h-[92vh]"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-3)' }}>

              <button onClick={() => setShowUpgrade(false)}
                className="absolute top-5 right-5 p-2 rounded-xl" style={{ color: 'var(--md-on-surface-var)' }}>
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--md-on-surface)' }}>Choose Your Plan</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--md-on-surface-var)' }}>Real payments powered by Stripe. Cancel anytime.</p>

              {/* Plan selector */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {PLANS.map(plan => (
                  <button key={plan.id} onClick={() => handleSelectPlan(plan)}
                    className="relative rounded-2xl p-4 text-left transition-all"
                    style={{
                      background: selectedPlan.id === plan.id ? 'var(--md-primary-container)' : 'var(--md-surface-2)',
                      border: `2px solid ${selectedPlan.id === plan.id ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                    }}>
                    {plan.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>POPULAR</span>
                    )}
                    <p className="font-bold text-sm mb-0.5" style={{ color: 'var(--md-on-surface)' }}>{plan.name}</p>
                    <p className="text-xl font-black" style={{ color: plan.color }}>
                      ${plan.price}<span className="text-xs font-normal" style={{ color: 'var(--md-on-surface-var)' }}>/mo</span>
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-1.5 text-[11px]" style={{ color: 'var(--md-on-surface-var)' }}>
                          <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" style={{ color: plan.color }} /> {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              {/* Payment form */}
              {selectedPlan.id === 'free' ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--md-success)' }} />
                  <p className="font-semibold" style={{ color: 'var(--md-on-surface)' }}>You're on the Free plan</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--md-on-surface-var)' }}>Select Pro or Business to upgrade.</p>
                </div>
              ) : loadingIntent ? (
                <div className="flex items-center justify-center gap-3 py-8">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'var(--md-primary)', borderTopColor: 'transparent' }} />
                  <span className="text-sm" style={{ color: 'var(--md-on-surface-var)' }}>Connecting to Stripe...</span>
                </div>
              ) : clientSecret ? (
                /* Real Stripe Payment */
                <StripeProvider clientSecret={clientSecret}>
                  <StripePaymentForm
                    plan={selectedPlan}
                    clientSecret={clientSecret}
                    onSuccess={handleSuccess}
                    onCancel={() => setShowUpgrade(false)}
                  />
                </StripeProvider>
              ) : (
                /* Demo fallback */
                <DemoPaymentForm
                  plan={selectedPlan}
                  onSuccess={handleSuccess}
                  onCancel={() => setShowUpgrade(false)}
                />
              )}

              {/* Stripe badge */}
              <div className="flex items-center justify-center gap-2 mt-5 pt-5"
                style={{ borderTop: '1px solid var(--md-outline-var)' }}>
                <Shield className="w-4 h-4" style={{ color: 'var(--md-on-surface-var)', opacity: 0.4 }} />
                <span className="text-[11px]" style={{ color: 'var(--md-on-surface-var)', opacity: 0.5 }}>
                  Payments secured by Stripe · PCI DSS compliant · 256-bit SSL
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
