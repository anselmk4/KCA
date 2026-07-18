"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Target, TrendingUp, Users } from "lucide-react";

export function ValueProposition() {
  const { language } = useLanguage();

  const values = [
    {
      icon: <Target className="h-10 w-10 text-teal-600 dark:text-teal-400" />,
      bg: "bg-teal-50 dark:bg-teal-900/20",
      title: language === "en" ? "Simplified Monetization" : "Monétisation Simplifiée",
      description: language === "en" 
        ? "Collect course enrollments via Mobile Money, credit cards, or PayPal — wherever you are in the world." 
        : "Encaissez les inscriptions à vos cours via Mobile Money, Cartes bancaires ou PayPal — où que vous soyez dans le monde."
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />,
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      title: language === "en" ? "Control & Flexibility" : "Contrôle et Flexibilité",
      description: language === "en" 
        ? "Set your own prices, manage discount coupons, and keep up to 100% of your earnings without middle-men." 
        : "Fixez vos propres prix, gérez vos coupons de réduction et gardez jusqu'à 100% de vos revenus sans intermédiaires."
    },
    {
      icon: <Users className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />,
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      title: language === "en" ? "Advanced Pedagogy" : "Pédagogie Avancée",
      description: language === "en" 
        ? "Engage your students with interactive quizzes, downloadable materials, and automated certificates of completion." 
        : "Engagez vos élèves avec des quiz interactifs, des supports téléchargeables et des certificats de réussite automatisés."
    }
  ];

  return (
    <section className="py-24 bg-white/40 dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-zinc-900">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-400/10 border border-teal-200 dark:border-teal-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest inline-block mb-4">
            {language === "en" ? "Value Proposition" : "Valeur Ajoutée"}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-zinc-900 dark:text-white">
            {language === "en" ? "Our Value Proposition" : "Notre Proposition de Valeur"}
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {language === "en" 
              ? "ANSELLA empowers trainers worldwide to share their knowledge globally." 
              : "ANSELLA donne aux formateurs du monde entier le pouvoir de diffuser leur savoir à l'échelle mondiale."}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div key={index} className="bg-white/60 dark:bg-zinc-950/40 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg transition-all duration-300 group">
              <div className={`mb-6 ${value.bg} w-16 h-16 rounded-2xl flex items-center justify-center border border-zinc-200 dark:border-white/5 group-hover:scale-105 transition-transform`}>
                {value.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">{value.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
