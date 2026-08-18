import { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPosts } from '@/data/blog-posts';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BreadcrumbsJsonLd } from '@/components/seo/JsonLd';
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Share2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Blog & Guides E-Learning : Créer, Vendre et Certifier ses Cours en Ligne | ANSELLA",
  description: "Guides pratiques, stratégies de monétisation de formations, Mobile Money, IA appliquée et astuces pour développer votre académie en ligne en Afrique et dans le monde.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog & Ressources ANSELLA — Le Guide des Formateurs d'Élite",
    description: "Apprenez à créer, vendre et monétiser vos formations en ligne avec les meilleures pratiques EdTech.",
    url: "https://ansella.app/blog",
  },
};

export default async function BlogHubPage() {
  const posts = await getBlogPosts();
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans">
      <Navbar />

      <BreadcrumbsJsonLd
        items={[
          { name: "Accueil", url: "https://ansella.app" },
          { name: "Blog & Guides", url: "https://ansella.app/blog" },
        ]}
      />

      <main className="flex-1">
        {/* Header */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-zinc-900 to-black text-white py-20 px-6 md:px-12 border-b border-zinc-800 text-center">
          <div className="max-w-4xl mx-auto space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Guides & Stratégies E-Learning</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Le Blog des{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                Créateurs et Formateurs
              </span>
            </h1>

            <p className="text-zinc-300 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Découvrez nos articles et tutoriels pour réussir le lancement de votre académie, maximiser vos ventes par Mobile Money et certifier vos apprenants.
            </p>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16 px-6 md:px-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col justify-between space-y-6 hover:border-teal-500/50 hover:shadow-xl transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.readTimeMinutes} min de lecture</span>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 hover:text-teal-600 transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3 mb-4">
                    {post.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-md font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    Par {post.author.name}
                  </span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    <span>Lire l'article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
