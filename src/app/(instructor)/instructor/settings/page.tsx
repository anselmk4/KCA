"use client";

import { useEffect, useState } from "react";
import { getSimulatedSession, setSimulatedSession } from "@/lib/rbac";
import {
  User,
  Globe,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  Camera,
} from "lucide-react";

type Tab = "profile" | "notifications" | "security" | "academy";

export default function SettingsPage() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    bio: "",
    website: "",
    twitter: "",
    linkedin: "",
    specialty: "",
  });

  const [academyForm, setAcademyForm] = useState({
    academyName: "",
    tagline: "",
    topics: "",
    language: "Français",
  });

  const [notifForm, setNotifForm] = useState({
    newEnrollment: true,
    newMessage: true,
    newReview: false,
    weeklySummary: true,
    marketingEmails: false,
  });

  useEffect(() => {
    const s = getSimulatedSession();
    setSession(s);
    setProfileForm(f => ({
      ...f,
      name: s?.name || "",
      email: s?.email || "",
      specialty: "Blockchain & DeFi",
      bio: "Instructeur passionné par les technologies blockchain et la finance décentralisée. Je partage mes connaissances pour démocratiser le Web3.",
    }));
    setAcademyForm(f => ({
      ...f,
      academyName: `Académie ${s?.name?.split(" ")[0] || "Crypto"}`,
      tagline: "Apprendre la blockchain, simplement.",
      topics: "Blockchain, DeFi, NFT, Trading",
    }));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (session) {
      setSimulatedSession({ ...session, name: profileForm.name, email: profileForm.email });
      setSession(getSimulatedSession());
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Profil", icon: <User className="w-4 h-4" /> },
    { key: "academy", label: "Académie", icon: <Globe className="w-4 h-4" /> },
    { key: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { key: "security", label: "Sécurité", icon: <Shield className="w-4 h-4" /> },
  ];

  const initials = profileForm.name
    ? profileForm.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "PK";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Paramètres</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gérez votre profil instructeur et les préférences de votre académie.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Saved notification */}
      {saved && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Modifications enregistrées avec succès !</p>
        </div>
      )}

      {/* Profile tab */}
      {activeTab === "profile" && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Photo de profil</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 font-bold text-2xl">
                  {initials}
                </div>
                <button type="button" className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <Camera className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">{profileForm.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{profileForm.email}</p>
                <button type="button" className="mt-2 text-xs text-teal-600 hover:underline font-medium">Changer la photo</button>
              </div>
            </div>
          </div>

          {/* Info fields */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Informations personnelles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Nom complet", key: "name", type: "text" },
                { label: "Adresse Email", key: "email", type: "email" },
                { label: "Spécialité", key: "specialty", type: "text" },
                { label: "Site web", key: "website", type: "url" },
                { label: "Twitter / X", key: "twitter", type: "text" },
                { label: "LinkedIn", key: "linkedin", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={profileForm[key as keyof typeof profileForm]}
                    onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-transparent focus:ring-2 focus:ring-teal-500 outline-none text-sm transition-all"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Bio</label>
              <textarea
                rows={4}
                value={profileForm.bio}
                onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-transparent focus:ring-2 focus:ring-teal-500 outline-none text-sm resize-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-teal-500/20">
              <Save className="w-4 h-4" />
              Enregistrer les modifications
            </button>
          </div>
        </form>
      )}

      {/* Academy tab */}
      {activeTab === "academy" && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Identité de votre Académie</h2>
            <div className="space-y-4">
              {[
                { label: "Nom de l'académie", key: "academyName" },
                { label: "Tagline", key: "tagline" },
                { label: "Thématiques (séparées par virgule)", key: "topics" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{label}</label>
                  <input
                    type="text"
                    value={academyForm[key as keyof typeof academyForm]}
                    onChange={e => setAcademyForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-transparent focus:ring-2 focus:ring-teal-500 outline-none text-sm transition-all"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Langue principale</label>
                <select value={academyForm.language} onChange={e => setAcademyForm(f => ({ ...f, language: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-transparent focus:ring-2 focus:ring-teal-500 outline-none text-sm">
                  {["Français", "Anglais", "Arabe", "Espagnol", "Portugais"].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-teal-500/20">
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        </form>
      )}

      {/* Notifications tab */}
      {activeTab === "notifications" && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900 dark:text-white mb-2">Préférences de notifications</h2>
          {[
            { key: "newEnrollment", label: "Nouvelle inscription à un cours", desc: "Être notifié quand un étudiant s'inscrit" },
            { key: "newMessage", label: "Nouveau message d'un étudiant", desc: "Recevoir une alerte pour chaque message" },
            { key: "newReview", label: "Nouveaux avis / évaluations", desc: "Être notifié des retours de vos étudiants" },
            { key: "weeklySummary", label: "Résumé hebdomadaire", desc: "Rapport de vos performances chaque lundi" },
            { key: "marketingEmails", label: "Emails marketing Kuettu", desc: "Actualités, nouvelles fonctionnalités, offres" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">{label}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifForm(f => ({ ...f, [key]: !f[key as keyof typeof notifForm] }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifForm[key as keyof typeof notifForm] ? "bg-teal-600" : "bg-zinc-200 dark:bg-zinc-700"}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifForm[key as keyof typeof notifForm] ? "translate-x-5" : ""}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Security tab */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Sécurité du compte</h2>
            <div className="space-y-3">
              {[
                { label: "Authentification à deux facteurs (2FA)", value: "Non activé", action: "Activer", color: "text-amber-600" },
                { label: "Dernière connexion", value: "Aujourd'hui à 09:32", action: "", color: "text-zinc-500" },
                { label: "Appareils connectés", value: "1 appareil actif", action: "Gérer", color: "text-zinc-500" },
                { label: "Sessions actives", value: "Session actuelle uniquement", action: "Déconnecter tout", color: "text-red-600" },
              ].map(({ label, value, action, color }, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{label}</p>
                    <p className={`text-xs mt-0.5 ${color}`}>{value}</p>
                  </div>
                  {action && (
                    <button className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      action === "Activer" ? "border-teal-200 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 dark:border-teal-900/30"
                      : action === "Déconnecter tout" ? "border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-red-900/30"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}>{action}</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-6">
            <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">Zone de danger</h3>
            <p className="text-sm text-red-600 dark:text-red-400/70 mb-4">La suppression de votre compte est irréversible. Toutes vos données seront effacées.</p>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Supprimer mon compte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
