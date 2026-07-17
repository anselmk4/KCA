import React from "react";

// 1. Airtel Money (Red mobile-wallet icon)
export function AirtelMoneyLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="6" fill="#E60000" />
      {/* Airtel's stylized 'a' loop */}
      <path d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 9.5 17 7.5 14.5 7.5C12.5 7.5 11 9 11 11C11 12.1 11.9 13 13 13C14.1 13 15 12.1 15 11H17C17 13.5 15 15 13 15C10.8 15 9 13.2 9 11C9 8.8 10.8 7 13 7C16 7 18.5 9.5 18.5 12.5C18.5 16.1 15.6 19 12 19C8.4 19 5.5 16.1 5.5 12.5C5.5 8.9 8.4 6 12 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// 2. Vodacom M-Pesa (Green & Red mobile transfer icon)
export function MPesaLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="6" fill="#4CA64C" />
      {/* Phone silhouette */}
      <rect x="7" y="4" width="10" height="16" rx="2" stroke="white" strokeWidth="1.5" />
      {/* Red speech bubble or V representing Vodacom style */}
      <path d="M12 10L14 8M12 10L10 8M12 10V14" stroke="#FF3333" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="white" />
      {/* Flow arrows */}
      <path d="M5 10H7M17 14H19" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 3. Orange Money (Orange square with white wallet & stars)
export function OrangeMoneyLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="6" fill="#FF6600" />
      {/* Wallet with double curved arrows inside */}
      <rect x="5" y="7" width="14" height="10" rx="1.5" stroke="white" strokeWidth="1.5" />
      <path d="M9 12H15M15 12L13 10M15 12L13 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="12" r="1" fill="#FF6600" stroke="white" strokeWidth="1" />
    </svg>
  );
}

// 4. PayPal (Double P)
export function PayPalLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="6" fill="#003087" />
      <path d="M8.5 6H13C15.5 6 17 7.2 17 9.5C17 12 15.2 13.5 12.5 13.5H9.8L8.7 18.5H6.5L8.5 6Z" fill="#0079C1" opacity="0.85" />
      <path d="M10.5 8H15C17.5 8 19 9.2 19 11.5C19 14 17.2 15.5 14.5 15.5H11.8L10.7 20.5H8.5L10.5 8Z" fill="#00457C" />
    </svg>
  );
}

// 5. Solana (Vertical gradient / layered slabs)
export function SolanaLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="6" fill="#1A1A1A" />
      <g strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8L9.5 5.5H18L14.5 8H6Z" fill="url(#solana-grad)" />
        <path d="M18 12L14.5 9.5H6L9.5 12H18Z" fill="url(#solana-grad)" />
        <path d="M6 16L9.5 13.5H18L14.5 16H6Z" fill="url(#solana-grad)" />
      </g>
      <defs>
        <linearGradient id="solana-grad" x1="6" y1="5.5" x2="18" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3" />
          <stop offset="0.5" stopColor="#854AD0" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// 6. Ethereum (Diamond shape)
export function EthereumLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="6" fill="#3C3C3D" />
      {/* Top half */}
      <path d="M12 4L11.85 4.5V13.8L12 13.95L17.2 10.9L12 4Z" fill="#C0C0C0" />
      <path d="M12 4L6.8 10.9L12 13.95V4Z" fill="#E5E5E5" />
      {/* Bottom half */}
      <path d="M12 14.85L11.9 14.95V19.8L12 20L17.2 12.7L12 14.85Z" fill="#C0C0C0" />
      <path d="M12 20V14.85L6.8 12.7L12 20Z" fill="#E5E5E5" />
      {/* Core split overlay */}
      <path d="M12 13.95L17.2 10.9L12 8.1V13.95Z" fill="#A0A0A0" />
      <path d="M6.8 10.9L12 13.95V8.1L6.8 10.9Z" fill="#C0C0C0" />
    </svg>
  );
}

// 7. USDT Tether (Green circle with 'T')
export function TetherLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="6" fill="#26A17B" />
      <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.8" />
      {/* Styled T */}
      <path d="M8.5 9H15.5V10.5H13V15.5H11V10.5H8.5V9Z" fill="white" />
      <path d="M10 12H14" stroke="white" strokeWidth="1.2" />
    </svg>
  );
}

// 8. Moov (Blue-green circle with white dynamic lines)
export function MoovLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="6" fill="#005A9C" />
      {/* Orange/white curved bands */}
      <path d="M6 14C6 14 10 9 14 9C18 9 18 12 18 12" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M7 11C7 11 10.5 7.5 13.5 7.5C16.5 7.5 17 9.5 17 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="14" r="2.5" fill="white" />
    </svg>
  );
}

// 9. Wave (Cyan/Blue background with white water wave)
export function WaveLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="6" fill="#1AC6FF" />
      {/* Wave shape */}
      <path d="M5 13.5C7.5 11 9 11.5 11.5 13.5C14 15.5 16.5 15.5 19 13.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M5 10C7.5 7.5 9 8 11.5 10C14 12 16.5 12 19 10" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

// 10. MTN MoMo (Yellow circle with blue text)
export function MtnMomoLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="6" fill="#FFCC00" />
      {/* Yellow pill outline and "MoMo" written inside or MoMo circle logo */}
      <circle cx="12" cy="12" r="7" fill="#002244" />
      <circle cx="12" cy="12" r="5.5" fill="#FFCC00" />
      {/* Stylized M/wallet */}
      <path d="M9.5 10H14.5V14.5H9.5V10Z" fill="#002244" />
      <path d="M10.5 11.5H13.5V13.5H10.5V11.5Z" fill="#FFCC00" />
      <path d="M11.5 8V10" stroke="#FFCC00" strokeWidth="1" />
    </svg>
  );
}
