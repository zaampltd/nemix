"use client";

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  User, 
  Lock, 
  Bell, 
  Globe, 
  CreditCard, 
  ShieldCheck,
  ChevronRight,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const sections = [
  {
    title: 'Account',
    desc: 'Manage your profile information and personal preferences.',
    icon: User,
    items: ['Profile Information', 'Email Preferences', 'Regional Settings']
  },
  {
    title: 'Security',
    desc: 'Protect your account with multi-factor authentication.',
    icon: Lock,
    items: ['Change Password', 'Two-Factor Authentication', 'Active Sessions']
  },
  {
    title: 'Billing & Subscription',
    desc: 'Manage your plan, payment methods, and invoices.',
    icon: CreditCard,
    items: ['Current Plan', 'Payment Methods', 'Billing History']
  },
  {
    title: 'API & Integration',
    desc: 'Generate API keys and connect with external services.',
    icon: Zap,
    items: ['API Keys', 'Webhooks', 'Connected Apps']
  }
];

export default function SettingsPage() {
  return (
    <DashboardLayout>
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account settings and platform configurations.</p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="glass rounded-3xl border border-white/5 p-6 hover:border-purple-500/20 transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:premium-gradient transition-all duration-500">
                <section.icon className="w-6 h-6 text-purple-400 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white mb-1">{section.title}</h2>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{section.desc}</p>
                
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button key={item} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-sm text-gray-300 hover:text-white transition-all">
                      <span>{item}</span>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-white/5 flex justify-end gap-4">
        <Button variant="secondary">Discard Changes</Button>
        <Button>Save Preferences</Button>
      </div>
    </div>
    </DashboardLayout>
  );
}
