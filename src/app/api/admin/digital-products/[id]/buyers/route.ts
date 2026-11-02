import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPawaPayDepositStatus } from "@/lib/pawapay";
import { createNotification } from "@/lib/supabase/notifications-helper";
import crypto from "crypto";

const ADMIN_MOD_ROLES = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "ACADEMIC_ADMIN", "FINANCE_ADMIN"];

async function verifyAdminAuth() {
  const supabase = await createServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { error: "Non authentifié", status: 401, user: null };
  }

  const { data: userRoles } = await (supabaseAdmin
    .from("user_roles")
    .select("roles!inner(name)")
    .eq("user_id", user.id) as any);

  const roleNames: string[] = (userRoles || []).map((ur: any) => ur.roles?.name).filter(Boolean);
  const hasAccess = roleNames.some(r => ADMIN_MOD_ROLES.includes(r));

  if (!hasAccess) {
    return { error: "Accès refusé. Rôle d'administrateur requis.", status: 403, user: null };
  }

  return { error: null, status: 200, user };
}

function extractEmailFromMethod(method: string | null | undefined): string {
  if (!method || !method.includes("::")) return "";
  const parts = method.split("::");
  if (parts[3]) {
    try {
      const decoded = decodeURIComponent(parts[3]).trim();
      if (decoded.includes("@")) return decoded;
    } catch {
      // ignore
    }
  }
  return "";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: rawProductId } = await params;
    const productId = String(rawProductId || "").replace(/[^a-zA-Z0-9_-]/g, "");
    if (!productId) {
      return NextResponse.json({ error: "ID du produit manquant" }, { status: 400 });
    }

    // 1. Charger les métadonnées du produit digital
    const { data: product, error: prodErr } = await supabaseAdmin
      .from("digital_products")
      .select("id, title, price, cover_image_url, file_name, status, category")
      .eq("id", productId)
      .maybeSingle();

    if (prodErr || !product) {
      return NextResponse.json({ error: "Produit digital introuvable" }, { status: 404 });
    }

    // 2. Récupérer les achats dans digital_product_purchases
    const { data: purchases, error: purErr } = await (supabaseAdmin as any)
      .from("digital_product_purchases")
      .select("id, product_id, user_id, price_paid, payment_method, payment_status, transaction_id, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (purErr) {
      console.warn("[admin-digital-product-buyers] Purchases fetch warning:", purErr.message);
    }

    // 3. Récupérer également les paiements dans la table payments liée au produit
    const { data: paymentsData } = await (supabaseAdmin as any)
      .from("payments")
      .select("id, order_id, user_id, amount, currency, status, method, provider, provider_transaction_id, created_at, paid_at")
      .or(`method.ilike.%DIGITAL_PRODUCT::${productId}%,order_id.eq.${productId}`)
      .order("created_at", { ascending: false });

    // Indexer les paiements pour enrichir rapidement les achats
    const paymentByTxMap = new Map<string, any>();
    (paymentsData || []).forEach((pay: any) => {
      if (pay.id) paymentByTxMap.set(pay.id, pay);
      if (pay.provider_transaction_id) paymentByTxMap.set(pay.provider_transaction_id, pay);
      if (pay.order_id) paymentByTxMap.set(pay.order_id, pay);
    });

    // 4. Collecter tous les user_ids pour enrichir les profils en batch
    const candidateUserIds = new Set<string>();
    (purchases || []).forEach((p: any) => {
      if (p.user_id && p.user_id.length > 10) candidateUserIds.add(p.user_id);
    });
    (paymentsData || []).forEach((p: any) => {
      if (p.user_id && p.user_id.length > 10) candidateUserIds.add(p.user_id);
    });

    const userProfileMap = new Map<string, {
      full_name: string;
      email: string;
      phone: string;
      avatar_url: string | null;
    }>();

    if (candidateUserIds.size > 0) {
      const { data: profiles } = await (supabaseAdmin as any)
        .from("profiles")
        .select("id, full_name, email, phone, phone_number, avatar_url")
        .in("id", Array.from(candidateUserIds));

      (profiles || []).forEach((prof: any) => {
        userProfileMap.set(prof.id, {
          full_name: prof.full_name || "",
          email: prof.email || "",
          phone: prof.phone || prof.phone_number || "",
          avatar_url: prof.avatar_url || null,
        });
      });
    }

    // 5. Consolider les acheteurs uniques et vérifiés
    interface BuyerItem {
      id: string;
      purchaseId: string;
      transactionId: string;
      buyerName: string;
      buyerEmail: string;
      buyerPhone: string;
      avatarUrl: string | null;
      pricePaid: number;
      paymentMethod: string;
      paymentStatus: string;
      createdAt: string;
    }

    const buyersMap = new Map<string, BuyerItem>();

    // Traitement des achats de digital_product_purchases
    for (const pur of (purchases || [])) {
      const txKey = pur.transaction_id || pur.id;
      const matchedPayment = paymentByTxMap.get(pur.transaction_id) || paymentByTxMap.get(pur.id);

      const isPurPaid =
        pur.payment_status === "COMPLETED" ||
        pur.payment_status === "PAID" ||
        pur.payment_status === "completed" ||
        pur.payment_status === "paid";

      const isPaymentPaid =
        matchedPayment &&
        (matchedPayment.status === "PAID" || matchedPayment.status === "COMPLETED");

      const isPaid = isPurPaid || isPaymentPaid;

      const profile = pur.user_id ? userProfileMap.get(pur.user_id) : null;
      let email = profile?.email || "";
      let name = profile?.full_name || "";
      let phone = profile?.phone || "";

      // Fallback 1 : extraire l'email de l'user_id si format email
      if (!email && pur.user_id?.includes("@")) {
        email = pur.user_id.trim();
      }

      // Fallback 2 : extraire l'email depuis les métadonnées de la table payments (method string)
      if (!email && matchedPayment?.method) {
        email = extractEmailFromMethod(matchedPayment.method);
      }

      // Fallback 3 : charger le compte Supabase auth si user_id valide
      if ((!email || !name) && pur.user_id && pur.user_id.length >= 30) {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(pur.user_id);
          if (authUser?.user) {
            email = email || authUser.user.email || "";
            name = name || authUser.user.user_metadata?.full_name || authUser.user.user_metadata?.name || "";
          }
        } catch {
          // non bloquant
        }
      }

      // Dériver un nom propre si l'email est présent mais sans nom explicite
      if (!name && email) {
        const local = email.split("@")[0];
        name = local.charAt(0).toUpperCase() + local.slice(1);
      }

      buyersMap.set(txKey, {
        id: pur.id,
        purchaseId: pur.id,
        transactionId: pur.transaction_id || pur.id,
        buyerName: name || "Client Inconnu",
        buyerEmail: email || "Email non renseigné",
        buyerPhone: phone || "",
        avatarUrl: profile?.avatar_url || null,
        pricePaid: Number(pur.price_paid) || (matchedPayment ? Number(matchedPayment.amount) : product.price),
        paymentMethod: pur.payment_method || (matchedPayment?.provider ? matchedPayment.provider.toLowerCase() : "Paiement en ligne"),
        paymentStatus: isPaid ? "COMPLETED" : (pur.payment_status || matchedPayment?.status || "PENDING"),
        createdAt: pur.created_at || matchedPayment?.created_at,
      });
    }

    // Traitement des paiements de la table payments non encore consolidés
    for (const pay of (paymentsData || [])) {
      const isPaid = pay.status === "PAID" || pay.status === "COMPLETED";
      const txId = pay.provider_transaction_id || pay.id;

      if (!buyersMap.has(txId) && !buyersMap.has(pay.id)) {
        const profile = pay.user_id ? userProfileMap.get(pay.user_id) : null;
        let email = profile?.email || "";
        let name = profile?.full_name || "";
        let phone = profile?.phone || "";

        if (!email && pay.user_id?.includes("@")) {
          email = pay.user_id.trim();
        }

        if (!email && pay.method) {
          email = extractEmailFromMethod(pay.method);
        }

        if (!name && email) {
          const local = email.split("@")[0];
          name = local.charAt(0).toUpperCase() + local.slice(1);
        }

        buyersMap.set(txId, {
          id: pay.id,
          purchaseId: pay.id,
          transactionId: txId,
          buyerName: name || "Client Inconnu",
          buyerEmail: email || "Email non renseigné",
          buyerPhone: phone || "",
          avatarUrl: profile?.avatar_url || null,
          pricePaid: Number(pay.amount) || product.price,
          paymentMethod: pay.provider ? pay.provider.toLowerCase() : (pay.method?.split("::")[0]?.toLowerCase() || "Paiement en ligne"),
          paymentStatus: isPaid ? "COMPLETED" : pay.status,
          createdAt: pay.created_at,
        });
      }
    }

    // Convertir en tableau et trier par date décroissante
    const buyers = Array.from(buyersMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const totalRevenue = buyers
      .filter(b => b.paymentStatus === "COMPLETED" || b.paymentStatus === "PAID")
      .reduce((sum, b) => sum + (b.pricePaid || 0), 0);

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        price: Number(product.price) || 0,
        cover_image_url: product.cover_image_url,
        category: product.category,
      },
      stats: {
        totalBuyers: buyers.length,
        completedBuyers: buyers.filter(b => b.paymentStatus === "COMPLETED" || b.paymentStatus === "PAID").length,
        totalRevenue,
      },
      buyers,
    });
  } catch (error: any) {
    console.error("[admin-digital-product-buyers] Error:", error);
    return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
  }
}

