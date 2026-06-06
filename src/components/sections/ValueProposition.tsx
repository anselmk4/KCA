import { Target, TrendingUp, Users } from "lucide-react";

export function ValueProposition() {
  const values = [
    {
      icon: <Target className="h-10 w-10 text-blue-500" />,
      title: "Monétisation Simplifiée",
      description: "Encaissez les inscriptions à vos cours directement par Mobile Money (Airtel, M-Pesa, Orange), Cartes bancaires ou PayPal."
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-blue-500" />,
      title: "Contrôle et Flexibilité",
      description: "Fixez vos propres prix, gérez vos coupons de réduction et gardez jusqu'à 100% de vos revenus sans intermédiaires."
    },
    {
      icon: <Users className="h-10 w-10 text-blue-500" />,
      title: "Pédagogie Avancée",
      description: "Engagez vos élèves avec des quiz interactifs, des supports de cours téléchargeables et des certificats de réussite automatisés."
    }
  ];

  return (
    <section className="py-24 bg-slate-50 dark:bg-zinc-900/50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Notre Proposition de Valeur</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ANSELLA est conçu pour donner aux formateurs africains le pouvoir de diffuser leur savoir à l'échelle du continent.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div key={index} className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-xl flex items-center justify-center">
                {value.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{value.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
