import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ANSELLA | Global LMS Platform for Instructors & Learners | Share Your Knowledge",
  description: "Create, host, and sell your online courses worldwide. ANSELLA is a world-class LMS platform to assess learners, issue certificates, and monetize your expertise easily.",
  keywords: [
    "ANSELLA", "SaaS LMS", "E-learning", "Online Courses", 
    "Sell Courses", "Stripe", "PayPal", "Mobile Money",
    "Blockchain", "Artificial Intelligence", "Monetization", "Instructors"
  ],
  authors: [{ name: "ANSELLA Team", url: "https://ansella.app" }],
  creator: "ANSELLA",
  publisher: "ANSELLA",
  metadataBase: new URL("https://ansella.app"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "ANSELLA | Global LMS Platform for Instructors & Learners",
    description: "Create and sell online courses worldwide. Collect payments easily via Mobile Money and cards.",
    url: "https://ansella.app",
    siteName: "ANSELLA",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image-final.png",
        width: 1200,
        height: 630,
        alt: "ANSELLA - Global LMS Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ANSELLA | Global LMS Platform for Instructors & Learners",
    description: "Create and sell online courses worldwide. Collect payments easily via Mobile Money and cards.",
    images: ["/og-image-final.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className={`${inter.className} min-h-full flex flex-col antialiased bg-white dark:bg-black text-black dark:text-white`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
