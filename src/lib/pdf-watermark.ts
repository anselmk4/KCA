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

    const footerLine1 = `Document certifié et sous licence exclusive pour : ${recipientString}${phoneRef}${orderRef}`;
    const footerLine2 = `Acheté le ${formattedDate} sur KCA. Reproduction, revente ou diffusion non autorisée strictement interdite (Art. L.335-2 CPI).`;
    const diagonalText = `LICENCE : ${cleanEmail} • KCA`;

    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      // 1. Filigrane diagonal semi-transparent au centre de la page
      const diagonalFontSize = Math.min(24, Math.max(14, width / 26));
      const diagonalWidth = fontBold.widthOfTextAtSize(diagonalText, diagonalFontSize);

      page.drawText(diagonalText, {
        x: Math.max(20, (width - diagonalWidth) / 2),
        y: height / 2 - 10,
        size: diagonalFontSize,
        font: fontBold,
        color: rgb(0.85, 0.22, 0.22),
        opacity: 0.08, // Très discret, n'altère pas la lisibilité du cours/livre
        rotate: degrees(35),
      });

      // 2. Ligne de démarcation inférieure discrète
      page.drawLine({
        start: { x: 25, y: 36 },
        end: { x: width - 25, y: 36 },
        thickness: 0.5,
        color: rgb(0.82, 0.2, 0.2),
        opacity: 0.5,
      });

      // 3. Mention de licence avec identité de l'acheteur
      page.drawText(footerLine1, {
        x: 25,
        y: 25,
        size: 7,
        font: fontBold,
        color: rgb(0.72, 0.12, 0.12),
        opacity: 0.95,
      });

      // 4. Avertissement légal + pagination
      const pageStr = `Page ${i + 1} / ${totalPages}`;
      const pageStrWidth = font.widthOfTextAtSize(pageStr, 6.5);

      page.drawText(footerLine2, {
        x: 25,
        y: 15,
        size: 6.5,
        font: font,
        color: rgb(0.42, 0.42, 0.42),
        opacity: 0.85,
      });

      page.drawText(pageStr, {
        x: width - 25 - pageStrWidth,
        y: 15,
        size: 6.5,
        font: font,
        color: rgb(0.42, 0.42, 0.42),
        opacity: 0.85,
      });
    }

    // Métadonnées du PDF
    pdfDoc.setAuthor("KCA Digital Platform");
    pdfDoc.setSubject(`Exemplaire certifié et attribué à ${cleanEmail}`);
    pdfDoc.setProducer("KCA Secure Dynamic Watermarking Engine");
    if (info.orderId) {
      pdfDoc.setKeywords(["KCA", "Licence", cleanEmail, info.orderId]);
    }

    return await pdfDoc.save();
  } catch (err) {
    console.error("[applyDynamicWatermark] Erreur lors du marquage du PDF:", err);
    // En cas d'exception sur un PDF exotique ou protégé, renvoyer le buffer d'origine sans bloquer le téléchargement
    return pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);
  }
}
