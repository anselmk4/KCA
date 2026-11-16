import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { capturePayPalDonationOrder } from '@/features/donations/services/paypal-donation';

const captureSchema = z.object({
  orderId: z.string().min(5, { message: 'orderId requis' }),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const validation = captureSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'orderId manquant ou invalide' },
        { status: 400 }
      );
    }

    const { orderId } = validation.data;

    const result = await capturePayPalDonationOrder({ orderId });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'La capture PayPal a échoué' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      donation: result.donation,
    });
  } catch (err: any) {
    console.error('[API /api/donations/paypal/capture-order] Erreur non gérée:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}

