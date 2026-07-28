"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, RotateCcw, Share2 } from "lucide-react";
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

export function CompetitionPageClient({ competitionId }: { competitionId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [teams, setTeams] = useState<TeamsResponse | null>(null);
  const [fixtures, setFixtures] = useState<FixturesResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [tab, setTab] = useState<TabKey>(() => {
    const fromUrl = searchParams.get("tab");
    if (fromUrl === "classificacao") return "tabela";
    if (fromUrl === "simulacao") return "simulador";
    return isTabKey(fromUrl) ? fromUrl : "tabela";
  });

  const load = useCallback(
    async (refresh: boolean) => {
      setLoading(true);
      setLoadError(null);
      const suffix = refresh ? "&refresh=true" : "";
      try {
        const [standingsRes, teamsRes, fixturesRes] = await Promise.all([
          fetch(`/api/standings?competitionId=${competitionId}${suffix}`),
          fetch(`/api/teams?competitionId=${competitionId}${suffix}`),
          fetch(`/api/fixtures?competitionId=${competitionId}${suffix}`),
        ]);
        if (!standingsRes.ok) {
          const errorJson = await standingsRes.json().catch(() => null);
          setLoadError(errorJson?.message ?? "Não foi possível carregar esta competição agora.");
          setLoading(false);
          return;
        }
        const [standingsJson, teamsJson, fixturesJson] = await Promise.all([
          standingsRes.json(),
          teamsRes.json(),
          fixturesRes.json(),
        ]);
        setStandings(standingsJson);
        setTeams(teamsRes.ok ? teamsJson : null);
        setFixtures(fixturesRes.ok ? fixturesJson : null);
      } catch {
        setLoadError("Sem conexão com o servidor. Verifique sua internet e tente novamente.");
      } finally {
        setLoading(false);
      }
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
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
          <div className="h-8 w-72 animate-pulse rounded bg-surface" />
          <div className="h-64 animate-pulse rounded-md bg-surface" />
          <span className="sr-only">Carregando dados da competição...</span>
        </div>
      </main>
    );
  }

  if (loadError || !standings) {
    return (
      <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-6 px-4 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/15 text-danger">
          <AlertTriangle size={28} aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Não foi possível carregar a competição</h1>
          <p className="mt-2 text-sm text-muted">{loadError ?? "Tente novamente em instantes."}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => load(true)}
            className="inline-flex items-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-bold text-ink hover:bg-lime-dark"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Tentar novamente
          </button>
          <Link href="/" className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-white hover:bg-surface">
            Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  const teamNameById = new Map(teams?.data.map((t) => [t.teamId, t.teamName]) ?? []);
  const isEmpty = standings.data.length === 0;

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-8">
      <div>
        <Link href="/" className="text-sm text-muted hover:text-white hover:underline">
          ← Todas as competições
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-bold uppercase text-white">{standings.competition.name}</h1>
          <CompetitionStatusBadge competition={standings.competition} />
        </div>
        <p className="text-sm text-muted">Temporada {standings.competition.season}</p>
        <div className="flex flex-wrap items-center gap-3">
          <DataSourceBadge source={standings.source} isMock={standings.isMock} empty={isEmpty} />
          <LastUpdatedInfo updatedAt={standings.updatedAt} />
          <RefreshDataButton onRefresh={() => load(true)} />
          <button
            type="button"
            onClick={() => setShowShare((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-white hover:bg-surface-hover"
          >
            <Share2 size={13} aria-hidden="true" />
            Compartilhar
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
        <ApiWarningBanner isMock={standings.isMock} />
        <DataStatusPanel
          source={standings.source}
          updatedAt={standings.updatedAt}
          isMock={standings.isMock}
          cached={standings.cached}
          competition={standings.competition}
          showTechnicalStatus={standings.showTechnicalStatus}
        />
      </header>

      <AdSlot placement="hero-banner" />

      <Tabs tabs={TABS} active={tab} onChange={selectTab} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex flex-col gap-6">
          {isEmpty ? (
            <p className="text-sm text-muted">Ainda não há dados de classificação disponíveis para esta competição.</p>
          ) : (
            <>
              {tab === "tabela" && <StandingsTable standings={standings.data} competitionId={competitionId} />}

              {tab === "jogos" && fixtures && <FixturesList fixtures={fixtures.data} />}

              {tab === "simulador" && (
                <section className="flex flex-col gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Escolha um time para simular</h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {(teams?.data ?? []).map((team) => (
                      <Link
                        key={team.teamId}
                        href={`/competicao/${competitionId}/time/${team.teamId}`}
                        className="rounded-md border border-border px-3 py-2 text-sm text-white hover:border-lime"
                      >
                        {teamNameById.get(team.teamId) ?? team.teamName}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {tab === "estatisticas" && fixtures && <CompetitionStats standings={standings.data} fixtures={fixtures.data} />}

              {tab === "times" && (
                <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {(teams?.data ?? []).map((team) => (
                    <Link
                      key={team.teamId}
                      href={`/competicao/${competitionId}/time/${team.teamId}`}
                      className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-white hover:border-lime"
                    >
                      {team.teamName}
                    </Link>
                  ))}
                </section>
              )}
            </>
          )}

          <AdSlot placement="content-banner" />
        </div>

        <aside className="hidden flex-col gap-4 lg:flex">
          <div className="sticky top-20 flex flex-col gap-4">
            <AdSlot placement="sidebar" format="vertical" />
            <div className="rounded-md border border-border bg-graphite p-3 text-sm">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Próximos jogos</h3>
              <ul className="flex flex-col gap-1.5 text-xs text-muted">
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
