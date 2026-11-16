import crypto from 'crypto';
import { 
  initiatePawaPayDeposit, 
  getPawaPayDepositStatus, 
  formatPawaPayPhoneNumber, 
  normalizePawaPayCorrespondent,
  PAWAPAY_COUNTRY_MAPPING
} from '@/lib/pawapay';
import { createPendingDonation, updateDonationStatus } from './donations-db';
import { DonationRecord } from '../types';

export interface InitiatePawaPayDonationArgs {
  amount: number;
  currency: string;
  phoneNumber: string;
  operatorId: string;
  countryCode: string;
  donorName?: string;
  donorEmail?: string;
  message?: string;
  userId?: string | null;
}

export interface InitiatePawaPayDonationResult {
  success: boolean;
  depositId: string;
  donation?: DonationRecord;
  error?: string;
}

/**
 * Initie un don par Mobile Money via la passerelle PawaPay.
 */
export async function initiatePawaPayDonation(
  args: InitiatePawaPayDonationArgs
): Promise<InitiatePawaPayDonationResult> {
  const depositId = crypto.randomUUID();

  // 1. Déterminer la configuration du pays
  const countryConfig = PAWAPAY_COUNTRY_MAPPING.find(
    (c) => c.countryCode.toUpperCase() === (args.countryCode || 'CD').toUpperCase()
  ) || PAWAPAY_COUNTRY_MAPPING[0];

  // 2. Nettoyer et formater le numéro de téléphone avec l'indicatif
  const formattedPhone = formatPawaPayPhoneNumber(args.phoneNumber, countryConfig.phonePrefix);
  const normalizedOperator = normalizePawaPayCorrespondent(args.operatorId);

  // 3. Formater le montant
  // USD autorise jusqu'à 2 décimales, les monnaies africaines (CDF, XAF, XOF, etc.) sont des entiers
  let cleanAmount = args.amount;
  if (args.currency.toUpperCase() === 'USD') {
    cleanAmount = Number(args.amount.toFixed(2));
  } else {
    cleanAmount = Math.round(args.amount);
  }

  // 4. Créer la donation en base Supabase en statut 'pending'
  const dbResult = await createPendingDonation({
    provider: 'pawapay',
    provider_reference: depositId,
    amount: cleanAmount,
    currency: args.currency.toUpperCase(),
    donor_name: args.donorName || null,
    donor_email: args.donorEmail || null,
    message: args.message || null,
    user_id: args.userId || null,
    metadata: {
      operator: normalizedOperator,
      country: countryConfig.countryCode,
      phoneNumber: formattedPhone,
      purpose: 'Ansella LMS Donation',
    },
  });

  if (!dbResult.success || !dbResult.donation) {
    return {
      success: false,
      depositId,
      error: dbResult.error || 'Impossible d\'enregistrer le don en base de données.',
    };
  }

  // 5. Appeler l'API PawaPay
  try {
    const depositResponse = await initiatePawaPayDeposit({
      depositId,
      amount: cleanAmount,
      currency: args.currency.toUpperCase(),
      correspondent: normalizedOperator,
      phoneNumber: formattedPhone,
      statementDescription: 'Ansella Don',
    });

    if (!depositResponse.success) {
      // Marquer comme failed si rejeté immédiatement par PawaPay
      await updateDonationStatus({
        reference: depositId,
        status: 'failed',
        metadata: {
          immediateError: depositResponse.error,
        },
      });

      return {
        success: false,
        depositId,
        error: depositResponse.error || 'Erreur lors de l\'initiation du paiement Mobile Money.',
      };
    }

    // Mise à jour des métadonnées avec la réponse PawaPay
    await updateDonationStatus({
      reference: depositId,
      status: 'pending',
      metadata: {
        pawaPayStatus: depositResponse.status || 'SUBMITTED',
      },
    });

    return {
      success: true,
      depositId,
      donation: dbResult.donation,
    };
  } catch (err: any) {
    console.error('[PawaPayDonation] Exception initiatePawaPayDeposit:', err);
    await updateDonationStatus({
      reference: depositId,
      status: 'failed',
      metadata: { error: err.message },
    });

    return {
      success: false,
      depositId,
      error: err.message || 'Erreur réseau avec PawaPay.',
    };
  }
}

/**
 * Vérifie le statut d'un don PawaPay auprès de l'API PawaPay et synchronise la base Supabase.
 */
export async function checkPawaPayDonationStatus(depositId: string) {
  try {
    const pawaStatus = await getPawaPayDepositStatus(depositId);

    if (!pawaStatus.success) {
      return {
        success: false,
        depositId,
        error: pawaStatus.error || 'Statut introuvable sur PawaPay',
      };
    }

    const rawStatus = (pawaStatus.status || '').toUpperCase();
    let normalizedStatus: 'pending' | 'completed' | 'failed' = 'pending';

    if (rawStatus === 'COMPLETED' || rawStatus === 'PAID' || rawStatus === 'SUCCESS') {
      normalizedStatus = 'completed';
    } else if (
      rawStatus === 'FAILED' ||
      rawStatus === 'REJECTED' ||
      rawStatus === 'CANCELLED' ||
      rawStatus === 'EXPIRED'
    ) {
      normalizedStatus = 'failed';
    }

    // Mettre à jour en base Supabase
    const updateRes = await updateDonationStatus({
      reference: depositId,
      status: normalizedStatus,
      metadata: {
        pawaPayRawStatus: rawStatus,
        failureReason: pawaStatus.failureMessage || pawaStatus.error,
      },
    });

    return {
      success: true,
      depositId,
      status: normalizedStatus,
      rawStatus,
      donation: updateRes.donation,
    };
  } catch (err: any) {
    console.error('[PawaPayDonation] Erreur checkPawaPayDonationStatus:', err);
    return {
      success: false,
      depositId,
      error: err.message || 'Erreur lors de la vérification du statut PawaPay',
    };
  }
}

