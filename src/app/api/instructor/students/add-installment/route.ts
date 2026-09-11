import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/supabase/notifications-helper";
import { sendInvoiceEmail, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié. Veuillez vous connecter." }, { status: 401 });
    }

    // Verify caller role
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isAuthorized = roles.some((r) => ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(r));
    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé. Rôle insuffisant." }, { status: 403 });
    }

    const body = await req.json();
    const {
      studentId,
      courseId,
      amount,
      paymentNote,
      unblockAccess = true,
      paymentMethod = "CASH_IN_HAND",
    } = body;

    const installmentAmount = Number(amount);
    if (!studentId || !courseId || isNaN(installmentAmount) || installmentAmount <= 0) {
      return NextResponse.json({ error: "Paramètres invalides. Le montant de la tranche doit être supérieur à 0." }, { status: 400 });
    }

    const isAdmin = roles.some((r) => ["SUPER_ADMIN", "ADMIN"].includes(r));

    // Fetch course details & verify ownership
    const { data: course, error: courseErr } = await supabaseAdmin
      .from("courses")
      .select("id, title, price, instructor_id")
      .eq("id", courseId)
      .maybeSingle();

    if (courseErr || !course) {
      return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
    }

    if (!isAdmin && course.instructor_id !== user.id) {
      return NextResponse.json({ error: "Vous n'êtes pas autorisé à gérer les paiements de ce cours." }, { status: 403 });
    }

    const coursePrice = Number(course.price) || 0;

    // Fetch enrollment
    const { data: enrollment, error: enrErr } = await supabaseAdmin
      .from("enrollments")
      .select("id, status, manual_payment_status, manual_amount_paid, enrollment_type")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (enrErr || !enrollment) {
      return NextResponse.json({ error: "Inscription de l'étudiant introuvable pour ce cours." }, { status: 404 });
    }

    // Fetch any existing payments for this student & course to get exact baseline
    const { data: existingCourseOrderItems } = await (supabaseAdmin
      .from("order_items" as any) as any)
      .select("order_id")
      .eq("course_id", courseId);

    const orderIdSet = new Set(existingCourseOrderItems?.map((oi: any) => oi.order_id) || []);

    const { data: existingUserPayments } = await (supabaseAdmin
      .from("payments" as any) as any)
      .select("amount, method, order_id")
      .eq("user_id", studentId)
      .eq("status", "PAID");

    let existingPaymentsSum = 0;
    existingUserPayments?.forEach((p: any) => {
      const methodParts = (p.method || "").split("::");
      if (methodParts[2] === courseId || orderIdSet.has(p.order_id)) {
        existingPaymentsSum += Number(p.amount) || 0;
      }
    });

    // Calculate new amounts based on highest known paid baseline + this installment
    const currentManualPaid = Math.max(Number(enrollment.manual_amount_paid) || 0, existingPaymentsSum);
    const newTotalPaid = currentManualPaid + installmentAmount;
    const isFullyPaidNow = newTotalPaid >= coursePrice && coursePrice > 0;
    const newManualStatus = isFullyPaidNow ? "CASH_FULL" : "CASH_INSTALLMENT";

    const updatePayload: Record<string, any> = {
      manual_amount_paid: newTotalPaid,
      manual_payment_status: newManualStatus,
      enrollment_type: "MANUAL_INSTRUCTOR",
    };

    // If unblock requested or fully paid, set status to ACTIVE
    if (unblockAccess || isFullyPaidNow) {
      updatePayload.status = "ACTIVE";
    }

    const { error: updateErr } = await (supabaseAdmin
      .from("enrollments" as any) as any)
      .update(updatePayload)
      .eq("id", enrollment.id);

    if (updateErr) {
      console.error("[add-installment] Error updating enrollment:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Create Order & Payment record for trace, dashboard, and invoice
    const orderId = crypto.randomUUID();
    const orderNumber = `MAN-TR-${Date.now()}`;

    try {
      const { error: orderErr } = await (supabaseAdmin.from("orders" as any) as any).insert({
        id: orderId,
        user_id: studentId,
        order_number: orderNumber,
        subtotal: installmentAmount,
        total: installmentAmount,
        currency: "USD",
        status: "COMPLETED",
        created_at: new Date().toISOString(),
      });

      if (orderErr) {
        console.error("[add-installment] Error inserting order:", orderErr);
      }

      const { error: itemErr } = await (supabaseAdmin.from("order_items" as any) as any).insert({
        id: crypto.randomUUID(),
        order_id: orderId,
        course_id: courseId,
        unit_price: coursePrice || installmentAmount,
        final_price: installmentAmount,
        discount_amount: 0,
        created_at: new Date().toISOString(),
      });

      if (itemErr) {
        console.error("[add-installment] Error inserting order_item:", itemErr);
      }

      const paymentMethodStr = isFullyPaidNow
        ? `MANUAL::CASH_FULL::${courseId}`
        : `MANUAL::CASH_INSTALLMENT::${courseId}`;

      const { error: payErr } = await (supabaseAdmin.from("payments" as any) as any).insert({
        id: crypto.randomUUID(),
        order_id: orderId,
        user_id: studentId,
        amount: installmentAmount,
        currency: "USD",
        status: "PAID",
        provider: "MANUAL",
        method: paymentMethodStr,
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      if (payErr) {
        console.error("[add-installment] Error inserting payment:", payErr);
      }
    } catch (orderErr) {
      console.warn("[add-installment] Could not insert order/payment log:", orderErr);
    }

    // Student profile info for notification & email
    const { data: studentProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", studentId)
      .maybeSingle();

    const studentName = studentProfile?.full_name || "Apprenant";
    const studentEmail = studentProfile?.email;

    // Send in-app notification to the student
    try {
      await createNotification({
        userId: studentId,
        title: "Nouvelle tranche validée ! 💳",
        message: `Votre formateur a validé un versement de $${installmentAmount.toFixed(2)} USD pour le cours "${course.title}". Total versé : $${newTotalPaid.toFixed(2)} / $${coursePrice.toFixed(2)}.`,
        type: "SUCCESS",
        link: `/dashboard/courses/${courseId}`,
        sendEmailCopy: false,
      });
    } catch (notifErr) {
      console.warn("[add-installment] Could not create in-app notification:", notifErr);
    }

    // Send receipt email to the student
    if (studentEmail) {
      try {
        await sendInvoiceEmail(
          studentEmail,
          studentName,
          orderNumber,
          installmentAmount,
          `${course.title} (Tranche de paiement)`,
          `Versement en mains propres enregistré par le formateur. Total réglé : $${newTotalPaid.toFixed(2)} / $${coursePrice.toFixed(2)} USD.${paymentNote ? ` Note: ${paymentNote}` : ""}`
        );
      } catch (emailErr) {
        console.warn("[add-installment] Could not send invoice email:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `La tranche de $${installmentAmount.toFixed(2)} USD a été enregistrée avec succès !`,
      installmentAmount,
      newTotalPaid,
      remainingAmount: Math.max(0, coursePrice - newTotalPaid),
      isFullyPaid: isFullyPaidNow,
      status: updatePayload.status || enrollment.status,
    });
  } catch (error: any) {
    console.error("[POST /api/instructor/students/add-installment] Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'enregistrement de la tranche." },
      { status: 500 }
    );
  }
}
