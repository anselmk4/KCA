export type DonationProvider = 'pawapay' | 'paypal';

export type DonationStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';

export type SupportedDonationCurrency = 'USD' | 'CDF' | 'EUR' | 'XOF' | 'XAF' | 'RWF' | 'UGX';

export interface DonationRecord {
  id: string;
  provider: DonationProvider;
  provider_reference: string;
  amount: number;
  currency: SupportedDonationCurrency | string;
  status: DonationStatus;
  donor_name: string | null;
  donor_email: string | null;
  message: string | null;
  user_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateDonationInput {
  provider: DonationProvider;
  provider_reference: string;
  amount: number;
  currency: SupportedDonationCurrency | string;
  donor_name?: string | null;
  donor_email?: string | null;
  message?: string | null;
  user_id?: string | null;
  metadata?: Record<string, any>;
}

export interface PawaPayDonationInitiateRequest {
  amount: number;
  currency: string;
  phoneNumber: string;
  operatorId: string;
  countryCode: string;
  donorName?: string;
  donorEmail?: string;
  message?: string;
}

export interface PayPalCreateOrderRequest {
  amount: number;
  currency: string;
  donorName?: string;
  donorEmail?: string;
  message?: string;
}

export interface PayPalCaptureOrderRequest {
  orderId: string;
}

export interface DonationSuccessSummary {
  donationId: string;
  provider: DonationProvider;
  reference: string;
  amount: number;
  currency: string;
  donorName?: string | null;
  donorEmail?: string | null;
  message?: string | null;
  createdAt: string;
}

