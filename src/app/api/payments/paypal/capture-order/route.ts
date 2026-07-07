import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { capturePayPalOrder } from "@/lib/paypal";
import { createClient as createDirectClient } from "@supabase/supabase-js";

// Service client to bypass RLS for administrative operations (like creating orders/payments and updating profiles)
const supabaseAdmin = createDirectClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId requis." }, { status: 400 });
    }

    // Call PayPal capture API
    const captureData = await capturePayPalOrder(orderId);

    if (captureData.status !== "COMPLETED") {
      return NextResponse.json({
        error: `La capture PayPal a retourné un statut non complété: ${captureData.status}`,
        details: captureData,
      }, { status: 400 });
    }

    // Read the metadata from custom_id (formatted as "type:itemId:userId")
    const purchaseUnit = captureData.purchase_units?.[0];
    const customId = purchaseUnit?.payments?.captures?.[0]?.custom_id || purchaseUnit?.custom_id;

    if (!customId) {
      return NextResponse.json({ error: "Données de transaction 'custom_id' introuvables dans la réponse PayPal." }, { status: 400 });
    }

    const [type, itemId, metadataUserId] = customId.split(":");

    // Security check: Verify that the user who initiated the checkout matches the authenticated user
    if (metadataUserId !== user.id) {
      return NextResponse.json({ error: "Conflit d'utilisateur de transaction détecté." }, { status: 403 });
    }

    const captureId = purchaseUnit?.payments?.captures?.[0]?.id || crypto.randomUUID();
    const amountCaptured = parseFloat(purchaseUnit?.payments?.captures?.[0]?.amount?.value || "0");

    // 1. Process COURSE Payment
    if (type === "COURSE") {
      const dbOrderId = crypto.randomUUID();
      const paymentId = crypto.randomUUID();

      // Check course exists
      const { data: course } = await supabaseAdmin
        .from("courses")
        .select("id, price")
        .eq("id", itemId)
        .maybeSingle();

      if (!course) {
        return NextResponse.json({ error: "Cours introuvable pour validation finale." }, { status: 404 });
      }

      // Write Order records
      const orderNumber = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await supabaseAdmin.from("orders").insert({
        id: dbOrderId,
        order_number: orderNumber,
        user_id: user.id,
        status: "COMPLETED",
        subtotal: amountCaptured,
        discount_amount: 0,
        tax_amount: 0,
        total: amountCaptured,
        currency: "USD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);

      await supabaseAdmin.from("order_items").insert({
        id: crypto.randomUUID(),
        order_id: dbOrderId,
        course_id: course.id,
        unit_price: course.price,
        discount_amount: 0,
        final_price: amountCaptured,
        created_at: new Date().toISOString(),
      } as any);

      await supabaseAdmin.from("payments").insert({
        id: paymentId,
        order_id: dbOrderId,
        user_id: user.id,
        amount: amountCaptured,
        currency: "USD",
        provider: "PAYPAL",
        status: "PAID",
        provider_transaction_id: captureId,
        method: "PAYPAL",
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);

      // Create ACTIVE enrollment
      const { error: enrollErr } = await supabaseAdmin.from("enrollments").upsert({
        student_id: user.id,
        course_id: course.id,
        progress_percent: 0,
        status: "ACTIVE",
        enrolled_at: new Date().toISOString(),
      } as any, { onConflict: "student_id,course_id" });

      if (enrollErr) {
        console.error("[paypal-capture] Error upserting enrollment:", enrollErr.message);
      }

      return NextResponse.json({
        success: true,
        type: "COURSE",
        courseId: course.id,
        message: "Achat de cours validé avec succès par PayPal !",
      });
    }

    // 2. Process INSTRUCTOR_PLAN Subscription Upgrade
    if (type === "INSTRUCTOR_PLAN") {
      const planName = itemId.toUpperCase();
      const dbOrderId = crypto.randomUUID();
      const paymentId = crypto.randomUUID();

      // Write Order and Payment records
      const orderNumber = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await supabaseAdmin.from("orders").insert({
        id: dbOrderId,
        order_number: orderNumber,
        user_id: user.id,
        status: "COMPLETED",
        subtotal: amountCaptured,
        discount_amount: 0,
        tax_amount: 0,
        total: amountCaptured,
        currency: "USD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);

      await supabaseAdmin.from("order_items").insert({
        id: crypto.randomUUID(),
        order_id: dbOrderId,
        course_id: `plan_${planName.toLowerCase()}`,
        unit_price: amountCaptured,
        discount_amount: 0,
        final_price: amountCaptured,
        created_at: new Date().toISOString(),
      } as any);

      await supabaseAdmin.from("payments").insert({
        id: paymentId,
        order_id: dbOrderId,
        user_id: user.id,
        amount: amountCaptured,
        currency: "USD",
        provider: "PAYPAL",
        status: "PAID",
        provider_transaction_id: captureId,
        method: "PAYPAL",
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);

      // Update the instructor profile's plan in Supabase
      const { error: profileErr } = await supabaseAdmin
        .from("profiles")
        .update({ plan: planName })
        .eq("id", user.id);

      if (profileErr) {
        throw new Error(`Impossible de mettre à jour votre plan: ${profileErr.message}`);
      }

      return NextResponse.json({
        success: true,
        type: "INSTRUCTOR_PLAN",
        plan: planName,
        message: `Plan formateur mis à niveau vers ${planName} avec succès par PayPal !`,
      });
    }

    return NextResponse.json({ error: "Type de transaction non identifié." }, { status: 400 });
  } catch (err: any) {
    console.error("[paypal-capture-order] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la capture de la commande PayPal." }, { status: 500 });
  }
}
