import { NextRequest, NextResponse } from 'next/server';
import { updateDonationStatus, getDonationByReference } from '@/features/donations/services/donations-db';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Format JSON invalide' }, { status: 400 });
    }

    console.log('[Webhook PawaPay Donations] Notification reçue:', body);

    // Extraction des champs PawaPay
    // PawaPay envoie soit { depositId, status, failureReason... } soit un tableau
    const payload = Array.isArray(body) ? body[0] : body;
    const depositId = payload?.depositId || payload?.deposit_id;
    const rawStatus = (payload?.status || '').toUpperCase();

    if (!depositId) {
      console.warn('[Webhook PawaPay Donations] depositId manquant dans le payload:', payload);
      // Répondre 200 pour éviter que PawaPay boucle indéfiniment sur une charge mal formée
      return NextResponse.json({ received: true, ignored: true, reason: 'missing_deposit_id' });
    }

    // Vérifier si la donation existe
    const existing = await getDonationByReference(depositId);
    if (!existing) {
      console.warn(`[Webhook PawaPay Donations] Aucune donation trouvée pour depositId: ${depositId}`);
      return NextResponse.json({ received: true, ignored: true, reason: 'donation_not_found' });
    }

    // Idempotence : si déjà complété, ne rien changer
    if (existing.status === 'completed') {
      console.log(`[Webhook PawaPay Donations] Donation ${depositId} déjà complétée. Traitement ignoré.`);
      return NextResponse.json({ received: true, status: 'already_completed' });
    }

    let nextStatus: 'completed' | 'failed' | 'pending' = 'pending';
    if (rawStatus === 'COMPLETED' || rawStatus === 'PAID' || rawStatus === 'SUCCESS') {
      nextStatus = 'completed';
    } else if (
      rawStatus === 'FAILED' ||
      rawStatus === 'REJECTED' ||
      rawStatus === 'CANCELLED' ||
      rawStatus === 'EXPIRED'
    ) {
      nextStatus = 'failed';
    }

    // Mise à jour de la table
    await updateDonationStatus({
      reference: depositId,
      status: nextStatus,
      metadata: {
        webhookReceivedAt: new Date().toISOString(),
        webhookPayload: payload,
      },
    });

    console.log(`[Webhook PawaPay Donations] Statut mis à jour pour ${depositId} -> ${nextStatus}`);
    return NextResponse.json({ received: true, status: nextStatus });
  } catch (err: any) {
    console.error('[Webhook PawaPay Donations] Erreur de traitement:', err);
    // En serverless, renvoyer 200 ou 500 selon criticité
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}

