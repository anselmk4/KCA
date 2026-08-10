// ─── Bitcoin (BTC) Payment Configuration & Helpers ─────────────────────

export const BITCOIN_TREASURY_ADDRESS =
  process.env.NEXT_PUBLIC_BITCOIN_TREASURY_ADDRESS || "bc1qj0d2yzxn484ktnfgqw79hfddaurvkrxf99wzaf";

/**
 * Builds a valid Bitcoin BIP21 URI.
 * Format: bitcoin:<address>?amount=<amount>&label=<label>&message=<message>
 */
export function getBip21BitcoinUri(params: {
  address?: string;
  amountBtc: number;
  label?: string;
  message?: string;
}): string {
  const address = params.address || BITCOIN_TREASURY_ADDRESS;
  const numAmount = Number(params.amountBtc) || 0;
  
  const searchParams = new URLSearchParams();
  if (numAmount > 0) {
    searchParams.set("amount", numAmount.toFixed(8));
  }
  if (params.label) searchParams.set("label", params.label);
  if (params.message) searchParams.set("message", params.message);

  const queryString = searchParams.toString();
  return `bitcoin:${address}${queryString ? `?${queryString}` : ""}`;
}

/**
 * Generates a high-quality vector QR Code URL for Bitcoin URIs.
 * Uses QuickChart API with standard error correction.
 */
export function getBitcoinQrCodeUrl(rawText: string, size = 260): string {
  const encodedText = encodeURIComponent(rawText);
  return `https://quickchart.io/qr?text=${encodedText}&size=${size}&margin=1&ecLevel=M`;
}

/**
 * Fetches the current live Bitcoin spot price in USD.
 * Queries Coinbase API with fallback to Mempool.space API.
 */
export async function fetchBtcPriceInUsd(): Promise<number> {
  try {
    const res = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", {
      next: { revalidate: 60 }
    });
    if (res.ok) {
      const data = await res.json();
      const amount = parseFloat(data?.data?.amount);
      if (amount && amount > 0) return amount;
    }
  } catch (err) {
    console.warn("[bitcoin.ts] Coinbase price fetch failed, trying mempool.space fallback...", err);
  }

  try {
    const res = await fetch("https://mempool.space/api/v1/prices", {
      next: { revalidate: 60 }
    });
    if (res.ok) {
      const data = await res.json();
      const usdPrice = parseFloat(data?.USD);
      if (usdPrice && usdPrice > 0) return usdPrice;
    }
  } catch (err) {
    console.warn("[bitcoin.ts] Mempool price fetch failed:", err);
  }

  // Safe fallback estimated BTC price if external APIs are unreachable
  return 65000;
}

/**
 * Converts a USD amount to BTC based on the current BTC/USD rate.
 */
export function convertUsdToBtc(usdAmount: number, btcPriceInUsd: number): number {
  if (!usdAmount || !btcPriceInUsd || btcPriceInUsd <= 0) return 0;
  const btc = usdAmount / btcPriceInUsd;
  return parseFloat(btc.toFixed(8));
}
