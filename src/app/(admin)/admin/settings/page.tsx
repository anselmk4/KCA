"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, Save, ShieldCheck, Coins, Mail, Globe, BookOpen,
  Loader2, Lock, Percent, Palette, Bell, Server, AlertTriangle,
  Eye, EyeOff, RefreshCcw, CheckCircle, Info, ToggleLeft, ToggleRight,
} from "lucide-react";
import { getSimulatedSession, hasPermission, Role } from "@/lib/rbac";

// ─── Tab definition ────────────────────────────────────────────────────────
const TABS = [
  { key: "general",      label: "Général",         icon: Globe },
  { key: "finance",      label: "Finances",         icon: Coins },
  { key: "academic",     label: "Académique",       icon: BookOpen },
  { key: "notifications",label: "Notifications",    icon: Bell },
  { key: "security",     label: "Sécurité",         icon: ShieldCheck },
  { key: "appearance",   label: "Apparence",        icon: Palette },
  { key: "system",       label: "Système",          icon: Server },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── Setting record ────────────────────────────────────────────────────────
interface Setting { id: string; key: string; value: unknown; description: string; group_name: string; is_public: boolean; updated_at: string; }

// ─── Toggle component ──────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${value ? "bg-red-600" : "bg-zinc-300 dark:bg-zinc-600"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

// ─── Input wrappers ────────────────────────────────────────────────────────
function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, disabled, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; type?: string;
}) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} disabled={disabled}
      className="w-56 px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg
        focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

