"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { ScenarioName, TeamPathResponse } from "@/services/sportsData/types";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { LastUpdatedInfo } from "@/components/LastUpdatedInfo";
import { RefreshDataButton } from "@/components/RefreshDataButton";
import { ApiWarningBanner } from "@/components/ApiWarningBanner";
import { DataStatusPanel } from "@/components/DataStatusPanel";
import { PathAnalysisCard } from "@/components/PathAnalysisCard";
import { ShareButtons } from "@/components/ShareButtons";
import { buildTeamShareUrl } from "@/lib/shareState";
import { setLastTeamId, getScenarioPreference, setScenarioPreference } from "@/lib/userPreferences";

const SCENARIO_TABS: { key: ScenarioName; label: string }[] = [
  { key: "optimistic", label: "Otimista" },
  { key: "realistic", label: "Realista" },
  { key: "pessimistic", label: "Pessimista" },
];

export default function TeamPathPage() {
  const params = useParams<{ competitionId: string; teamId: string }>();
  const { competitionId, teamId } = params;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [teamPath, setTeamPath] = useState<TeamPathResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState<ScenarioName>(
    (searchParams.get("scenario") as ScenarioName) || getScenarioPreference() || "realistic"
  );

  const load = useCallback(
    async (refresh: boolean) => {
      const suffix = refresh ? "&refresh=true" : "";
      const res = await fetch(`/api/team-path?competitionId=${competitionId}&teamId=${teamId}${suffix}`);
      const json = await res.json();
      setTeamPath(json);
      setLoading(false);
    },
    [competitionId, teamId]
  );

  useEffect(() => {
    setLastTeamId(teamId);
    // Standard async data-fetching-in-effect pattern (state is only set after the network
    // await resolves); the state comes from `fetch`, not a synchronous derivation.
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

  if (loading && !teamPath) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <p className="text-neutral-500">Carregando análise do time...</p>
      </main>
    );
  }

  if (!teamPath) return null;

  const { team, competition, scenarios, pathToTitle, pathToQualification, pathToAvoidRelegation, decisiveMatches } =
    teamPath;
  const activeScenario = scenarios[scenario];

  const summaryLines = [
    `${team.teamName} está na ${team.position}ª posição com ${team.points} pontos.`,
    pathToTitle.message,
    pathToQualification.message,
    ...(pathToAvoidRelegation ? [pathToAvoidRelegation.message] : []),
    `Cenário ${scenario}: ${activeScenario.message}`,
  ];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10 pb-24 sm:pb-10">
      <div>
        <Link href={`/competicao/${competitionId}`} className="text-sm text-neutral-500 hover:underline">
          ← {competition.name}
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">{team.teamName}</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {team.position}ª posição · {team.points} pontos · {team.wins}V {team.draws}E {team.losses}D
          {team.percentage !== undefined && ` · ${team.percentage}% de aproveitamento`}
        </p>
        {team.nextMatch && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Próximo jogo: {team.nextMatch}</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <DataSourceBadge source={teamPath.source} />
          <LastUpdatedInfo updatedAt={teamPath.updatedAt} />
          <RefreshDataButton onRefresh={() => load(true)} />
        </div>
        <ApiWarningBanner isMock={teamPath.isMock} showTechnicalStatus={teamPath.showTechnicalStatus} />
        <DataStatusPanel
          source={teamPath.source}
          updatedAt={teamPath.updatedAt}
          isMock={teamPath.isMock}
          cached={teamPath.cached}
          competition={competition}
          showTechnicalStatus={teamPath.showTechnicalStatus}
        />
      </header>

      {teamPath.otherCompetitions && teamPath.otherCompetitions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {team.teamName} também está em
          </h2>
          <div className="flex flex-wrap gap-2">
            {teamPath.otherCompetitions.map((c) => (
              <Link
                key={c.competitionId}
                href={`/competicao/${c.competitionId}/time/${team.teamId}`}
                className="rounded-md border border-neutral-200 px-3 py-2 text-sm hover:border-emerald-500 hover:text-emerald-700 dark:border-neutral-800 dark:hover:border-emerald-600 dark:hover:text-emerald-400"
              >
                {c.name} · Simular
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <PathAnalysisCard analysis={pathToTitle} />
        <PathAnalysisCard analysis={pathToQualification} />
        {pathToAvoidRelegation && <PathAnalysisCard analysis={pathToAvoidRelegation} />}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Cenários
        </h2>
        <div className="flex gap-2">
          {SCENARIO_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => selectScenario(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                scenario === tab.key
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{activeScenario.message}</p>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-neutral-500">Pontos projetados</dt>
              <dd className="font-semibold">{activeScenario.projectedPoints}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Posição projetada</dt>
              <dd className="font-semibold">{activeScenario.projectedPosition}ª</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Jogos simulados</dt>
              <dd className="font-semibold">{activeScenario.simulatedFixtures.length}</dd>
            </div>
          </dl>
        </div>
      </section>

      {decisiveMatches.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Confrontos decisivos
          </h2>
          <ul className="flex flex-col gap-2">
            {decisiveMatches.map((fixture) => (
              <li
                key={fixture.fixtureId}
                className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
              >
                <span>
                  {fixture.homeTeamName} x {fixture.awayTeamName}
                </span>
                <span className="text-xs text-neutral-500">{fixture.round}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Compartilhar
        </h2>
        <ShareButtons
          shareUrl={shareUrl}
          teamName={team.teamName}
          competitionName={competition.name}
          summaryLines={summaryLines}
        />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur sm:hidden dark:border-neutral-800 dark:bg-neutral-950/95">
        <ShareButtons
          shareUrl={shareUrl}
          teamName={team.teamName}
          competitionName={competition.name}
          summaryLines={summaryLines}
        />
      </div>
    </main>
  );
}
