"use client";

import { useState } from "react";
import Link from "next/link";
import { Scale, ArrowLeft, Shield, FileText, UserCheck, AlertTriangle, KeyRound, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("section-1");

  const sections = [
    { id: "section-1", title: "1. Acceptance of Terms", icon: UserCheck },
    { id: "section-2", title: "2. Role of ANSELLA", icon: Shield },
    { id: "section-3", title: "3. Instructor Responsibilities", icon: FileText },
    { id: "section-4", title: "4. Payments & Mobile Money Withdrawals", icon: KeyRound },
    { id: "section-5", title: "5. Security & Hosting", icon: AlertTriangle },
    { id: "section-6", title: "6. Termination", icon: HelpCircle },
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
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-teal-500/5 dark:bg-teal-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

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
                <Scale className="w-8 h-8" />
              </div>
              <div className="space-y-1 text-center md:text-left">
                <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
                  Terms of Service
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
                {/* 1. Acceptance of Terms */}
                <section 
                  id="section-1" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <UserCheck className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      1. Acceptance of Terms
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    By accessing and using the ANSELLA educational platform, you agree to be bound by these terms of service, all applicable laws and regulations at the international and local level. If you have not accepted these terms, you must not use the service.
                  </p>
                </section>

                {/* 2. Role of ANSELLA */}
                <section 
                  id="section-2" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <Shield className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      2. Role of ANSELLA
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    ANSELLA acts as a Learning Management System technology provider (SaaS LMS) and electronic payment intermediary. We enable independent creators (the Instructors) to create private training academies, and students (the Learners) to enroll and access courses.
                  </p>
                </section>

                {/* 3. Instructor Responsibilities */}
                <section 
                  id="section-3" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <FileText className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      3. Instructor Responsibilities
                    </h2>
                  </div>
                  <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    <p>
                      The instructor is the sole intellectual and legal owner of the content they publish (courses, videos, texts, materials). They agree to:
                    </p>
                    <ul className="list-none space-y-2.5 pl-2">
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Not violate the intellectual property rights of third parties.</span>
                      </li>
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Not publish hateful, fraudulent, pornographic, or defamatory content.</span>
                      </li>
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Provide adequate support to learners according to the chosen plan.</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* 4. Payments & Withdrawals */}
                <section 
                  id="section-4" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <KeyRound className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      4. Payments &amp; Mobile Money Withdrawals
                    </h2>
                  </div>
                  <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    <p>
                      The platform integrates local payment methods including M-Pesa, Orange Money, and Airtel Money.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <h4 className="font-extrabold text-xs text-zinc-800 dark:text-white uppercase mb-1">For Learners</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Any course purchase is final after validation of the Mobile Money or bank transaction.
                        </p>
                      </div>
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <h4 className="font-extrabold text-xs text-zinc-800 dark:text-white uppercase mb-1">For Instructors</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Withdrawals are made after deduction of the service fees corresponding to the active billing plan.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 5. Security & Hosting */}
                <section 
                  id="section-5" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <AlertTriangle className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      5. Security &amp; Hosting
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    ANSELLA deploys encryption systems and secure video players to minimize the illegal downloading of your courses. However, the instructor understands that zero risk on the Internet does not exist and releases ANSELLA from any liability in the event of external hacking beyond our standard control.
                  </p>
                </section>

                {/* 6. Termination */}
                <section 
                  id="section-6" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <HelpCircle className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      6. Termination
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    We reserve the right to suspend or permanently close the account of any instructor or learner in cases of flagrant violation of these terms, attempted payment fraud, or repeated reporting of illegal content.
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
