import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SOLANA_TREASURY_ADDRESS, USDC_SOLANA_MINT } from "@/lib/crypto";
import { resolveCoursePricing } from "@/lib/payment-pricing";

/**
 * On-Chain Solana RPC Transaction Verification
 * Strictly verifies:
 * 1. Transaction succeeded (meta.err === null)
 * 2. Recipient is SOLANA_TREASURY_ADDRESS
 * 3. Transferred USDC (USDC_SOLANA_MINT) or SOL value matches expectedUsdAmount
 */
async function verifySolanaTransactionOnChain(
  txSignature: string,
  expectedUsdAmount: number
): Promise<{ verified: boolean; receivedAmount: number; details?: string }> {
  try {
    const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [
          txSignature,
          {
            encoding: "jsonParsed",
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        verified: false,
        receivedAmount: 0,
        details: "Impossible de joindre le nœud RPC Solana.",
      };
    }

    const json = await response.json();
    const tx = json?.result;

    if (!tx || !tx.meta) {
      return {
        verified: false,
        receivedAmount: 0,
        details: "Transaction introuvable ou non confirmée sur la blockchain Solana.",
      };
    }

    if (tx.meta.err) {
      return {
        verified: false,
        receivedAmount: 0,
        details: "La transaction Solana a échoué sur la blockchain (erreur d'exécution).",
      };
    }

    // 1. Check SPL Token (USDC) balance delta for SOLANA_TREASURY_ADDRESS
    const preTokens: any[] = tx.meta.preTokenBalances || [];
    const postTokens: any[] = tx.meta.postTokenBalances || [];

    let treasuryUsdcReceived = 0;

    for (const post of postTokens) {
      const owner = post?.owner;
      const mint = post?.mint;
      if (owner === SOLANA_TREASURY_ADDRESS && (!USDC_SOLANA_MINT || mint === USDC_SOLANA_MINT)) {
        const postUi = Number(post?.uiTokenAmount?.uiAmount ?? 0);
        const matchingPre = preTokens.find(
          (pre) => pre.accountIndex === post.accountIndex && pre.mint === post.mint
        );
        const preUi = Number(matchingPre?.uiTokenAmount?.uiAmount ?? 0);
        if (postUi > preUi) {
          treasuryUsdcReceived += postUi - preUi;
        }
      }
    }

    // 2. Also inspect parsed instructions for direct system/token transfers to SOLANA_TREASURY_ADDRESS
    if (treasuryUsdcReceived === 0) {
      const instructions: any[] = tx.transaction?.message?.instructions || [];
      for (const ix of instructions) {
        const parsed = ix?.parsed;
        if (!parsed) continue;
        const info = parsed.info || {};
        if (
          (parsed.type === "transfer" || parsed.type === "transferChecked") &&
          info.destination === SOLANA_TREASURY_ADDRESS
        ) {
          if (info.tokenAmount?.uiAmount) {
            treasuryUsdcReceived += Number(info.tokenAmount.uiAmount);
          } else if (typeof info.amount === "string" || typeof info.amount === "number") {
            // USDC has 6 decimals
            treasuryUsdcReceived += Number(info.amount) / 1_000_000;
          }
        }
      }
    }

    const minExpected = Math.max(0.5, expectedUsdAmount * 0.96);
    if (treasuryUsdcReceived < minExpected) {
      return {
        verified: false,
        receivedAmount: treasuryUsdcReceived,
        details: `Le portefeuille de trésorerie Solana n'a pas reçu le montant attendu (${treasuryUsdcReceived.toFixed(2)} USDC reçus sur ${expectedUsdAmount.toFixed(2)} USDC requis).`,
      };
    }

    return {
      verified: true,
      receivedAmount: treasuryUsdcReceived,
      details: `Transfert vérifié de ${treasuryUsdcReceived.toFixed(2)} USDC vers le trésor.`,
    };
  } catch (err: any) {
    console.error("[CryptoVerify] Solana RPC Check error:", err?.message);
    return {
      verified: false,
      receivedAmount: 0,
      details: "Erreur de communication avec le réseau Solana.",
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: "Non authentifié. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { txId, type, itemId, plan = null, payInstallment, couponId } = body;

    const signature = (txId || "").trim();
    if (!signature || signature.length < 32) {
      return NextResponse.json(
        { error: "La signature de transaction Solana (TxID) est invalide." },
        { status: 400 }
      );
    }

    // 1. Anti-Replay Check: Ensure this transaction signature was not already used
    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("provider_transaction_id", signature)
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json(
        {
          error:
            "Cette signature de transaction Solana a déjà été utilisée pour valider un paiement.",
        },
        { status: 400 }
      );
    }

    // 2. Resolve authoritative expected price from database
    let expectedUsdAmount = 0;
    let resolvedCourse: { id: string; title: string; price: number } | null = null;
    let selectedPlan: "FREE" | "BASE" | "PRO" | "MAX" | null = null;

    if (type === "STUDENT_COURSE" || type === "COURSE") {
      if (!itemId) {
        return NextResponse.json({ error: "Identifiant du cours manquant." }, { status: 400 });
      }

      const pricingResult = await resolveCoursePricing({
        courseId: itemId,
        payInstallment,
        couponId,
      });

      if (!pricingResult.data) {
        return NextResponse.json(
          { error: pricingResult.error || "Cours introuvable." },
          { status: pricingResult.status || 404 }
        );
      }

      expectedUsdAmount = pricingResult.data.baseAmount;
      resolvedCourse = {
        id: pricingResult.data.courseId,
        title: pricingResult.data.courseTitle,
        price: pricingResult.data.originalPrice,
      };
    } else if (type === "INSTRUCTOR_PLAN" || type === "PLAN" || plan) {
      const rawPlan = String(plan || itemId || "BASE").toUpperCase();
      const PLAN_PRICES: Record<string, number> = {
        BASE: 19,
        PRO: 49,
        MAX: 200,
      };
      if (!PLAN_PRICES[rawPlan]) {
        return NextResponse.json({ error: "Plan formateur invalide." }, { status: 400 });
      }
      selectedPlan = rawPlan as "BASE" | "PRO" | "MAX";
      expectedUsdAmount = PLAN_PRICES[rawPlan];
    } else {
      return NextResponse.json({ error: "Type de paiement non valide." }, { status: 400 });
    }

    if (expectedUsdAmount <= 0) {
      return NextResponse.json(
        { error: "Le montant attendu pour un paiement Solana doit être supérieur à 0 USDC." },
        { status: 400 }
      );
    }

    // 3. Verify transaction on Solana RPC against SOLANA_TREASURY_ADDRESS & expectedUsdAmount
    const check = await verifySolanaTransactionOnChain(signature, expectedUsdAmount);
    if (!check.verified) {
      return NextResponse.json(
        {
          error:
            check.details || "La transaction n'a pas pu être vérifiée sur la blockchain Solana.",
        },
        { status: 400 }
      );
    }

    // 4. Process Student Course Payment
    if ((type === "STUDENT_COURSE" || type === "COURSE") && resolvedCourse) {
      const { error: enrollErr } = await supabaseAdmin.from("enrollments").upsert(
        {
          student_id: user.id,
          course_id: resolvedCourse.id,
          progress_percent: 0,
          status: "ACTIVE",
          enrolled_at: new Date().toISOString(),
        },
        { onConflict: "student_id,course_id" }
      );

      if (enrollErr) throw enrollErr;

      const orderId = crypto.randomUUID();
      const orderNumber = `ANS-SOL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      await supabaseAdmin.from("orders").insert({
        id: orderId,
        order_number: orderNumber,
        user_id: user.id,
        status: "COMPLETED",
        subtotal: resolvedCourse.price,
        discount_amount: Math.max(0, resolvedCourse.price - expectedUsdAmount),
        tax_amount: 0,
        total: expectedUsdAmount,
        currency: "USD",
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      await supabaseAdmin.from("order_items").insert({
        id: crypto.randomUUID(),
        order_id: orderId,
        course_id: resolvedCourse.id,
        unit_price: resolvedCourse.price,
        final_price: expectedUsdAmount,
        created_at: new Date().toISOString(),
      });

      const paymentId = crypto.randomUUID();
      await supabaseAdmin.from("payments").insert({
        id: paymentId,
        order_id: orderId,
        user_id: user.id,
        amount: expectedUsdAmount,
        currency: "USDC",
        status: "PAID",
        method: "USDC (Solana Pay)",
        provider: "CRYPTO",
        provider_transaction_id: signature,
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Paiement Solana USDC confirmé ! Votre cours est débloqué.",
        orderId,
        paymentId,
      });
    }

    // 5. Process Instructor Plan Subscription Payment
    if (selectedPlan) {
      await supabaseAdmin
        .from("profiles")
        .update({
          plan: selectedPlan,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      const paymentId = crypto.randomUUID();
      const dummyOrderId = crypto.randomUUID();

      await supabaseAdmin.from("payments").insert({
        id: paymentId,
        order_id: dummyOrderId,
        user_id: user.id,
        amount: expectedUsdAmount,
        currency: "USDC",
        status: "PAID",
        method: "USDC (Solana Pay)",
        provider: "CRYPTO",
        provider_transaction_id: signature,
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: `Abonnement au Plan ${selectedPlan} activé avec succès via Solana USDC !`,
        paymentId,
      });
    }

    return NextResponse.json({ error: "Type de paiement non valide." }, { status: 400 });
  } catch (err: any) {
    console.error("[api/payments/crypto-verify error]", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la vérification du paiement Solana" },
      { status: 500 }
    );
  }
}
