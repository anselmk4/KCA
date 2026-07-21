"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Star, HelpCircle, ShieldCheck, CreditCard, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PricingPage() {
  const rawPlans = [
    {
      id: "free",
      name: "Plan Free",
      monthlyPrice: 0,
      description: "Parfait pour lancer votre académie et valider vos premiers cours auprès d'un petit groupe d'apprenants.",
      features: [
        "1 cours actif maximum",
        "Jusqu'à 15 apprenants inscrits",
        "Quiz de validation simples",
        "Encaissement Mobile Money & Carte",
        "Frais de transaction : 20%",
        "Support communautaire"
      ],
      popular: false,
      buttonText: "Commencer gratuitement",
      colorClass: "text-teal-400"
    },
    {
      id: "base",
      name: "Plan Base",
      monthlyPrice: 19,
      description: "Pour les créateurs sérieux qui lancent leur académie.",
      features: [
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
      buttonText: "Démarrer avec le Plan Base",
      colorClass: "text-indigo-400"
    },
    {
      id: "pro",
      name: "Plan Pro",
      monthlyPrice: 49,
      description: "La solution idéale pour les formateurs professionnels et les académies en croissance.",
      features: [
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
      buttonText: "Démarrer avec le Plan Pro",
      colorClass: "text-teal-400"
    },
    {
      id: "max",
      name: "Plan Max",
      monthlyPrice: 200,
      description: "Pour les grandes académies et les écoles de formation exigeant une puissance et un accompagnement sans limites.",
      features: [
        "Cours en ligne illimités",
        "Apprenants illimités",
        "✨ Auto-Grader & Copilot IA illimité",
        "🛡️ AI Retention Guard & Relance Auto illimitée",
        "Quiz, examens et diplômes illimités",
        "0% de frais de transaction",
        "Nom de domaine personnalisé (ex: ecole.com)",
        "Gestionnaire de compte dédié & WhatsApp"
      ],
      popular: false,
      buttonText: "Activer le Plan Max",
      colorClass: "text-pink-400"
    }
  ];

  const faqs = [
    {
      q: "Comment fonctionnent les retraits par Mobile Money ?",
      a: "Dès qu'un étudiant achète votre cours, le solde s'ajoute à votre compte instructeur Ansella. Vous pouvez ensuite demander un transfert vers M-Pesa, Orange Money ou Airtel Money directement depuis votre espace de facturation."
    },
    {
      q: "Y a-t-il des frais d'inscription ou d'installation ?",
      a: "Absolument aucun. Vous pouvez configurer votre compte de formateur Ansella entièrement gratuitement. Pour le plan Free, nous ne percevons des frais que sur les transactions réussies."
    },
    {
      q: "Puis-je changer de forfait ou annuler à tout moment ?",
      a: "Oui, Ansella est sans engagement de durée. Vous pouvez surclasser, déclasser votre formule d'abonnement ou résilier l'abonnement mensuel directement depuis les paramètres de facturation."
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
              Tarification
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-zinc-900 dark:text-white">
              Forfaits simples,{" "}
              <span className="bg-gradient-to-r from-teal-500 via-teal-450 to-indigo-500 dark:from-teal-400 dark:to-indigo-400 bg-clip-text text-transparent">
                sans mauvaise surprise.
              </span>
            </h1>
            <p className="text-lg text-zinc-650 dark:text-zinc-400">
              Choisissez le plan parfait pour le niveau de développement de votre académie.
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
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-500 text-zinc-950 px-4 py-1 text-xxs font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1">
                      <Star className="w-3 h-3 fill-zinc-950" /> Recommandé
                    </div>
                  )}

                  <div className="space-y-4 mb-8 text-left">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-teal-500 dark:group-hover:text-teal-450 transition-colors">{plan.name}</h3>
                    
                    <div>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-black text-zinc-900 dark:text-white">${plan.monthlyPrice}</span>
                        <span className="text-xs text-zinc-500 ml-1.5">/ mois</span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed min-h-[48px]">{plan.description}</p>
                  </div>

                  <div className="mb-8">
                    <Link 
                      href={`/register?plan=${plan.id}`}
                      className={`block w-full py-3.5 px-4 text-center rounded-xl text-xs font-bold transition-all ${
                        plan.popular
                          ? "bg-teal-500 hover:bg-teal-450 text-zinc-950 shadow-md shadow-teal-500/20"
                          : "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-250 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      {plan.buttonText}
                    </Link>
                  </div>

                  <ul className="space-y-3.5 mt-auto text-xs text-zinc-600 dark:text-zinc-400 text-left">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? "text-teal-500 dark:text-teal-400" : "text-zinc-500"}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Secure Payment Badges */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 bg-white/40 dark:bg-zinc-950/20 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-around gap-6 text-sm text-zinc-650 dark:text-zinc-400">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-teal-500 dark:text-teal-400" />
              <span>Garantie de sécurité internationale</span>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-teal-500 dark:text-teal-400" />
              <span>Facturation souple (Mensuelle ou Annuelle -10%)</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-teal-500 dark:text-teal-400" />
              <span>Retraits Mobile Money directs</span>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto space-y-8 pt-8">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-zinc-900 dark:text-white">Foire Aux Questions</h2>
            <div className="grid grid-cols-1 gap-6 text-left">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white/40 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 space-y-2">
                  <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" />
                    {faq.q}
                  </h3>
                  <p className="text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed pl-6">{faq.a}</p>
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
