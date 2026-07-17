import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/affiliate — liste des affiliés + stats du formateur connecté
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer le profil du formateur (sélectionner '*' pour tolérer l'absence de colonnes d'affiliation si la migration est en attente)
    let { data: profile, error: profileErr } = await (supabaseAdmin
      .from("profiles")
      .select("*") as any)
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      console.warn("[/api/affiliate GET] Profile missing. Attempting auto-repair...");
      const email = user.email || `${user.id}@ansella.app`;
      const name = user.user_metadata?.full_name || email.split("@")[0];
      const { error: insertErr } = await (supabaseAdmin.from("profiles") as any).insert({
        id: user.id,
        email,
        full_name: name,
        status: "ACTIVE",
        plan: "FREE",
      });
      if (insertErr) {
        console.error("[/api/affiliate GET] Auto-repair failed:", insertErr.message);
        return NextResponse.json({ error: "Profil introuvable", details: profileErr?.message || insertErr.message }, { status: 404 });
      }

      // Réessayer de charger le profil
      const { data: newProfile, error: refetchErr } = await (supabaseAdmin
        .from("profiles")
        .select("*") as any)
        .eq("id", user.id)
        .single();

      if (refetchErr || !newProfile) {
        console.error("[/api/affiliate GET] Refetch failed:", refetchErr?.message);
        return NextResponse.json({ error: "Profil introuvable", details: refetchErr?.message }, { status: 404 });
      }
      profile = newProfile;
    }

    // Générer un code si absent
    let referralCode = (profile as any).referral_code as string | null;
    if (!referralCode) {
      referralCode = user.id.replace(/-/g, "").substring(0, 12).toUpperCase();
      try {
        await (supabaseAdmin.from("profiles") as any)
          .update({ referral_code: referralCode })
          .eq("id", user.id);
      } catch (updateErr: any) {
        console.warn("[/api/affiliate GET] Could not update referral_code:", updateErr?.message);
      }
    }

    // Récupérer la liste des affiliés
    const { data: affiliations, error: affErr } = await (supabaseAdmin
      .from("affiliations" as any)
      .select(`
        id,
        points_awarded,
        created_at,
        referred:referred_id (
          id,
          full_name,
          email,
          created_at
        )
      `) as any)
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (affErr) {
      console.warn("[/api/affiliate GET] affiliations query:", affErr.message);
    }

    const totalPoints = (profile as any).affiliate_points || 0;
    const affiliateList = ((affiliations as any[]) || []).map((a: any) => ({
      id: a.id,
      pointsAwarded: a.points_awarded,
      joinedAt: a.created_at,
      user: {
        id: a.referred?.id,
        name: a.referred?.full_name || "—",
        email: a.referred?.email || "—",
        role: a.referred?.role || "STUDENT",
      },
    }));

    const baseUrl = req.nextUrl.origin || process.env.NEXT_PUBLIC_SITE_URL || "https://ansella.app";
    const referralLink = `${baseUrl}/register?ref=${referralCode}`;

    return NextResponse.json({
      referralCode,
      referralLink,
      totalPoints,
      totalAffiliates: affiliateList.length,
      affiliates: affiliateList,
    });
  } catch (err: any) {
    console.error("[/api/affiliate GET] Unexpected:", err);
    return NextResponse.json({ error: err?.message || "Erreur interne" }, { status: 500 });
  }
}

// POST /api/affiliate — enregistrer un affilié (appelé après inscription)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { referredId, referralCode } = body;

    if (!referredId || !referralCode) {
      return NextResponse.json({ error: "referredId et referralCode requis" }, { status: 400 });
    }

    // Trouver le formateur propriétaire du code
    const { data: referrer, error: referrerErr } = await (supabase
      .from("profiles")
      .select("id, affiliate_points") as any)
      .eq("referral_code", (referralCode as string).toUpperCase())
      .single();

    if (referrerErr || !referrer) {
      return NextResponse.json({ error: "Code de parrainage invalide" }, { status: 404 });
    }

    const referrerId = (referrer as any).id as string;

    // Ne pas s'auto-affilier
    if (referrerId === referredId) {
      return NextResponse.json({ error: "Auto-parrainage non autorisé" }, { status: 400 });
    }

    // Vérifier que l'affilié n'est pas déjà enregistré
    const { data: existing } = await (supabase
      .from("affiliations" as any)
      .select("id") as any)
      .eq("referred_id", referredId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: "Déjà affilié" }, { status: 200 });
    }

    const POINTS_PER_AFFILIATE = 10;

    // Insérer l'affiliation
    const { error: insertErr } = await (supabase.from("affiliations" as any) as any).insert({
      referrer_id: referrerId,
      referred_id: referredId,
      points_awarded: POINTS_PER_AFFILIATE,
    });

    if (insertErr) {
      // If table doesn't exist yet in DB (pre-migration), log and return success gracefully
      console.warn("[/api/affiliate POST] insert:", insertErr.message);
      if (insertErr.message?.includes("does not exist")) {
        return NextResponse.json({ success: true, note: "Migration pending" });
      }
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    // Incrémenter les points du formateur
    const currentPoints = (referrer as any).affiliate_points || 0;
    const newPoints = currentPoints + POINTS_PER_AFFILIATE;
    await (supabase.from("profiles") as any)
      .update({ affiliate_points: newPoints })
      .eq("id", referrerId);

    return NextResponse.json({ success: true, pointsAwarded: POINTS_PER_AFFILIATE });
  } catch (err: any) {
    console.error("[/api/affiliate POST] Unexpected:", err);
    return NextResponse.json({ error: err?.message || "Erreur interne" }, { status: 500 });
  }
}
