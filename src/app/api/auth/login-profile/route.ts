import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const requestedUserId = body?.userId;

    if (requestedUserId && requestedUserId !== sessionUser.id) {
      return NextResponse.json({ error: "Accès non autorisé à ce profil" }, { status: 403 });
    }

    const userId = sessionUser.id;
    const verifiedAuthEmail = (sessionUser.email || "").trim().toLowerCase();

    // 1. Fetch profile (querying guaranteed columns first to prevent schema cache errors)
    let profile: any = null;
    try {
      const { data } = await (supabaseAdmin
        .from("profiles") as any)
        .select("id, email, full_name, plan, status, phone, nationality")
        .eq("id", userId)
        .maybeSingle();
      profile = data;
    } catch {
      const { data } = await (supabaseAdmin
        .from("profiles") as any)
        .select("id, email, full_name, plan, status")
        .eq("id", userId)
        .maybeSingle();
      profile = data;
    }

    const authMeta = sessionUser.user_metadata || {};

    // 2. Auto-repair / Auto-activate: upon authenticated login, ensure profile is ACTIVE if not SUSPENDED
    if (profile && profile.status !== "SUSPENDED") {
      if (profile.status !== "ACTIVE") {
        profile.status = "ACTIVE";
        await (supabaseAdmin.from("profiles") as any)
          .update({ status: "ACTIVE" })
          .eq("id", userId)
          .catch(() => {});
      }

      // Check if profile is missing contact details present in auth metadata
      const metaPhone = authMeta.phone_number || authMeta.phone || sessionUser.phone;
      const metaCountry = authMeta.country || authMeta.nationality;
      const metaGender = authMeta.gender;
      const metaAcademy = authMeta.academy_name;

      if (!profile.phone && metaPhone) {
        const { error: pErr } = await (supabaseAdmin.from("profiles") as any)
          .update({ phone: metaPhone })
          .eq("id", userId);
        if (pErr) {
          await (supabaseAdmin.from("profiles") as any)
            .update({ phone_number: metaPhone })
            .eq("id", userId)
            .catch(() => {});
        }
      }
      if (!profile.nationality && metaCountry) {
        const { error: nErr } = await (supabaseAdmin.from("profiles") as any)
          .update({ nationality: metaCountry })
          .eq("id", userId);
        if (nErr) {
          await (supabaseAdmin.from("profiles") as any)
            .update({ country: metaCountry })
            .eq("id", userId)
            .catch(() => {});
        }
      }
      if (metaGender) {
        await (supabaseAdmin.from("profiles") as any)
          .update({ gender: metaGender })
          .eq("id", userId)
          .catch(() => {});
      }
      if (metaAcademy) {
        await (supabaseAdmin.from("profiles") as any)
          .update({ academy_name: metaAcademy })
          .eq("id", userId)
          .catch(() => {});
      }
    }

    // 3. If profile is missing, auto-create it using verified session data
    if (!profile && verifiedAuthEmail) {
      const fullName =
        authMeta.full_name ||
        authMeta.name ||
        verifiedAuthEmail.split("@")[0] ||
        "Utilisateur";
      const metaPhone = authMeta.phone_number || authMeta.phone || sessionUser.phone || null;
      const metaCountry = authMeta.country || authMeta.nationality || null;
      const metaGender = authMeta.gender || null;
      const metaAcademy = authMeta.academy_name || null;

      const { data: newProfile, error: insertError } = await (supabaseAdmin
        .from("profiles") as any)
        .insert({
          id: userId,
          email: verifiedAuthEmail,
          full_name: fullName,
          status: "ACTIVE",
          plan: "FREE",
        })
        .select("id, email, full_name, plan, status")
        .single();

      if (insertError) {
        console.error("[login-profile] Auto-repair insert error:", insertError.message);
      } else {
        profile = newProfile;
        if (metaPhone) {
          const { error: pErr } = await (supabaseAdmin.from("profiles") as any)
            .update({ phone: metaPhone })
            .eq("id", userId);
          if (pErr) {
            await (supabaseAdmin.from("profiles") as any)
              .update({ phone_number: metaPhone })
              .eq("id", userId)
              .catch(() => {});
          }
        }
        if (metaCountry) {
          const { error: nErr } = await (supabaseAdmin.from("profiles") as any)
            .update({ nationality: metaCountry })
            .eq("id", userId);
          if (nErr) {
            await (supabaseAdmin.from("profiles") as any)
              .update({ country: metaCountry })
              .eq("id", userId)
              .catch(() => {});
          }
        }
        if (metaGender) {
          await (supabaseAdmin.from("profiles") as any)
            .update({ gender: metaGender })
            .eq("id", userId)
            .catch(() => {});
        }
        if (metaAcademy) {
          await (supabaseAdmin.from("profiles") as any)
            .update({ academy_name: metaAcademy })
            .eq("id", userId)
            .catch(() => {});
        }
      }
    }

    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    // 4. Fetch roles
    const { data: userRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", userId);

    let role = "UNASSIGNED";
    let needsRole = false;
    const roleNames: string[] = [];
    userRoles?.forEach((ur: any) => {
      const name = ur.roles?.name;
      if (name) roleNames.push(name);
    });

    // Strictly rely on the authenticated Supabase session email for Super Admin check
    const { isAuthorizedSuperAdmin } = await import("@/lib/rbac");
    const isOwner = Boolean(verifiedAuthEmail && isAuthorizedSuperAdmin(verifiedAuthEmail));

    if (isOwner) {
      role = "SUPER_ADMIN";
      needsRole = false;
      try {
        const { data: superAdminRole } = await supabaseAdmin
          .from("roles")
          .select("id")
          .eq("name", "SUPER_ADMIN")
          .single();
        if (superAdminRole && !userRoles?.some((ur: any) => ur.role_id === superAdminRole.id)) {
          await supabaseAdmin.from("user_roles").upsert(
            { user_id: userId, role_id: superAdminRole.id },
            { onConflict: "user_id,role_id", ignoreDuplicates: true }
          );
        }
      } catch (e) {
        console.warn("[login-profile] auto-assign super admin error:", e);
      }
    } else if (roleNames.includes("SUPER_ADMIN")) role = "SUPER_ADMIN";
    else if (roleNames.includes("ADMIN")) role = "ADMIN";
    else if (roleNames.includes("FINANCE_ADMIN")) role = "FINANCE_ADMIN";
    else if (roleNames.includes("ACADEMIC_ADMIN")) role = "ACADEMIC_ADMIN";
    else if (roleNames.includes("SUPPORT_AGENT")) role = "SUPPORT_AGENT";
    else if (roleNames.includes("INSTRUCTOR")) role = "INSTRUCTOR";
    else if (roleNames.includes("TEACHING_ASSISTANT")) role = "TEACHING_ASSISTANT";
    else if (roleNames.includes("STUDENT")) role = "STUDENT";
    else {
      role = "UNASSIGNED";
      needsRole = true;
    }

    return NextResponse.json(
      {
        profile: {
          id: profile.id,
          email: verifiedAuthEmail || profile.email || "",
          full_name: profile.full_name,
          role,
          needsRole,
          plan: profile.plan || "FREE",
          status: profile.status || "ACTIVE",
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[login-profile] error:", err.message);
    return NextResponse.json({ error: "Erreur lors de la récupération du profil." }, { status: 500 });
  }
}
