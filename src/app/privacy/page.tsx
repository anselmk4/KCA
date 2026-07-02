"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-slate-100 via-teal-50/50 to-blue-50/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white selection:bg-teal-500/30">
      <Navbar />
      
      <main className="flex-1 py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-8 text-left animate-in fade-in">
          
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-teal-400" />
            <div>
              <h1 className="text-3xl font-black">Politique de Confidentialité</h1>
              <p className="text-xs text-zinc-500 mt-1">Dernière mise à jour : 30 Juin 2026 • Plateforme ANSELLA</p>
            </div>
          </div>

          <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-6 text-sm text-zinc-300 leading-relaxed">
            
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full" />
                1. Données Collectées
              </h2>
              <p>
                Lorsque vous créez un compte apprenant ou formateur sur ANSELLA, nous collectons les informations nécessaires à votre identification et à la fourniture de nos services :
              </p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li>Votre nom complet et adresse e-mail.</li>
                <li>Les informations de votre profil public (nationalité, biographie, photo de profil).</li>
                <li>Vos coordonnées de facturation pour les encaissements ou les paiements Mobile Money.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full" />
                2. Utilisation de vos Données
              </h2>
              <p>
                Vos informations personnelles nous permettent de personnaliser votre expérience sur la plateforme éducative, notamment pour :
              </p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li>Gérer vos inscriptions à des cours et suivre votre progression.</li>
                <li>Valider et exécuter les paiements de cours via M-Pesa, Orange Money, Airtel Money.</li>
                <li>Générer et certifier vos diplômes ou certificats de réussite.</li>
                <li>Assurer le support client et vous envoyer des notifications importantes de sécurité.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full" />
                3. Confidentialité et Partage
              </h2>
              <p>
                ANSELLA s&apos;engage à ne jamais revendre vos données personnelles à des fins commerciales. Elles ne sont partagées qu&apos;avec les tiers essentiels à notre bon fonctionnement (services de base de données Supabase, passerelles de paiement électronique pour les transactions Mobile Money).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full" />
                4. Sécurité des Informations
              </h2>
              <p>
                Nous utilisons les standards de l&apos;industrie technologique pour protéger vos informations personnelles. L&apos;authentification de notre plateforme s&apos;appuie sur Supabase Auth, assurant un cryptage renforcé de vos identifiants et données de sessions de connexion.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full" />
                5. Vos Droits
              </h2>
              <p>
                Conformément à la réglementation sur la protection des données personnelles, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Vous pouvez effectuer ces modifications depuis votre page de paramètres de profil sur la plateforme ou en contactant notre équipe d&apos;administration.
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
