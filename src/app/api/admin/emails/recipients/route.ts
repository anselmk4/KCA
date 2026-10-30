import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ADMIN_ROLES, isAuthorizedSuperAdmin, Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Verify Admin privileges before returning platform recipient statistics
    if (!isAuthorizedSuperAdmin(user.email)) {
      const { data: userRoles } = await supabaseAdmin
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", user.id);

      const roleNames: string[] =
        userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];
      const hasAdminAccess = roleNames.some((r) => ADMIN_ROLES.includes(r as Role));

      if (!hasAdminAccess) {
        return NextResponse.json(
          { error: "Accès réservé aux administrateurs." },
          { status: 403 }
        );
      }
    }

    const { data: roles } = await supabaseAdmin.from("roles").select("id, name");
    const roleMap: Record<string, string> = {};
    (roles || []).forEach((r: any) => {
      roleMap[r.name] = r.id;
    });

    const studentRoleId = roleMap["STUDENT"];
    const instructorRoleId = roleMap["INSTRUCTOR"];

    let studentCount = 0;
    let instructorCount = 0;
    let totalUsersCount = 0;

    if (studentRoleId) {
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role_id", studentRoleId);
      studentCount = count || 0;
    }

    if (instructorRoleId) {
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role_id", instructorRoleId);
      instructorCount = count || 0;
    }

    const { count: totalProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true });
    totalUsersCount = totalProfiles || 0;

    return NextResponse.json({
      success: true,
      counts: {
        students: studentCount,
        instructors: instructorCount,
        all: totalUsersCount,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/admin/emails/recipients] Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du calcul des destinataires" },
      { status: 500 }
    );
  }
}
