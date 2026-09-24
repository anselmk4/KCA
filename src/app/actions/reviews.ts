// src/app/actions/reviews.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  createReviewSchema,
  updateReviewSchema,
  deleteReviewSchema,
  CourseReview,
  ReviewStats,
  UserReviewEligibility,
  ReviewActionResult,
} from "@/types/review";

/**
 * Recalculate and update rating_avg & reviews_count directly in public.courses table.
 */
async function syncCourseRatingCache(courseId: string) {
  try {
    const admin = getSupabaseAdmin();
    const { data: reviews, error } = await admin
      .from("course_reviews")
      .select("rating")
      .eq("course_id", courseId)
      .eq("status", "PUBLISHED");

    if (error || !reviews) return;

    const count = reviews.length;
    const avg =
      count > 0
        ? Math.round((reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / count) * 10) / 10
        : 0;

    await admin
      .from("courses")
      .update({
        rating_avg: avg,
        reviews_count: count,
      } as any)
      .eq("id", courseId);
  } catch (err) {
    console.warn("[syncCourseRatingCache] Cache update warning:", err);
  }
}

/**
 * Fetch reviews for a specific course with pagination & star filter
 */
export async function getCourseReviews(
  courseId: string,
  page: number = 1,
  limit: number = 8,
  starFilter?: number
): Promise<{
  reviews: CourseReview[];
  totalCount: number;
  page: number;
  totalPages: number;
}> {
  try {
    const admin = getSupabaseAdmin();

    let query = admin
      .from("course_reviews")
      .select(
        `
        id,
        course_id,
        user_id,
        rating,
        comment,
        status,
        created_at,
        updated_at
      `,
        { count: "exact" }
      )
      .eq("course_id", courseId)
      .eq("status", "PUBLISHED");

    if (starFilter && starFilter >= 1 && starFilter <= 5) {
      query = query.eq("rating", starFilter);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: reviewsData, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      // Table may not yet be migrated in Supabase SQL editor
      console.warn("[getCourseReviews] Notice: course_reviews query:", error.message);
      return { reviews: [], totalCount: 0, page, totalPages: 0 };
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    if (!reviewsData || reviewsData.length === 0) {
      return { reviews: [], totalCount: 0, page, totalPages: 0 };
    }

    // Enhance reviews with reviewer profiles and certification status
    const userIds = Array.from(new Set(reviewsData.map((r) => r.user_id)));

    // 1. Fetch profiles
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // 2. Fetch certificates for this course
    const { data: certs } = await admin
      .from("certificates")
      .select("student_id")
      .eq("course_id", courseId)
      .in("student_id", userIds);

    const certifiedUsers = new Set((certs || []).map((c) => c.student_id));

    const reviews: CourseReview[] = reviewsData.map((r: any) => {
      const prof = profileMap.get(r.user_id);
      return {
        id: r.id,
        course_id: r.course_id,
        user_id: r.user_id,
        rating: r.rating,
        comment: r.comment,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
        user: {
          id: r.user_id,
          full_name: prof?.full_name || "Apprenant",
          avatar_url: prof?.avatar_url || null,
          is_certified: certifiedUsers.has(r.user_id),
        },
      };
    });

    return { reviews, totalCount, page, totalPages };
  } catch (err) {
    console.error("[getCourseReviews] Unexpected error:", err);
    return { reviews: [], totalCount: 0, page, totalPages: 0 };
  }
}

/**
 * Fetch rating summary statistics (average, total, distribution, percentages)
 */
export async function getCourseReviewStats(courseId: string): Promise<ReviewStats> {
  const defaultStats: ReviewStats = {
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("course_reviews")
      .select("rating")
      .eq("course_id", courseId)
      .eq("status", "PUBLISHED");

    if (error || !data || data.length === 0) {
      return defaultStats;
    }

    const total = data.length;
    let sum = 0;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    data.forEach((r) => {
      const rating = r.rating as 1 | 2 | 3 | 4 | 5;
      if (distribution[rating] !== undefined) {
        distribution[rating] += 1;
        sum += rating;
      }
    });

    const averageRating = Math.round((sum / total) * 10) / 10;
    const percentages = {
      5: total > 0 ? Math.round((distribution[5] / total) * 100) : 0,
      4: total > 0 ? Math.round((distribution[4] / total) * 100) : 0,
      3: total > 0 ? Math.round((distribution[3] / total) * 100) : 0,
      2: total > 0 ? Math.round((distribution[2] / total) * 100) : 0,
      1: total > 0 ? Math.round((distribution[1] / total) * 100) : 0,
    };

    return {
      averageRating,
      totalReviews: total,
      distribution,
      percentages,
    };
  } catch (err) {
    console.error("[getCourseReviewStats] Unexpected error:", err);
    return defaultStats;
  }
}

/**
 * Check if the currently authenticated learner is eligible to review a course
 * (must be logged in, enrolled, and have >= 80% progress or certificate)
 */
export async function checkUserReviewEligibility(courseId: string): Promise<UserReviewEligibility> {
  const notEligible = (reason: string): UserReviewEligibility => ({
    canReview: false,
    isEnrolled: false,
    progressPercent: 0,
    hasCertificate: false,
    existingReview: null,
    reason,
  });

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return notEligible("Veuillez vous connecter pour laisser une évaluation.");
    }

    const admin = getSupabaseAdmin();

    // 1. Verify enrollment
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id, progress_percent, status")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (!enrollment) {
      return notEligible("Vous devez être inscrit à ce cours pour pouvoir l'évaluer.");
    }

    const progressPercent = enrollment.progress_percent || 0;

    // 2. Check certificate
    const { data: cert } = await admin
      .from("certificates")
      .select("id")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    const hasCertificate = !!cert;

    // 3. Check existing review
    const { data: existingReviewData } = await admin
      .from("course_reviews")
      .select("*")
      .eq("course_id", courseId)
      .eq("user_id", user.id)
      .maybeSingle();

    let existingReview: CourseReview | null = null;
    if (existingReviewData) {
      const { data: prof } = await admin
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      existingReview = {
        id: existingReviewData.id,
        course_id: existingReviewData.course_id,
        user_id: existingReviewData.user_id,
        rating: existingReviewData.rating,
        comment: existingReviewData.comment,
        status: existingReviewData.status as CourseReview["status"],
        created_at: existingReviewData.created_at,
        updated_at: existingReviewData.updated_at,
        user: {
          id: user.id,
          full_name: prof?.full_name || user.user_metadata?.full_name || "Moi",
          avatar_url: prof?.avatar_url || null,
          is_certified: hasCertificate,
        },
      };
    }

    // 4. Threshold check: must have >= 80% progress OR certificate
    const MINIMUM_PROGRESS = 80;
    if (progressPercent < MINIMUM_PROGRESS && !hasCertificate) {
      return {
        canReview: false,
        isEnrolled: true,
        progressPercent,
        hasCertificate,
        existingReview,
        reason: `Vous devez avoir complété au moins ${MINIMUM_PROGRESS}% de la formation pour publier votre avis (progression actuelle : ${Math.round(progressPercent)}%).`,
      };
    }

    return {
      canReview: true,
      isEnrolled: true,
      progressPercent,
      hasCertificate,
      existingReview,
    };
  } catch (err) {
    console.error("[checkUserReviewEligibility] Unexpected error:", err);
    return notEligible("Impossible de vérifier l'éligibilité pour le moment.");
  }
}

