"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Comment mes apprenants payent-ils mes formations ?",
    a: "Vos apprenants peuvent acheter vos cours en utilisant les moyens de paiement locaux les plus populaires en Afrique : Airtel Money, M-Pesa, Orange Money, ainsi que par carte bancaire (Stripe) et PayPal."
  },
  {
    q: "Comment puis-je retirer les revenus générés par mes ventes ?",
    a: "Vous pouvez initier des retraits de vos gains accumulés à tout moment directement vers votre compte Mobile Money (Airtel, M-Pesa, Orange), PayPal ou par virement bancaire depuis votre tableau de bord instructeur."
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
    <section className="py-24 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Questions fréquentes</h2>
          <p className="text-lg text-muted-foreground">
            Tout ce que vous devez savoir pour lancer et gérer votre académie avec Kuettu Pro.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="font-semibold text-zinc-900 dark:text-white pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-zinc-600 dark:text-zinc-400 leading-relaxed animate-in fade-in slide-in-from-top-1">
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
