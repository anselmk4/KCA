"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  Building2,
  Globe2,
  Phone,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { COUNTRIES, CountryItem } from "@/lib/countries";
import { useLanguage } from "@/context/LanguageContext";

interface InstructorAcademySetupModalProps {
  onCompleted?: (data: {
    academy_name: string;
    nationality: string;
    gender: string;
    phone: string;
  }) => void;
}

export function InstructorAcademySetupModal({ onCompleted }: InstructorAcademySetupModalProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    academyName: "",
    country: "CI", // Côte d'Ivoire default or first
    gender: "MALE",
    phone: "",
  });

  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(
    COUNTRIES.find((c) => c.code === "CI") || COUNTRIES[0]
  );

  // Check if setup is needed
  const checkProfileCompleteness = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if setup already marked completed in localStorage
      if (localStorage.getItem(`ansella_academy_setup_completed_${user.id}`) === "true") {
        setIsOpen(false);
        return;
      }

      // Check if onboarding tour is still active
      const isTourCompleted = localStorage.getItem(
        `ansella_onboarding_completed_${user.id}_INSTRUCTOR`
      );

      // If the tour is not completed yet, wait for tour to finish
      if (!isTourCompleted) {
        return;
      }

      // Check if user is an instructor
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", user.id);

      const roleNames = (userRoles || []).map((ur: any) => ur.roles?.name);
      const isInstructor =
        roleNames.includes("INSTRUCTOR") || roleNames.includes("TEACHING_ASSISTANT");

      if (!isInstructor) return;

      // Fetch profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("academy_name, nationality, gender, phone, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (error || !profile) return;

      const rawAcademy = (profile.academy_name || "").trim();
      const hasCustomAcademy =
        rawAcademy &&
        rawAcademy.toLowerCase() !== "mon académie" &&
        rawAcademy.toLowerCase() !== "mon academie";

      // If academy is already set and not default placeholder, it is already completed!
      if (hasCustomAcademy) {
        localStorage.setItem(`ansella_academy_setup_completed_${user.id}`, "true");
        setIsOpen(false);
        return;
      }

      // Prepopulate available values
      let initialCountryCode = profile.nationality || "CI";
      const foundCountry =
        COUNTRIES.find(
          (c) =>
            c.code.toLowerCase() === initialCountryCode.toLowerCase() ||
            c.name.toLowerCase() === initialCountryCode.toLowerCase()
        ) || COUNTRIES[0];

      setSelectedCountry(foundCountry);

      let initialGender = "MALE";
      if (profile.gender) {
        const g = profile.gender.toUpperCase();
        if (g === "FEMALE" || g === "FEMME" || g === "F") initialGender = "FEMALE";
        else if (g === "OTHER" || g === "AUTRE") initialGender = "OTHER";
        else initialGender = "MALE";
      }

      let defaultName = "";
      if (hasCustomAcademy) {
        defaultName = rawAcademy;
      } else if (profile.full_name) {
        defaultName = `Académie de ${profile.full_name}`;
      }

      setForm({
        academyName: defaultName,
        country: foundCountry.code,
        gender: initialGender,
        phone: profile.phone || "",
      });

      setIsOpen(true);
    } catch (err) {
      console.error("[InstructorAcademySetupModal] Error checking completeness:", err);
    }
  };

  useEffect(() => {
    checkProfileCompleteness();

    // Listen for tour completion event
    const handleTourFinished = () => {
      checkProfileCompleteness();
    };

    window.addEventListener("ansella_onboarding_finished", handleTourFinished);
    return () => {
      window.removeEventListener("ansella_onboarding_finished", handleTourFinished);
    };
  }, []);

  const handleCountryChange = (code: string) => {
    const found = COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
    setSelectedCountry(found);
    setForm((f) => ({ ...f, country: found.code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = form.academyName.trim();
    if (!trimmedName) {
      setErrorMsg(
        language === "en"
          ? "Please enter your academy name."
          : "Veuillez saisir le nom de votre académie."
      );
      return;
    }

    if (
      trimmedName.toLowerCase() === "mon académie" ||
      trimmedName.toLowerCase() === "mon academie"
    ) {
      setErrorMsg(
        language === "en"
          ? "Please choose a custom academy name different from 'Mon Académie'."
          : "Veuillez choisir un nom personnalisé différent de « Mon Académie »."
      );
      return;
    }

    const trimmedPhone = form.phone.trim();
    if (!trimmedPhone) {
      setErrorMsg(
        language === "en"
          ? "Please enter your phone number."
          : "Veuillez renseigner votre numéro de téléphone."
      );
      return;
    }

    setSubmitting(true);

    try {
      const fullPhone = trimmedPhone.startsWith("+")
        ? trimmedPhone
        : `${selectedCountry.dial} ${trimmedPhone}`;

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academy_name: trimmedName,
          nationality: selectedCountry.name,
          gender: form.gender,
          phone: fullPhone,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Échec de l'enregistrement du profil.");
      }

      setSuccess(true);

      // Notify parent & listeners
      if (typeof window !== "undefined") {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          localStorage.setItem(`ansella_academy_setup_completed_${currentUser.id}`, "true");
        }
        localStorage.setItem("kuettu_academy_name", trimmedName);
        window.dispatchEvent(
          new CustomEvent("kuettu_profile_updated", {
            detail: {
              academy_name: trimmedName,
              nationality: selectedCountry.name,
              gender: form.gender,
              phone: fullPhone,
            },
          })
        );
      }

      onCompleted?.({
        academy_name: trimmedName,
        nationality: selectedCountry.name,
        gender: form.gender,
        phone: fullPhone,
      });

      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 1200);
    } catch (err: any) {
      console.error("[InstructorAcademySetupModal] Submit error:", err);
      setErrorMsg(err.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300 font-sans">
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Gradient Banner */}
        <div className="h-2 bg-gradient-to-r from-teal-500 via-blue-600 to-indigo-600 w-full" />

        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/50 text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3 h-3 text-teal-500" />
                <span>{language === "en" ? "Required Step" : "Configuration Requise"}</span>
              </div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight leading-snug">
                {language === "en"
                  ? "Set Up Your Instructor Academy"
                  : "Finalisez votre Académie"}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {language === "en"
                  ? "To customize your space and let students identify your courses, please provide your academy name and basic details."
                  : "Pour personnaliser votre espace et permettre à vos apprenants de vous identifier, veuillez renseigner le nom de votre académie et vos coordonnées."}
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-400 text-xs animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {success ? (
            <div className="py-12 flex flex-col items-center text-center space-y-3 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {language === "en" ? "Academy Configured!" : "Académie configurée avec succès !"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {language === "en"
                  ? "Your instructor dashboard is ready."
                  : "Votre espace formateur est maintenant prêt."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Academy Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {language === "en" ? "Academy Name *" : "Nom de votre Académie *"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={form.academyName}
                    onChange={(e) => setForm({ ...form, academyName: e.target.value })}
                    placeholder={
                      language === "en"
                        ? "e.g., Tech Mastery Academy, Crypto Paris..."
                        : "Ex: Crypto & Web3 Academy, Tech Mastery..."
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-400 text-xs sm:text-sm font-medium"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {language === "en"
                    ? "This name will appear on all your courses and certificates."
                    : "Ce nom sera affiché sur toutes vos formations et attestations."}
                </p>
              </div>

              {/* 2. Country / Nationality */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {language === "en" ? "Country / Location *" : "Pays / Localisation *"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Globe2 className="w-4 h-4" />
                  </div>
                  <select
                    value={form.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer text-xs sm:text-sm font-medium"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.dial})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* 3. Gender */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {language === "en" ? "Gender / Sex *" : "Sexe / Genre *"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "MALE", labelFr: "Homme", labelEn: "Male" },
                    { key: "FEMALE", labelFr: "Femme", labelEn: "Female" },
                    { key: "OTHER", labelFr: "Autre", labelEn: "Other" },
                  ].map((item) => {
                    const isSelected = form.gender === item.key;
                    return (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => setForm({ ...form, gender: item.key })}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-teal-50 dark:bg-teal-900/30 border-teal-500 text-teal-700 dark:text-teal-300 shadow-sm"
                            : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <User className={`w-3.5 h-3.5 ${isSelected ? "text-teal-600" : "text-zinc-400"}`} />
                        <span>{language === "en" ? item.labelEn : item.labelFr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Phone Number */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {language === "en" ? "Phone Number *" : "Numéro de Téléphone *"}
                </label>
                <div className="relative flex rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-50 dark:bg-zinc-800/80 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent transition-all">
                  <div className="px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 shrink-0 select-none">
                    <span>{selectedCountry.flag}</span>
                    <span>{selectedCountry.dial}</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="07 00 00 00 00"
                    className="w-full px-3 py-2.5 bg-transparent text-zinc-900 dark:text-white text-xs sm:text-sm font-medium outline-none placeholder:text-zinc-400"
                  />
                  <div className="pr-3 flex items-center text-zinc-400 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {language === "en"
                    ? "Used for account security and payout notifications."
                    : "Utilisé pour la sécurité de votre compte et vos notifications de paiement."}
                </p>
              </div>

              {/* Submit button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === "en" ? "Saving..." : "Enregistrement en cours..."}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {language === "en"
                          ? "Save and Access My Academy"
                          : "Enregistrer et accéder à mon Académie"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
