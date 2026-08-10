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
  sendEmailCopy?: boolean;
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

    // Automatically send an HTML email copy when requested or for notifications
    const shouldSendEmail = params.sendEmailCopy !== false;
    if (shouldSendEmail && params.userId) {
      try {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name")
          .eq("id", params.userId)
          .maybeSingle();

        if (profile?.email) {
          const ctaLink = params.link
            ? (params.link.startsWith("http") ? params.link : `https://ansella.app${params.link}`)
            : "https://ansella.app/dashboard";

          const body = `
            <h2 style="margin-top: 0; color: #111827;">${params.title}</h2>
            <p>Bonjour <strong>${profile.full_name || 'Cher membre'}</strong>,</p>
            <p style="font-size: 15px; color: #374151; line-height: 1.6;">${params.message}</p>
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="${ctaLink}" class="btn">Consulter sur la plateforme</a>
            </div>
          `;

          if (typeof window === 'undefined') {
            const { sendEmail } = await import('@/lib/email');
            await sendEmail(profile.email, params.title, body);
          }
        }
      } catch (emailErr) {
        console.error("[Notifications Helper] Failed to send email copy:", emailErr);
      }
    }
  } catch (err) {
    console.error("[Notifications Helper] Exception in createNotification:", err);
  }
}

/**
 * Helper: Check if a FREE instructor reached 10 students and trigger quota email & notification
 */
export async function checkInstructorStudentQuota(instructorId: string) {
  try {
    const { data: instructorProfile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name, plan')
      .eq('id', instructorId)
      .maybeSingle();

    if (!instructorProfile || instructorProfile.plan !== 'FREE') return;

    // Fetch instructor's courses
    const { data: courses } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('instructor_id', instructorId);

    if (!courses || courses.length === 0) return;

    const courseIds = courses.map((c) => c.id);

    // Count enrollments across all instructor's courses
    const { count } = await supabaseAdmin
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .in('course_id', courseIds);

    const totalStudents = count || 0;

    // Trigger quota alert when student count reaches or exceeds 10
    if (totalStudents >= 10) {
      const { sendInstructorFreeQuotaWarningEmail } = await import('@/lib/email');

      await sendInstructorFreeQuotaWarningEmail(
        instructorProfile.email,
        instructorProfile.full_name || 'Formateur',
        totalStudents
      );

      await createNotification({
        userId: instructorId,
        title: "🚀 Cap des 10 étudiants atteint !",
        message: `Félicitations ! Votre académie compte désormais ${totalStudents} étudiants inscrits. Vous approchez de la limite du Plan FREE. Passez au plan supérieur pour un nombre d'étudiants illimité et 0% de commission !`,
        type: "WARNING",
        link: "/instructor/billing",
        sendEmailCopy: false // avoid double email since sendInstructorFreeQuotaWarningEmail was sent
      });
    }
  } catch (err) {
    console.error('[Notifications Helper] Exception checking instructor quota:', err);
  }
}
