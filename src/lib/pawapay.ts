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
      { id: "MTN_MOMO_RWA", name: "MTN Mobile Money" },
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
      { id: "MTN_MOMO_UGA", name: "MTN Mobile Money" },
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
      { id: "MTN_MOMO_CMR", name: "MTN Mobile Money" },
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
      { id: "MTN_MOMO_CIV", name: "MTN Mobile Money" },
      { id: "ORANGE_CIV", name: "Orange Money" },
      { id: "MOOV_CIV", name: "Moov Money" },
      { id: "WAVE_CIV", name: "Wave" }
    ]
  },
  {
    countryCode: "ZM",
    countryCode3: "ZMB",
    names: ["zambie", "zambia", "république de zambie", "republic of zambia"],
    currency: "ZMW",
    phonePrefix: "260",
    exchangeRate: 27,
    operators: [
      { id: "MTN_MOMO_ZMB", name: "MTN Mobile Money" },
      { id: "AIRTEL_ZMB", name: "Airtel Money" },
      { id: "ZAMTEL_ZMB", name: "Zamtel Kwacha" }
    ]
  },
  {
    countryCode: "BJ",
    countryCode3: "BEN",
    names: ["bénin", "benin", "république du bénin", "republic of benin"],
    currency: "XOF",
    phonePrefix: "229",
    exchangeRate: 600,
    operators: [
      { id: "MTN_MOMO_BEN", name: "MTN Mobile Money" },
      { id: "MOOV_BEN", name: "Moov Money" },
      { id: "CELTIIS_BEN", name: "Celtiis Cash" }
    ]
  }
];

/**
 * Normalizes legacy or shorthand pawaPay operator/correspondent codes to valid official codes.
 */
export function normalizePawaPayCorrespondent(correspondent: any): string {
  if (!correspondent) return "";
  let str = "";
  if (typeof correspondent === 'string') {
    str = correspondent;
  } else if (typeof correspondent === 'object' && correspondent !== null) {
    str = correspondent.id || correspondent.name || correspondent.correspondent || String(correspondent);
  } else {
    str = String(correspondent);
  }
  const upper = str.trim().toUpperCase();
  const legacyMap: Record<string, string> = {
    // MTN
    MTN_RWA: "MTN_MOMO_RWA",
    MTN_RW: "MTN_MOMO_RWA",
    MTN_MOMO_RW: "MTN_MOMO_RWA",
    MTN_UGA: "MTN_MOMO_UGA",
    MTN_UG: "MTN_MOMO_UGA",
    MTN_MOMO_UG: "MTN_MOMO_UGA",
    MTN_CMR: "MTN_MOMO_CMR",
    MTN_CM: "MTN_MOMO_CMR",
    MTN_MOMO_CM: "MTN_MOMO_CMR",
    MTN_CIV: "MTN_MOMO_CIV",
    MTN_CI: "MTN_MOMO_CIV",
    MTN_MOMO_CI: "MTN_MOMO_CIV",
    MTN_ZMB: "MTN_MOMO_ZMB",
    MTN_ZM: "MTN_MOMO_ZMB",
    MTN_MOMO_ZM: "MTN_MOMO_ZMB",
    MTN_BEN: "MTN_MOMO_BEN",
    MTN_BJ: "MTN_MOMO_BEN",
    MTN_MOMO_BJ: "MTN_MOMO_BEN",
    // Moov
    MOOV_CI: "MOOV_CIV",
    MOOV_BJ: "MOOV_BEN",
    // Wave
    WAVE_SN: "WAVE_SEN",
    WAVE_CI: "WAVE_CIV",
    // Zamtel
    ZAMTEL_ZM: "ZAMTEL_ZMB",
    // Free
    FREE_SN: "FREE_SEN",
    // Celtiis
    CELTIIS_BJ: "CELTIIS_BEN",
    // Orange
    ORANGE_CD: "ORANGE_COD",
    ORANGE_CM: "ORANGE_CMR",
    ORANGE_CI: "ORANGE_CIV",
    ORANGE_SN: "ORANGE_SEN",
    // Airtel
    AIRTEL_CD: "AIRTEL_COD",
    AIRTEL_RW: "AIRTEL_RWA",
    AIRTEL_UG: "AIRTEL_UGA",
    AIRTEL_ZM: "AIRTEL_ZMB",
    // Vodacom / M-Pesa
    MPESA_COD: "VODACOM_MPESA_COD",
    VODACOM_COD: "VODACOM_MPESA_COD",
    MPESA_CD: "VODACOM_MPESA_COD",
    VODACOM_CD: "VODACOM_MPESA_COD",
  };
  return legacyMap[upper] || upper;
}

