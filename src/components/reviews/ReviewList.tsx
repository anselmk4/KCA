// src/components/reviews/ReviewList.tsx
"use client";

import React from "react";
import Image from "next/image";
import { RatingStars } from "./RatingStars";
import { CourseReview } from "@/types/review";
import {
  Award,
  CheckCircle,
  Edit2,
  Trash2,
  MessageSquare,
  Sparkles,
  ChevronDown,
} from "lucide-react";

interface ReviewListProps {
  reviews: CourseReview[];
  currentUserId?: string | null;
  onEditReview?: (review: CourseReview) => void;
  onDeleteReview?: (reviewId: string) => void;
  selectedStarFilter?: number;
  onSelectStarFilter?: (star?: number) => void;
  totalCount: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

function formatRelativeDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffHours === 0) {
        if (diffMin <= 1) return "À l'instant";
        return `Il y a ${diffMin} minutes`;
      }
      return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
    }
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
    }

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Récemment";
  }
}

function getInitials(name: string): string {
  if (!name) return "A";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  currentUserId,
  onEditReview,
  onDeleteReview,
  selectedStarFilter,
  onSelectStarFilter,
  totalCount,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}) => {
  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => onSelectStarFilter?.(undefined)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
            selectedStarFilter === undefined
              ? "bg-teal-600 text-white shadow-xs"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          }`}
        >
          Tous ({totalCount})
        </button>

        {[5, 4, 3, 2, 1].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onSelectStarFilter?.(selectedStarFilter === star ? undefined : star)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
              selectedStarFilter === star
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            <span>{star}</span>
            <span className={selectedStarFilter === star ? "text-white" : "text-amber-400"}>★</span>
          </button>
        ))}
      </div>

      {/* Reviews Cards */}
      {reviews.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto" />
          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            {selectedStarFilter
              ? `Aucun avis à ${selectedStarFilter} étoiles pour cette formation.`
              : "Aucun avis publié pour le moment."}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Les apprenants inscrits ayant atteint au moins 80% de progression peuvent partager leur retour d'expérience.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isAuthor = currentUserId && review.user_id === currentUserId;
            const reviewerName = review.user?.full_name || "Apprenant";
            const isCertified = review.user?.is_certified;
            const avatarUrl = review.user?.avatar_url;

            return (
              <div
                key={review.id}
                className={`bg-white dark:bg-zinc-900 border rounded-3xl p-6 transition-all hover:shadow-xs ${
                  isAuthor
                    ? "border-teal-300 dark:border-teal-800/80 bg-teal-50/20 dark:bg-teal-950/10"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Reviewer identity & stars */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Avatar */}
                    {avatarUrl ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700 relative">
                        <Image
                          src={avatarUrl}
                          alt={reviewerName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
                        {getInitials(reviewerName)}
                      </div>
                    )}

                    {/* Name, badges, stars */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                          {reviewerName}
                        </h4>
                        {isAuthor && (
                          <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[10px] font-black rounded-full uppercase">
                            Moi
                          </span>
                        )}
                        {isCertified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-250 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-extrabold rounded-full">
                            <Award className="w-3 h-3" />
                            Certifié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-semibold rounded-full">
                            <CheckCircle className="w-2.5 h-2.5 text-teal-500" />
                            Inscrit
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <RatingStars rating={review.rating} size="sm" />
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">·</span>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          {formatRelativeDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Author actions (Edit / Delete) */}
                  {isAuthor && (
                    <div className="flex items-center gap-1 shrink-0">
                      {onEditReview && (
                        <button
                          type="button"
                          onClick={() => onEditReview(review)}
                          className="p-1.5 text-zinc-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Modifier mon avis"
                          aria-label="Modifier mon avis"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {onDeleteReview && (
                        <button
                          type="button"
                          onClick={() => onDeleteReview(review.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer mon avis"
                          aria-label="Supprimer mon avis"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Comment body */}
                {review.comment && (
                  <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                    {review.comment}
                  </p>
                )}
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && onLoadMore && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>{isLoadingMore ? "Chargement des avis..." : "Afficher plus d'avis"}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
