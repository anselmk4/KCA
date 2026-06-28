"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function CTA() {
  return (
    <section className="relative py-32 overflow-hidden bg-[#030712] text-white border-t border-zinc-900">
      {/* Immersive background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-teal-500/10 to-indigo-500/10 blur-[130px] opacity-80" />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10 text-center max-w-5xl">
        
        {/* Animated icon or badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-8"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
        </motion.div>

        {/* Text with Reveal Animation */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight max-w-4xl mx-auto leading-tight"
        >
          N’attendez plus pour créer votre formation en ligne{" "}
          <span className="bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">simplement.</span>
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Partagez & valorisez votre expertise auprès de ceux qui en ont besoin !
        </motion.p>

        {/* Button Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link
            href="/register"
            className="group relative inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white h-14 px-8 shadow-lg shadow-teal-500/25 overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            Commencer maintenant
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
