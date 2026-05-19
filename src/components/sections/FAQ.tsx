"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Quel niveau faut-il pour commencer ?",
    a: "Aucun prérequis. Nos formations sont conçues pour accompagner du débutant absolu jusqu'au niveau avancé, étape par étape."
  },
  {
    q: "Comment se déroule le paiement ?",
    a: "Nous acceptons Stripe (carte bancaire), PayPal et Mobile Money (Airtel Money, M-Pesa, Orange Money). Le paiement est sécurisé et vous accédez immédiatement à vos cours."
  },
  {
    q: "Est-ce que je reçois un certificat ?",
    a: "Oui. Après avoir complété 100% des modules et réussi les QCM, un certificat numérique vérifiable est généré à votre nom."
  },
  {
    q: "Puis-je suivre les cours à mon rythme ?",
    a: "Absolument. Tous les contenus sont accessibles 24h/24. Vous progressez à votre propre vitesse, sans date limite."
  },
  {
    q: "Y a-t-il un accompagnement personnalisé ?",
    a: "Oui. Vous avez accès à un groupe privé Discord/Telegram avec des mentors disponibles pour répondre à vos questions. Le module IA inclut un mentorat 1-on-1."
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
            Tout ce que vous devez savoir avant de rejoindre Kuettu.
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
