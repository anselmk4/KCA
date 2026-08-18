import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AFRICAN_COUNTRIES_SEO, AfricanCountrySeo } from '@/data/geo-countries';
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
  Award,
  TrendingUp,
  Zap,
  MapPin,
  Lock,
} from 'lucide-react';

export async function generateStaticParams() {
  return AFRICAN_COUNTRIES_SEO.map((c) => ({
    country: c.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country: slug } = await params;
  const country = AFRICAN_COUNTRIES_SEO.find((c) => c.slug === slug);
  if (!country) return {};

  return {
    title: country.metaTitle,
    description: country.metaDesc,
    alternates: {
      canonical: `/lms-afrique/${country.slug}`,
    },
    openGraph: {
      title: country.metaTitle,
      description: country.metaDesc,
      url: `https://ansella.app/lms-afrique/${country.slug}`,
    },
  };
}

export default async function CountryLmsPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: slug } = await params;
  const country = AFRICAN_COUNTRIES_SEO.find((c) => c.slug === slug);

  if (!country) {
    notFound();
  }

  const faqItems = [
    {
      question: `Comment les apprenants paient-ils mes cours en ${country.name} ?`,
      answer: `Vos étudiants peuvent payer directement avec leurs comptes ${country.mainMobileMoney.join(', ')} ainsi que par cartes bancaires Visa/Mastercard. Les fonds sont crédités instantanément.`,
    },
    {
      question: `Puis-je fixer mes prix en ${country.currency} ?`,
      answer: `Oui, vous pouvez afficher vos prix en ${country.currency} ou en USD. Les conversions sont calculées automatiquement en toute transparence pour l'étudiant.`,
    },
    {
      question: `Les certificats émis en ${country.name} sont-ils reconnus à l'international ?`,
      answer: `Absolument. Chaque certificat ANSELLA délivré possède un identifiant unique vérifiable en ligne depuis n'importe quel pays par les employeurs ou universités.`,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans">
      <Navbar />

      <BreadcrumbsJsonLd
        items={[
          { name: "Accueil", url: "https://ansella.app" },
          { name: "LMS Afrique", url: "https://ansella.app/lms-afrique" },
          { name: country.name, url: `https://ansella.app/lms-afrique/${country.slug}` },
        ]}
      />
      <FaqJsonLd items={faqItems} />

      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-zinc-900 to-black text-white py-20 px-6 md:px-12 border-b border-zinc-800">
          <div className="max-w-5xl mx-auto space-y-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <span className="text-lg">{country.flag}</span>
              <span>LMS & E-Learning — {country.name}</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              {country.heroHeadline}
            </h1>

            <p className="text-zinc-300 max-w-3xl mx-auto text-base md:text-lg leading-relaxed">
              {country.heroSubheadline}
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link
                href="/register?role=instructor"
                className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2 text-sm"
              >
                <span>Lancer mon académie en {country.name}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-2xl border border-zinc-700 transition-all text-sm"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </section>

        {/* Local Context & Payment Integration Box */}
        <section className="py-16 px-6 md:px-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-4 h-4" />
                <span>Adaptation Locale & Panafricaine</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white">
                Une infrastructure e-learning taillée pour {country.name}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {country.localContext}
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-3 text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                  <span>Encaissement instantané en {country.currency}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                  <span>Support des opérateurs : {country.mainMobileMoney.join(', ')}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                  <span>Diffusion vidéo optimisée pour connexions mobiles</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <p className="text-xs uppercase font-bold text-zinc-400">Devise Principale</p>
                  <p className="text-2xl font-black text-teal-600 dark:text-teal-400">{country.currency}</p>
                </div>
                <span className="text-4xl">{country.flag}</span>
              </div>

              <div>
                <p className="text-xs uppercase font-bold text-zinc-400 mb-3">Moyens de paiement actifs :</p>
                <div className="grid grid-cols-2 gap-2">
                  {country.mainMobileMoney.map((m) => (
                    <div key={m} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                      <span>{m}</span>
                    </div>
                  ))}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Cartes Visa / Master</span>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span>Solana USDC / BTC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Topics in this Country */}
        <section className="py-12 bg-white dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800 px-6 md:px-12">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 text-center">
              Formations les plus demandées en {country.name}
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {country.popularTopics.map((topic) => (
                <span
                  key={topic}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                >
                  ⚡ {topic}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-6 md:px-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white text-center mb-8">
            Questions sur ANSELLA en {country.name}
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div key={idx} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-2">{item.question}</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/lms-afrique"
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
            >
              ← Voir tous les autres pays africains
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
