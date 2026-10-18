"use client";

import { useCallback, useState } from "react";
import type { Competition, DataProvider, Fixture, TeamStanding } from "@/services/sportsData/types";
import { getMyTeamId, setMyTeamId as persistMyTeamId } from "@/lib/userPreferences";
import { trackEvent } from "@/lib/analytics";
import { getCurrentRound } from "@/services/sportsData/calculations/matchHelpers";
import { Hero } from "@/components/Hero";
import { MyTeamSelector } from "@/components/MyTeamSelector";
import { MyTeamCard } from "@/components/MyTeamCard";
import { ChampionshipSituation } from "@/components/ChampionshipSituation";
import { BrasileiraoAnalysis } from "@/components/BrasileiraoAnalysis";
import { StandingsTable } from "@/components/StandingsTable";
import { NextRound } from "@/components/NextRound";
import { IfItEndedToday } from "@/components/IfItEndedToday";
import { Simulator } from "@/components/Simulator";
import { TeamComparison } from "@/components/TeamComparison";
import { FixturesList } from "@/components/FixturesList";
import { CompetitionStats } from "@/components/CompetitionStats";
import { Tabs, type TabItem } from "@/components/Tabs";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { ApiWarningBanner } from "@/components/ApiWarningBanner";
import { DataStatusPanel } from "@/components/DataStatusPanel";
import { LastUpdatedInfo } from "@/components/LastUpdatedInfo";
import { RefreshDataButton } from "@/components/RefreshDataButton";
import { AdSlot } from "@/components/AdSlot";
import { HowItWorks } from "@/components/HowItWorks";
import { FaqSection, type FaqItem } from "@/components/FaqSection";
import { BRASILEIRAO_COMPETITION_ID } from "@/services/sportsData/competitions/competitionRegistry";

type SecondaryTab = "jogos" | "estatisticas";

const SECONDARY_TABS: TabItem<SecondaryTab>[] = [
  { key: "jogos", label: "Jogos" },
  { key: "estatisticas", label: "Estatísticas" },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Os dados são reais?",
    answer:
      "Sim, quando disponíveis: buscamos dados oficiais da football-data.org para o Brasileirão Série A. Se a competição não estiver acessível no momento, mostramos dados demonstrativos e avisamos claramente na tela.",
  },
  {
    question: "Qual é a fonte dos dados?",
    answer: "football-data.org. A fonte aparece sempre no topo da página.",
  },
  {
    question: "Como funciona a simulação?",
    answer:
      "Cruzamos a tabela atual com os jogos restantes de cada time para estimar pontos necessários, vitórias mínimas e três cenários: otimista, realista e pessimista. O simulador de campeonato também permite escolher o resultado de cada jogo restante e ver a tabela recalculada na hora.",
  },
  {
    question: "A simulação é uma previsão oficial?",
    answer:
      "Não. São estimativas matemáticas baseadas na tabela e nos jogos restantes — não substituem os critérios oficiais da CBF.",
  },
  {
    question: "Como compartilhar o resultado?",
    answer: "Na página do seu time, use os botões de compartilhar: copiar link, WhatsApp ou baixar uma imagem-resumo.",
  },
];

type Props = {
  initialStandings: TeamStanding[];
  initialFixtures: Fixture[];
  competition: Competition;
  round: number | null;
  totalRounds: number | null;
  isMock: boolean;
  source: DataProvider;
  updatedAt: string;
  cached: boolean;
  showTechnicalStatus?: boolean;
};

