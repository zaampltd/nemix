"use client";
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { User, Lock, Bell, Globe, CreditCard, ShieldCheck, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const sections = [
  { title: 'Account', desc: 'Manage your profile information and personal preferences.', icon: User, items: ['Profile Information', 'Email Preferences', 'Regional Settings'] },
  { title: 'Security', desc: 'Protect your account with multi-factor authentication.', icon: Lock, items: ['Change Password', 'Two-Factor Authentication', 'Active Sessions'] },
  { title: 'Billing & Subscription', desc: 'Manage your plan, payment methods, and invoices.', icon: CreditCard, items: ['Current Plan', 'Payment Methods', 'Billing History'] },
  { title: 'Notifications', desc: 'Configure how and when you receive alerts.', icon: Bell, items: ['Email Alerts', 'Slack Integration', 'Webhook Events'] },
  { title: 'API & Integration', desc: 'Generate API keys and connect with external services.', icon: Zap, items: ['API Keys', 'Webhooks', 'Connected Apps'] },
];

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--md-on-surface)' }}>Settings</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--md-on-surface-var)' }}>Manage your account settings and platform configurations.</p>
        </div>

        <div className="space-y-3">
          {sections.map(section => (
            <div key={section.title} className="rounded-2xl p-6 transition-all"
              style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline)', boxShadow: 'var(--shadow-1)' }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--md-primary-container)' }}>
                  <section.icon className="w-6 h-6" style={{ color: 'var(--md-on-primary-cont)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--md-on-surface)' }}>{section.title}</h2>
                  <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--md-on-surface-var)' }}>{section.desc}</p>
                  <div className="space-y-1">
                    {section.items.map(item => (
                      <button key={item} className="w-full flex items-center justify-between p-3 rounded-xl text-sm transition-all"
                        style={{ color: 'var(--md-on-surface-var)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--md-surface-2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <span>{item}</span>
                        <ChevronRight className="w-4 h-4" style={{ color: 'var(--md-on-surface-var)', opacity: 0.5 }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 flex justify-end gap-3" style={{ borderTop: '1px solid var(--md-outline-var)' }}>
          <Button variant="outline">Discard Changes</Button>
          <Button>Save Preferences</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
