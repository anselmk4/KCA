"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Database, Activity, EyeOff, Lock, UserCheck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("section-1");

  const sections = [
    { id: "section-1", title: "1. Data Collected", icon: Database },
    { id: "section-2", title: "2. Use of Your Data", icon: Activity },
    { id: "section-3", title: "3. Confidentiality & Sharing", icon: EyeOff },
    { id: "section-4", title: "4. Information Security", icon: Lock },
    { id: "section-5", title: "5. Your Rights", icon: UserCheck },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col font-sans bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-teal-500/30 transition-colors duration-300">
      <Navbar />

      <main className="flex-1 py-28 relative overflow-hidden">
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-teal-500/5 dark:bg-teal-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-12 relative z-10">
          
          {/* Header */}
          <div className="space-y-4 text-center md:text-left">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to home
            </Link>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="p-3.5 bg-teal-500/10 dark:bg-teal-500/5 border border-teal-500/20 text-teal-600 dark:text-teal-400 rounded-2xl">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1 text-center md:text-left">
                <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
                  Privacy Policy
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Last updated: June 30, 2026 • ANSELLA Platform
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Sidebar Table of Contents */}
            <aside className="lg:col-span-4 sticky top-28 hidden lg:block space-y-4">
              <div className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm">
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider mb-4">
                  Table of Contents
                </h3>
                <nav className="space-y-2">
                  {sections.map((sec) => {
                    const Icon = sec.icon;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => scrollToSection(sec.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all duration-200 cursor-pointer ${
                          activeSection === sec.id
                            ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-l-4 border-teal-500"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{sec.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Detailed Content */}
            <div className="lg:col-span-8 space-y-6">
              
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* 1. Data Collected */}
                <section 
                  id="section-1" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <Database className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      1. Data Collected
                    </h2>
                  </div>
                  <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    <p>
                      When you create a learner or instructor account on ANSELLA, we collect the information necessary for your identification and for the provision of our services:
                    </p>
                    <ul className="list-none space-y-2.5 pl-2">
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Your full name and email address.</span>
                      </li>
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Your public profile information (nationality, biography, profile photo).</span>
                      </li>
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Your billing details for Mobile Money collections or payments.</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* 2. Use of Your Data */}
                <section 
                  id="section-2" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <Activity className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      2. Use of Your Data
                    </h2>
                  </div>
                  <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    <p>
                      Your personal information allows us to personalize your experience on the educational platform, in particular to:
                    </p>
                    <ul className="list-none space-y-2.5 pl-2">
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Manage your course enrollments and track your progress.</span>
                      </li>
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Validate and process course payments via M-Pesa, Orange Money, Airtel Money.</span>
                      </li>
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Generate and certify your diplomas or completion certificates.</span>
                      </li>
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Provide customer support and send you security notifications.</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* 3. Confidentiality & Sharing */}
                <section 
                  id="section-3" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <EyeOff className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      3. Confidentiality &amp; Sharing
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    ANSELLA is committed to never reselling your personal data for commercial purposes. It is only shared with the essential third parties required for our proper operation (Supabase database services, electronic payment gateways for Mobile Money transactions).
                  </p>
                </section>

                {/* 4. Information Security */}
                <section 
                  id="section-4" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <Lock className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      4. Information Security
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    We use industry-standard technology to protect your personal information. Our platform&apos;s authentication relies on Supabase Auth, ensuring strong encryption of your credentials and session login data.
                  </p>
                </section>

                {/* 5. Your Rights */}
                <section 
                  id="section-5" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <UserCheck className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      5. Your Rights
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    In accordance with personal data protection regulations, you have the right to access, rectify, and delete your data. You can make these changes from your profile settings page on the platform or by contacting our administration team.
                  </p>
                </section>

              </motion.div>

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
