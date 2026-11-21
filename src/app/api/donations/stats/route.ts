import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Pas de mise en cache pour refléter instantanément chaque nouveau don

export async function GET() {
  const GOAL_USD = 60000;

  try {
    const supabase = getSupabaseAdmin();
    
    // Récupérer tous les dons complétés
    const { data, error } = await supabase
      .from('donations')
      .select('amount, currency')
      .eq('status', 'completed');

    // Le compteur débute à 0 et s'incrémente au fur et à mesure des dons réels
    const BASELINE_COLLECTED_USD = 0;
    const BASELINE_DONORS_COUNT = 0;

    let dbTotalUSD = 0;
    let dbDonorsCount = 0;

    if (data && !error && Array.isArray(data)) {
      dbDonorsCount = data.length;
      for (const row of data) {
        const amt = Number(row.amount) || 0;
        const cur = (row.currency || 'USD').toUpperCase();
        
        // Conversion transparente des devises en équivalent USD pour la jauge globale
        if (cur === 'USD' || cur === 'EUR') {
          dbTotalUSD += amt;
        } else if (cur === 'CDF') {
          dbTotalUSD += amt / 2800; // Franc Congolais
        } else if (cur === 'XOF' || cur === 'XAF') {
          dbTotalUSD += amt / 600; // FCFA
        } else if (cur === 'RWF') {
          dbTotalUSD += amt / 1300; // Franc Rwandais
        } else if (cur === 'UGX') {
          dbTotalUSD += amt / 3700; // Shilling Ougandais
        } else {
          dbTotalUSD += amt;
        }
      }
    }

    const totalCollected = Math.min(GOAL_USD, Math.round(BASELINE_COLLECTED_USD + dbTotalUSD));
    const totalDonors = BASELINE_DONORS_COUNT + dbDonorsCount;
    const percentage = Math.min(100, Math.round((totalCollected / GOAL_USD) * 100));

    return NextResponse.json({
      success: true,
      goal: GOAL_USD,
      totalCollected,
      totalDonors,
      percentage,
      remaining: Math.max(0, GOAL_USD - totalCollected)
    });
  } catch (err: any) {
    console.error('[API /api/donations/stats] Erreur de calcul stats:', err);
    return NextResponse.json({
      success: true,
      goal: GOAL_USD,
      totalCollected: 0,
      totalDonors: 0,
      percentage: 0,
      remaining: GOAL_USD
    });
  }
}
