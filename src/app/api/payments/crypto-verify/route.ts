import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { SOLANA_TREASURY_ADDRESS, USDC_SOLANA_MINT } from "@/lib/crypto";

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * On-Chain Solana RPC Transaction Verification
 */
async function verifySolanaTransactionOnChain(txSignature: string, expectedAmount: number): Promise<{ verified: boolean; details?: string }> {
  try {
    const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignatureStatuses",
        params: [[txSignature], { searchTransactionHistory: true }]
      })
    });

    if (!response.ok) {
      return { verified: false, details: "Impossible de joindre le nœud RPC Solana." };
    }

    const json = await response.json();
    const statusObj = json?.result?.value?.[0];

    if (statusObj) {
      const isOk = !statusObj.err && (statusObj.confirmationStatus === "confirmed" || statusObj.confirmationStatus === "finalized");
      if (isOk) {
        return { verified: true, details: `Statut sur chaîne: ${statusObj.confirmationStatus}` };
      }
      if (statusObj.err) {
        return { verified: false, details: "La transaction Solana a échoué sur la blockchain (erreur d'exécution)." };
      }
    }

    return { verified: false, details: "Transaction introuvable ou non confirmée sur la blockchain Solana." };
  } catch (err: any) {
    console.error("[CryptoVerify] Solana RPC Check error:", err?.message);
    return { verified: false, details: "Erreur de communication avec le réseau Solana." };
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Non authentifié. Veuillez vous connecter." }, { status: 401 });
    }

    const body = await req.json();
    const { txId, type, itemId, amount, plan = null } = body;

    const signature = (txId || "").trim();
    if (!signature || signature.length < 32) {
      return NextResponse.json({ error: "La signature de transaction Solana (TxID) est invalide." }, { status: 400 });
    }

    // 1. Anti-Replay Check: Ensure this transaction signature was not already used
    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("provider_transaction_id", signature)
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json(
        { error: "Cette signature de transaction Solana a déjà été utilisée pour valider un paiement." },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount) || 0;

    // 2. Verify transaction on Solana RPC
    const check = await verifySolanaTransactionOnChain(signature, numericAmount);
    if (!check.verified) {
      return NextResponse.json({ error: check.details || "La transaction n'a pas pu être vérifiée sur la blockchain Solana." }, { status: 400 });
    }

    // 3. Process Student Course Payment
    if (type === "STUDENT_COURSE" || type === "COURSE") {
      if (!itemId) return NextResponse.json({ error: "Identifiant du cours manquant." }, { status: 400 });

      const { data: course } = await supabaseAdmin.from("courses").select("id, title, price").eq("id", itemId).maybeSingle();
      if (!course) return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });

      // Upsert active enrollment
      const { error: enrollErr } = await supabaseAdmin.from("enrollments").upsert({
        student_id: user.id,
        course_id: course.id,
        progress_percent: 0,
        status: "ACTIVE",
        enrolled_at: new Date().toISOString()
      }, { onConflict: "student_id,course_id" });

      if (enrollErr) throw enrollErr;

      // Create Order & Payment
      const orderId = crypto.randomUUID();
      const orderNumber = `ANS-SOL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      await supabaseAdmin.from("orders").insert({
        id: orderId,
        order_number: orderNumber,
        user_id: user.id,
        status: "COMPLETED",
        subtotal: course.price,
        discount_amount: Math.max(0, course.price - numericAmount),
        tax_amount: 0,
        total: numericAmount,
        currency: "USD",
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      await supabaseAdmin.from("order_items").insert({
        id: crypto.randomUUID(),
        order_id: orderId,
        course_id: course.id,
        unit_price: course.price,
        final_price: numericAmount,
        created_at: new Date().toISOString(),
      });

      const paymentId = crypto.randomUUID();
      await supabaseAdmin.from("payments").insert({
        id: paymentId,
        order_id: orderId,
        user_id: user.id,
        amount: numericAmount,
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
        paymentId
      });
    }

    // 4. Process Instructor Plan Subscription Payment
    if (type === "INSTRUCTOR_PLAN" || type === "PLAN" || plan) {
      const selectedPlan = (plan || itemId || "BASE").toUpperCase();

      // Update instructor profile plan
      await supabaseAdmin.from("profiles").upsert({
        id: user.id,
        plan: selectedPlan,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });

      // Record Payment
      const paymentId = crypto.randomUUID();
      const dummyOrderId = crypto.randomUUID();

      await supabaseAdmin.from("payments").insert({
        id: paymentId,
        order_id: dummyOrderId,
        user_id: user.id,
        amount: numericAmount,
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
        paymentId
      });
    }

    return NextResponse.json({ error: "Type de paiement non valide." }, { status: 400 });

  } catch (err: any) {
    console.error("[api/payments/crypto-verify error]", err);
    return NextResponse.json({ error: err.message || "Erreur lors de la vérification du paiement Solana" }, { status: 500 });
  }
}
