import type { Metadata } from "next";
import Link from "next/link";
import { getStandings } from "@/services/sportsData/sportsDataService";
import { BRASILEIRAO_COMPETITION_ID } from "@/services/sportsData/competitions/competitionRegistry";
import { buildBreadcrumbJsonLd } from "@/lib/jsonLd";
import { getTeamUrl } from "@/lib/teamSlug";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TeamLogo } from "@/components/TeamLogo";

export const metadata: Metadata = {
  title: "Times do Brasileirão Série A",
  description: "Veja os 20 clubes do Brasileirão Série A, com posição e pontos atuais, e acesse a página de cada time.",
  alternates: { canonical: "/brasileirao/times" },
};

export default async function TimesPage() {
  const { data: standings } = await getStandings(BRASILEIRAO_COMPETITION_ID);

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Rota do Campeão", path: "/" },
    { name: "Times", path: "/brasileirao/times" },
  ]);

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Breadcrumbs items={[{ name: "Rota do Campeão", path: "/" }, { name: "Times" }]} />

      <div className="mt-4 flex flex-col gap-6">
        <h1 className="font-display text-2xl font-bold uppercase text-white">Times do Brasileirão Série A</h1>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {standings.map((team) => (
            <Link
              key={team.teamId}
              href={getTeamUrl(team.teamName)}
              className="flex items-center gap-3 rounded-md border border-border bg-graphite p-3 transition hover:border-lime"
            >
              <TeamLogo team={team.teamName} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{team.teamName}</p>
                <p className="text-xs text-muted-2">
                  {team.position}º · {team.points} pts
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
