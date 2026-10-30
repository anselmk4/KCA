import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendInvoiceEmail, sendInstructorCoursePurchasedEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { orderId, courseId } = await req.json();

    if (!orderId || !courseId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify order belongs to authenticated user (or caller is an admin) and is COMPLETED
    const { data: orderData } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, user_id, status, total")
      .eq("id", orderId)
      .maybeSingle();

    if (!orderData || orderData.user_id !== user.id || orderData.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Commande introuvable, non autorisée ou non payée." },
        { status: 403 }
      );
    }

    const verifiedAmount = Number(orderData.total) || 0;
    const orderNumber = orderData.order_number || `ORD-${orderId.substring(0, 6).toUpperCase()}`;

    // 2. Fetch Student Profile
    const { data: studentProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    const studentName = studentProfile?.full_name || "Apprenant";
    const studentEmail = studentProfile?.email || user.email;

    // 3. Fetch Course & Instructor
    const { data: courseData } = await supabaseAdmin
      .from("courses")
      .select("title, instructor_id")
      .eq("id", courseId)
      .maybeSingle();

    if (!courseData) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const courseTitle = courseData.title;

    // 4. Fetch Instructor Profile
    let instructorEmail = "";
    let instructorName = "Formateur";
    if (courseData.instructor_id) {
      const { data: instructorProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, email")
        .eq("id", courseData.instructor_id)
        .maybeSingle();

      if (instructorProfile) {
        instructorEmail = instructorProfile.email || "";
        instructorName = instructorProfile.full_name || "Formateur";
      }
    }

    // 5. Send Student Invoice Email
    if (studentEmail) {
      await sendInvoiceEmail(
        studentEmail,
        studentName,
        orderNumber,
        verifiedAmount,
        courseTitle,
        "Accès complet et illimité à la formation."
      );
    }

    // 6. Send Instructor Alert Email
    if (instructorEmail) {
      await sendInstructorCoursePurchasedEmail(
        instructorEmail,
        instructorName,
        studentName,
        courseTitle,
        verifiedAmount
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[send-receipt API] Error:", err.message);
    return NextResponse.json({ error: "Erreur lors de l'envoi du reçu." }, { status: 500 });
  }
}
