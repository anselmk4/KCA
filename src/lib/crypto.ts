// ─── Web3 & Solana USDC Payment Configuration & Helpers ─────────────────────

export const SOLANA_TREASURY_ADDRESS =
  process.env.NEXT_PUBLIC_SOLANA_TREASURY_ADDRESS || "AnsLLa4kS6eT9wU2K7Jz3vX5Y8mP1Q9rN4uW6xY7zA8B";

export const USDC_SOLANA_MINT =
  process.env.NEXT_PUBLIC_USDC_SOLANA_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/**
 * Builds a valid Solana Pay URI according to the Solana Pay spec.
 * Format: solana:<recipient>?amount=<amount>&spl-token=<token_mint>&label=<label>&memo=<memo>
 */
export function getSolanaPayUri(params: {
  recipient?: string;
  amount: number;
  label?: string;
  memo?: string;
}): string {
  const recipient = params.recipient || SOLANA_TREASURY_ADDRESS;
  const label = encodeURIComponent(params.label || "Ansella Academy");
  const memo = encodeURIComponent(params.memo || "ANS-PAYMENT");
  const amountStr = params.amount.toFixed(2);

  return `solana:${recipient}?amount=${amountStr}&spl-token=${USDC_SOLANA_MINT}&label=${label}&memo=${memo}`;
}

/**
 * Generates QR code URL using QR Server API with custom size and styling.
 */
export function getSolanaQrCodeUrl(solanaUri: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&color=09090b&data=${encodeURIComponent(solanaUri)}`;
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