/**
 * Format human-readable error reasons from PawaPay response codes
 */
export function formatPawaPayFailureReason(code?: any, rawMessage?: any): string {
  const codeStr = typeof code === 'string' ? code : (code?.failureCode || code?.rejectionCode || (typeof code === 'object' ? JSON.stringify(code) : String(code || '')));
  const msgStr = typeof rawMessage === 'string' ? rawMessage : (rawMessage?.failureMessage || rawMessage?.rejectionMessage || (typeof rawMessage === 'object' ? JSON.stringify(rawMessage) : String(rawMessage || '')));

  const codeUpper = codeStr.toUpperCase();
  const msgUpper = msgStr.toUpperCase();

  if (codeUpper.includes('CANCEL') || msgUpper.includes('CANCEL') || codeUpper.includes('REJECT') || msgUpper.includes('REJECT') || msgUpper.includes('USER_CANCELLED')) {
    return "Transaction annulée ou rejetée sur le téléphone de l'utilisateur.";
  }
  if (codeUpper.includes('INSUFFICIENT') || msgUpper.includes('INSUFFICIENT') || msgUpper.includes('BALANCE') || codeUpper.includes('BALANCE') || msgUpper.includes('SOLDE')) {
    return "Solde PawaPay marchand ou Mobile Money insuffisant pour effectuer la transaction (balance insuffisante).";
  }
  if (codeUpper.includes('TIMEOUT') || msgUpper.includes('EXPIRE')) {
    return "La demande de paiement a expiré sans saisie du code PIN secret.";
  }
  if (codeUpper.includes('PIN') || msgUpper.includes('PIN')) {
    return "Code PIN secret incorrect ou erroné.";
  }
  if (codeUpper.includes('LIMIT') || msgUpper.includes('LIMIT')) {
    return "Plafond de transaction Mobile Money atteint pour cette journée.";
  }
  if (codeUpper.includes('NOT_FOUND') || codeUpper.includes('INVALID_RECIPIENT') || msgUpper.includes('NOT_FOUND') || msgUpper.includes('SUBSCRIBER')) {
    return "Numéro de téléphone introuvable ou non enregistré auprès de l'opérateur Mobile Money.";
  }
  if (msgUpper.includes('UNKNOWN') || msgUpper.includes('UNKNOWN REASON')) {
    const isSandbox = process.env.PAWAPAY_ENVIRONMENT !== 'production';
    if (isSandbox) {
      return "Échec PawaPay (Mode Sandbox) : L'opérateur a rejeté le test. En mode Sandbox, seuls les numéros de test PawaPay sont validés. En Production, vérifiez le solde du compte et la confirmation PIN.";
    }
    return "La transaction a été rejetée par l'opérateur Mobile Money (Raison indéfinie). Veuillez vérifier le solde du compte et vous assurer de valider la demande PIN sur votre téléphone.";
  }

  const isSandbox = process.env.PAWAPAY_ENVIRONMENT !== 'production';
  if (isSandbox && msgStr) {
    return `Transaction rejetée par l'opérateur (${msgStr}). Remarque : En mode PawaPay Sandbox, utilisez des numéros de test PawaPay.`;
  }

  return msgStr || codeStr || "Transaction rejetée par l'opérateur Mobile Money.";
}

/**
 * Find PawaPay configuration for a country based on country name, ISO2, or ISO3 code.
 */
export function getPawaPayConfigForCountry(countryNameOrCode: any): PawaPayCountryConfig | undefined {
  if (!countryNameOrCode) return undefined;
  
  const str = typeof countryNameOrCode === 'string' ? countryNameOrCode : (countryNameOrCode.countryCode || String(countryNameOrCode));
  const searchStr = str.trim().toLowerCase();
  
  return PAWAPAY_COUNTRY_MAPPING.find(cfg => 
    cfg.countryCode.toLowerCase() === searchStr ||
    cfg.countryCode3.toLowerCase() === searchStr ||
    cfg.names.some(name => searchStr.includes(name) || name.includes(searchStr))
  );
}

/**
 * Auto-detect PawaPay country configuration from phone number prefix, operator code, or fallback user country
 */
