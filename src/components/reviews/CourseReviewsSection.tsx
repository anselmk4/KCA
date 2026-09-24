// src/components/reviews/CourseReviewsSection.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Star, MessageSquarePlus, Edit3, Loader2, Info, Sparkles } from "lucide-react";
import { CourseReviewsSummary } from "./CourseReviewsSummary";
import { ReviewList } from "./ReviewList";
import { ReviewFormModal } from "./ReviewFormModal";
import {
  CourseReview,
  ReviewStats,
  UserReviewEligibility,
} from "@/types/review";
import {
  getCourseReviews,
  getCourseReviewStats,
  checkUserReviewEligibility,
  deleteCourseReview,
} from "@/app/actions/reviews";

interface CourseReviewsSectionProps {
  courseId: string;
  courseTitle?: string;
  className?: string;
}

export const CourseReviewsSection: React.FC<CourseReviewsSectionProps> = ({
  courseId,
  courseTitle = "cette formation",
  className = "",
}) => {
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [starFilter, setStarFilter] = useState<number | undefined>(undefined);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [eligibility, setEligibility] = useState<UserReviewEligibility>({
    canReview: false,
    isEnrolled: false,
    progressPercent: 0,
    hasCertificate: false,
    existingReview: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Initial load
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [revData, statsData, eligData] = await Promise.all([
        getCourseReviews(courseId, 1, 8, starFilter),
        getCourseReviewStats(courseId),
        checkUserReviewEligibility(courseId),
      ]);

      setReviews(revData.reviews);
      setTotalCount(revData.totalCount);
      setPage(revData.page);
      setTotalPages(revData.totalPages);
      setStats(statsData);
      setEligibility(eligData);

      if (eligData.existingReview) {
        setCurrentUserId(eligData.existingReview.user_id);
      }
    } catch (err) {
      console.error("[CourseReviewsSection] Load error:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId, starFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load more reviews (pagination)
  const handleLoadMore = async () => {
    if (page >= totalPages || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getCourseReviews(courseId, nextPage, 8, starFilter);
      setReviews((prev) => [...prev, ...res.reviews]);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("[CourseReviewsSection] Load more error:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleReviewSaved = (savedReview?: CourseReview) => {
    // Refresh stats & eligibility & review list
    loadData();
  };

  const handleReviewDeleted = async (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    loadData();
  };

  const hasExisting = !!eligibility.existingReview;

  return (
    <section className={`space-y-8 ${className}`} id="evaluations">
      {/* Header with Title and Review CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
              Retours d'expérience
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-2 leading-tight">
            Avis & Évaluations des apprenants
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Notes et retours vérifiés des membres ayant suivi cette formation.
          </p>
        </div>

        {/* CTA Button / Status */}
        <div className="shrink-0">
          {eligibility.canReview ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-md shadow-teal-500/20 cursor-pointer"
            >
              {hasExisting ? (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span>Modifier mon évaluation</span>
                </>
              ) : (
                <>
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>Donner mon avis</span>
                </>
              )}
            </button>
          ) : eligibility.isEnrolled ? (
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl text-xs text-zinc-600 dark:text-zinc-300 max-w-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                Progression : <strong>{Math.round(eligibility.progressPercent)}%</strong> (Avis débloqué à 80%)
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-zinc-400 font-semibold">Chargement des avis...</p>
        </div>
      ) : (
        <>
          {/* Summary KPI Block */}
          <CourseReviewsSummary
            stats={stats}
            selectedStarFilter={starFilter}
            onSelectStarFilter={(star) => setStarFilter(star)}
          />

          {/* List of Reviews */}
          <ReviewList
            reviews={reviews}
            currentUserId={currentUserId}
            onEditReview={() => setIsModalOpen(true)}
            onDeleteReview={handleReviewDeleted}
            selectedStarFilter={starFilter}
            onSelectStarFilter={(star) => setStarFilter(star)}
            totalCount={totalCount}
            hasMore={page < totalPages}
            onLoadMore={handleLoadMore}
            isLoadingMore={loadingMore}
          />
        </>
      )}

      {/* Review Form Modal */}
      <ReviewFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseId={courseId}
        courseTitle={courseTitle}
        eligibility={eligibility}
        onReviewSaved={handleReviewSaved}
        onReviewDeleted={handleReviewDeleted}
      />
    </section>
  );
};
