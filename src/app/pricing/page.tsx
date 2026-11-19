"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Star, HelpCircle, ShieldCheck, CreditCard, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";

export default function PricingPage() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const rawPlans = [
    {
      id: "free",
      name: isEn ? "Free Plan" : "Forfait Gratuit",
      monthlyPrice: 0,
      description: isEn 
        ? "Perfect for launching your academy and validating your first courses with a small group of learners."
        : "Idéal pour lancer votre académie et valider vos premiers cours auprès d'un petit groupe d'apprenants.",
      features: isEn ? [
        "1 active course maximum",
        "Up to 15 enrolled learners",
        "Simple validation quizzes",
        "Mobile Money & Card collection",
        "Transaction fee: 20%",
        "Community support"
      ] : [
        "1 cours actif maximum",
        "Jusqu'à 15 apprenants inscrits",
        "Quiz de validation simples",
        "Paiements Mobile Money & Cartes",
        "Frais de transaction : 20%",
        "Support communautaire"
      ],
      popular: false,
      buttonText: isEn ? "Start for free" : "Commencer gratuitement",
      colorClass: "text-teal-400"
    },
    {
      id: "base",
      name: isEn ? "Base Plan" : "Forfait Base",
      monthlyPrice: 19,
      description: isEn 
        ? "For serious creators launching their academy."
        : "Pour les créateurs sérieux qui développent leur académie.",
      features: isEn ? [
        "Up to 3 active courses",
        "Up to 50 enrolled learners",
        "✨ AI Auto-Grader & Homework Correction",
        "🛡️ AI Retention Guard (Anti-Dropout Follow-up)",
        "📝 AI Quiz & Exam Generator",
        "Mobile Money & Card collection",
        "Transaction fee: 10%",
        "Email support"
      ] : [
        "Jusqu'à 3 cours actifs",
        "Jusqu'à 50 apprenants inscrits",
        "✨ Correction automatique des devoirs par IA",
        "🛡️ IA Anti-Abandon & Relance intelligente",
        "📝 Générateur de quiz et examens par IA",
        "Paiements Mobile Money & Cartes",
        "Frais de transaction : 10%",
        "Support par email prioritaire"
      ],
      popular: false,
      buttonText: isEn ? "Start with the Base Plan" : "Choisir le Forfait Base",
      colorClass: "text-indigo-400"
    },
    {
      id: "pro",
      name: isEn ? "Pro Plan" : "Forfait Pro",
      monthlyPrice: 49,
      description: isEn 
        ? "The ideal solution for professional instructors and growing academies."
        : "La solution idéale pour les formateurs professionnels et académies en expansion.",
      features: isEn ? [
        "Up to 10 active courses",
        "Up to 200 enrolled learners",
        "✨ AI Assessment Copilot & Auto-Grader included",
        "🛡️ AI Retention Guard (AI Dropout Detection)",
        "📝 AI Quiz & Exam Generator",
        "Automated completion certificates",
        "Reduced transaction fee: 5%",
        "Priority support within 24h"
      ] : [
        "Jusqu'à 10 cours actifs",
        "Jusqu'à 200 apprenants inscrits",
        "✨ Copilote pédagogique & correction IA inclus",
        "🛡️ Détection préventive du décrochage par IA",
        "📝 Générateur complet de QCM et examens IA",
        "Certificats de complétion automatisés vérifiables",
        "Frais de transaction réduits : 5%",
        "Support prioritaire en moins de 24h"
      ],
      popular: true,
      buttonText: isEn ? "Choose the Pro Plan" : "Choisir le Forfait Pro",
      colorClass: "text-teal-400"
    },
    {
      id: "max",
      name: isEn ? "Max Plan" : "Forfait Max",
      monthlyPrice: 99,
      description: isEn 
        ? "For established schools, high-volume academies, and large training institutes."
        : "Pour les écoles établies, institutions et académies à fort volume d'étudiants.",
      features: isEn ? [
        "Unlimited courses and students",
        "Full AI Copilot Suite (Tutor, Grader, Generator, Guard)",
        "Custom certificates & white-label branding",
        "Teaching assistant management & RBAC",
        "Zero transaction fee (0%)",
        "Dedicated account manager & 24/7 VIP support"
      ] : [
        "Cours et apprenants illimités",
        "Suite IA complète (Tuteur, Correcteur, Générateur, Guard)",
        "Certificats personnalisés & marque blanche",
        "Gestion multi-formateurs & permissions d'équipe",
        "Zéro frais de transaction (0%)",
        "Gestionnaire de compte dédié & support VIP 24/7"
      ],
      popular: false,
      buttonText: isEn ? "Activate the Max Plan" : "Activer le Forfait Max",
      colorClass: "text-pink-400"
    }
  ];

  const faqs = [
    {
      q: isEn 
        ? "How do Mobile Money withdrawals work?" 
        : "Comment fonctionnent les retraits par Mobile Money ?",
      a: isEn 
        ? "As soon as a student purchases your course, the balance is added to your Ansella instructor account. You can then request a transfer to M-Pesa, Orange Money, or Airtel Money directly from your billing dashboard."
        : "Dès qu'un étudiant achète votre cours, le solde est crédité sur votre compte formateur Ansella. Vous pouvez ensuite demander un virement vers M-Pesa, Orange Money, Airtel Money ou Wave directement depuis votre tableau de bord."
    },
    {
      q: isEn 
        ? "Are there any signup or setup fees?" 
        : "Y a-t-il des frais d'inscription ou d'installation ?",
      a: isEn 
        ? "Absolutely none. You can set up your Ansella instructor account entirely for free. For the Free plan, we only charge fees on successful transactions."
        : "Absolument aucun. La création de votre compte formateur est 100% gratuite. Sur le forfait gratuit, vous ne payez des frais que sur les ventes effectivement réalisées."
    },
    {
      q: isEn 
        ? "Can I change my plan or cancel at any time?" 
        : "Puis-je changer de forfait ou annuler à tout moment ?",
      a: isEn 
        ? "Yes, Ansella has no long-term commitment. You can upgrade, downgrade, or cancel your monthly subscription directly from the billing settings."
        : "Oui, Ansella est sans engagement. Vous pouvez passer à un forfait supérieur, inférieur ou annuler votre abonnement à tout moment depuis vos paramètres de facturation."
    }
  ];

  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-slate-100 via-teal-50/50 to-blue-50/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white selection:bg-teal-500/30">
      <Navbar />
      
      <main className="flex-1 py-20">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-16 relative z-10">
          {/* Title Header */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <span className="text-xs font-bold text-teal-400 bg-teal-400/10 border border-teal-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest">
              {isEn ? "Pricing" : "Tarifs"}
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-zinc-900 dark:text-white">
              {isEn ? "Simple plans, " : "Des forfaits simples, "}
              <span className="bg-gradient-to-r from-teal-500 via-teal-450 to-indigo-500 dark:from-teal-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {isEn ? "no hidden surprises." : "sans mauvaise surprise."}
              </span>
            </h1>
            <p className="text-lg text-zinc-650 dark:text-zinc-400">
              {isEn 
                ? "Choose the perfect plan for your academy's stage of development."
                : "Choisissez le forfait idéal selon l'étape de développement de votre académie."}
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rawPlans.map((plan, index) => {
              return (
                <div 
                  key={index} 
                  className={`group relative rounded-3xl p-8 border flex flex-col h-full bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md transition-all duration-300 ${
                    plan.popular 
                      ? "shadow-[0_0_30px_rgba(20,184,166,0.1)] border-teal-500/80 bg-teal-50/10 dark:bg-[#09101f]/60" 
                      : "border-zinc-200 dark:border-zinc-800/85 hover:border-zinc-300 dark:hover:border-zinc-700/80 hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-500 text-zinc-950 px-4 py-1 text-xs font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-current" /> {isEn ? "Most Popular" : "Plus Populaire"}
                    </div>
                  )}

                  <div className="space-y-4 mb-6">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{plan.name}</h3>
                    <p className="text-xs text-zinc-650 dark:text-zinc-400 min-h-[36px] leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-white">
                        ${plan.monthlyPrice}
                      </span>
                      <span className="text-zinc-500 text-xs font-bold uppercase">
                        {isEn ? "/ month" : "/ mois"}
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="flex-1 space-y-3 mb-8">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {isEn ? "Included in this plan:" : "Inclus dans ce forfait :"}
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                          <Check className="h-4 w-4 text-teal-500 dark:text-teal-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link 
                    href="/register?role=INSTRUCTOR"
                    className={`w-full py-3 px-4 rounded-xl text-center text-xs font-bold transition-all ${
                      plan.popular 
                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 shadow-lg shadow-teal-500/20" 
                        : "bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    {plan.buttonText}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="pt-16 border-t border-zinc-200 dark:border-zinc-850">
            <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                {isEn ? "Frequently Asked Questions" : "Questions Fréquentes"}
              </h2>
              <p className="text-xs text-zinc-650 dark:text-zinc-400">
                {isEn 
                  ? "Everything you need to know about Ansella pricing and payments."
                  : "Tout ce que vous devez savoir sur la facturation et les encaissements avec Ansella."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white/30 dark:bg-zinc-950/30 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm">
                    ?
                  </div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white leading-snug">{faq.q}</h4>
                  <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
