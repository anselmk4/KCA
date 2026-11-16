import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { initiatePawaPayDonation } from '@/features/donations/services/pawapay-donation';

// Schéma de validation strict avec Zod
const initiateSchema = z.object({
  amount: z.number().positive({ message: 'Le montant du don doit être supérieur à 0' }),
  currency: z.string().min(3).max(4).default('USD'),
  phoneNumber: z.string().min(6, { message: 'Numéro de téléphone requis' }),
  operatorId: z.string().min(2, { message: 'Opérateur Mobile Money requis' }),
  countryCode: z.string().min(2).max(3).default('CD'),
  donorName: z.string().optional().nullable(),
  donorEmail: z.string().email({ message: 'Format d\'email invalide' }).optional().nullable().or(z.literal('')),
  message: z.string().max(500, { message: 'Message trop long (max 500 caractères)' }).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const validation = initiateSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { amount, currency, phoneNumber, operatorId, countryCode, donorName, donorEmail, message } =
      validation.data;

    // Détecter si l'utilisateur est connecté pour lier optionnellement son compte
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Ignorer l'erreur d'auth : les dons anonymes ou non connectés sont pleinement autorisés
    }

    const result = await initiatePawaPayDonation({
      amount,
      currency,
      phoneNumber,
      operatorId,
      countryCode,
      donorName: donorName || undefined,
      donorEmail: donorEmail || undefined,
      message: message || undefined,
      userId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Échec de l\'initiation du paiement PawaPay' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      depositId: result.depositId,
      donationId: result.donation?.id,
      amount: result.donation?.amount,
      currency: result.donation?.currency,
      status: result.donation?.status,
    });
  } catch (err: any) {
    console.error('[API /api/donations/pawapay/initiate] Erreur non gérée:', err);
    return NextResponse.json(
      { error: err?.message || 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

