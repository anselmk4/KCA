"use client";

import { useState } from "react";
import { Check, Star, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export function Pricing() {
  const { language } = useLanguage();

  const isEn = language === "en";

  const rawPlans = [
    {
      id: "free",
      name: isEn ? "Plan Free" : "Plan Free",
      monthlyPrice: 0,
      description: isEn 
        ? "Perfect for launching your academy and validating your first courses with a small group of learners."
        : "Parfait pour lancer votre académie et valider vos premiers cours auprès d'un petit groupe d'apprenants.",
      features: isEn ? [
        "1 active course maximum",
        "Up to 15 enrolled learners",
        "Simple validation quizzes",
        "Mobile Money & Card payment",
        "Transaction fee: 20%",
        "Community support"
      ] : [
        "1 cours actif maximum",
        "Jusqu'à 15 apprenants inscrits",
        "Quiz de validation simples",
        "Encaissement Mobile Money & Carte",
        "Frais de transaction : 20%",
        "Support communautaire"
      ],
      popular: false,
      buttonText: isEn ? "Start for free" : "Commencer gratuitement",
      glowColor: "group-hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] group-hover:border-teal-500/50"
    },
    {
      id: "base",
      name: isEn ? "Plan Base" : "Plan Base",
      monthlyPrice: 19,
      description: isEn 
        ? "For serious creators launching their academy."
        : "Pour les créateurs sérieux qui lancent leur académie.",
      features: isEn ? [
        "Up to 3 active courses",
        "Up to 50 enrolled learners",
        "✨ AI Homework Auto-Grader included",
        "🛡️ AI Retention Guard (Anti-Drop-out Relance)",
        "Simple validation quizzes",
        "Mobile Money & Card payment",
        "Transaction fee: 10%",
        "Email support"
      ] : [
        "Jusqu'à 3 cours actifs",
        "Jusqu'à 50 apprenants inscrits",
        "✨ Auto-Grader & Correction Devoirs par IA",
        "🛡️ AI Retention Guard (Relance Anti-Décrochage)",
        "Quiz de validation simples",
        "Encaissement Mobile Money & Carte",
        "Frais de transaction : 10%",
        "Support par email"
      ],
      popular: false,
      buttonText: isEn ? "Get started with Base" : "Démarrer avec le Plan Base",
      glowColor: "group-hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] group-hover:border-indigo-500/50"
    },
    {
      id: "pro",
      name: isEn ? "Plan Pro" : "Plan Pro",
      monthlyPrice: 49,
      description: isEn 
        ? "The ideal solution for professional instructors and growing academies."
        : "La solution idéale pour les formateurs professionnels et les académies en croissance.",
      features: isEn ? [
        "Up to 10 active courses",
        "Up to 200 enrolled learners",
        "✨ AI Evaluation Copilot & Auto-Grader",
        "🛡️ AI Retention Guard & Proactive Follow-up",
        "Unlimited quizzes and exams",
        "Automated achievement certificates",
        "Reduced transaction fee: 5%",
        "Priority 24h support"
      ] : [
        "Jusqu'à 10 cours actifs",
        "Jusqu'à 200 apprenants inscrits",
        "✨ Copilot IA d'Évaluation & Auto-Grader inclus",
        "🛡️ AI Retention Guard (Détection Décrochage IA)",
        "Quiz et examens illimités",
        "Certificats de réussite automatisés",
        "Frais de transaction réduits : 5%",
        "Support prioritaire sous 24h"
      ],
      popular: true,
      buttonText: isEn ? "Get started with Pro" : "Démarrer avec le Plan Pro",
      glowColor: "shadow-[0_0_30px_rgba(20,184,166,0.1)] border-teal-500/80 bg-[#09101f]/60"
    },
    {
      id: "max",
      name: isEn ? "Plan Max" : "Plan Max",
      monthlyPrice: 200,
      description: isEn 
        ? "For large academies and training schools requiring unlimited power and dedicated support."
        : "Pour les grandes académies et les écoles de formation exigeant une puissance et un accompagnement sans limites.",
      features: isEn ? [
        "Unlimited online courses",
        "Unlimited learners",
        "Unlimited quizzes, exams and certificates",
        "0% transaction fee",
        "Custom domain name (e.g. school.com)",
        "Dedicated account manager & WhatsApp"
      ] : [
        "Cours en ligne illimités",
        "Apprenants illimités",
        "Quiz, examens et diplômes illimités",
        "0% de frais de transaction",
        "Nom de domaine personnalisé (ex: ecole.com)",
        "Gestionnaire de compte dédié & WhatsApp"
      ],
      popular: false,
      buttonText: isEn ? "Activate Plan Max" : "Activer le Plan Max",
      glowColor: "group-hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] group-hover:border-pink-500/50"
    }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section id="pricing" className="py-32 bg-transparent text-zinc-900 dark:text-white border-t border-zinc-200 dark:border-zinc-900 relative overflow-hidden">
      {/* Visual background lights */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 relative z-10 max-w-6xl">
        
        {/* Title & description */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 space-y-4"
        >
          <span className="text-xs font-bold text-teal-400 bg-teal-400/10 border border-teal-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest">
            {isEn ? "Pricing" : "Tarification"}
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            {isEn ? "Transparent & Adapted " : "Des Tarifs Transparents "}
            <span className="bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
              {isEn ? "Pricing" : "et Adaptés"}
            </span>
          </h2>
          <p className="text-base text-zinc-650 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {isEn 
              ? "Choose the plan that matches your academy's development stage."
              : "Choisissez le forfait qui correspond au niveau de développement de votre académie."}
          </p>
        </motion.div>
        
        {/* Plans list */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {rawPlans.map((plan, index) => {
            return (
              <motion.div 
                key={index} 
                variants={itemVariants}
                className={`group relative rounded-3xl p-8 border flex flex-col h-full bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md transition-all duration-300 ${
                  plan.popular 
                    ? plan.glowColor
                    : 'border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10 ' + plan.glowColor
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-500 text-zinc-950 px-4 py-1 text-xxs font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1">
                    <Star className="w-3 h-3 fill-zinc-950" /> {isEn ? "Recommended" : "Recommandé"}
                  </div>
                )}

                <div className="space-y-4 mb-8">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-teal-400 transition-colors">{plan.name}</h3>
                  
                  <div>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-black text-zinc-900 dark:text-white">${plan.monthlyPrice}</span>
                      <span className="text-xs text-zinc-500 ml-1.5">{isEn ? "/ month" : "/ mois"}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed min-h-[48px]">{plan.description}</p>
                </div>

                {/* Action Button */}
                <div className="mb-8">
                  <Link 
                    href={`/register?plan=${plan.id}`}
                    className={`block w-full py-3.5 px-4 text-center rounded-xl text-xs font-bold transition-all ${
                      plan.popular
                        ? "bg-teal-500 hover:bg-teal-400 text-zinc-950 shadow-md shadow-teal-500/20"
                        : "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-250 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    {plan.buttonText}
                  </Link>
                </div>

                {/* Features List */}
                <ul className="space-y-3.5 mt-auto text-xs text-zinc-600 dark:text-zinc-400">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? "text-teal-400" : "text-zinc-500"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
