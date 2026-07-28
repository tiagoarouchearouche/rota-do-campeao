"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, RotateCcw, ArrowLeft, Users } from "lucide-react";
import type { ScenarioName, TeamPathResponse } from "@/services/sportsData/types";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { LastUpdatedInfo } from "@/components/LastUpdatedInfo";
import { RefreshDataButton } from "@/components/RefreshDataButton";
import { ApiWarningBanner } from "@/components/ApiWarningBanner";
import { DataStatusPanel } from "@/components/DataStatusPanel";
import { PathAnalysisCard } from "@/components/PathAnalysisCard";
import { ShareButtons } from "@/components/ShareButtons";
import { AdSlot } from "@/components/AdSlot";
import { buildTeamShareUrl } from "@/lib/shareState";
import { setLastTeamId, getScenarioPreference, setScenarioPreference } from "@/lib/userPreferences";
import type { ApiErrorBody } from "@/lib/apiErrors";

const SCENARIO_TABS: { key: ScenarioName; label: string; explanation: string }[] = [
  { key: "optimistic", label: "Otimista", explanation: "Considera cerca de 70% de vitórias nos jogos restantes." },
  { key: "realistic", label: "Realista", explanation: "Mantém a média atual de pontos por jogo do time." },
  { key: "pessimistic", label: "Pessimista", explanation: "Considera cerca de 45% de derrotas nos jogos restantes." },
];

const ERROR_COPY: Record<string, { title: string; body: string }> = {
  competition_not_found: {
    title: "Competição não encontrada",
    body: "Essa competição não existe ou foi removida.",
  },
  team_not_found: {
    title: "Time não encontrado",
    body: "Não encontramos esse time nessa competição. Ele pode ter mudado de identificador ou não estar disponível.",
  },
  internal_error: {
    title: "Não foi possível calcular a análise",
    body: "Algo deu errado ao processar os dados. Tente novamente em instantes.",
  },
  network_error: {
    title: "Sem conexão com o servidor",
    body: "Verifique sua internet e tente novamente.",
  },
};

type LoadState =
  | { status: "loading" }
  | { status: "success"; data: TeamPathResponse }
  | { status: "error"; code: string; message: string };

