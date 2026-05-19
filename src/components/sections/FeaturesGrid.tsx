import { Zap, Shield, Smartphone, Globe } from "lucide-react";

export function FeaturesGrid() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-zinc-900/30 border-y">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Un parcours complet et modulable</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Notre plateforme est conçue pour s'adapter à votre rythme et à vos objectifs spécifiques.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="flex gap-4 p-6 bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl h-fit">
              <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Apprentissage Rapide</h3>
              <p className="text-muted-foreground">Des micro-leçons conçues pour retenir l'attention et maximiser la mémorisation en un minimum de temps.</p>
            </div>
          </div>
          
          <div className="flex gap-4 p-6 bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl h-fit">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Pratique Sécurisée</h3>
              <p className="text-muted-foreground">Entraînez-vous sur nos simulateurs de trading et d'environnement Web3 sans risquer vos fonds réels.</p>
            </div>
          </div>
          
          <div className="flex gap-4 p-6 bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl h-fit">
              <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Accessible Partout</h3>
              <p className="text-muted-foreground">Une application optimisée pour mobile pour apprendre où que vous soyez, même avec une faible connexion.</p>
            </div>
          </div>
          
          <div className="flex gap-4 p-6 bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl h-fit">
              <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Réseau Panafricain</h3>
              <p className="text-muted-foreground">Connectez-vous avec des étudiants et professionnels de toute l'Afrique et créez des synergies uniques.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
