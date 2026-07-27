"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface SolanaQrCodeProps {
  value: string;
  size?: number;
  className?: string;
  showAnsellaLogo?: boolean;
}

export function SolanaQrCode({
  value,
  size = 240,
  className = "",
  showAnsellaLogo = true,
}: SolanaQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (!value) return;

    // Generate local QR Code with High Error Correction ('H') to allow central logo overlay
    QRCode.toDataURL(value, {
      errorCorrectionLevel: "H",
      width: size * 2, // High resolution for crisp rendering
      margin: 1,
      color: {
        dark: "#09090b", // Deep dark zinc
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
          setError(false);
        }
      })
      .catch((err) => {
        console.error("[SolanaQrCode] Failed to generate QR code:", err);
        if (isMounted) setError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (error || !value) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-2xl border border-red-200 text-xs font-semibold text-center space-y-2">
        <p>Impossible de générer le QR Code.</p>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-lg group ${className}`}
      style={{ width: size + 28, height: size + 28 }}
    >
      {!dataUrl ? (
        <div className="flex items-center justify-center w-full h-full">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      ) : (
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Main QR Code Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt="Solana Pay QR Code"
            width={size}
            height={size}
            className="w-full h-full object-contain rounded-lg"
          />

          {/* Central Ansella Logo Badge Overlay */}
          {showAnsellaLogo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-9 h-9 rounded-xl bg-white border border-teal-500/60 shadow-sm p-1 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Ansella"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
