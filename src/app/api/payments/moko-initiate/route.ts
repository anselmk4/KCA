import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createDirectClient } from '@supabase/supabase-js';

// Initialize a service role/admin client to bypass RLS when updating/inserting payments/orders on behalf of the system
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

    // 3. Format phone number to standard DRC national format (e.g. 0812345678)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('243')) {
      formattedPhone = '0' + formattedPhone.substring(3);
    } else if (!formattedPhone.startsWith('0') && formattedPhone.length === 9) {
      formattedPhone = '0' + formattedPhone;
    }

    // Validate phone number format (must be 10 digits for DRC)
    if (formattedPhone.length !== 10) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide. Il doit contenir 9 chiffres après l\'indicatif.' }, { status: 400 });
    }

    // 4. Fetch user profile for name details
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const fullName = profile?.full_name || 'Utilisateur Kuettu';
    const nameParts = fullName.split(' ');
    const firstname = nameParts[0] || 'Apprenant';
    const lastname = nameParts.slice(1).join(' ') || 'Kuettu';

    // 5. Generate references
    const orderId = crypto.randomUUID();
    const paymentId = crypto.randomUUID();
    const reference = type === 'STUDENT_COURSE' 
      ? `std_pay_${paymentId}` 
      : `ins_plan_${paymentId}`;

    // Determine the database client: use supabaseAdmin if the service role key is valid, otherwise use the authenticated user's client (which satisfies RLS checked columns)
    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && 
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin 
      : supabase;

    // 6. Save PENDING records in Supabase (to ensure robustness)
    try {
      // Insert Order
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
        currency: 'USD',
        coupon_id: couponId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any);

      if (orderError) throw orderError;

      // Insert Order Item
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

      // Insert Payment record
      const { error: paymentError } = await dbClient.from('payments').insert({
        id: paymentId,
        order_id: orderId,
        user_id: user.id,
        amount: amount,
        currency: 'USD',
        status: 'PENDING',
        provider: 'MOBILE_MONEY',
        method: carrier.toUpperCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any);

      if (paymentError) throw paymentError;

      // If Student course payment, also create a PENDING enrollment
      if (type === 'STUDENT_COURSE') {
        const { error: enrollError } = await dbClient.from('enrollments').upsert({
          student_id: user.id,
          course_id: itemId,
          progress_percent: 0,
          status: 'PENDING', // PENDING payment state
          enrolled_at: new Date().toISOString()
        } as any, { onConflict: 'student_id,course_id' });

        if (enrollError) {
          console.warn('[moko-initiate] Enrollment insert warning:', enrollError.message);
        }
      }
    } catch (dbErr: any) {
      console.error('[moko-initiate] Database error during setup:', dbErr.message);
      return NextResponse.json({ error: 'Erreur lors de la création de la transaction en base de données.' }, { status: 500 });
    }

    // 7. Make API request to Moko Afrika Gateway
    const mokoBaseUrl = process.env.MOKO_API_BASE_URL || 'https://paydrc.gofreshbakery.net';
    const mokoGatewayUrl = mokoBaseUrl.endsWith('/gateway')
      ? mokoBaseUrl
      : `${mokoBaseUrl.replace(/\/$/, '')}/gateway`;

    const mokoPayload = {
      merchant_id: process.env.MOKO_MERCHANT_ID,
      merchant_secrete: process.env.MOKO_MERCHANT_SECRET,
      amount: amount.toString(),
      currency: 'USD',
      action: 'debit',
      customer_number: formattedPhone,
      firstname,
      lastname,
      email: user.email || 'contact@ansella.app',
      reference,
      method: carrier,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ansella.app'}/api/webhooks/mobile-money`
    };

    console.log('[moko-initiate] Sending request to Moko:', mokoGatewayUrl, { ...mokoPayload, merchant_secrete: '***' });

    try {
      const response = await fetch(mokoGatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mokoPayload),
      });

      const responseText = await response.text();
      console.log('[moko-initiate] Moko response status:', response.status, 'body:', responseText);

      let responseData: any = {};
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { message: responseText };
      }

      if (!response.ok || responseData.Status === 'Failed' || responseData.status === 'Failed') {
        // Update payment to FAILED if Moko rejected it immediately
        await dbClient.from('payments').update({
          status: 'FAILED',
          failure_reason: responseData.message || responseData.Message || 'Rejeté par la passerelle',
          updated_at: new Date().toISOString()
        } as any).eq('id', paymentId);

        await dbClient.from('orders').update({
          status: 'CANCELLED',
          updated_at: new Date().toISOString()
        } as any).eq('id', orderId);

        return NextResponse.json({ 
          error: responseData.message || responseData.Message || 'La passerelle Mobile Money a rejeté la transaction.' 
        }, { status: 400 });
      }

      // Return success with references
      return NextResponse.json({
        success: true,
        reference,
        paymentId,
        orderId,
        message: 'Demande PIN envoyée avec succès.'
      });

    } catch (apiErr: any) {
      console.error('[moko-initiate] Moko API fetch error:', apiErr);
      
      // Update payment to FAILED since API is unreachable or errored
      await dbClient.from('payments').update({
        status: 'FAILED',
        failure_reason: apiErr.message || 'API Moko inaccessible',
        updated_at: new Date().toISOString()
      } as any).eq('id', paymentId);

      await dbClient.from('orders').update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString()
      } as any).eq('id', orderId);

      return NextResponse.json({ 
        error: 'Impossible de contacter le service Mobile Money. Veuillez réessayer.' 
      }, { status: 502 });
    }

  } catch (err: any) {
    console.error('[moko-initiate] General error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne du serveur' }, { status: 500 });
  }
}
