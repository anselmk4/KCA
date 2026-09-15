import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendBatchEmail } from "@/lib/email";
import { isAuthorizedSuperAdmin } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const ADMIN_ROLE_NAMES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MODERATOR",
  "ACADEMIC_ADMIN",
  "FINANCE_ADMIN",
  "SUPPORT_AGENT",
];

async function isCallerAdmin(userId: string, email?: string): Promise<boolean> {
  if (isAuthorizedSuperAdmin(email)) {
    return true;
  }

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

// Helper: fetch profile emails given a list of user IDs in safe chunks
async function getEmailsForUserIds(userIds: string[]): Promise<string[]> {
  if (!userIds || userIds.length === 0) return [];
  const emails: string[] = [];
  const chunkSize = 80;

  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .in("id", chunk)
      .not("email", "is", null);

    if (!error && profiles) {
      profiles.forEach((p: any) => {
        if (p.email && typeof p.email === "string" && p.email.trim()) {
          emails.push(p.email.trim().toLowerCase());
        }
      });
    }
  }

  return emails;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isAdmin = await isCallerAdmin(user.id, user.email);
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
        .map((e: string) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
        .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    } else {
      // Resolve role-based target
      const { data: roles } = await supabaseAdmin.from("roles").select("id, name");
      const roleMap: Record<string, string> = {};
      (roles || []).forEach((r: any) => {
        roleMap[r.name] = r.id;
      });

      if (targetType === "instructors") {
        // Query user_roles for INSTRUCTOR and TEACHING_ASSISTANT
        const instructorRoleIds = [roleMap["INSTRUCTOR"], roleMap["TEACHING_ASSISTANT"]].filter(Boolean);
        const { data: userRoles } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .in("role_id", instructorRoleIds);

        const userIds = Array.from(new Set((userRoles || []).map((ur: any) => ur.user_id).filter(Boolean)));
        targetEmails = await getEmailsForUserIds(userIds);

        // Fallback: Also look in profiles for any instructor specialty/academy if user_roles didn't yield emails
        if (targetEmails.length === 0) {
          const { data: instProfiles } = await supabaseAdmin
            .from("profiles")
            .select("email")
            .not("email", "is", null)
            .or("specialty.not.is.null,academy_name.not.is.null");

          if (instProfiles) {
            instProfiles.forEach((p: any) => {
              if (p.email && typeof p.email === "string" && p.email.trim()) {
                targetEmails.push(p.email.trim().toLowerCase());
              }
            });
          }
        }
      } else if (targetType === "students" && roleMap["STUDENT"]) {
        // Query user_roles for STUDENT
        const { data: userRoles } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role_id", roleMap["STUDENT"]);

        const userIds = Array.from(new Set((userRoles || []).map((ur: any) => ur.user_id).filter(Boolean)));
        targetEmails = await getEmailsForUserIds(userIds);
      } else if (targetType === "all") {
        // Query all profiles with pagination to avoid 1000 rows limit
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const from = page * pageSize;
          const to = from + pageSize - 1;
          const { data: profiles, error } = await supabaseAdmin
            .from("profiles")
            .select("email")
            .not("email", "is", null)
            .range(from, to);

          if (error || !profiles || profiles.length === 0) {
            hasMore = false;
            break;
          }

          profiles.forEach((p: any) => {
            if (p.email && typeof p.email === "string" && p.email.trim()) {
              targetEmails.push(p.email.trim().toLowerCase());
            }
          });

          if (profiles.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        }
      }
    }

    // Deduplicate and filter out malformed emails
    targetEmails = Array.from(
      new Set(
        targetEmails
          .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
          .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      )
    );

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

    // 3. Dispatch Emails in fast Batch
    const batchResult = await sendBatchEmail(targetEmails, subject.trim(), fullBodyContent);

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
          sentCount: batchResult.sentCount,
          failedCount: batchResult.failedCount,
        } as any,
      });
    } catch (auditErr) {
      console.warn("[POST /api/admin/emails/send] Audit log note:", auditErr);
    }

    return NextResponse.json({
      success: true,
      sentCount: batchResult.sentCount,
      failedCount: batchResult.failedCount,
      total: targetEmails.length,
      results: batchResult.results,
    });
  } catch (error: any) {
    console.error("[POST /api/admin/emails/send] Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur lors de la diffusion des emails." },
      { status: 500 }
    );
  }
}
