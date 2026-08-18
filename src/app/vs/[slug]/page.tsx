import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { COMPETITORS_SEO } from '@/data/competitors';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BreadcrumbsJsonLd } from '@/components/seo/JsonLd';
import {
  Scale,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';

export async function generateStaticParams() {
  return COMPETITORS_SEO.map((c) => ({
    slug: c.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const comp = COMPETITORS_SEO.find((c) => c.slug === slug);
  if (!comp) return {};

  return {
    title: comp.metaTitle,
    description: comp.metaDesc,
    alternates: {
      canonical: `/vs/${comp.slug}`,
    },
    openGraph: {
      title: comp.metaTitle,
      description: comp.metaDesc,
      url: `https://ansella.app/vs/${comp.slug}`,
    },
  };
}

export default async function CompetitorComparisonDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const comp = COMPETITORS_SEO.find((c) => c.slug === slug);

  if (!comp) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans">
      <Navbar />

      <BreadcrumbsJsonLd
        items={[
          { name: "Accueil", url: "https://ansella.app" },
          { name: "Comparatifs", url: "https://ansella.app/vs" },
          { name: `ANSELLA vs ${comp.name}`, url: `https://ansella.app/vs/${comp.slug}` },
        ]}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-zinc-900 to-black text-white py-20 px-6 md:px-12 border-b border-zinc-800 text-center">
          <div className="max-w-4xl mx-auto space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              <span>Comparatif Détaillé 2026</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              ANSELLA vs {comp.name}
            </h1>

            <p className="text-zinc-300 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              {comp.heroSummary}
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link
                href="/register?role=instructor"
                className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2 text-sm"
              >
                <span>Tester ANSELLA gratuitement</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Comparison Box */}
        <section className="py-12 px-6 md:px-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-teal-500/10 border-2 border-teal-500 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-teal-600 dark:text-teal-400 uppercase tracking-wider">ANSELLA</span>
                <span className="text-xs bg-teal-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full">Recommandé</span>
              </div>
              <p className="text-lg font-black text-zinc-900 dark:text-white">{comp.pricingComparison.ansella}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Paiements Mobile Money et cryptos intégrés sans passerelle payante supplémentaire.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
              <span className="font-extrabold text-sm text-zinc-500 uppercase tracking-wider">{comp.name}</span>
              <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300">{comp.pricingComparison.competitor}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Nécessite souvent des intégrations et abonnements tiers pour l'Afrique.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-8 px-6 md:px-12 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Tableau comparatif des fonctionnalités</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-850 border-b border-zinc-100 dark:border-zinc-800">
                    <th className="p-4 font-bold text-zinc-500 uppercase">Fonctionnalité</th>
                    <th className="p-4 font-bold text-teal-600 dark:text-teal-400 uppercase bg-teal-500/5">ANSELLA</th>
                    <th className="p-4 font-bold text-zinc-500 uppercase">{comp.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {comp.featuresTable.map((row, idx) => (
                    <tr key={idx} className={row.highlight ? "bg-teal-500/[0.03]" : ""}>
                      <td className="p-4 font-semibold text-zinc-900 dark:text-white">
                        {row.feature}
                      </td>
                      <td className="p-4 font-bold bg-teal-500/5">
                        {typeof row.ansella === "boolean" ? (
                          row.ansella ? (
                            <Check className="w-5 h-5 text-teal-500" />
                          ) : (
                            <X className="w-5 h-5 text-red-400" />
                          )
                        ) : (
                          <span className="text-teal-600 dark:text-teal-400 font-bold">{row.ansella}</span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-600 dark:text-zinc-400">
                        {typeof row.competitor === "boolean" ? (
                          row.competitor ? (
                            <Check className="w-5 h-5 text-zinc-400" />
                          ) : (
                            <X className="w-5 h-5 text-red-400" />
                          )
                        ) : (
                          <span>{row.competitor}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Key Advantages */}
        <section className="py-12 px-6 md:px-12 max-w-5xl mx-auto space-y-6">
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white text-center">
            Les atouts majeurs d'ANSELLA face à {comp.name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {comp.keyAdvantages.map((adv, idx) => (
              <div key={idx} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{adv.title}</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{adv.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Verdict */}
        <section className="py-12 px-6 md:px-12 max-w-3xl mx-auto">
          <div className="p-8 bg-zinc-900 text-white rounded-3xl border border-zinc-800 text-center space-y-4">
            <h3 className="text-xl font-bold text-teal-400">Notre Verdict</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">{comp.verdict}</p>
            <div className="pt-2">
              <Link
                href="/register?role=instructor"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs"
              >
                <span>Rejoindre ANSELLA dès maintenant</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
