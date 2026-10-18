"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trophy, Globe2, ShieldAlert, ArrowLeft } from "lucide-react";
import type { ScenarioName, TeamPathResponse } from "@/services/sportsData/types";
import type { ApiErrorBody } from "@/lib/apiErrors";
import { getScenarioPreference, setLastTeamId, setScenarioPreference } from "@/lib/userPreferences";
import { buildTeamShareUrl } from "@/lib/shareState";
import { getZoneBand } from "@/services/sportsData/calculations/classificationZones";
import { BRASILEIRAO_COMPETITION_ID } from "@/services/sportsData/competitions/competitionRegistry";
import { TeamLogo } from "@/components/TeamLogo";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { ApiWarningBanner } from "@/components/ApiWarningBanner";
import { DataStatusPanel } from "@/components/DataStatusPanel";
import { PathAnalysisCard } from "@/components/PathAnalysisCard";
import { ShareButtons } from "@/components/ShareButtons";
import { AdSlot } from "@/components/AdSlot";
import { FixturesList } from "@/components/FixturesList";

const SCENARIO_TABS: { key: ScenarioName; label: string; explanation: string }[] = [
  { key: "optimistic", label: "Otimista", explanation: "Boa parte das vitórias restantes se confirma." },
  { key: "realistic", label: "Realista", explanation: "Mantém o aproveitamento médio atual do time." },
  { key: "pessimistic", label: "Pessimista", explanation: "Poucos resultados positivos nos jogos restantes." },
];

const ERROR_COPY: Record<string, { title: string; body: string }> = {
  competition_not_found: {
    title: "Competição não encontrada",
    body: "Não encontramos essa competição. Volte para a home e tente novamente.",
  },
  team_not_found: {
    title: "Time não encontrado",
    body: "Não encontramos esse time no Brasileirão Série A.",
  },
  network_error: {
    title: "Falha de conexão",
    body: "Não foi possível carregar os dados agora. Verifique sua conexão e tente novamente.",
  },
  internal_error: {
    title: "Algo deu errado",
    body: "Não foi possível calcular a análise agora. Tente novamente em alguns instantes.",
  },
};

type LoadState =
  | { status: "loading" }
  | { status: "success"; data: TeamPathResponse }
  | { status: "error"; code: string; message: string };

function resolveHeadline(status: string | undefined, tone: string | null): string {
  if (status === "relegation_zone" || status === "relegation_risk") return "Rota para escapar do rebaixamento";
  if (status === "title_race") return "Rota para o título";
  if (tone === "sula") return "Rota para a Sul-Americana";
  if (tone === "libertadores" || tone === "pre-libertadores") return "Rota para a Libertadores";
  return "Rota do campeão";
}

type HeadlineIconKey = "relegation" | "continental" | "title";

function resolveHeadlineIconKey(status: string | undefined, tone: string | null): HeadlineIconKey {
  if (status === "relegation_zone" || status === "relegation_risk") return "relegation";
  if (tone === "sula" || tone === "libertadores" || tone === "pre-libertadores") return "continental";
  return "title";
}

