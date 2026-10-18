/**
 * Single source of truth for site-wide identity/config. Nothing here is ever a fake/placeholder
 * ID — `adsenseClientId`/`analyticsId` stay `undefined` until the real env var is set, and the
 * matching `*Enabled` flag is derived from that presence, never hardcoded `true`.
 */
export const siteConfig = {
  siteName: "Rota do Campeão",
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    "Acompanhe a tabela do Brasileirão Série A, veja jogos, situação dos clubes e simule os caminhos para título, Libertadores ou permanência.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
  adsenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || undefined,
  analyticsId: process.env.NEXT_PUBLIC_GA_ID || undefined,
  get adsEnabled() {
    return Boolean(this.adsenseClientId);
  },
  get analyticsEnabled() {
    return Boolean(this.analyticsId);
  },
};
