"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Image from "next/image";
import { GraduationCap, Award, ShieldCheck, Mail, Phone, MapPin, Send, Loader2, CheckCircle2 } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { supabase } from "@/lib/supabase/client";

export default function AboutPage() {
  const pageVariants: Variants = {
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

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { getDB, saveDB } = await import("@/lib/db");
      const currentDB = getDB();
      const newMsg = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        createdAt: new Date().toISOString(),
        read: false,
      };
      
      currentDB.contactMessages = [...(currentDB.contactMessages || []), newMsg];
      saveDB(currentDB);

      try {
        await supabase.from("support_tickets").insert({
          ticket_number: `CONTACT-${Date.now()}`,
          subject: `[Contact Form] ${form.subject.trim()}`,
          message: `Name: ${form.name.trim()}\nEmail: ${form.email.trim()}\n\nMessage:\n${form.message.trim()}`,
          status: "OPEN",
          user_id: "00000000-0000-0000-0000-000000000000"
        });
      } catch (sbErr) {
        console.warn("Supabase backup contact submit skipped:", sbErr);
      }

      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setError("Error: " + (err.message || "Unable to send your message."));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-slate-100 via-teal-50/50 to-blue-50/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white selection:bg-teal-500/30">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden bg-gradient-to-b from-teal-950/5 dark:from-teal-950/15 via-transparent to-transparent">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="container mx-auto px-4 md:px-8 text-center max-w-4xl relative z-10 space-y-6">
            <motion.span 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center rounded-full border border-teal-500/20 px-4 py-1.5 text-xs font-bold text-teal-500 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 backdrop-blur-md"
            >
              About ANSELLA
            </motion.span>
            
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-zinc-900 dark:text-white"
            >
              Revolutionizing digital education{" "}
              <span className="bg-gradient-to-r from-teal-500 via-teal-450 to-indigo-500 dark:from-teal-400 dark:to-indigo-400 bg-clip-text text-transparent">Worldwide</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-zinc-650 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed"
            >
              A world-class all-in-one LMS platform designed to empower instructors, experts and learners through modern technology.
            </motion.p>
          </div>
        </section>

        {/* Section 1: Founder */}
        <section className="py-24 border-t border-zinc-200 dark:border-zinc-900 bg-white/20 dark:bg-zinc-950/10">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            <motion.div 
              variants={pageVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center"
            >
              <motion.div 
                variants={itemVariants}
                className="lg:col-span-5 relative aspect-square w-full max-w-[400px] mx-auto lg:max-w-none rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white/40 dark:bg-zinc-900/40"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-teal-500/10 to-transparent z-10 pointer-events-none" />
                <Image
                  src="/ceo-ansel-makomo.jpg"
                  alt="Engineer Ansel Makomo – CEO of Kuettu Corporation SARL"
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center rounded-full px-3.5 py-1 text-xxs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border border-teal-500/20">
                  Founder &amp; Visionary
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  Engineer Ansel Makomo
                </h2>
                <p className="text-teal-600 dark:text-teal-400 font-semibold text-base md:text-lg italic">
                  Designer of the ANSELLA platform &amp; CEO of Kuettu Corporation SARL.
                </p>
                <div className="space-y-4 text-zinc-650 dark:text-zinc-400 leading-relaxed text-sm md:text-base">
                  <p>
                    Recognized for his exceptional innovative spirit and pragmatic leadership, <strong>Engineer Ansel Makomo</strong> is the principal architect of ANSELLA. Under his inspired direction within <strong>Kuettu Corporation SARL</strong>, he is shaping the future of educational and financial technology on an international scale.
                  </p>
                  <p>
                    Endowed with remarkable technical expertise and an unmatched vision for societal impact, Engineer Ansel Makomo strives to break down barriers to access cutting-edge knowledge (Blockchain, Web3, Artificial Intelligence). His academic rigor combined with a deep understanding of the realities of the educational sector makes him one of the most visionary technology leaders of his generation.
                  </p>
                  <p>
                    Through ANSELLA, he provides content creators with a robust and sovereign infrastructure, demonstrating that a global and innovative solution can redefine international technology standards.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Section 2: Story & Mission */}
        <section className="py-24 bg-transparent border-t border-zinc-200 dark:border-zinc-900">
          <div className="container mx-auto px-4 md:px-8 max-w-5xl">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white">Our Story &amp; Mission</h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-lg mx-auto">
                Why ANSELLA was created and what major challenge it addresses every day.
              </p>
            </div>

            <motion.div 
              variants={pageVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <motion.div variants={itemVariants} className="bg-white/40 dark:bg-zinc-950/40 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-850 hover:border-teal-500/30 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                  <ShieldCheck className="h-6 w-6 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-bold mb-3 text-zinc-900 dark:text-white">The Problem We Solved</h3>
                <p className="text-zinc-650 dark:text-zinc-400 text-xs md:text-sm leading-relaxed">
                  Many course creators and experts faced major obstacles: the inability to easily integrate local and international payments on Western educational platforms. Learners without standard bank cards or global payment tools were excluded from online knowledge, and instructors could not monetize their expertise flexibly.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-white/40 dark:bg-zinc-950/40 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-850 hover:border-teal-500/30 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6">
                  <GraduationCap className="h-6 w-6 text-teal-650 dark:text-teal-400" />
                </div>
                <h3 className="text-lg font-bold mb-3 text-zinc-900 dark:text-white">Our Solution</h3>
                <p className="text-zinc-650 dark:text-zinc-400 text-xs md:text-sm leading-relaxed">
                  ANSELLA was born to unify online learning and modern digital finance. Designed by Kuettu Corporation SARL, it offers a modern, fluid, secure LMS natively connected to global and local payment services. Now, any instructor can launch their certified academy in minutes and collect their earnings instantly.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Section 3: Contact */}
        <section className="py-24 border-t border-zinc-200 dark:border-zinc-900">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              
              {/* Contact Form */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-white/40 dark:bg-zinc-950/40 p-8 md:p-10 rounded-3xl border border-zinc-200 dark:border-zinc-850 shadow-sm space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Contact Us</h3>
                  <p className="text-zinc-600 dark:text-zinc-500 text-xs md:text-sm mt-1">
                    A question? An academy digitization project? Write to us directly.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {success && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/30 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>Your message has been sent successfully! Our team will get back to you very soon.</span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 text-xs p-4 rounded-xl border border-red-200 dark:border-red-900/30">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-zinc-550 dark:text-zinc-500">Full Name</label>
                      <input
                        type="text"
                        placeholder="E.g. Jean Mukendi"
                        value={form.name}
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20 focus:bg-white dark:focus:bg-zinc-900/60 focus:border-teal-500/50 text-zinc-900 dark:text-white outline-none text-xs transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-zinc-550 dark:text-zinc-500">Email Address</label>
                      <input
                        type="email"
                        placeholder="E.g. jean.m@ansella.app"
                        value={form.email}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20 focus:bg-white dark:focus:bg-zinc-900/60 focus:border-teal-500/50 text-zinc-900 dark:text-white outline-none text-xs transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-zinc-550 dark:text-zinc-500">Subject</label>
                    <input
                      type="text"
                      placeholder="E.g. Academic Partnership"
                      value={form.subject}
                      onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20 focus:bg-white dark:focus:bg-zinc-900/60 focus:border-teal-500/50 text-zinc-900 dark:text-white outline-none text-xs transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-zinc-550 dark:text-zinc-500">Message</label>
                    <textarea
                      rows={5}
                      placeholder="Describe your need..."
                      value={form.message}
                      onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/20 focus:bg-white dark:focus:bg-zinc-900/60 focus:border-teal-500/50 text-zinc-900 dark:text-white outline-none text-xs transition-colors resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-pointer shadow-md shadow-teal-500/10 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>

              {/* Map & Office Info */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex flex-col justify-between gap-8"
              >
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Our Headquarters</h3>
                  <p className="text-zinc-650 dark:text-zinc-400 text-xs md:text-sm leading-relaxed">
                    The ANSELLA and Kuettu Corporation SARL headquarters drives the technological development of the platform for its entire global audience.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-500 dark:text-teal-400 shrink-0">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-white">Address</h4>
                        <p className="text-[11px] text-zinc-550 dark:text-zinc-500 mt-0.5">Bukavu, DRC (International Office)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-white">Email</h4>
                        <p className="text-[11px] text-zinc-550 dark:text-zinc-500 mt-0.5">info@ansella.app</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 col-span-1 sm:col-span-2">
                      <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 dark:text-purple-400 shrink-0">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-white">Phone</h4>
                        <p className="text-[11px] text-zinc-550 dark:text-zinc-500 mt-0.5">+243 990 387 237</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Google Maps Bukavu Iframe */}
                <div className="w-full aspect-video rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm relative min-h-[280px] bg-white dark:bg-zinc-950">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31893.996160897717!2d28.84078601625902!3d-2.5085449767858023!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19c298fe260c6d69%3A0x8ad3cb7f9b8c0a5e!2sBukavu!5e0!3m2!1sen!2scd!4v1717800000000!5m2!1sen!2scd"
                    width="100%"
                    height="100%"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 dark:invert-[90%] dark:hue-rotate-[180deg] dark:brightness-[95%] dark:contrast-[90%]"
                    style={{ border: 0 }}
                  />
                </div>
              </motion.div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
