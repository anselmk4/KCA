import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/me – returns the current user's admin role from user_roles table
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ role: null }, { status: 401 });

    const { data, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("roles!inner(name)")
      .eq("user_id", user.id) as any;

    if (rolesErr || !data || data.length === 0) {
      return NextResponse.json({ role: "STUDENT", userId: user.id });
    }

    const names: string[] = data.map((ur: any) => ur.roles?.name).filter(Boolean);
    const priority = ["SUPER_ADMIN", "ADMIN", "FINANCE_ADMIN", "MODERATOR", "ACADEMIC_ADMIN", "SUPPORT_AGENT", "INSTRUCTOR", "TEACHING_ASSISTANT", "STUDENT"];
    let resolvedRole = "STUDENT";
    for (const p of priority) {
      if (names.includes(p)) { resolvedRole = p; break; }
    }

    // Also fetch admin_permissions overrides
    const { data: perms } = await supabaseAdmin
      .from("admin_permissions")
      .select("granted_permissions, revoked_permissions")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({
      role: resolvedRole,
      userId: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Admin",
      grantedPermissions: perms?.granted_permissions || [],
      revokedPermissions: perms?.revoked_permissions || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
