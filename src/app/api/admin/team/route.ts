import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { ADMIN_ROLES } from "@/lib/rbac";

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── GET – list all admin team members ────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const callerRole = user.user_metadata?.role || "STUDENT";
    if (callerRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé – SUPER_ADMIN requis" }, { status: 403 });
    }

    // Fetch all users from auth
    const { data: { users }, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
    if (usersErr) throw usersErr;

    // Filter to admin roles only
    const adminUsers = users
      .filter(u => ADMIN_ROLES.includes(u.user_metadata?.role))
      .map(u => ({
        id: u.id,
        email: u.email || "",
        name: u.user_metadata?.full_name || u.email?.split("@")[0] || "Admin",
        role: u.user_metadata?.role || "SUPPORT_AGENT",
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at || null,
        emailConfirmed: !!u.email_confirmed_at,
      }));

    // Fetch admin_permissions overrides if table exists
    const { data: permsData } = await supabaseAdmin
      .from("admin_permissions")
      .select("user_id, granted_permissions, revoked_permissions, notes");

    const permsMap = new Map((permsData || []).map((p: any) => [p.user_id, p]));

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

    const callerRole = user.user_metadata?.role || "STUDENT";
    if (callerRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé – SUPER_ADMIN requis" }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, role, grantedPermissions = [], revokedPermissions = [], notes = "", action } = body;

    if (!targetUserId) return NextResponse.json({ error: "targetUserId requis" }, { status: 400 });

    // Cannot demote yourself
    if (targetUserId === user.id && action === "revoke") {
      return NextResponse.json({ error: "Vous ne pouvez pas révoquer votre propre accès" }, { status: 400 });
    }

    if (action === "revoke") {
      // Revoke admin: downgrade to STUDENT
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        user_metadata: { role: "STUDENT" }
      });
      if (updateErr) throw updateErr;

      // Clean up admin_permissions entry
      await supabaseAdmin.from("admin_permissions").delete().eq("user_id", targetUserId);

      return NextResponse.json({ success: true, action: "revoked" });
    }

    if (action === "invite") {
      // Invite a new admin by email
      const { email, name } = body;
      if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

      // Check if user already exists
      const { data: { users: existing } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
      const found = existing.find(u => u.email === email);

      if (found) {
        // Update existing user's role
        await supabaseAdmin.auth.admin.updateUserById(found.id, {
          user_metadata: { ...found.user_metadata, role: role || "SUPPORT_AGENT" }
        });

        await supabaseAdmin.from("admin_permissions").upsert({
          user_id: found.id,
          role: role || "SUPPORT_AGENT",
          granted_permissions: grantedPermissions,
          revoked_permissions: revokedPermissions,
          notes,
          assigned_by: user.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        return NextResponse.json({ success: true, action: "updated_existing" });
      }

      // Create new user and send invite
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: name || email.split("@")[0], role: role || "SUPPORT_AGENT" },
      });

      if (createErr) throw createErr;

      await supabaseAdmin.from("admin_permissions").upsert({
        user_id: newUser.user.id,
        role: role || "SUPPORT_AGENT",
        granted_permissions: grantedPermissions,
        revoked_permissions: revokedPermissions,
        notes,
        assigned_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      return NextResponse.json({ success: true, action: "invited", userId: newUser.user.id });
    }

    // Default: update role + permissions for existing user
    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    if (!targetUser.user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      user_metadata: { ...targetUser.user.user_metadata, role }
    });
    if (updateErr) throw updateErr;

    // Upsert admin_permissions
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
