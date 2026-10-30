import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

import { validateDigitalProductPrice } from "@/lib/digital-products-pricing";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authorId = searchParams.get("authorId");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Use admin client to reliably bypass anonymous RLS for public storefront browsing
    const admin = getSupabaseAdmin();
    let query = (admin as any)
      .from("digital_products")
      .select("id, author_id, title, description, cover_image_url, price, category, tags, status, file_name, file_size_bytes, preview_url, created_at, file_url")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (authorId) {
      query = query.eq("author_id", authorId);
      // If viewer is not the author, only return published
      if (!user || user.id !== authorId) {
        query = query.eq("status", "published");
      }
    } else {
      query = query.eq("status", "published");
    }

    if (category && category !== "ALL" && category !== "Toutes") {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data: productsData, error } = await query;

    if (error) {
      console.error("[DigitalProducts GET] Query error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const products = productsData || [];
    const authorIds = [...new Set(products.map((p: any) => p.author_id).filter(Boolean))];

    // Fetch author profiles to attach securely
    const authorMap = new Map<string, any>();
    if (authorIds.length > 0) {
      const { data: profiles } = await (admin as any)
        .from("profiles")
        .select("id, full_name, avatar_url, specialty, academy_name")
        .in("id", authorIds);

      (profiles || []).forEach((prof: any) => {
        authorMap.set(prof.id, prof);
      });
    }

    const sanitized = products.map((p: any) => {
      const isAuthor = user && user.id === p.author_id;
      const productWithProfile = {
        ...p,
        profiles: authorMap.get(p.author_id) || undefined,
      };

      if (!isAuthor) {
        const { file_url, ...safeRest } = productWithProfile;
        return { ...safeRest, has_file: !!file_url };
      }
      return productWithProfile;
    });

    return NextResponse.json({ products: sanitized });
  } catch (err: any) {
    console.error("[DigitalProducts GET] Unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la récupération des produits." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const {
      title,
      description,
      cover_image_url,
      file_url,
      file_name,
      file_size_bytes,
      price,
      category,
      tags,
      status,
      preview_url,
      author_id,
    } = body;

    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour publier un produit digital." },
        { status: 401 }
      );
    }

    const effectiveAuthorId = user.id;

    // 1. Validation des champs obligatoires
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Le titre du produit digital est obligatoire." },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "La description du produit digital est obligatoire." },
        { status: 400 }
      );
    }

    if (!file_url || !file_url.trim()) {
      return NextResponse.json(
        { error: "Veuillez téléverser le fichier du produit digital (PDF, eBook, etc.)." },
        { status: 400 }
      );
    }

    if (!cover_image_url || !cover_image_url.trim()) {
      return NextResponse.json(
        { error: "L'image de couverture est requise." },
        { status: 400 }
      );
    }

    // 2. RÈGLE TARIFAIRE : SEULS LES E-BOOKS ET GUIDES PDF SONT PLAFONNÉS À 25 $ MAX
    const numericPrice = parseFloat(price);
    const priceCheck = validateDigitalProductPrice(numericPrice, category, file_name);
    if (!priceCheck.isValid) {
      return NextResponse.json(
        { error: priceCheck.error },
        { status: 400 }
      );
    }

    // 3. Insertion en base de données
    const admin = getSupabaseAdmin();
    const productPayload = {
      author_id: effectiveAuthorId,
      title: title.trim(),
      description: description.trim(),
      cover_image_url: cover_image_url.trim(),
      file_url: file_url.trim(),
      file_name: file_name || null,
      file_size_bytes: file_size_bytes || null,
      price: numericPrice,
      category: category || "Autre",
      tags: Array.isArray(tags) ? tags : [],
      status: status === "published" ? "published" : "draft",
      preview_url: preview_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newProduct, error: insertError } = await (admin as any)
      .from("digital_products")
      .insert(productPayload)
      .select()
      .single();

    if (insertError) {
      console.error("[DigitalProducts POST] Insert error:", insertError);
      const isMissingTable =
        insertError.message?.includes("schema cache") ||
        insertError.message?.includes("digital_products") ||
        (insertError as any).code === "PGRST204" ||
        (insertError as any).code === "42P01";

      const userMessage = isMissingTable
        ? "La table 'digital_products' n'a pas encore été créée dans la base de données Supabase. Veuillez exécuter le script SQL 'prisma/add-digital-products.sql' dans votre console Supabase SQL Editor."
        : "Erreur lors de la sauvegarde du produit digital : " + insertError.message;

      return NextResponse.json(
        { error: userMessage },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: newProduct,
      message: "Produit digital publié avec succès !",
    });
  } catch (err: any) {
    console.error("[DigitalProducts POST] Critical error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur interne du serveur lors de la publication." },
      { status: 500 }
    );
  }
}
