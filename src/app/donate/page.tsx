import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DonationProgress } from "@/features/donations/components/DonationProgress";
import { DonationForm } from "@/features/donations/components/DonationForm";
import { DonateHeader } from "@/features/donations/components/DonateHeader";

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
          <DonateHeader />

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
