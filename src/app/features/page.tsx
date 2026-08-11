"use client";

import Link from "next/link";
import { 
  Zap, Shield, Smartphone, Globe, ArrowRight, Play, CheckCircle2, 
  GraduationCap, FileCheck, Layers, Users2, Lock, Sparkles 
} from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-slate-100 via-teal-50/50 to-blue-50/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white selection:bg-teal-500/30">
      <Navbar />
      
      <main className="flex-1 py-20">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-24 relative z-10">
          
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <span className="text-xs font-bold text-teal-400 bg-teal-400/10 border border-teal-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest">
              Features
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-zinc-900 dark:text-white">
              A world-class{" "}
              <span className="bg-gradient-to-r from-teal-500 via-teal-450 to-indigo-500 dark:from-teal-400 dark:to-indigo-400 bg-clip-text text-transparent">
                educational platform.
              </span>
            </h1>
            <p className="text-lg text-zinc-650 dark:text-zinc-400 leading-relaxed">
              Explore all the premium tools developed specifically to design, structure, deliver, and monetize your courses worldwide.
            </p>
          </div>

          {/* Grid of Main Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            
            {/* Feature 1: Flexible & Global Payments */}
            <div className="bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-8 space-y-6 hover:border-zinc-350 dark:hover:border-zinc-700/80 transition-all group relative overflow-hidden text-left">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="bg-teal-500/15 w-12 h-12 rounded-2xl flex items-center justify-center text-teal-500 dark:text-teal-400 border border-teal-500/20 shrink-0">
                <Smartphone className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Flexible &amp; Global Payments</h3>
                <p className="text-zinc-650 dark:text-zinc-400 text-sm leading-relaxed">
                  Collect enrollments directly via bank cards, PayPal, and global and local Mobile Money networks. Withdraw your instructor earnings instantly in a simple and secure manner, without complicated intermediaries.
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" /> Instant simulation in sandbox mode</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" /> Automatic order reconciliation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" /> Detailed history and statistics</li>
              </ul>
            </div>

            {/* Feature 2: Secure Video & Resources */}
            <div className="bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-8 space-y-6 hover:border-zinc-350 dark:hover:border-zinc-700/80 transition-all group relative overflow-hidden text-left">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="bg-blue-500/15 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-500 dark:text-blue-400 border border-blue-500/20 shrink-0">
                <Lock className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Video Hosting &amp; Security</h3>
                <p className="text-zinc-650 dark:text-zinc-400 text-sm leading-relaxed">
                  Protecting your intellectual property is our absolute priority. Integrate your lesson videos smoothly and securely through our proprietary player that blocks unauthorized direct downloads.
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" /> Anti-download protection</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" /> YouTube, Vimeo &amp; Direct Video integration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" /> Player optimized for low internet connections</li>
              </ul>
            </div>

            {/* Feature 3: Modular Course Builder */}
            <div className="bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-8 space-y-6 hover:border-zinc-350 dark:hover:border-zinc-700/80 transition-all group relative overflow-hidden text-left">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="bg-indigo-500/15 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                <Layers className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Modular Course Builder</h3>
                <p className="text-zinc-650 dark:text-zinc-400 text-sm leading-relaxed">
                  Structure your training didactically and professionally. Divide your content into clear modules and chapters, add assessment quizzes, and provide downloadable course materials (PDF, ZIP).
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" /> Unlimited sections and chapters</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" /> File manager for external resources</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" /> Draft mode to prepare your publications</li>
              </ul>
            </div>

            {/* Feature 4: Interactive Quizzes & Certificates */}
            <div className="bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-8 space-y-6 hover:border-zinc-350 dark:hover:border-zinc-700/80 transition-all group relative overflow-hidden text-left">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="bg-purple-500/15 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-500 dark:text-purple-400 border border-purple-500/20 shrink-0">
                <FileCheck className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Interactive Quizzes &amp; Certifications</h3>
                <p className="text-zinc-650 dark:text-zinc-400 text-sm leading-relaxed">
                  Validate the skills acquired by your learners. Create multiple-choice questionnaires (MCQ) with automatic grade calculation and instantly generate personalized, online-verifiable completion certificates with a unique code.
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" /> Complete question editor</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" /> Customizable passing thresholds</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" /> Public verification code for employers</li>
              </ul>
            </div>
            
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-teal-900 to-indigo-950 dark:from-zinc-950 dark:to-zinc-900 border border-teal-850 dark:border-zinc-800 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden text-white shadow-2xl">
            <div className="space-y-4 max-w-2xl relative z-10 text-left">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Ready to get started?
              </div>
              <h2 className="text-2xl md:text-3xl font-black">Join Ansella today</h2>
              <p className="text-zinc-300 text-sm leading-relaxed">
                Create your personalized academy in a few clicks and start delivering your training right now.
              </p>
            </div>
            <div className="shrink-0 relative z-10 w-full md:w-auto">
              <Link 
                href="/register" 
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-sm transition-all shadow-lg shadow-teal-500/10"
              >
                Get started for free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
