import { Check } from "lucide-react";
import Link from "next/link";

export function Pricing() {
  const plans = [
    {
      name: "Plan Free",
      price: "0$",
      unit: "/ mois",
      description: "Parfait pour lancer votre académie et valider vos premiers cours auprès d'un petit groupe d'apprenants.",
      features: [
        "1 cours actif maximum",
        "Jusqu'à 15 apprenants inscrits",
        "Quiz de validation simples",
        "Encaissement Mobile Money & Carte",
        "Frais de transaction : 50%",
        "Support communautaire"
      ],
      popular: false,
      buttonText: "Commencer gratuitement",
      href: "/register?plan=free"
    },
    {
      name: "Plan Base",
      price: "19$",
      unit: "/ mois",
      description: "Pour les créateurs sérieux qui lancent leur académie.",
      features: [
        "Jusqu'à 3 cours actifs",
        "Jusqu'à 50 apprenants inscrits",
        "Quiz de validation simples",
        "Encaissement Mobile Money & Carte",
        "Frais de transaction : 10%",
        "Support par email"
      ],
      popular: false,
      buttonText: "Démarrer avec le Plan Base",
      href: "/register?plan=base"
    },
    {
      name: "Plan Pro",
      price: "49$",
      unit: "/ mois",
      description: "La solution idéale pour les formateurs professionnels et les académies en croissance.",
      features: [
        "Jusqu'à 10 cours actifs",
        "Jusqu'à 200 apprenants inscrits",
        "Quiz et examens illimités",
        "Certificats de réussite automatisés",
        "Frais de transaction réduits : 5%",
        "Support prioritaire sous 24h"
      ],
      popular: true,
      buttonText: "Démarrer avec le Plan Pro",
      href: "/register?plan=pro"
    },
    {
      name: "Plan Max",
      price: "200$",
      unit: "/ mois",
      description: "Pour les grandes académies et les écoles de formation exigeant une puissance et un accompagnement sans limites.",
      features: [
        "Cours en ligne illimités",
        "Apprenants illimités",
        "Quiz, examens et diplômes illimités",
        "0% de frais de transaction",
        "Nom de domaine personnalisé (ex: ecole.com)",
        "Gestionnaire de compte dédié & WhatsApp"
      ],
      popular: false,
      buttonText: "Activer le Plan Max",
      href: "/register?plan=max"
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-black text-white border-t border-white/10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Des Tarifs Transparents et Adaptés</h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Choisissez le forfait qui correspond au niveau de développement de votre académie. Annulez ou changez de plan à tout moment.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative bg-zinc-900/50 backdrop-blur-sm rounded-3xl p-8 border flex flex-col h-full transition-all duration-300 hover:-translate-y-2 ${
                plan.popular 
                  ? 'border-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.15)]' 
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 text-sm font-bold rounded-full shadow-lg">
                  Recommandé
                </div>
              )}
              <div className="mb-8 mt-4">
                <h3 className="text-2xl font-bold mb-3">{plan.name}</h3>
                <p className="text-zinc-400 text-sm min-h-[60px]">{plan.description}</p>
              </div>
              <div className="mb-8 pb-8 border-b border-white/10">
                <div className="flex items-baseline">
                  <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-zinc-400 text-lg ml-2">{plan.unit}</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link 
                href={plan.href}
                className={`w-full py-4 px-4 rounded-xl font-bold transition-all mt-auto text-center ${
                  plan.popular 
                    ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/25' 
                    : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
              >
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
