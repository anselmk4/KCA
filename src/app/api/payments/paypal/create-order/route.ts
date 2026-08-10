import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayPalOrder } from "@/lib/paypal";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { type, itemId, payInstallment, couponId } = await req.json(); // type: "COURSE" or "INSTRUCTOR_PLAN", itemId: courseId or planName

    if (!type || !itemId) {
      return NextResponse.json({ error: "Paramètres 'type' et 'itemId' requis." }, { status: 400 });
    }

    let baseAmount = 0;
    let customId = ""; // Used to pass metadata to capture phase: "type:itemId:userId"

    if (type === "COURSE") {
      // 1. Fetch course details from DB to get the correct price (avoid client-side price tampering)
      const { data: course, error: courseError } = await supabaseAdmin
        .from("courses")
        .select("price, title, allow_installments, installments_count")
        .eq("id", itemId)
        .maybeSingle();

      if (courseError || !course) {
        return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
      }

      const originalPrice = course.price;
      let installmentCount = 1;
      if (payInstallment === 2) {
        installmentCount = 2;
      } else if (payInstallment === 3 || payInstallment === true) {
        installmentCount = course.installments_count || 3;
      } else if (typeof payInstallment === 'number' && payInstallment > 1) {
        installmentCount = payInstallment;
      }

      let fullCourseDiscount = 0;
      if (couponId) {
        const { data: coupon } = await supabaseAdmin
          .from("coupons")
          .select("*")
          .eq("id", couponId)
          .eq("is_active", true)
          .maybeSingle();

        if (coupon) {
          if (coupon.discount_type === "PERCENTAGE") {
            fullCourseDiscount = Math.round(originalPrice * (coupon.discount_value / 100));
          } else if (coupon.discount_type === "FIXED") {
            fullCourseDiscount = coupon.discount_value;
          }
        }
      }

      const discountedTotalCoursePrice = Math.max(0, originalPrice - fullCourseDiscount);
      baseAmount = Math.max(0, Math.round(discountedTotalCoursePrice / installmentCount));
      customId = `COURSE:${itemId}:${user.id}`;
    } else if (type === "INSTRUCTOR_PLAN") {
      // 2. Resolve plan price
      const planPrices = {
        BASE: 19,
        PRO: 49,
        MAX: 200,
      };

      const selectedPlan = itemId.toUpperCase();
      const price = planPrices[selectedPlan as keyof typeof planPrices];

      if (!price) {
        return NextResponse.json({ error: "Plan d'abonnement invalide." }, { status: 400 });
      }

      baseAmount = price;
      customId = `INSTRUCTOR_PLAN:${selectedPlan}:${user.id}`;
    } else {
      return NextResponse.json({ error: "Type de paiement non supporté." }, { status: 400 });
    }

    // Add +3% PayPal fee surcharge (amount + 3%)
    const paypalTotalAmount = Number((baseAmount * 1.03).toFixed(2));

    // Call PayPal API to create checkout order with +3% fee surcharge included
    const order = await createPayPalOrder(paypalTotalAmount, customId);

    return NextResponse.json({ orderId: order.id, amount: paypalTotalAmount });
  } catch (err: any) {
    console.error("[paypal-create-order] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la création de la commande PayPal." }, { status: 500 });
  }
}
