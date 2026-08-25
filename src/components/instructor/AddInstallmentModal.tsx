"use client";

import { useState } from "react";
import {
  DollarSign,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
  Receipt,
  Unlock,
  Sparkles,
} from "lucide-react";

interface AddInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  totalPaid: number;
  remainingAmount: number;
  isSuspended?: boolean;
  onSuccess: () => void;
}

export function AddInstallmentModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  studentEmail,
  courseId,
  courseTitle,
  coursePrice,
  totalPaid,
  remainingAmount,
  isSuspended = false,
  onSuccess,
}: AddInstallmentModalProps) {
  const [amount, setAmount] = useState<string>(
    remainingAmount > 0 ? String(Math.min(remainingAmount, 50)) : "0"
  );
  const [paymentNote, setPaymentNote] = useState<string>("");
  const [unblockAccess, setUnblockAccess] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amount) || 0;
  const simulatedNewTotal = totalPaid + numericAmount;
  const simulatedNewRemaining = Math.max(0, coursePrice - simulatedNewTotal);
  const isSimulatedFull = simulatedNewRemaining <= 0;

  const currentPercent = coursePrice > 0 ? Math.min(100, Math.round((totalPaid / coursePrice) * 100)) : 0;
  const newPercent = coursePrice > 0 ? Math.min(100, Math.round((simulatedNewTotal / coursePrice) * 100)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (numericAmount <= 0) {
      setError("Veuillez saisir un montant supérieur à 0.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/instructor/students/add-installment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          courseId,
          amount: numericAmount,
          paymentNote: paymentNote.trim() || undefined,
          unblockAccess,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement de la tranche.");
      }

      setSuccessMsg(data.message || "Tranche enregistrée avec succès !");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("[AddInstallmentModal error]", err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200/60 dark:border-teal-800/60 shadow-xs">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">
                Ajouter une tranche de paiement
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Paiement direct en mains propres / cash
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-400 animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold animate-in slide-in-from-top-1">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Student & Course Summary Card */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Apprenant :</span>
              <strong className="text-zinc-900 dark:text-white font-bold">{studentName}</strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Formation :</span>
              <strong className="text-zinc-900 dark:text-white font-bold truncate max-w-[240px]" title={courseTitle}>
                {courseTitle}
              </strong>
            </div>

            <div className="h-px bg-zinc-200 dark:bg-zinc-700" />

            {/* Progress Bar of Payments */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                  Versé : <strong className="text-emerald-600 dark:text-emerald-400">${totalPaid}</strong> / ${coursePrice} USD
                </span>
                <span className="font-extrabold text-zinc-700 dark:text-zinc-300">
                  Reste : <strong className="text-amber-600 dark:text-amber-400">${remainingAmount} USD</strong>
                </span>
              </div>

              <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${currentPercent}%` }}
                />
                {numericAmount > 0 && (
                  <div
                    className="h-full bg-teal-400 animate-pulse transition-all duration-300"
                    style={{ width: `${Math.min(100 - currentPercent, Math.round((numericAmount / coursePrice) * 100))}%` }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Montant de la tranche reçue ($ USD) *
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">
                $
              </div>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 50"
                className="w-full pl-8 pr-16 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 text-base font-bold focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                USD
              </div>
            </div>

            {/* Quick Presets */}
            {remainingAmount > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {remainingAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(remainingAmount))}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60 hover:bg-teal-100 transition-colors cursor-pointer"
                  >
                    Solde total restant (${remainingAmount}$)
                  </button>
                )}
                {[20, 30, 50, 100]
                  .filter((p) => p < remainingAmount)
                  .map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(String(preset))}
                      className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                    >
                      +${preset}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Simulation Outcome */}
          <div className="p-3 bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/50 rounded-2xl text-xs space-y-1">
            <div className="flex items-center justify-between font-bold text-zinc-800 dark:text-zinc-200">
              <span>Après validation de cette tranche :</span>
              <span className="text-teal-700 dark:text-teal-400">{newPercent}% réglé</span>
            </div>
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 text-[11px]">
              <span>Nouveau total réglé : <strong>${simulatedNewTotal.toFixed(2)} USD</strong></span>
              <span>
                Nouveau reste dû :{" "}
                <strong className={isSimulatedFull ? "text-emerald-600" : "text-amber-600"}>
                  ${simulatedNewRemaining.toFixed(2)} USD {isSimulatedFull && "(Soldé ✓)"}
                </strong>
              </span>
            </div>
          </div>

          {/* Payment Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Note ou référence (Optionnel)
            </label>
            <input
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Ex: Tranche 2 reçue en espèces au bureau"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          {/* Auto-unblock option */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={unblockAccess}
              onChange={(e) => setUnblockAccess(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
            />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Débloquer automatiquement l&apos;accès au cours si suspendu
            </span>
          </label>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || numericAmount <= 0}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Enregistrer la tranche (${numericAmount}$)</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
