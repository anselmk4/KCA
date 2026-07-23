import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { ADMIN_ROLES } from "@/lib/rbac";

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
  // Return highest-priority role
  const names: string[] = data.map((ur: any) => ur.roles?.name).filter(Boolean);
  if (names.includes("SUPER_ADMIN")) return "SUPER_ADMIN";
  if (names.includes("ADMIN")) return "ADMIN";
  if (names.includes("FINANCE_ADMIN")) return "FINANCE_ADMIN";
  if (names.includes("MODERATOR")) return "MODERATOR";
  if (names.includes("ACADEMIC_ADMIN")) return "ACADEMIC_ADMIN";
  if (names.includes("SUPPORT_AGENT")) return "SUPPORT_AGENT";
  return names[0] || null;
}

// ─── GET – list all admin team members ────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const callerRole = await getCallerRole(user.id);
    if (callerRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: `Accès refusé – SUPER_ADMIN requis (rôle détecté: ${callerRole || "aucun"})` },
        { status: 403 }
      );
    }

    // Fetch all users from auth
    const { data: { users }, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
    if (usersErr) throw usersErr;

    // Fetch all user_roles with role names
    const { data: allUserRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, roles!inner(name)") as any;

    // Build user_id → role map
    const roleMap = new Map<string, string>();
    const ADMIN_ROLE_NAMES = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "ACADEMIC_ADMIN", "FINANCE_ADMIN", "SUPPORT_AGENT"];

    for (const ur of (allUserRoles || [])) {
      const name = ur.roles?.name;
      if (!ADMIN_ROLE_NAMES.includes(name)) continue;
      const existing = roleMap.get(ur.user_id);
      // Priority: SUPER_ADMIN > ADMIN > others
      if (!existing || ADMIN_ROLE_NAMES.indexOf(name) < ADMIN_ROLE_NAMES.indexOf(existing)) {
        roleMap.set(ur.user_id, name);
      }
    }

    // Filter users that have an admin role
    const adminUsers = users
      .filter(u => roleMap.has(u.id))
      .map(u => ({
        id: u.id,
        email: u.email || "",
        name: u.user_metadata?.full_name || u.email?.split("@")[0] || "Admin",
        role: roleMap.get(u.id) || "SUPPORT_AGENT",
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at || null,
        emailConfirmed: !!u.email_confirmed_at,
      }));

    // Fetch admin_permissions overrides if table exists
    let permsMap = new Map<string, any>();
    const { data: permsData } = await supabaseAdmin
      .from("admin_permissions")
      .select("user_id, granted_permissions, revoked_permissions, notes");
    if (permsData) {
      permsData.forEach((p: any) => permsMap.set(p.user_id, p));
    }

    const enriched = adminUsers.map(u => ({
      ...u,
      grantedPermissions: permsMap.get(u.id)?.granted_permissions || [],
      revokedPermissions: permsMap.get(u.id)?.revoked_permissions || [],
      notes: permsMap.get(u.id)?.notes || "",
    }));

    return NextResponse.json({ members: enriched });
  } catch (err: any) {
    console.error("[api/admin/team GET]", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}

// ─── POST – assign / update role + permissions ─────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const callerRole = await getCallerRole(user.id);
    if (callerRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: `Accès refusé – SUPER_ADMIN requis (rôle: ${callerRole || "aucun"})` },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetUserId, role, grantedPermissions = [], revokedPermissions = [], notes = "", action } = body;
    if (!targetUserId) return NextResponse.json({ error: "targetUserId requis" }, { status: 400 });

    // Cannot demote yourself
    if (targetUserId === user.id && action === "revoke") {
      return NextResponse.json({ error: "Vous ne pouvez pas révoquer votre propre accès" }, { status: 400 });
    }

    // Resolve role_id from roles table
    const { data: roleRow } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("name", role || "SUPPORT_AGENT")
      .maybeSingle();

    const { data: studentRoleRow } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("name", "STUDENT")
      .maybeSingle();

    if (action === "revoke") {
      // Remove all admin roles for this user, set STUDENT
      await supabaseAdmin.from("user_roles").delete().eq("user_id", targetUserId);
      if (studentRoleRow?.id) {
        await supabaseAdmin.from("user_roles").insert({ user_id: targetUserId, role_id: studentRoleRow.id });
      }
      // Also downgrade user_metadata for legacy compat
      const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (targetUser?.user) {
        await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          user_metadata: { ...targetUser.user.user_metadata, role: "STUDENT" }
        });
      }
      // Clean up admin_permissions
      await supabaseAdmin.from("admin_permissions").delete().eq("user_id", targetUserId);
      return NextResponse.json({ success: true, action: "revoked" });
    }

    if (action === "invite") {
      const { email, name } = body;
      if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

      const { data: { users: existing } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
      const found = existing.find(u => u.email === email);

      const targetId = found?.id || (await (async () => {
        const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { full_name: name || email.split("@")[0], role: role || "SUPPORT_AGENT" },
        });
        return newUser.user?.id;
      })());

      if (!targetId) return NextResponse.json({ error: "Impossible de créer l'utilisateur" }, { status: 500 });

      // Set role in user_roles
      if (roleRow?.id) {
        await supabaseAdmin.from("user_roles").delete().eq("user_id", targetId);
        await supabaseAdmin.from("user_roles").insert({ user_id: targetId, role_id: roleRow.id });
      }

      // Upsert admin_permissions
      await supabaseAdmin.from("admin_permissions").upsert({
        user_id: targetId,
        role: role || "SUPPORT_AGENT",
        granted_permissions: grantedPermissions,
        revoked_permissions: revokedPermissions,
        notes,
        assigned_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      return NextResponse.json({ success: true, action: found ? "updated_existing" : "invited" });
    }

    // Default: update role for existing user
    if (!roleRow?.id) return NextResponse.json({ error: `Rôle "${role}" introuvable` }, { status: 400 });

    // Remove current roles then insert new one
    await supabaseAdmin.from("user_roles").delete().eq("user_id", targetUserId);
    await supabaseAdmin.from("user_roles").insert({ user_id: targetUserId, role_id: roleRow.id });

    // Also update user_metadata for legacy compat
    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    if (targetUser?.user) {
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        user_metadata: { ...targetUser.user.user_metadata, role }
      });
    }

    // Upsert admin_permissions overrides
    await supabaseAdmin.from("admin_permissions").upsert({
      user_id: targetUserId,
      role,
      granted_permissions: grantedPermissions,
      revoked_permissions: revokedPermissions,
      notes,
      assigned_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return NextResponse.json({ success: true, action: "updated" });
  } catch (err: any) {
    console.error("[api/admin/team POST]", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}
