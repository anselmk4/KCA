import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { initiatePawaPayPayout, resolvePawaPayCorrespondent } from "@/lib/pawapay";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Role verification (SUPER_ADMIN, ADMIN, or FINANCE_ADMIN) - Support multiple roles per user
    const { data: userRoles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("roles!inner(name)")
      .eq("user_id", user.id) as any;

    if (rolesErr || !userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const roleNames = userRoles.map((ur: any) => ur.roles?.name);
    const hasAdminAccess = roleNames.some((name: string) => 
      name === "SUPER_ADMIN" || name === "ADMIN" || name === "FINANCE_ADMIN"
    );

    if (!hasAdminAccess) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const { payoutId, action, reason } = body;

    if (!action) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // --- Check PawaPay Active Configuration ---
    if (action === "check_active_config") {
      const { fetchPawaPayActiveConfiguration } = await import("@/lib/pawapay");
      const configRes = await fetchPawaPayActiveConfiguration(body.environment || "production");
      return NextResponse.json(configRes);
    }

    // --- Check PawaPay Live Wallet Balances ---
    if (action === "check_wallet_balances" || action === "check_balance") {
      const { fetchPawaPayWalletBalances } = await import("@/lib/pawapay");
      const balanceRes = await fetchPawaPayWalletBalances(body.environment || "production", body.countryCode3 || body.country);
      return NextResponse.json(balanceRes);
    }

    // --- Check / Sync Live Payout Status with PawaPay ---
    if (action === "sync_payout_status" || action === "check_payout_status") {
      const { getPawaPayPayoutStatus } = await import("@/lib/pawapay");
      const targetPayoutId = payoutId || body.id;
      if (!targetPayoutId) {
        return NextResponse.json({ error: "Identifiant de versement manquant" }, { status: 400 });
      }

      // Fetch the payout from DB
      const { data: payoutRecord } = await supabaseAdmin
        .from("payouts")
        .select("*")
        .eq("id", targetPayoutId)
        .maybeSingle() as any;

      // Extract PawaPay transaction reference (e.g., from notes "Réf: <uuid>" or from targetPayoutId)
      let pawaTxId = targetPayoutId;
      if (payoutRecord?.notes) {
        const refMatch = payoutRecord.notes.match(/Réf(?:\s*transaction)?\s*:\s*([a-f0-9-]{36})/i);
        if (refMatch && refMatch[1]) {
          pawaTxId = refMatch[1];
        }
      }

      const statusRes = await getPawaPayPayoutStatus(pawaTxId, body.environment || "production");

      if (statusRes.success && statusRes.status) {
        const rawStatus = statusRes.status.toUpperCase();
        let dbStatus = payoutRecord?.status || "PENDING";
        let statusNote = "";

        if (["COMPLETED", "PAID", "SUCCESS", "SUCCESSFUL"].includes(rawStatus)) {
          dbStatus = "PAID";
          statusNote = `\n[PawaPay Sync] Statut confirmé: PAYÉ (COMPLETED) le ${new Date().toLocaleString('fr-FR')}.`;
        } else if (["FAILED", "REJECTED", "CANCELLED"].includes(rawStatus)) {
          dbStatus = "FAILED";
          statusNote = `\n[PawaPay Sync] Échec confirmé par PawaPay: ${statusRes.formattedReason || statusRes.failureMessage || rawStatus} le ${new Date().toLocaleString('fr-FR')}.`;
        }

        if (payoutRecord && (dbStatus !== payoutRecord.status || statusNote)) {
          await supabaseAdmin
            .from("payouts")
            .update({
              status: dbStatus,
              notes: (payoutRecord.notes || "") + statusNote,
              updated_at: new Date().toISOString()
            })
            .eq("id", targetPayoutId);
        }

        return NextResponse.json({
          success: true,
          payoutId: targetPayoutId,
          pawaTxId,
          status: rawStatus,
          dbStatus,
          failureCode: statusRes.failureCode,
          failureMessage: statusRes.failureMessage,
          formattedReason: statusRes.formattedReason,
          raw: statusRes.raw
        });
      }

      return NextResponse.json({
        success: false,
        error: statusRes.error || "Impossible de récupérer le statut auprès de PawaPay.",
        pawaTxId
      }, { status: 400 });
    }

    // --- Direct Admin Payout via PawaPay API or Manual Registration ---
    if (action === "direct_payout" || action === "direct_manual_payout") {
      const { 
        phoneNumber, 
        carrier, 
        country, 
        currency: requestCurrency,
        amount, 
        statementDescription, 
        instructorId,
        manualRef,
        isManual: paramIsManual,
        environment
      } = body;

      const isManual = action === "direct_manual_payout" || !!paramIsManual;

      const numAmount = parseFloat(amount);
      if (!phoneNumber || !carrier || isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json({ error: "Numéro de téléphone, réseau/opérateur et montant valide requises." }, { status: 400 });
      }

      // Format and resolve PawaPay params
      const resolveResult = resolvePawaPayCorrespondent(carrier, phoneNumber, country, requestCurrency);
      if (resolveResult.error) {
        return NextResponse.json({ error: resolveResult.error }, { status: 400 });
      }

      const amountLocal = numAmount * resolveResult.exchangeRate;
      const targetPhone = resolveResult.formattedPhone;
      const freshPayoutTxId = crypto.randomUUID();
      const desc = statementDescription || (isManual ? "Retrait Direct Manuel (Wave/Orange)" : "Retrait Direct Admin PawaPay");

      const formattedAmountText = resolveResult.currency === "USD" 
        ? `${numAmount}$ USD` 
        : `${Math.round(amountLocal).toLocaleString('fr-FR')} ${resolveResult.currency} (${numAmount}$ USD)`;

      let isSuccess = false;
      let pStatus: "PAID" | "FAILED" = "FAILED";
      let pNote = "";
      let apiErrorMessage = "";

      if (isManual) {
        // Direct manual recording (transfer done directly via Wave / Orange mobile app)
        isSuccess = true;
        pStatus = "PAID";
        const customRef = manualRef ? ` (Réf transaction: ${manualRef})` : "";
        pNote = `[Retrait Direct Manuel] Versement de ${formattedAmountText} effectué directement via ${resolveResult.correspondent} vers +${targetPhone} par l'admin (${user.email}).${customRef} Note: ${desc}`;
      } else {
        // Initiate payout via PawaPay API (defaults to Production)
        const payoutResponse = await initiatePawaPayPayout({
          payoutId: freshPayoutTxId,
          amount: amountLocal,
          currency: resolveResult.currency,
          correspondent: resolveResult.correspondent,
          phoneNumber: targetPhone,
          statementDescription: desc.substring(0, 22),
          environment: environment || "production"
        });

        isSuccess = payoutResponse.success;
        pStatus = isSuccess ? "PAID" : "FAILED";
        apiErrorMessage = payoutResponse.error || "";

        pNote = isSuccess 
          ? `[Retrait Direct PawaPay API] Transfert réussi de ${formattedAmountText} via ${resolveResult.correspondent} vers +${targetPhone}. Réf: ${freshPayoutTxId}. Note: ${desc}`
          : `[Échec Retrait Direct PawaPay API] ${apiErrorMessage}. (Opérateur: ${resolveResult.correspondent}, Devise: ${resolveResult.currency}, Téléphone: +${targetPhone}). Réf: ${freshPayoutTxId}`;
      }

      const targetInstructorId = instructorId || user.id;

      // Insert payout record in Supabase
      const { data: newPayout, error: insertErr } = await supabaseAdmin
        .from("payouts")
        .insert({
          id: freshPayoutTxId,
          instructor_id: targetInstructorId,
          amount: numAmount,
          currency: resolveResult.currency,
          status: pStatus,
          payment_method: "MOBILE_MONEY",
          payment_reference: `${carrier} (${resolveResult.currency}): +${targetPhone}`,
          notes: pNote,
          processed_by: user.id,
          processed_at: isSuccess ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertErr) {
        console.error("[admin-payouts] Insert direct payout record error:", insertErr.message);
      }

      // Send notification & email if a target instructor was selected
      if (isSuccess && instructorId && instructorId !== user.id) {
        try {
          const { createNotification } = await import("@/lib/supabase/notifications-helper");
          const { sendInstructorPayoutCompletedEmail } = await import("@/lib/email");

          await createNotification({
            userId: instructorId,
            title: "Versement reçu !",
            message: `Un versement direct de ${formattedAmountText} a été envoyé sur votre Mobile Money (+${targetPhone}).`,
            type: "SUCCESS",
            link: "/instructor/earnings"
          });

          const { data: instProfile } = await supabaseAdmin
            .from("profiles")
            .select("email, full_name")
            .eq("id", instructorId)
            .maybeSingle();

          if (instProfile?.email) {
            await sendInstructorPayoutCompletedEmail(
              instProfile.email,
              instProfile.full_name || "Formateur",
              numAmount,
              "Mobile Money",
              `${carrier}: +${targetPhone}`
            );
          }
        } catch (notifErr) {
          console.error("[admin-payouts] Error sending direct payout notifications:", notifErr);
        }
      }

      if (!isSuccess) {
        return NextResponse.json({
          error: `Échec du versement PawaPay : ${apiErrorMessage}. Le versement a été consigné avec le statut ÉCHOUÉ.`,
          status: "FAILED",
          canRecordManually: true,
          suggestedCarrier: carrier.includes("WAVE") ? "ORANGE_SEN" : carrier.includes("ORANGE") ? "WAVE_SEN" : undefined,
          payoutId: freshPayoutTxId,
          notes: pNote
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        status: "PAID",
        payoutId: freshPayoutTxId,
        message: isManual
          ? `Versement manuel de ${formattedAmountText} enregistré avec succès au +${targetPhone} !`
          : `Versement direct PawaPay de ${formattedAmountText} envoyé avec succès au +${targetPhone} !`
      });
    }

    if (!payoutId) {
      return NextResponse.json({ error: "Identifiant de retrait manquant" }, { status: 400 });
    }

    // Fetch the payout request
    const { data: payout, error: fetchErr } = await supabaseAdmin
      .from("payouts")
      .select("*")
      .eq("id", payoutId)
      .single() as any;

    if (fetchErr || !payout) {
      return NextResponse.json({ error: "Demande de retrait introuvable" }, { status: 404 });
    }

    if (payout.status !== "PENDING" && payout.status !== "FAILED") {
      return NextResponse.json({ error: "Cette demande a déjà été finalisée ou annulée." }, { status: 400 });
    }

    if (action === "reject") {
      const rejectReason = reason || "Coordonnées de paiement à réviser ou non conformes.";

      // Update status to CANCELLED (Rejected)
      const { error: updateErr } = await supabaseAdmin
        .from("payouts")
        .update({
          status: "CANCELLED",
          notes: `Demande de retrait rejetée par l'administrateur (${user.email}). Motif : ${rejectReason}`,
          updated_at: new Date().toISOString()
        })
        .eq("id", payoutId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }

      // Send in-app notification & email to instructor
      try {
        const { createNotification } = await import("@/lib/supabase/notifications-helper");
        const { sendInstructorPayoutRejectedEmail } = await import("@/lib/email");

        await createNotification({
          userId: payout.instructor_id,
          title: "Demande de retrait refusée",
          message: `Votre demande de retrait de $${payout.amount.toFixed(2)} USD a été refusée. Motif : ${rejectReason}`,
          type: "WARNING",
          link: "/instructor/earnings"
        });

        const { data: instProfile } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name")
          .eq("id", payout.instructor_id)
          .maybeSingle();

        if (instProfile?.email) {
          await sendInstructorPayoutRejectedEmail(
            instProfile.email,
            instProfile.full_name || "Formateur",
            payout.amount,
            rejectReason
          );
        }
      } catch (notifErr) {
        console.error("[admin-payouts] Error sending rejection notifications:", notifErr);
      }

      return NextResponse.json({ success: true, status: "CANCELLED" });
    }

    if (action === "accept" || action === "manual_accept") {
      const ref = payout.payment_reference || "";
      const separatorIndex = ref.indexOf(":");
      
      const defaultCarrier = separatorIndex !== -1 ? ref.substring(0, separatorIndex).trim() : "MOBILE_MONEY";
      const carrier = body.carrier || defaultCarrier;
      const phoneNumber = separatorIndex !== -1 ? ref.substring(separatorIndex + 1).trim() : ref.trim();

      // Resolve currency from payout.currency, or from payment_reference / notes
      let detectedCurrency = payout.currency;
      if (!detectedCurrency) {
        if (ref.toUpperCase().includes("CDF") || payout.notes?.toUpperCase().includes("CDF") || payout.notes?.toUpperCase().includes("WALLET CDF")) {
          detectedCurrency = "CDF";
        } else if (ref.toUpperCase().includes("USD") || payout.notes?.toUpperCase().includes("USD") || payout.notes?.toUpperCase().includes("WALLET USD")) {
          detectedCurrency = "USD";
        }
      }

      const resolveResult = resolvePawaPayCorrespondent(carrier, phoneNumber, undefined, detectedCurrency);
      const amountLocal = payout.amount * resolveResult.exchangeRate;

      let pawapayRef = `MANUAL-${Date.now()}`;

      if (action === "accept") {
        // Generate a fresh unique transaction ID for PawaPay to prevent DUPLICATE_PAYOUT_ID rejections
        const freshPayoutTxId = crypto.randomUUID();

        // Initiate payout via PawaPay API
        const payoutResponse = await initiatePawaPayPayout({
          payoutId: freshPayoutTxId,
          amount: amountLocal,
          currency: resolveResult.currency,
          correspondent: resolveResult.correspondent,
          phoneNumber: resolveResult.formattedPhone,
          statementDescription: "Ansella Payout",
          environment: body.environment || "production"
        });

        if (!payoutResponse.success) {
          const failureNote = `[Échec PawaPay API] ${payoutResponse.error}. (Opérateur: ${resolveResult.correspondent}, Devise: ${resolveResult.currency}). Réf: ${freshPayoutTxId}`;
          
          // Mark status as FAILED in database so it is no longer considered PAID or PENDING without explanation
          await supabaseAdmin
            .from("payouts")
            .update({
              status: "FAILED",
              notes: failureNote,
              updated_at: new Date().toISOString()
            })
            .eq("id", payoutId);

          return NextResponse.json({ 
            error: `Échec du virement PawaPay : ${payoutResponse.error}. La demande a été marquée comme ÉCHOUÉE (FAILED). Vous pouvez réessayer ou valider manuellement.`,
            status: "FAILED",
            notes: failureNote
          }, { status: 400 });
        }

        pawapayRef = payoutResponse.payoutId;
      }

      const formattedAmountText = resolveResult.currency === "USD" 
        ? `${payout.amount}$ USD` 
        : `${Math.round(amountLocal).toLocaleString('fr-FR')} ${resolveResult.currency} (${payout.amount}$ USD)`;

      // Success or Manual Validation: update payout record status to PAID
      const { error: updateErr } = await supabaseAdmin
        .from("payouts")
        .update({
          status: "PAID",
          currency: resolveResult.currency,
          notes: action === "manual_accept" 
            ? `Versement de ${formattedAmountText} validé manuellement par l'administrateur (${user.email}). Réf : ${ref}` 
            : `Reversement réussi de ${formattedAmountText} via PawaPay (${resolveResult.correspondent}). Réf transaction: ${pawapayRef}`,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", payoutId);

      if (updateErr) {
        return NextResponse.json({ error: `Erreur de mise à jour de la base de données: ${updateErr.message}` }, { status: 500 });
      }

      // Send notification & email to instructor
      try {
        const { createNotification } = await import("@/lib/supabase/notifications-helper");
        const { sendInstructorPayoutCompletedEmail } = await import("@/lib/email");

        await createNotification({
          userId: payout.instructor_id,
          title: "Versement effectué !",
          message: `Votre demande de retrait de $${payout.amount.toFixed(2)} USD a été validée et transférée vers votre Mobile Money.`,
          type: "SUCCESS",
          link: "/instructor/earnings"
        });

        const { data: instProfile } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name")
          .eq("id", payout.instructor_id)
          .maybeSingle();

        if (instProfile?.email) {
          await sendInstructorPayoutCompletedEmail(
            instProfile.email,
            instProfile.full_name || "Formateur",
            payout.amount,
            payout.payment_method || "Mobile Money",
            payout.payment_reference || payoutId
          );
        }
      } catch (notifErr) {
        console.error("[admin-payouts] Error sending payout notification:", notifErr);
      }

      return NextResponse.json({
        success: true,
        status: "PAID",
        payoutId: pawapayRef
      });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });

  } catch (err: any) {
    console.error("[API /api/admin/payouts] Unexpected error:", err);
    return NextResponse.json({ error: err?.message || "Erreur interne du serveur" }, { status: 500 });
  }
}
