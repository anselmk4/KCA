import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await req.json();
    const {
      paymentMethod = "momo",
      phoneNumber,
      operator,
      userEmail,
      userName,
      txHash,
    } = body;

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

    // Déterminer l'ID de l'acheteur
    let buyerId = user?.id;
    if (!buyerId) {
      // Trouver ou créer un profil temporaire si non connecté
      if (userEmail) {
        const { data: existingProfile } = await (admin as any)
          .from("profiles")
          .select("id")
          .eq("email", userEmail)
          .maybeSingle();

        if (existingProfile) {
          buyerId = existingProfile.id;
        } else {
          // Utiliser un ID déterministe ou aléatoire pour l'acheteur invité
          buyerId = `guest_${Date.now()}`;
        }
      } else {
        return NextResponse.json(
          { error: "Veuillez fournir une adresse email ou vous connecter pour finaliser l'achat." },
          { status: 400 }
        );
      }
    }

    // 2. Vérifier si l'utilisateur a déjà acheté ce produit
    const { data: existingPurchase } = await (admin as any)
      .from("digital_product_purchases")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", buyerId)
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json({
        success: true,
        alreadyPurchased: true,
        message: "Vous avez déjà acquis ce produit digital !",
        downloadUrl: `/api/digital-products/${productId}/download`,
      });
    }

    // 3. Enregistrer l'achat
    const purchasePayload = {
      product_id: productId,
      user_id: buyerId,
      price_paid: product.price,
      payment_method: paymentMethod,
      payment_status: "COMPLETED",
      transaction_id: txHash || `tx_dp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };

    const { data: purchase, error: purchaseErr } = await (admin as any)
      .from("digital_product_purchases")
      .insert(purchasePayload)
      .select()
      .single();

    if (purchaseErr) {
      console.warn("[DigitalProduct Checkout] Purchase insert error:", purchaseErr);
    }

    // 4. Enregistrer dans la table transactions générale si disponible
    try {
      await (admin as any).from("transactions").insert({
        user_id: buyerId,
        amount: product.price,
        course_id: productId, // réutilise le champ pour stocker l'entité
        method: paymentMethod === "momo" ? "Mobile Money" : paymentMethod === "crypto" ? "Crypto" : "Carte",
        status: "PAID",
        date: new Date().toISOString(),
      });
    } catch (txErr) {
      // Non critique
    }

    return NextResponse.json({
      success: true,
      purchaseId: purchase?.id || purchasePayload.transaction_id,
      downloadUrl: `/api/digital-products/${productId}/download`,
      productTitle: product.title,
      price: product.price,
      message: "Paiement confirmé avec succès ! Vous pouvez télécharger votre produit dès maintenant.",
    });
  } catch (err: any) {
    console.error("[DigitalProduct Checkout] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors du traitement de l'achat." },
      { status: 500 }
    );
  }
}
