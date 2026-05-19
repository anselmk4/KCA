import { Star } from "lucide-react";

export function Testimonials() {
  const reviews = [
    {
      name: "Patrick M.",
      role: "Entrepreneur, Kinshasa",
      text: "Grâce à Kuettu, j'ai compris la blockchain en 3 semaines. Aujourd'hui je gère mon propre portefeuille crypto et je forme d'autres personnes.",
      rating: 5,
      module: "Blockchain"
    },
    {
      name: "Sarah K.",
      role: "Développeuse, Bukavu",
      text: "Le module IA m'a permis d'automatiser 80% de mes tâches répétitives. Le retour sur investissement est incroyable.",
      rating: 5,
      module: "Intelligence Artificielle"
    },
    {
      name: "Jean-Claude B.",
      role: "Trader indépendant, Lubumbashi",
      text: "Les signaux du groupe privé et les cours de trading m'ont rendu rentable en 2 mois. Meilleur investissement de ma vie.",
      rating: 5,
      module: "Trading"
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-black">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Ils nous font confiance</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Des centaines d'entrepreneurs africains transforment leur avenir grâce à Kuettu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-zinc-50 dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 flex flex-col hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>

              <p className="text-zinc-700 dark:text-zinc-300 mb-6 flex-1 leading-relaxed">
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">{review.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{review.role}</p>
                </div>
                <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full">
                  {review.module}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
