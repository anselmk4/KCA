import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { BITCOIN_TREASURY_ADDRESS, fetchBtcPriceInUsd, convertUsdToBtc } from "@/lib/bitcoin";
import { createNotification } from "@/lib/supabase/notifications-helper";

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Queries Mempool.space or Blockstream Explorer APIs to verify a Bitcoin transaction.
 */
async function verifyBitcoinTxOnChain(txHash: string): Promise<{
  verified: boolean;
  receivedSatoshis: number;
  txDetails?: any;
  errorMsg?: string;
}> {
  const cleanTxHash = txHash.trim().toLowerCase();

  // 1. Try Mempool.space API
  try {
    const res = await fetch(`https://mempool.space/api/tx/${cleanTxHash}`, {
      cache: "no-store",
    });

    if (res.ok) {
      const txData = await res.json();
      let satoshisToTreasury = 0;

      if (Array.isArray(txData?.vout)) {
        txData.vout.forEach((out: any) => {
          if (out?.scriptpubkey_address === BITCOIN_TREASURY_ADDRESS) {
            satoshisToTreasury += out.value || 0;
          }
        });
      }

      if (satoshisToTreasury > 0) {
        return { verified: true, receivedSatoshis: satoshisToTreasury, txDetails: txData };
      }
    }
  } catch (err) {
    console.warn("[btc-verify] Mempool.space query failed, trying Blockstream fallback...", err);
  }

  // 2. Fallback to Blockstream.info API
  try {
    const res = await fetch(`https://blockstream.info/api/tx/${cleanTxHash}`, {
      cache: "no-store",
    });

    if (res.ok) {
      const txData = await res.json();
      let satoshisToTreasury = 0;

      if (Array.isArray(txData?.vout)) {
        txData.vout.forEach((out: any) => {
          if (out?.scriptpubkey_address === BITCOIN_TREASURY_ADDRESS) {
            satoshisToTreasury += out.value || 0;
          }
        });
      }

      if (satoshisToTreasury > 0) {
        return { verified: true, receivedSatoshis: satoshisToTreasury, txDetails: txData };
      }
    }
  } catch (err) {
    console.warn("[btc-verify] Blockstream query failed:", err);
  }

  return {
    verified: false,
    receivedSatoshis: 0,
    errorMsg: "Transaction introuvable ou le destinataire ne correspond pas à l'adresse de trésorerie Bitcoin Kuettu.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const body = await req.json();
    const { txHash, courseId, planId } = body;

    if (!txHash || typeof txHash !== "string" || txHash.trim().length < 20) {
      return NextResponse.json(
        { error: "Veuillez fournir un Hash de transaction Bitcoin (TxID) valide." },
        { status: 400 }
      );
    }

    const cleanHash = txHash.trim();

    // Check if txHash has already been processed to prevent double-spending / reuse
    const { data: existingPay } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("provider_transaction_id", cleanHash)
      .maybeSingle();

    if (existingPay) {
      return NextResponse.json(
        { error: "Ce Hash de transaction Bitcoin a déjà été utilisé pour valider un paiement." },
        { status: 400 }
      );
    }

    // Determine target item details (course or instructor plan)
    let expectedUsdAmount = 0;
    let itemTitle = "Formation";
    let targetCourseId = courseId || null;

    if (courseId) {
      const { data: course } = await supabaseAdmin
        .from("courses")
        .select("id, title, price")
        .eq("id", courseId)
        .maybeSingle();

      if (!course) {
        return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
      }

      expectedUsdAmount = Number(course.price) || 0;
      itemTitle = course.title;
      targetCourseId = course.id;
    } else if (planId) {
      const PLAN_PRICES: Record<string, number> = {
        "BASE": 29,
        "PRO": 79,
        "MAX": 149,
      };
      expectedUsdAmount = PLAN_PRICES[planId.toUpperCase()] || 49;
      itemTitle = `Abonnement Formateur Plan ${planId.toUpperCase()}`;
    }

    // Fetch live BTC price and expected Satoshis
    const btcPriceUsd = await fetchBtcPriceInUsd();
    const expectedBtc = convertUsdToBtc(expectedUsdAmount, btcPriceUsd);
    const expectedSatoshis = Math.floor(expectedBtc * 100000000);

    // Verify transaction on Bitcoin Blockchain
    const verification = await verifyBitcoinTxOnChain(cleanHash);

    if (!verification.verified) {
      return NextResponse.json(
        { error: verification.errorMsg || "Transaction Bitcoin introuvable on-chain." },
        { status: 400 }
      );
    }

    // Check tolerance (allow 5% price fluctuation or minor fee diffs)
    const minRequiredSatoshis = Math.floor(expectedSatoshis * 0.95);
    if (verification.receivedSatoshis < minRequiredSatoshis) {
      const receivedBtc = (verification.receivedSatoshis / 100000000).toFixed(8);
      return NextResponse.json(
        {
          error: `Le montant reçu (${receivedBtc} BTC) est inférieur au montant requis (${expectedBtc.toFixed(8)} BTC).`,
        },
        { status: 400 }
      );
    }

    const finalPaidUsd = expectedUsdAmount > 0 ? expectedUsdAmount : Math.round((verification.receivedSatoshis / 100000000) * btcPriceUsd);

    // Create Order & Payment Records
    const orderId = crypto.randomUUID();
    const paymentId = crypto.randomUUID();

    await supabaseAdmin.from("orders").insert({
      id: orderId,
      user_id: user.id,
      total_amount: finalPaidUsd,
      status: "COMPLETED",
      created_at: new Date().toISOString(),
    });

    if (targetCourseId) {
      await supabaseAdmin.from("order_items").insert({
        id: crypto.randomUUID(),
        order_id: orderId,
        course_id: targetCourseId,
        unit_price: finalPaidUsd,
        final_price: finalPaidUsd,
      });

      // Insert enrollment
      await (supabaseAdmin as any).from("enrollments").upsert({
        student_id: user.id,
        course_id: targetCourseId,
        status: "ACTIVE",
        progress_percent: 0,
        enrolled_at: new Date().toISOString(),
        enrollment_type: "ONLINE_PURCHASE",
      });
    }

    // Insert Payment Record with provider CRYPTO_BTC
    await supabaseAdmin.from("payments").insert({
      id: paymentId,
      order_id: orderId,
      user_id: user.id,
      amount: finalPaidUsd,
      currency: "USD",
      status: "PAID",
      provider: "CRYPTO_BTC",
      method: `BITCOIN::ON_CHAIN::${cleanHash}`,
      provider_transaction_id: cleanHash,
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    // Send Notification
    await createNotification({
      userId: user.id,
      title: "Paiement Bitcoin Confirmé ₿",
      message: `Votre règlement en Bitcoin de $${finalPaidUsd} USD pour "${itemTitle}" a été vérifié avec succès sur la blockchain !`,
      type: "SUCCESS",
      link: targetCourseId ? `/dashboard/courses/${targetCourseId}/learn` : `/dashboard/payments`,
    });

    return NextResponse.json({
      success: true,
      message: "Paiement Bitcoin vérifié et validé avec succès sur la blockchain !",
      paymentId,
      receivedSatoshis: verification.receivedSatoshis,
      txHash: cleanHash,
    });

  } catch (err: any) {
    console.error("[POST /api/payments/btc-verify] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la vérification de la transaction Bitcoin." },
      { status: 500 }
    );
  }
}
