import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPawaPayDepositStatus } from "@/lib/pawapay";
import { getPayPalOrderDetails } from "@/lib/paypal";
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

/**
 * Analyse le champ method d'un paiement pour en extraire email, téléphone et nom
 */
function parsePaymentMethodMeta(method: string | null | undefined): { email: string; phone: string; name: string } {
  if (!method || !method.includes("::")) return { email: "", phone: "", name: "" };
  const parts = method.split("::");
  const rawMeta = parts[3] ? decodeURIComponent(parts[3]).trim() : "";
  if (!rawMeta) return { email: "", phone: "", name: "" };

  let email = "";
  let phone = "";
  let name = "";

  if (rawMeta.includes("|")) {
    const subParts = rawMeta.split("|");
    subParts.forEach(p => {
      const trimmed = p.trim();
      if (trimmed.includes("@") && !email) {
        email = trimmed;
      } else if (/^[+0-9\s()-]{7,22}$/.test(trimmed) && !phone) {
        phone = trimmed;
      } else if (trimmed && !name && trimmed !== "client" && trimmed !== "MONTHLY" && trimmed !== "ANNUAL") {
        name = trimmed;
      }
    });
  } else {
    if (rawMeta.includes("@")) {
      email = rawMeta;
    } else if (/^[+0-9\s()-]{7,22}$/.test(rawMeta)) {
      phone = rawMeta;
    } else if (rawMeta !== "client" && rawMeta !== "MONTHLY" && rawMeta !== "ANNUAL") {
      name = rawMeta;
    }
  }

  return { email, phone, name };
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

    // Gérer la transition historique des identifiants d'e-book
    const altProductId =
      productId === "0d0ad7b2-7e13-4f98-ab46-36346d47ac62"
        ? "3b31895d-72da-4d19-a6fd-665a9ce14079"
        : (productId === "3b31895d-72da-4d19-a6fd-665a9ce14079" ? "0d0ad7b2-7e13-4f98-ab46-36346d47ac62" : null);

    const targetProductIds = altProductId ? [productId, altProductId] : [productId];

    // 2. Récupérer les achats dans digital_product_purchases
    const { data: purchases, error: purErr } = await (supabaseAdmin as any)
      .from("digital_product_purchases")
      .select("id, product_id, user_id, price_paid, payment_method, payment_status, transaction_id, created_at")
      .in("product_id", targetProductIds)
      .order("created_at", { ascending: false });

    if (purErr) {
      console.warn("[admin-digital-product-buyers] Purchases fetch warning:", purErr.message);
    }

    // 3. Récupérer les paiements associés (par IDs de transaction et par produit)
    const txIds = (purchases || []).map((p: any) => p.transaction_id).filter(Boolean);
    const purIds = (purchases || []).map((p: any) => p.id).filter(Boolean);

    const paymentsMap = new Map<string, any>();

    // A. Récupérer par identifiants exacts
    const uniqueKeys = Array.from(new Set([...txIds, ...purIds]));
    if (uniqueKeys.length > 0) {
      const { data: directPayments } = await (supabaseAdmin as any)
        .from("payments")
        .select("id, order_id, user_id, amount, currency, status, method, provider, provider_metadata, provider_transaction_id, created_at, paid_at")
        .in("id", uniqueKeys);

      (directPayments || []).forEach((pay: any) => {
        if (pay.id) paymentsMap.set(pay.id, pay);
        if (pay.provider_transaction_id) paymentsMap.set(pay.provider_transaction_id, pay);
        if (pay.order_id) paymentsMap.set(pay.order_id, pay);
      });

      const { data: providerPayments } = await (supabaseAdmin as any)
        .from("payments")
        .select("id, order_id, user_id, amount, currency, status, method, provider, provider_metadata, provider_transaction_id, created_at, paid_at")
        .in("provider_transaction_id", uniqueKeys);

      (providerPayments || []).forEach((pay: any) => {
        if (pay.id) paymentsMap.set(pay.id, pay);
        if (pay.provider_transaction_id) paymentsMap.set(pay.provider_transaction_id, pay);
        if (pay.order_id) paymentsMap.set(pay.order_id, pay);
      });
    }

    // B. Récupérer également les paiements liés au produit via la colonne method
    const { data: productPayments } = await (supabaseAdmin as any)
      .from("payments")
      .select("id, order_id, user_id, amount, currency, status, method, provider, provider_metadata, provider_transaction_id, created_at, paid_at")
      .or(`method.ilike.%DIGITAL_PRODUCT::${productId}%,method.ilike.%DIGITAL_PRODUCT::${altProductId || productId}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    (productPayments || []).forEach((pay: any) => {
      if (pay.id && !paymentsMap.has(pay.id)) paymentsMap.set(pay.id, pay);
      if (pay.provider_transaction_id && !paymentsMap.has(pay.provider_transaction_id)) paymentsMap.set(pay.provider_transaction_id, pay);
      if (pay.order_id && !paymentsMap.has(pay.order_id)) paymentsMap.set(pay.order_id, pay);
    });

    // 4. Collecter tous les user_ids pour enrichir les profils en batch
    const candidateUserIds = new Set<string>();
    (purchases || []).forEach((p: any) => {
      if (p.user_id && p.user_id.length > 10) candidateUserIds.add(p.user_id);
    });
    Array.from(paymentsMap.values()).forEach((p: any) => {
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

    // 5. Consolider les acheteurs uniques avec coordonnées complètes (Email, Téléphone, Nom)
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
      const matchedPayment = paymentsMap.get(pur.transaction_id) || paymentsMap.get(pur.id);

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

      // Extraction depuis provider_metadata
      if (matchedPayment?.provider_metadata && typeof matchedPayment.provider_metadata === "object") {
        const meta = matchedPayment.provider_metadata;
        if (!email && (meta.buyerEmail || meta.email)) {
          email = String(meta.buyerEmail || meta.email).trim();
        }
        if (!phone && (meta.buyerPhone || meta.phone || meta.phoneNumber)) {
          phone = String(meta.buyerPhone || meta.phone || meta.phoneNumber).trim();
        }
        if (!name && (meta.buyerName || meta.name)) {
          name = String(meta.buyerName || meta.name).trim();
        }
      }

      // Extraction depuis payments.method
      if ((!email || !phone || !name) && matchedPayment?.method) {
        const methodMeta = parsePaymentMethodMeta(matchedPayment.method);
        if (!email && methodMeta.email) email = methodMeta.email;
        if (!phone && methodMeta.phone) phone = methodMeta.phone;
        if (!name && methodMeta.name) name = methodMeta.name;
      }

      // Fallback si l'user_id contient un email
      if (!email && pur.user_id?.includes("@")) {
        email = pur.user_id.trim();
      }

      // Fallback Supabase auth si user_id valide
      if ((!email || !name || !phone) && pur.user_id && pur.user_id.length >= 30) {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(pur.user_id);
          if (authUser?.user) {
            email = email || authUser.user.email || "";
            name = name || authUser.user.user_metadata?.full_name || authUser.user.user_metadata?.name || "";
            phone = phone || authUser.user.phone || authUser.user.user_metadata?.phone || authUser.user.user_metadata?.phone_number || "";
          }
        } catch {
          // non bloquant
        }
      }

      // Réconciliation automatique PayPal si email/téléphone encore manquant
      const isPayPal =
        (pur.payment_method || "").toLowerCase().includes("paypal") ||
        (matchedPayment?.provider || "").toUpperCase() === "PAYPAL" ||
        /^[0-9A-Z]{17}$/.test(txKey);

      if (isPayPal && (!email || email === "Email non renseigné")) {
        try {
          const ppOrder = await getPayPalOrderDetails(txKey);
          if (ppOrder?.payer) {
            const ppEmail = ppOrder.payer.email_address || "";
            const ppName = `${ppOrder.payer.name?.given_name || ""} ${ppOrder.payer.name?.surname || ""}`.trim();
            const ppPhone = ppOrder.payer.phone?.phone_number?.national_number || "";

            if (ppEmail) email = ppEmail;
            if (ppName) name = ppName;
            if (ppPhone) phone = ppPhone;

            // Sauvegarder dans la table payments
            await (supabaseAdmin as any)
              .from("payments")
              .update({
                provider_metadata: {
                  buyerEmail: email,
                  buyerName: name,
                  buyerPhone: phone,
                  paypalOrderId: txKey,
                  payer: ppOrder.payer,
                },
              })
              .or(`id.eq.${txKey},provider_transaction_id.eq.${txKey}`);
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
    for (const pay of Array.from(paymentsMap.values())) {
      const isPaid = pay.status === "PAID" || pay.status === "COMPLETED";
      const txId = pay.provider_transaction_id || pay.id;

      if (!buyersMap.has(txId) && !buyersMap.has(pay.id)) {
        const profile = pay.user_id ? userProfileMap.get(pay.user_id) : null;
        let email = profile?.email || "";
        let name = profile?.full_name || "";
        let phone = profile?.phone || "";

        if (pay.provider_metadata && typeof pay.provider_metadata === "object") {
          const meta = pay.provider_metadata;
          if (!email && (meta.buyerEmail || meta.email)) email = String(meta.buyerEmail || meta.email).trim();
          if (!phone && (meta.buyerPhone || meta.phone || meta.phoneNumber)) phone = String(meta.buyerPhone || meta.phone || meta.phoneNumber).trim();
          if (!name && (meta.buyerName || meta.name)) name = String(meta.buyerName || meta.name).trim();
        }

        if ((!email || !phone || !name) && pay.method) {
          const methodMeta = parsePaymentMethodMeta(pay.method);
          if (!email && methodMeta.email) email = methodMeta.email;
          if (!phone && methodMeta.phone) phone = methodMeta.phone;
          if (!name && methodMeta.name) name = methodMeta.name;
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
    // CAS 1 : Mise à jour manuelle des coordonnées d'un acheteur
    // ─────────────────────────────────────────────────────────────
    if (action === "update_buyer_info") {
      const { transactionId, purchaseId, email, phone, name } = body;
      const cleanEmail = String(email || "").trim().toLowerCase();
      const cleanPhone = String(phone || "").trim();
      const cleanName = String(name || "").trim() || (cleanEmail ? cleanEmail.split("@")[0] : "Client");

      if (!transactionId && !purchaseId) {
        return NextResponse.json({ error: "Identifiant de transaction ou d'achat requis" }, { status: 400 });
      }

      // Mettre à jour la table payments
      await (supabaseAdmin as any)
        .from("payments")
        .update({
          provider_metadata: {
            buyerEmail: cleanEmail,
            buyerPhone: cleanPhone,
            buyerName: cleanName,
          },
        })
        .or(`id.eq.${transactionId || purchaseId},provider_transaction_id.eq.${transactionId || purchaseId}`);

      // Mettre à jour profiles si email présent
      if (cleanEmail && cleanEmail.includes("@")) {
        const { data: existingProf } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (existingProf?.id) {
          await supabaseAdmin
            .from("profiles")
            .update({
              full_name: cleanName,
              phone: cleanPhone || undefined,
            } as any)
            .eq("id", existingProf.id);

          // Lier à l'achat dans digital_product_purchases
          if (purchaseId || transactionId) {
            await (supabaseAdmin as any)
              .from("digital_product_purchases")
              .update({ user_id: existingProf.id })
              .or(`id.eq.${purchaseId},transaction_id.eq.${transactionId}`);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: "Coordonnées de l'acheteur mises à jour avec succès !",
        buyer: { email: cleanEmail, phone: cleanPhone, name: cleanName },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CAS 2 : Synchronisation en direct avec PayPal
    // ─────────────────────────────────────────────────────────────
    if (action === "sync_paypal") {
      const { orderId } = body;
      if (!orderId) {
        return NextResponse.json({ error: "orderId PayPal requis" }, { status: 400 });
      }

      try {
        const ppOrder = await getPayPalOrderDetails(orderId);
        const payer = ppOrder.payer || {};
        const email = payer.email_address || "";
        const name = `${payer.name?.given_name || ""} ${payer.name?.surname || ""}`.trim();
        const phone = payer.phone?.phone_number?.national_number || "";

        await (supabaseAdmin as any)
          .from("payments")
          .update({
            provider_metadata: {
              buyerEmail: email,
              buyerName: name,
              buyerPhone: phone,
              paypalOrderId: orderId,
              payer,
            },
          })
          .or(`id.eq.${orderId},provider_transaction_id.eq.${orderId}`);

        return NextResponse.json({
          success: true,
          message: "Coordonnées synchronisées depuis PayPal !",
          buyer: { email, phone, name },
        });
      } catch (ppErr: any) {
        return NextResponse.json({ error: `Erreur PayPal : ${ppErr.message}` }, { status: 400 });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // CAS 3 : Génération rapide d'un lien de téléchargement direct
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
        168
      );
      const downloadUrl = `${baseUrl.replace(/\/+$/, "")}/api/digital-products/${productId}/download?token=${token}`;

      return NextResponse.json({
        success: true,
        downloadUrl,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CAS 4 : Vérification live auprès de l'API PawaPay d'un dépôt PENDING
    // ─────────────────────────────────────────────────────────────
    if (action === "verify_pawapay") {
      const { depositId, buyerEmail: inputEmail, buyerName: inputName, buyerPhone: inputPhone } = body;
      if (!depositId) {
        return NextResponse.json({ error: "depositId PawaPay requis" }, { status: 400 });
      }

      const pawaResult = await getPawaPayDepositStatus(depositId);
      const rawStatus = (pawaResult.status || "").toUpperCase();
      const livePhone = pawaResult.payerPhone || inputPhone || "";

      if (["COMPLETED", "PAID", "SUCCESS", "SUCCESSFUL"].includes(rawStatus)) {
        let effectiveEmail = inputEmail ? String(inputEmail).trim().toLowerCase() : "";

        const { data: payRow } = await (supabaseAdmin as any)
          .from("payments")
          .select("user_id, amount, method, provider_metadata")
          .eq("id", depositId)
          .maybeSingle();

        if (!effectiveEmail && payRow?.provider_metadata?.buyerEmail) {
          effectiveEmail = payRow.provider_metadata.buyerEmail;
        }

        if (!effectiveEmail && payRow?.method) {
          effectiveEmail = parsePaymentMethodMeta(payRow.method).email;
        }

        await (supabaseAdmin as any)
          .from("payments")
          .update({
            status: "PAID",
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            provider_metadata: {
              ...(payRow?.provider_metadata || {}),
              buyerEmail: effectiveEmail,
              buyerPhone: livePhone,
              buyerName: inputName || effectiveEmail.split("@")[0] || "Client",
            },
          })
          .eq("id", depositId);

        let userId = payRow?.user_id || crypto.randomUUID();

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
                phone: livePhone,
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
          buyerPhone: livePhone,
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
          buyerPhone: livePhone,
        });
      }

      return NextResponse.json({
        success: false,
        status: rawStatus || "PENDING",
        message: "La transaction est toujours en attente d'approbation sur le mobile du client chez PawaPay.",
        buyerPhone: livePhone,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CAS 5 : Ajout manuel d'un acheteur / Régularisation forcée
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

    const encodedBuyerMeta = encodeURIComponent(`${cleanEmail}|${cleanPhone}|${cleanName}`);
    if (existingPaymentId) {
      await (supabaseAdmin as any)
        .from("payments")
        .update({
          status: "PAID",
          user_id: userId,
          amount: finalAmount,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          provider_metadata: {
            buyerEmail: cleanEmail,
            buyerPhone: cleanPhone,
            buyerName: cleanName,
          },
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
          provider_transaction_id: finalTxId,
          method: `${paymentMethod.toUpperCase()}::DIGITAL_PRODUCT::${productId}::${encodedBuyerMeta}`,
          provider_metadata: {
            buyerEmail: cleanEmail,
            buyerPhone: cleanPhone,
            buyerName: cleanName,
          },
          created_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (payInsertErr: any) {
        console.warn("[admin-digital-product-buyers] Payment insert warning:", payInsertErr?.message);
      }
    }

    const { generateDigitalProductToken } = await import("@/lib/digital-product-token");
    const downloadToken = generateDigitalProductToken(
      productId,
      purchaseRecordId,
      cleanEmail,
      168
    );
    const downloadUrl = `${baseUrl.replace(/\/+$/, "")}/api/digital-products/${productId}/download?token=${downloadToken}`;

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
