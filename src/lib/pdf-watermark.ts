import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface WatermarkBuyerInfo {
  buyerName?: string;
  buyerEmail: string;
  buyerPhone?: string;
  orderId?: string;
  purchaseDate?: string;
}

/**
 * Applique un marquage numérique certifié et discret en bas de page d'un PDF (e-book, guide).
 * Garantit une traçabilité légale et personnelle tout en préservant à 100% la mise en page,
 * la présentation d'origine et le confort de lecture de l'utilisateur.
 */
export async function applyDynamicWatermark(
  pdfBuffer: Buffer | Uint8Array,
  info: WatermarkBuyerInfo
): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    const formattedDate =
      info.purchaseDate ||
      new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

    const cleanEmail = (info.buyerEmail || "").trim();
    const cleanName = (info.buyerName || "").trim();
    const displayName = cleanName && cleanName.toLowerCase() !== "utilisateur" ? cleanName : "";

    const recipientString = displayName ? `${displayName} (${cleanEmail})` : cleanEmail;
    const orderRef = info.orderId ? ` • Réf : #${info.orderId.slice(0, 8).toUpperCase()}` : "";
    const phoneRef = info.buyerPhone ? ` • Tél : ${info.buyerPhone}` : "";

    const footerLine1 = `Certifié pour : ${recipientString}${phoneRef}${orderRef}`;
    const footerLine2 = `Ansella (${formattedDate}) • Diffusion ou revente interdite (Art. 360 Numérique RDC & Art. L.335-2 CPI)`;

    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const { width } = page.getSize();

      // Note : Tout filigrane diagonal barrant le texte au centre de la page est délibérément
      // proscrit afin d'éviter tout conflit de rendu (opacité non gérée sur lecteurs mobiles / Android)
      // et garantir une lisibilité fluide et impeccable pour les lecteurs.

      // 1. Ligne de démarcation inférieure discrète et élégante (teinte neutre)
      page.drawLine({
        start: { x: 24, y: 20 },
        end: { x: width - 24, y: 20 },
        thickness: 0.4,
        color: rgb(0.82, 0.84, 0.87),
      });

      // 2. Mention de licence avec identité de l'acheteur (bas de page, zone de marge sécurisée)
      const maxAvailableWidth = width - 48;
      let printLine1 = footerLine1;
      if (fontBold.widthOfTextAtSize(printLine1, 5.6) > maxAvailableWidth) {
        printLine1 = `Certifié pour : ${cleanEmail}${orderRef}`;
      }
      if (fontBold.widthOfTextAtSize(printLine1, 5.6) > maxAvailableWidth) {
        printLine1 = `Certifié pour : ${cleanEmail}`;
      }

      page.drawText(printLine1, {
        x: 24,
        y: 12.5,
        size: 5.6,
        font: fontBold,
        color: rgb(0.38, 0.42, 0.48), // Gris ardoise sobre et professionnel
      });

      // 3. Avertissement légal + pagination ultra-compacte
      const pageStr = `Page ${i + 1} / ${totalPages}`;
      const pageStrWidth = font.widthOfTextAtSize(pageStr, 5.0);

      page.drawText(footerLine2, {
        x: 24,
        y: 6,
        size: 5.0,
        font: font,
        color: rgb(0.55, 0.58, 0.62), // Gris clair neutre
      });

      page.drawText(pageStr, {
        x: width - 24 - pageStrWidth,
        y: 6,
        size: 5.0,
        font: font,
        color: rgb(0.55, 0.58, 0.62),
      });
    }

    // Métadonnées du PDF (traçabilité invisible dans le document)
    pdfDoc.setAuthor("Ansella Platform");
    pdfDoc.setSubject(`Exemplaire certifié et attribué à ${cleanEmail}`);
    pdfDoc.setProducer("Ansella Secure Watermarking Engine");
    if (info.orderId) {
      pdfDoc.setKeywords(["Ansella", "Licence", cleanEmail, info.orderId]);
    }

    return await pdfDoc.save();
  } catch (err) {
    console.error("[applyDynamicWatermark] Erreur lors du marquage du PDF:", err);
    // En cas d'exception sur un PDF exotique ou protégé, renvoyer le buffer d'origine sans bloquer le téléchargement
    return pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);
  }
}
