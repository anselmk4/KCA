import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

    const { isAuthorizedSuperAdmin } = await import("@/lib/rbac");
    const isOwner = isAuthorizedSuperAdmin(user.email);

    // If user is authorized Super Admin, ensure they have the role in DB and return SUPER_ADMIN
    if (isOwner) {
      try {
        const { data: superAdminRole } = await supabaseAdmin
          .from("roles")
          .select("id")
          .eq("name", "SUPER_ADMIN")
          .single();

        if (superAdminRole) {
          await supabaseAdmin
            .from("user_roles")
            .upsert(
              { user_id: user.id, role_id: superAdminRole.id },
              { onConflict: "user_id,role_id", ignoreDuplicates: true }
            );
        }
      } catch (err) {
        console.warn("[/api/admin/me] Error ensuring super admin role:", err);
      }

      const { data: perms } = await (supabaseAdmin
        .from("admin_permissions" as any)
        .select("granted_permissions, revoked_permissions")
        .eq("user_id", user.id)
        .maybeSingle() as any);

      return NextResponse.json({
        role: "SUPER_ADMIN",
        userId: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Admin",
        grantedPermissions: perms?.granted_permissions || [],
        revokedPermissions: perms?.revoked_permissions || [],
      });
    }

    if (rolesErr || !data || data.length === 0) {
      return NextResponse.json({ role: "STUDENT", userId: user.id });
    }

    const names: string[] = data.map((ur: any) => ur.roles?.name).filter(Boolean);
    const priority = ["SUPER_ADMIN", "ADMIN", "FINANCE_ADMIN", "MODERATOR", "ACADEMIC_ADMIN", "SUPPORT_AGENT", "INSTRUCTOR", "TEACHING_ASSISTANT", "STUDENT"];
    let resolvedRole = "STUDENT";
    for (const p of priority) {
      if (names.includes(p)) { resolvedRole = p; break; }
    }

    // Security Gate: strictly restrict SUPER_ADMIN to whitelisted owner emails
    if (resolvedRole === "SUPER_ADMIN" && !isAuthorizedSuperAdmin(user.email)) {
      console.warn(`[SECURITY] Unauthorized SUPER_ADMIN access blocked for ${user.email}. Demoting.`);
      const { data: superAdminRole } = await supabaseAdmin.from("roles").select("id").eq("name", "SUPER_ADMIN").single();
      if (superAdminRole) {
        await supabaseAdmin.from("user_roles").delete().eq("user_id", user.id).eq("role_id", superAdminRole.id);
      }
      
      if (names.includes("INSTRUCTOR")) {
        resolvedRole = "INSTRUCTOR";
      } else if (names.includes("ADMIN")) {
        resolvedRole = "ADMIN";
      } else {
        resolvedRole = "STUDENT";
      }
    }

    // Also fetch admin_permissions overrides
    const { data: perms } = await (supabaseAdmin
      .from("admin_permissions" as any)
      .select("granted_permissions, revoked_permissions")
      .eq("user_id", user.id)
      .maybeSingle() as any);

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
