"use client";

import Link from 'next/link';
import { 
  Zap, 
  Shield, 
  Rocket, 
  Globe, 
  ArrowRight, 
  Layers, 
  Cpu, 
  Database 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
            <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center shadow-[0_0_20px_-5px_#a855f7]">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span>Nemix</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#docs" className="hover:text-white transition-colors">Documentation</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium hover:text-purple-400 transition-colors">
              Sign In
            </Link>
            <Link href="/auth/register" className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-200 transition-all active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-purple-500/10 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-purple-400 mb-8 animate-glow"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            v1.0 is now live
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8"
          >
            The Industrial Grade <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              AI Training Platform
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl mb-12 leading-relaxed"
          >
            Build, train, and deploy production-ready AI models in minutes. 
            From fine-tuning LLMs to custom computer vision, we provide the infrastructure so you can focus on innovation.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 rounded-2xl premium-gradient text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all group">
              Start Building Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all">
              Book a Demo
            </button>
          </motion.div>

          {/* Hero Image / Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
            <div className="glass rounded-3xl border border-white/10 p-4 shadow-2xl">
               <div className="bg-[#050505] rounded-2xl h-[500px] w-full flex items-center justify-center border border-white/5">
                  <div className="flex flex-col items-center gap-4 text-gray-600">
                    <Layers className="w-16 h-16 opacity-20" />
                    <p className="text-sm uppercase tracking-widest font-mono">Infrastructure Dashboard Preview</p>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-12">Empowering teams at</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-30 grayscale contrast-125">
            <div className="text-2xl font-black italic">TECHFLOW</div>
            <div className="text-2xl font-black italic">NEURALIS</div>
            <div className="text-2xl font-black italic">OPTIX</div>
            <div className="text-2xl font-black italic">VOID.AI</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">Everything you need to ship AI</h2>
            <p className="text-gray-400">A complete ecosystem for the modern AI engineer.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Dataset Engine', desc: 'Drag-and-drop datasets, auto-cleaning, and versioning for training consistency.', icon: Database },
              { title: 'Training Orchestrator', desc: 'Scalable GPU clusters with real-time logs and checkpoint management.', icon: Cpu },
              { title: 'API Deployment', desc: 'One-click deployment to low-latency edge endpoints with automatic scaling.', icon: Rocket },
              { title: 'Secure Gateway', desc: 'Enterprise-grade security with RBAC, audit logs, and encrypted API keys.', icon: Shield },
              { title: 'Global Reach', desc: 'Deploy models globally with multi-region support and low-latency routing.', icon: Globe },
              { title: 'Team Sync', desc: 'Collaborate with your team in real-time with shared environments.', icon: Layers },
            ].map((f) => (
              <div key={f.title} className="glass p-8 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all duration-500 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:premium-gradient transition-all duration-500">
                  <f.icon className="w-6 h-6 text-purple-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Zap className="w-5 h-5 text-purple-400" />
            <span>Nemix</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 Nemix Infrastructure Inc. All rights reserved.</p>
          <div className="flex gap-6 text-gray-500 text-sm">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
