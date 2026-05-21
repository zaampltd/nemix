"use client";
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { User, Lock, Bell, Globe, CreditCard, Zap, ChevronRight, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const sections = [
  {
    title: 'Account', desc: 'Manage your profile information and personal preferences.', icon: User,
    items: ['Profile Information', 'Email Preferences', 'Regional Settings'],
  },
  {
    title: 'Security', desc: 'Protect your account with multi-factor authentication.', icon: Lock,
    items: ['Change Password', 'Two-Factor Authentication', 'Active Sessions'],
  },
  {
    title: 'Billing & Subscription', desc: 'Manage your plan, payment methods, and invoices.', icon: CreditCard,
    items: ['Current Plan', 'Payment Methods', 'Billing History'],
  },
  {
    title: 'Notifications', desc: 'Configure how and when you receive alerts.', icon: Bell,
    items: ['Email Alerts', 'Slack Integration', 'Webhook Events'],
  },
  {
    title: 'API & Integration', desc: 'Generate API keys and connect with external services.', icon: Zap,
    items: ['API Keys', 'Webhooks', 'Connected Apps'],
  },
];

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--md-on-surface)' }}>Settings</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--md-on-surface-var)' }}>Manage your account settings and platform configurations.</p>
          </div>
          {/* Save / Discard buttons — FIXED (were missing/invisible) */}
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)', background: 'transparent' }}>
              Discard
            </button>
            <button onClick={handleSave}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 flex items-center gap-2"
              style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
              {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : 'Save Preferences'}
            </button>
          </div>
        </div>

        {/* Save success toast */}
        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'var(--md-success-cont)', border: '1px solid var(--md-outline)' }}>
              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--md-success)' }} />
              <p className="text-sm" style={{ color: 'var(--md-success)' }}>Preferences saved successfully.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sections */}
        <div className="space-y-3">
          {sections.map((section, si) => (
            <motion.div key={section.title}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}
              className="rounded-2xl p-6"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-1)' }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--md-primary-container)' }}>
                  <section.icon className="w-5 h-5" style={{ color: 'var(--md-on-primary-cont)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold mb-0.5" style={{ color: 'var(--md-on-surface)' }}>{section.title}</h2>
                  <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--md-on-surface-var)' }}>{section.desc}</p>

                  <div className="space-y-0.5">
                    {section.items.map(item => (
                      <button key={item}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all text-left"
                        style={{ color: 'var(--md-on-surface)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--md-surface-2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        <span>{item}</span>
                        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--md-on-surface-var)', opacity: 0.4 }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom action bar */}
        <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--md-outline-var)' }}>
          <button
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ border: '1px solid var(--md-outline)', color: 'var(--md-on-surface-var)', background: 'transparent' }}>
            Discard Changes
          </button>
          <button onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 flex items-center gap-2"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : 'Save Preferences'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
