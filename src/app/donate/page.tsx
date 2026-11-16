import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DonationHero } from "@/features/donations/components/DonationHero";
import { DonationForm } from "@/features/donations/components/DonationForm";
import { HelpCircle, ShieldCheck, Heart, Sparkles, CheckCircle2 } from "lucide-react";

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-slate-950">
      <Navbar />

      <main className="flex-1 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section d'accueil & présentation de l'impact */}
          <DonationHero />

          {/* Formulaire de don interactif */}
          <div className="mt-4">
            <DonationForm />
          </div>

          {/* Section FAQ & Transparence */}
          <div className="mt-16 pt-12 border-t border-white/10 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-xs uppercase tracking-wider font-semibold text-teal-400">
                Transparence & Questions Fréquentes
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Comment est utilisé votre don ?
              </h2>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h3 className="font-semibold text-white mb-1.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  À quoi servent les fonds collectés ?
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  100% des dons après frais bancaires sont alloués aux programmes d&apos;inclusion : création de bourses d&apos;études gratuites pour les apprenants méritants, serveurs pour les cours interactifs gratuits et production de tutoriels en accès libre.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h3 className="font-semibold text-white mb-1.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  Puis-je donner en monnaie locale africaine ?
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Absolument. Grâce à notre intégration Mobile Money certifiée (PawaPay), vous pouvez donner en Francs Congolais (CDF), Francs CFA (XAF/XOF), Francs Rwandais (RWF), Shillings ou USD directement depuis votre portefeuille M-Pesa, Orange Money, Airtel Money ou MTN.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h3 className="font-semibold text-white mb-1.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  Mon don est-il sécurisé et puis-je rester anonyme ?
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Oui. Vos transactions sont entièrement protégées par un chiffrement SSL de bout en bout et les normes bancaires des opérateurs. Vous pouvez cocher la case « Donner anonymement » pour que votre nom ne soit jamais rendu public.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

