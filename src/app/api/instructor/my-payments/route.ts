import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createDirectClient } from "@supabase/supabase-js";

const supabaseAdmin = createDirectClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PLAN_LABELS: Record<string, string> = {
  plan_base: "Abonnement Plan Base",
  plan_pro: "Abonnement Plan Pro",
  plan_max: "Abonnement Plan Max",
};

const PROVIDER_LABELS: Record<string, string> = {
  PAYPAL: "PayPal",
  MOBILE_MONEY: "Mobile Money",
  STRIPE: "Stripe / Carte",
  CRYPTO: "Cryptomonnaie",
  MANUAL: "Validation manuelle",
};

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // Fetch all payments made by this instructor (includes their plan subscriptions)
    const { data: paymentsData, error: paymentsError } = await supabaseAdmin
      .from("payments")
      .select("id, order_id, amount, currency, status, provider, provider_transaction_id, paid_at, created_at")
      .eq("user_id", user.id)
      .eq("status", "PAID")
      .order("paid_at", { ascending: false });

    if (paymentsError) {
      return NextResponse.json({ error: paymentsError.message }, { status: 400 });
    }

    const payments = paymentsData || [];
    if (payments.length === 0) {
      return NextResponse.json({ payments: [] });
    }

    const orderIds = payments.map((p) => p.order_id).filter(Boolean);

    // Fetch order items to get course_id for each order
    const { data: orderItems } = await supabaseAdmin
      .from("order_items")
      .select("order_id, course_id")
      .in("order_id", orderIds);

    const orderItemMap = new Map((orderItems || []).map((oi) => [oi.order_id, oi.course_id]));

    const result = await Promise.all(
      payments.map(async (p) => {
        const courseId = orderItemMap.get(p.order_id) || "";
        let label = "Formation";

        if (courseId.startsWith("plan_")) {
          label = PLAN_LABELS[courseId] || `Abonnement ${courseId.replace("plan_", "").toUpperCase()}`;
        } else if (courseId) {
          const { data: course } = await supabaseAdmin
            .from("courses")
            .select("title")
            .eq("id", courseId)
            .maybeSingle();
          label = course?.title || "Formation";
        }

        return {
          id: p.id,
          orderId: p.order_id,
          label,
          amount: p.amount,
          currency: p.currency || "USD",
          provider: PROVIDER_LABELS[p.provider] || p.provider || "—",
          transactionRef: p.provider_transaction_id || null,
          date: p.paid_at || p.created_at,
        };
      })
    );

    return NextResponse.json({ payments: result });
  } catch (err: any) {
    console.error("[instructor/my-payments GET] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur interne." }, { status: 500 });
  }
}
