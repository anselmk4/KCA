import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { capturePayPalOrder } from "@/lib/paypal";
import { createClient as createDirectClient } from "@supabase/supabase-js";

// Service client to bypass RLS for administrative operations
const supabaseAdmin = createDirectClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  console.log("[paypal-capture-order] API Route invoked.");
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[paypal-capture-order] Authentication failed:", userError?.message || "No user session");
      return NextResponse.json({ error: "Non authentifié. Veuillez vous connecter." }, { status: 401 });
    }

    // Determine the database client: use supabaseAdmin if the service role key is valid, otherwise use the authenticated user's client (which satisfies RLS checked columns)
    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && 
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin 
      : supabase;

    const { orderId } = await req.json();
    console.log(`[paypal-capture-order] Order ID received: ${orderId} for User: ${user.id}`);

    if (!orderId) {
      return NextResponse.json({ error: "orderId requis." }, { status: 400 });
    }

    // Call PayPal capture API
    console.log("[paypal-capture-order] Calling PayPal capture SDK...");
    const captureData = await capturePayPalOrder(orderId);
    console.log("[paypal-capture-order] PayPal capture status:", captureData.status);

    if (captureData.status !== "COMPLETED") {
      return NextResponse.json({
        error: `La capture PayPal a retourné un statut non complété: ${captureData.status}`,
        details: captureData,
      }, { status: 400 });
    }

    // Read the metadata from custom_id (formatted as "type:itemId:userId")
    const purchaseUnit = captureData.purchase_units?.[0];
    let customId = purchaseUnit?.payments?.captures?.[0]?.custom_id || purchaseUnit?.custom_id;

    // Fallback: if custom_id is not in capture response, fetch it from order details
    if (!customId) {
      console.log("[paypal-capture-order] custom_id not found in capture response. Fetching order details from PayPal as fallback...");
      try {
        const accessToken = await new Promise<string>((resolve, reject) => {
          const auth = Buffer.from(`${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
          const https = require('node:https');
          const reqToken = https.request({
            hostname: (process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com').replace("https://", ""),
            path: '/v1/oauth2/token',
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            }
          }, (resToken: any) => {
            let body = '';
            resToken.on('data', (c: any) => body += c);
            resToken.on('end', () => {
              if (resToken.statusCode === 200) {
                resolve(JSON.parse(body).access_token);
              } else {
                reject(new Error(`Status: ${resToken.statusCode}`));
              }
            });
          });
          reqToken.on('error', reject);
          reqToken.write('grant_type=client_credentials');
          reqToken.end();
        });

        const orderDetails = await new Promise<any>((resolve, reject) => {
          const https = require('node:https');
          const reqDetails = https.request({
            hostname: (process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com').replace("https://", ""),
            path: `/v2/checkout/orders/${orderId}`,
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            }
          }, (resDetails: any) => {
            let body = '';
            resDetails.on('data', (c: any) => body += c);
            resDetails.on('end', () => resolve(JSON.parse(body)));
          });
          reqDetails.on('error', reject);
          reqDetails.end();
        });

        customId = orderDetails.purchase_units?.[0]?.custom_id;
        console.log("[paypal-capture-order] Fallback customId fetched:", customId);
      } catch (fallbackErr: any) {
        console.error("[paypal-capture-order] Fallback to order details failed:", fallbackErr.message);
      }
    }

    if (!customId) {
      return NextResponse.json({ error: "Données de transaction 'custom_id' (metadata) introuvables." }, { status: 400 });
    }

    const [type, itemId, metadataUserId] = customId.split(":");
    console.log(`[paypal-capture-order] Parsed customId metadata -> Type: ${type}, ItemID: ${itemId}, MetadataUserID: ${metadataUserId}`);

    // Security check
    if (metadataUserId !== user.id) {
      console.error(`[paypal-capture-order] Security violation. metadataUserId (${metadataUserId}) !== authenticated user.id (${user.id})`);
      return NextResponse.json({ error: "Conflit d'utilisateur de transaction détecté." }, { status: 403 });
    }

    const captureId = purchaseUnit?.payments?.captures?.[0]?.id || crypto.randomUUID();
    const amountCaptured = parseFloat(purchaseUnit?.payments?.captures?.[0]?.amount?.value || "0");
    console.log(`[paypal-capture-order] Capture reference ID: ${captureId}, Amount: ${amountCaptured}`);

    // 1. Process COURSE Payment
    if (type === "COURSE") {
      const dbOrderId = crypto.randomUUID();
      const paymentId = crypto.randomUUID();

      // Check course exists
      const { data: course, error: courseErr } = await dbClient
        .from("courses")
        .select("id, price, title, instructor_id")
        .eq("id", itemId)
        .maybeSingle();

      if (courseErr || !course) {
        console.error("[paypal-capture-order] Course fetch error or missing course:", courseErr?.message);
        return NextResponse.json({ error: "Cours introuvable pour validation finale." }, { status: 404 });
      }

      // Write Order record
      const orderNumber = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { error: orderInsertErr } = await dbClient.from("orders").insert({
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

      if (orderInsertErr) {
        console.error("[paypal-capture-order] Error inserting order:", orderInsertErr.message);
        return NextResponse.json({ error: `Erreur d'enregistrement de commande: ${orderInsertErr.message}` }, { status: 500 });
      }

      // Write Order Item
      const { error: itemInsertErr } = await dbClient.from("order_items").insert({
        id: crypto.randomUUID(),
        order_id: dbOrderId,
        course_id: course.id,
        unit_price: course.price,
        discount_amount: 0,
        final_price: amountCaptured,
        created_at: new Date().toISOString(),
      } as any);

      if (itemInsertErr) {
        console.error("[paypal-capture-order] Error inserting order item:", itemInsertErr.message);
        return NextResponse.json({ error: `Erreur d'enregistrement d'item de commande: ${itemInsertErr.message}` }, { status: 500 });
      }

      // Write Payment
      const { error: paymentInsertErr } = await dbClient.from("payments").insert({
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

      if (paymentInsertErr) {
        console.error("[paypal-capture-order] Error inserting payment:", paymentInsertErr.message);
        return NextResponse.json({ error: `Erreur d'enregistrement de paiement: ${paymentInsertErr.message}` }, { status: 500 });
      }

      // Create ACTIVE enrollment
      console.log(`[paypal-capture-order] Upserting enrollment for user: ${user.id}, course: ${course.id}`);
      const { error: enrollErr } = await dbClient.from("enrollments").upsert({
        student_id: user.id,
        course_id: course.id,
        progress_percent: 0,
        status: "ACTIVE",
        enrolled_at: new Date().toISOString(),
      } as any, { onConflict: "student_id,course_id" });

      if (enrollErr) {
        console.error("[paypal-capture-order] Error upserting enrollment:", enrollErr.message);
        return NextResponse.json({ error: `Erreur d'inscription de l'apprenant: ${enrollErr.message}` }, { status: 500 });
      }

      // Trigger notifications
      try {
        const { createNotification } = await import("@/lib/supabase/notifications-helper");
        
        // Student Notification
        await createNotification({
          userId: user.id,
          title: "Paiement validé !",
          message: `Votre paiement de ${amountCaptured}$ pour le cours "${course.title}" a été validé.`,
          type: "SUCCESS",
          link: `/dashboard/courses`
        });

        // Instructor Notification
        if (course.instructor_id) {
          const { data: studentProfile } = await dbClient
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

          const studentName = studentProfile?.full_name || "Un apprenant";

          await createNotification({
            userId: course.instructor_id,
            title: "Nouvelle inscription !",
            message: `"${studentName}" s'est inscrit à votre cours "${course.title}".`,
            type: "SUCCESS",
            link: `/instructor/students`
          });
        }
      } catch (notifErr) {
        console.error("[paypal-capture-order] Error triggering purchase notifications:", notifErr);
      }

      console.log("[paypal-capture-order] Course enrollment written successfully!");
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

      console.log(`[paypal-capture-order] Processing instructor plan upgrade to: ${planName}`);

      // Write Order and Payment records
      const orderNumber = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { error: orderInsertErr } = await dbClient.from("orders").insert({
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

      if (orderInsertErr) {
        console.error("[paypal-capture-order] Error plan upgrade orders insert:", orderInsertErr.message);
        return NextResponse.json({ error: `Erreur d'enregistrement commande plan: ${orderInsertErr.message}` }, { status: 500 });
      }

      const planUuidMap: Record<string, string> = {
        BASE: "99999999-9999-9999-9999-999999990001",
        PRO: "99999999-9999-9999-9999-999999990002",
        MAX: "99999999-9999-9999-9999-999999990003",
      };
      const planCourseId = planUuidMap[planName] || planUuidMap.BASE;

      const { error: itemInsertErr } = await dbClient.from("order_items").insert({
        id: crypto.randomUUID(),
        order_id: dbOrderId,
        course_id: planCourseId,
        unit_price: amountCaptured,
        discount_amount: 0,
        final_price: amountCaptured,
        created_at: new Date().toISOString(),
      } as any);

      if (itemInsertErr) {
        console.error("[paypal-capture-order] Error plan upgrade order items insert:", itemInsertErr.message);
        return NextResponse.json({ error: `Erreur d'enregistrement item plan: ${itemInsertErr.message}` }, { status: 500 });
      }

      const { error: paymentInsertErr } = await dbClient.from("payments").insert({
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

      if (paymentInsertErr) {
        console.error("[paypal-capture-order] Error plan upgrade payment insert:", paymentInsertErr.message);
        return NextResponse.json({ error: `Erreur d'enregistrement paiement plan: ${paymentInsertErr.message}` }, { status: 500 });
      }

      // Update the instructor profile's plan in Supabase
      console.log(`[paypal-capture-order] Upgrading profile plan to: ${planName} for user: ${user.id}`);
      const { error: profileErr } = await dbClient
        .from("profiles")
        .update({ plan: planName })
        .eq("id", user.id);

      if (profileErr) {
        console.error("[paypal-capture-order] Error updating profile plan:", profileErr.message);
        return NextResponse.json({ error: `Impossible de mettre à jour votre plan: ${profileErr.message}` }, { status: 500 });
      }

      // Trigger notification
      try {
        const { createNotification } = await import("@/lib/supabase/notifications-helper");
        await createNotification({
          userId: user.id,
          title: "Plan mis à jour !",
          message: `Votre abonnement de formateur a été mis à jour vers le plan "${planName}".`,
          type: "SUCCESS",
          link: `/instructor/billing`
        });
      } catch (notifErr) {
        console.error("[paypal-capture-order] Error triggering plan notification:", notifErr);
      }

      console.log("[paypal-capture-order] Profile plan updated successfully!");
      return NextResponse.json({
        success: true,
        type: "INSTRUCTOR_PLAN",
        plan: planName,
        message: `Plan formateur mis à niveau vers ${planName} avec succès par PayPal !`,
      });
    }

    return NextResponse.json({ error: "Type de transaction non identifié." }, { status: 400 });
  } catch (err: any) {
    console.error("[paypal-capture-order] Critical exception:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la capture de la commande PayPal." }, { status: 500 });
  }
}
