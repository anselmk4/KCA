"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ShieldCheck, MessageCircle, Landmark, BookOpen } from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function ServicesPage() {
  const services = [
    {
      icon: <BookOpen className="h-6 w-6 text-teal-400" />,
      title: "Hébergement & LMS Clé en Main",
      desc: "Déployez votre académie en ligne en 5 minutes. Profitez de nos lecteurs vidéos hautement sécurisés, de nos systèmes de leçons interactives et du suivi de progression de vos élèves.",
      bgGlow: "group-hover:shadow-[0_0_25px_rgba(20,184,166,0.15)] group-hover:border-teal-500/50"
    },
    {
      icon: <Landmark className="h-6 w-6 text-emerald-400" />,
      title: "Paiements Mobiles Sécurisés",
      desc: "Pas besoin de comptes bancaires compliqués ou de passerelles inaccessibles. Encaissez vos élèves par Airtel Money, M-Pesa, Orange Money ou carte de crédit directement dans toute la RDC.",
      bgGlow: "group-hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/50"
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-indigo-450" />,
      title: "Quiz & Certificats Automatisés",
      desc: "Validez les acquis de vos étudiants grâce à notre créateur de quiz et générez automatiquement des certificats numériques infalsifiables et téléchargeables en PDF.",
      bgGlow: "group-hover:shadow-[0_0_25px_rgba(99,102,241,0.15)] group-hover:border-indigo-500/50"
    },
    {
      icon: <MessageCircle className="h-6 w-6 text-pink-400" />,
      title: "Accompagnement & Conseil",
      desc: "Notre équipe vous aide à structurer vos modules de formation, à enregistrer vos vidéos et à optimiser vos tunnels de vente pour maximiser vos revenus en Afrique centrale.",
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
        {/* Decorative background glows */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-teal-500/5 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-[110px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          
          {/* Header section with scroll reveal */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center mb-20 space-y-4"
          >
            <span className="inline-flex items-center rounded-full border border-teal-500/20 px-3.5 py-1.5 text-xs font-bold text-teal-400 bg-teal-950/30 backdrop-blur-md">
              Nos Services
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-6 text-white leading-tight">
              Tout pour créer et monétiser vos{" "}
              <span className="bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">formations en Afrique.</span>
            </h1>
            <p className="text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Des technologies de pointe et un accompagnement local pour propulser votre académie en ligne.
            </p>
          </motion.div>

          {/* Cards Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          >
            {services.map((service, index) => (
              <motion.div 
                key={index} 
                variants={itemVariants}
                className={`group relative bg-zinc-950/40 backdrop-blur-md border border-zinc-850 rounded-3xl p-8 transition-all duration-350 flex flex-col items-start gap-5 overflow-hidden ${service.bgGlow}`}
              >
                {/* Glow backdrop inside the card on hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 group-hover:border-teal-500/30 transition-colors">
                  {service.icon}
                </div>
                <h2 className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors">{service.title}</h2>
                <p className="text-zinc-400 leading-relaxed text-xs md:text-sm">
                  {service.desc}
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