/**
 * Server Action: Submit a new course review
 */
export async function submitCourseReview(rawInput: unknown): Promise<ReviewActionResult> {
  try {
    const parsed = createReviewSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Données invalides.";
      return { success: false, error: firstIssue };
    }

    const { courseId, rating, comment } = parsed.data;

    // Check auth & eligibility
    const eligibility = await checkUserReviewEligibility(courseId);
    if (!eligibility.canReview) {
      return {
        success: false,
        error: eligibility.reason || "Vous n'êtes pas autorisé à évaluer cette formation.",
      };
    }

    if (eligibility.existingReview) {
      return {
        success: false,
        error: "Vous avez déjà publié un avis pour ce cours. Vous pouvez modifier votre avis existant.",
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Session expirée. Veuillez vous reconnecter." };
    }

    const admin = getSupabaseAdmin();
    const cleanComment = comment && comment.trim().length > 0 ? comment.trim() : null;

    const { data: newReview, error: insertError } = await admin
      .from("course_reviews")
      .insert({
        course_id: courseId,
        user_id: user.id,
        rating,
        comment: cleanComment,
        status: "PUBLISHED",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[submitCourseReview] Insert error:", insertError.message);
      return {
        success: false,
        error:
          insertError.code === "23505"
            ? "Un avis existe déjà pour ce cours."
            : "Erreur lors de l'enregistrement de l'avis. Assurez-vous d'avoir exécuté la migration SQL prisma/add-course-reviews.sql.",
      };
    }

    // Refresh course average rating in cache
    await syncCourseRatingCache(courseId);

    // Revalidate paths
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/dashboard/courses/${courseId}/learn`);
    revalidatePath(`/dashboard/discover/${courseId}`);

    return {
      success: true,
      message: "Merci ! Votre évaluation a été publiée avec succès.",
      review: newReview as CourseReview,
    };
  } catch (err: any) {
    console.error("[submitCourseReview] Fatal error:", err);
    return {
      success: false,
      error: err?.message || "Une erreur inattendue est survenue lors de la publication.",
    };
  }
}

/**
 * Server Action: Update an existing review
 */
export async function updateCourseReview(rawInput: unknown): Promise<ReviewActionResult> {
  try {
    const parsed = updateReviewSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Données invalides.";
      return { success: false, error: firstIssue };
    }

    const { reviewId, rating, comment } = parsed.data;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Session expirée. Veuillez vous reconnecter." };
    }

    const admin = getSupabaseAdmin();

    // Verify ownership
    const { data: existing, error: fetchErr } = await admin
      .from("course_reviews")
      .select("id, course_id, user_id")
      .eq("id", reviewId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return { success: false, error: "Avis introuvable." };
    }

    if (existing.user_id !== user.id) {
      return { success: false, error: "Vous n'êtes pas autorisé à modifier cet avis." };
    }

    const cleanComment = comment && comment.trim().length > 0 ? comment.trim() : null;

    const { data: updated, error: updateErr } = await admin
      .from("course_reviews")
      .update({
        rating,
        comment: cleanComment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .select()
      .single();

    if (updateErr) {
      return { success: false, error: "Erreur lors de la mise à jour de l'avis." };
    }

    await syncCourseRatingCache(existing.course_id);

    revalidatePath(`/courses/${existing.course_id}`);
    revalidatePath(`/dashboard/courses/${existing.course_id}/learn`);
    revalidatePath(`/dashboard/discover/${existing.course_id}`);

    return {
      success: true,
      message: "Votre avis a été mis à jour avec succès.",
      review: updated as CourseReview,
    };
  } catch (err: any) {
    console.error("[updateCourseReview] Fatal error:", err);
    return {
      success: false,
      error: err?.message || "Une erreur inattendue est survenue lors de la modification.",
    };
  }
}

/**
 * Server Action: Delete a review
 */
export async function deleteCourseReview(rawInput: unknown): Promise<ReviewActionResult> {
  try {
    const parsed = deleteReviewSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: "Identifiant d'avis invalide." };
    }

    const { reviewId } = parsed.data;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Session expirée. Veuillez vous reconnecter." };
    }

    const admin = getSupabaseAdmin();

    const { data: existing, error: fetchErr } = await admin
      .from("course_reviews")
      .select("id, course_id, user_id")
      .eq("id", reviewId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return { success: false, error: "Avis introuvable." };
    }

    if (existing.user_id !== user.id) {
      return { success: false, error: "Vous n'êtes pas autorisé à supprimer cet avis." };
    }

    const { error: delErr } = await admin
      .from("course_reviews")
      .delete()
      .eq("id", reviewId);

    if (delErr) {
      return { success: false, error: "Erreur lors de la suppression de l'avis." };
    }

    await syncCourseRatingCache(existing.course_id);

    revalidatePath(`/courses/${existing.course_id}`);
    revalidatePath(`/dashboard/courses/${existing.course_id}/learn`);
    revalidatePath(`/dashboard/discover/${existing.course_id}`);

    return {
      success: true,
      message: "Votre avis a été supprimé.",
    };
  } catch (err: any) {
    console.error("[deleteCourseReview] Fatal error:", err);
    return {
      success: false,
      error: err?.message || "Une erreur inattendue est survenue lors de la suppression.",
    };
  }
}
