import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/supabase/notifications-helper";

const PLAN_COMMISSION_CONFIG: Record<string, { commissionRate: number; instructorShare: number }> = {
  FREE: { commissionRate: 0.20, instructorShare: 0.80 },
  BASE: { commissionRate: 0.10, instructorShare: 0.90 },
  PRO: { commissionRate: 0.05, instructorShare: 0.95 },
  MAX: { commissionRate: 0.00, instructorShare: 1.00 },
};

const planUuidMap: Record<string, string> = {
  "99999999-9999-9999-9999-999999990001": "Forfait Formateur BASE",
  "99999999-9999-9999-9999-999999990002": "Forfait Formateur PRO",
  "99999999-9999-9999-9999-999999990003": "Forfait Formateur MAX",
};

/**
 * Helper to verify Admin authorization
 */
async function verifyAdminAuth() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { authorized: false, status: 401, error: "Non authentifié" };
  }

  // Super admin email bypass
  if (user.email && process.env.SUPER_ADMIN_EMAIL && user.email.toLowerCase() === process.env.SUPER_ADMIN_EMAIL.toLowerCase()) {
    return { authorized: true, user };
  }

  // Role verification (SUPER_ADMIN, ADMIN, or FINANCE_ADMIN)
  const { data: userRoles, error: rolesErr } = await supabaseAdmin
    .from("user_roles")
    .select("roles!inner(name)")
    .eq("user_id", user.id) as any;

  if (rolesErr || !userRoles || userRoles.length === 0) {
    return { authorized: false, status: 403, error: "Non autorisé" };
  }

  const roleNames = userRoles.map((ur: any) => ur.roles?.name);
  const hasAdminAccess = roleNames.some((name: string) => 
    name === "SUPER_ADMIN" || name === "ADMIN" || name === "FINANCE_ADMIN"
  );

  if (!hasAdminAccess) {
    return { authorized: false, status: 403, error: "Non autorisé" };
  }

  return { authorized: true, user };
}

