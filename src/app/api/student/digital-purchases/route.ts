import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateDigitalProductToken } from "@/lib/digital-product-token";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    // 1. Récupérer les achats confirmés de l'utilisateur
    const { data: purchases, error: purErr } = await (admin as any)
      .from("digital_product_purchases")
      .select(`
        id,
        product_id,
        price_paid,
        payment_method,
        payment_status,
        created_at,
        digital_products:product_id (
          id,
          title,
          description,
          cover_image_url,
          file_name,
          file_size_bytes,
          category,
          price,
          author_id,
          profiles:author_id (
            full_name,
            avatar_url,
            academy_name
          )
        )
      `)
      .eq("user_id", user.id)
      .eq("payment_status", "COMPLETED")
      .order("created_at", { ascending: false });

    if (purErr) {
      console.error("[student/digital-purchases] Query error:", purErr);
      return NextResponse.json({ purchases: [] });
    }

    // 2. Formater les résultats et générer les URLs sécurisées
    const formatted = (purchases || []).map((pur: any) => {
      const product = pur.digital_products;
      const downloadToken = generateDigitalProductToken(
        pur.product_id,
        pur.id,
        user.id,
        72 // 72 heures d'accès direct renouvelé à chaque affichage de l'espace apprenant
      );

      return {
        purchaseId: pur.id,
        productId: pur.product_id,
        title: product?.title || "Produit Numérique",
        description: product?.description || "",
        coverImageUrl: product?.cover_image_url || "/placeholder-course.jpg",
        fileName: product?.file_name || "Document numérique.pdf",
        fileSizeBytes: product?.file_size_bytes || 0,
        category: product?.category || "E-book & Guide",
        pricePaid: pur.price_paid,
        paymentMethod: pur.payment_method,
        purchasedAt: pur.created_at,
        authorName: product?.profiles?.full_name || product?.profiles?.academy_name || "Auteur certifié",
        authorAvatar: product?.profiles?.avatar_url || null,
        downloadUrl: `/api/digital-products/${pur.product_id}/download?token=${downloadToken}`,
      };
    });

    return NextResponse.json({ purchases: formatted });
  } catch (err: any) {
    console.error("[student/digital-purchases] Exception:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
