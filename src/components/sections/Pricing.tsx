import { Check } from "lucide-react";
import Link from "next/link";

export function Pricing() {
  const plans = [
    {
      name: "Blockchain",
      price: "300$",
      description: "Maîtrisez les concepts fondamentaux et avancés de la technologie blockchain et des registres distribués.",
      features: [
        "Architecture des Blockchains",
        "Smart Contracts (Bases)",
        "Sécurité et Cryptographie",
        "Cas d'usage en Afrique",
        "Certificat de complétion"
      ],
      popular: false,
      buttonText: "S'inscrire au module",
      href: "/register?module=blockchain"
    },
    {
      name: "Crypto-monnaie / Trading",
      price: "500$",
      description: "Devenez un trader rentable avec nos stratégies d'investissement exclusives et d'analyse de marché.",
      features: [
        "Analyse Technique & Fondamentale",
        "Gestion des Risques (Risk Management)",
        "Finance Décentralisée (DeFi)",
        "Psychologie du Trader",
        "Accès au groupe privé de signaux"
      ],
      popular: true,
      buttonText: "S'inscrire au module",
      href: "/register?module=trading"
    },
    {
      name: "Intelligence Artificielle",
      price: "1000$",
      description: "Le parcours élite pour maîtriser l'IA, automatiser vos processus et créer des solutions innovantes.",
      features: [
        "Machine Learning pour débutants",
        "Création d'agents IA (LLMs)",
        "Automatisation de workflows",
        "IA appliquée au Web3",
        "Mentorat 1-on-1 exclusif"
      ],
      popular: false,
      buttonText: "S'inscrire au module",
      href: "/register?module=ai"
    },
    {
      name: "Développement Web3",
      price: "1500$",
      description: "Créez vos propres Smart Contracts et dApps sur Ethereum et d'autres blockchains.",
      features: [
        "Solidity de A à Z",
        "Création de Tokens (ERC-20 & ERC-721)",
        "Développement de dApps",
        "Déploiement sur Testnet & Mainnet",
        "Audit de sécurité des contrats"
      ],
      popular: false,
      buttonText: "S'inscrire au module",
      href: "/register?module=web3"
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-black text-white border-t border-white/10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Tarifs par Module</h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Investissez dans les compétences les plus demandées sur le marché mondial.
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
                  Le plus demandé
                </div>
              )}
              <div className="mb-8 mt-4">
                <h3 className="text-2xl font-bold mb-3">{plan.name}</h3>
                <p className="text-zinc-400 text-sm min-h-[60px]">{plan.description}</p>
              </div>
              <div className="mb-8 pb-8 border-b border-white/10">
                <span className="text-5xl font-extrabold text-white">{plan.price}</span>
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
