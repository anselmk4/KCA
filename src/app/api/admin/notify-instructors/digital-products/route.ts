import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendInstructorDigitalProductsAnnouncementEmail } from "@/lib/email";
import { createNotification } from "@/lib/supabase/notifications-helper";

export const dynamic = "force-dynamic";

/**
 * Endpoint Admin pour notifier TOUS les formateurs de l'arrivée des produits digitaux
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Vérification de sécurité (authentification admin ou clé secret)
    const authHeader = req.headers.get("authorization");
    const secretKey = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isAuthorizedByHeader = authHeader && secretKey && authHeader.replace("Bearer ", "") === secretKey;

    if (!isAuthorizedByHeader) {
      if (!user) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }

      // Vérifier le rôle ADMIN / SUPER_ADMIN
      const isSuperAdminEmail = user.email && process.env.SUPER_ADMIN_EMAIL && user.email.toLowerCase() === process.env.SUPER_ADMIN_EMAIL.toLowerCase();

      if (!isSuperAdminEmail) {
        const { data: roles } = await (supabaseAdmin as any)
          .from("user_roles")
          .select("roles!inner(name)")
          .eq("user_id", user.id);

        const roleNames = (roles || []).map((r: any) => r.roles?.name);
        if (!roleNames.includes("SUPER_ADMIN") && !roleNames.includes("ADMIN")) {
          return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
        }
      }
    }

    // 1. Récupérer tous les IDs des utilisateurs ayant le rôle INSTRUCTOR
    const { data: instructorRoles, error: rolesErr } = await (supabaseAdmin as any)
      .from("user_roles")
      .select("user_id, roles!inner(name)")
      .eq("roles.name", "INSTRUCTOR");

    if (rolesErr) {
      console.error("[notify-instructors] Erreur roles:", rolesErr);
      return NextResponse.json({ error: rolesErr.message }, { status: 500 });
    }

    const instructorUserIds = Array.from(new Set((instructorRoles || []).map((r: any) => r.user_id as string)));

    // Fallback : aussi chercher dans profiles où role = 'INSTRUCTOR' ou plan est défini
    const { data: profilesData } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, role, plan");

    const allInstructorsMap = new Map<string, { id: string; name: string; email: string }>();

    // A. Depuis user_roles
    profilesData?.forEach((p: any) => {
      const isRoleInstructor = instructorUserIds.includes(p.id) || p.role === "INSTRUCTOR" || (p.plan && p.plan !== "FREE");
      if (isRoleInstructor && p.email) {
        allInstructorsMap.set(p.id, {
          id: p.id,
          name: p.full_name || "Formateur",
          email: p.email,
        });
      }
    });

    // B. Récupérer aussi les emails depuis auth.users si profiles.email est vide
    try {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      authUsers?.users?.forEach((u) => {
        if (instructorUserIds.includes(u.id) && u.email && !allInstructorsMap.has(u.id)) {
          allInstructorsMap.set(u.id, {
            id: u.id,
            name: (u.user_metadata?.full_name || u.email.split("@")[0]) as string,
            email: u.email,
          });
        }
      });
    } catch (e) {
      console.warn("[notify-instructors] listUsers fallback:", e);
    }

    const instructors = Array.from(allInstructorsMap.values());
    console.log(`[notify-instructors] Envoi d'annonces à ${instructors.length} formateur(s)...`);

    const results = [];
    for (const inst of instructors) {
      try {
        // Envoi d'email
        await sendInstructorDigitalProductsAnnouncementEmail(inst.email, inst.name);

        // Notification in-app
        await createNotification({
          userId: inst.id,
          title: "🚀 Vendez vos E-books & Logiciels !",
          message: "Nouvelle fonctionnalité : Vous pouvez dès maintenant publier vos produits digitaux (e-books, guides PDF, fichiers ZIP, templates) dans l'onglet 'Mes Produits' (max 25$).",
          type: "INFO",
          link: "/instructor/courses",
        });

        results.push({ email: inst.email, name: inst.name, success: true });
      } catch (err: any) {
        console.error(`[notify-instructors] Échec envoi à ${inst.email}:`, err);
        results.push({ email: inst.email, name: inst.name, success: false, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Annonce envoyée à ${results.filter((r) => r.success).length} / ${instructors.length} formateur(s).`,
      count: instructors.length,
      details: results,
    });
  } catch (error: any) {
    console.error("[notify-instructors] Erreur globale:", error);
    return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
  }
}
