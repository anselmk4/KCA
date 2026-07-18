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
    const { amount, phoneNumber, carrier, type, itemId, couponId, country, payInstallment } = body;

    if (!amount || !phoneNumber || !carrier || !type || !itemId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // 3. Fetch user profile to retrieve country
    const { data: profile } = await supabase
      .from('profiles')
      .select('country, nationality')
      .eq('id', user.id)
      .maybeSingle();

    const userCountry = country || profile?.nationality || profile?.country || 'CD';
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

    // Server-side verification and calculation of price + discount to prevent tampering
    let calculatedAmount = amount;
    let subtotal = amount;
    let discountAmount = 0;

    if (type === 'STUDENT_COURSE') {
      const { data: course } = await supabaseAdmin
        .from('courses')
        .select('price, allow_installments, installments_count')
        .eq('id', itemId)
        .maybeSingle();

      if (course) {
        const originalPrice = parseFloat(course.price as any) || 0;
        let baseAmount = originalPrice;

        if (payInstallment && course.allow_installments && course.installments_count) {
          baseAmount = Math.round(originalPrice / course.installments_count);
        }

        subtotal = baseAmount;

        if (couponId) {
          const { data: coupon } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .eq('id', couponId)
            .eq('is_active', true)
            .maybeSingle();

          if (coupon) {
            if (coupon.discount_type === 'PERCENTAGE') {
              discountAmount = Math.round(baseAmount * (parseFloat(coupon.discount_value as any) / 100));
            } else if (coupon.discount_type === 'FIXED') {
              discountAmount = parseFloat(coupon.discount_value as any) || 0;
            }
          }
        }

        calculatedAmount = Math.max(0, baseAmount - discountAmount);
      }
    }

    // 5. Save PENDING records in database (USD equivalent for bookkeeping and DB constraints)
    try {
      const orderNumber = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { error: orderError } = await dbClient.from('orders').insert({
        id: orderId,
        order_number: orderNumber,
        user_id: user.id,
        status: 'PENDING',
        subtotal: subtotal,
        discount_amount: discountAmount,
        tax_amount: 0,
        total: calculatedAmount,
        currency: 'USD', // Standardized currency in DB to match prices
        coupon_id: couponId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any);

      if (orderError) throw orderError;

      // Insert Order Item — only for real course purchases (FK constraint on course_id)
      if (type === 'STUDENT_COURSE') {
        const { error: itemError } = await dbClient.from('order_items').insert({
          id: crypto.randomUUID(),
          order_id: orderId,
          course_id: itemId,
          unit_price: subtotal,
          discount_amount: discountAmount,
          final_price: calculatedAmount,
          created_at: new Date().toISOString()
        } as any);

        if (itemError) throw itemError;
      }

      const { error: paymentError } = await dbClient.from('payments').insert({
        id: paymentId,
        order_id: orderId,
        user_id: user.id,
        amount: calculatedAmount,
        currency: 'USD',
        status: 'PENDING',
        provider: 'MOBILE_MONEY',
        // Encode carrier, type and itemId for webhook resolution (no schema change needed)
        method: `${carrier}::${type}::${itemId}`,
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
      console.error('[pawapay-initiate] Database setup error:', dbErr);
      return NextResponse.json({ 
        error: `Erreur d'enregistrement de la commande : ${dbErr?.message || dbErr?.details || JSON.stringify(dbErr)}` 
      }, { status: 500 });
    }

    // Convert amount to local currency for billing the user via PawaPay Mobile Money
    const localAmount = Math.round(calculatedAmount * countryConfig.exchangeRate);

    // Build meaningful payment description for mobile money statement (max 22 chars)
    let statementDescription = "Ansella Academy";
    if (type === 'INSTRUCTOR_PLAN') {
      statementDescription = `Ansella Plan ${itemId.toUpperCase()}`.substring(0, 22);
    } else if (type === 'STUDENT_COURSE') {
      statementDescription = `Ansella Cours $${calculatedAmount}`.substring(0, 22);
    }

    // 6. Request deposit via PawaPay sandbox API
    const depositResult = await initiatePawaPayDeposit({
      amount: localAmount,
      currency: countryConfig.currency,
      correspondent: carrier,
      phoneNumber: formattedPhone,
      depositId: paymentId,
      statementDescription
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
      isSandbox: process.env.PAWAPAY_ENVIRONMENT !== "production",
      message: 'Requête PIN envoyée sur le mobile de l\'utilisateur.'
    });

  } catch (err: any) {
    console.error('[pawapay-initiate] Critical error:', err);
    return NextResponse.json({ error: err.message || 'Une erreur interne est survenue.' }, { status: 500 });
  }
}