export function detectPawaPayCountry(phoneNumber?: any, carrier?: any, userCountry?: any): PawaPayCountryConfig {
  const phoneStr = typeof phoneNumber === 'string' ? phoneNumber : String(phoneNumber || '');
  const cleanPhone = phoneStr.replace(/\D/g, '');
  
  const carrierStr = typeof carrier === 'string' ? carrier : (typeof carrier === 'object' && carrier !== null ? (carrier.id || carrier.name || '') : String(carrier || ''));
  const carrierUpper = normalizePawaPayCorrespondent(carrierStr).toUpperCase();

  // 1. Try to detect from carrier suffix (e.g. MTN_MOMO_RWA -> RWA, MTN_MOMO_CMR -> CMR, etc.)
  if (carrierUpper) {
    for (const cfg of PAWAPAY_COUNTRY_MAPPING) {
      if (
        carrierUpper.endsWith(`_${cfg.countryCode3}`) ||
        carrierUpper.endsWith(`_${cfg.countryCode}`) ||
        cfg.operators.some(op => op.id.toUpperCase() === carrierUpper)
      ) {
        return cfg;
      }
    }
  }

  // 2. Try to detect from phone number international prefix (e.g. 250... -> Rwanda, 237... -> Cameroon, etc.)
  if (cleanPhone) {
    // Sort mapping by prefix length descending to match 243 before 24...
    const sorted = [...PAWAPAY_COUNTRY_MAPPING].sort((a, b) => b.phonePrefix.length - a.phonePrefix.length);
    for (const cfg of sorted) {
      if (cleanPhone.startsWith(cfg.phonePrefix)) {
        return cfg;
      }
    }
  }

  // 3. Fallback to user country parameter or profile country
  if (userCountry) {
    const config = getPawaPayConfigForCountry(userCountry);
    if (config) return config;
  }

  // Default fallback: DRC (CD)
  return PAWAPAY_COUNTRY_MAPPING[0];
}

/**
 * Format phone number to clean international format (no +, no leading 0 except CI 10-digit numbers) matching target prefix
 */
export function formatPawaPayPhoneNumber(phoneNumber: any, prefix: any): string {
  const phoneStr = typeof phoneNumber === 'string' ? phoneNumber : String(phoneNumber || '');
  const prefixStr = typeof prefix === 'string' ? prefix : String(prefix || '');
  if (!phoneStr) return "";
  let clean = phoneStr.replace(/\D/g, '');
  
  // Remove leading international zeros (e.g., 00250 -> 250)
  while (clean.startsWith('00')) {
    clean = clean.substring(2);
  }
  
  // If already starts with prefix
  if (prefixStr && clean.startsWith(prefixStr)) {
    // Special check for prefix + redundant zero (e.g., 2370677123456 -> 237677123456, EXCEPT for CI 225 where 22505/22507/22501 is valid 13-digit)
    if (prefixStr !== '225' && clean.startsWith(prefixStr + '0')) {
      clean = prefixStr + clean.substring(prefixStr.length + 1);
    }
    return clean;
  }
  
  // For Côte d'Ivoire (225): 10-digit national numbers start with 0 (05, 07, 01) and MUST keep the 0 (e.g. 0504123456 -> 2250504123456)
  if (prefixStr === '225' && clean.length === 10 && clean.startsWith('0')) {
    return prefixStr + clean;
  }

  // For other countries (or non-10-digit CI), if starts with 0, strip the leading 0
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  
  return prefixStr ? prefixStr + clean : clean;
}

export interface InitiateDepositResponse {
  success: boolean;
  depositId: string;
  status?: string;
  error?: string;
}

