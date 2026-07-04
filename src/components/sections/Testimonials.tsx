import { Star } from "lucide-react";

export function Testimonials() {
  const reviews = [
    {
      name: "Prof. Marc D.",
      role: "Formateur Finance & Trading, Paris",
      text: "Grâce à ANSELLA, j'ai lancé mon école de trading en ligne. La plateforme encaisse les frais d'inscription sans que je n'aie à coder. Mes revenus ont doublé en 3 mois.",
      rating: 5,
      academy: "Global Trading Academy"
    },
    {
      name: "Sarah K.",
      role: "Formatrice Web3 & IA, Montréal",
      text: "J'adore la simplicité d'utilisation. J'ai 150 étudiants actifs sur mon académie d'IA générative. Les quiz automatiques me font gagner un temps fou dans les corrections.",
      rating: 5,
      academy: "Web3/AI World Academy"
    },
    {
      name: "Dr. Jean-Claude B.",
      role: "Enseignant Blockchain, Bruxelles",
      text: "Mes étudiants reçoivent des certificats automatisés très professionnels à la fin du cursus. Les retraits de mes commissions se font instantanément vers mon compte.",
      rating: 5,
      academy: "Blockchain Institute Europe"
    }
  ];

  return (
    <section className="py-24 bg-white/40 dark:bg-zinc-950/20 border-t border-zinc-200 dark:border-zinc-900">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-400/10 border border-yellow-200 dark:border-yellow-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest inline-block mb-4">
            Témoignages
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-zinc-900 dark:text-white">Ils réussissent avec ANSELLA</h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Découvrez les témoignages de formateurs et professeurs qui gèrent leurs académies en ligne de A à Z.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white/60 dark:bg-zinc-900/40 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 flex flex-col hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>

              <p className="text-zinc-700 dark:text-zinc-300 mb-6 flex-1 leading-relaxed text-sm">
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">{review.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{review.role}</p>
                </div>
                <span className="text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 px-2.5 py-1 rounded-full">
                  {review.academy}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
