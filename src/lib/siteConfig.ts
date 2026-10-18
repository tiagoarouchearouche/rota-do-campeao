/**
 * Single source of truth for site-wide identity/config. `adsenseClientId`/`analyticsId` are
 * never a placeholder — the AdSense client ID below is the real one issued to this site's own
 * AdSense account (client IDs are meant to be public, they're embedded in the page's own HTML
 * for every visitor, same as the snippet AdSense itself gives you to paste in). The env var
 * still overrides it when set, so it can be changed without a code deploy if needed.
 */
export const siteConfig = {
  siteName: "Rota do Campeão",
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    "Acompanhe a tabela do Brasileirão Série A, veja jogos, situação dos clubes e simule os caminhos para título, Libertadores ou permanência.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
  adsenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-3395148434417478",
  analyticsId: process.env.NEXT_PUBLIC_GA_ID || undefined,
  get adsEnabled() {
    return Boolean(this.adsenseClientId);
  },
  get analyticsEnabled() {
    return Boolean(this.analyticsId);
  },
};
