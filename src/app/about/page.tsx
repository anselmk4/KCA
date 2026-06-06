import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GraduationCap, Award, Compass, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <Navbar />
      <main className="flex-1 bg-zinc-50 dark:bg-black py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center rounded-full border border-blue-500/30 px-3 py-1 text-sm font-semibold mb-6 text-blue-400 bg-blue-950/50 backdrop-blur-sm">
              Qui sommes-nous ?
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-zinc-900 dark:text-white leading-tight">
              ANSELLA, Révolutionner l'éducation numérique en RDC & en Afrique.
            </h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              Une plateforme 100% Congolaise tout-en-un conçue pour autonomiser les formateurs, experts et apprenants grâce aux technologies modernes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">Notre Vision</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Permettre à chaque expert, formateur, enseignant et entrepreneur en République Démocratique du Congo et à travers l'Afrique de créer, valoriser et monétiser son savoir sans barrière technique ou financière. Nous croyons en une éducation accessible, moderne et ancrée dans nos réalités.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">Notre Mission</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Fournir une infrastructure technologique premium, intuitive et entièrement intégrée avec les moyens de paiement locaux (Mobile Money) pour faciliter l'accès au savoir et à l'enseignement de pointe (Web3, IA, Blockchain, Entreprenariat).
              </p>
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-zinc-900 dark:text-white">Nos Valeurs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-white/10 text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-4">
                  <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold mb-2">Excellence Académique</h3>
                <p className="text-sm text-zinc-500">Un apprentissage structuré et certifiant.</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-white/10 text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-bold mb-2">Innovation Tech</h3>
                <p className="text-sm text-zinc-500">Intégration d'outils modernes d'IA & Web3.</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-white/10 text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-4">
                  <Compass className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-bold mb-2">Souveraineté Locale</h3>
                <p className="text-sm text-zinc-500">Conçu en RDC pour répondre à nos défis.</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-white/10 text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="font-bold mb-2">Impact Social</h3>
                <p className="text-sm text-zinc-500">Favoriser l'insertion des jeunes africains.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
