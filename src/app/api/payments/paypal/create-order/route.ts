import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayPalOrder } from "@/lib/paypal";

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

    let amount = 0;
    let customId = ""; // Used to pass metadata to capture phase: "type:itemId:userId"

    if (type === "COURSE") {
      // 1. Fetch course details from DB to get the correct price (avoid client-side price tampering)
      const { data: course, error: courseError } = await (supabase as any)
        .from("courses")
        .select("price, title, allow_installments, installments_count")
        .eq("id", itemId)
        .maybeSingle();

      if (courseError || !course) {
        return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
      }

      let coursePrice = course.price;
      if (payInstallment && course.allow_installments && course.installments_count) {
        coursePrice = Math.round(course.price / course.installments_count);
      }

      // Apply coupon if any
      if (couponId) {
        const { data: coupon } = await (supabase as any)
          .from("coupons")
          .select("*")
          .eq("id", couponId)
          .eq("is_active", true)
          .maybeSingle();

        if (coupon) {
          if (coupon.discount_type === "PERCENTAGE") {
            coursePrice = Math.max(0, coursePrice - (coursePrice * (coupon.discount_value / 100)));
          } else if (coupon.discount_type === "FIXED") {
            coursePrice = Math.max(0, coursePrice - coupon.discount_value);
          }
          coursePrice = Math.round(coursePrice);
        }
      }

      amount = coursePrice;
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

      amount = price;
      customId = `INSTRUCTOR_PLAN:${selectedPlan}:${user.id}`;
    } else {
      return NextResponse.json({ error: "Type de paiement non supporté." }, { status: 400 });
    }

    // Call PayPal API to create checkout order
    const order = await createPayPalOrder(amount, customId);

    return NextResponse.json({ orderId: order.id });
  } catch (err: any) {
    console.error("[paypal-create-order] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la création de la commande PayPal." }, { status: 500 });
  }
}
