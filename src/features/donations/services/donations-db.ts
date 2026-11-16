import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { CreateDonationInput, DonationRecord, DonationStatus } from '../types';

/**
 * Créer un enregistrement de donation en statut 'pending'.
 * Idempotence garantie grâce à la clé unique `provider_reference`.
 */
export async function createPendingDonation(
  input: CreateDonationInput
): Promise<{ success: boolean; donation?: DonationRecord; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    // Vérifier si une donation avec cette référence existe déjà
    const { data: existing, error: checkError } = await supabase
      .from('donations')
      .select('*')
      .eq('provider_reference', input.provider_reference)
      .maybeSingle();

    if (checkError) {
      console.warn('[DonationsDB] Erreur lors de la vérification d\'existence:', checkError);
    }

    if (existing) {
      console.log(`[DonationsDB] Donation existante trouvée pour ref=${input.provider_reference}, status=${existing.status}`);
      return { success: true, donation: existing as unknown as DonationRecord };
    }

    const newRecord = {
      provider: input.provider,
      provider_reference: input.provider_reference,
      amount: input.amount,
      currency: input.currency.toUpperCase(),
      status: 'pending' as DonationStatus,
      donor_name: input.donor_name || null,
      donor_email: input.donor_email || null,
      message: input.message || null,
      user_id: input.user_id || null,
      metadata: input.metadata || {},
    };

    const { data, error } = await supabase
      .from('donations')
      .insert(newRecord as any)
      .select()
      .single();

    if (error) {
      console.error('[DonationsDB] Erreur lors de la création de la donation:', error);
      return { success: false, error: error.message };
    }

    return { success: true, donation: data as unknown as DonationRecord };
  } catch (err: any) {
    console.error('[DonationsDB] Exception createPendingDonation:', err);
    return { success: false, error: err?.message || 'Erreur interne de base de données' };
  }
}

/**
 * Récupère une donation par sa référence de passerelle (depositId ou orderId).
 */
export async function getDonationByReference(
  providerReference: string
): Promise<DonationRecord | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('provider_reference', providerReference)
      .maybeSingle();

    if (error) {
      console.error('[DonationsDB] Erreur getDonationByReference:', error);
      return null;
    }

    return (data as unknown as DonationRecord) || null;
  } catch (err) {
    console.error('[DonationsDB] Exception getDonationByReference:', err);
    return null;
  }
}

/**
 * Récupère une donation par son ID UUID.
 */
export async function getDonationById(id: string): Promise<DonationRecord | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[DonationsDB] Erreur getDonationById:', error);
      return null;
    }

    return (data as unknown as DonationRecord) || null;
  } catch (err) {
    console.error('[DonationsDB] Exception getDonationById:', err);
    return null;
  }
}

/**
 * Mise à jour idempotente du statut d'une donation.
 * Évite d'écraser un statut 'completed' par un statut 'failed' tardif.
 */
export async function updateDonationStatus(params: {
  reference?: string;
  id?: string;
  status: DonationStatus;
  metadata?: Record<string, any>;
  donorName?: string;
  donorEmail?: string;
}): Promise<{ success: boolean; donation?: DonationRecord; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    // 1. Trouver l'enregistrement existant
    let query = supabase.from('donations').select('*');
    if (params.id) {
      query = query.eq('id', params.id);
    } else if (params.reference) {
      query = query.eq('provider_reference', params.reference);
    } else {
      return { success: false, error: 'Une référence ou un identifiant est requis.' };
    }

    const { data: existing, error: findError } = await query.maybeSingle();

    if (findError || !existing) {
      return {
        success: false,
        error: findError?.message || 'Donation introuvable pour la mise à jour.',
      };
    }

    // 2. Règle d'idempotence : si la donation est déjà finalisée avec succès ('completed'),
    // on ne la repasse pas à 'pending' ou 'failed'.
    if (existing.status === 'completed' && params.status !== 'completed' && params.status !== 'refunded') {
      console.log(`[DonationsDB] Idempotence : la donation ${existing.id} est déjà 'completed'. Statut inchangé.`);
      return { success: true, donation: existing as unknown as DonationRecord };
    }

    // Fusionner les métadonnées existantes avec les nouvelles
    const mergedMetadata = {
      ...((existing.metadata as Record<string, any>) || {}),
      ...(params.metadata || {}),
      updated_via: 'donations_service',
      last_event_time: new Date().toISOString(),
    };

    const updatePayload: Record<string, any> = {
      status: params.status,
      metadata: mergedMetadata,
    };

    if (params.donorName && !existing.donor_name) {
      updatePayload.donor_name = params.donorName;
    }
    if (params.donorEmail && !existing.donor_email) {
      updatePayload.donor_email = params.donorEmail;
    }

    const { data: updated, error: updateError } = await supabase
      .from('donations')
      .update(updatePayload as any)
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      console.error('[DonationsDB] Erreur lors de la mise à jour:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`[DonationsDB] Statut donation ${existing.id} mis à jour avec succès : ${existing.status} -> ${params.status}`);
    return { success: true, donation: updated as unknown as DonationRecord };
  } catch (err: any) {
    console.error('[DonationsDB] Exception updateDonationStatus:', err);
    return { success: false, error: err?.message || 'Erreur interne lors de la mise à jour' };
  }
}
