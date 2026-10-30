import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const emailCheckRateLimit = new Map<string, RateLimitEntry>();

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-real-ip")?.trim() ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "client";
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 15;

    if (emailCheckRateLimit.size > 500) {
      for (const [k, v] of emailCheckRateLimit.entries()) {
        if (now > v.resetAt) emailCheckRateLimit.delete(k);
      }
    }

    const entry = emailCheckRateLimit.get(ip);
    if (!entry || now > entry.resetAt) {
      emailCheckRateLimit.set(ip, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count += 1;
      if (entry.count > maxRequests) {
        return NextResponse.json(
          { error: "Trop de vérifications. Veuillez patienter une minute." },
          { status: 429 }
        );
      }
    }

    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error("[check-email] Database error checking email:", error.message);
      return NextResponse.json({ exists: false, error: "Database error" });
    }

    return NextResponse.json({ exists: !!data });
  } catch (err: any) {
    console.error("[check-email] Server error:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de la vérification de l'email." },
      { status: 500 }
    );
  }
}
