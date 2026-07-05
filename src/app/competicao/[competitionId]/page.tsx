"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { FixturesResponse, StandingsResponse, TeamsResponse } from "@/services/sportsData/types";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { LastUpdatedInfo } from "@/components/LastUpdatedInfo";
import { RefreshDataButton } from "@/components/RefreshDataButton";
import { ApiWarningBanner } from "@/components/ApiWarningBanner";
import { DataStatusPanel } from "@/components/DataStatusPanel";
import { CompetitionStatusBadge } from "@/components/CompetitionStatusBadge";
import { Tabs, type TabItem } from "@/components/Tabs";
import { AdSlot } from "@/components/AdSlot";
import { StandingsTable } from "@/components/StandingsTable";
import { FixturesList } from "@/components/FixturesList";
import { CompetitionStats } from "@/components/CompetitionStats";
import { ShareButtons } from "@/components/ShareButtons";
import { setLastCompetitionId } from "@/lib/userPreferences";

type TabKey = "tabela" | "jogos" | "simulador" | "estatisticas" | "times";

const TABS: TabItem<TabKey>[] = [
  { key: "tabela", label: "Tabela" },
  { key: "jogos", label: "Jogos" },
  { key: "simulador", label: "Simulador" },
  { key: "estatisticas", label: "Estatísticas" },
  { key: "times", label: "Times" },
];

function isTabKey(value: string | null): value is TabKey {
  return value === "tabela" || value === "jogos" || value === "simulador" || value === "estatisticas" || value === "times";
}

export default function CompetitionPage() {
  const params = useParams<{ competitionId: string }>();
  const competitionId = params.competitionId;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [teams, setTeams] = useState<TeamsResponse | null>(null);
  const [fixtures, setFixtures] = useState<FixturesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [tab, setTab] = useState<TabKey>(() => {
    const fromUrl = searchParams.get("tab");
    // "classificacao"/"simulacao" are kept for backwards-compatible deep links (old bookmarks/shares)
    if (fromUrl === "classificacao") return "tabela";
    if (fromUrl === "simulacao") return "simulador";
    return isTabKey(fromUrl) ? fromUrl : "tabela";
  });

  const load = useCallback(
    async (refresh: boolean) => {
      const suffix = refresh ? "&refresh=true" : "";
      const [standingsRes, teamsRes, fixturesRes] = await Promise.all([
        fetch(`/api/standings?competitionId=${competitionId}${suffix}`).then((r) => r.json()),
        fetch(`/api/teams?competitionId=${competitionId}${suffix}`).then((r) => r.json()),
        fetch(`/api/fixtures?competitionId=${competitionId}${suffix}`).then((r) => r.json()),
      ]);
      setStandings(standingsRes);
      setTeams(teamsRes);
      setFixtures(fixturesRes);
      setLoading(false);
    },
    [competitionId]
  );

  useEffect(() => {
    setLastCompetitionId(competitionId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(false);
  }, [competitionId, load]);

  function selectTab(next: TabKey) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    router.replace(`${url.pathname}?${url.searchParams.toString()}`, { scroll: false });
  }

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, []);

  if (loading && !standings) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-neutral-500">Carregando dados da competição...</p>
      </main>
    );
  }

  if (!standings) return null;

  const teamNameById = new Map(teams?.data.map((t) => [t.teamId, t.teamName]) ?? []);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-8">
      <div>
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← Todas as competições
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{standings.competition.name}</h1>
          <CompetitionStatusBadge competition={standings.competition} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DataSourceBadge source={standings.source} />
          <LastUpdatedInfo updatedAt={standings.updatedAt} />
          <RefreshDataButton onRefresh={() => load(true)} />
          <button
            type="button"
            onClick={() => setShowShare((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            🔗 Compartilhar
          </button>
        </div>
        {showShare && (
          <ShareButtons
            shareUrl={shareUrl}
            teamName={standings.competition.name}
            competitionName={standings.competition.name}
            summaryLines={[`Classificação de ${standings.competition.name} — Rota do Campeão`]}
          />
        )}
        <ApiWarningBanner isMock={standings.isMock} showTechnicalStatus={standings.showTechnicalStatus} />
        <DataStatusPanel
          source={standings.source}
          updatedAt={standings.updatedAt}
          isMock={standings.isMock}
          cached={standings.cached}
          competition={standings.competition}
          showTechnicalStatus={standings.showTechnicalStatus}
        />
      </header>

      <AdSlot type="leaderboard" />

      <Tabs tabs={TABS} active={tab} onChange={selectTab} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex flex-col gap-6">
          {tab === "tabela" && <StandingsTable standings={standings.data} competitionId={competitionId} />}

          {tab === "jogos" && fixtures && <FixturesList fixtures={fixtures.data} />}

          {tab === "simulador" && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Escolha um time para simular
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {(teams?.data ?? []).map((team) => (
                  <Link
                    key={team.teamId}
                    href={`/competicao/${competitionId}/time/${team.teamId}`}
                    className="rounded-md border border-neutral-200 px-3 py-2 text-sm hover:border-emerald-500 hover:text-emerald-700 dark:border-neutral-800 dark:hover:border-emerald-600 dark:hover:text-emerald-400"
                  >
                    {teamNameById.get(team.teamId) ?? team.teamName}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {tab === "estatisticas" && fixtures && (
            <CompetitionStats standings={standings.data} fixtures={fixtures.data} />
          )}

          {tab === "times" && (
            <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {(teams?.data ?? []).map((team) => (
                <Link
                  key={team.teamId}
                  href={`/competicao/${competitionId}/time/${team.teamId}`}
                  className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
                >
                  {team.teamName}
                </Link>
              ))}
            </section>
          )}

          <AdSlot type="in-content" />
        </div>

        <aside className="hidden flex-col gap-4 lg:flex">
          <div className="sticky top-20 flex flex-col gap-4">
            <AdSlot type="sidebar" label="Publicidade" />
            <div className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Próximos jogos
              </h3>
              <ul className="flex flex-col gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                {(fixtures?.data ?? [])
                  .filter((f) => f.status === "scheduled")
                  .slice(0, 5)
                  .map((f) => (
                    <li key={f.fixtureId} className="truncate">
                      {f.homeTeamName} x {f.awayTeamName}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
