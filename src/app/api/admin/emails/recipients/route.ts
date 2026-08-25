import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Fetch counts by role
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
