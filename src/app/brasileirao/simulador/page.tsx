import type { Metadata } from "next";
import { getStandings, getFixtures } from "@/services/sportsData/sportsDataService";
import { enrichStandings } from "@/services/sportsData/calculations/standingsEnrichment";
import { BRASILEIRAO_COMPETITION_ID } from "@/services/sportsData/competitions/competitionRegistry";
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/jsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Simulator } from "@/components/Simulator";
import { FaqSection, type FaqItem } from "@/components/FaqSection";

export const metadata: Metadata = {
  title: "Simulador do Brasileirão Série A",
  description: "Simule os resultados das próximas partidas do Brasileirão Série A e veja como a classificação pode mudar.",
  alternates: { canonical: "/brasileirao/simulador" },
};

const SIMULATOR_FAQ: FaqItem[] = [
  {
    question: "Como funciona o simulador?",
    answer: "Você escolhe o resultado (vitória da casa, empate ou vitória do visitante) para cada jogo restante e a tabela é recalculada automaticamente, aplicando pontos e saldo de gols a cada time.",
  },
  {
    question: "Os resultados simulados alteram a tabela real?",
    answer: "Não. A simulação roda só no seu navegador, sobre uma cópia da tabela — a classificação oficial não é alterada.",
  },
  {
    question: "O simulador prevê quem será campeão?",
    answer: "Não. É uma ferramenta de cenários baseada nos resultados que você escolhe, não uma previsão estatística ou uma garantia de resultado.",
  },
  {
    question: "Como são calculados os pontos?",
    answer: "Vitória vale 3 pontos, empate vale 1 ponto para cada time envolvido e derrota não soma pontos — os mesmos critérios usados na tabela oficial.",
  },
  {
    question: "Esses cenários são oficiais?",
    answer: "Não. São estimativas matemáticas do Rota do Campeão e não substituem os critérios oficiais da CBF.",
  },
];

export default async function SimuladorPage() {
  const [standingsEnvelope, fixturesEnvelope] = await Promise.all([
    getStandings(BRASILEIRAO_COMPETITION_ID),
    getFixtures(BRASILEIRAO_COMPETITION_ID),
  ]);
  const standings = enrichStandings(standingsEnvelope.data, fixturesEnvelope.data);

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Rota do Campeão", path: "/" },
    { name: "Simulador", path: "/brasileirao/simulador" },
  ]);
  const faqJsonLd = buildFaqJsonLd(SIMULATOR_FAQ);

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ name: "Rota do Campeão", path: "/" }, { name: "Simulador" }]} />

      <div className="mt-4 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-2xl font-bold uppercase text-white">Simulador do Brasileirão Série A</h1>
          <p className="max-w-3xl text-sm text-muted">
            Simule os resultados das próximas partidas e veja como a classificação pode mudar.
          </p>
        </div>

        <Simulator standings={standings} fixtures={fixturesEnvelope.data} competition={standingsEnvelope.competition} />

        <FaqSection items={SIMULATOR_FAQ} />
      </div>
    </main>
  );
}
