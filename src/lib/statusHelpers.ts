// src/lib/statusHelpers.ts

/**
 * Utility to normalize transaction and payout status strings.
 * The database currently stores French status literals (e.g., "Complété", "Échoué", "En attente").
 * The rest of the application expects the shared English enum values defined in `PaymentStatus`:
 *   "PAID", "FAILED", "PENDING".
 * This helper maps French strings to the enum values and passes through already normalized values.
 * It also provides a fallback returning the original string (cast) for unknown inputs.
 */
export type PaymentStatus = "PAID" | "FAILED" | "PENDING";

export function normalizeStatus(status: string): PaymentStatus {
  switch (status) {
    case "Complété":
    case "PAID":
      return "PAID";
    case "Échoué":
    case "FAILED":
      return "FAILED";
    case "En attente":
    case "PENDING":
      return "PENDING";
    default:
      // For any unexpected value, return as‑is cast to PaymentStatus – callers should handle it gracefully.
      return status as PaymentStatus;
  }
}
