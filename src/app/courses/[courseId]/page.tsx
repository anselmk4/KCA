"use client";

import { use } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft, ChevronDown, CheckCircle2, PlayCircle, Clock, BookOpen } from "lucide-react";
import { useState } from "react";

const coursesDB = {
  blockchain: {
    title: "Fondamentaux de la Blockchain",
    description: "Comprendre les bases du Web3, des registres distribués et des Smart Contracts.",
    price: "300$",
    modules: [
      {
        id: "m1",
        title: "Semaine 1 : Introduction au Web3",
        lessons: ["Qu'est-ce que la Blockchain ?", "Histoire et évolution (Bitcoin, Ethereum)", "Le concept de décentralisation"]
      },
      {
        id: "m2",
        title: "Semaine 2 : Fonctionnement Technique",
        lessons: ["La cryptographie asymétrique", "Mécanismes de consensus (PoW, PoS)", "Explorateurs de blocs"]
      },
      {
        id: "m3",
        title: "Semaine 3 : Wallets et Sécurité",
        lessons: ["Créer et sécuriser un wallet (Metamask)", "Comprendre les clés privées / publiques", "Éviter les arnaques courantes"]
      },
      {
        id: "m4",
        title: "Semaine 4 : Les Smart Contracts",
        lessons: ["Introduction à Solidity", "Cas d'usages (DeFi, NFTs)", "Atelier : Déployer son premier contrat"]
      }
    ]
  },
  trading: {
    title: "Crypto-monnaie / Trading",
    description: "Devenez rentable grâce à des stratégies éprouvées et une gestion rigoureuse des risques.",
    price: "500$",
    modules: [
      {
        id: "m1",
        title: "Module 1 : Psychologie et Fondations",
        lessons: ["L'état d'esprit du trader", "Capital initial et Money Management", "Choisir son exchange (Binance, Bybit)"]
      },
      {
        id: "m2",
        title: "Module 2 : Analyse Technique",
        lessons: ["Lecture des chandeliers japonais", "Support, Résistances et Lignes de tendance", "Indicateurs majeurs (RSI, MACD, Moyennes mobiles)"]
      },
      {
        id: "m3",
        title: "Module 3 : Stratégies d'investissement",
        lessons: ["Day Trading vs Swing Trading", "Dollar Cost Averaging (DCA)", "Le trading de futures (Risques et Opportunités)"]
      }
    ]
  },
  ai: {
    title: "Intelligence Artificielle",
    description: "Maîtrisez les outils d'IA pour automatiser vos tâches et multiplier vos revenus.",
    price: "1000$",
    modules: [
      {
        id: "m1",
        title: "Semaine 1 : Les bases de l'IA générative",
        lessons: ["Comprendre les LLMs (ChatGPT, Claude)", "L'art du Prompt Engineering", "Génération d'images (Midjourney, Stable Diffusion)"]
      },
      {
        id: "m2",
        title: "Semaine 2 : Automatisation de workflows",
        lessons: ["Introduction à Zapier et Make", "Connecter des API", "Créer un assistant virtuel personnalisé"]
      },
      {
        id: "m3",
        title: "Semaine 3 : IA appliquée au Web3",
        lessons: ["Analyse de sentiment sur Twitter pour le Trading", "Audits de Smart Contracts par l'IA", "Génération de collections NFT"]
      }
    ]
  },
  web3: {
    title: "Développement Web3",
    description: "Créez vos propres Smart Contracts et dApps sur Ethereum et d'autres blockchains.",
    price: "1500$",
    modules: [
      {
        id: "m1",
        title: "Module 1 : Solidity pour les Débutants",
        lessons: ["Variables, Fonctions et Mappings", "Gestion des erreurs", "Héritage et Interfaces"]
      },
      {
        id: "m2",
        title: "Module 2 : Création de Tokens (ERC-20 & ERC-721)",
        lessons: ["Standard ERC-20 (Crypto)", "Standard ERC-721 (NFTs)", "Sécurisation des contrats"]
      },
      {
        id: "m3",
        title: "Module 3 : Applications Décentralisées (dApps)",
        lessons: ["Connexion avec Web3.js / Ethers.js", "Créer un Frontend React pour Web3", "Déploiement sur un Testnet"]
      }
    ]
  }
};

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.courseId as keyof typeof coursesDB;
  const course = coursesDB[courseId];
  
  const [openModule, setOpenModule] = useState<string | null>("m1");

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-black dark:text-white">
        <p>Cours introuvable.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <Navbar />
      
      {/* Header Section */}
      <div className="bg-zinc-900 text-white pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <Link href="/courses" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour au catalogue
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{course.title}</h1>
              <p className="text-xl text-zinc-300">{course.description}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 min-w-[250px] text-center">
              <p className="text-zinc-300 mb-2">Prix du module</p>
              <p className="text-4xl font-bold mb-6">{course.price}</p>
              <Link 
                href={`/register?module=${courseId}`}
                className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/25"
              >
                S'inscrire maintenant
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Syllabus Section */}
      <main className="flex-1 bg-zinc-50 dark:bg-black py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <h2 className="text-2xl font-bold mb-8 text-zinc-900 dark:text-white">Programme du cours</h2>
          
          <div className="space-y-4">
            {course.modules.map((module) => {
              const isOpen = openModule === module.id;
              
              return (
                <div key={module.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setOpenModule(isOpen ? null : module.id)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOpen ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                        {isOpen ? <ChevronDown className="w-5 h-5 rotate-180 transition-transform" /> : <ChevronDown className="w-5 h-5 transition-transform" />}
                      </div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{module.title}</h3>
                    </div>
                    <div className="hidden sm:flex text-sm text-zinc-500 dark:text-zinc-400 items-center">
                      <BookOpen className="w-4 h-4 mr-1" /> {module.lessons.length} leçons
                    </div>
                  </button>
                  
                  {isOpen && (
                    <div className="border-t border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-4 animate-in slide-in-from-top-2">
                      {module.lessons.map((lesson, idx) => (
                        <div key={idx} className="flex items-start space-x-3 text-zinc-700 dark:text-zinc-300">
                          <PlayCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                          <span>{lesson}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