export function TeamPathClient({ competitionId, teamId }: { competitionId: string; teamId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [scenario, setScenario] = useState<ScenarioName>(
    (searchParams.get("scenario") as ScenarioName) || getScenarioPreference() || "realistic"
  );

  const load = useCallback(
    async (refresh: boolean) => {
      setState({ status: "loading" });
      const suffix = refresh ? "&refresh=true" : "";
      try {
        const res = await fetch(`/api/team-path?competitionId=${competitionId}&teamId=${teamId}${suffix}`);
        const json = await res.json();
        if (!res.ok || "error" in json) {
          const errorJson = json as ApiErrorBody;
          setState({ status: "error", code: errorJson.error ?? "internal_error", message: errorJson.message ?? "" });
          return;
        }
        setState({ status: "success", data: json as TeamPathResponse });
      } catch {
        setState({ status: "error", code: "network_error", message: "" });
      }
    },
    [competitionId, teamId]
  );

  useEffect(() => {
    setLastTeamId(teamId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(false);
  }, [teamId, load]);

  function selectScenario(next: ScenarioName) {
    setScenario(next);
    setScenarioPreference(next);
    const url = new URL(window.location.href);
    url.searchParams.set("scenario", next);
    router.replace(`${url.pathname}?${url.searchParams.toString()}`, { scroll: false });
  }

  const teamPath = state.status === "success" ? state.data : null;

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !teamPath) return "";
    return buildTeamShareUrl({
      origin: window.location.origin,
      competitionId,
      teamId,
      season: teamPath.competition.season,
      scenario,
    });
  }, [competitionId, teamId, teamPath, scenario]);

  if (state.status === "loading") {
    return (
      <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
          <div className="h-6 w-40 animate-pulse rounded bg-surface" />
          <div className="h-9 w-64 animate-pulse rounded bg-surface" />
          <div className="h-40 animate-pulse rounded-md bg-surface" />
          <div className="h-40 animate-pulse rounded-md bg-surface" />
          <span className="sr-only">Carregando análise do time...</span>
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    const copy = ERROR_COPY[state.code] ?? ERROR_COPY.internal_error;
    return (
      <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-6 px-4 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/15 text-danger">
          <AlertTriangle size={28} aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{copy.title}</h1>
          <p className="mt-2 text-sm text-muted">{state.message || copy.body}</p>
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
          <Link
            href={`/competicao/${competitionId}`}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-white hover:bg-surface"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar para a competição
          </Link>
          <Link
            href={`/competicao/${competitionId}?tab=simulador`}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-white hover:bg-surface"
          >
            <Users size={16} aria-hidden="true" />
            Escolher outro time
          </Link>
        </div>
      </main>
    );
  }

  const { team, competition, scenarios, pathToTitle, pathToQualification, pathToAvoidRelegation, decisiveMatches, fixtures } =
    teamPath!;
  const activeScenario = scenarios[scenario];
  const activeScenarioTab = SCENARIO_TABS.find((t) => t.key === scenario)!;

  const upcomingMatches = fixtures
    .filter((f) => f.status !== "finished" && (f.homeTeamId === team.teamId || f.awayTeamId === team.teamId))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const summaryLines = [
    `${team.teamName} está na ${team.position}ª posição com ${team.points} pontos.`,
    pathToTitle.message,
    pathToQualification.message,
    ...(pathToAvoidRelegation ? [pathToAvoidRelegation.message] : []),
    `Cenário ${scenario}: ${activeScenario.message}`,
  ];

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 pb-24 sm:pb-10">
      <div>
        <Link href={`/competicao/${competitionId}`} className="text-sm text-muted hover:text-white hover:underline">
          ← {competition.name}
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-bold uppercase text-white">{team.teamName}</h1>
        <p className="text-sm text-muted">
          {competition.name} · {team.position}ª posição · {team.points} pontos · {team.wins}V {team.draws}E {team.losses}D
          {team.percentage !== undefined && ` · ${team.percentage}% de aproveitamento`}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <DataSourceBadge source={teamPath!.source} isMock={teamPath!.isMock} />
          <LastUpdatedInfo updatedAt={teamPath!.updatedAt} />
          <RefreshDataButton onRefresh={() => load(true)} />
        </div>
        <ApiWarningBanner isMock={teamPath!.isMock} />
        <DataStatusPanel
          source={teamPath!.source}
          updatedAt={teamPath!.updatedAt}
          isMock={teamPath!.isMock}
          cached={teamPath!.cached}
          competition={competition}
          showTechnicalStatus={teamPath!.showTechnicalStatus}
        />
      </header>

      {teamPath!.otherCompetitions && teamPath!.otherCompetitions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{team.teamName} também está em</h2>
          <div className="flex flex-wrap gap-2">
            {teamPath!.otherCompetitions.map((c) => (
              <Link
                key={c.competitionId}
                href={`/competicao/${c.competitionId}/time/${team.teamId}`}
                className="rounded-md border border-border px-3 py-2 text-sm text-white hover:border-lime"
              >
                {c.name} · Simular
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-bold uppercase text-white">O caminho até o objetivo</h2>

        <div className="flex flex-col gap-3">
          <PathAnalysisCard analysis={pathToTitle} />
          <PathAnalysisCard analysis={pathToQualification} />
          {pathToAvoidRelegation && <PathAnalysisCard analysis={pathToAvoidRelegation} />}
        </div>

        {decisiveMatches.length > 0 && (
          <div className="rounded-md border border-border bg-graphite p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Confrontos diretos</h3>
            <ul className="flex flex-col gap-2">
              {decisiveMatches.map((fixture) => (
                <li key={fixture.fixtureId} className="flex items-center justify-between gap-2 text-sm text-white">
                  <span>
                    {fixture.homeTeamName} x {fixture.awayTeamName}
                  </span>
                  <span className="shrink-0 text-xs text-muted">{fixture.round}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {upcomingMatches.length > 0 && (
          <div className="rounded-md border border-border bg-graphite p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Próximos jogos</h3>
            <ul className="flex flex-col gap-2">
              {upcomingMatches.map((fixture) => {
                const opponent = fixture.homeTeamId === team.teamId ? fixture.awayTeamName : fixture.homeTeamName;
                const isHome = fixture.homeTeamId === team.teamId;
                return (
                  <li key={fixture.fixtureId} className="flex items-center justify-between gap-2 text-sm text-white">
                    <span>
                      {isHome ? "vs" : "@"} {opponent}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(fixture.date))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold uppercase text-white">Cenários</h2>
        <div role="tablist" aria-label="Cenários de simulação" className="flex gap-2">
          {SCENARIO_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={scenario === tab.key}
              onClick={() => selectScenario(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                scenario === tab.key ? "bg-lime text-ink" : "border border-border text-muted hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="rounded-md border border-border bg-graphite p-4">
          <p className="text-xs uppercase tracking-wide text-muted-2">{activeScenarioTab.explanation}</p>
          <p className="mt-2 text-sm text-muted">{activeScenario.message}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-muted-2">Pontos projetados</dt>
              <dd className="font-semibold text-white">{activeScenario.projectedPoints}</dd>
            </div>
            <div>
              <dt className="text-muted-2">Posição projetada</dt>
              <dd className="font-semibold text-white">{activeScenario.projectedPosition}ª</dd>
            </div>
            <div>
              <dt className="text-muted-2">Jogos simulados</dt>
              <dd className="font-semibold text-white">{activeScenario.simulatedFixtures.length}</dd>
            </div>
          </dl>
        </div>
        <p className="text-xs text-muted-2">
          As simulações são estimativas matemáticas e não constituem previsões oficiais.
        </p>
      </section>

      <AdSlot placement="post-simulation" />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Compartilhar</h2>
        <ShareButtons shareUrl={shareUrl} teamName={team.teamName} competitionName={competition.name} summaryLines={summaryLines} />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-graphite/95 p-3 backdrop-blur sm:hidden">
        <ShareButtons shareUrl={shareUrl} teamName={team.teamName} competitionName={competition.name} summaryLines={summaryLines} />
      </div>
    </main>
  );
}
