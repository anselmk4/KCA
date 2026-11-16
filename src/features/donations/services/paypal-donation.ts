import { getPayPalAccessToken } from '@/lib/paypal';
import { createPendingDonation, updateDonationStatus } from './donations-db';
import { DonationRecord } from '../types';

const PAYPAL_API_BASE = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

export interface CreatePayPalDonationArgs {
  amount: number;
  currency: string;
  donorName?: string;
  donorEmail?: string;
  message?: string;
  userId?: string | null;
}

export interface CapturePayPalDonationArgs {
  orderId: string;
}

/**
 * Crée un ordre PayPal Checkout pour un don et stocke la donation en statut 'pending'.
 */
export async function createPayPalDonationOrder(args: CreatePayPalDonationArgs): Promise<{
  success: boolean;
  orderId?: string;
  donation?: DonationRecord;
  error?: string;
}> {
  try {
    let accessToken: string;
    try {
      accessToken = await getPayPalAccessToken();
    } catch (authErr: any) {
      console.error('[PayPalDonation] Erreur authentification PayPal:', authErr);
      return {
        success: false,
        error: 'La passerelle PayPal n\'est pas encore configurée. Veuillez utiliser Mobile Money ou contacter l\'administrateur.',
      };
    }
    const currency = (args.currency || 'USD').toUpperCase();
    const formattedAmount = Number(args.amount).toFixed(2);

    // 1. Appeler l'API PayPal pour créer l'ordre
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            description: 'Don pour soutenir Ansella LMS',
            amount: {
              currency_code: currency,
              value: formattedAmount,
            },
          },
        ],
        application_context: {
          brand_name: 'Ansella LMS',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PayPalDonation] Erreur création ordre PayPal:', response.status, errorText);
      return {
        success: false,
        error: `Erreur PayPal (${response.status}): ${errorText}`,
      };
    }

    const orderData = await response.json();
    const orderId = orderData.id;

    if (!orderId) {
      return { success: false, error: 'Identifiant d\'ordre PayPal non retourné.' };
    }

    // 2. Enregistrer la donation en 'pending' dans Supabase
    const dbResult = await createPendingDonation({
      provider: 'paypal',
      provider_reference: orderId,
      amount: Number(formattedAmount),
      currency,
      donor_name: args.donorName || null,
      donor_email: args.donorEmail || null,
      message: args.message || null,
      user_id: args.userId || null,
      metadata: {
        paypalOrderId: orderId,
        paypalOrderStatus: orderData.status,
      },
    });

    if (!dbResult.success || !dbResult.donation) {
      return {
        success: false,
        error: dbResult.error || 'Impossible d\'enregistrer le don en base.',
      };
    }

    return {
      success: true,
      orderId,
      donation: dbResult.donation,
    };
  } catch (err: any) {
    console.error('[PayPalDonation] Exception createPayPalDonationOrder:', err);
    return {
      success: false,
      error: err.message || 'Erreur interne lors de la création de l\'ordre PayPal.',
    };
  }
}

/**
 * Capture un ordre PayPal Checkout après approbation et finalise la donation dans Supabase.
 */
export async function capturePayPalDonationOrder(args: CapturePayPalDonationArgs): Promise<{
  success: boolean;
  status?: string;
  donation?: DonationRecord;
  error?: string;
}> {
  const { orderId } = args;

  try {
    const accessToken = await getPayPalAccessToken();

    // 1. Appeler l'API de capture PayPal
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const responseText = await response.text();
    let captureData: any = {};
    try {
      captureData = JSON.parse(responseText);
    } catch {
      captureData = { raw: responseText };
    }

    if (!response.ok) {
      console.error('[PayPalDonation] Erreur capture PayPal:', response.status, responseText);
      
      const issue = captureData?.details?.[0]?.issue || captureData?.name;
      const desc = captureData?.details?.[0]?.description || captureData?.message;

      let friendlyMessage = `Échec de la capture PayPal : HTTP ${response.status}`;
      if (issue === 'ORDER_ALREADY_CAPTURED') {
        // Idempotent: si déjà capturé, vérifier le statut existant en base
        const updateRes = await updateDonationStatus({
          reference: orderId,
          status: 'completed',
          metadata: { paypalAlreadyCaptured: true },
        });
        return {
          success: true,
          status: 'COMPLETED',
          donation: updateRes.donation,
        };
      } else if (issue === 'INSTRUMENT_DECLINED') {
        friendlyMessage = 'Votre moyen de paiement (carte ou compte bancaire) a été refusé par l\'émetteur.';
      } else if (desc) {
        friendlyMessage = desc;
      }

      await updateDonationStatus({
        reference: orderId,
        status: 'failed',
        metadata: {
          captureError: friendlyMessage,
          details: captureData,
        },
      });

      return {
        success: false,
        error: friendlyMessage,
      };
    }

    const captureStatus = captureData.status;

    if (captureStatus === 'COMPLETED') {
      const payer = captureData.payer;
      const payerEmail = payer?.email_address;
      const payerName = payer?.name
        ? `${payer.name.given_name || ''} ${payer.name.surname || ''}`.trim()
        : undefined;

      const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;

      const updateRes = await updateDonationStatus({
        reference: orderId,
        status: 'completed',
        donorEmail: payerEmail,
        donorName: payerName,
        metadata: {
          paypalCaptureId: captureId,
          paypalPayer: payer,
          capturePayload: captureData,
        },
      });

      return {
        success: true,
        status: 'COMPLETED',
        donation: updateRes.donation,
      };
    } else {
      await updateDonationStatus({
        reference: orderId,
        status: 'failed',
        metadata: {
          uncompletedStatus: captureStatus,
          captureData,
        },
      });

      return {
        success: false,
        status: captureStatus,
        error: `Statut de capture non finalisé : ${captureStatus}`,
      };
    }
  } catch (err: any) {
    console.error('[PayPalDonation] Exception capturePayPalDonationOrder:', err);
    return {
      success: false,
      error: err.message || 'Erreur interne lors de la capture PayPal.',
    };
  }
}

