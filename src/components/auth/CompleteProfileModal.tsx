"use client";

import { useEffect, useState } from "react";
import {
  Globe2,
  Phone,
  User,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  Sparkles,
  Building2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { COUNTRIES, CountryItem } from "@/lib/countries";

interface CompleteProfileModalProps {
  onCompleted?: () => void;
}

export function CompleteProfileModal({ onCompleted }: CompleteProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isInstructor, setIsInstructor] = useState(false);

  // Form states
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(
    COUNTRIES.find((c) => c.code === "CD") || COUNTRIES[0]
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [academyName, setAcademyName] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function checkIncompleteProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur");
        setUserEmail(user.email || "");

        // Fetch user roles
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("roles(name)")
          .eq("user_id", user.id);

        const roleNames = (userRoles || []).map((ur: any) => ur.roles?.name).filter(Boolean);
        const instructorRole = roleNames.includes("INSTRUCTOR") || roleNames.includes("TEACHING_ASSISTANT");
        if (isMounted) setIsInstructor(instructorRole);

        // Fetch current profile from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("country, nationality, phone, phone_number, gender, academy_name")
          .eq("id", user.id)
          .maybeSingle();

        const meta = user.user_metadata || {};

        const hasCountry = !!(profile?.country || profile?.nationality || meta.country || meta.nationality);
        const hasPhone = !!(profile?.phone || profile?.phone_number || meta.phone_number || meta.phone || user.phone);
        const hasGender = !!(profile?.gender || meta.gender);
        const needsAcademy = instructorRole && !(profile?.academy_name || meta.academy_name);

        // If ANY mandatory info is missing, show the modal!
        if (!hasCountry || !hasPhone || !hasGender || needsAcademy) {
          // Prepopulate if partial data exists
          const existingCountryCode = profile?.country || meta.country;
          if (existingCountryCode) {
            const found = COUNTRIES.find(
              (c) =>
                c.code.toLowerCase() === existingCountryCode.toLowerCase() ||
                c.name.toLowerCase() === existingCountryCode.toLowerCase()
            );
            if (found && isMounted) setSelectedCountry(found);
          }

          const existingPhone = profile?.phone || profile?.phone_number || meta.phone_number || meta.phone;
          if (existingPhone && isMounted) {
            setPhoneNumber(existingPhone.replace(/^\+\d+\s*/, ""));
          }

          const existingGender = profile?.gender || meta.gender;
          if (existingGender && isMounted) {
            const g = existingGender.toLowerCase();
            if (g === "female" || g === "femme" || g === "f") setGender("female");
            else setGender("male");
          }

          if (isMounted) setIsOpen(true);
        } else {
          if (isMounted) setIsOpen(false);
        }
      } catch (err) {
        console.warn("[CompleteProfileModal] check failed:", err);
      }
    }

    checkIncompleteProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCountryChange = (code: string) => {
    const found = COUNTRIES.find((c) => c.code === code);
    if (found) {
      setSelectedCountry(found);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanNumber = phoneNumber.trim().replace(/\s+/g, "");
    if (!cleanNumber) {
      setErrorMsg("Veuillez renseigner votre numéro de téléphone.");
      return;
    }

    if (!/^\d{6,15}$/.test(cleanNumber)) {
      setErrorMsg("Numéro de téléphone invalide (entre 6 et 15 chiffres).");
      return;
    }

    if (isInstructor && !academyName.trim()) {
      setErrorMsg("En tant que formateur, veuillez renseigner le nom de votre académie.");
      return;
    }

    setSubmitting(true);

    try {
      const fullPhone = cleanNumber.startsWith("+")
        ? cleanNumber
        : `${selectedCountry.dial} ${cleanNumber}`;

      const res = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: selectedCountry.code,
          phone: fullPhone,
          gender,
          academyName: isInstructor ? academyName.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour de vos informations.");
      }

      setSuccess(true);

      // Dispatch event to inform other parts of app
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("kuettu_profile_updated", {
            detail: {
              country: selectedCountry.code,
              nationality: selectedCountry.name,
              phone: fullPhone,
              gender,
            },
          })
        );
      }

      setTimeout(() => {
        setIsOpen(false);
        onCompleted?.();
      }, 1200);
    } catch (err: any) {
      console.error("[CompleteProfileModal] Submit error:", err);
      setErrorMsg(err.message || "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 text-white text-left relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Informations Obligatoires
          </div>
          <h2 className="text-xl font-black">Finalisez votre profil</h2>
          <p className="text-xs text-red-100 mt-1 leading-relaxed">
            Pour valider votre compte, sécuriser vos paiements et certifier vos cours, veuillez renseigner vos coordonnées.
          </p>
        </div>

        {/* User preview snippet */}
        <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <span className="font-bold text-zinc-800 dark:text-zinc-200 block truncate">{userName}</span>
              <span className="text-[11px] text-zinc-400 font-mono block truncate">{userEmail}</span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold shrink-0">
            Profil incomplet
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left font-sans">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-base">Profil complété avec succès !</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Vos informations ont été enregistrées dans Supabase. Redirection...
              </p>
            </div>
          ) : (
            <>
              {/* Country Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-red-500" />
                  Pays de résidence <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCountry.code}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer appearance-none"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.dial})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Phone Input with dial prefix */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-red-500" />
                  Numéro de téléphone / WhatsApp <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 shrink-0 flex items-center gap-1.5">
                    <span>{selectedCountry.flag}</span>
                    <span>{selectedCountry.dial}</span>
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 812345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/20 font-mono"
                  />
                </div>
                <p className="text-[10px] text-zinc-400">
                  Indispensable pour recevoir vos notifications d&apos;inscription et vos accès.
                </p>
              </div>

              {/* Gender selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-red-500" />
                  Genre <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      gender === "male"
                        ? "bg-red-50 dark:bg-red-950/20 border-red-500 text-red-600 dark:text-red-400 shadow-sm"
                        : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                    }`}
                  >
                    <span>👨</span> Masculin (Homme)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("female")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      gender === "female"
                        ? "bg-red-50 dark:bg-red-950/20 border-red-500 text-red-600 dark:text-red-400 shadow-sm"
                        : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                    }`}
                  >
                    <span>👩</span> Féminin (Femme)
                  </button>
                </div>
              </div>

              {/* Instructor Academy Name (if instructor) */}
              {isInstructor && (
                <div className="space-y-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    Nom de votre Académie <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Kuettu Blockchain Academy"
                    value={academyName}
                    onChange={(e) => setAcademyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enregistrement en cours...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Valider et Enregistrer mes informations</span>
                  </>
                )}
              </button>
            </>
          )}
        </form>

      </div>
    </div>
  );
}
