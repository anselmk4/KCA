import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const to = searchParams.get("to") || "anselmk4@gmail.com";

    const subject = "Confirmez votre adresse e-mail";
    const bodyContent = `
      <h2>Confirmez votre adresse e-mail</h2>
      <p>Bonjour et bienvenue ! Merci d'avoir créé un compte sur Ansella. Pour finaliser votre inscription et activer pleinement vos accès, veuillez confirmer votre adresse en cliquant sur le bouton ci-dessous :</p>
      
      <div style="margin: 24px 0;">
        <a href="https://ansella.app/auth/confirmed" class="btn">Confirmer mon compte</a>
      </div>

      <hr class="divider" />

      <p class="fallback-link">
        Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien directement dans votre navigateur :<br/>
        <a href="https://ansella.app/auth/confirmed">https://ansella.app/auth/confirmed</a>
      </p>
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
