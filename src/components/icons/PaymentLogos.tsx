import React from "react";

// 1. Airtel Money (Official Image Logo)
export function AirtelMoneyLogo(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { className, ...rest } = props;
  return (
    <img 
      src="/images/payments/airtel-money.png" 
      alt="Airtel Money" 
      className={className || "w-9 h-9 object-contain rounded-xl bg-white p-0.5 shadow-sm"} 
      {...rest}
    />
  );
}

// 2. Vodacom M-Pesa (Official Image Logo)
export function MPesaLogo(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { className, ...rest } = props;
  return (
    <img 
      src="/images/payments/vodacom-mpesa.jpg" 
      alt="Vodacom M-Pesa" 
      className={className || "w-9 h-9 object-contain rounded-xl bg-white p-0.5 shadow-sm"} 
      {...rest}
    />
  );
}

// 3. Orange Money (Official Image Logo)
export function OrangeMoneyLogo(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { className, ...rest } = props;
  return (
    <img 
      src="/images/payments/orange-money.png" 
      alt="Orange Money" 
      className={className || "w-9 h-9 object-contain rounded-xl bg-white p-0.5 shadow-sm"} 
      {...rest}
    />
  );
}

// 4. Wave (Official Image Logo)
export function WaveLogo(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { className, ...rest } = props;
  return (
    <img 
      src="/images/payments/wave.png" 
      alt="Wave" 
      className={className || "w-9 h-9 object-contain rounded-xl bg-white p-0.5 shadow-sm"} 
      {...rest}
    />
  );
}

// 5. MTN MoMo (Official Image Logo)
export function MtnMomoLogo(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { className, ...rest } = props;
  return (
    <img 
      src="/images/payments/mtn-momo.jpg" 
      alt="MTN MoMo" 
      className={className || "w-9 h-9 object-contain rounded-xl bg-white p-0.5 shadow-sm"} 
      {...rest}
    />
  );
}

// 6. PayPal (Double P)
export function PayPalLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="6" fill="#003087" />
      <path d="M8.5 6H13C15.5 6 17 7.2 17 9.5C17 12 15.2 13.5 12.5 13.5H9.8L8.7 18.5H6.5L8.5 6Z" fill="#0079C1" opacity="0.85" />
      <path d="M10.5 8H15C17.5 8 19 9.2 19 11.5C19 14 17.2 15.5 14.5 15.5H11.8L10.7 20.5H8.5L10.5 8Z" fill="#00457C" />
    </svg>
  );
}

// 7. Solana (Vertical gradient / layered slabs)
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

// 8. Ethereum (Diamond shape)
export function EthereumLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="6" fill="#3C3C3D" />
      <path d="M12 4L11.85 4.5V13.8L12 13.95L17.2 10.9L12 4Z" fill="#C0C0C0" />
      <path d="M12 4L6.8 10.9L12 13.95V4Z" fill="#E5E5E5" />
      <path d="M12 14.85L11.9 14.95V19.8L12 20L17.2 12.7L12 14.85Z" fill="#C0C0C0" />
      <path d="M12 20V14.85L6.8 12.7L12 20Z" fill="#E5E5E5" />
      <path d="M12 13.95L17.2 10.9L12 8.1V13.95Z" fill="#A0A0A0" />
      <path d="M6.8 10.9L12 13.95V8.1L6.8 10.9Z" fill="#C0C0C0" />
    </svg>
  );
}

// 9. USDT Tether (Green circle with 'T')
export function TetherLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="6" fill="#26A17B" />
      <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.8" />
      <path d="M8.5 9H15.5V10.5H13V15.5H11V10.5H8.5V9Z" fill="white" />
      <path d="M10 12H14" stroke="white" strokeWidth="1.2" />
    </svg>
  );
}

// 10. Moov (Blue-green circle with white dynamic lines)
export function MoovLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="6" fill="#005A9C" />
      <path d="M6 14C6 14 10 9 14 9C18 9 18 12 18 12" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M7 11C7 11 10.5 7.5 13.5 7.5C16.5 7.5 17 9.5 17 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="14" r="2.5" fill="white" />
    </svg>
  );
}

// 11. Zamtel Kwacha (Zambia)
export function ZamtelLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="6" fill="#008751" />
      <path d="M7 8H17L10 16H17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 12. Celtiis (Benin)
export function CeltiisLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect width="24" height="24" rx="6" fill="#0E4B94" />
      <circle cx="12" cy="12" r="6" fill="#FFC72C" />
      <path d="M10 9C10 9 14 9 14 12C14 15 10 15 10 15" stroke="#0E4B94" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Dynamic Operator Logo Component Helper
export function OperatorLogo({ carrierId, className }: { carrierId: string; className?: string }) {
  const cleanId = (carrierId || "").toUpperCase();
  
  if (cleanId.includes("AIRTEL")) {
    return <AirtelMoneyLogo className={className || "h-7 w-auto object-contain rounded-md"} />;
  }
  if (cleanId.includes("MPESA") || cleanId.includes("VODACOM")) {
    return <MPesaLogo className={className || "h-7 w-auto object-contain rounded-md"} />;
  }
  if (cleanId.includes("ORANGE")) {
    return <OrangeMoneyLogo className={className || "h-7 w-auto object-contain rounded-md"} />;
  }
  if (cleanId.includes("MTN") || cleanId.includes("MOMO")) {
    return <MtnMomoLogo className={className || "h-7 w-auto object-contain rounded-md"} />;
  }
  if (cleanId.includes("WAVE")) {
    return <WaveLogo className={className || "h-7 w-auto object-contain rounded-md"} />;
  }
  if (cleanId.includes("MOOV")) {
    return <MoovLogo className={className || "h-7 w-auto object-contain"} />;
  }
  if (cleanId.includes("ZAMTEL")) {
    return <ZamtelLogo className={className || "h-7 w-auto object-contain"} />;
  }
  if (cleanId.includes("CELTIIS")) {
    return <CeltiisLogo className={className || "h-7 w-auto object-contain"} />;
  }

  return null;
}
