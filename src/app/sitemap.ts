import type { MetadataRoute } from "next";
import { getStandings } from "@/services/sportsData/sportsDataService";
import { BRASILEIRAO_COMPETITION_ID } from "@/services/sportsData/competitions/competitionRegistry";
import { getTeamUrl } from "@/lib/teamSlug";
import { siteConfig } from "@/lib/siteConfig";

const STATIC_PATHS = [
  { path: "/", priority: 1, changeFrequency: "hourly" as const },
  { path: "/brasileirao/classificacao", priority: 0.9, changeFrequency: "hourly" as const },
  { path: "/brasileirao/jogos", priority: 0.9, changeFrequency: "hourly" as const },
  { path: "/brasileirao/simulador", priority: 0.8, changeFrequency: "daily" as const },
  { path: "/brasileirao/times", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/sobre", priority: 0.3, changeFrequency: "monthly" as const },
  { path: "/contato", priority: 0.2, changeFrequency: "monthly" as const },
  { path: "/politica-de-privacidade", priority: 0.1, changeFrequency: "monthly" as const },
  { path: "/cookies", priority: 0.1, changeFrequency: "monthly" as const },
  { path: "/termos", priority: 0.1, changeFrequency: "monthly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((entry) => ({
    url: `${siteConfig.baseUrl}${entry.path}`,
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  const { data: standings } = await getStandings(BRASILEIRAO_COMPETITION_ID);
  const teamEntries: MetadataRoute.Sitemap = standings.map((team) => ({
    url: `${siteConfig.baseUrl}${getTeamUrl(team.teamName)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticEntries, ...teamEntries];
}
