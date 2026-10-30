import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateDigitalProductToken } from "@/lib/digital-product-token";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await req.json().catch(() => ({}));
    const { userEmail } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = getSupabaseAdmin();

    // 1. Récupérer le produit digital
    const { data: product, error: prodErr } = await (admin as any)
      .from("digital_products")
      .select("*")
      .eq("id", productId)
      .single();

    if (prodErr || !product) {
      return NextResponse.json({ error: "Produit digital introuvable." }, { status: 404 });
    }

    const productPrice = Number(product.price) || 0;

    // 2. SÉCURITÉ CRITIQUE : Interdire la validation directe sans passerelle de paiement pour tout produit payant
    if (productPrice > 0) {
      // Vérifier uniquement si l'utilisateur authentifié possède déjà un achat COMPLETED
      if (user) {
        const { data: existingPurchase } = await (admin as any)
          .from("digital_product_purchases")
          .select("id")
          .eq("product_id", productId)
          .eq("user_id", user.id)
          .eq("payment_status", "COMPLETED")
          .maybeSingle();

        if (existingPurchase) {
          const token = generateDigitalProductToken(
            productId,
            existingPurchase.id,
            user.email || user.id,
            168
          );
          return NextResponse.json({
            success: true,
            alreadyPurchased: true,
            message: "Vous avez déjà acquis ce produit digital !",
            downloadUrl: `/api/digital-products/${productId}/download?token=${token}`,
          });
        }
      }

      return NextResponse.json(
        {
          error:
            "Ce produit est payant. Veuillez finaliser le règlement via Mobile Money (pawaPay) ou Carte/PayPal.",
        },
        { status: 402 }
      );
    }

    // 3. Cas d'un produit explicitement GRATUIT (price === 0)
    if (!user) {
      return NextResponse.json(
        { error: "Veuillez vous connecter pour télécharger cette ressource gratuite." },
        { status: 401 }
      );
    }

    const buyerId = user.id;

    const { data: existingFreePurchase } = await (admin as any)
      .from("digital_product_purchases")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", buyerId)
      .maybeSingle();

    let purchaseId = existingFreePurchase?.id;

    if (!purchaseId) {
      const txRef = `free_dp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const { data: purchase } = await (admin as any)
        .from("digital_product_purchases")
        .insert({
          product_id: productId,
          user_id: buyerId,
          price_paid: 0,
          payment_method: "free",
          payment_status: "COMPLETED",
          transaction_id: txRef,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      purchaseId = purchase?.id || txRef;
    }

    const token = generateDigitalProductToken(
      productId,
      String(purchaseId),
      user.email || userEmail || buyerId,
      168
    );

    return NextResponse.json({
      success: true,
      purchaseId,
      downloadUrl: `/api/digital-products/${productId}/download?token=${token}`,
      productTitle: product.title,
      price: 0,
      message: "Accès gratuit confirmé ! Vous pouvez télécharger votre produit dès maintenant.",
    });
  } catch (err: any) {
    console.error("[DigitalProduct Checkout] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors du traitement de l'achat." },
      { status: 500 }
    );
  }
}
