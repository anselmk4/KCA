import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayPalOrder } from "@/lib/paypal";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveCoursePricing } from "@/lib/payment-pricing";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { type, itemId, payInstallment, couponId, userEmail } = await req.json();

    if (!type || !itemId) {
      return NextResponse.json({ error: "Paramètres 'type' et 'itemId' requis." }, { status: 400 });
    }

    if (!user && type !== "DIGITAL_PRODUCT") {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const effectiveUserId =
      user?.id || (userEmail ? `email_${encodeURIComponent(userEmail)}` : `guest_${Date.now()}`);

    let baseAmount = 0;
    let customId = "";

    if (type === "COURSE") {
      const pricingResult = await resolveCoursePricing({
        courseId: itemId,
        payInstallment,
        couponId,
      });

      if (!pricingResult.data) {
        return NextResponse.json(
          { error: pricingResult.error || "Cours introuvable." },
          { status: pricingResult.status || 404 }
        );
      }

      baseAmount = pricingResult.data.baseAmount;
      customId = `COURSE:${itemId}:${user?.id || effectiveUserId}`;
    } else if (type === "INSTRUCTOR_PLAN") {
      const planPrices = {
        BASE: 19,
        PRO: 49,
        MAX: 200,
      };

      const selectedPlan = String(itemId).toUpperCase();
      const price = planPrices[selectedPlan as keyof typeof planPrices];

      if (!price) {
        return NextResponse.json({ error: "Plan d'abonnement invalide." }, { status: 400 });
      }

      baseAmount = price;
      customId = `INSTRUCTOR_PLAN:${selectedPlan}:${user?.id || effectiveUserId}`;
    } else if (type === "DIGITAL_PRODUCT") {
      const { data: product, error: prodErr } = await supabaseAdmin
        .from("digital_products")
        .select("id, price, title")
        .eq("id", itemId)
        .maybeSingle();

      if (prodErr || !product) {
        return NextResponse.json({ error: "Produit digital introuvable." }, { status: 404 });
      }

      baseAmount = Number(product.price);
      customId = `DIGITAL_PRODUCT:${itemId}:${effectiveUserId}`;
    } else {
      return NextResponse.json({ error: "Type de paiement non supporté." }, { status: 400 });
    }

    if (baseAmount <= 0) {
      return NextResponse.json(
        { error: "Le montant de la commande PayPal doit être supérieur à 0 USD." },
        { status: 400 }
      );
    }

    // Add +3% PayPal fee surcharge (amount + 3%)
    const paypalTotalAmount = Number((baseAmount * 1.03).toFixed(2));

    const order = await createPayPalOrder(paypalTotalAmount, customId);

    return NextResponse.json({ orderId: order.id, amount: paypalTotalAmount });
  } catch (err: any) {
    console.error("[paypal-create-order] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la création de la commande PayPal." },
      { status: 500 }
    );
  }
}
