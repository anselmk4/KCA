import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

export interface WatermarkBuyerInfo {
  buyerName?: string;
  buyerEmail: string;
  buyerPhone?: string;
  orderId?: string;
  purchaseDate?: string;
}

/**
 * Applique un filigrane numérique dynamique et personnalisé sur chaque page d'un PDF.
 * Ce filigrane inclut le nom, l'email et la référence de l'acheteur pour dissuader
 * psychologiquement et juridiquement toute diffusion ou fuite du document.
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
    const diagonalText = `LICENCE : ${cleanEmail} • Ansella`;

    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      // 1. Filigrane diagonal semi-transparent au centre de la page (ultra-discret)
      const diagonalFontSize = Math.min(22, Math.max(13, width / 28));
      const diagonalWidth = fontBold.widthOfTextAtSize(diagonalText, diagonalFontSize);

      page.drawText(diagonalText, {
        x: Math.max(15, (width - diagonalWidth) / 2),
        y: height / 2 - 10,
        size: diagonalFontSize,
        font: fontBold,
        color: rgb(0.85, 0.22, 0.22),
        opacity: 0.06, // Ultra-discret, n'altère pas la lisibilité du document
        rotate: degrees(35),
      });

      // 2. Ligne de démarcation inférieure compacte
      page.drawLine({
        start: { x: 20, y: 19 },
        end: { x: width - 20, y: 19 },
        thickness: 0.35,
        color: rgb(0.82, 0.2, 0.2),
        opacity: 0.35,
      });

      // 3. Mention de licence compacte avec identité de l'acheteur
      const maxAvailableWidth = width - 40;
      let printLine1 = footerLine1;
      if (fontBold.widthOfTextAtSize(printLine1, 5.8) > maxAvailableWidth) {
        printLine1 = `Certifié pour : ${cleanEmail}${orderRef}`;
      }

      page.drawText(printLine1, {
        x: 20,
        y: 12.5,
        size: 5.8,
        font: fontBold,
        color: rgb(0.72, 0.12, 0.12),
        opacity: 0.92,
      });

      // 4. Avertissement légal + pagination ultra-compacte
      const pageStr = `Page ${i + 1} / ${totalPages}`;
      const pageStrWidth = font.widthOfTextAtSize(pageStr, 5.2);

      page.drawText(footerLine2, {
        x: 20,
        y: 6,
        size: 5.2,
        font: font,
        color: rgb(0.45, 0.45, 0.45),
        opacity: 0.85,
      });

      page.drawText(pageStr, {
        x: width - 20 - pageStrWidth,
        y: 6,
        size: 5.2,
        font: font,
        color: rgb(0.45, 0.45, 0.45),
        opacity: 0.85,
      });
    }

    // Métadonnées du PDF
    pdfDoc.setAuthor("Ansella Platform");
    pdfDoc.setSubject(`Exemplaire certifié et attribué à ${cleanEmail}`);
    pdfDoc.setProducer("Ansella Secure Dynamic Watermarking Engine");
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
