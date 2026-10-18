import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // Verify admin role
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isAuthorized = roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r));

    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé. Droits administrateurs requis." }, { status: 403 });
    }

    // 1. Fetch all profiles
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("*");
    if (pErr) throw pErr;

    const profileMap = new Map<string, any>();
    profiles?.forEach((p) => profileMap.set(p.id, p));

    // 2. Fetch Auth users safely (with safe page size and getUserById fallback)
    const authUserMap = new Map<string, any>();
    try {
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 20) {
        const { data: pageData, error: pageErr } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 50,
        });

        if (pageErr) {
          console.warn(`[sync-profiles] listUsers warning on page ${page}:`, pageErr.message);
          break;
        }

        const pageUsers = pageData?.users || [];
        pageUsers.forEach((u) => authUserMap.set(u.id, u));

        if (pageUsers.length < 50) {
          hasMore = false;
        } else {
          page++;
        }
      }
    } catch (authErr) {
      console.warn("[sync-profiles] listUsers exception (handled):", authErr);
    }

    // 3. Fallback: If listUsers failed or missed profiles, query getUserById directly for profiles missing phone/country
    const profilesNeedingMeta = (profiles || []).filter(
      (p) => (!p.phone && !p.phone_number) || (!p.nationality && !p.country)
    );

    if (profilesNeedingMeta.length > 0) {
      const BATCH_SIZE = 10;
      for (let i = 0; i < profilesNeedingMeta.length; i += BATCH_SIZE) {
        const batch = profilesNeedingMeta.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(
          batch.map(async (p) => {
            if (!authUserMap.has(p.id)) {
              try {
                const { data: uData, error: uErr } = await supabaseAdmin.auth.admin.getUserById(p.id);
                if (!uErr && uData?.user) {
                  authUserMap.set(p.id, uData.user);
                }
              } catch (e) {}
            }
          })
        );
      }
    }

    let updatedCount = 0;
    let createdCount = 0;

    // A. First: synchronize existing profiles where phone/country can be resolved from aliases or authUserMap
    for (const p of profiles || []) {
      const authU = authUserMap.get(p.id);
      const meta = authU?.user_metadata || {};

      const resolvedPhone = p.phone || p.phone_number || meta.phone_number || meta.phone || authU?.phone || "";
      const resolvedCountry = p.nationality || p.country || meta.country || meta.nationality || "";
      const resolvedGender = p.gender || meta.gender || "";
      const resolvedAcademy = p.academy_name || meta.academy_name || "";
      const resolvedSpecialty = p.specialty || meta.thematic || meta.specialty || "";
      const resolvedBio = p.bio || meta.bio || "";
      const resolvedName = p.full_name || meta.full_name || meta.name || "";

      let hasUpdated = false;

      // Ensure phone is saved in 'phone' and 'phone_number'
      if (!p.phone && resolvedPhone) {
        const { error: pErr1 } = await (supabaseAdmin.from("profiles") as any)
          .update({ phone: resolvedPhone })
          .eq("id", p.id);
        if (pErr1) {
          const { error: pErr2 } = await (supabaseAdmin.from("profiles") as any)
            .update({ phone_number: resolvedPhone })
            .eq("id", p.id);
          if (!pErr2) hasUpdated = true;
        } else {
          hasUpdated = true;
        }
      }

      // Ensure nationality is saved in 'nationality' and 'country'
      if (!p.nationality && resolvedCountry) {
        const { error: nErr1 } = await (supabaseAdmin.from("profiles") as any)
          .update({ nationality: resolvedCountry })
          .eq("id", p.id);
        if (nErr1) {
          const { error: nErr2 } = await (supabaseAdmin.from("profiles") as any)
            .update({ country: resolvedCountry })
            .eq("id", p.id);
          if (!nErr2) hasUpdated = true;
        } else {
          hasUpdated = true;
        }
      }

      if (!p.full_name && resolvedName) {
        await (supabaseAdmin.from("profiles") as any).update({ full_name: resolvedName }).eq("id", p.id).catch(() => {});
      }
      if (!p.gender && resolvedGender) {
        await (supabaseAdmin.from("profiles") as any).update({ gender: resolvedGender }).eq("id", p.id).catch(() => {});
      }
      if (!p.academy_name && resolvedAcademy) {
        await (supabaseAdmin.from("profiles") as any).update({ academy_name: resolvedAcademy }).eq("id", p.id).catch(() => {});
      }
      if (!p.specialty && resolvedSpecialty) {
        await (supabaseAdmin.from("profiles") as any).update({ specialty: resolvedSpecialty }).eq("id", p.id).catch(() => {});
      }
      if (!p.bio && resolvedBio) {
        await (supabaseAdmin.from("profiles") as any).update({ bio: resolvedBio }).eq("id", p.id).catch(() => {});
      }

      if (hasUpdated) updatedCount++;
    }

    // B. Second: create profiles for any auth users that have no profile row
    const authUsers = Array.from(authUserMap.values());
    for (const u of authUsers) {
      if (!profileMap.has(u.id)) {
        const meta = u.user_metadata || {};
        const resolvedPhone = meta.phone_number || meta.phone || u.phone || "";
        const resolvedCountry = meta.country || meta.nationality || "";
        const resolvedGender = meta.gender || "";
        const resolvedName = meta.full_name || meta.name || u.email?.split("@")[0] || "Utilisateur";

        const { error: inErr } = await (supabaseAdmin
          .from("profiles") as any)
          .insert({
            id: u.id,
            email: u.email || "",
            full_name: resolvedName,
            status: "ACTIVE",
            plan: "FREE",
          });

        if (!inErr) {
          createdCount++;
          if (resolvedPhone) {
            const { error: pErr } = await (supabaseAdmin.from("profiles") as any).update({ phone: resolvedPhone }).eq("id", u.id);
            if (pErr) await (supabaseAdmin.from("profiles") as any).update({ phone_number: resolvedPhone }).eq("id", u.id).catch(() => {});
          }
          if (resolvedCountry) {
            const { error: nErr } = await (supabaseAdmin.from("profiles") as any).update({ nationality: resolvedCountry }).eq("id", u.id);
            if (nErr) await (supabaseAdmin.from("profiles") as any).update({ country: resolvedCountry }).eq("id", u.id).catch(() => {});
          }
          if (resolvedGender) {
            await (supabaseAdmin.from("profiles") as any).update({ gender: resolvedGender }).eq("id", u.id).catch(() => {});
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée : ${updatedCount} profil(s) mis à jour, ${createdCount} profil(s) créés.`,
      totalAuthUsers: authUsers.length,
      updatedCount,
      createdCount,
    });
  } catch (err: any) {
    console.error("[sync-profiles] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}
