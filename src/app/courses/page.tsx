import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, Bitcoin, BrainCircuit, TrendingUp, Code2 } from "lucide-react";

export default function CoursesPage() {
  const courses = [
    {
      id: "blockchain",
      title: "Fondamentaux de la Blockchain",
      description: "Maîtrisez les concepts de base des registres distribués, de la cryptographie et du Web3. Parfait pour les débutants souhaitant comprendre la technologie derrière les cryptomonnaies.",
      icon: <Bitcoin className="h-12 w-12 text-blue-500" />,
      level: "Débutant",
      duration: "4 semaines",
      price: "300$"
    },
    {
      id: "trading",
      title: "Crypto-monnaie / Trading",
      description: "Devenez un trader rentable. Apprenez l'analyse technique, l'analyse fondamentale, la gestion des risques et la psychologie du marché.",
      icon: <TrendingUp className="h-12 w-12 text-emerald-500" />,
      level: "Intermédiaire",
      duration: "6 semaines",
      price: "500$"
    },
    {
      id: "ai",
      title: "Intelligence Artificielle",
      description: "Apprenez à utiliser et à créer des outils d'Intelligence Artificielle pour automatiser vos tâches, analyser des données et démultiplier votre productivité.",
      icon: <BrainCircuit className="h-12 w-12 text-purple-500" />,
      level: "Tous niveaux",
      duration: "5 semaines",
      price: "1000$"
    },
    {
      id: "web3",
      title: "Développement Web3",
      description: "Créez vos propres Smart Contracts et dApps sur Ethereum et d'autres blockchains.",
      icon: <Code2 className="h-12 w-12 text-orange-500" />,
      level: "Avancé",
      duration: "8 semaines",
      price: "1500$"
    }
  ];

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <Navbar />
      <main className="flex-1 bg-zinc-50 dark:bg-black py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-zinc-900 dark:text-white">Catalogue des Formations</h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Choisissez le parcours qui correspond à vos ambitions et commencez votre transformation dès aujourd'hui.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {courses.map((course) => (
              <div key={course.id} className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col h-full hover:shadow-xl transition-shadow group">
                <div className="mb-6 bg-zinc-50 dark:bg-zinc-800/50 w-20 h-20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  {course.icon}
                </div>
                <h2 className="text-2xl font-bold mb-3 text-zinc-900 dark:text-white">{course.title}</h2>
                <p className="text-zinc-600 dark:text-zinc-400 mb-6 flex-grow">
                  {course.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    {course.level}
                  </span>
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    {course.duration}
                  </span>
                </div>
                <Link 
                  href={`/courses/${course.id}`}
                  className="w-full flex items-center justify-between py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                >
                  <span>Voir le programme</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
