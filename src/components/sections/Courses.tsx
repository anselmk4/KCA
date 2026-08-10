import Link from "next/link";
import { ArrowRight, Bitcoin, BrainCircuit, Code2 } from "lucide-react";

export function Courses() {
  const templates = [
    {
      title: "Web3 Developer Academy",
      description: "Un modèle complet pour enseigner Solidity, la programmation de smart contracts et le développement d'applications décentralisées (dApps).",
      icon: <Code2 className="h-8 w-8 text-blue-500" />,
      tag: "Populaire",
      courses: "3 cours inclus"
    },
    {
      title: "Crypto & Trading School",
      description: "Optimisé pour l'enseignement de l'analyse technique, de la gestion des risques et de la finance décentralisée (DeFi).",
      icon: <TrendingUpIcon className="h-8 w-8 text-green-500" />,
      tag: "Trading",
      courses: "2 cours inclus"
    },
    {
      title: "Artificial Intelligence Hub",
      description: "Parfait pour former à la création d'agents IA, à l'ingénierie de prompts et à l'automatisation intelligente de workflows.",
      icon: <BrainCircuit className="h-8 w-8 text-purple-500" />,
      tag: "IA & Data",
      courses: "4 cours inclus"
    },
    {
      title: "Blockchain Business School",
      description: "Conçu pour introduire les fondamentaux de la décentralisation, les cas d'usages industriels et l'économie du Web3.",
      icon: <Bitcoin className="h-8 w-8 text-orange-500" />,
      tag: "Business",
      courses: "2 cours inclus"
    }
  ];

  return (
    <section id="templates" className="py-24 bg-slate-50 dark:bg-zinc-900/50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Modèles d'Académie Prêts à Déployer</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sélectionnez un modèle structuré et personnalisez-le avec vos propres leçons et supports.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template, index) => (
            <div key={index} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all flex flex-col h-full">
              <div className="mb-4">
                {template.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{template.title}</h3>
              <p className="text-muted-foreground text-sm flex-grow mb-6">
                {template.description}
              </p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t text-sm font-medium">
                <span className="text-blue-600 dark:text-blue-400">{template.tag}</span>
                <span className="text-muted-foreground">{template.courses}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/courses" className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors">
            Voir le catalogue des cours <ArrowRight className="ml-2 h-4 w-4" />
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