/**
 * Request deposit via PawaPay API (V2 with V1 fallback)
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
  const baseUrl = isProduction ? "https://api.pawapay.io" : "https://api.sandbox.pawapay.io";
  const correspondent = normalizePawaPayCorrespondent(params.correspondent);
  const cleanDesc = (params.statementDescription || "Ansella Academy").replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, 22) || "Ansella Academy";

  // Official PawaPay Deposit Payload (compatible with V2 and V1 endpoints)
  const payload = {
    depositId: depositId,
    amount: Math.round(params.amount).toString(),
    currency: params.currency,
    correspondent: correspondent,
    payer: {
      type: "MSISDN",
      address: {
        value: params.phoneNumber
      }
    },
    customerTimestamp: new Date().toISOString().split('.')[0] + 'Z',
    statementDescription: cleanDesc
  };

  console.log(`[PawaPayService] Initiating deposit (${depositId}) for ${correspondent}, phone: ${params.phoneNumber}, amount: ${params.amount} ${params.currency}`);

  try {
    // Try primary PawaPay /deposits endpoint (V1 standard collection endpoint)
    let response = await fetch(`${baseUrl}/deposits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    let responseText = await response.text();
    console.log("[PawaPayService] /deposits API response status:", response.status, "body:", responseText);

    // Fallback to V2 if /deposits endpoint returns 404 or 405 or 400 with invalid parameter error
    if (!response.ok && (response.status === 404 || response.status === 405 || (response.status === 400 && responseText.includes("type")))) {
      console.log("[PawaPayService] /deposits endpoint returned " + response.status + ", attempting /v2/deposits...");
      response = await fetch(`${baseUrl}/v2/deposits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });
      responseText = await response.text();
      console.log("[PawaPayService] /v2/deposits API response status:", response.status, "body:", responseText);
    }

    let data: any = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          depositId,
          error: "Erreur d'authentification PawaPay (HTTP 401) : Clé API PawaPay (PAWAPAY_API_TOKEN) non valide ou expirée dans vos variables d'environnement Vercel."
        };
      }
      if (response.status === 403) {
        return {
          success: false,
          depositId,
          error: `Accès refusé PawaPay (HTTP 403) : Votre compte marchand PawaPay n'est pas autorisé pour l'opérateur ${correspondent}.`
        };
      }
      const errorMsg = data.message || data.error || data.rejectionReason?.rejectionMessage || data.failureReason || `HTTP ${response.status}: ${responseText}`;
      return {
        success: false,
        depositId,
        error: formatPawaPayFailureReason(data.rejectionReason?.rejectionCode || data.failureCode, errorMsg)
      };
    }

    if (data.status === "REJECTED" || data.status === "FAILED") {
      const rawReason = data.rejectionReason?.rejectionMessage || data.failureReason || "La transaction a été rejetée par l'opérateur.";
      return {
        success: false,
        depositId,
        error: formatPawaPayFailureReason(data.rejectionReason?.rejectionCode || data.failureCode, rawReason)
      };
    }

    return {
      success: true,
      depositId,
      status: data.status || "ACCEPTED"
    };

  } catch (err: any) {
    console.error("[PawaPayService] Network error during deposit request:", err);
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
 * Fetch deposit status directly from PawaPay API (V2 / V1 fallback)
 */
