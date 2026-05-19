import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

export function WhyChooseUs() {
  const reasons = [
    "Contenu adapté aux réalités africaines.",
    "Mentorat personnalisé par des experts du domaine.",
    "Accès à vie aux mises à jour des cours.",
    "Plateforme intuitive et facile d'utilisation.",
    "Certificats reconnus à la fin de chaque parcours.",
    "Communauté d'entraide et de networking."
  ];

  return (
    <section className="py-24 bg-zinc-950 text-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Pourquoi choisir Kuettu ?
            </h2>
            <p className="text-lg text-zinc-400 mb-10">
              Nous combinons expertise technique et pédagogie éprouvée pour vous offrir la meilleure expérience d'apprentissage. Notre objectif est votre réussite professionnelle et financière.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {reasons.map((reason, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-blue-500 shrink-0 mt-0.5" />
                  <span className="font-medium text-zinc-300">{reason}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-1/2 w-full mt-10 lg:mt-0">
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
              <div className="absolute inset-0 bg-blue-500/20 group-hover:bg-transparent transition-colors z-10 duration-500"></div>
              <Image 
                src="/images/students.png" 
                alt="Étudiants Kuettu Academy" 
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
