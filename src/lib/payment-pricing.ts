import { supabaseAdmin } from "@/lib/supabase/admin";

export interface CoursePricingResult {
  courseId: string;
  courseTitle: string;
  instructorId: string | null;
  originalPrice: number;
  fullCourseDiscount: number;
  discountedTotalCoursePrice: number;
  installmentCount: number;
  subtotal: number;
  discountAmount: number;
  baseAmount: number;
  validCouponId: string | null;
}

/**
 * Safely resolves the expected payment amount for a course from the database,
 * preventing client-side price tampering, arbitrary `payInstallment` division,
 * and expired/exhausted/mismatched coupon abuse.
 */
export async function resolveCoursePricing(params: {
  courseId: string;
  payInstallment?: unknown;
  couponId?: string | null;
}): Promise<{ data: CoursePricingResult | null; error?: string; status?: number }> {
  const { courseId, payInstallment, couponId } = params;

  const { data: course, error: courseError } = await supabaseAdmin
    .from("courses")
    .select("id, title, price, instructor_id, allow_installments, installments_count")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError || !course) {
    return { data: null, error: "Cours introuvable.", status: 404 };
  }

  const originalPrice = Math.max(0, Number(course.price) || 0);

  // 1. Strictly enforce server-side installment rules
  let installmentCount = 1;
  const maxConfiguredInstallments = Math.min(
    Math.max(Number((course as any).installments_count) || 3, 2),
    6
  );

  if (Boolean((course as any).allow_installments)) {
    if (payInstallment === 2) {
      installmentCount = Math.min(2, maxConfiguredInstallments);
    } else if (payInstallment === 3 || payInstallment === true) {
      installmentCount = maxConfiguredInstallments;
    } else if (typeof payInstallment === "number" && Number.isInteger(payInstallment) && payInstallment > 1) {
      installmentCount = Math.min(payInstallment, maxConfiguredInstallments);
    }
  }

  // 2. Strictly validate coupon constraints (active, not expired, under max_uses, applicable to course)
  let fullCourseDiscount = 0;
  let validCouponId: string | null = null;

  if (couponId && typeof couponId === "string") {
    const { data: coupon } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("id", couponId)
      .eq("is_active", true)
      .maybeSingle();

    if (coupon) {
      const now = new Date();
      const isNotExpired = !coupon.expires_at || new Date(coupon.expires_at) > now;
      const isUnderMaxUses =
        coupon.max_uses === null ||
        coupon.max_uses === undefined ||
        Number(coupon.current_uses || 0) < Number(coupon.max_uses);
      const isCourseMatch =
        !coupon.applicable_course_id || coupon.applicable_course_id === course.id;

      if (isNotExpired && isUnderMaxUses && isCourseMatch) {
        validCouponId = coupon.id;
        const discountVal = Number(coupon.discount_value) || 0;
        if (coupon.discount_type === "PERCENTAGE") {
          const clampedPct = Math.min(Math.max(discountVal, 0), 100);
          fullCourseDiscount = Math.round(originalPrice * (clampedPct / 100));
        } else if (coupon.discount_type === "FIXED") {
          fullCourseDiscount = Math.max(0, discountVal);
        }
      }
    }
  }

  const discountedTotalCoursePrice = Math.max(0, originalPrice - fullCourseDiscount);
  const subtotal = Math.round(originalPrice / installmentCount);
  const discountAmount = Math.round(fullCourseDiscount / installmentCount);

  let baseAmount = Math.max(0, Math.round(discountedTotalCoursePrice / installmentCount));
  // Prevent rounding down a non-free course to $0 via installments
  if (discountedTotalCoursePrice > 0 && baseAmount < 1) {
    baseAmount = 1;
  }

  return {
    data: {
      courseId: course.id,
      courseTitle: course.title,
      instructorId: (course as any).instructor_id || null,
      originalPrice,
      fullCourseDiscount,
      discountedTotalCoursePrice,
      installmentCount,
      subtotal,
      discountAmount,
      baseAmount,
      validCouponId,
    },
  };
}

