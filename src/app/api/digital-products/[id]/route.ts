import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
import { validateDigitalProductPrice } from "@/lib/digital-products-pricing";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = getSupabaseAdmin();

    // 1. Fetch product directly
    let { data: product, error } = await (admin as any)
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

    // 2. Fetch author profile separately
    if (product.author_id) {
      const { data: profile } = await (admin as any)
        .from("profiles")
        .select("id, full_name, avatar_url, specialty, academy_name, bio, website, twitter, linkedin")
        .eq("id", product.author_id)
        .maybeSingle();

      product.profiles = profile || undefined;
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthor = user && user.id === product.author_id;
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

    const body = await req.json();
    const admin = getSupabaseAdmin();

    // Check ownership
    const { data: existing } = await (admin as any)
      .from("digital_products")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    }

    if (user && existing.author_id !== user.id) {
      return NextResponse.json(
        { error: "Action non autorisée. Vous n'êtes pas l'auteur de ce produit." },
        { status: 403 }
      );
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.description !== undefined) updates.description = body.description.trim();
    if (body.cover_image_url !== undefined) updates.cover_image_url = body.cover_image_url.trim();
    if (body.file_url !== undefined) updates.file_url = body.file_url.trim();
    if (body.file_name !== undefined) updates.file_name = body.file_name;
    if (body.category !== undefined) updates.category = body.category;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.status !== undefined) updates.status = body.status;
    if (body.preview_url !== undefined) updates.preview_url = body.preview_url;

    // RÈGLE TARIFAIRE : SEULS LES E-BOOKS ET GUIDES PDF SONT PLAFONNÉS À 25 $ MAX
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

    const admin = getSupabaseAdmin();
    const { data: existing } = await (admin as any)
      .from("digital_products")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    }

    if (user && existing.author_id !== user.id) {
      return NextResponse.json(
        { error: "Seul l'auteur peut supprimer ce produit digital." },
        { status: 403 }
      );
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
