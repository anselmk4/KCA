"use client";

import { useEffect, useState } from "react";
import { getSimulatedSession, setSimulatedSession } from "@/lib/rbac";
import { supabase } from "@/lib/supabase/client";
import {
  User, Globe, Bell, Shield, Save, CheckCircle2, Camera,
  Share2, Link as LinkIcon, Video as VideoIcon, ExternalLink, GraduationCap, Award, Loader2
} from "lucide-react";

type Tab = "profile" | "academy" | "social" | "notifications" | "security";

export default function InstructorSettingsPage() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    bio: "",
    specialty: "",
    nationality: "",
    academic_background: "",
    certifications: "",
    avatar_url: "",
  });

  const [socialForm, setSocialForm] = useState({
    website: "",
    twitter: "",
    linkedin: "",
    youtube: "",
    instagram: "",
  });

  const [academyForm, setAcademyForm] = useState({
    academy_name: "",
    academy_tagline: "",
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
    setForm(f => ({ ...f, name: s?.name || "", email: s?.email || "" }));
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const { profile } = await res.json();
        if (profile) {
          setForm(f => ({
            ...f,
            name: profile.full_name || f.name,
            email: profile.email || f.email,
            bio: profile.bio || "",
            specialty: profile.specialty || "",
            nationality: profile.nationality || "",
            academic_background: profile.academic_background || "",
            certifications: profile.certifications || "",
            avatar_url: profile.avatar_url || "",
          }));
          setSocialForm({
            website: profile.website || "",
            twitter: profile.twitter || "",
            linkedin: profile.linkedin || "",
            youtube: profile.youtube || "",
            instagram: profile.instagram || "",
          });
          setAcademyForm({
            academy_name: profile.academy_name || "",
            academy_tagline: profile.academy_tagline || "",
          });
        }
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        bio: form.bio,
        specialty: form.specialty,
        nationality: form.nationality,
        academic_background: form.academic_background,
        certifications: form.certifications,
        avatar_url: form.avatar_url,
        ...socialForm,
        ...academyForm,
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (session) {
          setSimulatedSession({ ...session, name: form.name, email: form.email });
          setSession(getSimulatedSession());
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const body = await res.json().catch(() => ({}));
        alert("Erreur lors de la sauvegarde : " + (body?.error || "Erreur serveur"));
        console.error("[Settings] Save error:", body?.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      alert("L'image est trop volumineuse. Veuillez choisir une image de moins de 1.5 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(f => ({ ...f, avatar_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const initials = form.name
    ? form.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "PR";

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Profil", icon: <User className="w-4 h-4" /> },
    { key: "academy", label: "Académie", icon: <GraduationCap className="w-4 h-4" /> },
    { key: "social", label: "Réseaux sociaux", icon: <Globe className="w-4 h-4" /> },
    { key: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { key: "security", label: "Sécurité", icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Paramètres</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gérez votre profil instructeur et les préférences de votre académie.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {tab.icon} {tab.label}
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

      {/* ── Profile tab ── */}
      {activeTab === "profile" && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Photo de profil</h2>
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 font-bold text-2xl">
                    {initials}
                  </div>
                )}
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button type="button" onClick={() => document.getElementById("avatar-upload")?.click()}
                  className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <Camera className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">{form.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{form.email}</p>
                <button type="button" onClick={() => document.getElementById("avatar-upload")?.click()}
                  className="mt-2 text-xs text-teal-600 hover:underline font-medium">
                  Changer la photo
                </button>
              </div>
            </div>
          </div>

          {/* Personal info */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Informations personnelles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Nom complet", key: "name", type: "text" },
                { label: "Adresse Email", key: "email", type: "email" },
                { label: "Spécialité", key: "specialty", type: "text", placeholder: "ex: Blockchain & DeFi" },
                { label: "Nationalité / Pays", key: "nationality", type: "text", placeholder: "ex: Sénégalais, France…" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{label}</label>
                  <input type={type} placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-transparent focus:ring-2 focus:ring-teal-500 outline-none text-sm transition-all"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Bio / Présentation</label>
              <textarea rows={4} value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Présentez votre parcours, vos expertises, votre vision…"
                className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-transparent focus:ring-2 focus:ring-teal-500 outline-none text-sm resize-none transition-all"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-zinc-400" /> Formation académique
              </label>
              <textarea rows={3} value={form.academic_background}
                onChange={e => setForm(f => ({ ...f, academic_background: e.target.value }))}
                placeholder="ex: Master en Finance — Université de Paris (2018)&#10;Licence Informatique — UCAD Dakar (2016)"
                className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-transparent focus:ring-2 focus:ring-teal-500 outline-none text-sm resize-none transition-all"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-zinc-400" /> Certifications
              </label>
              <textarea rows={3} value={form.certifications}
                onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))}
                placeholder="ex: Certified Ethereum Developer — ConsenSys Academy (2022)&#10;CFA Level 1 — CFA Institute (2021)"
                className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-transparent focus:ring-2 focus:ring-teal-500 outline-none text-sm resize-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-teal-500/20">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer les modifications
            </button>
          </div>
        </form>
      )}

      {/* ── Academy tab ── */}
      {activeTab === "academy" && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Identité de votre Académie</h2>
            <div className="space-y-4">
              {[
                { label: "Nom de l'académie", key: "academy_name", placeholder: "ex: DeFi Academy by Ibrahim" },
                { label: "Tagline / Slogan", key: "academy_tagline", placeholder: "ex: Apprendre la blockchain, simplement." },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{label}</label>
                  <input type="text" placeholder={placeholder}
                    value={academyForm[key as keyof typeof academyForm]}
                    onChange={e => setAcademyForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-transparent focus:ring-2 focus:ring-teal-500 outline-none text-sm transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-teal-500/20">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </form>
      )}

      {/* ── Social tab ── */}
      {activeTab === "social" && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Réseaux sociaux & liens</h2>
            <div className="space-y-4">
              {[
                { label: "Site web", key: "website", icon: <Globe className="w-4 h-4 text-zinc-400" />, placeholder: "https://monsite.com" },
                { label: "Twitter / X", key: "twitter", icon: <Share2 className="w-4 h-4 text-zinc-400" />, placeholder: "@monpseudo" },
                { label: "LinkedIn", key: "linkedin", icon: <LinkIcon className="w-4 h-4 text-zinc-400" />, placeholder: "https://linkedin.com/in/…" },
                { label: "YouTube", key: "youtube", icon: <VideoIcon className="w-4 h-4 text-zinc-400" />, placeholder: "https://youtube.com/@…" },
                { label: "Instagram", key: "instagram", icon: <ExternalLink className="w-4 h-4 text-zinc-400" />, placeholder: "@monpseudo" },
              ].map(({ label, key, icon, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    {icon} {label}
                  </label>
                  <input type="text" placeholder={placeholder}
                    value={socialForm[key as keyof typeof socialForm]}
                    onChange={e => setSocialForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-transparent focus:ring-2 focus:ring-teal-500 outline-none text-sm transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-teal-500/20">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </form>
      )}

      {/* ── Notifications tab ── */}
      {activeTab === "notifications" && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900 dark:text-white mb-2">Préférences de notifications</h2>
          {[
            { key: "newEnrollment", label: "Nouvelle inscription", desc: "Être notifié quand un étudiant s'inscrit" },
            { key: "newMessage", label: "Nouveau message", desc: "Recevoir une alerte pour chaque message" },
            { key: "newReview", label: "Nouveaux avis", desc: "Être notifié des retours de vos étudiants" },
            { key: "weeklySummary", label: "Résumé hebdomadaire", desc: "Rapport de vos performances chaque lundi" },
            { key: "marketingEmails", label: "Emails ANSELLA", desc: "Actualités, nouvelles fonctionnalités, offres" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">{label}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
              </div>
              <button type="button"
                onClick={() => setNotifForm(f => ({ ...f, [key]: !f[key as keyof typeof notifForm] }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifForm[key as keyof typeof notifForm] ? "bg-teal-600" : "bg-zinc-200 dark:bg-zinc-700"}`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifForm[key as keyof typeof notifForm] ? "translate-x-5" : ""}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Security tab ── */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Sécurité du compte</h2>
            <div className="space-y-3">
              {[
                { label: "Authentification à deux facteurs (2FA)", value: "Non activé", action: "Activer", color: "text-amber-600" },
                { label: "Dernière connexion", value: "Aujourd'hui", action: "", color: "text-zinc-500" },
                { label: "Appareils connectés", value: "1 appareil actif", action: "Gérer", color: "text-zinc-500" },
              ].map(({ label, value, action, color }, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{label}</p>
                    <p className={`text-xs mt-0.5 ${color}`}>{value}</p>
                  </div>
                  {action && (
                    <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">{action}</button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-6">
            <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">Zone de danger</h3>
            <p className="text-sm text-red-600 dark:text-red-400/70 mb-4">La suppression de votre compte est irréversible.</p>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Supprimer mon compte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
