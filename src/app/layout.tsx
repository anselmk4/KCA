import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ANSELLA | Plateforme LMS Mondiale pour tous les Formateurs | Partagez votre savoir",
  description: "Créez, hébergez et vendez vos formations en ligne dans le monde entier. ANSELLA est une plateforme LMS de classe mondiale permettant d'évaluer vos apprenants, de délivrer des certificats et d'encaisser vos gains facilement.",
  keywords: [
    "ANSELLA", "SaaS LMS", "E-learning", "Formations en ligne", 
    "Vendre des cours", "Stripe", "PayPal", "Mobile Money",
    "Blockchain", "Intelligence Artificielle", "Monétisation", "Formateurs"
  ],
  authors: [{ name: "ANSELLA Team", url: "https://ansella.app" }],
  creator: "ANSELLA",
  publisher: "ANSELLA",
  metadataBase: new URL("https://ansella.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ANSELLA | Plateforme LMS Mondiale pour tous les Formateurs",
    description: "Créez et vendez vos formations en ligne partout dans le monde. Encaissez vos revenus facilement.",
    url: "https://ansella.app",
    siteName: "ANSELLA",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ANSELLA | Plateforme LMS Mondiale pour tous les Formateurs",
    description: "Créez et vendez vos formations en ligne partout dans le monde. Encaissez vos revenus facilement.",
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
