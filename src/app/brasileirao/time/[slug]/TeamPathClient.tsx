"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trophy, Globe2, ShieldAlert, ArrowLeft } from "lucide-react";
import type { ScenarioName, TeamPathResponse } from "@/services/sportsData/types";
import type { TeamPathResult } from "@/services/sportsData/teamPath";
import { getScenarioPreference, setLastTeamId, setScenarioPreference } from "@/lib/userPreferences";
import { buildTeamShareUrl } from "@/lib/shareState";
import { resolveTeamObjective, type TeamObjective } from "@/services/sportsData/calculations/teamObjective";
import { getTeamUpcomingMatches, getTeamPostponedMatches } from "@/services/sportsData/calculations/matchHelpers";
import { getTeamUrl } from "@/lib/teamSlug";
import { BRASILEIRAO_COMPETITION_ID } from "@/services/sportsData/competitions/competitionRegistry";
import { TeamLogo } from "@/components/TeamLogo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TeamSituationText } from "@/components/TeamSituationText";
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

type HeadlineIconKey = "relegation" | "continental" | "title";

function resolveHeadline(objective: TeamObjective): string {
  if (objective === "relegation" || objective === "risk") return "Rota para escapar do rebaixamento";
  if (objective === "title") return "Rota para o título";
  if (objective === "sula") return "Rota para a Sul-Americana";
  if (objective === "libertadores" || objective === "pre-libertadores") return "Rota para a Libertadores";
  return "Rota do campeão";
}

function resolveHeadlineIconKey(objective: TeamObjective): HeadlineIconKey {
  if (objective === "relegation" || objective === "risk") return "relegation";
  if (objective === "sula" || objective === "libertadores" || objective === "pre-libertadores") return "continental";
  return "title";
}

export function TeamPathClient({
  teamId,
  initialResult,
}: {
  teamId: string;
  slug: string;
  initialResult: TeamPathResult;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<TeamPathResult>(initialResult);
  const [scenario, setScenario] = useState<ScenarioName>(() => {
    const fromUrl = searchParams.get("scenario");
    if (fromUrl === "optimistic" || fromUrl === "realistic" || fromUrl === "pessimistic") return fromUrl;
    return getScenarioPreference() ?? "realistic";
  });
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    setLastTeamId(teamId);
  }, [teamId]);

  async function refresh() {
    try {
      const res = await fetch(`/api/team-path?competitionId=${BRASILEIRAO_COMPETITION_ID}&teamId=${teamId}&refresh=true`);
      const json = await res.json();
      if (!res.ok || "error" in json) {
        setResult({ ok: false, code: json.error ?? "internal_error", message: json.message ?? "", status: res.status });
        return;
      }
      setResult({ ok: true, data: json as TeamPathResponse });
    } catch {
      setResult({ ok: false, code: "internal_error", message: "", status: 0 });
    }
  }

  function selectScenario(next: ScenarioName) {
    setScenario(next);
    setScenarioPreference(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("scenario", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const shareUrl = useMemo(() => {
    if (!result.ok || typeof window === "undefined") return "";
    return buildTeamShareUrl({ origin: window.location.origin, teamName: result.data.team.teamName, season: result.data.competition.season, scenario });
  }, [result, scenario]);

  if (!result.ok) {
    const copy = ERROR_COPY[result.code] ?? ERROR_COPY.internal_error;
    return (
      <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-4 px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-white">{copy.title}</h1>
        <p className="text-sm text-muted">{result.message || copy.body}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={refresh} className="rounded-md bg-lime px-4 py-2 text-sm font-bold text-ink">
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
    result.data;
  const objective = resolveTeamObjective(team, standings, competition);
  const headline = resolveHeadline(objective);
  const headlineIconKey = resolveHeadlineIconKey(objective);
  const upcoming = getTeamUpcomingMatches(fixtures, team.teamId, 5);
  const postponed = getTeamPostponedMatches(fixtures, team.teamId);
  const opponents = Array.from(
    new Map(
      upcoming.map((f) => {
        const opponent = f.homeTeamId === team.teamId ? { id: f.awayTeamId, name: f.awayTeamName } : { id: f.homeTeamId, name: f.homeTeamName };
        return [opponent.id, opponent];
      })
    ).values()
  );
  const activeScenario = scenarios[scenario];

  const summaryLines = [
    `${team.position}º lugar · ${team.points} pts`,
    headline,
    pathToAvoidRelegation?.message ?? pathToQualification.message,
  ];

  return (
    <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <Breadcrumbs
        items={[{ name: "Rota do Campeão", path: "/" }, { name: "Brasileirão", path: "/" }, { name: team.teamName }]}
      />

      <Link href="/" className="mb-4 mt-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
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
          <DataSourceBadge source={result.data.source} isMock={result.data.isMock} />
          <button
            type="button"
            onClick={() => setShowShare((v) => !v)}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-white hover:bg-surface"
          >
            Compartilhar
          </button>
        </div>

        <DataStatusPanel
          source={result.data.source}
          updatedAt={result.data.updatedAt}
          isMock={result.data.isMock}
          cached={result.data.cached}
          competition={competition}
          showTechnicalStatus={result.data.showTechnicalStatus}
        />
        <ApiWarningBanner isMock={result.data.isMock} />

        {showShare && shareUrl && (
          <ShareButtons shareUrl={shareUrl} teamName={team.teamName} competitionName={competition.name} summaryLines={summaryLines} />
        )}
      </div>

      <div className="flex flex-col gap-6 py-6">
        <TeamSituationText team={team} standings={standings} fixtures={fixtures} competition={competition} />

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
          {upcoming.length > 0 ? (
            <FixturesList fixtures={upcoming} />
          ) : (
            <p className="text-sm text-muted">Nenhum jogo confirmado no momento.</p>
          )}
          {postponed.length > 0 && (
            <p className="text-xs text-warning">
              {postponed.length} jogo{postponed.length > 1 ? "s" : ""} adiado{postponed.length > 1 ? "s" : ""}, nova data a
              definir.
            </p>
          )}
          {opponents.length > 0 && (
            <p className="text-xs text-muted-2">
              Próximos adversários:{" "}
              {opponents.map((opponent, index) => (
                <span key={opponent.id}>
                  {index > 0 && ", "}
                  <Link href={getTeamUrl(opponent.name)} className="text-white hover:text-lime hover:underline">
                    {opponent.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
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

        <nav aria-label="Links relacionados" className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Link href="/brasileirao/classificacao" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-white hover:bg-surface">
            Ver classificação completa
          </Link>
          <Link href="/brasileirao/simulador" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-white hover:bg-surface">
            Simular Brasileirão
          </Link>
          <Link href="/brasileirao/jogos" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-white hover:bg-surface">
            Ver próxima rodada
          </Link>
        </nav>
      </div>

      {shareUrl && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-graphite p-3 sm:hidden">
          <ShareButtons shareUrl={shareUrl} teamName={team.teamName} competitionName={competition.name} summaryLines={summaryLines} />
        </div>
      )}
    </main>
  );
}
