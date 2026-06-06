import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GraduationCap, Briefcase, Award, TrendingUp } from "lucide-react";

export default function CasesPage() {
  const cases = [
    {
      icon: <GraduationCap className="h-10 w-10 text-blue-500" />,
      title: "Écoles & Universités",
      desc: "Digitalisez vos cursus académiques. Offrez aux étudiants un accès permanent aux supports de cours, réalisez des contrôles continus en ligne et publiez les bulletins ou diplômes en un clic."
    },
    {
      icon: <Briefcase className="h-10 w-10 text-emerald-500" />,
      title: "Entreprises & PME",
      desc: "Formez vos collaborateurs sur site ou à distance. Structurez des parcours de formation internes pour l'onboarding, les règles de conformité ou le développement de compétences techniques."
    },
    {
      icon: <Award className="h-10 w-10 text-purple-500" />,
      title: "Créateurs de Contenu & Influenceurs",
      desc: "Monétisez votre audience grâce à votre savoir. Vendez des Masterclasses, créez des académies privées par abonnement mensuel et encaissez vos revenus directement par Mobile Money."
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-orange-500" />,
      title: "ONG & Formations Professionnelles",
      desc: "Diffusez des programmes de formation certifiants à grand impact. Suivez en temps réel la progression des bénéficiaires et collectez des statistiques détaillées sur les taux de réussite."
    }
  ];

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <Navbar />
      <main className="flex-1 bg-zinc-50 dark:bg-black py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center rounded-full border border-blue-500/30 px-3 py-1 text-sm font-semibold mb-6 text-blue-400 bg-blue-950/50 backdrop-blur-sm">
              Cas d'utilisation
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-zinc-900 dark:text-white leading-tight">
              Des solutions adaptées à chaque secteur d'activité.
            </h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              Découvrez comment ANSELLA est déployée pour propulser l'éducation, la formation professionnelle et la monétisation du savoir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {cases.map((item, index) => (
              <div key={index} className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 hover:border-zinc-300 dark:hover:border-white/20 transition-all flex flex-col items-start gap-4">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                  {item.icon}
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{item.title}</h2>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm md:text-base">
                  {item.desc}
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