export async function getPawaPayDepositStatus(depositId: string): Promise<PawaPayDepositStatusResponse> {
  const apiKey = process.env.PAWAPAY_API_TOKEN || "pawapay_sandbox_placeholder_token_abc123";
  const isProduction = process.env.PAWAPAY_ENVIRONMENT === "production";
  const baseUrl = isProduction ? "https://api.pawapay.io" : "https://api.sandbox.pawapay.io";

  try {
    let response = await fetch(`${baseUrl}/v2/deposits/${depositId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });

    if (response.status === 404) {
      response = await fetch(`${baseUrl}/deposits/${depositId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });
    }

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
    const failureMessage = depositObj.failureCode?.failureMessage || depositObj.rejectionReason?.rejectionMessage || depositObj.failureReason;

    return {
      success: true,
      depositId,
      status,
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
    correspondent: normalizePawaPayCorrespondent(params.correspondent),
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
      const codeVal = data.failureCode || data.rejectionReason?.rejectionCode || data.code || `HTTP_${response.status}`;
      const rawMsg = data.message || data.error || data.rejectionReason?.rejectionMessage || responseText;
      const formatted = formatPawaPayFailureReason(codeVal, rawMsg);
      return {
        success: false,
        payoutId,
        error: formatted
      };
    }

    if (data.status === "REJECTED" || data.status === "FAILED") {
      const codeVal = data.rejectionReason?.rejectionCode || data.failureCode || data.status;
      const rejMsg = data.rejectionReason?.rejectionMessage || data.failureReason || data.status;
      const formatted = formatPawaPayFailureReason(codeVal, rejMsg);
      return {
        success: false,
        payoutId,
        error: formatted
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

export interface PawaPayPayoutStatusResponse {
  success: boolean;
  payoutId: string;
  status?: string;
  failureCode?: string;
  failureMessage?: string;
  error?: string;
}

/**
 * Fetch payout status directly from PawaPay API (V2 / V1 fallback)
 */
export async function getPawaPayPayoutStatus(payoutId: string): Promise<PawaPayPayoutStatusResponse> {
  const apiKey = process.env.PAWAPAY_API_TOKEN || "pawapay_sandbox_placeholder_token_abc123";
  const isProduction = process.env.PAWAPAY_ENVIRONMENT === "production";
  const baseUrl = isProduction ? "https://api.pawapay.io" : "https://api.sandbox.pawapay.io";

  try {
    let response = await fetch(`${baseUrl}/payouts/${payoutId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });

    if (response.status === 404) {
      response = await fetch(`${baseUrl}/v2/payouts/${payoutId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });
    }

    const responseText = await response.text();
    console.log("[PawaPayService] PawaPay payout status response:", response.status, "body:", responseText);

    if (!response.ok) {
      return {
        success: false,
        payoutId,
        error: `HTTP ${response.status}: ${responseText}`
      };
    }

    let data: any = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {};
    }

    const payoutObj = Array.isArray(data) ? data[0] : data;
    if (!payoutObj) {
      return {
        success: false,
        payoutId,
        error: "Aucune donnée de versement retournée par PawaPay."
      };
    }

    const status = payoutObj.status;
    const failureCode = payoutObj.failureCode?.failureCode || (typeof payoutObj.failureCode === 'string' ? payoutObj.failureCode : undefined) || payoutObj.rejectionReason?.rejectionCode;
    const failureMessage = payoutObj.failureCode?.failureMessage || payoutObj.rejectionReason?.rejectionMessage || payoutObj.failureReason;

    return {
      success: true,
      payoutId,
      status,
      failureCode,
      failureMessage
    };

  } catch (err: any) {
    console.error("[PawaPayService] Network error during payout status check:", err);
    return {
      success: false,
      payoutId,
      error: err.message || "Erreur réseau lors de la vérification du versement PawaPay"
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
export function resolvePawaPayCorrespondent(
  carrier: string, 
  phoneNumber: string,
  countryCode?: string,
  currencyOverride?: string
): ResolvePayoutCarrierResult {
  const phoneStr = typeof phoneNumber === 'string' ? phoneNumber : String(phoneNumber || '');
  const cleanPhone = phoneStr.replace(/\D/g, "");
  
  // Find matching country by countryCode or phone prefix
  let countryConfig: PawaPayCountryConfig | undefined;

  if (countryCode) {
    countryConfig = getPawaPayConfigForCountry(countryCode);
  }

  if (!countryConfig && cleanPhone) {
    const sorted = [...PAWAPAY_COUNTRY_MAPPING].sort((a, b) => b.phonePrefix.length - a.phonePrefix.length);
    countryConfig = sorted.find(cfg => cleanPhone.startsWith(cfg.phonePrefix));
  }

  if (!countryConfig) {
    countryConfig = PAWAPAY_COUNTRY_MAPPING[0];
  }

  // Format phone number with country prefix
  const formattedPhone = formatPawaPayPhoneNumber(cleanPhone, countryConfig.phonePrefix);

  // Parse USD / CDF choice from currencyOverride or carrier string
  const isUSD = (currencyOverride && currencyOverride.toUpperCase() === 'USD') || carrier.toUpperCase().includes("USD");
  const isCDF = (currencyOverride && currencyOverride.toUpperCase() === 'CDF') || carrier.toUpperCase().includes("CDF");

  const cleanCarrierName = carrier.replace(/\(.*\)/g, "").replace(/USD|CDF/gi, "").trim().toLowerCase();

  // Find operator matching the carrier name
  const operator = countryConfig.operators.find(op => {
    const opName = op.name.toLowerCase();
    const opId = op.id.toLowerCase();
    const shortOpId = opId.split("_")[0];
    const shortOpName = opName.split(" ")[0];
    return (
      opId.includes(cleanCarrierName) ||
      opName.includes(cleanCarrierName) ||
      cleanCarrierName.includes(shortOpId) ||
      cleanCarrierName.includes(shortOpName)
    );
  }) || countryConfig.operators[0];

  // Currency logic: DRC (code CD / prefix 243) supports USD and CDF
  let currency = countryConfig.currency;
  let exchangeRate = countryConfig.exchangeRate;

  if (countryConfig.countryCode === "CD" || countryConfig.phonePrefix === "243") {
    if (isCDF) {
      currency = "CDF";
      exchangeRate = countryConfig.exchangeRate || 2800;
    } else {
      // Default to USD for DRC when USD is selected or not explicitly CDF
      currency = "USD";
      exchangeRate = 1;
    }
  }

  return {
    correspondent: operator.id,
    currency,
    exchangeRate,
    formattedPhone
  };
}
