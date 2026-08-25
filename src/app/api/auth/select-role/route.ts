import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { role } = await req.json();
    const sanitizedRole = (role || "").toUpperCase();

    if (sanitizedRole !== "STUDENT" && sanitizedRole !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Rôle invalide. Choisissez STUDENT ou INSTRUCTOR." }, { status: 400 });
    }

    // 1. Get role ID from database
    const { data: dbRole, error: roleErr } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("name", sanitizedRole as any)
      .single();

    if (roleErr || !dbRole) {
      return NextResponse.json({ error: "Rôle introuvable en base de données." }, { status: 404 });
    }

    // 2. Clean up any conflicting non-admin roles
    const { data: allRoles } = await supabaseAdmin.from("roles").select("id, name");
    const roleIdMap: Record<string, string> = {};
    (allRoles || []).forEach((r: any) => {
      roleIdMap[r.name] = r.id;
    });

    if (sanitizedRole === "INSTRUCTOR" && roleIdMap["STUDENT"]) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", user.id).eq("role_id", roleIdMap["STUDENT"]);
    } else if (sanitizedRole === "STUDENT" && roleIdMap["INSTRUCTOR"]) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", user.id).eq("role_id", roleIdMap["INSTRUCTOR"]);
    }

    // 3. Assign the chosen role
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: user.id, role_id: dbRole.id },
      { onConflict: "user_id,role_id", ignoreDuplicates: true }
    );

    // 4. Update profile
    const { data: currentProfile } = await supabaseAdmin
      .from("profiles")
      .select("academy_name, plan, status")
      .eq("id", user.id)
      .maybeSingle();

    const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur";

    if (!currentProfile) {
      await supabaseAdmin.from("profiles").insert({
        id: user.id,
        email: user.email!,
        full_name: fullName,
        status: "ACTIVE",
        plan: "FREE",
        academy_name: sanitizedRole === "INSTRUCTOR" ? `Académie de ${fullName}` : null,
      });
    } else {
      const updateData: Record<string, any> = { status: "ACTIVE" };
      if (sanitizedRole === "INSTRUCTOR" && !currentProfile.academy_name) {
        updateData.academy_name = `Académie de ${fullName}`;
        updateData.plan = "FREE";
      }
      await (supabaseAdmin.from("profiles" as any) as any).update(updateData).eq("id", user.id);
    }

    const redirectTo = sanitizedRole === "INSTRUCTOR" ? "/instructor" : "/dashboard";

    return NextResponse.json({
      success: true,
      role: sanitizedRole,
      redirectTo,
    });
  } catch (error: any) {
    console.error("[POST /api/auth/select-role] Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la sélection du rôle." },
      { status: 500 }
    );
  }
}
