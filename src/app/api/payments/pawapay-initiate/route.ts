import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createDirectClient } from '@supabase/supabase-js';
import { 
  initiatePawaPayDeposit, 
  getPawaPayConfigForCountry, 
  formatPawaPayPhoneNumber 
} from '@/lib/pawapay';

const supabaseAdmin = createDirectClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verify user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié. Veuillez vous connecter.' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { amount, phoneNumber, carrier, type, itemId, couponId } = body;

    if (!amount || !phoneNumber || !carrier || !type || !itemId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // 3. Fetch user profile to retrieve country
    const { data: profile } = await supabase
      .from('profiles')
      .select('country')
      .eq('id', user.id)
      .maybeSingle();

    const userCountry = profile?.country || 'CD';
    const countryConfig = getPawaPayConfigForCountry(userCountry);

    if (!countryConfig) {
      return NextResponse.json({ error: `PawaPay n'est pas disponible pour votre pays : ${userCountry}` }, { status: 400 });
    }

    // Format phone number according to country configuration prefix
    const formattedPhone = formatPawaPayPhoneNumber(phoneNumber, countryConfig.phonePrefix);

    // Validate carrier belongs to countryConfig operators
    const operatorExists = countryConfig.operators.some(op => op.id === carrier);
    if (!operatorExists) {
      return NextResponse.json({ error: `Opérateur ${carrier} invalide pour le pays ${userCountry}` }, { status: 400 });
    }

    // 4. Generate references
    const orderId = crypto.randomUUID();
    const paymentId = crypto.randomUUID(); // This will serve as our depositId for PawaPay

    // Determine dbClient (use supabaseAdmin to bypass RLS)
    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && 
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin 
      : supabase;

    // 5. Save PENDING records in database
    try {
      const orderNumber = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { error: orderError } = await dbClient.from('orders').insert({
        id: orderId,
        order_number: orderNumber,
        user_id: user.id,
        status: 'PENDING',
        subtotal: amount,
        discount_amount: 0,
        tax_amount: 0,
        total: amount,
        currency: countryConfig.currency, // Use country specific currency
        coupon_id: couponId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any);

      if (orderError) throw orderError;

      const planUuidMap: Record<string, string> = {
        BASE: "99999999-9999-9999-9999-999999990001",
        PRO: "99999999-9999-9999-9999-999999990002",
        MAX: "99999999-9999-9999-9999-999999990003",
      };
      const resolvedCourseId = type === 'STUDENT_COURSE' 
        ? itemId 
        : (planUuidMap[itemId.toUpperCase()] || planUuidMap.BASE);

      const { error: itemError } = await dbClient.from('order_items').insert({
        id: crypto.randomUUID(),
        order_id: orderId,
        course_id: resolvedCourseId,
        unit_price: amount,
        discount_amount: 0,
        final_price: amount,
        created_at: new Date().toISOString()
      } as any);

      if (itemError) throw itemError;

      const { error: paymentError } = await dbClient.from('payments').insert({
        id: paymentId,
        order_id: orderId,
        user_id: user.id,
        amount: amount,
        currency: countryConfig.currency,
        status: 'PENDING',
        provider: 'PAWAPAY',
        method: carrier,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any);

      if (paymentError) throw paymentError;

      if (type === 'STUDENT_COURSE') {
        const { error: enrollError } = await dbClient.from('enrollments').upsert({
          student_id: user.id,
          course_id: itemId,
          progress_percent: 0,
          status: 'PENDING',
          enrolled_at: new Date().toISOString()
        } as any, { onConflict: 'student_id,course_id' });

        if (enrollError) {
          console.warn('[pawapay-initiate] Enrollment upsert warning:', enrollError.message);
        }
      }
    } catch (dbErr: any) {
      console.error('[pawapay-initiate] Database setup error:', dbErr.message);
      return NextResponse.json({ error: 'Erreur d\'enregistrement de la commande.' }, { status: 500 });
    }

    // 6. Request deposit via PawaPay sandbox API
    const depositResult = await initiatePawaPayDeposit({
      amount: amount,
      currency: countryConfig.currency,
      correspondent: carrier,
      phoneNumber: formattedPhone,
      depositId: paymentId
    });

    if (!depositResult.success) {
      // Update payment record to FAILED
      await dbClient.from('payments').update({
        status: 'FAILED',
        failure_reason: depositResult.error || 'Rejeté par PawaPay',
        updated_at: new Date().toISOString()
      } as any).eq('id', paymentId);

      await dbClient.from('orders').update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString()
      } as any).eq('id', orderId);

      return NextResponse.json({ error: depositResult.error || 'La requête de dépôt PawaPay a échoué.' }, { status: 400 });
    }

    // Success response
    return NextResponse.json({
      success: true,
      depositId: paymentId,
      status: depositResult.status,
      message: 'Requête PIN envoyée sur le mobile de l\'utilisateur.'
    });

  } catch (err: any) {
    console.error('[pawapay-initiate] Critical error:', err);
    return NextResponse.json({ error: err.message || 'Une erreur interne est survenue.' }, { status: 500 });
  }
}
