import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { 
  initiatePawaPayDeposit, 
  getPawaPayConfigForCountry, 
  detectPawaPayCountry,
  formatPawaPayPhoneNumber,
  normalizePawaPayCorrespondent,
  calculatePawaPayAmountWithFee,
  PAWAPAY_FEE_RATE
} from '@/lib/pawapay';
import { resolveCoursePricing } from '@/lib/payment-pricing';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verify user session or allow guest checkout with email for digital products
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // 2. Parse request body
    const body = await req.json();
    const { 
      amount, 
      phoneNumber, 
      carrier, 
      type, 
      itemId, 
      cycle, 
      couponId, 
      country, 
      payInstallment, 
      currency,
      userEmail,
      userName
    } = body;

    if (!amount || !phoneNumber || !carrier || !type || !itemId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    if (!user && type !== 'DIGITAL_PRODUCT') {
      return NextResponse.json({ error: 'Non authentifié. Veuillez vous connecter.' }, { status: 401 });
    }

    if (!user && !userEmail) {
      return NextResponse.json({ error: 'Veuillez fournir une adresse email pour recevoir votre produit digital.' }, { status: 400 });
    }

    // 3. Fetch user profile to retrieve country if authenticated
    let profile = null;
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('country, nationality')
        .eq('id', user.id)
        .maybeSingle();
      profile = data;
    }

    // Auto-detect country configuration (phone number prefix, operator suffix, or fallback country)
    const countryConfig = detectPawaPayCountry(phoneNumber, carrier, country || profile?.nationality || profile?.country);
    const userCountry = countryConfig.countryCode;

    if (!countryConfig) {
      return NextResponse.json({ error: `PawaPay n'est pas disponible pour votre pays.` }, { status: 400 });
    }

    // Format phone number according to country configuration prefix
    const formattedPhone = formatPawaPayPhoneNumber(phoneNumber, countryConfig.phonePrefix);

    // Extract string representation of carrier safely
    const carrierStr = typeof carrier === 'string' 
      ? carrier 
      : (typeof carrier === 'object' && carrier !== null ? (carrier.id || carrier.name || '') : String(carrier || ''));

    let effectiveCarrier = normalizePawaPayCorrespondent(carrierStr);
    const carrierUpper = carrierStr.toUpperCase();

    // Validate and resolve carrier belonging to countryConfig operators
    const matchedOperator = countryConfig.operators.find(op => {
      const opIdUpper = (op.id || '').toUpperCase();
      const opNameLower = (op.name || '').toLowerCase();
      return (
        op.id === effectiveCarrier || 
        op.id === carrierStr ||
        (carrierUpper.length > 0 && opIdUpper.startsWith(carrierUpper)) ||
        (carrierUpper.length > 0 && carrierUpper.includes(opIdUpper.split('_')[0])) ||
        (carrierStr.length > 0 && opNameLower.includes(carrierStr.toLowerCase()))
      );
    }) || countryConfig.operators[0];

    if (!matchedOperator) {
      return NextResponse.json({ error: `Opérateur ${carrierStr} invalide pour le pays ${userCountry}` }, { status: 400 });
    }

    effectiveCarrier = matchedOperator.id;

    // 4. Generate references
    const orderId = crypto.randomUUID();
    const paymentId = crypto.randomUUID(); // This will serve as our depositId for PawaPay

    // Determine dbClient (use supabaseAdmin to bypass RLS)
    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && 
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin 
      : supabase;

    // Server-side verification and calculation of base price + discount to prevent tampering
    let baseAmount = 0;
    let subtotal = 0;
    let discountAmount = 0;
    let validatedCouponId: string | null = null;

    if (type === 'STUDENT_COURSE') {
      const pricingResult = await resolveCoursePricing({
        courseId: itemId,
        payInstallment,
        couponId,
      });

      if (!pricingResult.data) {
        return NextResponse.json(
          { error: pricingResult.error || 'Cours introuvable.' },
          { status: pricingResult.status || 404 }
        );
      }

      subtotal = pricingResult.data.subtotal;
      discountAmount = pricingResult.data.discountAmount;
      baseAmount = pricingResult.data.baseAmount;
      validatedCouponId = pricingResult.data.validCouponId;
    } else if (type === 'INSTRUCTOR_PLAN') {
      const planPrices: Record<string, { monthly: number; annual: number }> = {
        BASE: { monthly: 15, annual: 144 },
        PRO: { monthly: 29, annual: 278 },
        MAX: { monthly: 59, annual: 566 }
      };
      const planConfig = planPrices[itemId?.toUpperCase()];
      if (!planConfig) {
        return NextResponse.json({ error: 'Plan formateur invalide.' }, { status: 400 });
      }
      baseAmount = cycle === 'ANNUAL' ? planConfig.annual : planConfig.monthly;
      subtotal = baseAmount;
    } else if (type === 'DIGITAL_PRODUCT') {
      const { data: product, error: prodErr } = await supabaseAdmin
        .from('digital_products')
        .select('id, price, title, author_id')
        .eq('id', itemId)
        .maybeSingle();

      if (prodErr || !product) {
        return NextResponse.json({ error: 'Produit digital introuvable.' }, { status: 404 });
      }

      baseAmount = Number(product.price);
      subtotal = baseAmount;
    } else {
      return NextResponse.json({ error: 'Type de paiement invalide.' }, { status: 400 });
    }

    if (baseAmount <= 0) {
      return NextResponse.json({ error: 'Montant à payer invalide.' }, { status: 400 });
    }

    // Résolution de l'identifiant utilisateur (connecté ou invité par email)
    let effectiveUserId = user?.id;
    if (!effectiveUserId && userEmail) {
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      if (existingProfile?.id) {
        effectiveUserId = existingProfile.id;
      } else {
        effectiveUserId = crypto.randomUUID();
      }
    }

    // Apply PawaPay Mobile Money fee surcharge (+2.5% standard).
    // The user pays baseAmount + feeAmount so that the platform does not absorb PawaPay transaction fees.
    const { feeAmount, totalAmount: calculatedAmountWithFee } = calculatePawaPayAmountWithFee(baseAmount);

    // 5. Save PENDING records in database (USD equivalent for bookkeeping and DB constraints)
    try {
      const orderNumber = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Tentative d'insertion dans la table orders
      try {
        await dbClient.from('orders').insert({
          id: orderId,
          order_number: orderNumber,
          user_id: effectiveUserId,
          status: 'PENDING',
          subtotal: subtotal,
          discount_amount: discountAmount,
          tax_amount: feeAmount, // Store PawaPay fee surcharge
          total: calculatedAmountWithFee, // Full debited amount
          currency: 'USD',
          coupon_id: validatedCouponId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any);
      } catch (orderErr: any) {
        if (type !== 'DIGITAL_PRODUCT') throw orderErr;
        console.warn('[pawapay-initiate] Orders insert skipped or non-critical for guest digital product:', orderErr?.message);
      }

      // Insert Order Item — only for real course purchases (FK constraint on course_id)
      if (type === 'STUDENT_COURSE') {
        const { error: itemError } = await dbClient.from('order_items').insert({
          id: crypto.randomUUID(),
          order_id: orderId,
          course_id: itemId,
          unit_price: subtotal,
          discount_amount: discountAmount,
          final_price: baseAmount,
          created_at: new Date().toISOString()
        } as any);

        if (itemError) throw itemError;
      }

      const encodedBuyerMeta = encodeURIComponent(userEmail || user?.email || userName || 'client');
      const { error: paymentError } = await dbClient.from('payments').insert({
        id: paymentId,
        order_id: orderId,
        user_id: effectiveUserId,
        amount: calculatedAmountWithFee, // Full debited amount
        currency: 'USD',
        status: 'PENDING',
        provider: 'MOBILE_MONEY',
        // Encode carrier, type, itemId and cycle/email for webhook resolution
        method: `${carrier}::${type}::${itemId}::${type === 'DIGITAL_PRODUCT' ? encodedBuyerMeta : (cycle || 'MONTHLY')}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any);

      if (paymentError) {
        console.warn('[pawapay-initiate] Payment insert warning:', paymentError.message);
      }

      if (type === 'STUDENT_COURSE' && user) {
        const { error: enrollError } = await dbClient.from('enrollments').upsert({
          student_id: user.id,
          course_id: itemId,
          progress_percent: 0,
          status: 'INACTIVE',
          enrolled_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any, { onConflict: 'student_id,course_id' });

        if (enrollError) {
          console.warn('[pawapay-initiate] Enrollment upsert warning:', enrollError.message);
        }
      }

      // Pour les produits digitaux, pré-enregistrer la ligne d'achat en attente (PENDING)
      if (type === 'DIGITAL_PRODUCT') {
        try {
          await dbClient.from('digital_product_purchases').upsert({
            product_id: itemId,
            user_id: effectiveUserId,
            price_paid: calculatedAmountWithFee,
            payment_method: 'pawapay',
            payment_status: 'PENDING',
            transaction_id: paymentId,
            created_at: new Date().toISOString(),
          } as any, { onConflict: 'product_id,user_id' });
        } catch (purInitErr: any) {
          console.warn('[pawapay-initiate] digital_product_purchases PENDING upsert warning:', purInitErr?.message);
        }
      }
    } catch (dbErr: any) {
      console.error('[pawapay-initiate] Database setup error:', dbErr);
      return NextResponse.json({ 
        error: `Erreur d'enregistrement de la commande : ${dbErr?.message || dbErr?.details || JSON.stringify(dbErr)}` 
      }, { status: 500 });
    }

    // Convert amount (with fee surcharge included) to target currency for billing the user via PawaPay Mobile Money
    const isDRC = countryConfig.countryCode === 'CD';
    const isUSDRequested = (currency || '').toUpperCase() === 'USD';

    let targetCurrency = countryConfig.currency;
    let targetAmount = Math.round(calculatedAmountWithFee * countryConfig.exchangeRate);

    if (isDRC && isUSDRequested) {
      targetCurrency = 'USD';
      targetAmount = calculatedAmountWithFee;
    }

    // Build meaningful payment description for mobile money statement (max 22 chars, alphanumeric & spaces only)
    let statementDescription = "Ansella Academy";
    if (type === 'INSTRUCTOR_PLAN') {
      statementDescription = `Ansella Plan ${itemId.toUpperCase()}`;
    } else if (type === 'STUDENT_COURSE') {
      statementDescription = `Ansella Cours ${calculatedAmountWithFee}`;
    }
    // Strict PawaPay rule: only alphanumeric and spaces
    statementDescription = statementDescription.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 22);

    // 6. Request deposit via PawaPay API
    const depositResult = await initiatePawaPayDeposit({
      amount: targetAmount,
      currency: targetCurrency,
      correspondent: effectiveCarrier,
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
