"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Save, 
  ShieldCheck, 
  Coins, 
  Mail, 
  Globe, 
  BookOpen, 
  Loader2,
  Lock,
  Percent
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function AdminSettingsPage() {
  // Platform details
  const [platformName, setPlatformName] = useState("ANSELLA");
  const [platformTagline, setPlatformTagline] = useState("Formez-vous aux technologies de demain");
  const [supportEmail, setSupportEmail] = useState("support@kuettu.com");
  const [defaultLanguage, setDefaultLanguage] = useState("fr");
  const [timezone, setTimezone] = useState("Africa/Douala");

  // Finances
  const [commissionRate, setCommissionRate] = useState(20);
  const [minPayout, setMinPayout] = useState(5000);
  const [currency, setCurrency] = useState("USD");

  // Academics & Certificates
  const [quizPassPercentage, setQuizPassPercentage] = useState(70);
  const [certificateValidity, setCertificateValidity] = useState(24);
  const [blockchainEnabled, setBlockchainEnabled] = useState(false);
  const [enrollmentAutoApprove, setEnrollmentAutoApprove] = useState(true);

  // Statuses
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from Supabase
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from("settings")
          .select("key, value");

        if (dbError) throw dbError;

        if (data) {
          data.forEach((item) => {
            const val = item.value;
            switch (item.key) {
              case "platform.name":
                setPlatformName(String(val));
                break;
              case "platform.tagline":
                setPlatformTagline(String(val));
                break;
              case "platform.support_email":
                setSupportEmail(String(val));
                break;
              case "platform.default_language":
                setDefaultLanguage(String(val));
                break;
              case "platform.timezone":
                setTimezone(String(val));
                break;
              case "platform.commission_rate":
                setCommissionRate(parseInt(String(val)) || 20);
                break;
              case "platform.min_payout":
                setMinPayout(parseInt(String(val)) || 5000);
                break;
              case "platform.currency":
                setCurrency(String(val));
                break;
              case "quiz.default_pass_percentage":
                setQuizPassPercentage(parseInt(String(val)) || 70);
                break;
              case "certificate.validity_months":
                setCertificateValidity(parseInt(String(val)) || 24);
                break;
              case "certificate.blockchain_enabled":
                setBlockchainEnabled(val === "true" || val === true);
                break;
              case "enrollment.auto_approve":
                setEnrollmentAutoApprove(val === "true" || val === true);
                break;
            }
          });
        }
      } catch (err: any) {
        console.error("Failed to load platform settings from database:", err);
        setError("Erreur lors de la récupération des paramètres depuis la base de données. Chargement des valeurs locales par défaut.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    const updates = {
      "platform.name": platformName,
      "platform.tagline": platformTagline,
      "platform.support_email": supportEmail,
      "platform.default_language": defaultLanguage,
      "platform.timezone": timezone,
      "platform.commission_rate": String(commissionRate),
      "platform.min_payout": String(minPayout),
      "platform.currency": currency,
      "quiz.default_pass_percentage": String(quizPassPercentage),
      "certificate.validity_months": String(certificateValidity),
      "certificate.blockchain_enabled": String(blockchainEnabled),
      "enrollment.auto_approve": String(enrollmentAutoApprove)
    };

    try {
      // Perform sequential or batch upserts
      for (const [key, val] of Object.entries(updates)) {
        const { error: upsertErr } = await supabase
          .from("settings")
          .upsert({
            key,
            value: val,
            updated_at: new Date().toISOString()
          }, { onConflict: "key" });

        if (upsertErr) throw upsertErr;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      console.error("Failed to save platform settings to database:", err);
      setError("Erreur lors de l'enregistrement des paramètres dans la base de données : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Settings className="w-7 h-7 text-red-650" />
          Configuration Globale
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Ajustez les paramètres techniques, pédagogiques, financiers et d&apos;administration de la plateforme enregistrés en base de données.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 rounded-2xl text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
            Configuration enregistrée avec succès dans la base de données !
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-2xl text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <ShieldCheck className="w-5 h-5 text-red-500 shrink-0" />
            {error}
          </div>
        )}

        {/* Section 1: Général */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-red-650" /> Paramètres Généraux
          </h3>
          <hr className="border-zinc-100 dark:border-zinc-800" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Nom de la Plateforme</label>
              <input
                type="text"
                required
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-zinc-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Email de support client</label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-zinc-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Slogan / Tagline de la Plateforme</label>
              <input
                type="text"
                required
                value={platformTagline}
                onChange={(e) => setPlatformTagline(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-zinc-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Langue par défaut</label>
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-zinc-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="fr">Français (fr)</option>
                <option value="en">English (en)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Fuseau Horaire</label>
              <input
                type="text"
                required
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-zinc-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Finances */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-red-650" /> Paramètres Financiers
          </h3>
          <hr className="border-zinc-100 dark:border-zinc-800" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Taux de commission standard (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-zinc-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Paiement minimal formateur ($)</label>
              <input
                type="number"
                min="100"
                required
                value={minPayout}
                onChange={(e) => setMinPayout(parseInt(e.target.value) || 100)}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-zinc-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Devise</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-zinc-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="USD">Dollar Américain (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="FCFA">Franc CFA (FCFA)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Academics & Certificates */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-red-650" /> Pédagogie & Certification
          </h3>
          <hr className="border-zinc-100 dark:border-zinc-800" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Score de passage des Quiz (%)</label>
              <input
                type="number"
                min="10"
                max="100"
                required
                value={quizPassPercentage}
                onChange={(e) => setQuizPassPercentage(parseInt(e.target.value) || 70)}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-zinc-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Validité du Certificat (mois)</label>
              <input
                type="number"
                min="1"
                max="120"
                required
                value={certificateValidity}
                onChange={(e) => setCertificateValidity(parseInt(e.target.value) || 24)}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-zinc-900 dark:text-white"
              />
            </div>

            {/* Checkboxes/Toggles */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={blockchainEnabled}
                  onChange={(e) => setBlockchainEnabled(e.target.checked)}
                  className="h-4.5 w-4.5 text-red-600 border-zinc-350 rounded focus:ring-red-500"
                />
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">Ancrage Blockchain activé</p>
                  <p className="text-[10px] text-zinc-500">Signe numériquement les certificats sur le réseau blockchain.</p>
                </div>
              </label>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enrollmentAutoApprove}
                  onChange={(e) => setEnrollmentAutoApprove(e.target.checked)}
                  className="h-4.5 w-4.5 text-red-600 border-zinc-350 rounded focus:ring-red-500"
                />
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">Approbation automatique des inscriptions</p>
                  <p className="text-[10px] text-zinc-500">Active immédiatement l&apos;accès après paiement validé.</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full md:w-fit px-8 py-3 bg-red-600 hover:bg-red-750 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Enregistrer la Configuration
        </button>
      </form>
    </div>
  );
}
