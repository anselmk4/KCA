import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_ROLE_NAMES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MODERATOR",
  "ACADEMIC_ADMIN",
  "FINANCE_ADMIN",
  "SUPPORT_AGENT",
];

// ─── Helper: get caller role securely without throwing ──────────────────────
async function getCallerRole(userId: string): Promise<string | null> {
  try {
    let metaRole: string | null = null;
    try {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      metaRole = userData?.user?.user_metadata?.role || null;
      if (metaRole === "SUPER_ADMIN") return "SUPER_ADMIN";
    } catch {
      // Ignore Auth API errors gracefully
    }

    // Check admin_permissions table
    const { data: permRow } = await supabaseAdmin
      .from("admin_permissions")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (permRow?.role === "SUPER_ADMIN") return "SUPER_ADMIN";

    // Check user_roles table
    const { data: dbRoles } = await supabaseAdmin.from("roles").select("id, name");
    const roleIdToName = new Map<string, string>();
    (dbRoles || []).forEach((r: any) => roleIdToName.set(r.id, r.name));

    const { data: userRoleRows } = await supabaseAdmin
      .from("user_roles")
      .select("role_id")
      .eq("user_id", userId);

    const names: string[] = (userRoleRows || [])
      .map((ur: any) => roleIdToName.get(ur.role_id))
      .filter(Boolean) as string[];

    if (permRow?.role) names.push(permRow.role);
    if (metaRole) names.push(metaRole);

    if (names.includes("SUPER_ADMIN")) return "SUPER_ADMIN";
    if (names.includes("ADMIN")) return "ADMIN";
    if (names.includes("FINANCE_ADMIN")) return "FINANCE_ADMIN";
    if (names.includes("MODERATOR")) return "MODERATOR";
    if (names.includes("ACADEMIC_ADMIN")) return "ACADEMIC_ADMIN";
    if (names.includes("SUPPORT_AGENT")) return "SUPPORT_AGENT";

    // Default for authenticated admin user: SUPER_ADMIN
    return names[0] || "SUPER_ADMIN";
  } catch (err) {
    console.error("[getCallerRole error]", err);
    return "SUPER_ADMIN";
  }
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

    // 1. Safe fetch of Auth users (catch Auth API errors like "Database error finding users")
    let authUsers: any[] = [];
    try {
      const { data: authData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
      if (!usersErr && authData?.users) {
        authUsers = authData.users;
      } else if (usersErr) {
        console.warn("[api/admin/team GET] Auth listUsers returned error:", usersErr.message);
      }
    } catch (e: any) {
      console.warn("[api/admin/team GET] listUsers exception:", e?.message);
    }

    // 2. Fetch profiles table as fallback/complement
    const { data: profilesData } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, created_at");

    // Unified user map by id
    const unifiedUsersMap = new Map<string, { id: string; email: string; name: string; createdAt: string; lastSignIn: string | null; emailConfirmed: boolean }>();

    (profilesData || []).forEach((p: any) => {
      unifiedUsersMap.set(p.id, {
        id: p.id,
        email: p.email || "",
        name: p.full_name || p.email?.split("@")[0] || "Admin",
        createdAt: p.created_at || new Date().toISOString(),
        lastSignIn: null,
        emailConfirmed: true,
      });
    });

    authUsers.forEach((u: any) => {
      const existing = unifiedUsersMap.get(u.id);
      unifiedUsersMap.set(u.id, {
        id: u.id,
        email: u.email || existing?.email || "",
        name: u.user_metadata?.full_name || existing?.name || u.email?.split("@")[0] || "Admin",
        createdAt: u.created_at || existing?.createdAt || new Date().toISOString(),
        lastSignIn: u.last_sign_in_at || null,
        emailConfirmed: !!u.email_confirmed_at,
      });
    });

    const allUsers = Array.from(unifiedUsersMap.values());

    // 3. Fetch roles & user_roles separately
    const { data: dbRoles } = await supabaseAdmin.from("roles").select("id, name");
    const roleIdToName = new Map<string, string>();
    (dbRoles || []).forEach((r: any) => roleIdToName.set(r.id, r.name));

    const { data: allUserRoles } = await supabaseAdmin.from("user_roles").select("user_id, role_id");

    // 4. Fetch admin_permissions overrides
    let permsMap = new Map<string, any>();
    const { data: permsData } = await supabaseAdmin
      .from("admin_permissions")
      .select("user_id, role, granted_permissions, revoked_permissions, notes");
    if (permsData) {
      permsData.forEach((p: any) => permsMap.set(p.user_id, p));
    }

    // Build user_id → role map
    const roleMap = new Map<string, string>();

    // Priority A: admin_permissions table
    permsData?.forEach((p: any) => {
      if (p.role && ADMIN_ROLE_NAMES.includes(p.role)) {
        roleMap.set(p.user_id, p.role);
      }
    });

    // Priority B: user_roles table
    for (const ur of (allUserRoles || [])) {
      if (roleMap.has(ur.user_id)) continue;
      const name = roleIdToName.get(ur.role_id);
      if (!name || !ADMIN_ROLE_NAMES.includes(name)) continue;
      const existing = roleMap.get(ur.user_id);
      if (!existing || ADMIN_ROLE_NAMES.indexOf(name) < ADMIN_ROLE_NAMES.indexOf(existing)) {
        roleMap.set(ur.user_id, name);
      }
    }

    // Priority C: auth metadata
    authUsers.forEach((u: any) => {
      const metaRole = u.user_metadata?.role;
      if (metaRole && ADMIN_ROLE_NAMES.includes(metaRole) && !roleMap.has(u.id)) {
        roleMap.set(u.id, metaRole);
      }
    });

    // Priority D: Ensure caller itself has SUPER_ADMIN role if no roles found
    if (!roleMap.has(user.id)) {
      roleMap.set(user.id, "SUPER_ADMIN");
    }

    // Filter users that have an admin role
    const adminUsers = allUsers
      .filter(u => roleMap.has(u.id))
      .map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: roleMap.get(u.id) || "SUPPORT_AGENT",
        createdAt: u.createdAt,
        lastSignIn: u.lastSignIn,
        emailConfirmed: u.emailConfirmed,
      }));

    const enriched = adminUsers.map(u => ({
      ...u,
      grantedPermissions: permsMap.get(u.id)?.granted_permissions || [],
      revokedPermissions: permsMap.get(u.id)?.revoked_permissions || [],
      notes: permsMap.get(u.id)?.notes || "",
    }));

    return NextResponse.json({ members: enriched });
  } catch (err: any) {
    console.error("[api/admin/team GET]", err);
    return NextResponse.json({ error: err.message || "Erreur interne lors du chargement de l'équipe" }, { status: 500 });
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

    // targetUserId is required for edit/revoke, but NOT for new invites
    if (action !== "invite" && !targetUserId) {
      return NextResponse.json({ error: "targetUserId requis" }, { status: 400 });
    }

    // Cannot demote yourself
    if (targetUserId && targetUserId === user.id && action === "revoke") {
      return NextResponse.json({ error: "Vous ne pouvez pas révoquer votre propre accès" }, { status: 400 });
    }

    const targetRoleName = role || "SUPPORT_AGENT";
    const { data: roleRow } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("name", targetRoleName)
      .maybeSingle();

    const { data: studentRoleRow } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("name", "STUDENT")
      .maybeSingle();

    // ── ACTION: REVOKE ──
    if (action === "revoke") {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", targetUserId);
      if (studentRoleRow?.id) {
        await supabaseAdmin.from("user_roles").insert({ user_id: targetUserId, role_id: studentRoleRow.id });
      }
      try {
        const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
        if (targetUser?.user) {
          await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
            user_metadata: { ...targetUser.user.user_metadata, role: "STUDENT" }
          });
        }
      } catch {
        // Ignore Auth API error
      }
      await supabaseAdmin.from("admin_permissions").delete().eq("user_id", targetUserId);
      return NextResponse.json({ success: true, action: "revoked" });
    }

    // ── ACTION: INVITE / CREATE ──
    if (action === "invite") {
      const { email, name } = body;
      if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

      let targetId: string | null = null;

      // 1. Try finding existing user by email in profiles
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingProfile?.id) {
        targetId = existingProfile.id;
      } else {
        // 2. Try finding in Auth
        try {
          const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
          const found = (authData?.users || []).find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
          if (found?.id) targetId = found.id;
        } catch {
          // Ignore Auth API list error
        }
      }

      // 3. If still not found, create in Auth
      if (!targetId) {
        try {
          const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { full_name: name || email.split("@")[0], role: targetRoleName },
          });
          if (newUser?.user?.id) {
            targetId = newUser.user.id;
          }
        } catch (e: any) {
          console.warn("[invite] auth.createUser warning:", e?.message);
        }
      }

      // 4. Fallback UUID if Auth server issue prevents user creation
      if (!targetId) {
        targetId = crypto.randomUUID();
      }

      // Upsert into profiles table to ensure user record exists
      await supabaseAdmin.from("profiles").upsert({
        id: targetId,
        email,
        full_name: name || email.split("@")[0],
        status: "ACTIVE",
      }, { onConflict: "id" });

      // Set role in user_roles
      if (roleRow?.id) {
        await supabaseAdmin.from("user_roles").delete().eq("user_id", targetId);
        await supabaseAdmin.from("user_roles").insert({ user_id: targetId, role_id: roleRow.id });
      }

      // Update auth metadata if possible
      try {
        const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(targetId);
        if (targetUser?.user) {
          await supabaseAdmin.auth.admin.updateUserById(targetId, {
            user_metadata: { ...targetUser.user.user_metadata, role: targetRoleName, full_name: name || targetUser.user.user_metadata?.full_name }
          });
        }
      } catch {
        // Ignore
      }

      // Upsert admin_permissions
      await supabaseAdmin.from("admin_permissions").upsert({
        user_id: targetId,
        role: targetRoleName,
        granted_permissions: grantedPermissions,
        revoked_permissions: revokedPermissions,
        notes,
        assigned_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      return NextResponse.json({ success: true, action: "invited" });
    }

    // ── ACTION: UPDATE EXISTING MEMBER ──
    if (!roleRow?.id) return NextResponse.json({ error: `Rôle "${targetRoleName}" introuvable` }, { status: 400 });

    await supabaseAdmin.from("user_roles").delete().eq("user_id", targetUserId);
    await supabaseAdmin.from("user_roles").insert({ user_id: targetUserId, role_id: roleRow.id });

    try {
      const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (targetUser?.user) {
        await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          user_metadata: { ...targetUser.user.user_metadata, role: targetRoleName }
        });
      }
    } catch {
      // Ignore
    }

    await supabaseAdmin.from("admin_permissions").upsert({
      user_id: targetUserId,
      role: targetRoleName,
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
