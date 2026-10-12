import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MAX_DIGITAL_PRODUCT_PRICE = 25.0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = getSupabaseAdmin();

    const { data: product, error } = await (admin as any)
      .from("digital_products")
      .select("*, profiles:author_id(id, full_name, avatar_url, specialty, academy_name, bio, website, twitter, linkedin)")
      .eq("id", id)
      .maybeSingle();

    if (error || !product) {
      return NextResponse.json(
        { error: "Produit digital introuvable." },
        { status: 404 }
      );
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

    // RÈGLE D'OR : CONTROLE STRICT DU PRIX SUR LA MISE À JOUR
    if (body.price !== undefined) {
      const numPrice = parseFloat(body.price);
      if (isNaN(numPrice) || numPrice < 0) {
        return NextResponse.json({ error: "Prix invalide." }, { status: 400 });
      }
      if (numPrice > MAX_DIGITAL_PRODUCT_PRICE) {
        return NextResponse.json(
          {
            error: `RÈGLE DE SÉCURITÉ : Le prix des produits digitaux est strictement plafonné à 25 $ USD max (Reçu: $${numPrice.toFixed(
              2
            )}).`,
          },
          { status: 400 }
        );
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
