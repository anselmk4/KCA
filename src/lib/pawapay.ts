import crypto from 'crypto';

export interface PawaPayOperator {
  id: string;
  name: string;
}

export interface PawaPayCountryConfig {
  countryCode: string; // ISO 2-letter
  countryCode3: string; // ISO 3-letter
  names: string[];
  currency: string;
  phonePrefix: string;
  exchangeRate: number; // 1 USD to local currency rate
  operators: PawaPayOperator[];
}

export const PAWAPAY_COUNTRY_MAPPING: PawaPayCountryConfig[] = [
  {
    countryCode: "CD",
    countryCode3: "COD",
    names: ["république démocratique du congo", "rd congo", "congo-kinshasa", "rdc", "democratic republic of congo", "dr congo", "congo, democratic republic of"],
    currency: "CDF",
    phonePrefix: "243",
    exchangeRate: 2800,
    operators: [
      { id: "VODACOM_MPESA_COD", name: "Vodacom M-Pesa" },
      { id: "AIRTEL_COD", name: "Airtel Money" },
      { id: "ORANGE_COD", name: "Orange Money" }
    ]
  },
  {
    countryCode: "RW",
    countryCode3: "RWA",
    names: ["rwanda", "république du rwanda", "republic of rwanda"],
    currency: "RWF",
    phonePrefix: "250",
    exchangeRate: 1300,
    operators: [
      { id: "MTN_RWA", name: "MTN Mobile Money" },
      { id: "AIRTEL_RWA", name: "Airtel Money" }
    ]
  },
  {
    countryCode: "UG",
    countryCode3: "UGA",
    names: ["ouganda", "uganda", "république d'ouganda", "republic of uganda"],
    currency: "UGX",
    phonePrefix: "256",
    exchangeRate: 3700,
    operators: [
      { id: "MTN_UGA", name: "MTN Mobile Money" },
      { id: "AIRTEL_UGA", name: "Airtel Money" }
    ]
  },
  {
    countryCode: "CM",
    countryCode3: "CMR",
    names: ["cameroun", "cameroon", "république du cameroun", "republic of cameroon"],
    currency: "XAF",
    phonePrefix: "237",
    exchangeRate: 600,
    operators: [
      { id: "MTN_CMR", name: "MTN Mobile Money" },
      { id: "ORANGE_CMR", name: "Orange Money" }
    ]
  },
  {
    countryCode: "SN",
    countryCode3: "SEN",
    names: ["sénégal", "senegal", "république du sénégal", "republic of senegal"],
    currency: "XOF",
    phonePrefix: "221",
    exchangeRate: 600,
    operators: [
      { id: "ORANGE_SEN", name: "Orange Money" },
      { id: "FREE_SEN", name: "Free Money" },
      { id: "WAVE_SEN", name: "Wave" }
    ]
  },
  {
    countryCode: "CI",
    countryCode3: "CIV",
    names: ["côte d'ivoire", "cote d'ivoire", "ivory coast", "république de côte d'ivoire"],
    currency: "XOF",
    phonePrefix: "225",
    exchangeRate: 600,
    operators: [
      { id: "MTN_CIV", name: "MTN Mobile Money" },
      { id: "ORANGE_CIV", name: "Orange Money" },
      { id: "MOOV_CIV", name: "Moov Money" },
      { id: "WAVE_CIV", name: "Wave" }
    ]
  }
];

/**
 * Find PawaPay configuration for a country based on country name, ISO2, or ISO3 code.
 */
export function getPawaPayConfigForCountry(countryNameOrCode: string): PawaPayCountryConfig | undefined {
  if (!countryNameOrCode) return undefined;
  
  const searchStr = countryNameOrCode.trim().toLowerCase();
  
  return PAWAPAY_COUNTRY_MAPPING.find(cfg => 
    cfg.countryCode.toLowerCase() === searchStr ||
    cfg.countryCode3.toLowerCase() === searchStr ||
    cfg.names.some(name => searchStr.includes(name) || name.includes(searchStr))
  );
}

