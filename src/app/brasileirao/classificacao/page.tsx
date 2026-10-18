import type { Metadata } from "next";
import { getStandings, getFixtures } from "@/services/sportsData/sportsDataService";
import { enrichStandings } from "@/services/sportsData/calculations/standingsEnrichment";
import { BRASILEIRAO_COMPETITION_ID } from "@/services/sportsData/competitions/competitionRegistry";
import { buildBreadcrumbJsonLd } from "@/lib/jsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StandingsTable } from "@/components/StandingsTable";
import { BrasileiraoAnalysis } from "@/components/BrasileiraoAnalysis";

export const metadata: Metadata = {
  title: "Classificação do Brasileirão Série A",
  description: "Tabela completa do Brasileirão Série A: pontos, saldo de gols, forma recente e zonas de Libertadores, Sul-Americana e rebaixamento.",
  alternates: { canonical: "/brasileirao/classificacao" },
};

export default async function ClassificacaoPage() {
  const [standingsEnvelope, fixturesEnvelope] = await Promise.all([
    getStandings(BRASILEIRAO_COMPETITION_ID),
    getFixtures(BRASILEIRAO_COMPETITION_ID),
  ]);
  const standings = enrichStandings(standingsEnvelope.data, fixturesEnvelope.data);
  const competition = standingsEnvelope.competition;

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Rota do Campeão", path: "/" },
    { name: "Classificação", path: "/brasileirao/classificacao" },
  ]);

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Breadcrumbs items={[{ name: "Rota do Campeão", path: "/" }, { name: "Classificação" }]} />

      <div className="mt-4 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-2xl font-bold uppercase text-white">Classificação do Brasileirão Série A</h1>
          <p className="max-w-3xl text-sm text-muted">
            Uma vitória vale 3 pontos, um empate vale 1 ponto para cada time e uma derrota não soma pontos. Em caso
            de igualdade, os critérios de desempate seguem a ordem: número de vitórias, saldo de gols e gols
            marcados. Os primeiros colocados avançam para a Libertadores e a Sul-Americana; os quatro últimos são
            rebaixados para a Série B.
          </p>
        </div>

        <StandingsTable standings={standings} competition={competition} />

        <BrasileiraoAnalysis standings={standings} competition={competition} />
      </div>
    </main>
  );
}
