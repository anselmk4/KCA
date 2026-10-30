import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

    // 3. Récupérer également les paiements dans la table payments liée au produit (sécurité multi-source)
    const { data: paymentsData } = await (supabaseAdmin as any)
      .from("payments")
      .select("id, user_id, amount, currency, status, method, provider, provider_transaction_id, created_at, paid_at")
      .or(`method.ilike.%DIGITAL_PRODUCT::${productId}%,order_id.eq.${productId}`)
      .order("created_at", { ascending: false });

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
          full_name: prof.full_name || "Client",
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
      const isPaid =
        pur.payment_status === "COMPLETED" ||
        pur.payment_status === "PAID" ||
        pur.payment_status === "completed" ||
        pur.payment_status === "paid";

      // Identifier de transaction unique pour dédoublonner
      const txKey = pur.transaction_id || pur.id;
      const profile = pur.user_id ? userProfileMap.get(pur.user_id) : null;

      let email = profile?.email || "";
      let name = profile?.full_name || "";
      let phone = profile?.phone || "";

      // Fallback si l'user_id contient l'email de l'acheteur
      if (!email && pur.user_id?.includes("@")) {
        email = pur.user_id;
      }

      // Si le profil n'a pas été trouvé, essayer de charger le compte Supabase auth
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

      buyersMap.set(txKey, {
        id: pur.id,
        purchaseId: pur.id,
        transactionId: pur.transaction_id || pur.id,
        buyerName: name || "Client Inconnu",
        buyerEmail: email || "Email non renseigné",
        buyerPhone: phone || "",
        avatarUrl: profile?.avatar_url || null,
        pricePaid: Number(pur.price_paid) || product.price,
        paymentMethod: pur.payment_method || "Paiement en ligne",
        paymentStatus: isPaid ? "COMPLETED" : (pur.payment_status || "PENDING"),
        createdAt: pur.created_at,
      });
    }

    // Traitement des paiements de la table payments (pour rattraper les paiements sans purchase row immédiat)
    for (const pay of (paymentsData || [])) {
      const isPaid = pay.status === "PAID" || pay.status === "COMPLETED";
      const txId = pay.provider_transaction_id || pay.id;

      if (!buyersMap.has(txId) && !buyersMap.has(pay.id)) {
        const profile = pay.user_id ? userProfileMap.get(pay.user_id) : null;
        let email = profile?.email || "";
        let name = profile?.full_name || "";
        let phone = profile?.phone || "";

        // Extraire l'email éventuel encodé dans le champ method: PAYPAL::DIGITAL_PRODUCT::productId::email
        if (pay.method?.includes("::")) {
          const parts = pay.method.split("::");
          if (parts[3]) {
            try {
              const decoded = decodeURIComponent(parts[3]);
              if (decoded.includes("@")) {
                email = decoded;
              }
            } catch {
              // ignore
            }
          }
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
          paymentMethod: pay.provider ? pay.provider.toLowerCase() : (pay.method || "Paiement en ligne"),
          paymentStatus: isPaid ? "COMPLETED" : pay.status,
          createdAt: pay.created_at,
        });
      }
    }

    // Convertir en tableau et trier par date décroissante (plus récent d'abord)
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
