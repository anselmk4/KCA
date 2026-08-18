import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { AFRICAN_COUNTRIES_SEO } from '@/data/geo-countries';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BreadcrumbsJsonLd, FaqJsonLd } from '@/components/seo/JsonLd';
import {
  Globe2,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  BookOpen,
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Plateforme LMS en Afrique : Créez et Vendez vos Cours en Ligne | ANSELLA",
  description: "La solution LMS n°1 en Afrique adaptée aux paiements Mobile Money (M-Pesa, Wave, MTN, Orange, Airtel), cryptomonnaies et cartes. Créez votre école numérique dès aujourd'hui.",
  alternates: {
    canonical: "/lms-afrique",
  },
  openGraph: {
    title: "ANSELLA — La Plateforme LMS Nouvelle Génération pour l'Afrique",
    description: "Monétisez vos compétences et délivrez des certificats sécurisés avec paiements Mobile Money locaux.",
    url: "https://ansella.app/lms-afrique",
  },
};

const FAQ_ITEMS = [
  {
    question: "Quels sont les opérateurs Mobile Money supportés sur ANSELLA ?",
    answer: "ANSELLA supporte les principaux opérateurs panafricains : Vodacom M-Pesa, Airtel Money, Orange Money, Wave, MTN MoMo et Moov Money, permettant des paiements instantanés en devises locales (CDF, FCFA XOF/XAF, NGN, KES) ou en USD.",
  },
  {
    question: "Puis-je vendre mes cours en dehors de mon pays d'origine ?",
    answer: "Oui ! ANSELLA est une plateforme globale. Un formateur basé à Kinshasa ou Abidjan peut encaisser des étudiants situés à Paris (par Carte/PayPal), à Dakar (par Wave) ou à Lagos (par Crypto/Cartes) sans aucune friction.",
  },
  {
    question: "Comment sont délivrés les certificats de fin de formation ?",
    answer: "Dès qu'un apprenant valide tous les modules et réussit les examens/quiz, ANSELLA génère automatiquement un certificat numérique infalsifiable muni d'un QR code vérifiable en ligne.",
  },
];

export default function LmsAfriqueHubPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans">
      <Navbar />

      <BreadcrumbsJsonLd
        items={[
          { name: "Accueil", url: "https://ansella.app" },
          { name: "LMS Afrique", url: "https://ansella.app/lms-afrique" },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-zinc-900 to-black text-white py-20 px-6 md:px-12 border-b border-zinc-800">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <Globe2 className="w-4 h-4" />
              <span>EdTech & E-Learning Panafricain</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              La Plateforme LMS Conçue pour{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-400">
                l'Afrique et le Monde
              </span>
            </h1>

            <p className="text-zinc-300 max-w-3xl mx-auto text-base md:text-lg leading-relaxed">
              Créez, hébergez et monétisez vos formations professionnelles. Encaissez vos étudiants en toute simplicité grâce au <strong>Mobile Money universel</strong>, aux cartes bancaires et aux cryptomonnaies.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link
                href="/register?role=instructor"
                className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2 text-sm"
              >
                <span>Créer mon académie gratuitement</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 bg-zinc-800/80 hover:bg-zinc-800 text-white font-semibold rounded-2xl border border-zinc-700 transition-all text-sm"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </section>

        {/* Countries Grid */}
        <section className="py-16 px-6 md:px-12 max-w-6xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-2xl md:text-4xl font-extrabold text-zinc-900 dark:text-white">
              Découvrez ANSELLA dans votre pays
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-2xl mx-auto">
              Chaque pays dispose de passerelles de paiement locales optimisées pour maximiser les inscriptions de vos étudiants.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {AFRICAN_COUNTRIES_SEO.map((country) => (
              <Link
                key={country.slug}
                href={`/lms-afrique/${country.slug}`}
                className="group p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-teal-500/50 hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{country.flag}</span>
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full">
                      {country.currency}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {country.name}
                  </h3>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2">
                    {country.heroSubheadline}
                  </p>

                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-2">
                      Paiements supportés :
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {country.mainMobileMoney.map((m) => (
                        <span
                          key={m}
                          className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-700 dark:text-zinc-300 font-medium"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-1 transition-transform">
                  <span>En savoir plus</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Why ANSELLA Pillars */}
        <section className="py-16 bg-white dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white">
                Pourquoi les formateurs d'élite choisissent ANSELLA
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">Mobile Money Universel</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Permettez à vos apprenants de payer instantanément avec leurs téléphones mobiles sans avoir besoin de carte bancaire.
                </p>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">Certificats Vérifiables</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Délivrez des attestations officielles infalsifiables avec QR Code et partageables en un clic sur LinkedIn.
                </p>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">Intelligence Artificielle</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Générez vos quiz, évaluez les connaissances et offrez un tuteur IA disponible 24h/24 à vos étudiants.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-6 md:px-12 max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white text-center mb-8">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, idx) => (
              <div key={idx} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-2">{item.question}</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