/**
 * GET: Fetch all payments (manual & automatic, pending & completed) with admin bypass
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = (searchParams.get("status") || "ALL").toUpperCase();
    const searchTerm = (searchParams.get("search") || "").trim().toLowerCase();

    // 1. Fetch payments using supabaseAdmin to bypass RLS
    let query = supabaseAdmin
      .from("payments")
      .select("id, order_id, user_id, amount, currency, status, provider, method, failure_reason, paid_at, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (statusParam !== "ALL") {
      query = query.eq("status", statusParam);
    }

    const { data: paymentsData, error: paymentsErr } = await query;
    if (paymentsErr) {
      console.error("[api/admin/payments] Query error:", paymentsErr);
      return NextResponse.json({ error: paymentsErr.message }, { status: 500 });
    }

    const rawPayments = paymentsData || [];

    // Also get counts for summary badges
    const { data: allStatuses } = await supabaseAdmin
      .from("payments")
      .select("status, amount");

    const counts = {
      all: allStatuses?.length || 0,
      pending: allStatuses?.filter((p) => p.status === "PENDING").length || 0,
      paid: allStatuses?.filter((p) => p.status === "PAID").length || 0,
      failed: allStatuses?.filter((p) => p.status === "FAILED" || p.status === "CANCELLED").length || 0,
    };

    const pendingTotalAmount = allStatuses?.filter((p) => p.status === "PENDING").reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
    const paidTotalAmount = allStatuses?.filter((p) => p.status === "PAID").reduce((acc, p) => acc + (p.amount || 0), 0) || 0;

    if (rawPayments.length === 0) {
      return NextResponse.json({
        payments: [],
        counts,
        totals: { pendingTotalAmount, paidTotalAmount },
      });
    }

    const userIds = [...new Set(rawPayments.map((p) => p.user_id).filter(Boolean))];
    const orderIds = [...new Set(rawPayments.map((p) => p.order_id).filter(Boolean))];

    // 2. Fetch User Profiles
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone_number, phone")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    // 3. Fetch Order Items & Orders
    const { data: orderItems } = await supabaseAdmin
      .from("order_items")
      .select("order_id, course_id, unit_price, final_price")
      .in("order_id", orderIds);

    const orderItemMap = new Map(orderItems?.map((oi) => [oi.order_id, oi]) || []);
    const courseIds = [...new Set(orderItems?.map((oi) => oi.course_id).filter(Boolean) || [])];

    // 4. Fetch Courses & Instructor Profiles
    const { data: courses } = courseIds.length > 0
      ? await supabaseAdmin
          .from("courses")
          .select("id, title, instructor_id, price")
          .in("id", courseIds)
      : { data: [] };

    const courseMap = new Map(courses?.map((c) => [c.id, c]) || []);
    const instructorIds = [...new Set(courses?.map((c) => c.instructor_id).filter(Boolean) || [])];

    const { data: instProfiles } = instructorIds.length > 0
      ? await supabaseAdmin
          .from("profiles")
          .select("id, full_name, plan")
          .in("id", instructorIds)
      : { data: [] };

    const instructorMap = new Map(instProfiles?.map((p) => [p.id, p]) || []);

    // 5. Enrich Payments
    const enriched = rawPayments.map((p) => {
      const profile = profileMap.get(p.user_id);
      const orderItem = orderItemMap.get(p.order_id);
      const courseId = orderItem?.course_id || "";

      // Parse method: e.g. "MANUAL_MOMO::AIRTEL::course-uuid::MONTHLY" or "ORANGE::STUDENT_COURSE::course-uuid"
      const methodParts = (p.method || "").split("::");
      const isManualMethod = p.provider === "MANUAL" || (p.method || "").startsWith("MANUAL");
      const planNameFromUuid = planUuidMap[courseId];

      let courseTitle = "";
      let instName = "N/A";
      let instPlan = "N/A";
      let commissionAmount = 0;
      let instructorShareAmount = 0;
      let siteAmount = 0;

      if (planNameFromUuid || methodParts[1] === "INSTRUCTOR_PLAN") {
        const planCode = planNameFromUuid ? planNameFromUuid.replace("Forfait Formateur ", "") : (methodParts[2] || "PRO");
        courseTitle = `Abonnement Formateur (${planCode})`;
        instName = profile?.full_name || "Formateur";
        instPlan = planCode;
        siteAmount = p.amount || 0;
        commissionAmount = 0;
        instructorShareAmount = 0;
      } else {
        const course = courseMap.get(courseId);
        courseTitle = course?.title || "Formation / Cours";
        const instructor = instructorMap.get(course?.instructor_id || "");
        instName = instructor?.full_name || "Formateur";
        instPlan = instructor?.plan || "FREE";

        const commConfig = PLAN_COMMISSION_CONFIG[instPlan] || PLAN_COMMISSION_CONFIG.FREE;
        const baseRev = orderItem?.final_price ? parseFloat(orderItem.final_price) : (p.amount || 0);
        commissionAmount = baseRev * commConfig.commissionRate;
        instructorShareAmount = baseRev * commConfig.instructorShare;
        siteAmount = commissionAmount;
      }

      // Friendly payment method formatting
      let formattedMethod = "Mobile Money (PawaPay Auto)";
      let paymentType: "MANUAL_MOMO" | "PAWAPAY_AUTO" | "PAYPAL" | "CRYPTO" | "CARD" | "OTHER" = "PAWAPAY_AUTO";

      if (isManualMethod) {
        formattedMethod = "Mobile Money (Virement Manuel)";
        paymentType = "MANUAL_MOMO";
      } else if (p.provider === "PAYPAL") {
        formattedMethod = "PayPal";
        paymentType = "PAYPAL";
      } else if (p.provider === "CRYPTO" || p.provider === "CRYPTO_BTC" || p.provider === "CRYPTO_ETH") {
        formattedMethod = "Crypto (USDC / Bitcoin)";
        paymentType = "CRYPTO";
      } else if (p.provider === "MOKO_CARD" || p.provider === "STRIPE") {
        formattedMethod = "Carte Bancaire";
        paymentType = "CARD";
      }

      // Extract manual reference & telephone if present in failure_reason
      let manualReference = "";
      let manualPhone = profile?.phone || profile?.phone_number || "";
      if (p.failure_reason) {
        const refMatch = p.failure_reason.match(/Réf(?:\s*Virement\s*MoMo)?\s*:\s*([^(\n]+)/i);
        if (refMatch && refMatch[1]) {
          manualReference = refMatch[1].trim();
        }
        const phoneMatch = p.failure_reason.match(/\(([^)]+)\)/);
        if (phoneMatch && phoneMatch[1]) {
          manualPhone = phoneMatch[1].trim();
        }
      }

      return {
        id: p.id,
        orderId: p.order_id,
        userId: p.user_id,
        studentName: profile?.full_name || "Utilisateur",
        studentEmail: profile?.email || "Non renseigné",
        studentPhone: manualPhone,
        courseId,
        courseTitle,
        amount: p.amount || 0,
        currency: p.currency || "USD",
        status: p.status,
        provider: p.provider,
        rawMethod: p.method,
        formattedMethod,
        paymentType,
        isManual: isManualMethod,
        manualReference,
        failureReason: p.failure_reason,
        instructorName: instName,
        instructorPlan: instPlan,
        commissionAmount,
        instructorShareAmount,
        siteAmount,
        paidAt: p.paid_at,
        createdAt: p.created_at,
        date: p.paid_at || p.created_at,
      };
    });

    // Optional Search Filter in-memory
    const filtered = searchTerm
      ? enriched.filter((tx) =>
          tx.studentName.toLowerCase().includes(searchTerm) ||
          tx.studentEmail.toLowerCase().includes(searchTerm) ||
          tx.courseTitle.toLowerCase().includes(searchTerm) ||
          tx.instructorName.toLowerCase().includes(searchTerm) ||
          (tx.manualReference && tx.manualReference.toLowerCase().includes(searchTerm)) ||
          tx.id.toLowerCase().includes(searchTerm)
        )
      : enriched;

    return NextResponse.json({
      payments: filtered,
      counts,
      totals: { pendingTotalAmount, paidTotalAmount },
    });

  } catch (err: any) {
    console.error("[api/admin/payments] Critical error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST: Admin action on a payment (APPROVE / REJECT)
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { paymentId, action, notes } = body;

    if (!paymentId || !action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Paramètres manquants ou action invalide" }, { status: 400 });
    }

    // 1. Fetch payment
    const { data: payment, error: pErr } = await supabaseAdmin
      .from("payments")
      .select("id, order_id, user_id, amount, status, method, failure_reason")
      .eq("id", paymentId)
      .maybeSingle();

    if (pErr || !payment) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    const adminEmail = auth.user?.email || "Admin";

    // --- ACTION: APPROVE ---
    if (action === "APPROVE") {
      const nowIso = new Date().toISOString();

      // 1. Mark Payment as PAID
      const { error: payUpdateErr } = await supabaseAdmin
        .from("payments")
        .update({
          status: "PAID",
          paid_at: nowIso,
          failure_reason: (payment.failure_reason || "") + `\n[Validé manuellement par ${adminEmail} le ${new Date().toLocaleString("fr-FR")}]`,
          updated_at: nowIso,
        } as any)
        .eq("id", paymentId);

      if (payUpdateErr) throw payUpdateErr;

      // 2. Mark Order as COMPLETED
      if (payment.order_id) {
        await supabaseAdmin
          .from("orders")
          .update({
            status: "COMPLETED",
            updated_at: nowIso,
          } as any)
          .eq("id", payment.order_id);
      }

      // 3. Resolve item type from method (CARRIER::TYPE::ITEM_ID or MANUAL_MOMO::CARRIER::ITEM_ID)
      const methodParts = (payment.method || "").split("::");
      let itemType = "STUDENT_COURSE";
      let itemId = "";

      if (methodParts[0] === "MANUAL_MOMO") {
        itemType = "STUDENT_COURSE";
        itemId = methodParts[2] || "";
      } else if (methodParts[1] === "INSTRUCTOR_PLAN") {
        itemType = "INSTRUCTOR_PLAN";
        itemId = methodParts[2] || "";
      } else if (methodParts[1] === "STUDENT_COURSE") {
        itemType = "STUDENT_COURSE";
        itemId = methodParts[2] || "";
      }

      // Fallback: check order_items if itemId is missing
      if (!itemId && payment.order_id) {
        const { data: oi } = await supabaseAdmin
          .from("order_items")
          .select("course_id")
          .eq("order_id", payment.order_id)
          .maybeSingle();
        if (oi?.course_id) {
          itemId = oi.course_id;
          itemType = "STUDENT_COURSE";
        }
      }

      // 4. Activate Student Course
      if (itemType === "STUDENT_COURSE" && itemId) {
        await supabaseAdmin
          .from("enrollments")
          .upsert({
            student_id: payment.user_id,
            course_id: itemId,
            status: "ACTIVE",
            progress_percent: 0,
            enrolled_at: nowIso,
            updated_at: nowIso,
          } as any, { onConflict: "student_id,course_id" });

        // Fetch course and student info
        const { data: course } = await supabaseAdmin
          .from("courses")
          .select("title, instructor_id, price")
          .eq("id", itemId)
          .maybeSingle();

        const { data: studentProfile } = await supabaseAdmin
          .from("profiles")
          .select("full_name, email")
          .eq("id", payment.user_id)
          .maybeSingle();

        const studentName = studentProfile?.full_name || "Apprenant";
        const courseTitle = course?.title || "votre formation";

        // Notify Student
        await createNotification({
          userId: payment.user_id,
          title: "Paiement validé avec succès ! 🎉",
          message: `Votre virement pour le cours "${courseTitle}" a été validé par l'équipe. Votre accès est maintenant disponible !`,
          type: "SUCCESS",
          link: `/dashboard/courses`,
        });

        // Send Student Invoice Email
        if (studentProfile?.email) {
          try {
            const { sendInvoiceEmail } = await import("@/lib/email");
            const orderNumber = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            await sendInvoiceEmail(
              studentProfile.email,
              studentName,
              orderNumber,
              payment.amount,
              courseTitle,
              "Paiement validé par l'administration"
            );
          } catch (e) {
            console.warn("[api/admin/payments] Student invoice email error:", e);
          }
        }

        // Notify Instructor & Calculate Earnings
        if (course?.instructor_id) {
          const { data: instructorProfile } = await supabaseAdmin
            .from("profiles")
            .select("full_name, email, plan")
            .eq("id", course.instructor_id)
            .maybeSingle();

          if (instructorProfile) {
            const instPlan = instructorProfile.plan || "FREE";
            const commConfig = PLAN_COMMISSION_CONFIG[instPlan] || PLAN_COMMISSION_CONFIG.FREE;
            const coursePrice = parseFloat(course.price as any) || payment.amount;
            const platformFee = coursePrice * commConfig.commissionRate;
            const instructorEarnings = coursePrice - platformFee;

            await createNotification({
              userId: course.instructor_id,
              title: "Nouvelle inscription validée !",
              message: `"${studentName}" est inscrit à votre cours "${courseTitle}". Vos gains : $${instructorEarnings.toFixed(2)}.`,
              type: "SUCCESS",
              link: "/instructor/students",
            });

            if (instructorProfile.email) {
              try {
                const { sendInstructorCoursePurchasedEmail } = await import("@/lib/email");
                await sendInstructorCoursePurchasedEmail(
                  instructorProfile.email,
                  instructorProfile.full_name || "Formateur",
                  studentName,
                  courseTitle,
                  coursePrice
                );
              } catch (e) {
                console.warn("[api/admin/payments] Instructor email error:", e);
              }
            }
          }
        }
      }

      // 5. Activate Instructor Plan
      if (itemType === "INSTRUCTOR_PLAN" && itemId) {
        const planUpper = itemId.toUpperCase();
        await supabaseAdmin
          .from("profiles")
          .update({
            plan: planUpper,
            updated_at: nowIso,
          } as any)
          .eq("id", payment.user_id);

        await createNotification({
          userId: payment.user_id,
          title: "Forfait Formateur activé ! 🎉",
          message: `Votre abonnement au plan ${planUpper} a été validé et activé par l'administration.`,
          type: "SUCCESS",
          link: "/instructor/billing",
        });
      }

      return NextResponse.json({
        success: true,
        message: "Paiement validé et accès débloqué avec succès.",
      });
    }

    // --- ACTION: REJECT ---
    if (action === "REJECT") {
      const nowIso = new Date().toISOString();
      const rejectionReason = notes || "Virement non confirmé ou référence incorrecte.";

      await supabaseAdmin
        .from("payments")
        .update({
          status: "FAILED",
          failure_reason: `Rejeté par l'admin (${adminEmail}) : ${rejectionReason}`,
          updated_at: nowIso,
        } as any)
        .eq("id", paymentId);

      if (payment.order_id) {
        await supabaseAdmin
          .from("orders")
          .update({
            status: "CANCELLED",
            updated_at: nowIso,
          } as any)
          .eq("id", payment.order_id);
      }

      // Notify student
      await createNotification({
        userId: payment.user_id,
        title: "Virement rejeté ❌",
        message: `Votre demande de virement n'a pas pu être validée : ${rejectionReason}. Veuillez vérifier votre référence ou contacter le support.`,
        type: "ERROR",
        link: "/dashboard/payments",
      });

      return NextResponse.json({
        success: true,
        message: "Paiement rejeté.",
      });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });

  } catch (err: any) {
    console.error("[api/admin/payments] Action error:", err);
    return NextResponse.json({ error: err.message || "Erreur lors du traitement" }, { status: 500 });
  }
}
