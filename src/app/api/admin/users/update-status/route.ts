import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié. Veuillez vous connecter." }, { status: 401 });
    }

    // Verify admin role
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("[update-status] Error reading user roles:", rolesError);
    }

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isAuthorized = roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r));

    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé. Droits administrateurs requis." }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, newStatus } = body;

    if (!targetUserId || !newStatus) {
      return NextResponse.json({ error: "targetUserId et newStatus sont requis." }, { status: 400 });
    }

    // 1. Update profile status in database using service role (bypasses RLS)
    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", targetUserId);

    if (updateErr) {
      console.error("[update-status] Profile status update error:", updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 2. If admin is activating user manually, also mark email as confirmed in Supabase Auth
    if (newStatus === "ACTIVE") {
      try {
        await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          email_confirm: true
        });
      } catch (authErr: any) {
        console.warn("[update-status] Could not confirm auth email:", authErr.message);
      }
    }

    return NextResponse.json({ success: true, targetUserId, newStatus });
  } catch (err: any) {
    console.error("[update-status] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}
