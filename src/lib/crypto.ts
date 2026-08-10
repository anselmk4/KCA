// ─── Web3 & Solana USDC Payment Configuration & Helpers ─────────────────────

export const SOLANA_TREASURY_ADDRESS =
  process.env.NEXT_PUBLIC_SOLANA_TREASURY_ADDRESS || "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

export const USDC_SOLANA_MINT =
  process.env.NEXT_PUBLIC_USDC_SOLANA_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/**
 * Builds a valid Solana Pay URI according to the Solana Pay specification.
 * Format: solana:<recipient>?amount=<amount>&spl-token=<token_mint>&label=<label>&memo=<memo>
 */
export function getSolanaPayUri(params: {
  recipient?: string;
  amount: number;
  label?: string;
  memo?: string;
}): string {
  const recipient = params.recipient || SOLANA_TREASURY_ADDRESS;
  const numAmount = Number(params.amount) || 0;
  const amountStr = numAmount % 1 === 0 ? numAmount.toString() : numAmount.toFixed(2);

  const searchParams = new URLSearchParams();
  if (amountStr && amountStr !== "0") searchParams.set("amount", amountStr);
  if (USDC_SOLANA_MINT) searchParams.set("spl-token", USDC_SOLANA_MINT);
  if (params.label) searchParams.set("label", params.label || "Ansella Academy");
  if (params.memo) searchParams.set("memo", params.memo || "ANS-PAYMENT");

  const queryString = searchParams.toString();
  return `solana:${recipient}${queryString ? `?${queryString}` : ""}`;
}

/**
 * Generates an ultra-crisp, reliable QR code URL.
 * Uses QuickChart QR API for vector-crisp rendering without rate-limits.
 */
export function getSolanaQrCodeUrl(rawText: string, size = 250): string {
  const encodedText = encodeURIComponent(rawText);
  return `https://quickchart.io/qr?text=${encodedText}&size=${size}&margin=1&ecLevel=M`;
}

/**
 * Fallback QR Code URL generator using API.QRServer.
 */
export function getBackupQrCodeUrl(rawText: string, size = 250): string {
  const encodedText = encodeURIComponent(rawText);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&color=09090b&data=${encodedText}`;
}

/**
 * Helper to check if a Phantom or Solana browser wallet is installed.
 */
export function isSolanaWalletInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const win = window as any;
  return Boolean(win.solana?.isPhantom || win.solflare || win.solana);
}

/**
 * Connect to user's Solana wallet (Phantom, Solflare, etc.) and return public key string.
 */
export async function connectSolanaWallet(): Promise<string> {
  if (typeof window === "undefined") throw new Error("Navigateur non disponible");
  const win = window as any;
  const wallet = win.solana || win.solflare;

  if (!wallet) {
    throw new Error("Aucun portefeuille Solana (Phantom, Solflare) détecté. Veuillez installer l'extension Phantom ou scanner le QR Code.");
  }

  const response = await wallet.connect();
  const publicKey = response?.publicKey?.toString() || wallet.publicKey?.toString();
  if (!publicKey) throw new Error("Impossible de récupérer la clé publique du portefeuille.");
  return publicKey;
}