/**
 * Format phone number to clean international format (no +, no leading 0) matching target prefix
 */
export function formatPawaPayPhoneNumber(phoneNumber: string, prefix: string): string {
  let clean = phoneNumber.replace(/\D/g, '');
  
  // If it already starts with prefix, return it
  if (clean.startsWith(prefix)) {
    return clean;
  }
  
  // If it starts with 0, strip the 0 and add prefix
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  
  return prefix + clean;
}

export interface InitiateDepositResponse {
  success: boolean;
  depositId: string;
  status?: string;
  error?: string;
}

/**
 * Request deposit via PawaPay Sandbox API
 */
export async function initiatePawaPayDeposit(params: {
  amount: number;
  currency: string;
  correspondent: string;
  phoneNumber: string;
  depositId?: string;
  statementDescription?: string;
}): Promise<InitiateDepositResponse> {
  const depositId = params.depositId || crypto.randomUUID();
  const apiKey = process.env.PAWAPAY_API_TOKEN || "pawapay_sandbox_placeholder_token_abc123";
  const isProduction = process.env.PAWAPAY_ENVIRONMENT === "production";
  const url = `${isProduction ? "https://api.pawapay.io" : "https://api.sandbox.pawapay.io"}/deposits`;

  const payload = {
    depositId: depositId,
    amount: Math.round(params.amount).toString(),
    currency: params.currency,
    correspondent: params.correspondent,
    payer: {
      type: "MSISDN",
      address: {
        value: params.phoneNumber
      }
    },
    customerTimestamp: new Date().toISOString(),
    statementDescription: params.statementDescription || "Ansella Academy"
  };

  console.log("[PawaPayService] Initiating deposit:", url, JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log("[PawaPayService] PawaPay API response status:", response.status, "body:", responseText);

    let data: any = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }

    if (!response.ok) {
      return {
        success: false,
        depositId,
        error: data.message || data.error || `HTTP ${response.status}: ${responseText}`
      };
    }

    if (data.status === "REJECTED") {
      return {
        success: false,
        depositId,
        error: data.rejectionReason?.rejectionMessage || "La transaction a été rejetée par PawaPay."
      };
    }

    // PawaPay standard success response indicates the request is accepted
    // and returns status (often PENDING, waiting for customer PIN)
    return {
      success: true,
      depositId,
      status: data.status || "ACCEPTED"
    };

  } catch (err: any) {
    console.error("[PawaPayService] Network error during request:", err);
    return {
      success: false,
      depositId,
      error: err.message || "Erreur réseau avec PawaPay"
    };
  }
}

export interface PawaPayDepositStatusResponse {
  success: boolean;
  depositId: string;
  status?: string;
  failureCode?: string;
  failureMessage?: string;
  error?: string;
}

/**
 * Fetch deposit status directly from PawaPay API (production or sandbox)
 */
