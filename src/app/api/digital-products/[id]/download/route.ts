import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { searchParams } = new URL(req.url);
    const guestUser = searchParams.get("guestUser");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = getSupabaseAdmin();

    // 1. Récupérer le produit
    const { data: product, error: prodErr } = await (admin as any)
      .from("digital_products")
      .select("*")
      .eq("id", productId)
      .single();

    if (prodErr || !product) {
      return NextResponse.json({ error: "Produit digital introuvable." }, { status: 404 });
    }

    const currentUserId = user?.id || guestUser;

    // Si le produit est gratuit ($0), l'accès est libre
    const isFree = Number(product.price) === 0;

    let hasAccess = isFree;

    // Si l'utilisateur est l'auteur
    if (user && product.author_id === user.id) {
      hasAccess = true;
    }

    // Sinon, vérifier s'il a acheté le produit
    if (!hasAccess && currentUserId) {
      const { data: purchase } = await (admin as any)
        .from("digital_product_purchases")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (purchase) {
        hasAccess = true;
      }
    }

    // CONTRÔLE DE SÉCURITÉ STRICT : Refuser si non acheté
    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            "Accès refusé : Vous devez acheter ce produit numérique pour accéder à son fichier téléchargeable.",
        },
        { status: 403 }
      );
    }

    const fileUrl = product.file_url;

    // Si l'URL est sur Supabase Storage, générer une URL signée temporaire (durée 60 minutes)
    if (fileUrl && fileUrl.includes(".supabase.co/storage")) {
      try {
        const parts = fileUrl.split("/storage/v1/object/public/");
        if (parts.length > 1) {
          const [bucketName, ...filePathParts] = parts[1].split("/");
          const filePath = filePathParts.join("/");

          const { data: signedData } = await admin.storage
            .from(bucketName)
            .createSignedUrl(filePath, 3600);

          if (signedData?.signedUrl) {
            return NextResponse.redirect(signedData.signedUrl);
          }
        }
      } catch (signErr) {
        console.warn("[Download] Signed URL generation fallback:", signErr);
      }
    }

    // Rediriger vers l'URL directe du fichier
    return NextResponse.redirect(fileUrl);
  } catch (err: any) {
    console.error("[Download] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors du téléchargement." },
      { status: 500 }
    );
  }
}
