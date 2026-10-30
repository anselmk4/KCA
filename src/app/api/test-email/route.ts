import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAuthorizedSuperAdmin } from "@/lib/rbac";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAuthorizedSuperAdmin(user.email)) {
      return NextResponse.json({ error: "Accès réservé au Super Administrateur." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const to = searchParams.get("to") || user.email!;

    const subject = "Test de configuration e-mail Ansella";
    const bodyContent = `
      <h2>Configuration e-mail fonctionnelle</h2>
      <p>Cet e-mail de test a été déclenché par l'administrateur (${user.email}).</p>
    `;

    const result = await sendEmail(to, subject, bodyContent);

    return NextResponse.json({
      success: true,
      recipient: to,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[GET /api/test-email] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors de l'envoi de l'email",
      },
      { status: 500 }
    );
  }
}