export async function getPawaPayDepositStatus(depositId: string): Promise<PawaPayDepositStatusResponse> {
  const apiKey = process.env.PAWAPAY_API_TOKEN || "pawapay_sandbox_placeholder_token_abc123";
  const isProduction = process.env.PAWAPAY_ENVIRONMENT === "production";
  const url = `${isProduction ? "https://api.pawapay.io" : "https://api.sandbox.pawapay.io"}/deposits/${depositId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });

    const responseText = await response.text();
    console.log("[PawaPayService] PawaPay deposit status response:", response.status, "body:", responseText);

    if (!response.ok) {
      return {
        success: false,
        depositId,
        error: `HTTP ${response.status}: ${responseText}`
      };
    }

    let data: any = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {};
    }

    // PawaPay deposit status API can return an array of objects or a single object
    const depositObj = Array.isArray(data) ? data[0] : data;

    if (!depositObj) {
      return {
        success: false,
        depositId,
        error: "Aucune donnée de dépôt retournée par PawaPay."
      };
    }

    const status = depositObj.status;
    const failureCode = depositObj.failureCode?.failureCode || (typeof depositObj.failureCode === 'string' ? depositObj.failureCode : undefined) || depositObj.rejectionReason?.rejectionCode;
    const failureMessage = depositObj.failureCode?.failureMessage || depositObj.rejectionReason?.rejectionMessage;

    return {
      success: true,
      depositId,
      status: status || "PENDING",
      failureCode,
      failureMessage
    };

  } catch (err: any) {
    console.error("[PawaPayService] Network error during status check:", err);
    return {
      success: false,
      depositId,
      error: err.message || "Erreur réseau lors de la vérification PawaPay"
    };
  }
}


export interface InitiatePayoutResponse {
  success: boolean;
  payoutId: string;
  status?: string;
  error?: string;
}

/**
 * Request payout via PawaPay Sandbox API
 */
export async function initiatePawaPayPayout(params: {
  amount: number;
  currency: string;
  correspondent: string;
  phoneNumber: string;
  payoutId?: string;
  statementDescription?: string;
}): Promise<InitiatePayoutResponse> {
  const payoutId = params.payoutId || crypto.randomUUID();
  const apiKey = process.env.PAWAPAY_API_TOKEN || "pawapay_sandbox_placeholder_token_abc123";
  const isProduction = process.env.PAWAPAY_ENVIRONMENT === "production";
  const url = `${isProduction ? "https://api.pawapay.io" : "https://api.sandbox.pawapay.io"}/payouts`;

  const payload = {
    payoutId: payoutId,
    amount: Math.round(params.amount).toString(),
    currency: params.currency,
    correspondent: params.correspondent,
    recipient: {
      type: "MSISDN",
      address: {
        value: params.phoneNumber
      }
    },
    customerTimestamp: new Date().toISOString(),
    statementDescription: params.statementDescription || "Ansella Payout"
  };

  console.log("[PawaPayService] Initiating B2C Payout:", url, JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log("[PawaPayService] PawaPay Payout response status:", response.status, "body:", responseText);

    let data: any = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }

    if (!response.ok) {
      return {
        success: false,
        payoutId,
        error: data.message || data.error || `HTTP ${response.status}: ${responseText}`
      };
    }

    return {
      success: true,
      payoutId,
      status: data.status || "ACCEPTED"
    };

  } catch (err: any) {
    console.error("[PawaPayService] Network error during payout request:", err);
    return {
      success: false,
      payoutId,
      error: err.message || "Erreur réseau avec PawaPay"
    };
  }
}

export interface ResolvePayoutCarrierResult {
  correspondent: string;
  currency: string;
  exchangeRate: number;
  formattedPhone: string;
  error?: string;
}

/**
 * Automatically resolve operator, currency, conversion rate, and clean phone number for PawaPay
 */
export function resolvePawaPayCorrespondent(carrier: string, phoneNumber: string): ResolvePayoutCarrierResult {
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  
  // Find matching country by phone prefix
  const countryConfig = PAWAPAY_COUNTRY_MAPPING.find(cfg => cleanPhone.startsWith(cfg.phonePrefix));
  if (!countryConfig) {
    return {
      correspondent: "",
      currency: "",
      exchangeRate: 1,
      formattedPhone: cleanPhone,
      error: `Le préfixe du numéro de téléphone (+${cleanPhone.substring(0, 3)}...) n'est pas géré par PawaPay.`
    };
  }

  // Find operator matching the carrier name
  const carrierLower = carrier.toLowerCase();
  const operator = countryConfig.operators.find(op => {
    const opName = op.name.toLowerCase();
    const opId = op.id.toLowerCase();
    return opId.includes(carrierLower) || opName.includes(carrierLower);
  }) || countryConfig.operators[0]; // Fallback to first operator if not explicitly matched

  return {
    correspondent: operator.id,
    currency: countryConfig.currency,
    exchangeRate: countryConfig.exchangeRate,
    formattedPhone: cleanPhone
  };
}
