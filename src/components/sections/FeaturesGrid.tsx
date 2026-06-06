import { Zap, Shield, Smartphone, Globe } from "lucide-react";

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 bg-slate-50 dark:bg-zinc-900/30 border-y">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Une plateforme d'enseignement puissante</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ANSELLA vous fournit tous les outils nécessaires pour créer, gérer et rentabiliser votre contenu éducatif.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="flex gap-4 p-6 bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl h-fit">
              <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Générateur de Cours Intuitif</h3>
              <p className="text-muted-foreground">Structurez vos cours en modules et leçons, ajoutez des vidéos et des ressources de manière simple et rapide.</p>
            </div>
          </div>
          
          <div className="flex gap-4 p-6 bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl h-fit">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Quiz & Évaluations</h3>
              <p className="text-muted-foreground">Créez des QCM interactifs pour tester les connaissances de vos apprenants avec correction automatique.</p>
            </div>
          </div>
          
          <div className="flex gap-4 p-6 bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl h-fit">
              <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Paiements et Retraits Mobiles</h3>
              <p className="text-muted-foreground">Encaissez les inscriptions en ligne et retirez vos gains directement via Airtel Money, M-Pesa et Orange Money.</p>
            </div>
          </div>
          
          <div className="flex gap-4 p-6 bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl h-fit">
              <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Analyses et Suivi Élèves</h3>
              <p className="text-muted-foreground">Suivez la progression moyenne de vos apprenants, les taux de complétion des cours et vos statistiques de revenus.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
