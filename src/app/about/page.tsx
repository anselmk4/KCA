"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Image from "next/image";
import { GraduationCap, Award, ShieldCheck, Mail, Phone, MapPin, Send } from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function AboutPage() {
  const pageVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };


  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-slate-100 via-teal-50/50 to-blue-50/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white selection:bg-teal-500/30">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden bg-gradient-to-b from-teal-950/15 via-transparent to-transparent">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="container mx-auto px-4 md:px-8 text-center max-w-4xl relative z-10 space-y-6">
            <motion.span 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center rounded-full border border-teal-500/20 px-4 py-1.5 text-xs font-bold text-teal-400 bg-teal-950/30 backdrop-blur-md"
            >
              À propos d&apos;ANSELLA
            </motion.span>
            
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-white"
            >
              Révolutionner l&apos;éducation numérique en{" "}
              <span className="bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">RDC & en Afrique</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
            >
              Une plateforme 100% Congolaise tout-en-un conçue pour autonomiser les formateurs, experts et apprenants grâce aux technologies modernes.
            </motion.p>
          </div>
        </section>

        {/* Section 1: Ansel Makomo, Visionnaire & PDG */}
        <section className="py-24 border-t border-zinc-900 bg-zinc-950/10">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            <motion.div 
              variants={pageVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center"
            >
              <motion.div 
                variants={itemVariants}
                className="lg:col-span-5 relative aspect-square w-full max-w-[400px] mx-auto lg:max-w-none rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900/40"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-teal-500/10 to-transparent z-10 pointer-events-none" />
                <Image
                  src="/ceo-ansel-makomo.png"
                  alt="Ingénieur Ansel Makomo - PDG de Kuettu Corporation SARL"
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center rounded-full px-3.5 py-1 text-xxs font-bold uppercase tracking-wider text-teal-400 bg-teal-950/30 border border-teal-500/20">
                  Le Fondateur & Visionnaire
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                  Ingénieur Ansel Makomo
                </h2>
                <p className="text-teal-400 font-semibold text-base md:text-lg italic">
                  Concepteur de la plateforme ANSELLA & Président Directeur Général de Kuettu Corporation SARL.
                </p>
                <div className="space-y-4 text-zinc-400 leading-relaxed text-sm md:text-base">
                  <p>
                    Reconnu pour son esprit d&apos;innovation exceptionnel et son leadership pragmatique, l&apos;<strong>Ingénieur Ansel Makomo</strong> est l&apos;architecte principal d&apos;ANSELLA. Sous sa direction inspirée au sein de <strong>Kuettu Corporation SARL</strong>, il façonne le futur de la technologie éducative et financière en Afrique centrale.
                  </p>
                  <p>
                    Doté d&apos;une expertise technique remarquable et d&apos;une vision d&apos;impact sociétal hors pair, l&apos;Ingénieur Ansel Makomo s&apos;efforce de briser les barrières d&apos;accès au savoir de pointe (Blockchain, Web3, Intelligence Artificielle). Sa rigueur académique combinée à une compréhension fine des réalités du continent africain fait de lui l&apos;un des leaders technologiques les plus visionnaires de sa génération.
                  </p>
                  <p>
                    À travers ANSELLA, il offre aux créateurs de contenu locaux une infrastructure robuste et souveraine, démontrant qu&apos;une solution 100% congolaise peut égaler et surpasser les standards technologiques internationaux.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Section 2: Histoire et Problème résolu */}
        <section className="py-24 bg-zinc-950/20 border-t border-zinc-900">
          <div className="container mx-auto px-4 md:px-8 max-w-5xl">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-3xl md:text-4xl font-black text-white">Notre Histoire & Notre Mission</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-lg mx-auto">
                Pourquoi ANSELLA a été créée et quel défi majeur elle relève au quotidien.
              </p>
            </div>

            <motion.div 
              variants={pageVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <motion.div variants={itemVariants} className="bg-zinc-950/40 p-8 rounded-3xl border border-zinc-850 hover:border-teal-500/30 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                  <ShieldCheck className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-lg font-bold mb-3 text-white">Le Problème Résolu</h3>
                <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                  En RDC et dans de nombreux pays africains, les créateurs de cours et experts faisaient face à un obstacle insurmontable : l&apos;impossibilité d&apos;intégrer facilement les paiements par Mobile Money (M-Pesa, Airtel Money, Orange Money) sur les plateformes éducatives occidentales. Les apprenants sans carte bancaire étaient exclus du savoir en ligne, et les formateurs ne pouvaient pas monétiser leur expertise localement.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-zinc-950/40 p-8 rounded-3xl border border-zinc-850 hover:border-teal-500/30 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6">
                  <GraduationCap className="h-6 w-6 text-teal-400" />
                </div>
                <h3 className="text-lg font-bold mb-3 text-white">Notre Solution</h3>
                <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                  ANSELLA est née pour unifier l&apos;apprentissage en ligne et la finance mobile africaine. Conçue par Kuettu Corporation SARL, elle propose un LMS moderne, fluide, sécurisé et nativement connecté aux services de paiement locaux. Désormais, n&apos;importe quel formateur peut lancer son académie certifiante en quelques minutes et collecter ses gains instantanément.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Section 3: Localisation & Formulaire de contact */}
        <section className="py-24 border-t border-zinc-900">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              
              {/* Contact Form */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-zinc-950/40 p-8 md:p-10 rounded-3xl border border-zinc-850 shadow-sm space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold text-white">Nous Contacter</h3>
                  <p className="text-zinc-500 text-xs md:text-sm mt-1">
                    Une question ? Un projet de digitalisation d&apos;académie ? Écrivez-nous directement.
                  </p>
                </div>

                <form className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-zinc-500">Nom Complet</label>
                      <input
                        type="text"
                        placeholder="Ex: Jean Mukendi"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/20 focus:bg-zinc-900/60 focus:border-teal-500/50 text-white outline-none text-xs transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-zinc-500">Adresse Email</label>
                      <input
                        type="email"
                        placeholder="Ex: jean.m@ansella.app"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/20 focus:bg-zinc-900/60 focus:border-teal-500/50 text-white outline-none text-xs transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-zinc-500">Sujet</label>
                    <input
                      type="text"
                      placeholder="Ex: Partenariat Académique"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/20 focus:bg-zinc-900/60 focus:border-teal-500/50 text-white outline-none text-xs transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-zinc-500">Message</label>
                    <textarea
                      rows={5}
                      placeholder="Décrivez votre besoin..."
                      className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/20 focus:bg-zinc-900/60 focus:border-teal-500/50 text-white outline-none text-xs transition-colors resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-pointer shadow-md shadow-teal-500/10"
                  >
                    <span>Envoyer le Message</span>
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </motion.div>

              {/* Map & Office Info */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex flex-col justify-between gap-8"
              >
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-white">Notre Siège Social</h3>
                  <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                    Situé dans la ville de Bukavu en République Démocratique du Congo, le siège d&apos;ANSELLA et de Kuettu Corporation SARL pilote le développement de la plateforme pour toute l&apos;Afrique.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 shrink-0">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">Adresse</h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Bukavu, Sud-Kivu, RDC</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">Email</h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">info@ansella.app</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 col-span-1 sm:col-span-2">
                      <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">Téléphone</h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">+243 990 387 237</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Google Maps Bukavu Iframe */}
                <div className="w-full aspect-video rounded-3xl overflow-hidden border border-zinc-800 shadow-sm relative min-h-[280px] bg-zinc-950">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31893.996160897717!2d28.84078601625902!3d-2.5085449767858023!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19c298fe260c6d69%3A0x8ad3cb7f9b8c0a5e!2sBukavu!5e0!3m2!1sfr!2scd!4v1717800000000!5m2!1sfr!2scd"
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0"
                  />
                </div>
              </motion.div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
