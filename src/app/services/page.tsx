import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ShieldCheck, MessageCircle, Landmark, BookOpen } from "lucide-react";

export default function ServicesPage() {
  const services = [
    {
      icon: <BookOpen className="h-10 w-10 text-blue-500" />,
      title: "Hébergement & LMS Clé en Main",
      desc: "Déployez votre académie en ligne en 5 minutes. Profitez de nos lecteurs vidéos hautement sécurisés, de nos systèmes de leçons interactives et du suivi de progression de vos élèves."
    },
    {
      icon: <Landmark className="h-10 w-10 text-emerald-500" />,
      title: "Paiements Mobiles Sécurisés",
      desc: "Pas besoin de comptes bancaires compliqués ou de passerelles inaccessibles. Encaissez vos élèves par Airtel Money, M-Pesa, Orange Money ou carte de crédit directement dans toute la RDC."
    },
    {
      icon: <ShieldCheck className="h-10 w-10 text-purple-500" />,
      title: "Quiz & Certificats Automatisés",
      desc: "Validez les acquis de vos étudiants grâce à notre créateur de quiz et générez automatiquement des certificats numériques infalsifiables et téléchargeables en PDF."
    },
    {
      icon: <MessageCircle className="h-10 w-10 text-orange-500" />,
      title: "Accompagnement & Conseil",
      desc: "Notre équipe vous aide à structurer vos modules de formation, à enregistrer vos vidéos et à optimiser vos tunnels de vente pour maximiser vos revenus en Afrique centrale."
    }
  ];

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <Navbar />
      <main className="flex-1 bg-zinc-50 dark:bg-black py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center rounded-full border border-blue-500/30 px-3 py-1 text-sm font-semibold mb-6 text-blue-400 bg-blue-950/50 backdrop-blur-sm">
              Nos Services
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-zinc-900 dark:text-white leading-tight">
              Tout pour créer et monétiser vos formations en Afrique.
            </h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              Des technologies de pointe et un accompagnement local pour propulser votre académie en ligne.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {services.map((service, index) => (
              <div key={index} className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 hover:border-zinc-300 dark:hover:border-white/20 transition-all flex flex-col items-start gap-4">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                  {service.icon}
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{service.title}</h2>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm md:text-base">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
