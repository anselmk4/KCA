"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Cpu,
  Coins,
  Loader2,
  Globe,
  Phone,
  User2,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { initDB } from "@/lib/db";
import { setSimulatedSession } from "@/lib/rbac";
import { supabase } from "@/lib/supabase/client";
import { ensureProfile, fetchUserProfile } from "@/lib/supabase/auth-helpers";
import { Captcha } from "@/components/ui/Captcha";

// ─── Data ──────────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: "DZ", name: "Algérie", flag: "🇩🇿", dial: "+213" },
  { code: "AO", name: "Angola", flag: "🇦🇴", dial: "+244" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", dial: "+229" },
  { code: "BW", name: "Botswana", flag: "🇧🇼", dial: "+267" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", dial: "+226" },
  { code: "BI", name: "Burundi", flag: "🇧🇮", dial: "+257" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", dial: "+237" },
  { code: "CV", name: "Cap-Vert", flag: "🇨🇻", dial: "+238" },
  { code: "CF", name: "Centrafrique", flag: "🇨🇫", dial: "+236" },
  { code: "KM", name: "Comores", flag: "🇰🇲", dial: "+269" },
  { code: "CG", name: "Congo", flag: "🇨🇬", dial: "+242" },
  { code: "CD", name: "Congo (RDC)", flag: "🇨🇩", dial: "+243" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", dial: "+225" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯", dial: "+253" },
  { code: "EG", name: "Égypte", flag: "🇪🇬", dial: "+20" },
  { code: "ER", name: "Érythrée", flag: "🇪🇷", dial: "+291" },
  { code: "ET", name: "Éthiopie", flag: "🇪🇹", dial: "+251" },
  { code: "GA", name: "Gabon", flag: "🇬🇦", dial: "+241" },
  { code: "GM", name: "Gambie", flag: "🇬🇲", dial: "+220" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", dial: "+233" },
  { code: "GN", name: "Guinée", flag: "🇬🇳", dial: "+224" },
  { code: "GW", name: "Guinée-Bissau", flag: "🇬🇼", dial: "+245" },
  { code: "GQ", name: "Guinée équatoriale", flag: "🇬🇶", dial: "+240" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", dial: "+254" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸", dial: "+266" },
  { code: "LR", name: "Liberia", flag: "🇱🇷", dial: "+231" },
  { code: "LY", name: "Libye", flag: "🇱🇾", dial: "+218" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬", dial: "+261" },
  { code: "MW", name: "Malawi", flag: "🇲🇼", dial: "+265" },
  { code: "ML", name: "Mali", flag: "🇲🇱", dial: "+223" },
  { code: "MA", name: "Maroc", flag: "🇲🇦", dial: "+212" },
  { code: "MR", name: "Mauritanie", flag: "🇲🇷", dial: "+222" },
  { code: "MU", name: "Maurice", flag: "🇲🇺", dial: "+230" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿", dial: "+258" },
  { code: "NA", name: "Namibie", flag: "🇳🇦", dial: "+264" },
  { code: "NE", name: "Niger", flag: "🇳🇪", dial: "+227" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", dial: "+234" },
  { code: "UG", name: "Ouganda", flag: "🇺🇬", dial: "+256" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼", dial: "+250" },
  { code: "ST", name: "São Tomé-et-Príncipe", flag: "🇸🇹", dial: "+239" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", dial: "+221" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨", dial: "+248" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱", dial: "+232" },
  { code: "SO", name: "Somalie", flag: "🇸🇴", dial: "+252" },
  { code: "SD", name: "Soudan", flag: "🇸🇩", dial: "+249" },
  { code: "SS", name: "Soudan du Sud", flag: "🇸🇸", dial: "+211" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿", dial: "+268" },
  { code: "TZ", name: "Tanzanie", flag: "🇹🇿", dial: "+255" },
  { code: "TD", name: "Tchad", flag: "🇹🇩", dial: "+235" },
  { code: "TG", name: "Togo", flag: "🇹🇬", dial: "+228" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳", dial: "+216" },
  { code: "ZM", name: "Zambie", flag: "🇿🇲", dial: "+260" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼", dial: "+263" },
  // International
  { code: "FR", name: "France", flag: "🇫🇷", dial: "+33" },
  { code: "BE", name: "Belgique", flag: "🇧🇪", dial: "+32" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dial: "+1" },
  { code: "CH", name: "Suisse", flag: "🇨🇭", dial: "+41" },
  { code: "US", name: "États-Unis", flag: "🇺🇸", dial: "+1" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧", dial: "+44" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪", dial: "+49" },
  { code: "BR", name: "Brésil", flag: "🇧🇷", dial: "+55" },
  { code: "AE", name: "Émirats Arabes", flag: "🇦🇪", dial: "+971" },
];

const INSTRUCTOR_DOMAINS = [
  { value: "blockchain", label: "Blockchain & Cryptomonnaies", icon: "⛓️" },
  { value: "trading", label: "Trading & Finance", icon: "📈" },
  { value: "ai", label: "Intelligence Artificielle", icon: "🤖" },
  { value: "web3", label: "Web3 & NFT", icon: "🌐" },
  { value: "defi", label: "DeFi & Yield Farming", icon: "💎" },
  { value: "security", label: "Cybersécurité & Audit", icon: "🔒" },
  { value: "development", label: "Développement Blockchain", icon: "💻" },
  { value: "entrepreneurship", label: "Entrepreneuriat & Startups", icon: "🚀" },
  { value: "other", label: "Autre / Personnalisé", icon: "✏️" },
];

const TOTAL_STEPS = 4;

// ─── Step Indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ step, role }: { step: number; role: "INSTRUCTOR" | "STUDENT" }) {
  const labels =
    role === "INSTRUCTOR"
      ? ["Compte", "Profil", "Académie", "Validation"]
      : ["Compte", "Profil", "Préférences", "Validation"];

  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {labels.map((label, i) => {
        const idx = i + 1;
        const isCompleted = step > idx;
        const isCurrent = step === idx;
        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/40"
                    : isCurrent
                    ? "bg-blue-600 text-white ring-4 ring-blue-500/20"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx}
              </div>
              <span
                className={`text-[9px] font-semibold transition-colors ${
                  isCurrent
                    ? "text-blue-600 dark:text-blue-400"
                    : isCompleted
                    ? "text-zinc-500 dark:text-zinc-400"
                    : "text-zinc-400 dark:text-zinc-600"
                }`}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 mb-3 rounded-full transition-all duration-300 ${
                  step > idx ? "bg-blue-600" : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Form ──────────────────────────────────────────────────────────────────

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<"INSTRUCTOR" | "STUDENT" | null>(null);
  const [step, setStep] = useState(1); // Steps 1–4

  // Step 1 — Personal info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 — Profile details
  const [country, setCountry] = useState("");
  const [dialCode, setDialCode] = useState("+243");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState<"" | "male" | "female">("");;

  // Step 3 — Role-specific
  // Instructor
  const [academyName, setAcademyName] = useState("");
  const [thematic, setThematic] = useState("blockchain");
  const [customThematic, setCustomThematic] = useState("");
  const [bio, setBio] = useState("");
  const [selectedPlan] = useState<"FREE" | "BASE" | "PRO" | "MAX">("FREE");
  // Student
  const [studentLevel, setStudentLevel] = useState("Débutant");
  const [interestCourse, setInterestCourse] = useState("blockchain");

  // State
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  // ── Session guard & query params ──────────────────────────────────────────

  useEffect(() => {
    initDB();

    const checkSession = async () => {
      try {
        const {
          data: { session: activeSession },
        } = await supabase.auth.getSession();
        if (activeSession?.user) {
          const profile = await fetchUserProfile(activeSession.user.id);
          if (profile) {
            setSimulatedSession({
              userId: profile.id,
              name: profile.full_name,
              email: profile.email,
              role: profile.role,
              status: profile.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
              plan: profile.plan,
            });
            if (profile.role === "INSTRUCTOR" || profile.role === "TEACHING_ASSISTANT") {
              router.replace("/instructor");
            } else if (
              ["SUPER_ADMIN", "ADMIN", "FINANCE_ADMIN", "ACADEMIC_ADMIN", "SUPPORT_AGENT"].includes(
                profile.role
              )
            ) {
              router.replace("/admin");
            } else {
              router.replace("/dashboard");
            }
          }
        }
      } catch (err) {
        console.error("Error checking session on register:", err);
      }
    };
    checkSession();

    const queryPlan = searchParams.get("plan")?.toUpperCase();
    const queryModule = searchParams.get("module")?.toLowerCase();
    const queryRole = searchParams.get("role")?.toUpperCase();
    const queryRef = searchParams.get("ref");

    // Store referral code in localStorage for use after signup
    if (queryRef) {
      localStorage.setItem("ansella_referral_code", queryRef.toUpperCase());
    }

    if (queryPlan === "FREE" || queryPlan === "BASE" || queryPlan === "PRO" || queryPlan === "MAX") {
      setRole("INSTRUCTOR");
    } else if (["blockchain", "trading", "ai", "web3"].includes(queryModule || "")) {
      setInterestCourse(queryModule!);
      setRole("STUDENT");
    } else if (queryRole === "INSTRUCTOR" || queryRole === "TEACHER") {
      setRole("INSTRUCTOR");
    } else if (["STUDENT", "LEARNER", "APPRENANT"].includes(queryRole || "")) {
      setRole("STUDENT");
    }
  }, [searchParams, router]);

  // ── Country → dial code sync ──────────────────────────────────────────────

  const handleCountryChange = (code: string) => {
    setCountry(code);
    const found = COUNTRIES.find((c) => c.code === code);
    if (found) setDialCode(found.dial);
  };

  // ── Validation per step ───────────────────────────────────────────────────

  const validateStep = (): boolean => {
    setFormError(null);
    if (step === 1) {
      if (!name.trim()) { setFormError("Le nom complet est requis."); return false; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setFormError("Adresse email invalide."); return false; }
      if (password.length < 8) { setFormError("Le mot de passe doit contenir au moins 8 caractères."); return false; }
    }
    if (step === 2) {
      if (!country) { setFormError("Veuillez sélectionner votre pays."); return false; }
      if (!phoneNumber.trim()) { setFormError("Le numéro de téléphone est requis."); return false; }
      if (!/^\d{6,15}$/.test(phoneNumber.replace(/\s/g, ""))) {
        setFormError("Numéro de téléphone invalide (6 à 15 chiffres).");
        return false;
      }
      if (!gender) { setFormError("Veuillez sélectionner votre genre."); return false; }
    }
    if (step === 3 && role === "INSTRUCTOR") {
      if (!academyName.trim()) { setFormError("Le nom de votre académie est requis."); return false; }
      if (thematic === "other" && !customThematic.trim()) { setFormError("Veuillez spécifier votre domaine d'enseignement."); return false; }
      if (!bio.trim()) { setFormError("Une courte bio est requise."); return false; }
    }
    return true;
  };

  const handleNext = async () => {
    setSuccessMessage(null);
    if (!validateStep()) return;

    if (step === 1) {
      setCheckingEmail(true);
      try {
        const checkRes = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.exists) {
            setFormError("Cet email est déjà utilisé. Essayez de vous connecter.");
            setCheckingEmail(false);
            return;
          }
        }
      } catch (err) {
        console.error("Error checking email availability:", err);
      } finally {
        setCheckingEmail(false);
      }
    }

    setStep((s) => s + 1);
  };

  const handlePrev = () => {
    setFormError(null);
    setSuccessMessage(null);
    if (step === 1) {
      setRole(null);
    } else {
      setStep((s) => s - 1);
    }
  };

  // ── Google OAuth ──────────────────────────────────────────────────────────

  const handleGoogleRegister = async () => {
    setFormError(null);
    setGoogleLoading(true);
    try {
      const { error: authErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authErr) throw authErr;
    } catch (err: any) {
      setFormError(err.message || "Erreur lors de l'authentification Google.");
      setGoogleLoading(false);
    }
  };

  // ── Final submit ──────────────────────────────────────────────────────────

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!captchaToken) {
      setFormError("Veuillez valider le test de sécurité (CAPTCHA).");
      return;
    }

    setLoading(true);

    try {
      // Check email uniqueness before calling signUp (since signUp returns a fake success if enumeration protection is on)
      const emailCheckRes = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (emailCheckRes.ok) {
        const emailCheckData = await emailCheckRes.json();
        if (emailCheckData.exists) {
          throw new Error("Cet email est déjà utilisé. Essayez de vous connecter.");
        }
      }

      // Security check (CAPTCHA + rate limit)
      const secRes = await fetch("/api/auth/security-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: captchaToken, action: "register" }),
      });
      if (!secRes.ok) {
        const secData = await secRes.json();
        throw new Error(secData.error || "La vérification de sécurité a échoué.");
      }

      const fullPhone = `${dialCode}${phoneNumber.replace(/\s/g, "")}`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role || "STUDENT",
            country,
            phone_number: fullPhone,
            gender,
            // Instructor
            academy_name: academyName || null,
            bio: bio || null,
            thematic: role === "INSTRUCTOR" ? (thematic === "other" ? customThematic : thematic) : null,
            // Student
            student_level: studentLevel || null,
            interest_course: interestCourse || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/auth/confirmed`,
        },
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("user already exists") || msg.includes("duplicate")) {
          setFormError("Cet email est déjà utilisé. Essayez de vous connecter.");
        } else if (msg.includes("database error saving new user")) {
          setFormError("Erreur lors de la création. Cet email est peut-être déjà utilisé.");
        } else if (msg.includes("password")) {
          setFormError("Mot de passe trop faible. Minimum 8 caractères.");
        } else if (msg.includes("invalid email") || msg.includes("unable to validate email")) {
          setFormError("Adresse email invalide.");
        } else if (msg.includes("rate limit")) {
          setFormError("Trop de tentatives. Attendez quelques minutes et réessayez.");
        } else {
          setFormError(authError.message);
        }
        setCaptchaResetKey((k) => k + 1);
        setLoading(false);
        return;
      }

      const sessionUser = authData.user;
      if (!sessionUser) {
        setFormError("Erreur lors de l'inscription. Réessayez.");
        setCaptchaResetKey((k) => k + 1);
        setLoading(false);
        return;
      }

      // ── CRITICAL: write the simulated session IMMEDIATELY after signUp ──
      // This must happen before any async API call so the layout guard
      // always finds a valid session in localStorage on navigation.
      setSimulatedSession({
        userId: sessionUser.id,
        name,
        email,
        role: (role || "STUDENT") as any,
        status: "ACTIVE",
        plan: "FREE",
      });

      // Mark the email as unconfirmed if there is no active Supabase session yet
      if (!authData.session) {
        localStorage.setItem("kuettu_unconfirmed_email", "true");
      } else {
        localStorage.setItem("kuettu_unconfirmed_email", "false");
      }

      // Store the registration role selection for robust confirmed page lookup
      localStorage.setItem("kuettu_registration_role", role || "STUDENT");

      // Call register-profile API to build DB records (non-blocking — does NOT
      // prevent dashboard access if it fails; profile will be auto-created on
      // next login via the auth-helpers fallback).
      const storedRef = localStorage.getItem("ansella_referral_code");
      try {
        const regProfileRes = await fetch("/api/auth/register-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: sessionUser.id,
            email,
            name,
            role: role || "STUDENT",
            country,
            phone: fullPhone,
            gender,
            academyName: academyName || null,
            bio: bio || null,
            thematic: role === "INSTRUCTOR" ? (thematic === "other" ? customThematic : thematic) : null,
            studentLevel: studentLevel || null,
            interestCourse: interestCourse || null,
            referralCode: storedRef || null,
          }),
        });
        if (!regProfileRes.ok) {
          const errData = await regProfileRes.json().catch(() => ({}));
          console.error("[register] register-profile API error:", errData);
          // Non-blocking: the session is already written, continue to redirect
        }
      } catch (apiErr) {
        console.error("[register] register-profile fetch failed:", apiErr);
        // Non-blocking: still redirect to dashboard
      }

      if (storedRef) {
        localStorage.removeItem("ansella_referral_code");
      }

      // Save local preferences
      if (role === "INSTRUCTOR") {
        localStorage.setItem("kuettu_academy_name", academyName || "Mon Académie");
        localStorage.setItem("kuettu_user_name", name);
      } else {
        localStorage.setItem("kuettu_user_name", name);
        localStorage.setItem("kuettu_user_level", studentLevel || "Débutant");
        localStorage.setItem("kuettu_active_module", interestCourse || "blockchain");
      }

      // If email confirmation is required (session is null), redirect to login with query params.
      // Otherwise, log in immediately and redirect directly to their dashboard.
      if (!authData.session) {
        router.push(`/login?registered=true&email=${encodeURIComponent(email)}&role=${role}`);
      } else {
        router.push(role === "INSTRUCTOR" ? "/instructor" : "/dashboard");
      }
    } catch (err: any) {
      setFormError(err.message || "Une erreur est survenue.");
      setCaptchaResetKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived helpers ───────────────────────────────────────────────────────

  const selectedCountry = COUNTRIES.find((c) => c.code === country);

  const stepTitle = () => {
    if (role === null) return "Choisissez votre profil";
    const titles: Record<string, string[]> = {
      INSTRUCTOR: ["Créer un compte Formateur", "Votre profil personnel", "Configurez votre Académie", "Validation finale"],
      STUDENT: ["Créer un compte Apprenant", "Votre profil personnel", "Configurez vos préférences", "Validation finale"],
    };
    return titles[role][step - 1];
  };

  const stepSubtitle = () => {
    if (role === null) return "Sélectionnez la manière dont vous souhaitez utiliser notre LMS.";
    const subtitles: Record<string, string[]> = {
      INSTRUCTOR: [
        "Lancez et monétisez votre école en ligne en quelques clics.",
        "Ces informations nous permettent de personnaliser votre expérience.",
        "Configurez votre domaine d'enseignement et votre académie.",
        "Relisez vos informations et finalisez votre inscription.",
      ],
      STUDENT: [
        "Accédez aux meilleures formations certifiantes de haut niveau.",
        "Ces informations nous permettent de personnaliser votre espace.",
        "Dites-nous en plus sur vos objectifs d'apprentissage.",
        "Relisez vos informations et finalisez votre inscription.",
      ],
    };
    return subtitles[role][step - 1];
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 p-8 md:p-10 relative overflow-hidden transition-all duration-300">

      {/* Progress Bar */}
      {role !== null && (
        <div className="absolute top-0 left-0 w-full h-1 bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-teal-500 transition-all duration-500 ease-out"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center mb-6 mt-2">
        <Link href="/" className="flex items-center mb-4">
          <Image src="/logo.png" alt="Logo" width={140} height={42} className="object-contain h-9 w-auto lg:hidden dark:hidden" priority />
          <Image src="/logo-dark.png" alt="Logo" width={140} height={42} className="object-contain h-9 w-auto lg:hidden hidden dark:block" priority />
        </Link>
        <div className="w-full flex justify-end mb-3 lg:hidden">
          <Link href="/" className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors font-medium">
            ← Retour à l&apos;accueil
          </Link>
        </div>

        {role !== null && <StepIndicator step={step} role={role} />}

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1.5 text-center leading-snug">
          {stepTitle()}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-center text-xs leading-relaxed max-w-sm">
          {stepSubtitle()}
        </p>
      </div>

      {/* ── Role Selection (Step 0) ── */}
      {role === null ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div
            onClick={() => setRole("STUDENT")}
            className="group p-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-blue-50/10 dark:hover:bg-blue-900/5 cursor-pointer transition-all flex items-start gap-4"
          >
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 group-hover:scale-105 transition-transform shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Je suis un Apprenant
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Je souhaite suivre des cours interactifs, passer des examens et obtenir des certifications professionnelles.
              </p>
            </div>
          </div>

          <div
            onClick={() => setRole("INSTRUCTOR")}
            className="group p-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-blue-50/10 dark:hover:bg-blue-900/5 cursor-pointer transition-all flex items-start gap-4"
          >
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 group-hover:scale-105 transition-transform shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Je suis un Formateur / Enseignant
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Je souhaite créer ma propre académie en ligne, héberger mes formations et les vendre à l&apos;aide de paiements locaux.
              </p>
            </div>
          </div>

          <div className="pt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-500 font-bold transition-colors">
              Se connecter
            </Link>
          </div>
        </div>
      ) : (
        /* ── Multi-step Form ── */
        <form
          onSubmit={step === TOTAL_STEPS ? handleComplete : async (e) => { e.preventDefault(); await handleNext(); }}
          className="space-y-4"
        >
          {/* Error / Success banners */}
          {formError && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs text-red-700 dark:text-red-400 font-semibold rounded-xl animate-in fade-in">
              {formError}
            </div>
          )}
          {successMessage && (
            <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-xs text-emerald-700 dark:text-emerald-400 font-semibold rounded-xl animate-in fade-in flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ── STEP 1: Personal info ── */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Nom complet
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === "INSTRUCTOR" ? "Prof. Jean Dupont" : "Jean Dupont"}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Adresse Email
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    placeholder="•••••••• (Min. 8 caractères)"
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors text-xs font-semibold"
                  >
                    {showPassword ? "Cacher" : "Voir"}
                  </button>
                </div>
                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4].map((level) => {
                      const strength = Math.min(4, Math.floor(password.length / 3));
                      return (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            level <= strength
                              ? strength <= 1
                                ? "bg-red-500"
                                : strength <= 2
                                ? "bg-orange-400"
                                : strength <= 3
                                ? "bg-yellow-400"
                                : "bg-emerald-500"
                              : "bg-zinc-200 dark:bg-zinc-700"
                          }`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Google signup divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 font-bold">Ou utiliser</span>
                </div>
              </div>

              <button
                type="button"
                disabled={loading || checkingEmail || googleLoading}
                onClick={handleGoogleRegister}
                className="w-full py-3 px-4 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 cursor-pointer text-xs"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.01 1 12 1 7.21 1 3.19 3.78 1.28 7.82l3.86 3C6.07 7.78 8.81 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.92c2.2-2.03 3.67-5.02 3.67-8.65z" />
                    <path fill="#FBBC05" d="M5.14 14.82c-.25-.74-.39-1.53-.39-2.35s.14-1.61.39-2.35L1.28 7.12C.46 8.78 0 10.63 0 12.5s.46 3.72 1.28 5.38l3.86-3.06z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.92c-1.04.7-2.38 1.12-3.83 1.12-3.19 0-5.93-2.74-6.86-5.78l-3.86 3C3.19 20.22 7.21 23 12 23z" />
                  </svg>
                )}
                <span>S&apos;inscrire avec Google (Profil Apprenant)</span>
              </button>
            </div>
          )}

          {/* ── STEP 2: Country / Phone / Gender ── */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Country */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Pays de résidence
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-900 dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="">-- Sélectionner votre pays --</option>
                    <optgroup label="🌍 Afrique">
                      {COUNTRIES.filter((c) =>
                        !["FR","BE","CA","CH","US","GB","DE","BR","AE"].includes(c.code)
                      ).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🌐 International">
                      {COUNTRIES.filter((c) =>
                        ["FR","BE","CA","CH","US","GB","DE","BR","AE"].includes(c.code)
                      ).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  {selectedCountry && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                      {selectedCountry.flag}
                    </span>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Numéro de téléphone
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="flex gap-2">
                  {/* Dial code selector */}
                  <div className="relative">
                    <select
                      value={dialCode}
                      onChange={(e) => setDialCode(e.target.value)}
                      className="pl-3 pr-7 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-900 dark:text-white appearance-none cursor-pointer min-w-[90px]"
                    >
                      {[...new Map(COUNTRIES.map((c) => [c.dial, c])).values()]
                        .sort((a, b) => a.dial.localeCompare(b.dial))
                        .map((c) => (
                          <option key={`${c.dial}-${c.code}`} value={c.dial}>
                            {c.flag} {c.dial}
                          </option>
                        ))}
                    </select>
                  </div>
                  <input
                    required
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9\s]/g, ""))}
                    placeholder="81 234 5678"
                    className="flex-1 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-900 dark:text-white"
                  />
                </div>
                {phoneNumber && (
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 ml-1">
                    Numéro complet : {dialCode} {phoneNumber}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <User2 className="w-3.5 h-3.5" /> Genre
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "male", label: "Homme", emoji: "👨" },
                    { value: "female", label: "Femme", emoji: "👩" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGender(opt.value as typeof gender)}
                      className={`py-3 px-2 rounded-xl border-2 font-bold text-xs transition-all duration-200 flex flex-col items-center gap-1 cursor-pointer ${
                        gender === opt.value
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 shadow-sm shadow-blue-500/20"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-800"
                      }`}
                    >
                      <span className="text-lg">{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy note */}
              <div className="flex items-start gap-2.5 p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/50 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Ces informations sont utilisées uniquement pour personnaliser votre expérience et ne seront jamais partagées avec des tiers.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 3: Role-specific config ── */}
          {step === 3 && role === "INSTRUCTOR" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Academy name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Nom de votre Académie
                </label>
                <input
                  required
                  type="text"
                  value={academyName}
                  onChange={(e) => setAcademyName(e.target.value)}
                  placeholder="Ex: École de Commerce de Kinshasa"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-900 dark:text-white"
                />
              </div>

              {/* Domain / Specialty */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Domaine principal d&apos;enseignement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {INSTRUCTOR_DOMAINS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setThematic(d.value)}
                      className={`px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                        thematic === d.value
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30 shadow-sm shadow-blue-500/10"
                          : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{d.icon}</span>
                        <span
                          className={`text-[11px] font-semibold leading-tight ${
                            thematic === d.value
                              ? "text-blue-700 dark:text-blue-400"
                              : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {d.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {thematic === "other" && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-bold text-zinc-650 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Spécifiez votre domaine d&apos;enseignement
                  </label>
                  <input
                    required
                    type="text"
                    value={customThematic}
                    onChange={(e) => setCustomThematic(e.target.value)}
                    placeholder="Ex: Marketing Digital, Photographie, Anglais..."
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-900 dark:text-white"
                  />
                </div>
              )}

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Courte bio / Présentation
                </label>
                <textarea
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Décrivez votre expérience, vos compétences ou votre académie en quelques lignes..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-900 dark:text-white resize-none"
                />
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 text-right">
                  {bio.length} / 300 caractères
                </p>
              </div>
            </div>
          )}

          {step === 3 && role === "STUDENT" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Level */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
                  Votre niveau actuel
                </label>
                <div className="space-y-2">
                  {[
                    { value: "Débutant", label: "Débutant", desc: "Je découvre le domaine", emoji: "🌱" },
                    { value: "Intermédiaire", label: "Intermédiaire", desc: "J'ai quelques notions", emoji: "📚" },
                    { value: "Avancé", label: "Avancé", desc: "Je veux me spécialiser", emoji: "🚀" },
                  ].map((lvl) => (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => setStudentLevel(lvl.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                        studentLevel === lvl.value
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30 shadow-sm shadow-blue-500/10"
                          : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      <span className="text-xl">{lvl.emoji}</span>
                      <div>
                        <p className={`text-sm font-bold ${studentLevel === lvl.value ? "text-blue-700 dark:text-blue-400" : "text-zinc-800 dark:text-zinc-200"}`}>
                          {lvl.label}
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{lvl.desc}</p>
                      </div>
                      {studentLevel === lvl.value && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interest course */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
                  Domaine qui vous intéresse le plus
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "blockchain", label: "Blockchain", icon: "⛓️" },
                    { value: "trading", label: "Trading", icon: "📈" },
                    { value: "ai", label: "Intelligence Artificielle", icon: "🤖" },
                    { value: "web3", label: "Web3 & NFT", icon: "🌐" },
                  ].map((course) => (
                    <button
                      key={course.value}
                      type="button"
                      onClick={() => setInterestCourse(course.value)}
                      className={`px-3 py-3 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                        interestCourse === course.value
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30 shadow-sm shadow-blue-500/10"
                          : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      <span className="text-xl block mb-1">{course.icon}</span>
                      <span className={`text-[11px] font-bold ${interestCourse === course.value ? "text-blue-700 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                        {course.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-800 dark:text-blue-300 leading-relaxed font-semibold">
                  L&apos;inscription vous donne un accès immédiat aux chapitres d&apos;évaluation du cours choisi. Vous pourrez à tout moment débloquer l&apos;accès complet et obtenir votre certificat vérifiable.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 4: Summary + CAPTCHA ── */}
          {step === TOTAL_STEPS && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Summary card */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Récapitulatif de votre inscription
                  </p>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {[
                    { label: "Nom", value: name },
                    { label: "Email", value: email },
                    { label: "Rôle", value: role === "INSTRUCTOR" ? "🎓 Formateur" : "📖 Apprenant" },
                    { label: "Pays", value: selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : "—" },
                    { label: "Téléphone", value: phoneNumber ? `${dialCode} ${phoneNumber}` : "—" },
                    { label: "Genre", value: gender === "male" ? "Homme" : gender === "female" ? "Femme" : "—" },
                    ...(role === "INSTRUCTOR"
                      ? [
                          { label: "Académie", value: academyName },
                          { label: "Domaine", value: thematic === "other" ? customThematic : (INSTRUCTOR_DOMAINS.find((d) => d.value === thematic)?.label || thematic) },
                        ]
                      : [
                          { label: "Niveau", value: studentLevel },
                          { label: "Intérêt", value: interestCourse },
                        ]),
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{row.label}</span>
                      <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 text-right max-w-[60%] truncate">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CAPTCHA */}
              <div className="py-1">
                <Captcha onVerify={setCaptchaToken} resetKey={captchaResetKey} />
              </div>

              {/* Terms */}
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
                En créant un compte, vous acceptez nos{" "}
                <Link href="/terms" className="underline hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                  Conditions d&apos;utilisation
                </Link>{" "}
                et notre{" "}
                <Link href="/privacy" className="underline hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                  Politique de confidentialité
                </Link>.
              </p>
            </div>
          )}

          {/* ── Navigation Buttons ── */}
          <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={handlePrev}
              disabled={loading || checkingEmail}
              className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={loading || checkingEmail || googleLoading || (step === TOTAL_STEPS && !captchaToken)}
              className="flex-1 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer text-sm"
            >
              {loading || checkingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {checkingEmail ? "Vérification..." : "Création du compte..."}
                </>
              ) : step === TOTAL_STEPS ? (
                "Finaliser et ouvrir mon Espace"
              ) : (
                <>
                  Suivant
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Page Shell ──────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-black font-sans">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:col-span-6 relative overflow-hidden bg-gradient-to-br from-slate-100 via-teal-50/50 to-blue-50/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-black p-12 flex-col justify-between select-none border-r border-zinc-200 dark:border-zinc-850">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse duration-[6000ms]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[120px] -ml-40 -mb-40 animate-pulse duration-[8000ms]" />

        <div className="z-10 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Logo" width={160} height={48} className="object-contain h-10 w-auto dark:hidden" priority />
            <Image src="/logo-dark.png" alt="Logo" width={160} height={48} className="object-contain h-10 w-auto hidden dark:block" priority />
          </Link>
          <Link href="/" className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors font-medium">
            ← Accueil
          </Link>
        </div>

        <div className="z-10 max-w-md my-auto space-y-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-200/50 dark:bg-white/5 backdrop-blur-md border border-zinc-300/40 dark:border-white/10 rounded-full text-zinc-700 dark:text-zinc-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>LMS Premium de Nouvelle Génération</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
              Développez vos compétences avec{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 dark:from-blue-400 dark:via-teal-400 dark:to-emerald-400">
                Ansella
              </span>
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed font-medium">
              Créez votre profil en quelques secondes pour acquérir des compétences concrètes et valorisables sur le marché.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm text-zinc-700 dark:text-zinc-350 font-semibold">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Coins className="w-4 h-4 text-blue-600 dark:text-blue-450" />
              </div>
              <span>Accès gratuit aux cours d&apos;évaluation</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-zinc-700 dark:text-zinc-350 font-semibold">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-450" />
              </div>
              <span>Quiz d&apos;évaluation et de progression</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-zinc-700 dark:text-zinc-350 font-semibold">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-450" />
              </div>
              <span>Diplômes et certifications infalsifiables</span>
            </div>
          </div>
        </div>

        <div className="z-10 text-xs text-zinc-450 dark:text-zinc-500">
          © {new Date().getFullYear()} Ansella Inc. Tous droits réservés.
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:col-span-6 flex items-center justify-center p-6 md:p-12 bg-zinc-50 dark:bg-zinc-950">
        <Suspense fallback={<div className="text-zinc-500 dark:text-zinc-400 text-sm">Chargement...</div>}>
          <RegisterForm />
        </Suspense>
      </div>

    </div>
  );
}
