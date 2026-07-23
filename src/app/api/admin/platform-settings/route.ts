import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Helper: get caller role from user_roles table ─────────────────────────
async function getCallerRole(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("roles!inner(name)")
    .eq("user_id", userId) as any;

  if (error || !data || data.length === 0) return null;
  const names: string[] = data.map((ur: any) => ur.roles?.name).filter(Boolean);
  const priority = ["SUPER_ADMIN", "ADMIN", "FINANCE_ADMIN", "MODERATOR", "ACADEMIC_ADMIN", "SUPPORT_AGENT"];
  for (const p of priority) {
    if (names.includes(p)) return p;
  }
  return names[0] || null;
}

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "ACADEMIC_ADMIN", "FINANCE_ADMIN", "SUPPORT_AGENT"];

// ─── GET – read all platform settings ────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const role = await getCallerRole(user.id);
    if (!role || !ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // All admins get public settings; private only for SUPER_ADMIN / FINANCE_ADMIN
    const isFinance = ["SUPER_ADMIN", "FINANCE_ADMIN"].includes(role);

    let query = supabaseAdmin.from("settings").select("*").order("group_name").order("key");
    if (!isFinance) {
      query = query.eq("is_public", true);
    }
    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ settings: data || [] });
  } catch (err: any) {
    console.error("[api/admin/platform-settings GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PUT – update one or many settings ────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const role = await getCallerRole(user.id);
    if (!role || !["SUPER_ADMIN", "ADMIN", "FINANCE_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Accès refusé – permissions insuffisantes" }, { status: 403 });
    }

    const body = await req.json();
    const { updates } = body as { updates: Array<{ key: string; value: unknown }> };
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "Paramètre 'updates' requis" }, { status: 400 });
    }

    const results: string[] = [];
    for (const { key, value } of updates) {
      // Finance-restricted keys
      const isFinanceKey = key.startsWith("platform.commission") ||
        key.startsWith("platform.min_payout") ||
        key.startsWith("platform.currency") ||
        key.startsWith("platform.refund") ||
        key.startsWith("platform.installments");

      if (isFinanceKey && !["SUPER_ADMIN", "FINANCE_ADMIN"].includes(role)) {
        results.push(`${key}: accès refusé`);
        continue;
      }

      const { error } = await supabaseAdmin
        .from("settings")
        .update({ value, updated_by: user.id, updated_at: new Date().toISOString() })
        .eq("key", key);

      if (error) {
        // Insert if not exists
        const { error: insertErr } = await supabaseAdmin.from("settings").insert({
          key, value,
          group_name: key.split(".")[0],
          is_public: true,
          updated_by: user.id,
        });
        results.push(insertErr ? `${key}: erreur – ${insertErr.message}` : `${key}: créé`);
      } else {
        results.push(`${key}: mis à jour`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("[api/admin/platform-settings PUT]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
