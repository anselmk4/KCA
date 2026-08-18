import { Metadata } from 'next';
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
  Zap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Comparatifs LMS : ANSELLA vs Teachable, Udemy, Kajabi, Moodle (2026)",
  description: "Comparez ANSELLA aux autres plateformes de formation en ligne. Découvrez pourquoi ANSELLA surpasse les LMS traditionnels en Afrique et à l'international.",
  alternates: {
    canonical: "/vs",
  },
  openGraph: {
    title: "Comparatifs LMS — ANSELLA vs Les Géants du E-Learning",
    description: "Mobile Money natif, zéro commissions cachées, diplômes infalsifiables. Comparez et faites le bon choix.",
    url: "https://ansella.app/vs",
  },
};

export default function CompetitorsHubPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans">
      <Navbar />

      <BreadcrumbsJsonLd
        items={[
          { name: "Accueil", url: "https://ansella.app" },
          { name: "Comparatifs", url: "https://ansella.app/vs" },
        ]}
      />

      <main className="flex-1">
        {/* Header */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-zinc-900 to-black text-white py-20 px-6 md:px-12 border-b border-zinc-800 text-center">
          <div className="max-w-4xl mx-auto space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              <span>Comparatif Plateformes LMS 2026</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Pourquoi Choisir{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                ANSELLA
              </span>{" "}
              face aux alternatives ?
            </h1>

            <p className="text-zinc-300 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Consultez nos comparatifs détaillés et découvrez pourquoi les formateurs et universités migrent vers ANSELLA pour leurs cours en ligne.
            </p>
          </div>
        </section>

        {/* Competitor Cards */}
        <section className="py-16 px-6 md:px-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {COMPETITORS_SEO.map((comp) => (
              <div
                key={comp.slug}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col justify-between space-y-6 hover:border-teal-500/50 hover:shadow-xl transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full">
                      ANSELLA vs {comp.name}
                    </span>
                    <Scale className="w-5 h-5 text-zinc-400" />
                  </div>

                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                    ANSELLA vs {comp.name}
                  </h2>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                    {comp.tagline}
                  </p>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-2">
                    <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      ⚡ Différenciateur clé :
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {comp.keyAdvantages[0]?.desc}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/vs/${comp.slug}`}
                  className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2"
                >
                  <span>Lire le comparatif complet</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
