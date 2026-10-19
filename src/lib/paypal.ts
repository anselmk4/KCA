const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_API_BASE = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'; // Default sandbox

/**
 * Obtain an access token from PayPal OAuth2 API.
 */
export async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal Client ID or Secret is missing in environment variables.');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain PayPal access token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a PayPal Checkout Order.
 */
export async function createPayPalOrder(amount: number, customId: string) {
  const accessToken = await getPayPalAccessToken();
  
  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2),
          },
          custom_id: customId,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create PayPal order: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Capture a PayPal Checkout Order after user authorization.
 */
export async function capturePayPalOrder(orderId: string) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(errorText);
    } catch {}

    const issue = parsed?.details?.[0]?.issue || parsed?.name;
    const desc = parsed?.details?.[0]?.description || parsed?.message;

    let friendlyMessage = `Échec de la capture PayPal : ${response.status}`;
    if (issue === "INSTRUMENT_DECLINED") {
      friendlyMessage = "Votre moyen de paiement (carte ou compte) a été refusé par votre banque ou n'autorise pas les paiements internationaux en devises (USD).";
    } else if (desc) {
      friendlyMessage = desc;
    }

    const error: any = new Error(friendlyMessage);
    error.status = response.status;
    error.code = issue;
    error.details = parsed?.details;
    error.raw = errorText;
    throw error;
  }

  return response.json();
}
