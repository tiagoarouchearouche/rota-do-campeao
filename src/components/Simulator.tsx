"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { Competition, Fixture, TeamStanding } from "@/services/sportsData/types";
import { applySimulatedResults, type MatchOverride } from "@/services/sportsData/calculations/tableSimulator";
import { StandingsTable } from "@/components/StandingsTable";
import { TeamLogo } from "@/components/TeamLogo";

const OPTIONS: { value: MatchOverride; label: (home: string, away: string) => string }[] = [
  { value: "home", label: (home) => home },
  { value: "draw", label: () => "Empate" },
  { value: "away", label: (_home, away) => away },
];

export function Simulator({
  standings,
  fixtures,
  competition,
  myTeamId,
}: {
  standings: TeamStanding[];
  fixtures: Fixture[];
  competition: Competition;
  myTeamId?: string | null;
}) {
  const [overrides, setOverrides] = useState<Record<string, MatchOverride>>({});
  const remaining = useMemo(() => fixtures.filter((f) => f.status !== "finished"), [fixtures]);

  const simulatedStandings = useMemo(
    () => applySimulatedResults(standings, fixtures, overrides),
    [standings, fixtures, overrides]
  );

  const hasOverrides = Object.keys(overrides).length > 0;

  function setResult(fixtureId: string, value: MatchOverride) {
    setOverrides((prev) => ({ ...prev, [fixtureId]: value }));
  }

  return (
    <section id="simular" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold uppercase text-white">Simular campeonato</h2>
        {hasOverrides && (
          <button
            type="button"
            onClick={() => setOverrides({})}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-white hover:bg-surface"
          >
            <RotateCcw size={14} aria-hidden="true" />
            Resetar simulação
          </button>
        )}
      </div>
      <p className="text-sm text-muted">
        Escolha o resultado dos jogos restantes e veja a classificação recalculada na hora. Isso não altera os dados
        reais — é só um exercício de cenários.
      </p>

      <div className="flex flex-col gap-2">
        {remaining.map((fixture) => {
          const current = overrides[fixture.fixtureId];
          return (
            <div
              key={fixture.fixtureId}
              className="flex flex-col gap-2 rounded-md border border-border bg-graphite p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2 text-sm text-white">
                <TeamLogo team={fixture.homeTeamName} size="sm" />
                <span className="truncate">{fixture.homeTeamName}</span>
                <span className="text-muted-2">×</span>
                <span className="truncate">{fixture.awayTeamName}</span>
                <TeamLogo team={fixture.awayTeamName} size="sm" />
              </div>
              <div className="flex gap-1.5">
                {OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setResult(fixture.fixtureId, option.value)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                      current === option.value
                        ? "border-lime bg-lime text-ink"
                        : "border-border text-muted hover:text-white"
                    }`}
                  >
                    {option.label(fixture.homeTeamName, fixture.awayTeamName)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {remaining.length === 0 && <p className="text-sm text-muted">Não há jogos restantes para simular.</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Classificação atual</h3>
          <StandingsTable standings={standings} competition={competition} myTeamId={myTeamId} />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Classificação simulada</h3>
          <StandingsTable standings={simulatedStandings} competition={competition} myTeamId={myTeamId} />
        </div>
      </div>
    </section>
  );
}
