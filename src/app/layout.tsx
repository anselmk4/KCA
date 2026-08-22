import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/context/LanguageContext";
import { OrganizationJsonLd } from "@/components/seo/JsonLd";
import { PdfModalViewerGlobal } from "@/components/ui/PdfModalViewerGlobal";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ANSELLA | Plateforme LMS Mondiale & E-Learning | Vendez vos Formations",
  description: "Créez, hébergez et vendez vos cours en ligne en Afrique et dans le monde. Plateforme LMS complète avec paiements Mobile Money (M-Pesa, Wave, MTN, Orange), cartes bancaires, cryptos, IA et certificats vérifiables.",
  keywords: [
    "ANSELLA", "LMS Afrique", "Plateforme LMS", "Vendre des formations en ligne", 
    "Mobile Money LMS", "M-Pesa", "Wave", "Orange Money", "MTN MoMo",
    "E-learning Afrique", "Blockchain", "Intelligence Artificielle", "Certificats vérifiables en ligne",
    "EdTech Afrique", "LMS Software", "Sell online courses", "Academy builder"
  ],
  authors: [{ name: "ANSELLA EdTech", url: "https://ansella.app" }],
  creator: "ANSELLA Inc.",
  publisher: "ANSELLA",
  metadataBase: new URL("https://ansella.app"),
  alternates: {
    canonical: "/",
    languages: {
      "fr-FR": "https://ansella.app",
      "en-US": "https://ansella.app",
    },
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
    title: "ANSELLA | Plateforme LMS & E-Learning Nouvelle Génération",
    description: "Créez votre académie en ligne. Encaissez facilement avec Mobile Money, Cartes et Cryptos. Diplômes sécurisés.",
    url: "https://ansella.app",
    siteName: "ANSELLA",
    locale: "fr_FR",
    alternateLocale: ["en_US"],
    type: "website",
    images: [
      {
        url: "/og-image-final.png",
        width: 1200,
        height: 630,
        alt: "ANSELLA - Global LMS & E-Learning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ANSELLA | Plateforme LMS pour Créateurs de Formations",
    description: "Vendez vos cours en ligne avec Mobile Money et cartes bancaires. Solution LMS certifiée et sécurisée.",
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
      lang="fr"
      suppressHydrationWarning
    >
      <head>
        <OrganizationJsonLd />
      </head>
      <body className={`${inter.className} min-h-full flex flex-col antialiased bg-white dark:bg-black text-black dark:text-white`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
            <PdfModalViewerGlobal />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
