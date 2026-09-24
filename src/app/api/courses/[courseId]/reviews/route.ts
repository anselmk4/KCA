// src/app/api/courses/[courseId]/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getCourseReviews,
  getCourseReviewStats,
  checkUserReviewEligibility,
  submitCourseReview,
} from "@/app/actions/reviews";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params;
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "8", 10);
    const starFilterParam = url.searchParams.get("star");
    const starFilter = starFilterParam ? parseInt(starFilterParam, 10) : undefined;

    const [reviewsData, stats, eligibility] = await Promise.all([
      getCourseReviews(courseId, page, limit, starFilter),
      getCourseReviewStats(courseId),
      checkUserReviewEligibility(courseId),
    ]);

    return NextResponse.json({
      ...reviewsData,
      stats,
      eligibility,
    });
  } catch (err: any) {
    console.error("[GET /api/courses/[courseId]/reviews] Error:", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params;
    const body = await req.json();

    const result = await submitCourseReview({
      courseId,
      rating: body.rating,
      comment: body.comment,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/courses/[courseId]/reviews] Error:", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
