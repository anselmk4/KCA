"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Save, 
  ShieldCheck, 
  Coins, 
  Mail, 
  Globe, 
  Terminal,
  ToggleLeft,
  ToggleRight,
  Database
} from "lucide-react";

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState("ANSELLA");
  const [supportEmail, setSupportEmail] = useState("support@kuettu.com");
  const [commissionRate, setCommissionRate] = useState(20);
  const [enableWeb3, setEnableWeb3] = useState(true);
  const [enableDemoAccounts, setEnableDemoAccounts] = useState(true);
  const [lockoutAttempts, setLockoutAttempts] = useState(5);
  const [lockoutDuration, setLockoutDuration] = useState(60);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load from localStorage if present
    const saved = localStorage.getItem("kuettu_admin_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.platformName) setPlatformName(parsed.platformName);
        if (parsed.supportEmail) setSupportEmail(parsed.supportEmail);
        if (parsed.commissionRate) setCommissionRate(parsed.commissionRate);
        if (parsed.enableWeb3 !== undefined) setEnableWeb3(parsed.enableWeb3);
        if (parsed.enableDemoAccounts !== undefined) setEnableDemoAccounts(parsed.enableDemoAccounts);
        if (parsed.lockoutAttempts) setLockoutAttempts(parsed.lockoutAttempts);
        if (parsed.lockoutDuration) setLockoutDuration(parsed.lockoutDuration);
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    const config = {
      platformName,
      supportEmail,
      commissionRate,
      enableWeb3,
      enableDemoAccounts,
      lockoutAttempts,
      lockoutDuration
    };

    setTimeout(() => {
      localStorage.setItem("kuettu_admin_settings", JSON.stringify(config));
      
      // Update the client-side environment variable representation (simulated)
      if (typeof window !== "undefined") {
        (window as any).__kuettu_demo_enabled = enableDemoAccounts;
      }
      
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Settings className="w-7 h-7 text-red-600" />
          Configuration Globale
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Ajustez les paramètres techniques, de commission et de sécurité de la plateforme.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 rounded-2xl text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Configuration enregistrée avec succès. Les modifications sont actives !
          </div>
        )}

        {/* Section 1: Général */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-red-600" /> Paramètres Généraux
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
          </div>
        </div>

        {/* Section 2: Finances */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-red-600" /> Paramètres Financiers & Web3
          </h3>
          <hr className="border-zinc-100 dark:border-zinc-800" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Taux de commission standard (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-zinc-900 dark:text-white"
              />
            </div>

            {/* Toggle Web3 */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-155 dark:border-zinc-800">
              <div>
                <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Paiements Web3 (Crypto)</h5>
                <p className="text-[10px] text-zinc-400">Autorise les smart contracts crypto sur le checkout.</p>
              </div>
              <button
                type="button"
                onClick={() => setEnableWeb3(!enableWeb3)}
                className="text-red-600 hover:scale-105 transition-transform cursor-pointer"
              >
                {enableWeb3 ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-zinc-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Sécurité & Dev */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-red-600" /> Sécurité & Comptes démo
          </h3>
          <hr className="border-zinc-100 dark:border-zinc-800" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Tentatives de connexion max (Rate Limiting)</label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={lockoutAttempts}
                  onChange={(e) => setLockoutAttempts(parseInt(e.target.value) || 5)}
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-zinc-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Durée du verrouillage temporaire (secondes)</label>
                <input
                  type="number"
                  min="10"
                  max="3600"
                  value={lockoutDuration}
                  onChange={(e) => setLockoutDuration(parseInt(e.target.value) || 60)}
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* Toggle Demo Accounts */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-155 dark:border-zinc-800 h-fit self-start">
              <div>
                <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Boutons de connexion Démo</h5>
                <p className="text-[10px] text-zinc-400">Affiche les boutons d'accès rapide sur le formulaire de login.</p>
              </div>
              <button
                type="button"
                onClick={() => setEnableDemoAccounts(!enableDemoAccounts)}
                className="text-red-600 hover:scale-105 transition-transform cursor-pointer"
              >
                {enableDemoAccounts ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-zinc-400" />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full md:w-fit px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Enregistrer la Configuration
        </button>
      </form>
    </div>
  );
}
