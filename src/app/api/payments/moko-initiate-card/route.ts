import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createDirectClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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
    const { amount, type, itemId, couponId } = body;

    if (!amount || !type || !itemId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // 3. Fetch user profile for name details
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const fullName = profile?.full_name || 'Utilisateur Kuettu';
    const nameParts = fullName.split(' ');
    const firstname = nameParts[0] || 'Apprenant';
    const lastname = nameParts.slice(1).join(' ') || 'Kuettu';

    // 4. Generate references
    const orderId = crypto.randomUUID();
    const paymentId = crypto.randomUUID();
    const reference = type === 'STUDENT_COURSE' 
      ? `std_pay_${paymentId}` 
      : `ins_plan_${paymentId}`;

    // Determine the database client: use supabaseAdmin if the service role key is valid
    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && 
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin 
      : supabase;

    // 5. Save PENDING records in Supabase
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
        provider: 'MOKO_CARD',
        status: 'PENDING',
        method: 'CARD',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any);

      if (paymentError) throw paymentError;

    } catch (dbErr: any) {
      console.error('[moko-initiate-card] Database error during setup:', dbErr.message);
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement de la commande.' }, { status: 500 });
    }

    // 6. Make request to Moko Afrika Card hosted checkout API
    const apiKey = process.env.MOKO_CARD_API_KEY;
    const apiSecret = process.env.MOKO_CARD_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('[moko-initiate-card] Missing API Key or Secret');
      return NextResponse.json({ error: 'Le paiement par carte n\'est pas encore configuré.' }, { status: 500 });
    }

    const isSandbox = (process.env.MOKO_API_BASE_URL || '').includes('sandbox') || (process.env.MOKO_API_BASE_URL || '').includes('paydrc');
    const mokoCardEndpoint = process.env.MOKO_CARD_API_URL || (isSandbox 
      ? 'https://test.card.gofreshpay.com/api/v1/payment/orders' 
      : 'https://card.gofreshpay.com/api/v1/payment/orders');

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ansella.app'}/api/webhooks/mobile-money`;

    const mokoPayload = {
      amount: amount.toString(),
      currency: 'USD',
      reference: reference,
      email: user.email || 'contact@ansella.app',
      firstname: firstname,
      lastname: lastname,
      callback_url: callbackUrl
    };

    // Canonicalize JSON payload by sorting keys alphabetically
    const sortKeys = (obj: any) => {
      const sorted: any = {};
      Object.keys(obj).sort().forEach(key => {
        sorted[key] = obj[key];
      });
      return sorted;
    };

    const payloadString = JSON.stringify(sortKeys(mokoPayload));
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto.createHmac('sha256', apiSecret)
      .update(payloadString + timestamp)
      .digest('hex');

    console.log('[moko-initiate-card] Sending order creation request to Moko Card API:', mokoCardEndpoint, {
      reference,
      timestamp,
      payload: payloadString
    });

    try {
      const response = await fetch(mokoCardEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          'X-Timestamp': timestamp,
          'X-Signature': signature
        },
        body: payloadString
      });

      const responseText = await response.text();
      console.log('[moko-initiate-card] Moko Card API raw response:', responseText);
      let responseData: any = {};
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonErr) {
        console.warn('[moko-initiate-card] Response is not JSON:', responseText);
      }

      if (!response.ok) {
        throw new Error(responseData.message || responseData.Message || `HTTP ${response.status}`);
      }

      // FreshPay Card Orders API returns the redirect_url or checkout_url
      const redirectUrl = responseData.redirect_url || responseData.payment_url || responseData.checkout_url || responseData.data?.redirect_url;

      if (!redirectUrl) {
        console.error('[moko-initiate-card] Redirect URL missing in response:', responseData);
        throw new Error('URL de redirection manquante dans la réponse de la passerelle.');
      }

      return NextResponse.json({ 
        paymentId,
        redirectUrl 
      });

    } catch (apiErr: any) {
      console.error('[moko-initiate-card] Moko Card API error:', apiErr);
      
      // Update payment to FAILED if Moko rejected it immediately
      await dbClient.from('payments').update({
        status: 'FAILED',
        failure_reason: apiErr.message || 'Échec lors de l\'initiation de la carte',
        updated_at: new Date().toISOString()
      } as any).eq('id', paymentId);

      return NextResponse.json({ 
        error: apiErr.message || 'Impossible d\'initier la session de paiement par carte.' 
      }, { status: 400 });
    }

  } catch (err: any) {
    console.error('[moko-initiate-card] General error:', err);
    return NextResponse.json({ error: err.message || 'Une erreur interne est survenue.' }, { status: 500 });
  }
}
