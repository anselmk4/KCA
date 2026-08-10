"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GraduationCap, Briefcase, Award, TrendingUp } from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function CasesPage() {
  const cases = [
    {
      icon: <GraduationCap className="h-6 w-6 text-teal-600 dark:text-teal-400" />,
      title: "Écoles & Universités",
      desc: "Digitalisez vos cursus académiques. Offrez aux étudiants un accès permanent aux supports de cours, réalisez des contrôles continus en ligne et publiez les bulletins ou diplômes en un clic.",
      bgGlow: "group-hover:shadow-[0_0_25px_rgba(20,184,166,0.15)] group-hover:border-teal-500/50"
    },
    {
      icon: <Briefcase className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      title: "Entreprises & PME",
      desc: "Formez vos collaborateurs sur site ou à distance. Structurez des parcours de formation internes pour l'onboarding, les règles de conformité ou le développement de compétences techniques.",
      bgGlow: "group-hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/50"
    },
    {
      icon: <Award className="h-6 w-6 text-indigo-650 dark:text-indigo-400" />,
      title: "Créateurs de Contenu & Influenceurs",
      desc: "Monétisez votre audience grâce à votre savoir. Vendez des Masterclasses, créez des académies privées par abonnement mensuel et encaissez vos revenus directement par Mobile Money.",
      bgGlow: "group-hover:shadow-[0_0_25px_rgba(99,102,241,0.15)] group-hover:border-indigo-500/50"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-pink-500 dark:text-pink-400" />,
      title: "ONG & Formations Professionnelles",
      desc: "Diffusez des programmes de formation certifiants à grand impact. Suivez en temps réel la progression des bénéficiaires et collectez des statistiques détaillées sur les taux de réussite.",
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
        {/* Decorative background blur lights */}
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
            <span className="inline-flex items-center rounded-full border border-teal-500/20 px-3.5 py-1.5 text-xs font-bold text-teal-500 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 backdrop-blur-md">
              Cas d&apos;utilisation
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-6 text-zinc-900 dark:text-white leading-tight">
              Des solutions adaptées à{" "}
              <span className="bg-gradient-to-r from-teal-500 via-teal-450 to-indigo-500 dark:from-teal-400 dark:to-indigo-400 bg-clip-text text-transparent">chaque secteur d&apos;activité.</span>
            </h1>
            <p className="text-base text-zinc-650 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Découvrez comment ANSELLA est déployée pour propulser l&apos;éducation, la formation professionnelle et la monétisation du savoir.
            </p>
          </motion.div>

          {/* Cards Grid */}
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
                {/* Glow backdrop inside the card on hover */}
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
