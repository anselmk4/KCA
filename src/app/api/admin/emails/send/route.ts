import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const ADMIN_ROLE_NAMES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MODERATOR",
  "ACADEMIC_ADMIN",
  "FINANCE_ADMIN",
  "SUPPORT_AGENT",
];

async function isCallerAdmin(userId: string): Promise<boolean> {
  try {
    const { data: dbRoles } = await supabaseAdmin.from("roles").select("id, name");
    const roleIdToName = new Map<string, string>();
    (dbRoles || []).forEach((r: any) => roleIdToName.set(r.id, r.name));

    const { data: userRoleRows } = await supabaseAdmin
      .from("user_roles")
      .select("role_id")
      .eq("user_id", userId);

    const names = (userRoleRows || [])
      .map((ur: any) => roleIdToName.get(ur.role_id))
      .filter(Boolean) as string[];

    return names.some((n) => ADMIN_ROLE_NAMES.includes(n));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isAdmin = await isCallerAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }

    const body = await req.json();
    const {
      targetType = "custom", // 'custom' | 'students' | 'instructors' | 'all'
      customEmails = [],
      subject,
      heading,
      message,
      buttonText,
      buttonUrl,
      infoBoxType,
      infoBoxText,
    } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: "L'objet de l'email est requis." }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Le corps du message est requis." }, { status: 400 });
    }

    // 1. Resolve recipients list
    let targetEmails: string[] = [];

    if (targetType === "custom") {
      if (!Array.isArray(customEmails) || customEmails.length === 0) {
        return NextResponse.json({ error: "Veuillez spécifier au moins une adresse email valide." }, { status: 400 });
      }
      targetEmails = customEmails
        .map((e: string) => e.trim().toLowerCase())
        .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    } else {
      // Resolve role-based target
      const { data: roles } = await supabaseAdmin.from("roles").select("id, name");
      const roleMap: Record<string, string> = {};
      (roles || []).forEach((r: any) => {
        roleMap[r.name] = r.id;
      });

      if (targetType === "students" && roleMap["STUDENT"]) {
        const { data: userRoles } = await supabaseAdmin
          .from("user_roles")
          .select("user_id, profiles!inner(email)")
          .eq("role_id", roleMap["STUDENT"]);

        targetEmails = (userRoles || [])
          .map((ur: any) => ur.profiles?.email)
          .filter(Boolean);
      } else if (targetType === "instructors" && roleMap["INSTRUCTOR"]) {
        const { data: userRoles } = await supabaseAdmin
          .from("user_roles")
          .select("user_id, profiles!inner(email)")
          .eq("role_id", roleMap["INSTRUCTOR"]);

        targetEmails = (userRoles || [])
          .map((ur: any) => ur.profiles?.email)
          .filter(Boolean);
      } else if (targetType === "all") {
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .not("email", "is", null);

        targetEmails = (profiles || [])
          .map((p: any) => p.email)
          .filter(Boolean);
      }
    }

    // Deduplicate
    targetEmails = Array.from(new Set(targetEmails.filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))));

    if (targetEmails.length === 0) {
      return NextResponse.json({ error: "Aucun destinataire valide trouvé pour cette sélection." }, { status: 400 });
    }

    // 2. Format HTML Body Content matching standard Ansella layout
    const formattedParagraphs = message
      .split(/\n\s*\n/)
      .map((p: string) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("\n");

    let infoBoxHtml = "";
    if (infoBoxText && infoBoxText.trim()) {
      let bgColor = "#f8fafc";
      let borderColor = "#e2e8f0";
      let textColor = "#334155";
      let leftBorderColor = "#4f46e5";

      if (infoBoxType === "success") {
        bgColor = "#f0fdf4";
        borderColor = "#bbf7d0";
        textColor = "#166534";
        leftBorderColor = "#16a34a";
      } else if (infoBoxType === "warning") {
        bgColor = "#fffbeb";
        borderColor = "#fde68a";
        textColor = "#92400e";
        leftBorderColor = "#d97706";
      }

      infoBoxHtml = `
        <div style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-left: 4px solid ${leftBorderColor}; border-radius: 12px; padding: 16px; margin: 20px 0; color: ${textColor}; font-size: 14px;">
          ${infoBoxText.replace(/\n/g, "<br/>")}
        </div>
      `;
    }

    let buttonHtml = "";
    if (buttonText && buttonText.trim() && buttonUrl && buttonUrl.trim()) {
      buttonHtml = `
        <div style="text-align: center; margin: 30px 0 20px 0;">
          <a href="${buttonUrl.trim()}" class="btn" style="display: inline-block; padding: 14px 28px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; font-weight: 700; border-radius: 10px; font-size: 15px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);">${buttonText.trim()}</a>
        </div>
      `;
    }

    const emailHeading = heading && heading.trim() ? `<h2>${heading.trim()}</h2>` : `<h2>${subject.trim()}</h2>`;
    const fullBodyContent = `
      ${emailHeading}
      ${formattedParagraphs}
      ${infoBoxHtml}
      ${buttonHtml}
    `;

    // 3. Dispatch Emails (Batching safely)
    const results: Array<{ email: string; success: boolean; error?: string; id?: string }> = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const email of targetEmails) {
      try {
        const sendRes = await sendEmail(email, subject.trim(), fullBodyContent);
        if (sendRes && sendRes.success) {
          sentCount++;
          results.push({ email, success: true, id: (sendRes as any).id });
        } else {
          failedCount++;
          results.push({ email, success: false, error: "Échec de l'API email" });
        }
      } catch (err: any) {
        failedCount++;
        results.push({ email, success: false, error: err.message || "Erreur d'envoi" });
      }
    }

    // 4. Log the broadcast into audit logs
    try {
      await supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        action: "BROADCAST_EMAIL_SENT",
        entity_type: "EMAIL_CAMPAIGN",
        metadata: {
          subject: subject.trim(),
          heading: heading?.trim() || null,
          targetType,
          totalTargeted: targetEmails.length,
          sentCount,
          failedCount,
        } as any,
      });
    } catch (auditErr) {
      console.warn("[POST /api/admin/emails/send] Audit log note:", auditErr);
    }

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      total: targetEmails.length,
      results,
    });
  } catch (error: any) {
    console.error("[POST /api/admin/emails/send] Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur lors de la diffusion des emails." },
      { status: 500 }
    );
  }
}
