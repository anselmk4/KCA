import { createPayPalOrder, capturePayPalOrder } from '@/lib/paypal';
import { createPendingDonation, updateDonationStatus } from './donations-db';
import { DonationRecord } from '../types';

export interface CreatePayPalDonationArgs {
  amount: number;
  currency?: string;
  donorName?: string;
  donorEmail?: string;
  message?: string;
  userId?: string | null;
}

export interface CapturePayPalDonationArgs {
  orderId: string;
}

/**
 * Crée un ordre PayPal Checkout pour un don en s'alignant sur l'implémentation
 * éprouvée des paiements de cours et produits digitaux de la plateforme.
 */
export async function createPayPalDonationOrder(args: CreatePayPalDonationArgs): Promise<{
  success: boolean;
  orderId?: string;
  donation?: DonationRecord;
  error?: string;
}> {
  try {
    const formattedAmount = Number(args.amount).toFixed(2);
    const amountNum = Number(formattedAmount);

    if (amountNum <= 0) {
      return { success: false, error: 'Le montant du don doit être supérieur à 0 USD.' };
    }

    // Référence personnalisée passée dans custom_id pour traçabilité PayPal
    const tempRef = `DONATION_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const donorEmailSafe = (args.donorEmail || 'anonymous').trim().replace(/:/g, '_');
    const customId = `DONATION:${tempRef}:${donorEmailSafe}`;

    // 1. Création de l'ordre PayPal via la fonction native de la plateforme (identique à facturation / digital products)
    const orderData = await createPayPalOrder(amountNum, customId);
    const orderId = orderData.id;

    if (!orderId) {
      return { success: false, error: "Identifiant d'ordre PayPal non retourné." };
    }

    // 2. Enregistrement en base Supabase (statut pending)
    let donation: DonationRecord | undefined;
    try {
      const dbResult = await createPendingDonation({
        provider: 'paypal',
        provider_reference: orderId,
        amount: amountNum,
        currency: 'USD',
        donor_name: args.donorName || null,
        donor_email: args.donorEmail || null,
        message: args.message || null,
        user_id: args.userId || null,
        metadata: {
          paypalOrderId: orderId,
          paypalOrderStatus: orderData.status,
          customId,
        },
      });

      if (dbResult.success && dbResult.donation) {
        donation = dbResult.donation;
      }
    } catch (dbErr) {
      console.warn('[PayPalDonation] Enregistrement Supabase pending ignoré ou en différé:', dbErr);
    }

    return {
      success: true,
      orderId,
      donation,
    };
  } catch (err: any) {
    console.error('[PayPalDonation] Exception createPayPalDonationOrder:', err);
    return {
      success: false,
      error: err.message || "Erreur lors de l'initialisation de la commande PayPal.",
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
    // 1. Capture via l'API PayPal officielle (même méthode que pour les cours et produits)
    const captureData = await capturePayPalOrder(orderId);

    if (captureData.status === 'COMPLETED') {
      const purchaseUnit = captureData.purchase_units?.[0];
      const captureId = purchaseUnit?.payments?.captures?.[0]?.id || orderId;
      const amountCaptured = parseFloat(
        purchaseUnit?.payments?.captures?.[0]?.amount?.value || '0'
      );
      const payer = captureData.payer;
      const payerEmail = payer?.email_address;
      const payerName = payer?.name
        ? `${payer.name.given_name || ''} ${payer.name.surname || ''}`.trim()
        : undefined;

      // 2. Mise à jour de la table donations vers 'completed'
      let finalDonation: DonationRecord | undefined;
      try {
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

        if (updateRes.donation) {
          finalDonation = updateRes.donation;
        } else {
          // Si non présent au moment du pending, insérer directement
          const insertRes = await createPendingDonation({
            provider: 'paypal',
            provider_reference: orderId,
            amount: amountCaptured || 0,
            currency: 'USD',
            donor_name: payerName || null,
            donor_email: payerEmail || null,
            metadata: {
              paypalCaptureId: captureId,
              paypalPayer: payer,
              capturePayload: captureData,
            },
          });
          if (insertRes.donation) {
            const finalRes = await updateDonationStatus({
              reference: orderId,
              status: 'completed',
            });
            finalDonation = finalRes.donation || insertRes.donation;
          }
        }
      } catch (dbErr) {
        console.warn('[PayPalDonation] Avertissement écriture DB lors de la capture:', dbErr);
      }

      return {
        success: true,
        status: 'COMPLETED',
        donation: finalDonation,
      };
    } else {
      return {
        success: false,
        status: captureData.status,
        error: `Statut de capture non finalisé : ${captureData.status}`,
      };
    }
  } catch (err: any) {
    console.error('[PayPalDonation] Exception capturePayPalDonationOrder:', err);
    return {
      success: false,
      error: err.message || 'Erreur lors de la capture du don PayPal.',
    };
  }
}