export function TeamPathClient({ teamId }: { teamId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [scenario, setScenario] = useState<ScenarioName>(() => {
    const fromUrl = searchParams.get("scenario");
    if (fromUrl === "optimistic" || fromUrl === "realistic" || fromUrl === "pessimistic") return fromUrl;
    return getScenarioPreference() ?? "realistic";
  });
  const [showShare, setShowShare] = useState(false);

  const load = useCallback(
    async (refresh: boolean) => {
      setState({ status: "loading" });
      try {
        const res = await fetch(
          `/api/team-path?competitionId=${BRASILEIRAO_COMPETITION_ID}&teamId=${teamId}${refresh ? "&refresh=true" : ""}`
        );
        const json = await res.json();
        if (!res.ok || "error" in json) {
          const errorBody = json as ApiErrorBody;
          setState({ status: "error", code: errorBody.error ?? "internal_error", message: errorBody.message ?? "" });
          return;
        }
        setState({ status: "success", data: json as TeamPathResponse });
      } catch {
        setState({ status: "error", code: "network_error", message: "" });
      }
    },
    [teamId]
  );

  useEffect(() => {
    setLastTeamId(teamId);
    // Legitimate fetch-on-param-change: `load`'s first statement sets a "loading" status
    // synchronously, which the static analyzer treats as "setState in an effect" even though
    // this is the standard data-fetching-in-effect pattern (no prop/state is being mirrored).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(false);
  }, [teamId, load]);

  function selectScenario(next: ScenarioName) {
    setScenario(next);
    setScenarioPreference(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("scenario", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const shareUrl = useMemo(() => {
    if (state.status !== "success" || typeof window === "undefined") return "";
    return buildTeamShareUrl({ origin: window.location.origin, teamId, season: state.data.competition.season, scenario });
  }, [state, teamId, scenario]);

  if (state.status === "loading") {
    return (
      <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10" aria-busy="true" aria-live="polite">
        <span className="sr-only">Carregando análise do time...</span>
        <div className="flex flex-col gap-4">
          <div className="h-6 w-48 animate-pulse rounded bg-surface" />
          <div className="h-10 w-72 animate-pulse rounded bg-surface" />
          <div className="h-40 w-full animate-pulse rounded bg-surface" />
          <div className="h-40 w-full animate-pulse rounded bg-surface" />
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    const copy = ERROR_COPY[state.code] ?? ERROR_COPY.internal_error;
    return (
      <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-4 px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-white">{copy.title}</h1>
        <p className="text-sm text-muted">{state.message || copy.body}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => load(true)} className="rounded-md bg-lime px-4 py-2 text-sm font-bold text-ink">
            Tentar novamente
          </button>
          <Link href="/" className="rounded-md border border-border px-4 py-2 text-sm font-bold text-white hover:bg-surface">
            Voltar ao início
          </Link>
          <Link href="/#meu-time" className="rounded-md border border-border px-4 py-2 text-sm font-bold text-white hover:bg-surface">
            Escolher outro time
          </Link>
        </div>
      </main>
    );
  }

  const { team, competition, standings, fixtures, pathToTitle, pathToQualification, pathToAvoidRelegation, decisiveMatches, scenarios } =
    state.data;
  const band = getZoneBand(team.position, standings.length, competition);
  const headline = resolveHeadline(team.status, band?.tone ?? null);
  const headlineIconKey = resolveHeadlineIconKey(team.status, band?.tone ?? null);
  const upcoming = fixtures.filter((f) => f.status !== "finished").slice(0, 5);
  const activeScenario = scenarios[scenario];

  const summaryLines = [
    `${team.position}º lugar · ${team.points} pts`,
    headline,
    pathToAvoidRelegation?.message ?? pathToQualification.message,
  ];

  return (
    <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
        <ArrowLeft size={14} aria-hidden="true" />
        Voltar à classificação
      </Link>

      <div className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <TeamLogo team={team.teamName} size="lg" />
          <div>
            <h1 className="font-display text-2xl font-bold uppercase text-white sm:text-3xl">{team.teamName}</h1>
            <p className="text-sm text-muted">
              {team.position}º colocado · {team.points} pts · {team.played} jogos
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 self-start rounded-md bg-surface px-3 py-1.5 text-sm font-semibold uppercase text-lime">
          {headlineIconKey === "relegation" && <ShieldAlert size={16} aria-hidden="true" />}
          {headlineIconKey === "continental" && <Globe2 size={16} aria-hidden="true" />}
          {headlineIconKey === "title" && <Trophy size={16} aria-hidden="true" />}
          {headline}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <DataSourceBadge source={state.data.source} isMock={state.data.isMock} />
          <button
            type="button"
            onClick={() => setShowShare((v) => !v)}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-white hover:bg-surface"
          >
            Compartilhar
          </button>
        </div>

        <DataStatusPanel
          source={state.data.source}
          updatedAt={state.data.updatedAt}
          isMock={state.data.isMock}
          cached={state.data.cached}
          competition={competition}
          showTechnicalStatus={state.data.showTechnicalStatus}
        />
        <ApiWarningBanner isMock={state.data.isMock} />

        {showShare && shareUrl && (
          <ShareButtons shareUrl={shareUrl} teamName={team.teamName} competitionName={competition.name} summaryLines={summaryLines} />
        )}
      </div>

      <div className="flex flex-col gap-6 py-6">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PathAnalysisCard analysis={pathToTitle} />
          <PathAnalysisCard analysis={pathToQualification} />
          {pathToAvoidRelegation && <PathAnalysisCard analysis={pathToAvoidRelegation} />}
        </section>

        {decisiveMatches.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="font-display text-lg font-bold uppercase text-white">Jogos decisivos</h2>
            <FixturesList fixtures={decisiveMatches} />
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold uppercase text-white">Próximos jogos</h2>
          <FixturesList fixtures={upcoming} />
        </section>

        <AdSlot placement="post-simulation" />

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold uppercase text-white">Cenários</h2>
          <div role="tablist" aria-label="Cenários" className="flex gap-1 border-b border-border">
            {SCENARIO_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={scenario === tab.key}
                onClick={() => selectScenario(tab.key)}
                className={`border-b-2 px-3.5 py-2.5 text-sm font-semibold transition ${
                  scenario === tab.key ? "border-lime text-lime" : "border-transparent text-muted hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-2">{SCENARIO_TABS.find((t) => t.key === scenario)?.explanation}</p>
          <div className="rounded-md border border-border bg-graphite p-4">
            <p className="font-display text-3xl font-bold text-white">
              {activeScenario.projectedPoints} pts <span className="text-sm text-muted">· {activeScenario.projectedPosition}º</span>
            </p>
            <p className="mt-2 text-sm text-muted">{activeScenario.message}</p>
          </div>
        </section>
      </div>

      {shareUrl && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-graphite p-3 sm:hidden">
          <ShareButtons shareUrl={shareUrl} teamName={team.teamName} competitionName={competition.name} summaryLines={summaryLines} />
        </div>
      )}
    </main>
  );
}
