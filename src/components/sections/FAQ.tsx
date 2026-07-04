"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Comment mes apprenants payent-ils mes formations ?",
    a: "Vos apprenants peuvent acheter vos cours en utilisant les moyens de paiement les plus populaires : Mobile Money (Airtel Money, M-Pesa, Orange Money), carte bancaire (Stripe) et PayPal — disponibles à l'international."
  },
  {
    q: "Comment puis-je retirer les revenus générés par mes ventes ?",
    a: "Vous pouvez initier des retraits de vos gains à tout moment directement vers votre compte Mobile Money, PayPal ou par virement bancaire depuis votre tableau de bord instructeur."
  },
  {
    q: "Quelles sont les limites du Plan Free ?",
    a: "Le Plan Free est gratuit à vie. Il vous permet de créer 1 cours actif et d'inscrire jusqu'à 15 apprenants simultanément. C'est parfait pour valider votre concept avant de passer aux forfaits supérieurs."
  },
  {
    q: "Puis-je changer d'abonnement ou résilier à tout moment ?",
    a: "Absolument. Vous pouvez passer d'un forfait à l'autre (par exemple, de Free à Pro) ou résilier votre abonnement à tout moment directement depuis la page 'Abonnement' de votre espace de gestion."
  },
  {
    q: "Puis-je personnaliser les certificats de réussite ?",
    a: "Oui. À partir du Plan Pro, la plateforme génère automatiquement des certificats de réussite personnalisés à l'image de votre marque / académie dès qu'un élève valide 100% de sa formation."
  },
  {
    q: "Est-il possible d'utiliser mon propre nom de domaine ?",
    a: "Oui. Le Plan Max vous permet d'associer votre nom de domaine personnalisé (ex: formation.monnom.com) afin d'offrir une expérience de marque totalement intégrée à vos apprenants."
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-white/40 dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-zinc-900">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3.5 py-1 rounded-full uppercase tracking-widest inline-block mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-zinc-900 dark:text-white">Questions fréquentes</h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Tout ce que vous devez savoir pour lancer et gérer votre académie avec ANSELLA.
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
