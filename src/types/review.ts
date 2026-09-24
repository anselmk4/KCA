// src/types/review.ts
import { z } from "zod";

export type ReviewStatus = "PUBLISHED" | "PENDING" | "FLAGGED" | "HIDDEN";

export interface ReviewerProfile {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  is_certified?: boolean;
}

export interface CourseReview {
  id: string;
  course_id: string;
  user_id: string;
  rating: number; // 1 to 5
  comment: string | null;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
  user?: ReviewerProfile;
}

export interface ReviewDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: ReviewDistribution;
  percentages: ReviewDistribution;
}

export interface UserReviewEligibility {
  canReview: boolean;
  isEnrolled: boolean;
  progressPercent: number;
  hasCertificate: boolean;
  existingReview: CourseReview | null;
  reason?: string;
}

// ─── Zod Schemas ──────────────────────────────────────────

export const createReviewSchema = z.object({
  courseId: z
    .string()
    .min(1, "L'identifiant du cours est requis."),
  rating: z
    .number()
    .int("La note doit être un entier.")
    .min(1, "La note minimale est de 1 étoile.")
    .max(5, "La note maximale est de 5 étoiles."),
  comment: z
    .string()
    .trim()
    .max(1000, "Le commentaire ne doit pas dépasser 1000 caractères.")
    .refine(
      (val) => val.length === 0 || val.length >= 10,
      "Le commentaire doit contenir au moins 10 caractères si vous choisissez d'en rédiger un."
    )
    .optional()
    .nullable(),
});

export const updateReviewSchema = z.object({
  reviewId: z
    .string()
    .min(1, "L'identifiant de l'avis est requis."),
  rating: z
    .number()
    .int("La note doit être un entier.")
    .min(1, "La note minimale est de 1 étoile.")
    .max(5, "La note maximale est de 5 étoiles."),
  comment: z
    .string()
    .trim()
    .max(1000, "Le commentaire ne doit pas dépasser 1000 caractères.")
    .refine(
      (val) => val.length === 0 || val.length >= 10,
      "Le commentaire doit contenir au moins 10 caractères si vous choisissez d'en rédiger un."
    )
    .optional()
    .nullable(),
});

export const deleteReviewSchema = z.object({
  reviewId: z
    .string()
    .min(1, "L'identifiant de l'avis est requis."),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type DeleteReviewInput = z.infer<typeof deleteReviewSchema>;

export interface ReviewActionResult {
  success: boolean;
  message?: string;
  error?: string;
  review?: CourseReview;
}