export function BrasileiraoHomeClient({
  initialStandings,
  initialFixtures,
  competition,
  round: initialRound,
  totalRounds: initialTotalRounds,
  isMock: initialIsMock,
  source: initialSource,
  updatedAt: initialUpdatedAt,
  cached: initialCached,
  showTechnicalStatus,
}: Props) {
  const [standings, setStandings] = useState(initialStandings);
  const [fixtures, setFixtures] = useState(initialFixtures);
  const [round, setRound] = useState(initialRound);
  const [totalRounds, setTotalRounds] = useState(initialTotalRounds);
  const [isMock, setIsMock] = useState(initialIsMock);
  const [source, setSource] = useState(initialSource);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [cached, setCached] = useState(initialCached);
  const [myTeamId, setMyTeamIdState] = useState<string | null>(() => getMyTeamId());
  const [secondaryTab, setSecondaryTab] = useState<SecondaryTab>("jogos");

  function selectMyTeam(teamId: string) {
    setMyTeamIdState(teamId);
    persistMyTeamId(teamId);
    trackEvent("select_team", { teamId });
  }

  const refresh = useCallback(async () => {
    try {
      const [standingsRes, fixturesRes] = await Promise.all([
        fetch(`/api/standings?competitionId=${BRASILEIRAO_COMPETITION_ID}&refresh=true`),
        fetch(`/api/fixtures?competitionId=${BRASILEIRAO_COMPETITION_ID}&refresh=true`),
      ]);
      if (!standingsRes.ok || !fixturesRes.ok) return;
      const standingsJson = await standingsRes.json();
      const fixturesJson = await fixturesRes.json();
      if ("error" in standingsJson || "error" in fixturesJson) return;

      setStandings(standingsJson.data);
      setFixtures(fixturesJson.data);
      const nextRound = getCurrentRound(fixturesJson.data);
      setRound(nextRound.round);
      setTotalRounds(nextRound.totalRounds);
      setIsMock(standingsJson.isMock || fixturesJson.isMock);
      setSource(standingsJson.isMock ? fixturesJson.source : standingsJson.source);
      setCached(Boolean(standingsJson.cached && fixturesJson.cached));
      setUpdatedAt(standingsJson.updatedAt > fixturesJson.updatedAt ? standingsJson.updatedAt : fixturesJson.updatedAt);
    } catch {
      // mantém os dados atuais na tela — falha silenciosa de rede não deve derrubar a página
    }
  }, []);

  const myTeam = standings.find((team) => team.teamId === myTeamId) ?? null;

  return (
    <main id="main-content" className="flex flex-1 flex-col">
      <Hero round={round} totalRounds={totalRounds} updatedAt={updatedAt} />

      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-12">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <DataSourceBadge source={source} isMock={isMock} empty={standings.length === 0} />
                <LastUpdatedInfo updatedAt={updatedAt} />
              </div>
              <RefreshDataButton onRefresh={refresh} />
            </div>

            <ApiWarningBanner isMock={isMock} />
            <DataStatusPanel
              source={source}
              updatedAt={updatedAt}
              isMock={isMock}
              cached={cached}
              competition={competition}
              showTechnicalStatus={showTechnicalStatus}
            />

            <section id="meu-time" className="flex flex-col gap-4">
              <MyTeamSelector standings={standings} value={myTeamId} onSelect={selectMyTeam} />
              {myTeam && <MyTeamCard team={myTeam} standings={standings} fixtures={fixtures} competition={competition} />}
            </section>

            <AdSlot placement="after-team-summary" />

            <ChampionshipSituation standings={standings} competition={competition} />

            <section id="classificacao" className="flex flex-col gap-4">
              <h2 className="font-display text-xl font-bold uppercase text-white">Classificação</h2>
              <StandingsTable standings={standings} competition={competition} myTeamId={myTeamId} />
            </section>

            <AdSlot placement="after-standings" />

            <NextRound fixtures={fixtures} standings={standings} competition={competition} />

            <AdSlot placement="before-if-ended-today" className="sm:hidden" />

            <IfItEndedToday standings={standings} competition={competition} />

            <Simulator standings={standings} fixtures={fixtures} competition={competition} myTeamId={myTeamId} />

            <TeamComparison standings={standings} fixtures={fixtures} />

            <section className="flex flex-col gap-4">
              <Tabs tabs={SECONDARY_TABS} active={secondaryTab} onChange={setSecondaryTab} />
              {secondaryTab === "jogos" ? (
                <FixturesList fixtures={fixtures} />
              ) : (
                <CompetitionStats standings={standings} fixtures={fixtures} />
              )}
            </section>

            <BrasileiraoAnalysis standings={standings} fixtures={fixtures} competition={competition} />

            <HowItWorks id="como-funciona" />

            <FaqSection items={FAQ_ITEMS} />
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <AdSlot placement="desktop-sidebar" format="vertical" />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
