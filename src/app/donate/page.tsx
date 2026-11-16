import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DonationProgress } from "@/features/donations/components/DonationProgress";
import { DonationForm } from "@/features/donations/components/DonationForm";
import { Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Faire un Don | Soutenez l'Académie Ansella",
  description:
    "Faites un don sécurisé par Mobile Money (M-Pesa, Orange, Airtel, MTN) ou PayPal pour financer des bourses d'études et démocratiser la formation technologique en Afrique.",
  openGraph: {
    title: "Faire un Don | Soutenez l'Académie Ansella",
    description:
      "Investissez dans les talents de demain. Vos dons financent des bourses d'études et des cours en libre accès sur l'IA et le développement.",
    url: "https://ansella.app/donate",
  },
  alternates: {
    canonical: "/donate",
  },
};

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-teal-500 selection:text-slate-950 transition-colors">
      <Navbar />

      <main className="flex-1 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* En-tête concis et épuré */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-3">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30" />
              <span>Campagne de Financement Participatif</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Soutenez l&apos;Éducation & les Talents d&apos;Ansella
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto mt-2">
              Chaque contribution permet de financer des bourses d&apos;études et d&apos;offrir un accès libre aux formations d&apos;avenir.
            </p>
          </div>

          {/* Jauge de progression vers l'objectif 60k */}
          <DonationProgress />

          {/* Formulaire de don interactif */}
          <DonationForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
