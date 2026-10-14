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

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // 1. Fetch all digital products
    const { data: productsData, error: productsErr } = await supabaseAdmin
      .from("digital_products")
      .select("id, author_id, title, description, price, cover_image_url, file_name, file_size_bytes, status, category, sales_count, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (productsErr) {
      return NextResponse.json({ error: productsErr.message }, { status: 400 });
    }

    const products = productsData || [];
    const authorIds = [...new Set(products.map((p) => p.author_id).filter(Boolean))];

    // 2. Fetch author profiles
    let authorMap = new Map<string, { full_name: string; email: string; avatar_url: string | null }>();
    if (authorIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", authorIds);

      (profiles || []).forEach((prof: any) => {
        authorMap.set(prof.id, {
          full_name: prof.full_name || "Instructeur inconnu",
          email: prof.email || "",
          avatar_url: prof.avatar_url || null,
        });
      });
    }

    // 3. Fetch all completed purchases to calculate real revenue per product
    const { data: purchasesData } = await supabaseAdmin
      .from("digital_product_purchases")
      .select("id, product_id, price_paid, payment_status, created_at")
      .eq("payment_status", "COMPLETED");

    const purchases = purchasesData || [];
    const purchasesByProduct = new Map<string, { count: number; revenue: number }>();

    purchases.forEach((pur) => {
      const existing = purchasesByProduct.get(pur.product_id) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += Number(pur.price_paid) || 0;
      purchasesByProduct.set(pur.product_id, existing);
    });

    // 4. Map products with author details and real financial metrics
    let totalPlatformRevenue = 0;
    let totalSalesCount = 0;

    const enrichedProducts = products.map((prod) => {
      const author = authorMap.get(prod.author_id) || {
        full_name: "Instructeur",
        email: "",
        avatar_url: null,
      };

      const purStats = purchasesByProduct.get(prod.id) || {
        count: prod.sales_count || 0,
        revenue: (prod.sales_count || 0) * (Number(prod.price) || 0),
      };

      totalPlatformRevenue += purStats.revenue;
      totalSalesCount += purStats.count;

      return {
        id: prod.id,
        author_id: prod.author_id,
        author,
        title: prod.title,
        description: prod.description,
        price: Number(prod.price) || 0,
        cover_image_url: prod.cover_image_url,
        file_name: prod.file_name,
        file_size_bytes: prod.file_size_bytes,
        status: (prod.status || "draft").toLowerCase(),
        category: prod.category || "E-book & Guide",
        sales_count: purStats.count,
        total_revenue: purStats.revenue,
        created_at: prod.created_at,
        updated_at: prod.updated_at,
      };
    });

    const publishedCount = enrichedProducts.filter((p) => p.status === "published").length;
    const draftCount = enrichedProducts.filter((p) => p.status === "draft").length;

    return NextResponse.json({
      products: enrichedProducts,
      stats: {
        totalProducts: enrichedProducts.length,
        publishedCount,
        draftCount,
        totalSalesCount,
        totalPlatformRevenue,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/admin/digital-products] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Identifiant et statut requis." }, { status: 400 });
    }

    const normalizedStatus = status.toLowerCase() === "published" ? "published" : "draft";

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("digital_products")
      .update({
        status: normalizedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    console.error("[PATCH /api/admin/digital-products] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Identifiant du produit manquant." }, { status: 400 });
    }

    const { error: delErr } = await supabaseAdmin
      .from("digital_products")
      .delete()
      .eq("id", id);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/admin/digital-products] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
