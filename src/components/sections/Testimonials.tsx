"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Star } from "lucide-react";

export function Testimonials() {
  const { language } = useLanguage();

  const reviews = [
    {
      name: "Pr. Dieudonné Mwamba",
      role: language === "en" ? "Fintech & Web3 Instructor, Kinshasa (DRC)" : "Formateur Fintech & Web3, Kinshasa (RDC)",
      text: language === "en"
        ? "Thanks to ANSELLA, I launched my Web3 academy and sold my PDF guides without coding. My learners across Kinshasa and Lubumbashi pay instantly via M-Pesa and Airtel Money. My revenue tripled in 3 months."
        : "Grâce à ANSELLA, j'ai lancé mon académie Web3 et mes guides PDF sans coder. Mes apprenants à Kinshasa et Lubumbashi règlent instantanément par M-Pesa et Airtel Money. Mes revenus ont triplé en 3 mois.",
      rating: 5,
      academy: "Kinshasa Web3 Institute",
      location: "Kinshasa, RDC"
    },
    {
      name: "Amina Diallo",
      role: language === "en" ? "Generative AI Trainer & E-book Author, Dakar" : "Formatrice IA & Auteure d'E-books, Dakar (Sénégal)",
      text: language === "en"
        ? "Selling my practical AI guides and prompt collections is frictionless. With seamless Mobile Money and PayPal checkout, over 300 students purchased and downloaded my guides instantly."
        : "La vente de mes guides pratiques d'IA et mes templates est d'une simplicité totale. Avec le paiement fluide par Mobile Money et PayPal, plus de 300 étudiants ont acheté et téléchargé mes ressources en quelques secondes.",
      rating: 5,
      academy: "Dakar AI Lab & EdTech",
      location: "Dakar, Sénégal"
    },
    {
      name: "Koffi Mensah",
      role: language === "en" ? "DeFi Lecturer & Content Creator, Abidjan" : "Enseignant DeFi & Créateur de Contenu, Abidjan (Côte d'Ivoire)",
      text: language === "en"
        ? "My students receive automated verified certificates and instant access to my technical PDF manuals. Payouts directly to my Mobile Money and crypto wallet happen smoothly without bank hurdles."
        : "Mes étudiants reçoivent des certificats vérifiés et accèdent immédiatement à mes manuels PDF. Les retraits de mes commissions vers mon compte Mobile Money et portefeuille crypto se font instantanément et sans tracas bancaires.",
      rating: 5,
      academy: "Ivoire Crypto Academy",
      location: "Abidjan, Côte d'Ivoire"
    }
  ];

  return (
    <section className="py-24 bg-white/40 dark:bg-zinc-950/20 border-t border-zinc-200 dark:border-zinc-900">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-400/10 border border-yellow-200 dark:border-yellow-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest inline-block mb-4">
            {language === "en" ? "Testimonials" : "Témoignages"}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-zinc-900 dark:text-white">
            {language === "en" ? "They Succeed with ANSELLA" : "Ils réussissent avec ANSELLA"}
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {language === "en"
              ? "Discover testimonials from trainers and professors managing their online academies from A to Z."
              : "Découvrez les témoignages de formateurs et professeurs qui gèrent leurs académies en ligne de A à Z."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white/60 dark:bg-zinc-900/40 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 flex flex-col hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>

              <p className="text-zinc-700 dark:text-zinc-300 mb-6 flex-1 leading-relaxed text-sm">
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                    {review.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-900 dark:text-white text-sm truncate">{review.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{review.role}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/50 px-2.5 py-1 rounded-full shrink-0">
                  {review.academy}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