function NumberInput({ value, onChange, min, max, step, disabled }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; disabled?: boolean;
}) {
  return (
    <input
      type="number" value={value} onChange={e => onChange(Number(e.target.value))}
      min={min} max={max} step={step} disabled={disabled}
      className="w-32 px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg
        focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

function SelectInput({ value, onChange, options, disabled }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; disabled?: boolean;
}) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
      className="w-48 px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg
        focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [canFinance, setCanFinance] = useState(false);

  // Local editable state
  const [vals, setVals] = useState<Record<string, unknown>>({});

  const session = typeof window !== "undefined" ? getSimulatedSession() : null;

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/platform-settings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      const s: Setting[] = data.settings || [];
      setSettings(s);
      const map: Record<string, unknown> = {};
      s.forEach(item => { map[item.key] = item.value; });
      setVals(map);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const s = getSimulatedSession();
    setCanWrite(hasPermission(s?.role as Role, "platform:settings:write"));
    setCanFinance(hasPermission(s?.role as Role, "finance:write"));
    loadSettings();
  }, [loadSettings]);

  const get = (key: string, fallback: unknown = "") => (key in vals ? vals[key] : fallback);
  const set = (key: string, value: unknown) => setVals(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!canWrite && !canFinance) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updates = Object.entries(vals).map(([key, value]) => ({ key, value }));
      const res = await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la sauvegarde");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const ro = !canWrite; // read-only for non-write roles

  const renderTab = () => {
    switch (activeTab) {
      case "general":
        return (
          <div>
            <SettingRow label="Nom de la plateforme" description="Affiché dans l'en-tête et les emails">
              <TextInput value={String(get("platform.name", "ANSELLA"))} onChange={v => set("platform.name", v)} disabled={ro} />
            </SettingRow>
            <SettingRow label="Slogan" description="Tagline affichée sur la page d'accueil">
              <TextInput value={String(get("platform.tagline", ""))} onChange={v => set("platform.tagline", v)} disabled={ro} />
            </SettingRow>
            <SettingRow label="Email de support" description="Adresse de contact pour les apprenants">
              <TextInput type="email" value={String(get("platform.support_email", ""))} onChange={v => set("platform.support_email", v)} disabled={ro} />
            </SettingRow>
            <SettingRow label="Langue par défaut" description="Langue de l'interface">
              <SelectInput
                value={String(get("platform.default_language", "fr"))}
                onChange={v => set("platform.default_language", v)}
                disabled={ro}
                options={[
                  { value: "fr", label: "Français" },
                  { value: "en", label: "English" },
                  { value: "ar", label: "العربية" },
                  { value: "pt", label: "Português" },
                ]}
              />
            </SettingRow>
            <SettingRow label="Fuseau horaire" description="Référence pour les horaires et logs">
              <SelectInput
                value={String(get("platform.timezone", "Africa/Douala"))}
                onChange={v => set("platform.timezone", v)}
                disabled={ro}
                options={[
                  { value: "Africa/Douala", label: "Afrique Centrale (WAT)" },
                  { value: "Africa/Kinshasa", label: "Kinshasa (WAT)" },
                  { value: "Africa/Nairobi", label: "Nairobi (EAT)" },
                  { value: "Africa/Lagos", label: "Lagos (WAT)" },
                  { value: "Africa/Dakar", label: "Dakar (GMT)" },
                  { value: "Europe/Paris", label: "Paris (CET)" },
                  { value: "UTC", label: "UTC" },
                ]}
              />
            </SettingRow>
            <SettingRow label="Inscriptions ouvertes" description="Permettre aux nouveaux utilisateurs de créer un compte">
              <Toggle value={Boolean(get("platform.registration_open", true))} onChange={v => set("platform.registration_open", v)} disabled={ro} />
            </SettingRow>
            <SettingRow label="Mode maintenance" description="Afficher une page de maintenance aux visiteurs">
              <Toggle value={Boolean(get("platform.maintenance_mode", false))} onChange={v => set("platform.maintenance_mode", v)} disabled={ro} />
            </SettingRow>
          </div>
        );

      case "finance":
        return (
          <div>
            <SettingRow label="Commission plateforme (%)" description="Pourcentage retenu sur chaque vente de cours">
              <div className="flex items-center gap-2">
                <NumberInput value={Number(get("platform.commission_rate", 30))} onChange={v => set("platform.commission_rate", v)} min={0} max={60} step={1} disabled={!canFinance} />
                <span className="text-sm text-zinc-500">%</span>
              </div>
            </SettingRow>
            <SettingRow label="Montant minimum de retrait" description="Seuil minimum pour une demande de versement formateur">
              <div className="flex items-center gap-2">
                <NumberInput value={Number(get("platform.min_payout", 5000))} onChange={v => set("platform.min_payout", v)} min={0} step={500} disabled={!canFinance} />
                <span className="text-sm text-zinc-500">XAF</span>
              </div>
            </SettingRow>
            <SettingRow label="Devise principale" description="Devise de référence pour les transactions">
              <SelectInput
                value={String(get("platform.currency", "USD"))}
                onChange={v => set("platform.currency", v)}
                disabled={!canFinance}
                options={[
                  { value: "USD", label: "USD ($)" },
                  { value: "EUR", label: "EUR (€)" },
                  { value: "XAF", label: "XAF (FCFA)" },
                  { value: "XOF", label: "XOF (FCFA)" },
                  { value: "GHS", label: "GHS (₵)" },
                  { value: "NGN", label: "NGN (₦)" },
                  { value: "KES", label: "KES (Ksh)" },
                ]}
              />
            </SettingRow>
            <SettingRow label="Paiements en tranches" description="Permettre les paiements échelonnés">
              <Toggle value={Boolean(get("platform.installments_enabled", true))} onChange={v => set("platform.installments_enabled", v)} disabled={!canFinance} />
            </SettingRow>
            <SettingRow label="Délai de remboursement (jours)" description="Fenêtre de temps pour les demandes de remboursement">
              <NumberInput value={Number(get("platform.refund_window_days", 7))} onChange={v => set("platform.refund_window_days", v)} min={0} max={30} disabled={!canFinance} />
            </SettingRow>
            {!canFinance && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                <Lock className="w-4 h-4 shrink-0" />
                Ces paramètres sont réservés aux administrateurs financiers.
              </div>
            )}
          </div>
        );

      case "academic":
        return (
          <div>
            <SettingRow label="Score minimum aux quiz (%)" description="Pourcentage requis pour valider un quiz">
              <div className="flex items-center gap-2">
                <NumberInput value={Number(get("quiz.default_pass_percentage", 70))} onChange={v => set("quiz.default_pass_percentage", v)} min={0} max={100} step={5} disabled={ro} />
                <span className="text-sm text-zinc-500">%</span>
              </div>
            </SettingRow>
            <SettingRow label="Validité des certificats (mois)" description="Durée de validité des certificats émis">
              <NumberInput value={Number(get("certificate.validity_months", 24))} onChange={v => set("certificate.validity_months", v)} min={0} max={120} step={6} disabled={ro} />
            </SettingRow>
            <SettingRow label="Ancrage blockchain des certificats" description="Enregistrement immuable des certificats sur la blockchain">
              <Toggle value={Boolean(get("certificate.blockchain_enabled", false))} onChange={v => set("certificate.blockchain_enabled", v)} disabled={ro} />
            </SettingRow>
            <SettingRow label="Inscription automatique" description="Approuver automatiquement les inscriptions aux cours gratuits">
              <Toggle value={Boolean(get("enrollment.auto_approve", true))} onChange={v => set("enrollment.auto_approve", v)} disabled={ro} />
            </SettingRow>
            <SettingRow label="Cours par formateur (max)" description="Nombre maximum de cours simultanés par formateur (0 = illimité)">
              <NumberInput value={Number(get("platform.max_courses_per_instructor", 0))} onChange={v => set("platform.max_courses_per_instructor", v)} min={0} step={1} disabled={ro} />
            </SettingRow>
          </div>
        );

      case "notifications":
        return (
          <div>
            <SettingRow label="Email — Nouvelle inscription" description="Notifier l'admin des nouvelles inscriptions étudiantes">
              <Toggle value={Boolean(get("notif.email_new_enrollment", true))} onChange={v => set("notif.email_new_enrollment", v)} disabled={ro} />
            </SettingRow>
            <SettingRow label="Email — Paiement reçu" description="Notifier le formateur lors d'un paiement">
              <Toggle value={Boolean(get("notif.email_payment_received", true))} onChange={v => set("notif.email_payment_received", v)} disabled={ro} />
            </SettingRow>
            <SettingRow label="Email — Certificat émis" description="Envoyer une copie au formateur à chaque certification">
              <Toggle value={Boolean(get("notif.email_certificate_issued", true))} onChange={v => set("notif.email_certificate_issued", v)} disabled={ro} />
            </SettingRow>
            <SettingRow label="Email — Ticket support ouvert" description="Notifier l'équipe support des nouveaux tickets">
              <Toggle value={Boolean(get("notif.email_new_ticket", true))} onChange={v => set("notif.email_new_ticket", v)} disabled={ro} />
            </SettingRow>
            <SettingRow label="Email — Demande de versement" description="Notifier les admins des nouvelles demandes de retrait">
              <Toggle value={Boolean(get("notif.email_payout_request", true))} onChange={v => set("notif.email_payout_request", v)} disabled={ro} />
            </SettingRow>
          </div>
        );

      case "security":
        return (
          <div>
            <SettingRow label="Authentification 2FA obligatoire" description="Exiger la double authentification pour les admins">
              <Toggle value={Boolean(get("security.admin_2fa_required", false))} onChange={v => set("security.admin_2fa_required", v)} disabled={ro} />
            </SettingRow>
            <SettingRow label="Durée de session (heures)" description="Délai avant expiration automatique de la session">
              <NumberInput value={Number(get("security.session_duration_hours", 24))} onChange={v => set("security.session_duration_hours", v)} min={1} max={168} step={1} disabled={ro} />
            </SettingRow>
            <SettingRow label="Tentatives de connexion max" description="Nombre d'essais avant blocage du compte">
              <NumberInput value={Number(get("security.max_login_attempts", 5))} onChange={v => set("security.max_login_attempts", v)} min={3} max={20} step={1} disabled={ro} />
            </SettingRow>
            <SettingRow label="Audit trail actif" description="Enregistrer toutes les actions admin dans les logs">
              <Toggle value={Boolean(get("security.audit_trail_enabled", true))} onChange={v => set("security.audit_trail_enabled", v)} disabled={ro} />
            </SettingRow>
          </div>
        );

      case "appearance":
        return (
          <div>
            <SettingRow label="Couleur principale" description="Couleur d'accentuation de la plateforme (#hex)">
              <div className="flex items-center gap-2">
                <TextInput value={String(get("appearance.primary_color", "#e11d48"))} onChange={v => set("appearance.primary_color", v)} disabled={ro} placeholder="#e11d48" />
                <div
                  className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm"
                  style={{ background: String(get("appearance.primary_color", "#e11d48")) }}
                />
              </div>
            </SettingRow>
            <SettingRow label="Logo URL" description="URL du logo de la plateforme (format PNG ou SVG)">
              <TextInput value={String(get("appearance.logo_url", ""))} onChange={v => set("appearance.logo_url", v)} disabled={ro} placeholder="https://..." />
            </SettingRow>
            <SettingRow label="Favicon URL" description="Favicon au format .ico ou .png (32x32px)">
              <TextInput value={String(get("appearance.favicon_url", ""))} onChange={v => set("appearance.favicon_url", v)} disabled={ro} placeholder="https://..." />
            </SettingRow>
            <SettingRow label="Thème par défaut" description="Thème de l'interface au premier chargement">
              <SelectInput
                value={String(get("appearance.default_theme", "system"))}
                onChange={v => set("appearance.default_theme", v)}
                disabled={ro}
                options={[
                  { value: "light", label: "Clair" },
                  { value: "dark", label: "Sombre" },
                  { value: "system", label: "Système" },
                ]}
              />
            </SettingRow>
          </div>
        );

      case "system":
        return (
          <div>
            <SettingRow label="Version de l'API" description="Version de l'API REST interne">
              <span className="text-sm font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg">v1.0.0</span>
            </SettingRow>
            <SettingRow label="Base de données" description="Fournisseur de base de données">
              <span className="text-sm font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg">Supabase / PostgreSQL</span>
            </SettingRow>
            <SettingRow label="Stockage des fichiers" description="Provider de stockage pour les médias">
              <span className="text-sm font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg">Supabase Storage</span>
            </SettingRow>
            <SettingRow label="Email provider" description="Serveur d'envoi d'emails transactionnels">
              <span className="text-sm font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg">Resend</span>
            </SettingRow>
            <SettingRow label="Passerelle de paiement" description="Fournisseur de paiement Mobile Money">
              <span className="text-sm font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg">PawaPay</span>
            </SettingRow>
            <SettingRow label="Framework" description="Stack technique front-end">
              <span className="text-sm font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg">Next.js 16 / TypeScript</span>
            </SettingRow>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-red-500" />
            Paramètres de la Plateforme
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Configurez tous les aspects de votre plateforme LMS depuis cet espace centralisé.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSettings}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          {(canWrite || canFinance) && (
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          )}
        </div>
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Paramètres sauvegardés avec succès !
        </div>
      )}
      {!canWrite && !canFinance && !loading && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-300 text-sm">
          <Info className="w-4 h-4 shrink-0" />
          Vous êtes en lecture seule. Contactez le Super Admin pour modifier ces paramètres.
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-44 shrink-0">
          <nav className="flex flex-col gap-0.5">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  activeTab === key
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content panel */}
        <div className="flex-1 min-w-0 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-900 dark:text-white text-base">
              {TABS.find(t => t.key === activeTab)?.label}
            </h2>
          </div>
          <div className="px-6 py-2">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Chargement des paramètres...</span>
              </div>
            ) : (
              renderTab()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
