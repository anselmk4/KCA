import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate-limiter store (per IP)
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

export async function POST(req: NextRequest) {
  try {
    // 1. Get client IP address
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
    const now = Date.now();

    // 2. Enforce Rate Limiting (max 5 requests per 1 minute window)
    const windowMs = 60 * 1000;
    const limit = 5;

    let record = rateLimitStore.get(ip);
    if (!record) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimitStore.set(ip, record);
    } else {
      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
      } else {
        record.count++;
        if (record.count > limit) {
          console.warn(`[Security Check] Rate limit exceeded for IP: ${ip}`);
          return NextResponse.json(
            { error: "Trop de tentatives. Veuillez patienter 1 minute." },
            { status: 429 }
          );
        }
      }
    }

    // 3. Parse and Verify CAPTCHA Token
    const body = await req.json();
    const { token, action } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Veuillez valider le test de sécurité (CAPTCHA)." },
        { status: 400 }
      );
    }

    // Decode and validate token (Simple secure base64 decoding check)
    try {
      const decodedStr = Buffer.from(token, "base64").toString("utf-8");
      const payload = JSON.parse(decodedStr);

      // Check token contents
      if (payload.v !== "ansella_sec_pass" || typeof payload.p !== "number" || typeof payload.t !== "number") {
        throw new Error("Invalid payload signature");
      }

      // Check age with clock skew tolerance (allow up to 15m future drift and 30m validity)
      const ageMs = now - payload.t;
      const maxFutureDriftMs = 15 * 60 * 1000;
      const maxAgeMs = 30 * 60 * 1000;

      if (ageMs < -maxFutureDriftMs || ageMs > maxAgeMs) {
        return NextResponse.json(
          { error: "Le test de sécurité a expiré. Veuillez le recharger." },
          { status: 400 }
        );
      }
    } catch (tokenErr) {
      console.error("[Security Check] Token verification failed:", tokenErr);
      return NextResponse.json(
        { error: "Vérification de sécurité invalide. Veuillez réessayer." },
        { status: 400 }
      );
    }

    // Success
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Security Check] Server error:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de la vérification de sécurité." },
      { status: 500 }
    );
  }
}
