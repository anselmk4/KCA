"use client";

import Link from "next/link";
import { Scale, CheckCircle2, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col font-sans bg-[#030712] text-white selection:bg-teal-500/30">
      <Navbar />
      
      <main className="flex-1 py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-8 text-left animate-in fade-in">
          
          <div className="flex items-center gap-3">
            <Scale className="w-8 h-8 text-teal-400" />
            <div>
              <h1 className="text-3xl font-black">Conditions Générales d&apos;Utilisation</h1>
              <p className="text-xs text-zinc-500 mt-1">Dernière mise à jour : 30 Juin 2026 • Plateforme ANSELLA</p>
            </div>
          </div>

          <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-6 text-sm text-zinc-300 leading-relaxed">
            
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full" />
                1. Acceptation des Conditions
              </h2>
              <p>
                En accédant et en utilisant la plateforme éducative ANSELLA, vous acceptez d&apos;être lié par les présentes conditions générales d&apos;utilisation, toutes les lois et réglementations applicables en République Démocratique du Congo (RDC) et dans les autres pays d&apos;Afrique où la plateforme opère. Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full" />
                2. Rôle d&apos;ANSELLA
              </h2>
              <p>
                ANSELLA agit en tant que fournisseur de technologie de gestion de l&apos;apprentissage (SaaS LMS) et intermédiaire de paiement électronique. Nous permettons aux créateurs indépendants (les Formateurs) de créer des académies de formation privées, et aux étudiants (les Apprenants) de s&apos;inscrire et d&apos;accéder aux cours.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full" />
                3. Responsabilités du Formateur
              </h2>
              <p>
                Le formateur est l&apos;unique propriétaire intellectuel et légal du contenu qu&apos;il publie (cours, vidéos, textes, supports). Il s&apos;engage à :
              </p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li>Ne pas violer les droits de propriété intellectuelle de tiers.</li>
                <li>Ne pas diffuser de contenu haineux, frauduleux, pornographique ou diffamatoire.</li>
                <li>Fournir un support adéquat aux apprenants selon la formule choisie.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full" />
                4. Paiements et Retraits via Mobile Money
              </h2>
              <p>
                La plateforme intègre des méthodes de paiement locales incluant M-Pesa, Orange Money, et Airtel Money.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li><strong>Pour les Apprenants :</strong> Tout achat de formation est définitif après validation de la transaction Mobile Money ou bancaire.</li>
                <li><strong>Pour les Formateurs :</strong> Les retraits s&apos;effectuent après déduction des frais de service correspondant au plan de facturation actif. Ansella n&apos;est pas responsable des erreurs de numéros de téléphone fournis pour les virements.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full" />
                5. Sécurité et Hébergement
              </h2>
              <p>
                ANSELLA déploie des systèmes de cryptage et des lecteurs vidéo sécurisés pour limiter au maximum le téléchargement illégal de vos cours. Cependant, le formateur comprend que le risque zéro sur Internet n&apos;existe pas et décharge ANSELLA de toute responsabilité en cas de piratage externe échappant à notre contrôle standard.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full" />
                6. Résiliation
              </h2>
              <p>
                Nous nous réservons le droit de suspendre ou de fermer définitivement le compte de tout formateur ou apprenant en cas de non-respect flagrant des présentes conditions, de tentative de fraude de paiement, ou de signalement répété de contenu illicite.
              </p>
            </section>

          </div>

          <div className="flex justify-start">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
