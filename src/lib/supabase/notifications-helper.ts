import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "SYSTEM";

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}) {
  try {
    const { error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || "INFO",
        link: params.link || null,
        is_read: false,
        created_at: new Date().toISOString()
      });
    if (error) {
      console.error("[Notifications Helper] Error inserting notification:", error.message);
    }
  } catch (err) {
    console.error("[Notifications Helper] Exception in createNotification:", err);
  }
}
