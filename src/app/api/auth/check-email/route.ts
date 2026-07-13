import { NextRequest, NextResponse } from "next/server";
import { createClient as createDirectClient } from "@supabase/supabase-js";

// Initialize a service role client to bypass RLS when checking email existence
const supabaseAdmin = createDirectClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query profiles table to check if this email is already registered
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
