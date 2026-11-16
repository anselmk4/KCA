import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createPayPalDonationOrder } from '@/features/donations/services/paypal-donation';

const createOrderSchema = z.object({
  amount: z.number().positive({ message: 'Le montant du don doit être supérieur à 0' }),
  currency: z.string().min(3).max(4).default('USD'),
  donorName: z.string().optional().nullable(),
  donorEmail: z.string().email({ message: 'Format d\'email invalide' }).optional().nullable().or(z.literal('')),
  message: z.string().max(500).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const validation = createOrderSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { amount, currency, donorName, donorEmail, message } = validation.data;

    // Détecter l'utilisateur connecté optionnel
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Don anonyme / non connecté autorisé
    }

    const result = await createPayPalDonationOrder({
      amount,
      currency,
      donorName: donorName || undefined,
      donorEmail: donorEmail || undefined,
      message: message || undefined,
      userId,
    });

    if (!result.success || !result.orderId) {
      return NextResponse.json(
        { error: result.error || 'Impossible d\'initier la commande PayPal' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      donationId: result.donation?.id,
    });
  } catch (err: any) {
    console.error('[API /api/donations/paypal/create-order] Erreur non gérée:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}

