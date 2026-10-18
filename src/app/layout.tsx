import type { Metadata } from "next";
import { Oswald, Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { siteConfig } from "@/lib/siteConfig";
import { buildWebSiteJsonLd } from "@/lib/jsonLd";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const HOME_TITLE = "Rota do Campeão — Tabela, jogos e simulações do Brasileirão Série A";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.baseUrl),
  title: { default: HOME_TITLE, template: `%s | ${siteConfig.siteName}` },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    siteName: siteConfig.siteName,
    title: HOME_TITLE,
    description: siteConfig.description,
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: siteConfig.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteJsonLd = buildWebSiteJsonLd();

  return (
    <html lang="pt-BR" className={`${oswald.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-ink font-sans text-white">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-lime focus:px-4 focus:py-2 focus:font-semibold focus:text-ink"
        >
          Pular para o conteúdo
        </a>
        <Header />
        {children}
        <Footer />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
