import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { sendInvoiceEmail, sendInstructorCoursePurchasedEmail } from "@/lib/email";

// Supabase Admin Client bypassing RLS since it's a server-side transaction route
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function POST(req: Request) {
  try {
    const { orderId, userId, courseId, amount } = await req.json();

    if (!orderId || !userId || !courseId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch Student Profile
    const { data: studentProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();

    const studentName = studentProfile?.full_name || "Apprenant";
    const studentEmail = studentProfile?.email;

    // 2. Fetch Course & Instructor
    const { data: courseData } = await supabaseAdmin
      .from("courses")
      .select("title, instructor_id")
      .eq("id", courseId)
      .maybeSingle();

    if (!courseData) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const courseTitle = courseData.title;

    // 3. Fetch Instructor Profile
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

    // 4. Fetch Order Number
    const { data: orderData } = await supabaseAdmin
      .from("orders")
      .select("order_number")
      .eq("id", orderId)
      .maybeSingle();

    const orderNumber = orderData?.order_number || `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 5. Send Student Invoice Email
    if (studentEmail) {
      await sendInvoiceEmail(
        studentEmail,
        studentName,
        orderNumber,
        amount,
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
        amount
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[send-receipt API] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