/**
 * POST : Gestion administrative des accès et acheteurs
 * - manual_add : Ajouter manuellement un acheteur (PawaPay, PayPal, etc.) et lui envoyer son livre
 * - verify_pawapay : Vérifier en direct auprès de l'API PawaPay l'état d'un paiement PENDING et l'activer
 * - get_download_link : Générer et retourner un lien de téléchargement cryptographique direct
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: rawProductId } = await params;
    const productId = String(rawProductId || "").replace(/[^a-zA-Z0-9_-]/g, "");
    if (!productId) {
      return NextResponse.json({ error: "ID du produit manquant" }, { status: 400 });
    }

    // Charger les métadonnées du produit
    const { data: product, error: prodErr } = await supabaseAdmin
      .from("digital_products")
      .select("id, title, price, author_id, file_name, file_url")
      .eq("id", productId)
      .maybeSingle();

    if (prodErr || !product) {
      return NextResponse.json({ error: "Produit digital introuvable" }, { status: 404 });
    }

    const body = await req.json();
    const action = body.action || "manual_add";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://ansella.app";

    // ─────────────────────────────────────────────────────────────
    // CAS 1 : Génération rapide d'un lien de téléchargement direct
    // ─────────────────────────────────────────────────────────────
    if (action === "get_download_link") {
      const { email, purchaseId } = body;
      if (!email || !email.includes("@")) {
        return NextResponse.json({ error: "Adresse email requise pour signer le lien." }, { status: 400 });
      }

      const { generateDigitalProductToken } = await import("@/lib/digital-product-token");
      const token = generateDigitalProductToken(
        productId,
        purchaseId || crypto.randomUUID(),
        email.trim(),
        168 // 7 jours
      );
      const downloadUrl = `${baseUrl.replace(/\/+$/, "")}/api/digital-products/${productId}/download?token=${token}`;

      return NextResponse.json({
        success: true,
        downloadUrl,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CAS 2 : Vérification live auprès de l'API PawaPay d'un dépôt PENDING
    // ─────────────────────────────────────────────────────────────
    if (action === "verify_pawapay") {
      const { depositId, buyerEmail: inputEmail, buyerName: inputName } = body;
      if (!depositId) {
        return NextResponse.json({ error: "depositId PawaPay requis" }, { status: 400 });
      }

      const pawaResult = await getPawaPayDepositStatus(depositId);
      const rawStatus = (pawaResult.status || "").toUpperCase();

      if (["COMPLETED", "PAID", "SUCCESS", "SUCCESSFUL"].includes(rawStatus)) {
        // 1. Mettre à jour la table payments en PAID
        await (supabaseAdmin as any)
          .from("payments")
          .update({
            status: "PAID",
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", depositId);

        // 2. Mettre à jour ou insérer dans digital_product_purchases
        let effectiveEmail = inputEmail ? String(inputEmail).trim().toLowerCase() : "";

        // Récupérer le paiement pour extraire l'email encodé si manquant
        const { data: payRow } = await (supabaseAdmin as any)
          .from("payments")
          .select("user_id, amount, method")
          .eq("id", depositId)
          .maybeSingle();

        if (!effectiveEmail && payRow?.method) {
          effectiveEmail = extractEmailFromMethod(payRow.method);
        }

        let userId = payRow?.user_id;
        if (!userId || userId.length < 10) {
          userId = crypto.randomUUID();
        }

        // Si profil absent, le créer
        if (effectiveEmail) {
          const { data: prof } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("email", effectiveEmail)
            .maybeSingle();

          if (prof?.id) {
            userId = prof.id;
          } else {
            try {
              await supabaseAdmin.from("profiles").insert({
                id: userId,
                email: effectiveEmail,
                full_name: inputName || effectiveEmail.split("@")[0],
                role: "STUDENT",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as any);
            } catch {}
          }
        }

        const purchaseRecordId = crypto.randomUUID();
        await (supabaseAdmin as any).from("digital_product_purchases").upsert(
          {
            product_id: productId,
            user_id: userId,
            price_paid: payRow?.amount || product.price,
            payment_method: "pawapay",
            payment_status: "COMPLETED",
            transaction_id: depositId,
            created_at: new Date().toISOString(),
          },
          { onConflict: "product_id,user_id" }
        );

        // 3. Générer le jeton et envoyer l'e-mail si email disponible
        let downloadUrl = "";
        if (effectiveEmail) {
          const { generateDigitalProductToken } = await import("@/lib/digital-product-token");
          const token = generateDigitalProductToken(productId, purchaseRecordId, effectiveEmail, 168);
          downloadUrl = `${baseUrl.replace(/\/+$/, "")}/api/digital-products/${productId}/download?token=${token}`;

          try {
            const { sendDigitalProductDeliveryEmail } = await import("@/lib/email");
            const buyerName = inputName || effectiveEmail.split("@")[0] || "Client";
            await sendDigitalProductDeliveryEmail(
              effectiveEmail,
              buyerName,
              product.title,
              downloadUrl,
              `DP-${depositId.substring(0, 8).toUpperCase()}`,
              payRow?.amount || product.price
            );
          } catch (mailErr) {
            console.warn("[admin-digital-product-buyers] Delivery email warning:", mailErr);
          }
        }

        return NextResponse.json({
          success: true,
          status: "COMPLETED",
          message: "Paiement validé avec succès auprès de PawaPay. Accès activé et exemplaire livré !",
          downloadUrl,
          buyerEmail: effectiveEmail,
        });
      }

      if (["FAILED", "REJECTED", "CANCELLED", "EXPIRED"].includes(rawStatus)) {
        await (supabaseAdmin as any)
          .from("payments")
          .update({
            status: "FAILED",
            failure_reason: pawaResult.error || "Paiement rejeté par l'opérateur mobile",
            updated_at: new Date().toISOString(),
          })
          .eq("id", depositId);

        return NextResponse.json({
          success: false,
          status: "FAILED",
          message: `PawaPay indique que la transaction a échoué (${pawaResult.error || "Paiement rejeté ou expiré"}).`,
        });
      }

      return NextResponse.json({
        success: false,
        status: rawStatus || "PENDING",
        message: "La transaction est toujours en attente d'approbation sur le mobile du client chez PawaPay.",
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CAS 3 : Ajout manuel d'un acheteur / Régularisation forcée
    // ─────────────────────────────────────────────────────────────
    const {
      email,
      name,
      phone,
      paymentMethod = "PAWAPAY",
      transactionId,
      pricePaid,
      sendEmail = true,
      existingPaymentId,
    } = body;

    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { error: "Veuillez fournir une adresse email valide pour cet acheteur." },
        { status: 400 }
      );
    }

    const cleanName = String(name || "").trim() || (cleanEmail.split("@")[0].charAt(0).toUpperCase() + cleanEmail.split("@")[0].slice(1));
    const cleanPhone = String(phone || "").trim();
    const finalAmount = Number(pricePaid) > 0 ? Number(pricePaid) : Number(product.price);
    const finalTxId =
      String(transactionId || "").trim() ||
      String(existingPaymentId || "").trim() ||
      `MANUAL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    // 1. Résoudre le profil utilisateur (créer un profil propre si nécessaire)
    let userId = "";
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingProfile?.id) {
      userId = existingProfile.id;
    } else {
      userId = crypto.randomUUID();
      try {
        await supabaseAdmin.from("profiles").insert({
          id: userId,
          email: cleanEmail,
          full_name: cleanName,
          phone: cleanPhone,
          role: "STUDENT",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (profErr: any) {
        console.warn("[admin-digital-product-buyers] Profile insertion warning:", profErr?.message);
      }
    }

    const purchaseRecordId = crypto.randomUUID();

    // 2. Enregistrer l'achat dans digital_product_purchases
    const { error: purInsertErr } = await (supabaseAdmin as any)
      .from("digital_product_purchases")
      .upsert(
        {
          product_id: productId,
          user_id: userId,
          price_paid: finalAmount,
          payment_method: paymentMethod.toLowerCase(),
          payment_status: "COMPLETED",
          transaction_id: finalTxId,
          created_at: new Date().toISOString(),
        },
        { onConflict: "product_id,user_id" }
      );

    if (purInsertErr) {
      console.error("[admin-digital-product-buyers] Purchase upsert error:", purInsertErr);
      return NextResponse.json(
        { error: `Erreur lors de l'enregistrement de l'achat : ${purInsertErr.message}` },
        { status: 500 }
      );
    }

    // 3. Mettre à jour ou insérer dans la table payments
    if (existingPaymentId) {
      await (supabaseAdmin as any)
        .from("payments")
        .update({
          status: "PAID",
          user_id: userId,
          amount: finalAmount,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPaymentId);
    } else {
      try {
        await (supabaseAdmin as any).from("payments").insert({
          id: finalTxId,
          user_id: userId,
          amount: finalAmount,
          currency: "USD",
          status: "PAID",
          provider: paymentMethod.toUpperCase(),
          method: `${paymentMethod.toUpperCase()}::DIGITAL_PRODUCT::${productId}::${encodeURIComponent(cleanEmail)}`,
          created_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (payInsertErr: any) {
        console.warn("[admin-digital-product-buyers] Payment insert warning:", payInsertErr?.message);
      }
    }

    // 4. Générer le jeton d'accès sécurisé (7 jours)
    const { generateDigitalProductToken } = await import("@/lib/digital-product-token");
    const downloadToken = generateDigitalProductToken(
      productId,
      purchaseRecordId,
      cleanEmail,
      168 // 7 jours
    );
    const downloadUrl = `${baseUrl.replace(/\/+$/, "")}/api/digital-products/${productId}/download?token=${downloadToken}`;

    // 5. Envoyer l'email officiel avec lien direct si demandé
    let emailSent = false;
    if (sendEmail) {
      try {
        const { sendDigitalProductDeliveryEmail } = await import("@/lib/email");
        await sendDigitalProductDeliveryEmail(
          cleanEmail,
          cleanName,
          product.title,
          downloadUrl,
          `DP-${finalTxId.substring(0, 8).toUpperCase()}`,
          finalAmount
        );
        emailSent = true;
      } catch (mailErr: any) {
        console.error("[admin-digital-product-buyers] Delivery email failed:", mailErr);
      }
    }

    // 6. Notifier le créateur / formateur du produit
    if (product.author_id) {
      try {
        await createNotification({
          userId: product.author_id,
          title: "Vente de produit digital régularisée !",
          message: `Un exemplaire de "${product.title}" a été accordé/validé pour ${cleanName} (${cleanEmail}).`,
          type: "SUCCESS",
          link: `/instructor/courses`,
        });
      } catch (notifErr) {
        console.warn("[admin-digital-product-buyers] Author notif warning:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Accès au produit validé avec succès pour ${cleanName} (${cleanEmail}).`,
      downloadUrl,
      buyer: {
        email: cleanEmail,
        name: cleanName,
        phone: cleanPhone,
        transactionId: finalTxId,
        pricePaid: finalAmount,
        paymentMethod,
        downloadUrl,
        emailSent,
      },
    });
  } catch (error: any) {
    console.error("[admin-digital-product-buyers POST] Critical error:", error);
    return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
  }
}
