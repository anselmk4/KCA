import { NextRequest, NextResponse } from 'next/server';
import { updateDonationStatus, getDonationByReference } from '@/features/donations/services/donations-db';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let event: any = {};
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 });
    }

    const eventType = event.event_type;
    console.log(`[Webhook PayPal Donations] Événement reçu: ${eventType}`);

    const resource = event.resource || {};
    // orderId peut être dans resource.id, ou resource.supplementary_data.related_ids.order_id
    const orderId =
      resource.supplementary_data?.related_ids?.order_id ||
      resource.order_id ||
      (eventType?.startsWith('CHECKOUT.ORDER.') ? resource.id : null);

    if (!orderId) {
      console.log('[Webhook PayPal Donations] Aucun orderId associé trouvé dans l\'événement. Réponse 200.');
      return NextResponse.json({ received: true, ignored: true, reason: 'no_order_id' });
    }

    const existing = await getDonationByReference(orderId);
    if (!existing) {
      // Peut être un événement pour un cours ou produit régulier de la plateforme, on ignore poliment
      return NextResponse.json({ received: true, ignored: true, reason: 'not_a_donation' });
    }

    if (existing.status === 'completed') {
      console.log(`[Webhook PayPal Donations] Donation ${orderId} déjà complétée. Idempotent.`);
      return NextResponse.json({ received: true, status: 'already_completed' });
    }

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const payer = resource.payer;
      await updateDonationStatus({
        reference: orderId,
        status: 'completed',
        donorEmail: payer?.email_address,
        donorName: payer?.name ? `${payer.name.given_name || ''} ${payer.name.surname || ''}`.trim() : undefined,
        metadata: {
          webhookCapturedAt: new Date().toISOString(),
          paypalEventId: event.id,
          captureResource: resource,
        },
      });
      console.log(`[Webhook PayPal Donations] Donation ${orderId} marquée COMPLETED via webhook.`);
    } else if (eventType === 'PAYMENT.CAPTURE.DENIED' || eventType === 'CHECKOUT.ORDER.CANCELLED') {
      await updateDonationStatus({
        reference: orderId,
        status: 'failed',
        metadata: {
          webhookDeniedAt: new Date().toISOString(),
          paypalEventId: event.id,
          deniedReason: resource.status_details?.reason || 'Payment denied',
        },
      });
      console.log(`[Webhook PayPal Donations] Donation ${orderId} marquée FAILED via webhook.`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[Webhook PayPal Donations] Erreur de traitement:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}

