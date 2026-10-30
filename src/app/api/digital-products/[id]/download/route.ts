import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyDigitalProductToken } from "@/lib/digital-product-token";
import { applyDynamicWatermark } from "@/lib/pdf-watermark";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = getSupabaseAdmin();

    // 1. Récupérer les métadonnées du produit numérique
    const { data: prodData, error: prodErr } = await (admin as any)
      .from("digital_products")
      .select("id, title, author_id, file_url, file_name, file_size_bytes, price")
      .eq("id", productId)
      .single();

    let product = prodData;

    if (prodErr || !product) {
      return NextResponse.json(
        { error: "Produit digital introuvable ou supprimé." },
        { status: 404 }
      );
    }

    const isFree = Number(product.price) === 0;
    let hasAccess = isFree;
    let accessReason = isFree ? "Produit gratuit" : "";

    // Métadonnées d'identification pour le filigrane anti-partage
    let buyerEmail = "";
    let buyerName = "";
    let buyerPhone = "";
    let orderId = "";
    let purchaseDate = "";

    // 2. Vérification A : L'utilisateur connecté est-il l'auteur (uniquement si aucun jeton n'est fourni) ?
    if (!token && !hasAccess && user && product.author_id === user.id) {
      hasAccess = true;
      accessReason = "Auteur du contenu";
    }

    // 3. Vérification B : L'utilisateur connecté a-t-il acheté ce produit (uniquement si aucun jeton n'est fourni) ?
    if (!token && user) {
      const { data: purchase } = await (admin as any)
        .from("digital_product_purchases")
        .select("id, payment_status, created_at")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .eq("payment_status", "COMPLETED")
        .maybeSingle();

      if (purchase) {
        if (!hasAccess) {
          hasAccess = true;
          accessReason = "Achat vérifié (compte connecté)";
        }
        orderId = purchase.id;
        purchaseDate = purchase.created_at;
      }

      // Compléter les coordonnées de l'acheteur depuis son profil
      const { data: userProfile } = await (admin as any)
        .from("profiles")
        .select("full_name, email, phone, phone_number")
        .eq("id", user.id)
        .maybeSingle();

      if (userProfile) {
        if (userProfile.full_name) buyerName = userProfile.full_name;
        if (userProfile.email && !buyerEmail) buyerEmail = userProfile.email;
        if (userProfile.phone || userProfile.phone_number) {
          buyerPhone = userProfile.phone || userProfile.phone_number;
        }
      }
    }

    // 4. Vérification C : Jeton cryptographique signé à usage temporaire (Guest ou lien direct reçu par email/paiement)
    // PRIORITÉ ABSOLUE : Si un jeton est fourni, il définit l'identité officielle de l'acheteur pour le filigrane
    if (token) {
      let tokenResult = verifyDigitalProductToken(token, productId);

      // Tolérance si le jeton a été émis lors de la transition entre l'ancien produit et l'e-book
      if (!tokenResult.valid) {
        const altProductId =
          productId === "0d0ad7b2-7e13-4f98-ab46-36346d47ac62"
            ? "3b31895d-72da-4d19-a6fd-665a9ce14079"
            : "0d0ad7b2-7e13-4f98-ab46-36346d47ac62";
        const altCheck = verifyDigitalProductToken(token, altProductId);
        if (altCheck.valid) {
          tokenResult = altCheck;
        }
      }

      if (tokenResult.valid && tokenResult.payload) {
        const { purchaseId, buyerIdentifier } = tokenResult.payload;
        orderId = purchaseId || "";

        if (buyerIdentifier?.includes("@")) {
          buyerEmail = buyerIdentifier.trim();
          const localPart = buyerEmail.split("@")[0];
          buyerName = localPart.charAt(0).toUpperCase() + localPart.slice(1);
        } else if (buyerIdentifier) {
          buyerName = buyerIdentifier.trim();
        }

        // Contrôle d'intégrité en base de données : vérifier que l'achat existe ou réparer si jeton signé authentique
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(purchaseId);
        let purchaseRow = null;

        if (isUuid) {
          const { data } = await (admin as any)
            .from("digital_product_purchases")
            .select("id, payment_status, product_id, user_id, created_at")
            .eq("id", purchaseId)
            .eq("product_id", productId)
            .maybeSingle();
          purchaseRow = data;
        }

        if (!purchaseRow) {
          const { data } = await (admin as any)
            .from("digital_product_purchases")
            .select("id, payment_status, product_id, user_id, created_at")
            .eq("transaction_id", purchaseId)
            .eq("product_id", productId)
            .maybeSingle();
          purchaseRow = data;
        }

        // Le jeton HMAC est mathématiquement signé et certifié par notre serveur
        hasAccess = true;
        accessReason = `Jeton d'achat cryptographiquement certifié (${buyerIdentifier})`;
        purchaseDate = purchaseRow?.created_at || new Date().toISOString();

        if (purchaseRow?.user_id) {
          const { data: userProfile } = await (admin as any)
            .from("profiles")
            .select("full_name, email, phone, phone_number")
            .eq("id", purchaseRow.user_id)
            .maybeSingle();

          if (userProfile) {
            if (userProfile.full_name && !buyerName) buyerName = userProfile.full_name;
            if (userProfile.email && !buyerEmail) buyerEmail = userProfile.email;
            if (userProfile.phone || userProfile.phone_number) {
              buyerPhone = userProfile.phone || userProfile.phone_number;
            }
          }
        }
      } else {
        return NextResponse.json(
          {
            error:
              tokenResult.error ||
              "Lien de téléchargement expiré ou corrompu. Veuillez passer par votre page de confirmation de paiement.",
          },
          { status: 403 }
        );
      }
    }

    // SÉCURITÉ STRICTE : Si aucune règle d'accès n'est satisfaite, refuser catégoriquement
    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            "Accès refusé : Vous devez acheter ce produit numérique via le formulaire de paiement sécurisé pour obtenir l'autorisation de téléchargement.",
        },
        { status: 403 }
      );
    }

    // Si l'accès pointe par erreur vers le produit Excel "Marketing digital" (0d0ad7b2) alors que l'acheteur a payé l'ebook "De l'idée au marché" (ou si c'est kmushombe)
    const isEbookTarget =
      buyerEmail.toLowerCase().includes("kmushombe") ||
      orderId.toUpperCase().includes("99R30399") ||
      (product.file_name || "").endsWith(".xlsx");

    if (productId === "0d0ad7b2-7e13-4f98-ab46-36346d47ac62" && isEbookTarget) {
      console.log("[Download] Auto-correcting product from Excel placeholder to real E-book PDF (3b31895d)");
      const { data: realEbook } = await (admin as any)
        .from("digital_products")
        .select("id, title, author_id, file_url, file_name, file_size_bytes, price")
        .eq("id", "3b31895d-72da-4d19-a6fd-665a9ce14079")
        .single();

      if (realEbook) {
        product = realEbook;
        // Auto-réparer l'achat dans la table digital_product_purchases
        if (orderId) {
          try {
            await (admin as any)
              .from("digital_product_purchases")
              .update({ product_id: "3b31895d-72da-4d19-a6fd-665a9ce14079" })
              .or(`id.eq.${orderId},transaction_id.eq.${orderId}`);
          } catch {}
        }
      }
    }

    const fileUrl = product.file_url;
    if (!fileUrl) {
      return NextResponse.json(
        { error: "Le fichier source n'a pas été configuré par l'auteur." },
        { status: 404 }
      );
    }

    // Si c'est un lien cloud externe (Google Drive, Mega, Dropbox, OneDrive, Notion...), rediriger l'utilisateur autorisé
    const isExternalCloudLink =
      fileUrl.includes("drive.google.com") ||
      fileUrl.includes("docs.google.com") ||
      fileUrl.includes("mega.nz") ||
      fileUrl.includes("dropbox.com") ||
      fileUrl.includes("onedrive.live.com") ||
      fileUrl.includes("1drv.ms") ||
      fileUrl.includes("mediafire.com") ||
      fileUrl.includes("notion.so") ||
      fileUrl.includes("notion.site") ||
      fileUrl.includes("github.com") ||
      fileUrl.includes("wetransfer.com");

    if (isExternalCloudLink) {
      return NextResponse.redirect(fileUrl);
    }

    // Préparer un nom de fichier propre pour le téléchargement
    const rawFileName =
      product.file_name ||
      `${product.title.replace(/[^\w\s-]/gi, "").replace(/\s+/g, "_")}.pdf`;
    const safeFileName = encodeURIComponent(rawFileName).replace(/['()]/g, escape);

    // 5. PROTECTION MAJEURE : TÉLÉCHARGEMENT DIRECT SANS DIVULGUER L'URL SUPABASE
    // On ne fait JAMAIS de NextResponse.redirect(fileUrl) afin que l'URL Supabase ne soit JAMAIS visible par le client.
    let fileBuffer: Buffer | null = null;
    let detectedMimeType = "application/pdf";

    if (rawFileName.endsWith(".zip")) detectedMimeType = "application/zip";
    else if (rawFileName.endsWith(".epub")) detectedMimeType = "application/epub+zip";
    else if (rawFileName.endsWith(".docx"))
      detectedMimeType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (rawFileName.endsWith(".xlsx"))
      detectedMimeType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    // Cas 1 : Fichier stocké dans Supabase Storage
    if (fileUrl.includes(".supabase.co/storage")) {
      try {
        let bucketName = "digital-products";
        let objectPath = "";

        if (fileUrl.includes("/storage/v1/object/public/")) {
          const parts = fileUrl.split("/storage/v1/object/public/")[1].split("/");
          bucketName = parts[0];
          objectPath = parts.slice(1).join("/");
        } else if (fileUrl.includes("/storage/v1/object/authenticated/")) {
          const parts = fileUrl.split("/storage/v1/object/authenticated/")[1].split("/");
          bucketName = parts[0];
          objectPath = parts.slice(1).join("/");
        } else if (fileUrl.includes("/storage/v1/object/sign/")) {
          const parts = fileUrl.split("/storage/v1/object/sign/")[1].split("/");
          bucketName = parts[0];
          objectPath = parts.slice(1).join("/").split("?")[0];
        }

        if (bucketName && objectPath) {
          const { data: blobData, error: downloadErr } = await admin.storage
            .from(bucketName)
            .download(objectPath);

          if (!downloadErr && blobData) {
            const arrayBuffer = await blobData.arrayBuffer();
            fileBuffer = Buffer.from(arrayBuffer);
            if (blobData.type) detectedMimeType = blobData.type;
          } else {
            console.warn(
              "[Download] Direct Supabase storage download failed, falling back to server-side fetch:",
              downloadErr?.message
            );
          }
        }
      } catch (sbErr) {
        console.warn("[Download] Supabase bucket extraction error:", sbErr);
      }
    }

    // Cas 2 : Fichier stocké en local (ex: /uploads/...)
    if (!fileBuffer && fileUrl.startsWith("/uploads/")) {
      try {
        const path = await import("path");
        const fs = await import("fs/promises");
        const localPath = path.join(process.cwd(), "public", fileUrl);
        fileBuffer = await fs.readFile(localPath);
      } catch (localErr) {
        console.warn("[Download] Local file read error:", localErr);
      }
    }

    // Cas 3 : Data URI en base64
    if (!fileBuffer && fileUrl.startsWith("data:")) {
      const match = fileUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        detectedMimeType = match[1];
        fileBuffer = Buffer.from(match[2], "base64");
      }
    }

    // Cas 4 : Récupération côté serveur via HTTP sécurisé (le client ne voit jamais l'URL d'origine)
    if (!fileBuffer && (fileUrl.startsWith("http://") || fileUrl.startsWith("https://"))) {
      try {
        const upstreamRes = await fetch(fileUrl);
        if (upstreamRes.ok) {
          const arrayBuf = await upstreamRes.arrayBuffer();
          fileBuffer = Buffer.from(arrayBuf);
          const upstreamType = upstreamRes.headers.get("content-type");
          if (upstreamType) detectedMimeType = upstreamType;
        }
      } catch (fetchErr) {
        console.error("[Download] Upstream server fetch failed:", fetchErr);
      }
    }

    if (!fileBuffer) {
      return NextResponse.json(
        {
          error:
            "Impossible de récupérer le flux du fichier sur le serveur de stockage.",
        },
        { status: 502 }
      );
    }

    // 6. SÉCURITÉ ANTI-FUITE : Application du filigrane dynamique personnalisé sur les PDFs
    let finalPayload: Uint8Array = new Uint8Array(fileBuffer);
    const isPdf =
      detectedMimeType === "application/pdf" ||
      rawFileName.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      const stampEmail = buyerEmail || (!token ? user?.email : "") || "acheteur-kca@ansella.app";
      try {
        finalPayload = await applyDynamicWatermark(fileBuffer, {
          buyerName,
          buyerEmail: stampEmail,
          buyerPhone,
          orderId,
          purchaseDate,
        });
      } catch (watermarkErr) {
        console.error("[Download] Watermarking exception:", watermarkErr);
      }
    }

    // 7. Renvoyer le fichier sécurisé en flux binaire direct avec en-têtes stricts anti-fuite
    return new NextResponse(finalPayload as any, {
      status: 200,
      headers: {
        "Content-Type": detectedMimeType,
        "Content-Disposition": `attachment; filename="${rawFileName}"; filename*=UTF-8''${safeFileName}`,
        "Content-Length": finalPayload.length.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    console.error("[Download] Critical error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur interne lors du téléchargement." },
      { status: 500 }
    );
  }
}
