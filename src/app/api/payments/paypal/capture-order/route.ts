import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { capturePayPalOrder } from "@/lib/paypal";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { incrementCouponUses } from "@/lib/supabase/orders-helper";

export async function POST(req: NextRequest) {
  console.log("[paypal-capture-order] API Route invoked.");
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Determine the database client: use supabaseAdmin if the service role key is valid, otherwise use the authenticated user's client (which satisfies RLS checked columns)
    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && 
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin 
      : supabase;

    const { orderId } = await req.json();
    console.log(`[paypal-capture-order] Order ID received: ${orderId} for User: ${user?.id || 'guest'}`);

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

    // If type is COURSE or INSTRUCTOR_PLAN, a user session is strictly required
    if (type !== "DIGITAL_PRODUCT") {
      if (!user || metadataUserId !== user.id) {
        console.error(`[paypal-capture-order] Security violation. metadataUserId (${metadataUserId}) !== authenticated user.id (${user?.id})`);
        return NextResponse.json({ error: "Conflit d'utilisateur de transaction détecté." }, { status: 403 });
      }
    }

    const captureId = purchaseUnit?.payments?.captures?.[0]?.id || crypto.randomUUID();
    const amountCaptured = parseFloat(purchaseUnit?.payments?.captures?.[0]?.amount?.value || "0");
    console.log(`[paypal-capture-order] Capture reference ID: ${captureId}, Amount: ${amountCaptured}`);

    // 1. Process COURSE Payment
    if (type === "COURSE") {
      if (!user) {
        return NextResponse.json({ error: "Non authentifié pour l'achat de formation." }, { status: 401 });
      }
      const activeUserId = user.id;
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
        user_id: activeUserId,
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

      // Increment coupon uses if applicable
      await incrementCouponUses(dbOrderId, dbClient);

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
        user_id: activeUserId,
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
      console.log(`[paypal-capture-order] Upserting enrollment for user: ${activeUserId}, course: ${course.id}`);
      const { error: enrollErr } = await dbClient.from("enrollments").upsert({
        student_id: activeUserId,
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
          userId: activeUserId,
          title: "Paiement validé !",
          message: `Votre paiement de ${amountCaptured}$ pour le cours "${course.title}" a été validé.`,
          type: "SUCCESS",
          link: `/dashboard/courses`
        });

        // Instructor Notification + Email
        if (course.instructor_id) {
          const { data: instructorProfile } = await dbClient
            .from("profiles")
            .select("full_name, email")
            .eq("id", course.instructor_id)
            .maybeSingle();

          const { data: studentProfile } = await dbClient
            .from("profiles")
            .select("full_name")
            .eq("id", activeUserId)
            .maybeSingle();

          const studentName = studentProfile?.full_name || "Un apprenant";

          await createNotification({
            userId: course.instructor_id,
            title: "Nouvelle inscription !",
            message: `"${studentName}" s'est inscrit à votre cours "${course.title}".`,
            type: "SUCCESS",
            link: `/instructor/students`
          });

          // Send purchase alert to instructor
          if (instructorProfile?.email) {
            const { sendInstructorCoursePurchasedEmail } = await import("@/lib/email");
            await sendInstructorCoursePurchasedEmail(
              instructorProfile.email,
              instructorProfile.full_name || "Formateur",
              studentName,
              course.title,
              amountCaptured
            );
          }
        }

        // Send invoice to student
        const { sendInvoiceEmail } = await import("@/lib/email");
        await sendInvoiceEmail(
          user?.email || "",
          user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Apprenant",
          orderNumber,
          amountCaptured,
          course.title,
          "Accès complet et illimité à la formation."
        );
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
      if (!user) {
        return NextResponse.json({ error: "Non authentifié pour l'abonnement formateur." }, { status: 401 });
      }
      const activeInstructorId = user.id;
      const planName = itemId.toUpperCase();
      const dbOrderId = crypto.randomUUID();
      const paymentId = crypto.randomUUID();

      console.log(`[paypal-capture-order] Processing instructor plan upgrade to: ${planName}`);

      // Write Order and Payment records
      const orderNumber = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { error: orderInsertErr } = await dbClient.from("orders").insert({
        id: dbOrderId,
        order_number: orderNumber,
        user_id: activeInstructorId,
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
        user_id: activeInstructorId,
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
      console.log(`[paypal-capture-order] Upgrading profile plan to: ${planName} for user: ${activeInstructorId}`);
      const { error: profileErr } = await dbClient
        .from("profiles")
        .update({ plan: planName })
        .eq("id", activeInstructorId);

      if (profileErr) {
        console.error("[paypal-capture-order] Error updating profile plan:", profileErr.message);
        return NextResponse.json({ error: `Impossible de mettre à jour votre plan: ${profileErr.message}` }, { status: 500 });
      }

      // Trigger notification + Email invoice
      try {
        const { createNotification } = await import("@/lib/supabase/notifications-helper");
        await createNotification({
          userId: activeInstructorId,
          title: "Plan mis à jour !",
          message: `Votre abonnement de formateur a été mis à jour vers le plan "${planName}".`,
          type: "SUCCESS",
          link: `/instructor/billing`
        });

        // Send invoice to instructor
        const { sendInvoiceEmail } = await import("@/lib/email");
        await sendInvoiceEmail(
          user?.email || "",
          user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Formateur",
          orderNumber,
          amountCaptured,
          `Abonnement Formateur — Plan ${planName}`,
          "Mise à niveau et accès illimité aux fonctionnalités formateur."
        );
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

    // 3. Process DIGITAL_PRODUCT Purchase
    if (type === "DIGITAL_PRODUCT") {
      console.log(`[paypal-capture-order] Processing DIGITAL_PRODUCT purchase for: ${itemId}`);

      const { data: product, error: prodErr } = await dbClient
        .from("digital_products")
        .select("id, title, price, author_id")
        .eq("id", itemId)
        .maybeSingle();

      if (prodErr || !product) {
        console.error("[paypal-capture-order] Digital product fetch error:", prodErr?.message);
        return NextResponse.json({ error: "Produit digital introuvable pour validation finale." }, { status: 404 });
      }

      const buyerId = user?.id || (metadataUserId.startsWith("email_") ? decodeURIComponent(metadataUserId.replace("email_", "")) : metadataUserId);
      const buyerEmail = user?.email || (metadataUserId.startsWith("email_") ? decodeURIComponent(metadataUserId.replace("email_", "")) : "");

      // Enregistrer l'achat dans digital_product_purchases
      let purchaseRecordId = captureId;
      try {
        const { data: purRow } = await dbClient.from("digital_product_purchases").upsert({
          product_id: itemId,
          user_id: buyerId,
          price_paid: amountCaptured || product.price,
          payment_method: "paypal",
          payment_status: "COMPLETED",
          transaction_id: captureId,
          created_at: new Date().toISOString(),
        } as any, { onConflict: "product_id,user_id" }).select("id").maybeSingle();

        if (purRow?.id) {
          purchaseRecordId = purRow.id;
        }
      } catch (purErr: any) {
        console.warn("[paypal-capture-order] digital_product_purchases upsert warning:", purErr?.message);
      }

      // Enregistrer dans la table transactions générale
      try {
        await (dbClient as any).from("transactions").insert({
          user_id: buyerId,
          amount: amountCaptured || product.price,
          course_id: itemId,
          method: "PayPal",
          status: "PAID",
          date: new Date().toISOString(),
        } as any);
      } catch (txErr: any) {
        console.warn("[paypal-capture-order] transactions insert warning:", txErr?.message);
      }

      // Génération du jeton cryptographique sécurisé (durée 48 heures)
      const { generateDigitalProductToken } = await import("@/lib/digital-product-token");
      const downloadToken = generateDigitalProductToken(
        itemId,
        purchaseRecordId,
        buyerId,
        48
      );
      const downloadUrl = `/api/digital-products/${itemId}/download?token=${downloadToken}`;

      // Envoi de la facture / notification
      if (buyerEmail) {
        try {
          const { sendInvoiceEmail } = await import("@/lib/email");
          await sendInvoiceEmail(
            buyerEmail,
            user?.user_metadata?.full_name || buyerEmail.split("@")[0] || "Client",
            `DP-${captureId.substring(0, 8).toUpperCase()}`,
            amountCaptured || product.price,
            product.title,
            "Produit digital téléchargeable immédiatement via votre lien sécurisé."
          );
        } catch (emailErr) {
          console.warn("[paypal-capture-order] Invoice email warning:", emailErr);
        }
      }

      // Notifier l'auteur / formateur
      if (product.author_id) {
        try {
          const { data: authorProfile } = await dbClient
            .from("profiles")
            .select("email, full_name, plan")
            .eq("id", product.author_id)
            .maybeSingle();

          const instPlan = authorProfile?.plan || "FREE";
          const commissionRate = instPlan === "FREE" ? 0.20 : (instPlan === "BASE" ? 0.10 : (instPlan === "PRO" ? 0.05 : 0.0));
          const actualAmount = amountCaptured || product.price;
          const platformFee = actualAmount * commissionRate;
          const instructorEarnings = actualAmount - platformFee;

          const { createNotification } = await import("@/lib/supabase/notifications-helper");
          await createNotification({
            userId: product.author_id,
            title: "Nouvelle vente de produit digital !",
            message: `Un exemplaire de "${product.title}" a été vendu via PayPal (${actualAmount} $). Vos gains nets : $${instructorEarnings.toFixed(2)} (Commission : ${(commissionRate * 100).toFixed(0)}%).`,
            type: "SUCCESS",
            link: `/instructor/courses`
          });
        } catch (notifErr) {
          console.warn("[paypal-capture-order] Instructor notification warning:", notifErr);
        }
      }

      return NextResponse.json({
        success: true,
        type: "DIGITAL_PRODUCT",
        productId: itemId,
        productTitle: product.title,
        downloadUrl,
        message: "Achat validé avec succès par PayPal ! Votre téléchargement sécurisé est prêt.",
      });
    }

    return NextResponse.json({ error: "Type de transaction non identifié." }, { status: 400 });
  } catch (err: any) {
    console.error("[paypal-capture-order] Critical exception:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la capture de la commande PayPal." }, { status: 500 });
  }
}
