"use client";

import { useState, useEffect } from "react";
import {
  UserPlus,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calendar,
  DollarSign,
  Mail,
  User,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface CourseOption {
  id: string;
  title: string;
  price: number;
  type?: string;
}

interface SessionOption {
  id: string;
  courseId: string;
  name: string;
  status: string;
}

interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: CourseOption[];
  sessions: SessionOption[];
  onSuccess: () => void;
}

export function EnrollStudentModal({
  isOpen,
  onClose,
  courses,
  sessions,
  onSuccess,
}: EnrollStudentModalProps) {
  const [studentEmail, setStudentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [paymentOption, setPaymentOption] = useState<"FREE" | "CASH_FULL" | "CASH_INSTALLMENT">("FREE");
  const [paidAmount, setPaidAmount] = useState<string>("0");
  const [notifyEmail, setNotifyEmail] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize selected course if empty
  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Selected course price
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const coursePrice = selectedCourse ? Number(selectedCourse.price) || 0 : 0;

  // Update default paidAmount when course or paymentOption changes
  useEffect(() => {
    if (paymentOption === "FREE") {
      setPaidAmount("0");
    } else if (paymentOption === "CASH_FULL") {
      setPaidAmount(String(coursePrice));
    } else if (paymentOption === "CASH_INSTALLMENT" && (paidAmount === "0" || paidAmount === String(coursePrice))) {
      setPaidAmount(String(Math.round(coursePrice / 2) || 50));
    }
  }, [paymentOption, coursePrice]);

  // Sessions filtered by course
  const availableSessions = sessions.filter(
    (s) => !selectedCourseId || s.courseId === selectedCourseId
  );

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentEmail.trim()) {
      setError("Veuillez saisir l'adresse email de l'étudiant.");
      return;
    }
    if (!selectedCourseId) {
      setError("Veuillez sélectionner un cours.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/instructor/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentEmail: studentEmail.trim().toLowerCase(),
          studentName: studentName.trim() || undefined,
          courseId: selectedCourseId,
          sessionId: selectedSessionId || null,
          paymentOption,
          paidAmount: paymentOption === "FREE" ? 0 : parseFloat(paidAmount) || 0,
          notifyEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible d'inscrire l'étudiant.");
      }

      setSuccessMsg(data.message || "Apprenant enrôlé avec succès !");
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset form
        setStudentEmail("");
        setStudentName("");
        setError(null);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/50 dark:border-teal-900/40">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                Enrôler un étudiant
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Inscrivez manuellement un apprenant et donnez-lui accès à votre cours.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback states */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-teal-600" />
              Adresse Email de l'étudiant *
            </label>
            <input
              type="email"
              required
              placeholder="ex: apprenant@gmail.com"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/40"
            />
            <p className="text-[10px] text-zinc-400">
              Si le compte n'existe pas encore, il sera créé automatiquement.
            </p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" />
              Nom complet (Optionnel)
            </label>
            <input
              type="text"
              placeholder="ex: Christian Lumbala"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/40"
            />
          </div>

          {/* Course Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              Formation à assigner *
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedSessionId("");
              }}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.price > 0 ? `${c.price} $` : "Gratuit"})
                </option>
              ))}
            </select>
          </div>

          {/* Cohort / Session Selection */}
          {availableSessions.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                Session / Cohorte (Optionnel)
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/20 text-xs text-teal-900 dark:text-teal-200 outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer"
              >
                <option value="">-- Sans classe spécifique (Accès libre) --</option>
                {availableSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status === "IN_PROGRESS" ? "Active" : s.status === "UPCOMING" ? "À venir" : "Terminée"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment & Admission Option */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Modalité financière / Accès
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentOption("FREE")}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  paymentOption === "FREE"
                    ? "border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20 font-bold"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <p className="text-[11px] font-bold">🎁 Gratuit / Bourse</p>
                <p className="text-[9px] text-zinc-400 mt-0.5">Accès offert à 100%</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentOption("CASH_FULL")}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  paymentOption === "CASH_FULL"
                    ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 font-bold"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <p className="text-[11px] font-bold">💵 Paiement Comptant</p>
                <p className="text-[9px] text-zinc-400 mt-0.5">Totalité réglée ({coursePrice} $)</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentOption("CASH_INSTALLMENT")}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  paymentOption === "CASH_INSTALLMENT"
                    ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20 font-bold"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <p className="text-[11px] font-bold">💳 Acompte / Tranche</p>
                <p className="text-[9px] text-zinc-400 mt-0.5">Premier versement partiel</p>
              </button>
            </div>
          </div>

          {/* Amount Input (if cash paid) */}
          {paymentOption !== "FREE" && (
            <div className="space-y-1.5 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Montant encaissé en espèces / virement ($ USD)</span>
                <span className="text-[10px] text-zinc-400">Prix catalogue : {coursePrice} $</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/40"
                />
              </div>
              {paymentOption === "CASH_INSTALLMENT" && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  Reste dû : {Math.max(0, coursePrice - (parseFloat(paidAmount) || 0))} $ (à percevoir ultérieurement)
                </p>
              )}
            </div>
          )}

          {/* Notification Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="notify-email-checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
              className="rounded border-zinc-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <label htmlFor="notify-email-checkbox" className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
              Envoyer un email de confirmation &amp; instructions d'accès à l'étudiant
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enrôlement en cours...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Valider l'inscription</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
