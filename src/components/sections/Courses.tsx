import Link from "next/link";
import { ArrowRight, Bitcoin, BrainCircuit, Code2 } from "lucide-react";

export function Courses() {
  const courses = [
    {
      title: "Fondamentaux de la Blockchain",
      description: "Comprendre le fonctionnement des registres distribués, des wallets et des transactions sécurisées.",
      icon: <Bitcoin className="h-8 w-8 text-orange-500" />,
      level: "Débutant",
      duration: "4 semaines"
    },
    {
      title: "Trading & DeFi",
      description: "Apprenez à analyser les marchés, à utiliser les DEX et à générer des rendements passifs.",
      icon: <TrendingUpIcon className="h-8 w-8 text-green-500" />,
      level: "Intermédiaire",
      duration: "6 semaines"
    },
    {
      title: "Développement Web3",
      description: "Créez vos propres Smart Contracts et dApps sur Ethereum et d'autres blockchains.",
      icon: <Code2 className="h-8 w-8 text-blue-500" />,
      level: "Avancé",
      duration: "8 semaines"
    },
    {
      title: "IA pour les Affaires",
      description: "Automatisez vos processus et boostez votre productivité avec les derniers outils d'IA.",
      icon: <BrainCircuit className="h-8 w-8 text-purple-500" />,
      level: "Tous niveaux",
      duration: "5 semaines"
    }
  ];

  return (
    <section id="courses" className="py-24 bg-slate-50 dark:bg-zinc-900/50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Nos Parcours de Formation</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Des modules structurés et progressifs pour vous accompagner de zéro à expert.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course, index) => (
            <div key={index} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all flex flex-col h-full">
              <div className="mb-4">
                {course.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{course.title}</h3>
              <p className="text-muted-foreground text-sm flex-grow mb-6">
                {course.description}
              </p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t text-sm font-medium">
                <span className="text-blue-600 dark:text-blue-400">{course.level}</span>
                <span className="text-muted-foreground">{course.duration}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/courses" className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors">
            Voir tous les cours <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function TrendingUpIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
