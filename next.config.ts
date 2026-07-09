import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://*.supabase.in https://challenges.cloudflare.com https://www.paypal.com https://*.paypal.com https://*.paypalobjects.com https://*.jit.si https://*.jitsi.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://www.paypal.com https://*.paypal.com https://*.paypalobjects.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.supabase.in wss://*.supabase.in https://www.paypal.com https://*.paypal.com https://*.paypalobjects.com https://*.jit.si https://*.jitsi.net; frame-src 'self' https://www.youtube.com https://youtube.com https://player.vimeo.com https://vimeo.com https://www.dailymotion.com https://dailymotion.com https://challenges.cloudflare.com https://www.paypal.com https://*.paypal.com https://*.jit.si https://*.jitsi.net; media-src 'self' data: https://*.supabase.co https://*.supabase.in;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
