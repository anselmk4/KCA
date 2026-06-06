import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Image from "next/image";
import { GraduationCap, Award, ShieldCheck, Mail, Phone, MapPin, Send } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col font-sans bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-blue-950/20 via-transparent to-transparent">
          <div className="container mx-auto px-4 md:px-8 text-center max-w-4xl">
            <span className="inline-flex items-center rounded-full border border-blue-500/30 px-3 py-1 text-sm font-semibold mb-6 text-blue-400 bg-blue-950/50 backdrop-blur-sm">
              À propos d'ANSELLA
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
              Révolutionner l'éducation numérique en RDC & en Afrique
            </h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              Une plateforme 100% Congolaise tout-en-un conçue pour autonomiser les formateurs, experts et apprenants grâce aux technologies modernes.
            </p>
          </div>
        </section>

        {/* Section 1: Ansel Makomo, Visionnaire & PDG */}
        <section className="py-20 border-t border-zinc-200 dark:border-white/10">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 relative aspect-square w-full max-w-[400px] mx-auto lg:max-w-none rounded-3xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-2xl">
                <Image
                  src="/ceo-ansel-makomo.png"
                  alt="Ingénieur Ansel Makomo - PDG de Kuettu Corporation SARL"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-blue-400 bg-blue-950/30 border border-blue-500/20">
                  Le Fondateur & Visionnaire
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Ingénieur Ansel Makomo
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg italic">
                  Concepteur de la plateforme ANSELLA & Président Directeur Général de Kuettu Corporation SARL.
                </p>
                <div className="space-y-4 text-zinc-600 dark:text-zinc-300 leading-relaxed text-base">
                  <p>
                    Reconnu pour son esprit d'innovation exceptionnel et son leadership pragmatique, l'<strong>Ingénieur Ansel Makomo</strong> est l'architecte principal d'ANSELLA. Sous sa direction inspirée au sein de <strong>Kuettu Corporation SARL</strong>, il façonne le futur de la technologie éducative et financière en Afrique centrale.
                  </p>
                  <p>
                    Doté d'une expertise technique remarquable et d'une vision d'impact sociétal hors pair, l'Ingénieur Ansel Makomo s'efforce de briser les barrières d'accès au savoir de pointe (Blockchain, Web3, Intelligence Artificielle). Sa rigueur académique combinée à une compréhension fine des réalités du continent africain fait de lui l'un des leaders technologiques les plus visionnaires de sa génération.
                  </p>
                  <p>
                    À travers ANSELLA, il offre aux créateurs de contenu locaux une infrastructure robuste et souveraine, démontrant qu'une solution 100% congolaise peut égaler et surpasser les standards technologiques internationaux.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Histoire et Problème résolu */}
        <section className="py-20 bg-zinc-100/50 dark:bg-zinc-900/20 border-t border-zinc-200 dark:border-white/10">
          <div className="container mx-auto px-4 md:px-8 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Notre Histoire & Notre Mission</h2>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
                Pourquoi ANSELLA a été créée et quel défi majeur elle relève au quotidien.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-white/10">
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center mb-6">
                  <ShieldCheck className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Le Problème Résolu</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base leading-relaxed">
                  En RDC et dans de nombreux pays africains, les créateurs de cours et experts faisaient face à un obstacle insurmontable : l'impossibilité d'intégrer facilement les paiements par Mobile Money (M-Pesa, Airtel Money, Orange Money) sur les plateformes éducatives occidentales. Les apprenants sans carte bancaire étaient exclus du savoir en ligne, et les formateurs ne pouvaient pas monétiser leur expertise localement.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-white/10">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center mb-6">
                  <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Notre Solution</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base leading-relaxed">
                  ANSELLA est née pour unifier l'apprentissage en ligne et la finance mobile africaine. Conçue par Kuettu Corporation SARL, elle propose un LMS moderne, fluide, sécurisé et nativement connecté aux services de paiement locaux. Désormais, n'importe quel formateur peut lancer son académie certifiante en quelques minutes et collecter ses gains instantanément.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Localisation (Bukavu Map) & Formulaire de contact */}
        <section className="py-20 border-t border-zinc-200 dark:border-white/10">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="bg-white dark:bg-zinc-900 p-8 md:p-10 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm">
                <h3 className="text-2xl font-bold mb-2">Nous Contacter</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm md:text-base">
                  Une question ? Un projet de digitalisation d'académie ? Écrivez-nous directement.
                </p>

                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-zinc-500 dark:text-zinc-400">Nom Complet</label>
                      <input
                        type="text"
                        placeholder="Ex: Jean Mukendi"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-zinc-500 dark:text-zinc-400">Adresse Email</label>
                      <input
                        type="email"
                        placeholder="Ex: jean.m@ansella.app"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-zinc-500 dark:text-zinc-400">Sujet</label>
                    <input
                      type="text"
                      placeholder="Ex: Partenariat Académique"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-zinc-500 dark:text-zinc-400">Message</label>
                    <textarea
                      rows={5}
                      placeholder="Décrivez votre besoin..."
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    <span>Envoyer le Message</span>
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {/* Map & Office Info */}
              <div className="flex flex-col justify-between gap-8">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">Notre Siège Social</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base leading-relaxed">
                    Situé dans la ville de Bukavu en République Démocratique du Congo, le siège d'ANSELLA et de Kuettu Corporation SARL pilote le développement de la plateforme pour toute l'Afrique.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-blue-500 shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-sm">Adresse</h4>
                        <p className="text-xs text-zinc-500">Bukavu, Sud-Kivu, RDC</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-emerald-500 shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-sm">Email</h4>
                        <p className="text-xs text-zinc-500">info@ansella.app</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 col-span-1 sm:col-span-2">
                      <Phone className="h-5 w-5 text-purple-500 shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-sm">Téléphone</h4>
                        <p className="text-xs text-zinc-500">+243 990 387 237</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Google Maps Bukavu Iframe */}
                <div className="w-full aspect-video rounded-3xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-sm relative min-h-[280px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31893.996160897717!2d28.84078601625902!3d-2.5085449767858023!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19c298fe260c6d69%3A0x8ad3cb7f9b8c0a5e!2sBukavu!5e0!3m2!1sfr!2scd!4v1717800000000!5m2!1sfr!2scd"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
