import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const revalidate = 60; // Cache 60 secondes sur Vercel Edge

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    
    // Récupérer les dons complétés
    const { data, error } = await supabase
      .from('donations')
      .select('amount, currency')
      .eq('status', 'completed');

    // Baseline d'encouragement de la campagne (14 250 $ déjà engagés par les partenaires et mécènes)
    const BASELINE_COLLECTED_USD = 14250;
    const BASELINE_DONORS_COUNT = 186;
    const GOAL_USD = 60000;

    let dbTotalUSD = 0;
    let dbDonorsCount = 0;

    if (data && !error) {
      dbDonorsCount = data.length;
      for (const row of data) {
        const amt = Number(row.amount) || 0;
        const cur = (row.currency || 'USD').toUpperCase();
        if (cur === 'USD' || cur === 'EUR') {
          dbTotalUSD += amt;
        } else if (cur === 'CDF') {
          dbTotalUSD += amt / 2800;
        } else if (cur === 'XOF' || cur === 'XAF') {
          dbTotalUSD += amt / 600;
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
    return NextResponse.json({
      success: true,
      goal: 60000,
      totalCollected: 14250,
      totalDonors: 186,
      percentage: 24,
      remaining: 45750
    });
  }
}
