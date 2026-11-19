"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Loader2, 
  CheckCircle2, 
  MessageSquare, 
  Sparkles,
  Clock,
  HelpCircle,
  Headphones
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function ContactPage() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "general",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { getDB, saveDB } = await import("@/lib/db");
      const currentDB = getDB();
      const newMsg = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        subject: `[${form.category.toUpperCase()}] ${form.subject.trim() || (isEn ? "General Inquiry" : "Demande de contact")}`,
        message: form.message.trim(),
        createdAt: new Date().toISOString(),
      };

      currentDB.contactMessages = [newMsg, ...(currentDB.contactMessages || [])];
      saveDB(currentDB);

      setSuccess(true);
      setForm({ name: "", email: "", category: "general", subject: "", message: "" });
    } catch (err: any) {
      console.error("Error submitting contact form:", err);
      setError(isEn ? "Unable to send your message. Please try again." : "Impossible d'envoyer votre message. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col font-sans bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-teal-500/30">
      <Navbar />

      <main className="flex-1 py-16 md:py-24 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-teal-500/5 dark:bg-teal-500/[0.03] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 max-w-6xl relative z-10 space-y-16">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 mx-auto">
              <Headphones className="w-3.5 h-3.5" />
              <span>{isEn ? "Contact & Support" : "Contact & Support Client"}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-zinc-900 dark:text-white">
              {isEn ? "We're here to " : "Une question ? Notre équipe est "}
              <span className="bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500 bg-clip-text text-transparent">
                {isEn ? "help you succeed" : "à votre écoute"}
              </span>
            </h1>

            <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              {isEn
                ? "Have a question about our instructor plans, digital store, mobile money integrations, or custom partnerships? Send us a message and our team will get back to you promptly."
                : "Vous avez une question sur nos forfaits créateurs, la boutique digitale, les retraits Mobile Money ou un partenariat ? Écrivez-nous et notre équipe vous répondra sous 24h."}
            </p>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                {isEn ? "Email Support" : "Support par Email"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isEn ? "General questions & assistance" : "Questions générales & assistance"}
              </p>
              <a href="mailto:info@ansella.app" className="inline-block text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline pt-1">
                info@ansella.app
              </a>
            </div>

            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                {isEn ? "Phone & WhatsApp" : "Téléphone & WhatsApp"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isEn ? "Mon - Sat from 8:00 to 18:00" : "Lun - Sam de 08h à 18h"}
              </p>
              <a href="tel:+243990387237" className="inline-block text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1">
                +243 990 387 237
              </a>
            </div>

            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                {isEn ? "Headquarters" : "Siège Social"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isEn ? "Bukavu, DRC (International Office)" : "Bukavu, RDC (Bureau International)"}
              </p>
              <span className="inline-block text-[11px] text-zinc-400 pt-1">
                Kuettu Corporation SARL
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                {isEn ? "Response Time" : "Délai de Réponse"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isEn ? "Average response under 24 hours" : "Réponse moyenne en moins de 24h"}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {isEn ? "Support Active" : "Support Actif"}
              </span>
            </div>
          </div>

          {/* Form & Map Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mb-2">
                {isEn ? "Send a Message" : "Envoyez-nous un message"}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-8">
                {isEn
                  ? "Fill out the form below and an Ansella representative will reach out to you shortly."
                  : "Remplissez ce formulaire et un conseiller ANSELLA vous répondra rapidement."}
              </p>

              {success && (
                <div className="mb-6 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-800 dark:text-teal-300 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-teal-500" />
                  <span>
                    {isEn
                      ? "Thank you! Your message has been received. Our team will contact you shortly."
                      : "Merci ! Votre message a bien été transmis. Notre équipe vous contactera dans les plus brefs délais."}
                  </span>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-zinc-600 dark:text-zinc-400">
                      {isEn ? "Full Name" : "Nom & Prénom"} *
                    </label>
                    <input
                      type="text"
                      placeholder={isEn ? "E.g. John Doe" : "Ex. Jean Mukendi"}
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-zinc-600 dark:text-zinc-400">
                      {isEn ? "Email Address" : "Adresse Email"} *
                    </label>
                    <input
                      type="email"
                      placeholder={isEn ? "E.g. john@example.com" : "Ex. jean@example.com"}
                      value={form.email}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-zinc-600 dark:text-zinc-400">
                      {isEn ? "Inquiry Category" : "Catégorie de la demande"}
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors cursor-pointer"
                    >
                      <option value="general">{isEn ? "General Inquiry" : "Question Générale"}</option>
                      <option value="instructor">{isEn ? "Instructor & Academy Setup" : "Création d'Académie Formateur"}</option>
                      <option value="store">{isEn ? "Digital Store & Products" : "Boutique Digitale & Produits"}</option>
                      <option value="payments">{isEn ? "Payments & Mobile Money" : "Paiements & Mobile Money"}</option>
                      <option value="partnership">{isEn ? "Institutional Partnership" : "Partenariat Institutionnel"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-zinc-600 dark:text-zinc-400">
                      {isEn ? "Subject" : "Sujet"}
                    </label>
                    <input
                      type="text"
                      placeholder={isEn ? "Brief description" : "Objet de votre demande"}
                      value={form.subject}
                      onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-zinc-600 dark:text-zinc-400">
                    {isEn ? "Message" : "Votre Message"} *
                  </label>
                  <textarea
                    rows={5}
                    placeholder={isEn ? "Provide as much detail as possible so we can best assist you..." : "Détaillez votre demande pour nous permettre de vous répondre efficacement..."}
                    value={form.message}
                    onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer shadow-md shadow-teal-500/10 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  ) : (
                    <>
                      <span>{isEn ? "Send Message" : "Envoyer le message"}</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Google Maps & Office Info (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-500" />
                  <span>{isEn ? "Bukavu International Headquarters" : "Siège International à Bukavu"}</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {isEn
                    ? "Our technological innovation center operates from Bukavu, serving instructors and students across the African continent and globally."
                    : "Notre centre de développement et d'innovation technologique opère depuis Bukavu, au service des formateurs et apprenants à travers toute l'Afrique et le monde."}
                </p>

                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 min-h-[260px] bg-zinc-100 dark:bg-zinc-900 relative">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31893.996160897717!2d28.84078601625902!3d-2.5085449767858023!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19c298fe260c6d69%3A0x8ad3cb7f9b8c0a5e!2sBukavu!5e0!3m2!1sen!2scd!4v1717800000000!5m2!1sen!2scd"
                    width="100%"
                    height="100%"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 dark:invert-[90%] dark:hue-rotate-[180deg] dark:brightness-[95%] dark:contrast-[90%]"
                    style={{ border: 0 }}
                  />
                </div>
              </div>

              {/* Direct WhatsApp Callout */}
              <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 rounded-3xl p-6 text-zinc-900 dark:text-white space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isEn ? "Instant Assistance" : "Assistance Immédiate"}</span>
                </div>
                <h4 className="font-extrabold text-sm">
                  {isEn ? "Need real-time onboarding help?" : "Besoin d'une aide rapide pour créer votre cours ?"}
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {isEn
                    ? "Our technical onboarding agents can guide you step-by-step through setting up your first academy."
                    : "Nos conseillers peuvent vous accompagner pas à pas pour configurer votre première formation et vos paiements."}
                </p>
                <a
                  href="https://wa.me/243990387237"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isEn ? "Chat on WhatsApp" : "Discuter sur WhatsApp"}</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
