// src/components/reviews/ReviewFormModal.tsx
"use client";

import React, { useState, useTransition, useEffect } from "react";
import {
  X,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { RatingStars } from "./RatingStars";
import { CourseReview, UserReviewEligibility } from "@/types/review";
import {
  submitCourseReview,
  updateCourseReview,
  deleteCourseReview,
} from "@/app/actions/reviews";

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle?: string;
  eligibility: UserReviewEligibility;
  onReviewSaved: (review?: CourseReview) => void;
  onReviewDeleted?: (reviewId: string) => void;
}

export const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseTitle = "cette formation",
  eligibility,
  onReviewSaved,
  onReviewDeleted,
}) => {
  const existing = eligibility.existingReview;
  const isEditing = !!existing;

  const [rating, setRating] = useState<number>(existing?.rating || 5);
  const [comment, setComment] = useState<string>(existing?.comment || "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Reset form when modal opens or existing review changes
  useEffect(() => {
    if (isOpen) {
      setRating(existing?.rating || 5);
      setComment(existing?.comment || "");
      setErrorMessage(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, existing]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isPending && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, isDeleting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (rating < 1 || rating > 5) {
      setErrorMessage("Veuillez sélectionner une note entre 1 et 5 étoiles.");
      return;
    }

    const trimmed = comment.trim();
    if (trimmed.length > 0 && trimmed.length < 10) {
      setErrorMessage("Votre commentaire doit contenir au moins 10 caractères.");
      return;
    }

    if (trimmed.length > 1000) {
      setErrorMessage("Votre commentaire ne peut pas dépasser 1000 caractères.");
      return;
    }

    startTransition(async () => {
      try {
        if (isEditing && existing) {
          const res = await updateCourseReview({
            reviewId: existing.id,
            rating,
            comment: trimmed,
          });

          if (!res.success) {
            setErrorMessage(res.error || "Impossible de mettre à jour l'avis.");
            return;
          }

          onReviewSaved(res.review);
          onClose();
        } else {
          const res = await submitCourseReview({
            courseId,
            rating,
            comment: trimmed,
          });

          if (!res.success) {
            setErrorMessage(res.error || "Impossible d'enregistrer l'avis.");
            return;
          }

          onReviewSaved(res.review);
          onClose();
        }
      } catch (err: any) {
        setErrorMessage(err?.message || "Une erreur est survenue.");
      }
    });
  };

  const handleDelete = async () => {
    if (!existing) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const res = await deleteCourseReview({ reviewId: existing.id });
      if (!res.success) {
        setErrorMessage(res.error || "Impossible de supprimer l'avis.");
        setIsDeleting(false);
        return;
      }

      onReviewDeleted?.(existing.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Une erreur est survenue lors de la suppression.");
      setIsDeleting(false);
    }
  };

  const charCount = comment.trim().length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 id="review-modal-title" className="text-base font-extrabold text-zinc-900 dark:text-white leading-tight">
                {isEditing ? "Modifier mon évaluation" : "Évaluer cette formation"}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[260px] sm:max-w-xs">
                {courseTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending || isDeleting}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Eligibility Badge */}
          <div className="flex items-center gap-2 p-3 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/50 rounded-2xl text-xs text-teal-800 dark:text-teal-300">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              Avis vérifié : {eligibility.hasCertificate ? "Certificat obtenu" : `Progression à ${Math.round(eligibility.progressPercent)}%`}
            </span>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Rating Stars Input */}
          <div className="space-y-2 text-center py-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Votre note globale
            </label>
            <div className="flex justify-center">
              <RatingStars
                rating={rating}
                interactive={true}
                onRatingChange={(r) => setRating(r)}
                size="xl"
                showLabel={true}
              />
            </div>
          </div>

          {/* Comment Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
              <label htmlFor="review-comment">Votre commentaire (facultatif)</label>
              <span
                className={`text-[11px] tabular-nums font-semibold ${
                  charCount > 1000 ? "text-red-500" : "text-zinc-400"
                }`}
              >
                {charCount}/1000
              </span>
            </div>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Qu'avez-vous particulièrement apprécié ? Comment cette formation vous a-t-elle aidé à progresser ?"
              className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none leading-relaxed"
            />
            <p className="text-[11px] text-zinc-400">
              Les avis sont soumis à nos règles de modération et aident les futurs apprenants à choisir leur formation.
            </p>
          </div>

          {/* Delete confirmation section */}
          {showDeleteConfirm && isEditing && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-250 dark:border-amber-900/50 rounded-2xl space-y-3">
              <p className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                Êtes-vous sûr de vouloir supprimer définitivement votre évaluation ?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Confirmer la suppression
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {isEditing && !showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending || isDeleting}
                className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 font-semibold flex items-center gap-1.5 cursor-pointer p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer mon avis</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending || isDeleting}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={isPending || isDeleting}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-md shadow-teal-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isEditing ? "Mettre à jour" : "Publier l'évaluation"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
