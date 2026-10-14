import crypto from "crypto";

const TOKEN_SECRET =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXTAUTH_SECRET ||
  process.env.PAWAPAY_API_TOKEN ||
  "ansella_digital_product_secret_key_2026";

export interface DownloadTokenPayload {
  productId: string;
  purchaseId: string;
  buyerIdentifier: string; // userId or email
  expiresAt: number; // Unix timestamp in ms
  nonce: string;
}

/**
 * Génère un jeton cryptographique HMAC-SHA256 à usage sécurisé et durée limitée
 * pour le téléchargement d'un produit numérique.
 */
export function generateDigitalProductToken(
  productId: string,
  purchaseId: string,
  buyerIdentifier: string,
  expiresInHours: number = 48
): string {
  const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;
  const nonce = crypto.randomBytes(8).toString("hex");

  const rawData = `${productId}:${purchaseId}:${buyerIdentifier}:${expiresAt}:${nonce}`;
  const hmac = crypto.createHmac("sha256", TOKEN_SECRET);
  hmac.update(rawData);
  const signature = hmac.digest("hex");

  const payload: DownloadTokenPayload = {
    productId,
    purchaseId,
    buyerIdentifier,
    expiresAt,
    nonce,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${signature}`;
}

/**
 * Vérifie l'authenticité et l'expiration d'un jeton de téléchargement
 */
export function verifyDigitalProductToken(
  token: string,
  expectedProductId?: string
): { valid: boolean; payload?: DownloadTokenPayload; error?: string } {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Jeton de téléchargement manquant." };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Format de jeton invalide." };
  }

  const [encodedPayload, signature] = parts;

  try {
    const payloadStr = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const payload: DownloadTokenPayload = JSON.parse(payloadStr);

    const rawData = `${payload.productId}:${payload.purchaseId}:${payload.buyerIdentifier}:${payload.expiresAt}:${payload.nonce}`;
    const hmac = crypto.createHmac("sha256", TOKEN_SECRET);
    hmac.update(rawData);
    const expectedSignature = hmac.digest("hex");

    // Comparaison en temps constant pour contrer les attaques temporelles (timing attacks)
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return { valid: false, error: "Signature de sécurité invalide ou jeton corrompu." };
    }

    if (Date.now() > payload.expiresAt) {
      return {
        valid: false,
        error: "Ce lien de téléchargement a expiré. Veuillez utiliser votre espace d'achat ou votre reçu.",
      };
    }

    if (expectedProductId && payload.productId !== expectedProductId) {
      return {
        valid: false,
        error: "Ce jeton n'appartient pas à cette ressource numérique.",
      };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: "Erreur de décodage du jeton de sécurité." };
  }
}
