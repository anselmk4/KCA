import Image from "next/image";
import { Smartphone, CreditCard, Globe, Users } from "lucide-react";

const integrations = [
  {
    icon: <Smartphone className="h-7 w-7 text-green-400" />,
    title: "Mobile Money",
    desc: "Airtel Money, M-Pesa, Orange Money — encaissez en quelques secondes.",
    bg: "bg-green-950/50 border-green-500/20"
  },
  {
    icon: <CreditCard className="h-7 w-7 text-blue-400" />,
    title: "Cartes bancaires",
    desc: "Visa, Mastercard et paiements locaux intégrés nativement.",
    bg: "bg-blue-950/50 border-blue-500/20"
  },
  {
    icon: <Globe className="h-7 w-7 text-purple-400" />,
    title: "Multi-langues & Devises",
    desc: "Français, Lingala, Swahili — CDF, USD, EUR supportés.",
    bg: "bg-purple-950/50 border-purple-500/20"
  },
  {
    icon: <Users className="h-7 w-7 text-orange-400" />,
    title: "Communauté Africaine",
    desc: "Rejoignez des milliers d'instructeurs à travers toute l'Afrique.",
    bg: "bg-orange-950/50 border-orange-500/20"
  }
];

export function InfoRDC() {
  return (
    <section className="py-24 bg-gradient-to-b from-black to-blue-950 text-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Optimisé pour la RDC et l'Afrique</h2>
          <p className="text-lg md:text-xl text-blue-200">
            ANSELLA intègre les solutions de paiement locales, les langues africaines et les outils numériques adaptés aux réalités du continent.
          </p>
        </div>

        {/* Image principale */}
        <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(37,99,235,0.2)] mb-12 relative aspect-[16/7]">
          <Image
            src="/africa-lms-integration.png"
            alt="Intégration numérique africaine — ANSELLA"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-8">
            <span className="text-white font-bold text-xl md:text-2xl">L'Afrique apprend. L'Afrique crée. L'Afrique grandit.</span>
          </div>
        </div>

        {/* Cards intégration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {integrations.map((item, i) => (
            <div key={i} className={`rounded-2xl p-6 border backdrop-blur-sm ${item.bg} flex flex-col gap-3`}>
              <div className="mb-1">{item.icon}</div>
              <h3 className="font-bold text-base">{item.title}</h3>
              <p className="text-sm text-zinc-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full bg-blue-600 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full bg-purple-600 blur-[120px]"></div>
      </div>
    </section>
  );
}
