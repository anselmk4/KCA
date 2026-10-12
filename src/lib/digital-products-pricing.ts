/**
 * RÈGLE TARIFAIRE ANSELLA PRODUITS DIGITAUX :
 * - E-books & Guides PDF : Plafonnés à 25.00 $ USD max.
 * - Logiciels & Scripts (ZIP / Code) : Prix Libre (décidé par le formateur).
 * - Modèles & Templates (Notion, Figma, Excel) : Prix Libre.
 * - Packs de Prompts & Datasets IA : Prix Libre.
 * - Toute autre ressource logicielle / outillage : Prix Libre.
 */

export const MAX_EBOOK_PRICE = 25.0;

/**
 * Détecte si le produit digital est un E-book ou un guide PDF
 */
export function isEbookOrPdfCategory(category?: string, fileName?: string): boolean {
  const cat = (category || "").toLowerCase().trim();
  const file = (fileName || "").toLowerCase().trim();

  // 1. Détection par catégorie explicite
  if (
    cat.includes("ebook") ||
    cat.includes("e-book") ||
    cat.includes("pdf") ||
    cat.includes("livre") ||
    cat.includes("guide pdf") ||
    cat === "e-books & guides pdf"
  ) {
    return true;
  }

  // 2. Détection par extension de fichier de lecture
  if (
    file.endsWith(".pdf") ||
    file.endsWith(".epub") ||
    file.endsWith(".mobi")
  ) {
    return true;
  }

  return false;
}

/**
 * Valide le prix d'un produit digital selon sa nature
 */
export function validateDigitalProductPrice(
  price: number,
  category?: string,
  fileName?: string
): { isValid: boolean; error?: string; isCapped: boolean; maxPrice?: number } {
  if (isNaN(price) || price < 0) {
    return {
      isValid: false,
      error: "Le prix doit être un nombre positif ou égal à 0.",
      isCapped: false,
    };
  }

  const isCapped = isEbookOrPdfCategory(category, fileName);

  if (isCapped && price > MAX_EBOOK_PRICE) {
    return {
      isValid: false,
      isCapped: true,
      maxPrice: MAX_EBOOK_PRICE,
      error: `RÈGLE TARIFAIRE : Seuls les E-books et Guides PDF sont plafonnés à ${MAX_EBOOK_PRICE.toFixed(
        2
      )} $ USD max. Votre prix ($${price.toFixed(
        2
      )}) dépasse ce plafond. Pour les logiciels, scripts et templates, vous êtes libre de fixer le prix voulu.`,
    };
  }

  return { isValid: true, isCapped, maxPrice: isCapped ? MAX_EBOOK_PRICE : undefined };
}
