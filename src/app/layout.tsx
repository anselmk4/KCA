import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ANSELLA | Plateforme congolaise pour tous les Formateurs | Gagnez en faisant ce que vous aimez",
  description: "Créez, hébergez et vendez vos formations en ligne en RDC et partout en Afrique. ANSELLA est une plateforme 100% congolaise permettant d'évaluer vos apprenants et d'encaisser vos gains directement par Mobile Money (M-Pesa, Orange Money, Airtel Money).",
  keywords: [
    "ANSELLA", "SaaS LMS", "E-learning Congo", "RDC", "Formations en ligne", 
    "Vendre des cours", "Mobile Money", "M-Pesa", "Orange Money", "Airtel Money",
    "Blockchain", "Intelligence Artificielle", "Monétisation", "Formateurs africains"
  ],
  authors: [{ name: "ANSELLA Team", url: "https://ansella.app" }],
  creator: "ANSELLA",
  publisher: "ANSELLA",
  metadataBase: new URL("https://ansella.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ANSELLA | Plateforme congolaise pour tous les Formateurs | Gagnez en faisant ce que vous aimez",
    description: "Créez et vendez vos formations en ligne en RDC et en Afrique. Encaissez vos revenus directement par Mobile Money.",
    url: "https://ansella.app",
    siteName: "ANSELLA",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ANSELLA | Plateforme congolaise pour tous les Formateurs | Gagnez en faisant ce que vous aimez",
    description: "Créez et vendez vos formations en ligne en RDC et en Afrique. Encaissez vos revenus directement par Mobile Money.",
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
      <body className={`${inter.className} min-h-full flex flex-col antialiased bg-white dark:bg-black text-black dark:text-white`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
