import { NextRequest, NextResponse } from "next/server";
import { pushTelemetryEvent, AnalyticsEventType } from "@/lib/analytics-store";

export const dynamic = "force-dynamic";

const ALLOWED_EVENT_TYPES: Set<AnalyticsEventType> = new Set([
  "pageview",
  "page_exit",
  "cta_click",
  "onboarding_step",
  "checkout_view",
  "payment_attempt",
  "payment_success",
  "payment_error",
]);

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkTrackRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    if (rateLimitMap.size > 5000) rateLimitMap.clear();
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= 120; // Max 120 events/min per IP
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!checkTrackRateLimit(ip)) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const rawType = String(body.type || "pageview") as AnalyticsEventType;
    if (!ALLOWED_EVENT_TYPES.has(rawType)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const path = String(body.path || "/").slice(0, 200);
    const visitorId = String(body.visitorId || "anon").slice(0, 64);
    const sessionId = String(body.sessionId || "sess").slice(0, 64);
    const deviceRaw = String(body.device || "Desktop");
    const device: "Mobile" | "Desktop" | "Tablet" =
      deviceRaw === "Mobile" || deviceRaw === "Tablet" ? deviceRaw : "Desktop";

    const durationSec =
      typeof body.durationSec === "number" && Number.isFinite(body.durationSec)
        ? Math.min(Math.max(0, Math.round(body.durationSec)), 7200)
        : undefined;

    pushTelemetryEvent({
      visitorId,
      sessionId,
      userId: body.userId ? String(body.userId).slice(0, 64) : null,
      type: rawType,
      path,
      referrer: body.referrer ? String(body.referrer).slice(0, 200) : undefined,
      device,
      country: body.country ? String(body.country).slice(0, 10) : undefined,
      durationSec,
      step: body.step ? String(body.step).slice(0, 80) : undefined,
      paymentMethod: body.paymentMethod ? String(body.paymentMethod).slice(0, 40) : undefined,
      errorReason: body.errorReason ? String(body.errorReason).slice(0, 160) : undefined,
      courseId: body.courseId ? String(body.courseId).slice(0, 80) : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

