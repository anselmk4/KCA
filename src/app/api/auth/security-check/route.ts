import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();
const usedNonces = new Map<string, number>();

const CHALLENGE_SECRET =
  process.env.CAPTCHA_SECRET_KEY ||
  process.env.NEXTAUTH_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "ansella_captcha_hmac_secret_2026";

const MAX_CHALLENGE_AGE_MS = 10 * 60 * 1000; // 10 minutes

function getClientIp(req: NextRequest): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "client";
}

function signChallenge(targetX: number, issuedAt: number, nonce: string): string {
  return crypto
    .createHmac("sha256", CHALLENGE_SECRET)
    .update(`${targetX}:${issuedAt}:${nonce}`)
    .digest("hex");
}

/**
 * GET /api/auth/security-check
 * Issues a server-signed puzzle challenge (targetX, issuedAt, nonce, signature)
 */
export async function GET() {
  const targetX = Math.floor(Math.random() * 50) + 30; // 30 to 80
  const issuedAt = Date.now();
  const nonce = crypto.randomBytes(12).toString("hex");
  const sig = signChallenge(targetX, issuedAt, nonce);

  const challenge = Buffer.from(
    JSON.stringify({ targetX, issuedAt, nonce, sig })
  ).toString("base64");

  return NextResponse.json({ targetX, challenge }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const now = Date.now();

    // 1. Rate Limiting (20 requests per minute per IP)
    const windowMs = 60 * 1000;
    const limit = 20;

    if (rateLimitStore.size > 500) {
      for (const [key, val] of rateLimitStore.entries()) {
        if (now > val.resetTime) rateLimitStore.delete(key);
      }
    }
    if (usedNonces.size > 1000) {
      for (const [nonce, exp] of usedNonces.entries()) {
        if (now > exp) usedNonces.delete(nonce);
      }
    }

    const record = rateLimitStore.get(ip);
    if (!record || now > record.resetTime) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      record.count++;
      if (record.count > limit) {
        return NextResponse.json(
          { error: "Trop de tentatives. Veuillez patienter 1 minute avant de réessayer." },
          { status: 429 }
        );
      }
    }

    // 2. Parse and Verify CAPTCHA Token
    const body = await req.json().catch(() => ({}));
    const { token, turnstileToken } = body;

    // Optional Cloudflare Turnstile verification if TURNSTILE_SECRET_KEY is configured
    if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const formData = new URLSearchParams();
      formData.append("secret", process.env.TURNSTILE_SECRET_KEY);
      formData.append("response", String(turnstileToken));
      formData.append("remoteip", ip);

      const cfRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: formData,
      });
      const cfData = await cfRes.json();
      if (!cfData.success) {
        return NextResponse.json(
          { error: "Échec de la vérification Cloudflare Turnstile." },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Veuillez valider le test de sécurité (CAPTCHA) en glissant le puzzle." },
        { status: 400 }
      );
    }

    try {
      const decodedStr = Buffer.from(token, "base64").toString("utf-8");
      const payload = JSON.parse(decodedStr);

      if (!payload || payload.v !== "ansella_sec_pass" || typeof payload.p !== "number") {
        throw new Error("Invalid payload structure");
      }

      // Verify signed server challenge if present
      if (payload.c && typeof payload.c === "string") {
        const challengeData = JSON.parse(Buffer.from(payload.c, "base64").toString("utf-8"));
        const { targetX, issuedAt, nonce, sig } = challengeData;

        if (
          typeof targetX !== "number" ||
          typeof issuedAt !== "number" ||
          typeof nonce !== "string" ||
          typeof sig !== "string"
        ) {
          throw new Error("Malformed challenge");
        }

        if (usedNonces.has(nonce)) {
          return NextResponse.json(
            { error: "Ce test de sécurité a déjà été utilisé. Veuillez recharger le puzzle." },
            { status: 400 }
          );
        }

        const expectedSig = signChallenge(targetX, issuedAt, nonce);
        const sigBuf = Buffer.from(sig, "hex");
        const expectedBuf = Buffer.from(expectedSig, "hex");
        if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
          throw new Error("Invalid challenge HMAC signature");
        }

        if (now - issuedAt > MAX_CHALLENGE_AGE_MS || issuedAt - now > 60_000) {
          return NextResponse.json(
            { error: "Le test de sécurité a expiré. Veuillez recharger le puzzle." },
            { status: 400 }
          );
        }

        const sliderVal = typeof payload.s === "number" ? payload.s : payload.p;
        if (Math.abs(sliderVal - targetX) > 4.5) {
          throw new Error("Puzzle position mismatch");
        }

        // Mark nonce as consumed to prevent token replay
        usedNonces.set(nonce, now + MAX_CHALLENGE_AGE_MS);
      } else {
        // Fallback timestamp window check (strictly 10 minutes max)
        if (typeof payload.t !== "number") {
          throw new Error("Missing token timestamp");
        }
        const ageMs = now - payload.t;
        if (ageMs < -60_000 || ageMs > MAX_CHALLENGE_AGE_MS) {
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

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[Security Check] Server error:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de la vérification de sécurité." },
      { status: 500 }
    );
  }
}
