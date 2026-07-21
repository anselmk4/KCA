import { NextRequest, NextResponse } from 'next/server';
import { createClient as createDirectClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/supabase/notifications-helper';

const supabaseAdmin = createDirectClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[cron-subscriptions] Unauthorized cron execution attempt.');
    }

    console.log('[cron-subscriptions] Running background instructor subscription expiration check...');

    // 1. Fetch all instructor profiles with active paid plans (BASE, PRO, MAX)
    const { data: instructors, error: fetchErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, plan, updated_at')
      .in('plan', ['BASE', 'PRO', 'MAX']);

    if (fetchErr) {
      console.error('[cron-subscriptions] Error fetching instructor profiles:', fetchErr.message);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!instructors || instructors.length === 0) {
      return NextResponse.json({ processed: 0, message: 'Aucun abonnement formateur à vérifier.' });
    }

    console.log(`[cron-subscriptions] Found ${instructors.length} instructors with paid plans.`);

    let downgradedCount = 0;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    for (const instructor of instructors) {
      // Find latest PAID payment for instructor plan
      const { data: lastPayment } = await supabaseAdmin
        .from('payments')
        .select('created_at, paid_at, method')
        .eq('user_id', instructor.id)
        .eq('status', 'PAID')
        .ilike('method', '%INSTRUCTOR_PLAN%')
        .order('paid_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastPaidDate = lastPayment?.paid_at || lastPayment?.created_at || instructor.updated_at;

      // If last paid date is older than 30 days, expire subscription
      if (new Date(lastPaidDate) < new Date(thirtyDaysAgo)) {
        console.log(`[cron-subscriptions] Instructor ${instructor.id} (${instructor.email}) plan ${instructor.plan} expired. Downgrading to FREE...`);

        // 1. Downgrade plan to FREE
        await supabaseAdmin
          .from('profiles')
          .update({ plan: 'FREE', updated_at: new Date().toISOString() } as any)
          .eq('id', instructor.id);

        // 2. Put excess courses into DRAFT
        const { data: instructorCourses } = await supabaseAdmin
          .from('courses')
          .select('id, status, created_at')
          .eq('instructor_id', instructor.id)
          .order('created_at', { ascending: true });

        if (instructorCourses && instructorCourses.length > 1) {
          const coursesToDowngrade = instructorCourses
            .slice(1)
            .filter((c) => c.status === 'PUBLISHED' || c.status === 'REVIEW');

          if (coursesToDowngrade.length > 0) {
            const downgradeIds = coursesToDowngrade.map((c) => c.id);
            await supabaseAdmin
              .from('courses')
              .update({ status: 'DRAFT' } as any)
              .in('id', downgradeIds);
          }
        }

        // 3. Send notification & email reminder
        const { sendInstructorSubscriptionExpiryReminderEmail } = await import('@/lib/email');

        await sendInstructorSubscriptionExpiryReminderEmail(
          instructor.email,
          instructor.full_name || 'Formateur',
          instructor.plan,
          0
        );

        await createNotification({
          userId: instructor.id,
          title: "Abonnement expiré",
          message: `Votre abonnement au plan ${instructor.plan} est arrivé à terme. Votre compte a été automatiquement rétrogradé au plan gratuit FREE.`,
          type: "WARNING",
          link: `/instructor/billing`,
          sendEmailCopy: false
        });

        downgradedCount++;
      } else {
        // Check if subscription is 3 days from expiration (between 27 and 29 days old)
        const twentySevenDaysAgo = new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString();
        const twentyEightDaysAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString();

        if (new Date(lastPaidDate) < new Date(twentySevenDaysAgo) && new Date(lastPaidDate) >= new Date(twentyEightDaysAgo)) {
          const { sendInstructorSubscriptionExpiryReminderEmail } = await import('@/lib/email');

          await sendInstructorSubscriptionExpiryReminderEmail(
            instructor.email,
            instructor.full_name || 'Formateur',
            instructor.plan,
            3
          );

          await createNotification({
            userId: instructor.id,
            title: "⏳ Rappel d'échéance d'abonnement",
            message: `Votre abonnement Formateur au Plan ${instructor.plan} expire dans 3 jours. Renouvelez-le dès maintenant pour préserver vos avantages.`,
            type: "WARNING",
            link: `/instructor/billing`,
            sendEmailCopy: false
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked: instructors.length,
      downgraded: downgradedCount
    });

  } catch (err: any) {
    console.error('[cron-subscriptions] Critical error:', err);
    return NextResponse.json({ error: err.message || 'Erreur interne' }, { status: 500 });
  }
}
