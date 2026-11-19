"use client";

import { useLanguage } from "@/context/LanguageContext";
import { 
  MobileMoney3DIcon, 
  CreditCard3DIcon, 
  GlobalAnalytics3DIcon, 
  StudentsCommunity3DIcon 
} from "@/components/ui/ImageIcons";

export function InfoRDC() {
  const { language } = useLanguage();

  const integrations = [
    {
      icon: <MobileMoney3DIcon size={48} />,
      title: "Mobile Money",
      desc: language === "en"
        ? "Airtel Money, M-Pesa, Orange Money — collect in seconds from anywhere."
        : "Airtel Money, M-Pesa, Orange Money — encaissez en quelques secondes depuis n'importe où.",
      bg: "bg-teal-50/70 dark:bg-teal-950/40 border-teal-200/80 dark:border-teal-500/20"
    },
    {
      icon: <CreditCard3DIcon size={48} />,
      title: language === "en" ? "Credit Cards" : "Cartes bancaires",
      desc: language === "en"
        ? "Visa, Mastercard, Stripe, and PayPal natively integrated for global reach."
        : "Visa, Mastercard, Stripe et PayPal intégrés nativement pour une portée mondiale.",
      bg: "bg-blue-50/70 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-500/20"
    },
    {
      icon: <GlobalAnalytics3DIcon size={48} />,
      title: language === "en" ? "Multi-language & Currencies" : "Multi-langues & Devises",
      desc: language === "en"
        ? "French, English, Spanish — EUR, USD, GBP and local currencies supported."
        : "Français, Anglais, Espagnol — EUR, USD, GBP et devises locales supportées.",
      bg: "bg-purple-50/70 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-500/20"
    },
    {
      icon: <StudentsCommunity3DIcon size={48} />,
      title: language === "en" ? "Global Community" : "Communauté Mondiale",
      desc: language === "en"
        ? "Join thousands of instructors and learners across the entire globe."
        : "Rejoignez des milliers d'instructeurs et d'apprenants à travers le monde entier.",
      bg: "bg-amber-50/70 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-500/20"
    }
  ];

  return (
    <section className="py-24 bg-white/40 dark:bg-transparent border-t border-zinc-200 dark:border-zinc-900 text-zinc-900 dark:text-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-400/10 border border-teal-200 dark:border-teal-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest inline-block mb-4">
            {language === "en" ? "Integrations" : "Intégrations"}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-zinc-900 dark:text-white">
            {language === "en" ? "Optimized for the Whole World" : "Optimisé pour le monde entier"}
          </h2>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {language === "en"
              ? "ANSELLA integrates local and international payment solutions, languages, and digital tools tailored to the realities of each market."
              : "ANSELLA intègre les solutions de paiement locales et internationales, les langues et les outils numériques adaptés aux réalités de chaque marché."}
          </p>
        </div>

        {/* Cards intégration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {integrations.map((item, i) => (
            <div key={i} className={`rounded-3xl p-6 border backdrop-blur-sm ${item.bg} flex flex-col gap-3 hover:shadow-md transition-all duration-300`}>
              <div className="mb-1">{item.icon}</div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">{item.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 dark:opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full bg-blue-600 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full bg-purple-600 blur-[120px]"></div>
      </div>
    </section>
  );
}
