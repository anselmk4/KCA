import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createDirectClient } from "@supabase/supabase-js";

// Initialize a service role client to bypass RLS when performing coupon writes (if key is set)
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

    // Read roles using the authenticated client to bypass RLS limitations for anon users
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("[coupons-api] Error reading user roles:", rolesError);
    }

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isAuthorized = roles.some(r => ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(r));
    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé. Rôle insuffisant." }, { status: 403 });
    }

    const body = await req.json();
    const { code, description, discount_type, discount_value, applicable_course_id, max_uses, expires_at } = body;

    if (!code || !discount_value) {
      return NextResponse.json({ error: "Code promo et valeur de réduction obligatoires." }, { status: 400 });
    }

    // Choose write client (use admin if configured, fallback to user's client otherwise)
    const writeClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;

    // If INSTRUCTOR, check if course belongs to them
    if (roles.includes("INSTRUCTOR") && !roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r))) {
      if (applicable_course_id) {
        const { data: course } = await writeClient
          .from("courses")
          .select("instructor_id")
          .eq("id", applicable_course_id)
          .maybeSingle();

        if (course?.instructor_id !== user.id) {
          return NextResponse.json({ error: "Non autorisé à créer un coupon pour ce cours." }, { status: 403 });
        }
      }
    }

    const { data, error } = await writeClient
      .from("coupons")
      .insert({
        code: code.toUpperCase(),
        description: description || null,
        discount_type,
        discount_value,
        applicable_course_id: applicable_course_id || null,
        max_uses: max_uses || null,
        current_uses: 0,
        expires_at: expires_at || null,
        is_active: true,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error("[coupons-api] Supabase insert error:", error);
      throw new Error(error.message);
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[coupons-api] Error creating coupon:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur lors de la création." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié. Veuillez vous connecter." }, { status: 401 });
    }

    const body = await req.json();
    const { id, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de coupon manquant." }, { status: 400 });
    }

    // Choose client
    const client = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;

    // Check coupon existence & author
    const { data: coupon } = await client
      .from("coupons")
      .select("created_by")
      .eq("id", id)
      .maybeSingle();

    if (!coupon) {
      return NextResponse.json({ error: "Coupon introuvable." }, { status: 404 });
    }

    // Check user roles using authenticated client
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isAdmin = roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r));
    const isOwner = coupon.created_by === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Non autorisé à modifier ce coupon." }, { status: 403 });
    }

    const { data, error } = await client
      .from("coupons")
      .update({ is_active })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[coupons-api] Error toggling coupon status:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur lors de la mise à jour." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié. Veuillez vous connecter." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de coupon manquant." }, { status: 400 });
    }

    // Choose client
    const client = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;

    // Check coupon existence & author
    const { data: coupon } = await client
      .from("coupons")
      .select("created_by")
      .eq("id", id)
      .maybeSingle();

    if (!coupon) {
      return NextResponse.json({ error: "Coupon introuvable." }, { status: 404 });
    }

    // Check user roles using authenticated client
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isAdmin = roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r));
    const isOwner = coupon.created_by === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Non autorisé à supprimer ce coupon." }, { status: 403 });
    }

    const { error } = await client
      .from("coupons")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[coupons-api] Error deleting coupon:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur lors de la suppression." }, { status: 500 });
  }
}
