import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createDirectClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/supabase/notifications-helper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, message, courseTitle } = body;

    if (!studentId || !message) {
      return NextResponse.json({ error: "studentId et message sont requis." }, { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const dbClient = serviceKey
      ? createDirectClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
      : supabase;

    // Send notification to student
    try {
      await createNotification({
        userId: studentId,
        title: "Message d'encouragement de votre formateur ! 🚀",
        message: message.slice(0, 200) + (message.length > 200 ? "..." : ""),
        type: "INFO",
        link: "/dashboard/courses"
      });
    } catch (notifErr) {
      console.warn("[/api/ai/retention-guard/send] Notification creation warning:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Message de relances IA envoyé avec succès à l'étudiant !"
    });
  } catch (err: any) {
    console.error("[/api/ai/retention-guard/send] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de l'envoi de la relance." }, { status: 500 });
  }
}
