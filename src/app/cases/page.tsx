"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GraduationCap, Briefcase, Award, TrendingUp } from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function CasesPage() {
  const cases = [
    {
      icon: <GraduationCap className="h-6 w-6 text-teal-600 dark:text-teal-400" />,
      title: "Schools & Universities",
      desc: "Digitize your academic curricula. Give students permanent access to course materials, conduct continuous online assessments, and publish transcripts or diplomas in one click.",
      bgGlow: "group-hover:shadow-[0_0_25px_rgba(20,184,166,0.15)] group-hover:border-teal-500/50"
    },
    {
      icon: <Briefcase className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      title: "Businesses & SMEs",
      desc: "Train your employees on-site or remotely. Structure internal training paths for onboarding, compliance rules, or the development of technical skills.",
      bgGlow: "group-hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/50"
    },
    {
      icon: <Award className="h-6 w-6 text-indigo-650 dark:text-indigo-400" />,
      title: "Content Creators & Influencers",
      desc: "Monetize your audience through your knowledge. Sell Masterclasses, create private monthly subscription academies, and collect your revenue directly via Mobile Money.",
      bgGlow: "group-hover:shadow-[0_0_25px_rgba(99,102,241,0.15)] group-hover:border-indigo-500/50"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-pink-500 dark:text-pink-400" />,
      title: "NGOs & Professional Training",
      desc: "Deliver high-impact certified training programs. Monitor beneficiary progress in real time and collect detailed statistics on success rates.",
      bgGlow: "group-hover:shadow-[0_0_25px_rgba(236,72,153,0.15)] group-hover:border-pink-500/50"
    }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-slate-100 via-teal-50/50 to-blue-50/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white selection:bg-teal-500/30">
      <Navbar />
      <main className="flex-1 py-28 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-96 h-96 bg-teal-500/5 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-[110px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center mb-20 space-y-4"
          >
            <span className="inline-flex items-center rounded-full border border-teal-500/20 px-3.5 py-1.5 text-xs font-bold text-teal-500 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 backdrop-blur-md">
              Use Cases
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-6 text-zinc-900 dark:text-white leading-tight">
              Solutions tailored to{" "}
              <span className="bg-gradient-to-r from-teal-500 via-teal-450 to-indigo-500 dark:from-teal-400 dark:to-indigo-400 bg-clip-text text-transparent">every industry.</span>
            </h1>
            <p className="text-base text-zinc-650 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Discover how ANSELLA is deployed to propel education, professional training, and knowledge monetization.
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          >
            {cases.map((item, index) => (
              <motion.div 
                key={index} 
                variants={itemVariants}
                className={`group relative bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md border border-zinc-200 dark:border-zinc-850 rounded-3xl p-8 transition-all duration-300 flex flex-col items-start gap-5 overflow-hidden text-left ${item.bgGlow}`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 group-hover:border-teal-500/30 transition-colors">
                  {item.icon}
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-teal-400 transition-colors">{item.title}</h2>
                <p className="text-zinc-650 dark:text-zinc-400 leading-relaxed text-xs md:text-sm">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
