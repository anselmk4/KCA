import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

export function WhyChooseUs() {
  const reasons = [
    "Aucune compétence technique requise pour démarrer.",
    "Paiements locaux et internationaux intégrés nativement.",
    "Statistiques en temps réel sur vos ventes et inscriptions.",
    "Diplômes et QCM automatisés pour vos élèves.",
    "Forfait gratuit disponible pour tester vos cours.",
    "Sécurité maximale de vos données et de vos gains."
  ];

  return (
    <section className="py-24 bg-transparent border-t border-zinc-200 dark:border-zinc-900 text-zinc-900 dark:text-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-400/10 border border-indigo-200 dark:border-indigo-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest inline-block mb-6">
              Pourquoi nous choisir
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-zinc-900 dark:text-white">
              Pourquoi choisir ANSELLA ?
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed">
              Nous combinons une technologie de pointe et une compréhension approfondie des besoins mondiaux pour vous aider à développer votre activité d&apos;enseignement en ligne en toute sérénité.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {reasons.map((reason, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">{reason}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-1/2 w-full mt-10 lg:mt-0">
            <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/10 group">
              <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 group-hover:bg-transparent transition-colors z-10 duration-500"></div>
              <Image 
                src="/images/students.png" 
                alt="Dashboard et analytics ANSELLA" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
