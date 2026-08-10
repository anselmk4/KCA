import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate-limiter store (per IP) with auto-cleanup
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

export async function POST(req: NextRequest) {
  try {
    // 1. Get client IP address
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : (req.headers.get("x-real-ip") || "client");
    const now = Date.now();

    // 2. Rate Limiting (generous limit: 60 requests per 1 minute window)
    const windowMs = 60 * 1000;
    const limit = 60;

    // Clean up expired entries periodically
    if (rateLimitStore.size > 500) {
      for (const [key, val] of rateLimitStore.entries()) {
        if (now > val.resetTime) {
          rateLimitStore.delete(key);
        }
      }
    }

    let record = rateLimitStore.get(ip);
    if (!record || now > record.resetTime) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      record.count++;
      if (record.count > limit) {
        console.warn(`[Security Check] Rate limit exceeded for IP: ${ip}`);
        return NextResponse.json(
          { error: "Trop de tentatives. Veuillez patienter 1 minute avant de réessayer." },
          { status: 429 }
        );
      }
    }

    // 3. Parse and Verify CAPTCHA Token
    const body = await req.json().catch(() => ({}));
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Veuillez valider le test de sécurité (CAPTCHA) en glissant le puzzle." },
        { status: 400 }
      );
    }

    // Decode and validate token
    try {
      const decodedStr = Buffer.from(token, "base64").toString("utf-8");
      const payload = JSON.parse(decodedStr);

      // Check token contents signature
      if (
        !payload ||
        payload.v !== "ansella_sec_pass" ||
        typeof payload.p !== "number"
      ) {
        throw new Error("Invalid payload signature");
      }

      // Check age with generous tolerance (allow up to 24h validity and generous clock drift)
      if (typeof payload.t === "number") {
        const ageMs = now - payload.t;
        // Allow up to 24h validity; allow generous future drift to accommodate client clock skew
        const maxFutureDriftMs = 24 * 60 * 60 * 1000; // 24 hours
        const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours

        if (ageMs < -maxFutureDriftMs || ageMs > maxAgeMs) {
          return NextResponse.json(
            { error: "Le test de sécurité a expiré. Veuillez recharger le puzzle." },
            { status: 400 }
          );
        }
      }
    } catch (tokenErr) {
      console.error("[Security Check] Token verification failed:", tokenErr);
      return NextResponse.json(
        { error: "Vérification de sécurité invalide. Veuillez refaire le test." },
        { status: 400 }
      );
    }

    // Success
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[Security Check] Server error:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de la vérification de sécurité." },
      { status: 500 }
    );
  }
}

