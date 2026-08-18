import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BLOG_POSTS_SEO } from '@/data/blog-posts';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BreadcrumbsJsonLd } from '@/components/seo/JsonLd';
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Share2,
  User,
  CheckCircle2,
} from 'lucide-react';

export async function generateStaticParams() {
  return BLOG_POSTS_SEO.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS_SEO.find((p) => p.slug === slug);
  if (!post) return {};

  return {
    title: `${post.title} | Blog ANSELLA`,
    description: post.metaDesc,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDesc,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      url: `https://ansella.app/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = BLOG_POSTS_SEO.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDesc,
    datePublished: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
    },
    publisher: {
      "@type": "Organization",
      name: "ANSELLA",
      logo: "https://ansella.app/logo.png",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://ansella.app/blog/${post.slug}`,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <BreadcrumbsJsonLd
        items={[
          { name: "Accueil", url: "https://ansella.app" },
          { name: "Blog", url: "https://ansella.app/blog" },
          { name: post.title, url: `https://ansella.app/blog/${post.slug}` },
        ]}
      />

      <main className="flex-1 py-12 px-6 md:px-12">
        <article className="max-w-3xl mx-auto space-y-8">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au blog</span>
          </Link>

          {/* Article Header */}
          <header className="space-y-4 border-b border-zinc-200 dark:border-zinc-800 pb-8">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full">
                {post.category}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{post.readTimeMinutes} min de lecture</span>
              </div>
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold text-zinc-900 dark:text-white leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                  {post.author.name[0]}
                </div>
                <div>
                  <p className="font-bold text-zinc-700 dark:text-zinc-300">{post.author.name}</p>
                  <p className="text-[10px] text-zinc-400">{post.author.role}</p>
                </div>
              </div>
              <span>Publié le {new Date(post.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </header>

          {/* Article Body */}
          <div
            className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-teal-600 dark:prose-a:text-teal-400 text-sm md:text-base leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          {/* Call to Action Box */}
          <div className="p-8 bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-3xl border border-teal-800/40 shadow-xl text-center space-y-4">
            <Sparkles className="w-8 h-8 text-teal-400 mx-auto" />
            <h3 className="text-xl font-bold">Prêt à lancer votre propre académie en ligne ?</h3>
            <p className="text-xs text-zinc-300 max-w-lg mx-auto leading-relaxed">
              Rejoignez les formateurs qui vendent déjà leurs cours en Afrique et dans le monde avec Mobile Money, Cartes et Cryptos.
            </p>
            <div>
              <Link
                href="/register?role=instructor"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all"
              >
                <span>Créer mon académie gratuitement</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
