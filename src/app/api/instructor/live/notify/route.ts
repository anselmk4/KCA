import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendLiveSessionNotificationEmail } from "@/lib/email";

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
    const { title, date, meetingUrl, guestIds, isPublic } = await req.json();

    if (!title || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let targetUserIds: string[] = [];

    if (isPublic) {
      // Find all student user IDs
      const { data: roleStudent } = await supabaseAdmin
        .from("roles")
        .select("id")
        .eq("name", "STUDENT")
        .maybeSingle();

      if (roleStudent) {
        const { data: userRolesStudent } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role_id", roleStudent.id);

        targetUserIds = (userRolesStudent || []).map(ur => ur.user_id);
      }
    } else if (guestIds && guestIds.length > 0) {
      targetUserIds = guestIds;
    }

    if (targetUserIds.length > 0) {
      // Fetch names & emails of all targets
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", targetUserIds);

      if (profiles && profiles.length > 0) {
        const dateStr = new Date(date).toLocaleString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });

        // Batch insert in-app notifications
        const notificationInserts = profiles.map(p => ({
          user_id: p.id,
          title: isPublic ? "Nouveau live public !" : "Live programmé !",
          message: isPublic 
            ? `Un live public a été programmé : "${title}". Rejoignez-nous !`
            : `Un live a été programmé avec vous comme invité : "${title}".`,
          type: "INFO",
          link: "/dashboard/live",
          is_read: false,
          created_at: new Date().toISOString()
        }));

        await supabaseAdmin.from("notifications").insert(notificationInserts);

        for (const profile of profiles) {
          if (profile.email) {
            await sendLiveSessionNotificationEmail(
              profile.email,
              profile.full_name || "Apprenant",
              "Votre Académie",
              title,
              dateStr,
              meetingUrl || "https://ansella.app/dashboard/live"
            );
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[live-notify API] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
