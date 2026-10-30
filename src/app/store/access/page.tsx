"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, BookOpen, ShieldCheck, Download } from "lucide-react";

interface DownloadLinkItem {
  title: string;
  downloadUrl: string;
  orderNumber: string;
  price: number;
}

export default function StoreAccessPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    downloadLinks?: DownloadLinkItem[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/digital-products/resend-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setResult({
          success: false,
          message:
            data.message ||
            data.error ||
            "Aucun achat trouvé. Veuillez vérifier l'adresse e-mail saisie.",
        });
      } else {
        setResult({
          success: true,
          message: data.message,
          downloadLinks: data.downloadLinks || [],
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: "Erreur de communication avec le serveur. Veuillez réessayer.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-teal-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 flex flex-col justify-center">
        <div className="mb-6">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la boutique
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-xl shadow-zinc-950/5">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-6">
            <BookOpen className="w-7 h-7" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2">
            Retrouver mes téléchargements
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
            Vous avez déjà acheté un livre ou un guide numérique sur Ansella ? Saisissez l&apos;adresse
            e-mail utilisée lors de votre commande pour débloquer immédiatement votre ressource.
          </p>

          {/* MESSAGE D'ÉTAT */}
          {result && (
            <div
              className={`p-4 rounded-2xl mb-6 text-xs sm:text-sm flex items-start gap-3 ${
                result.success
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed font-medium">{result.message}</div>
            </div>
          )}

          {/* SECTION DE TÉLÉCHARGEMENT IMMÉDIAT SUR ÉCRAN */}
          {result?.success && result.downloadLinks && result.downloadLinks.length > 0 && (
            <div className="space-y-4 mb-8 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-2 border-emerald-400 dark:border-emerald-700 rounded-3xl animate-in zoom-in-95">
              <div className="text-center pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  🎉 Téléchargement débloqué immédiatement
                </span>
              </div>

              {result.downloadLinks.map((item, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 shadow-md space-y-3"
                >
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Licence personnelle certifiée
                    </p>
                  </div>

                  <a
                    href={item.downloadUrl}
                    download
                    className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-extrabold rounded-2xl shadow-xl shadow-teal-500/25 text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Download className="w-5 h-5" /> Télécharger mon Produit Numérique (PDF)
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* FORMULAIRE DE RECHERCHE */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="access-email"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Votre adresse e-mail d&apos;achat
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="access-email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-teal-600/20 text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Vérification en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Récupérer mon livre numérique
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Téléchargement direct sécurisé
            </div>
            <p className="leading-relaxed text-[11px]">
              Votre lien d&apos;accès est cryptographiquement signé et ne nécessite aucune création de compte
              préalable. Vous pouvez enregistrer le fichier directement sur votre appareil.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
