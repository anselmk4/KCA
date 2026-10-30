import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isAuthorizedSuperAdmin } from "@/lib/rbac";
import { validateDigitalProductPrice } from "@/lib/digital-products-pricing";

export const dynamic = "force-dynamic";

async function isUserAdmin(admin: any, userId: string, email?: string | null): Promise<boolean> {
  if (email && isAuthorizedSuperAdmin(email)) return true;
  const { data: userRoles } = await admin
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId);
  const roleNames: string[] =
    userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];
  return roleNames.some((r) => ["SUPER_ADMIN", "ADMIN", "ACADEMIC_ADMIN"].includes(r));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = getSupabaseAdmin();

    const { data: product, error } = await (admin as any)
      .from("digital_products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !product) {
      return NextResponse.json(
        { error: "Produit digital introuvable." },
        { status: 404 }
      );
    }

    if (product.author_id) {
      const { data: profile } = await (admin as any)
        .from("profiles")
        .select(
          "id, full_name, avatar_url, specialty, academy_name, bio, website, twitter, linkedin"
        )
        .eq("id", product.author_id)
        .maybeSingle();

      product.profiles = profile || undefined;
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthor = Boolean(user && user.id === product.author_id);
    if (!isAuthor) {
      delete product.file_url;
      product.has_file = true;
    }

    return NextResponse.json({ product });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour modifier un produit digital." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const admin = getSupabaseAdmin();

    const { data: existing } = await (admin as any)
      .from("digital_products")
      .select("author_id, category, file_name")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    }

    if (existing.author_id !== user.id) {
      const adminAllowed = await isUserAdmin(admin, user.id, user.email);
      if (!adminAllowed) {
        return NextResponse.json(
          { error: "Action non autorisée. Vous n'êtes pas l'auteur de ce produit." },
          { status: 403 }
        );
      }
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.description !== undefined) updates.description = body.description.trim();
    if (body.cover_image_url !== undefined) updates.cover_image_url = body.cover_image_url.trim();
    if (body.file_url !== undefined) updates.file_url = body.file_url.trim();
    if (body.file_name !== undefined) updates.file_name = body.file_name;
    if (body.file_size_bytes !== undefined) updates.file_size_bytes = body.file_size_bytes;
    if (body.category !== undefined) updates.category = body.category;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.status !== undefined) updates.status = body.status;
    if (body.preview_url !== undefined) updates.preview_url = body.preview_url;

    if (body.price !== undefined) {
      const numPrice = parseFloat(body.price);
      const categoryToCheck = body.category !== undefined ? body.category : existing.category;
      const fileToCheck = body.file_name !== undefined ? body.file_name : existing.file_name;
      const priceCheck = validateDigitalProductPrice(numPrice, categoryToCheck, fileToCheck);
      if (!priceCheck.isValid) {
        return NextResponse.json({ error: priceCheck.error }, { status: 400 });
      }
      updates.price = numPrice;
    }

    const { data: updated, error: updateErr } = await (admin as any)
      .from("digital_products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour supprimer un produit digital." },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdmin();
    const { data: existing } = await (admin as any)
      .from("digital_products")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    }

    if (existing.author_id !== user.id) {
      const adminAllowed = await isUserAdmin(admin, user.id, user.email);
      if (!adminAllowed) {
        return NextResponse.json(
          { error: "Seul l'auteur ou un administrateur peut supprimer ce produit digital." },
          { status: 403 }
        );
      }
    }

    const { error: delErr } = await (admin as any)
      .from("digital_products")
      .delete()
      .eq("id", id);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Produit digital supprimé." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
