import type { Metadata } from "next";
import { Oswald, Inter } from "next/font/google";
import { Header } from "@/components/Header";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const BRAND_NAME = "Rota do Campeão";
const HOME_TITLE = "Rota do Campeão — Tabela, jogos e simulações do Brasileirão Série A";
const DEFAULT_DESCRIPTION =
  "Acompanhe a tabela do Brasileirão Série A, veja jogos, situação do seu time e simule os caminhos para título, Libertadores ou permanência.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: HOME_TITLE, template: `%s | ${BRAND_NAME}` },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: BRAND_NAME,
    title: HOME_TITLE,
    description: DEFAULT_DESCRIPTION,
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${oswald.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-ink font-sans text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-lime focus:px-4 focus:py-2 focus:font-semibold focus:text-ink"
        >
          Pular para o conteúdo
        </a>
        <Header />
        {children}
      </body>
    </html>
  );
}
