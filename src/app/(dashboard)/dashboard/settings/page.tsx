"use client";

import { useEffect, useState } from "react";
import { User, Mail, Shield, Bell, CreditCard, Check, Settings, Phone, Globe, MapPin, KeyRound, Eye, EyeOff, Camera, Loader2, Plus, Trash2, Star, Save, CheckCircle2 } from "lucide-react";
import { getDB, saveDB } from "@/lib/db";
import { getSimulatedSession, setSimulatedSession } from "@/lib/rbac";

type SettingsTab = "profile" | "security" | "notifications" | "billing" | "payment";

export default function StudentSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [session, setSession] = useState<any>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [level, setLevel] = useState("Débutant");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [nationality, setNationality] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Notification toggles
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);
  const [notifLive, setNotifLive] = useState(true);
  const [notifCert, setNotifCert] = useState(true);

  // Payment methods states
  type PaymentMethod = { id: string; type: "mobile_money" | "paypal"; label?: string; phone?: string; email?: string; country?: string };
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [preferredMethod, setPreferredMethod] = useState<string | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);
  const [newPaymentType, setNewPaymentType] = useState<"mobile_money" | "paypal">("mobile_money");
  const [newPaymentLabel, setNewPaymentLabel] = useState("");
  const [newPaymentPhone, setNewPaymentPhone] = useState("");
  const [newPaymentEmail, setNewPaymentEmail] = useState("");
  const [newPaymentCountry, setNewPaymentCountry] = useState("");

  // Load user details
  useEffect(() => {
    const currentSession = getSimulatedSession();
    setSession(currentSession);

    if (currentSession) {
      setFullName(currentSession.name || "");
      setEmail(currentSession.email || "");

      const db = getDB();
      const user = db.users.find(u => u.id === currentSession.userId);
      if (user) setLevel(user.level || "Débutant");
    }

    // Load from Supabase
    fetch("/api/profile").then(async (res) => {
      if (res.ok) {
        const { profile } = await res.json();
        if (profile) {
          setFullName(profile.full_name || "");
          setEmail(profile.email || "");
          setBio(profile.bio || "");
          setNationality(profile.nationality || "");
          setAvatarUrl(profile.avatar_url || "");
          setCountry(profile.nationality || localStorage.getItem("kuettu_settings_country") || "");
          setCity(localStorage.getItem("kuettu_settings_city") || "");
          setPhone(profile.phone || localStorage.getItem("kuettu_settings_phone") || "");
          if (Array.isArray(profile.payment_methods)) setPaymentMethods(profile.payment_methods);
          setPreferredMethod(profile.preferred_payment_method || null);
        }
      }
    }).catch(console.error);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSavingProfile(true);
    try {
      // Save to Supabase (nationality mapped to country input, phone mapped to phone input)
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          bio,
          nationality: country,
          phone: phone,
          avatar_url: avatarUrl
        }),
      });

      // Update local cache
      localStorage.setItem("kuettu_user_name", fullName);
      localStorage.setItem("kuettu_settings_phone", phone);
      localStorage.setItem("kuettu_settings_country", country);
      localStorage.setItem("kuettu_settings_city", city);

      const db = getDB();
      const userIdx = db.users.findIndex(u => u.id === session.userId);
      if (userIdx !== -1) { db.users[userIdx].name = fullName; saveDB(db); }

      setSimulatedSession({ ...session, name: fullName });
      window.dispatchEvent(new Event("storage"));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }
    alert("Mot de passe mis à jour avec succès ! (Simulation)");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Préférences de notifications enregistrées avec succès !");
  };

  const currentInitials = fullName
    ? fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "AP";

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Paramètres</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Configurez votre compte personnel, gérez vos abonnements et ajustez vos notifications.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Navigation Tabs (Left Sidebar Style) */}
        <div className="w-full md:w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-1 shrink-0 shadow-sm">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Mon Profil</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "security"
                ? "bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Sécurité</span>
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "notifications"
                ? "bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "billing"
                ? "bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Facturation & Plan</span>
          </button>
          <button
            onClick={() => setActiveTab("payment")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "payment"
                ? "bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900"
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Moyens de paiement</span>
          </button>
        </div>

        {/* Content Panel (Right side) */}
        <div className="flex-1 w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          
          {/* TAB 1: Profile form */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile}>
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/10 flex items-center gap-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover shadow-sm shrink-0" />
                ) : (
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-xl shadow-sm shrink-0">
                    {currentInitials}
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-base text-zinc-900 dark:text-white">Informations du profil</h2>
                  <p className="text-xs text-zinc-500">Mettez à jour vos informations publiques d&apos;apprenant.</p>
                  <input
                    type="file"
                    id="student-avatar-upload"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 1.5 * 1024 * 1024) {
                        alert("L'image est trop volumineuse. Veuillez choisir une image de moins de 1.5 Mo.");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAvatarUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("student-avatar-upload")?.click()}
                    className="text-[10px] text-blue-600 hover:underline mt-1 font-semibold block text-left"
                  >
                    Modifier la photo
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Nom complet</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3.5 text-zinc-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Adresse email (Non modifiable)</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3.5 text-zinc-400" />
                      <input
                        type="email"
                        disabled
                        value={email}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-850 text-sm text-zinc-400 cursor-not-allowed select-none outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Téléphone</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3.5 text-zinc-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Niveau technique</label>
                    <select
                      value={level}
                      onChange={e => setLevel(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    >
                      <option value="Débutant">Débutant (Aucun prérequis)</option>
                      <option value="Intermédiaire">Intermédiaire (Bases acquises)</option>
                      <option value="Avancé">Avancé (Expérimenté)</option>
                      <option value="Expert">Expert (Professionnel)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Pays / Nationalité</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 absolute left-3 top-3.5 text-zinc-400" />
                      <input
                        type="text"
                        value={nationality}
                        onChange={e => {
                          setNationality(e.target.value);
                          setCountry(e.target.value);
                        }}
                        placeholder="ex: Sénégalais"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Ville</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3.5 text-zinc-400" />
                      <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Biographie</label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Parlez-nous un peu de vos objectifs d'apprentissage..."
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-zinc-50/50 dark:bg-zinc-800/10 border-t border-zinc-200 dark:border-zinc-800 flex justify-end items-center gap-3">
                {profileSaved && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">✓ Modifications enregistrées</span>
                )}
                <button type="submit" disabled={savingProfile} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center gap-2">
                  {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                  Sauvegarder le profil
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Security */}
          {activeTab === "security" && (
            <form onSubmit={handleSavePassword}>
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/10">
                <h2 className="font-bold text-base text-zinc-900 dark:text-white">Sécurité du compte</h2>
                <p className="text-xs text-zinc-500">Gérez votre mot de passe et activez la double authentification.</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Mot de passe actuel</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-3.5 text-zinc-400" />
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-3.5 text-zinc-400 hover:text-zinc-600"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Nouveau mot de passe</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 caractères"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirmer mot de passe"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <hr className="border-zinc-200 dark:border-zinc-850" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">Double authentification (2FA)</p>
                    <p className="text-xs text-zinc-500">Sécurisez votre compte en demandant un code temporaire lors de vos connexions.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="p-6 bg-zinc-50/50 dark:bg-zinc-800/10 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/10 cursor-pointer">
                  Mettre à jour la sécurité
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Notifications */}
          {activeTab === "notifications" && (
            <form onSubmit={handleSaveNotifications}>
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/10">
                <h2 className="font-bold text-base text-zinc-900 dark:text-white">Préférences de communications</h2>
                <p className="text-xs text-zinc-500">Choisissez quand et comment vous souhaitez être alerté.</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800/80">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Alertes par email</p>
                      <p className="text-xs text-zinc-500">Recevez des mises à jour sur vos devoirs, quiz et cours achetés.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={notifEmail} onChange={e => setNotifEmail(e.target.checked)} />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800/80">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Notifications Push du navigateur</p>
                      <p className="text-xs text-zinc-500">Recevez des notifications immédiates sur l&apos;écran quand vous étudiez.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={notifPush} onChange={e => setNotifPush(e.target.checked)} />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800/80">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Rappels de Sessions Live</p>
                      <p className="text-xs text-zinc-500">Soyez alerté 30 minutes avant le début d&apos;une diffusion programmée.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={notifLive} onChange={e => setNotifLive(e.target.checked)} />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Validation de certificats</p>
                      <p className="text-xs text-zinc-500">Recevez un email contenant votre certificat officiel dès validation d&apos;un cours.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={notifCert} onChange={e => setNotifCert(e.target.checked)} />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-zinc-50/50 dark:bg-zinc-800/10 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/10 cursor-pointer">
                  Sauvegarder les préférences
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: Billing and Subscriptions */}
          {activeTab === "billing" && (
            <div className="space-y-0">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/10">
                <h2 className="font-bold text-base text-zinc-900 dark:text-white">Abonnement & Formules</h2>
                <p className="text-xs text-zinc-500">Visualisez votre plan d&apos;accès actuel et explorez les paliers supérieurs.</p>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Active Plan Display */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-xl" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-blue-200 font-bold">Plan actuel</p>
                        <h3 className="text-2xl font-black mt-1">Formule {session?.plan || "FREE"}</h3>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
                        Actif
                      </span>
                    </div>
                    <p className="text-xs text-blue-100 max-w-md">
                      {session?.plan === "MAX" 
                        ? "Vous disposez d'un accès illimité à l'intégralité du catalogue, aux certifications gratuites et au support prioritaire." 
                        : "Accès standard aux cours gratuits et achetés individuellement. Passez à la formule PRO ou MAX pour débloquer tout le catalogue."}
                    </p>
                  </div>
                </div>

                {/* Plan options grid */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Ajuster ma formule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Free tier */}
                    <div className="bg-white dark:bg-zinc-850 p-5 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between space-y-4 relative">
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm text-zinc-950 dark:text-white">Formule FREE</h4>
                        <p className="text-xxs text-zinc-500">Idéal pour démarrer l&apos;exploration</p>
                        <p className="text-xl font-extrabold text-zinc-950 dark:text-white">0$/mois</p>
                        <ul className="text-xxs text-zinc-600 dark:text-zinc-400 space-y-1.5 pt-2">
                          <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Cours d&apos;introduction</li>
                          <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Profil d&apos;apprenant</li>
                        </ul>
                      </div>
                      <button disabled className="w-full py-2 border rounded-xl text-xs font-bold text-zinc-400 cursor-not-allowed select-none bg-zinc-50 dark:bg-zinc-800">
                        {session?.plan === "FREE" || !session?.plan ? "Plan actuel" : "Purger"}
                      </button>
                    </div>

                    {/* Pro tier */}
                    <div className="bg-white dark:bg-zinc-850 p-5 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between space-y-4 relative">
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm text-zinc-950 dark:text-white">Formule PRO</h4>
                        <p className="text-xxs text-zinc-500">Pour les apprenants réguliers</p>
                        <p className="text-xl font-extrabold text-zinc-950 dark:text-white">29$/mois</p>
                        <ul className="text-xxs text-zinc-600 dark:text-zinc-400 space-y-1.5 pt-2">
                          <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> 80% du catalogue inclus</li>
                          <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Certificats validés</li>
                          <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Accès communauté</li>
                        </ul>
                      </div>
                      <button 
                        onClick={() => alert("Simulation d'achat de la formule PRO")} 
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          session?.plan === "PRO"
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {session?.plan === "PRO" ? "Plan actuel" : "Choisir PRO"}
                      </button>
                    </div>

                    {/* Max tier */}
                    <div className="bg-white dark:bg-zinc-850 p-5 border-2 border-blue-500 rounded-2xl flex flex-col justify-between space-y-4 relative">
                      <span className="absolute -top-3 right-4 bg-blue-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                        Recommandé
                      </span>
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm text-zinc-950 dark:text-white">Formule MAX</h4>
                        <p className="text-xxs text-zinc-500">L&apos;expérience ultime illimitée</p>
                        <p className="text-xl font-extrabold text-blue-600">59$/mois</p>
                        <ul className="text-xxs text-zinc-600 dark:text-zinc-400 space-y-1.5 pt-2">
                          <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> 100% du catalogue</li>
                          <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Certificats blockchain</li>
                          <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Live streams prioritaires</li>
                          <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Support technique VIP</li>
                        </ul>
                      </div>
                      <button 
                        onClick={() => alert("Simulation d'achat de la formule MAX")} 
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          session?.plan === "MAX"
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {session?.plan === "MAX" ? "Plan actuel" : "Choisir MAX"}
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB PAYMENT */}
          {activeTab === "payment" && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="font-bold text-base text-zinc-900 dark:text-white">Moyens de paiement</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Définissez vos numéros Mobile Money ou PayPal pour les paiements automatiques.</p>
              </div>

              {paymentSaved && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Moyens de paiement enregistrés !</p>
                </div>
              )}

              {/* Type selector */}
              <div className="flex gap-3">
                <button
                  onClick={() => setNewPaymentType("mobile_money")}
                  className={`flex-1 py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    newPaymentType === "mobile_money"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <Phone className="w-4 h-4" /> Mobile Money
                </button>
                <button
                  onClick={() => setNewPaymentType("paypal")}
                  className={`flex-1 py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    newPaymentType === "paypal"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> PayPal
                </button>
              </div>

              {newPaymentType === "mobile_money" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Opérateur</label>
                    <select
                      value={newPaymentLabel}
                      onChange={(e) => setNewPaymentLabel(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Choisir un opérateur</option>
                      {["MTN Mobile Money", "Orange Money", "Wave", "Airtel Money", "M-Pesa", "Moov Money", "Autre"].map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Numéro de téléphone</label>
                    <input
                      type="tel"
                      value={newPaymentPhone}
                      onChange={(e) => setNewPaymentPhone(e.target.value)}
                      placeholder="+237 6XX XXX XXX"
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Pays</label>
                    <input
                      type="text"
                      value={newPaymentCountry}
                      onChange={(e) => setNewPaymentCountry(e.target.value)}
                      placeholder="Ex: CM, SN, CI"
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {newPaymentType === "paypal" && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Adresse email PayPal</label>
                  <input
                    type="email"
                    value={newPaymentEmail}
                    onChange={(e) => setNewPaymentEmail(e.target.value)}
                    placeholder="paypal@email.com"
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <button
                onClick={() => {
                  if (newPaymentType === "mobile_money" && (!newPaymentLabel || !newPaymentPhone)) return;
                  if (newPaymentType === "paypal" && !newPaymentEmail) return;
                  const newMethod: PaymentMethod = {
                    id: crypto.randomUUID(),
                    type: newPaymentType,
                    label: newPaymentType === "mobile_money" ? newPaymentLabel : "PayPal",
                    phone: newPaymentPhone || undefined,
                    email: newPaymentEmail || undefined,
                    country: newPaymentCountry || undefined,
                  };
                  setPaymentMethods(prev => [...prev, newMethod]);
                  setNewPaymentLabel(""); setNewPaymentPhone(""); setNewPaymentEmail(""); setNewPaymentCountry("");
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>

              {paymentMethods.length > 0 && (
                <div className="space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Moyens enregistrés</h3>
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        preferredMethod === method.id
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                          : "border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            method.type === "paypal" ? "bg-blue-100 dark:bg-blue-950/30 text-blue-600" : "bg-teal-100 dark:bg-teal-950/30 text-teal-600"
                          }`}>
                            {method.type === "paypal" ? <CreditCard className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                              {method.label}
                              {preferredMethod === method.id && (
                                <span className="text-[9px] font-extrabold uppercase bg-blue-500 text-white px-1.5 py-0.5 rounded-full">Préféré</span>
                              )}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {method.type === "paypal" ? method.email : `${method.phone}${method.country ? " • " + method.country : ""}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {preferredMethod !== method.id && (
                            <button
                              onClick={() => setPreferredMethod(method.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-600 border border-blue-200 dark:border-blue-800 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                            >
                              Définir préféré
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setPaymentMethods(prev => prev.filter(m => m.id !== method.id));
                              if (preferredMethod === method.id) setPreferredMethod(null);
                            }}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={async () => {
                        setSavingPayment(true);
                        try {
                          const res = await fetch("/api/profile", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ payment_methods: paymentMethods, preferred_payment_method: preferredMethod }),
                          });
                          if (res.ok) { setPaymentSaved(true); setTimeout(() => setPaymentSaved(false), 3000); }
                        } finally { setSavingPayment(false); }
                      }}
                      disabled={savingPayment}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                    >
                      {savingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
