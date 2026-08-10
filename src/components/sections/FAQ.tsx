"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function FAQ() {
  const { language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: language === "en" ? "How do my students pay for my courses?" : "Comment mes apprenants payent-ils mes formations ?",
      a: language === "en"
        ? "Your students can purchase your courses using the most popular payment methods: Mobile Money (Airtel Money, M-Pesa, Orange Money), Credit Cards (Stripe), and PayPal — available internationally."
        : "Vos apprenants peuvent acheter vos cours en utilisant les moyens de paiement les plus populaires : Mobile Money (Airtel Money, M-Pesa, Orange Money), carte bancaire (Stripe) et PayPal — disponibles à l'international."
    },
    {
      q: language === "en" ? "How can I withdraw the revenue generated from my sales?" : "Comment puis-je retirer les revenus générés par mes ventes ?",
      a: language === "en"
        ? "You can initiate withdrawals of your earnings at any time directly to your Mobile Money account, PayPal, or bank transfer from your instructor dashboard."
        : "Vous pouvez initier des retraits de vos gains à tout moment directement vers votre compte Mobile Money, PayPal ou par virement bancaire depuis votre tableau de bord instructeur."
    },
    {
      q: language === "en" ? "What are the limits of the Free Plan?" : "Quelles sont les limites du Plan Free ?",
      a: language === "en"
        ? "The Free Plan is free forever. It allows you to create 1 active course and enroll up to 15 students simultaneously. Perfect for validating your concept before upgrading."
        : "Le Plan Free est gratuit à vie. Il vous permet de créer 1 cours actif et d'inscrire jusqu'à 15 apprenants simultanément. C'est parfait pour valider votre concept avant de passer aux forfaits supérieurs."
    },
    {
      q: language === "en" ? "Can I change my subscription or cancel at any time?" : "Puis-je changer d'abonnement ou résilier à tout moment ?",
      a: language === "en"
        ? "Absolutely. You can switch between plans (e.g., from Free to Pro) or cancel your subscription at any time directly from the 'Subscription' page of your dashboard."
        : "Absolument. Vous pouvez passer d'un forfait à l'autre (par exemple, de Free à Pro) ou résilier votre abonnement à tout moment directement depuis la page 'Abonnement' de votre espace de gestion."
    },
    {
      q: language === "en" ? "Can I customize the completion certificates?" : "Puis-je personnaliser les certificats de réussite ?",
      a: language === "en"
        ? "Yes. Starting from the Pro Plan, the platform automatically generates custom certificates reflecting your brand/academy as soon as a student completes 100% of their training."
        : "Oui. À partir du Plan Pro, la plateforme génère automatiquement des certificats de réussite personnalisés à l'image de votre marque / académie dès qu'un élève valide 100% de sa formation."
    },
    {
      q: language === "en" ? "Is it possible to use my own domain name?" : "Est-il possible d'utiliser mon propre nom de domaine ?",
      a: language === "en"
        ? "Yes. The Max Plan allows you to link your custom domain (e.g., academy.yourdomain.com) to offer a completely integrated brand experience to your learners."
        : "Oui. Le Plan Max vous permet d'associer votre nom de domaine personnalisé (ex: formation.monnom.com) afin d'offrir une expérience de marque totalement intégrée à vos apprenants."
    }
  ];

  return (
    <section className="py-24 bg-white/40 dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-zinc-900">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-zinc-655 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3.5 py-1 rounded-full uppercase tracking-widest inline-block mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-zinc-900 dark:text-white">
            {language === "en" ? "Frequently Asked Questions" : "Questions fréquentes"}
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {language === "en" 
              ? "Everything you need to know to launch and manage your academy with ANSELLA." 
              : "Tout ce que vous devez savoir pour lancer et gérer votre académie avec ANSELLA."}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white/60 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="font-semibold text-zinc-900 dark:text-white pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm animate-in fade-in slide-in-from-top-1">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
