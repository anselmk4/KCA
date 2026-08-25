"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Send,
  Mail,
  Users,
  GraduationCap,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  X,
  RefreshCcw,
  Smartphone,
  Monitor,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  Clock,
  History,
} from "lucide-react";

interface RecipientCounts {
  students: number;
  instructors: number;
  all: number;
}

interface SentHistoryItem {
  id: string;
  date: string;
  subject: string;
  targetType: string;
  sentCount: number;
  total: number;
}

export default function AdminEmailsPage() {
  const [targetType, setTargetType] = useState<"custom" | "students" | "instructors" | "all">("custom");
  const [customEmailInput, setCustomEmailInput] = useState("");
  const [customEmailsList, setCustomEmailsList] = useState<string[]>(["anselmk4@gmail.com"]);
  
  const [subject, setSubject] = useState("Mise à jour importante de votre plateforme d'apprentissage");
  const [heading, setHeading] = useState("Information importante concernant vos accès");
  const [message, setMessage] = useState(
    "Bonjour,\n\nNous sommes ravis de vous présenter les nouvelles fonctionnalités disponibles dès aujourd'hui sur votre plateforme Ansella.\n\nVous pouvez désormais accéder à de nouveaux modules certifiants, suivre vos cours avec une expérience enrichie et interagir directement avec la communauté."
  );

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [buttonText, setButtonText] = useState("Accéder à la plateforme");
  const [buttonUrl, setButtonUrl] = useState("https://ansella.app/dashboard");
  const [infoBoxType, setInfoBoxType] = useState<"none" | "info" | "success" | "warning">("info");
  const [infoBoxText, setInfoBoxText] = useState("Note : Cette mise à jour est effective immédiatement sur l'ensemble de vos espaces.");

  // States
  const [counts, setCounts] = useState<RecipientCounts>({ students: 0, instructors: 0, all: 0 });
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; sentCount: number; failedCount: number; total: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local sent history
  const [sentHistory, setSentHistory] = useState<SentHistoryItem[]>([
    {
      id: "hist-1",
      date: new Date().toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      subject: "Test de connexion Resend",
      targetType: "anselmk4@gmail.com",
      sentCount: 1,
      total: 1,
    },
  ]);

  // Load counts
  useEffect(() => {
    async function loadCounts() {
      try {
        setLoadingCounts(true);
        const res = await fetch("/api/admin/emails/recipients");
        if (res.ok) {
          const data = await res.json();
          if (data.counts) setCounts(data.counts);
        }
      } catch (err) {
        console.error("Error loading recipient counts:", err);
      } finally {
        setLoadingCounts(false);
      }
    }
    loadCounts();
  }, []);

  // Quick subject suggestions
  const SUBJECT_SUGGESTIONS = [
    "📢 Annonce importante pour votre formation",
    "🚀 Nouvelle masterclass disponible sur Ansella",
    "🎉 Félicitations pour votre parcours d'apprentissage",
    "🛠️ Maintenance programmée de la plateforme",
    "💎 Offre exclusive : Débloquez vos certifications",
  ];

  const handleAddCustomEmail = () => {
    const raw = customEmailInput.trim();
    if (!raw) return;

    // Handle comma, semicolon, space, or newline separated emails
    const emails = raw
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (emails.length > 0) {
      setCustomEmailsList((prev) => Array.from(new Set([...prev, ...emails])));
      setCustomEmailInput("");
      setErrorMessage(null);
    } else {
      setErrorMessage("Veuillez saisir une ou plusieurs adresses e-mails valides.");
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setCustomEmailsList((prev) => prev.filter((e) => e !== emailToRemove));
  };

  const estimatedRecipientsCount = useMemo(() => {
    if (targetType === "custom") return customEmailsList.length;
    if (targetType === "students") return counts.students;
    if (targetType === "instructors") return counts.instructors;
    if (targetType === "all") return counts.all;
    return 0;
  }, [targetType, customEmailsList, counts]);

  const handleSend = async () => {
    setErrorMessage(null);
    setSendResult(null);

    if (targetType === "custom" && customEmailsList.length === 0) {
      setErrorMessage("Veuillez ajouter au moins une adresse email destinataire.");
      return;
    }

    if (!subject.trim()) {
      setErrorMessage("L'objet de l'email est obligatoire.");
      return;
    }

    if (!message.trim()) {
      setErrorMessage("Le corps du message est obligatoire.");
      return;
    }

    const confirmText =
      targetType === "custom"
        ? `Êtes-vous sûr de vouloir envoyer cet email à ${customEmailsList.length} destinataire(s) ?`
        : `Êtes-vous sûr de vouloir diffuser cet email à ${estimatedRecipientsCount} utilisateur(s) (${targetType}) ?`;

    if (!window.confirm(confirmText)) return;

    setSending(true);

    try {
      const res = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          customEmails: customEmailsList,
          subject,
          heading,
          message,
          buttonText: showAdvanced && buttonText.trim() ? buttonText.trim() : undefined,
          buttonUrl: showAdvanced && buttonUrl.trim() ? buttonUrl.trim() : undefined,
          infoBoxType: showAdvanced && infoBoxType !== "none" ? infoBoxType : undefined,
          infoBoxText: showAdvanced && infoBoxType !== "none" ? infoBoxText.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'envoi.");
      }

      setSendResult({
        success: true,
        sentCount: data.sentCount,
        failedCount: data.failedCount,
        total: data.total,
      });

      // Add to sent history
      setSentHistory((prev) => [
        {
          id: `hist-${Date.now()}`,
          date: new Date().toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          subject,
          targetType: targetType === "custom" ? `${data.sentCount} adresse(s)` : targetType.toUpperCase(),
          sentCount: data.sentCount,
          total: data.total,
        },
        ...prev,
      ]);
    } catch (err: any) {
      console.error("Send email error:", err);
      setErrorMessage(err.message || "Erreur d'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/50 text-xs font-bold uppercase tracking-wider mb-2">
            <Mail className="w-3.5 h-3.5" />
            <span>Communication & Diffusion</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Centre d&apos;Emails Officiels
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Rédigez et envoyez des emails directement habillés avec la charte officielle <strong>Ansella Learning Platform</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Moteur Resend Actif (noreply@ansella.app)</span>
          </div>
        </div>
      </div>

      {/* ── Main Two Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Column: Form / Composer (7 cols) ── */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-red-500" />
                <span>Composer un Email</span>
              </h2>
              <span className="text-xs font-semibold text-zinc-400">
                Gabarit Ansella automatique
              </span>
            </div>

            {errorMessage && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-400 text-xs animate-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {sendResult && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-start gap-3 text-emerald-700 dark:text-emerald-400 text-xs animate-in slide-in-from-top-1">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-bold text-sm">Emails envoyés avec succès ! 🎉</p>
                  <p className="mt-0.5">
                    <strong>{sendResult.sentCount}</strong> email(s) délivré(s) sur {sendResult.total} destinataire(s).
                    {sendResult.failedCount > 0 && ` (${sendResult.failedCount} échecs)`}
                  </p>
                </div>
              </div>
            )}

            {/* 1. Audience Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                1. Sélection des Destinataires
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: "custom", label: "Personnalisés", icon: Mail, count: `${customEmailsList.length}` },
                  { key: "students", label: "Tous Étudiants", icon: GraduationCap, count: loadingCounts ? "…" : `${counts.students}` },
                  { key: "instructors", label: "Tous Formateurs", icon: Sparkles, count: loadingCounts ? "…" : `${counts.instructors}` },
                  { key: "all", label: "Tous Membres", icon: Users, count: loadingCounts ? "…" : `${counts.all}` },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = targetType === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setTargetType(tab.key as any)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? "bg-red-50/80 dark:bg-red-950/30 border-red-500 text-red-700 dark:text-red-400 ring-2 ring-red-500/20"
                          : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-red-600" : "text-zinc-400"}`} />
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          isSelected ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                        }`}>
                          {tab.count}
                        </span>
                      </div>
                      <span className="text-xs font-bold truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Emails Chip / Tag Manager */}
              {targetType === "custom" && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customEmailInput}
                      onChange={(e) => setCustomEmailInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomEmail();
                        }
                      }}
                      placeholder="Ex: user@domaine.com (séparez par virgule ou espace)"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-red-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomEmail}
                      className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter</span>
                    </button>
                  </div>

                  {customEmailsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {customEmailsList.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-2xs"
                        >
                          <span>{email}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(email)}
                            className="text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Email Subject & Suggestions */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                2. Objet de l&apos;Email (Subject) *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Information importante concernant votre formation..."
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 text-sm font-semibold focus:ring-2 focus:ring-red-500 outline-none transition-all"
              />

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUBJECT_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setSubject(sug);
                      if (!heading) setHeading(sug);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Heading Title inside the email */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                3. Titre Principal dans l&apos;Email (&lt;h2&gt;)
              </label>
              <input
                type="text"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="Titre mis en avant au sommet du message"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            {/* 4. Body Content */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                4. Corps du Message *
              </label>
              <textarea
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Écrivez votre message ici... Les sauts de ligne formeront automatiquement des paragraphes élégants."
                className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 text-sm leading-relaxed focus:ring-2 focus:ring-red-500 outline-none resize-y"
              />
              <p className="text-[11px] text-zinc-400">
                Astuce : Sautez une ligne pour créer un nouveau paragraphe propre.
              </p>
            </div>

            {/* 5. Options avancées (Bouton d'action + Encadré) */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <span>Options avancées (Bouton d&apos;action & Encadré d&apos;alerte)</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="p-4 space-y-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in duration-200">
                  {/* Action Button */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                        Texte du Bouton (Call-to-Action)
                      </label>
                      <input
                        type="text"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder="Ex: Découvrir le cours"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                        Lien URL du Bouton
                      </label>
                      <input
                        type="url"
                        value={buttonUrl}
                        onChange={(e) => setButtonUrl(e.target.value)}
                        placeholder="https://ansella.app/..."
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Info / Alert Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                        Type d&apos;Encadré
                      </label>
                      <select
                        value={infoBoxType}
                        onChange={(e) => setInfoBoxType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-red-500 outline-none cursor-pointer"
                      >
                        <option value="none">Aucun encadré</option>
                        <option value="info">Information (Bleu / Indigo)</option>
                        <option value="success">Succès / Validation (Vert)</option>
                        <option value="warning">Alerte / Attention (Ambre)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                        Texte de l&apos;Encadré
                      </label>
                      <input
                        type="text"
                        disabled={infoBoxType === "none"}
                        value={infoBoxText}
                        onChange={(e) => setInfoBoxText(e.target.value)}
                        placeholder="Texte mis en valeur..."
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-red-500 outline-none disabled:opacity-40"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Send Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={sending || estimatedRecipientsCount === 0}
                onClick={handleSend}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Envoi en cours ({estimatedRecipientsCount} destinataires)...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Envoyer l&apos;Email ({estimatedRecipientsCount} destinataire{estimatedRecipientsCount > 1 ? "s" : ""})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Column: Live Visual Preview (5 cols) ── */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-zinc-400" />
              <span>Aperçu en Direct (Standard Ansella)</span>
            </span>

            {/* Device switch */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  previewDevice === "desktop" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs" : "text-zinc-400"
                }`}
                title="Vue Ordinateur"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  previewDevice === "mobile" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs" : "text-zinc-400"
                }`}
                title="Vue Mobile"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Email Canvas Preview Container */}
          <div className={`mx-auto transition-all duration-300 ${previewDevice === "mobile" ? "max-w-xs" : "w-full"}`}>
            <div className="bg-[#f8fafc] dark:bg-zinc-950 p-4 md:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-inner font-sans">
              {/* Outer Card */}
              <div className="bg-white text-zinc-800 rounded-2xl shadow-sm border border-zinc-200 overflow-hidden text-left">
                {/* Purple Top Bar */}
                <div className="h-1 bg-[#4f46e5] w-full" />

                {/* Logo */}
                <div className="px-6 pt-6 pb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="ANSELLA" className="h-7 w-auto object-contain" />
                </div>

                {/* Content */}
                <div className="px-6 pb-6 space-y-3">
                  <h2 className="text-lg font-extrabold text-zinc-900 tracking-tight leading-snug mt-2">
                    {heading || subject || "Titre de votre email"}
                  </h2>

                  <div className="text-xs text-zinc-600 leading-relaxed whitespace-pre-line space-y-2">
                    {message || "Le contenu de votre message apparaîtra ici..."}
                  </div>

                  {/* Info Box Preview */}
                  {showAdvanced && infoBoxType !== "none" && infoBoxText && (
                    <div className={`p-3 rounded-xl text-xs border border-l-4 my-3 ${
                      infoBoxType === "success"
                        ? "bg-emerald-50 border-emerald-200 border-l-emerald-600 text-emerald-800"
                        : infoBoxType === "warning"
                        ? "bg-amber-50 border-amber-200 border-l-amber-500 text-amber-900"
                        : "bg-slate-50 border-slate-200 border-l-[#4f46e5] text-slate-700"
                    }`}>
                      {infoBoxText}
                    </div>
                  )}

                  {/* Button Preview */}
                  {showAdvanced && buttonText && (
                    <div className="pt-3 pb-1 text-center">
                      <span className="inline-block px-6 py-2.5 bg-[#4f46e5] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20">
                        {buttonText}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Inner Footer */}
                <div className="bg-[#f8fafc] px-6 py-4 border-t border-zinc-100 text-[11px] text-zinc-500 leading-relaxed">
                  Si vous n&apos;avez pas demandé cette notification, vous pouvez ignorer cet e-mail en toute sécurité.
                </div>
              </div>

              {/* Outer Footer */}
              <div className="text-center pt-5 pb-2 text-[11px] text-zinc-400 space-y-1">
                <div className="flex justify-center mb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="ANSELLA" className="h-4 w-auto opacity-75" />
                </div>
                <p className="font-bold text-zinc-600 text-[10px]">Ansella App.</p>
                <p>© {new Date().getFullYear()} Kuettu Corporation SARL. Tous droits réservés.</p>
                <p>
                  Vous recevez cet e-mail car vous êtes inscrit sur{" "}
                  <span className="text-indigo-600 underline">https://ansella.app</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sent History Section ── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-400" />
            <span>Historique des Envois Récents</span>
          </h3>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {sentHistory.map((item) => (
            <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{item.subject}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.date}</span>
                  <span>•</span>
                  <span>Cible : <strong className="text-zinc-600 dark:text-zinc-300">{item.targetType}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200/50 dark:border-emerald-900/50">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{item.sentCount} délivré(s)</span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setSubject(item.subject);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 transition-colors cursor-pointer"
                >
                  Réutiliser
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
