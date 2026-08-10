import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createDirectClient } from "@supabase/supabase-js";

// Initialize a service role client to perform user deletion via auth admin
const supabaseAdmin = createDirectClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié. Veuillez vous connecter." }, { status: 401 });
    }

    // Verify requesting user is admin or super admin
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("[delete-user] Error reading user roles:", rolesError);
    }

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isAuthorized = roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r));

    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé. Droits administrateurs requis." }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "ID de l'utilisateur cible requis." }, { status: 400 });
    }

    // Prevent deleting oneself
    if (user.id === targetUserId) {
      return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 });
    }

    // Delete instructor's authored courses first to prevent FK constraint issues
    await supabaseAdmin.from("courses").delete().eq("instructor_id", targetUserId);

    // Delete in correct order of dependency
    await supabaseAdmin.from("user_roles").delete().eq("user_id", targetUserId);
    await supabaseAdmin.from("enrollments").delete().eq("student_id", targetUserId);
    await supabaseAdmin.from("payments").delete().eq("user_id", targetUserId);
    await supabaseAdmin.from("profiles").delete().eq("id", targetUserId);

    // Delete user from auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (authDeleteError) {
      console.error("[delete-user] Error deleting user from auth:", authDeleteError.message);
      return NextResponse.json({ error: "Erreur lors de la suppression de l'authentification : " + authDeleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Utilisateur supprimé avec succès." });
  } catch (err: any) {
    console.error("[delete-user] Error:", err);
    return NextResponse.json({ error: err.message || "Une erreur est survenue." }, { status: 500 });
  }
}
