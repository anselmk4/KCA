import { NextRequest, NextResponse } from 'next/server';
import { checkPawaPayDonationStatus } from '@/features/donations/services/pawapay-donation';
import { getDonationByReference } from '@/features/donations/services/donations-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const depositId = searchParams.get('depositId');

    if (!depositId) {
      return NextResponse.json({ error: 'depositId requis' }, { status: 400 });
    }

    // 1. Consulter d'abord la base de données locale
    const localDonation = await getDonationByReference(depositId);

    // Si déjà finalisé en base (completed ou failed), retourner immédiatement sans appeler l'API externe
    if (localDonation && (localDonation.status === 'completed' || localDonation.status === 'failed')) {
      return NextResponse.json({
        success: true,
        depositId,
        status: localDonation.status,
        donation: localDonation,
      });
    }

    // 2. Si encore pending, interroger l'API PawaPay
    const result = await checkPawaPayDonationStatus(depositId);

    return NextResponse.json({
      success: result.success,
      depositId,
      status: result.status || localDonation?.status || 'pending',
      donation: result.donation || localDonation,
      error: result.error,
    });
  } catch (err: any) {
    console.error('[API /api/donations/pawapay/status] Erreur:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}

