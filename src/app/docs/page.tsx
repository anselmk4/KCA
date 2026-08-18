import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DocsClientView } from "./DocsClientView";

export const metadata: Metadata = {
  title: "Documentation Officielle Formateurs & Académies | ANSELLA",
  description:
    "Guide complet d'utilisation de la plateforme ANSELLA pour les formateurs, créateurs et académies : création de cours, IA pédagogique, Mobile Money, certificats LinkedIn et co-gestion.",
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    title: "Centre de Documentation Formateurs — Plateforme ANSELLA",
    description:
      "Toutes les étapes pour créer, monétiser, gérer vos collaborateurs et certifier vos apprenants en Afrique et dans le monde.",
    url: "https://ansella.app/docs",
  },
};

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <Navbar />
      <DocsClientView />
      <Footer />
    </div>
  );
}
