import type { Fixture } from "@/services/sportsData/types";
import { getMatchDisplayStatus } from "@/services/sportsData/calculations/matchHelpers";
import { TeamLogo } from "@/components/TeamLogo";

function groupByRound(fixtures: Fixture[]): [string, Fixture[]][] {
  const groups = new Map<string, Fixture[]>();
  for (const fixture of fixtures) {
    const key = fixture.round ?? "Sem rodada";
    groups.set(key, [...(groups.get(key) ?? []), fixture]);
  }
  return Array.from(groups.entries());
}

function FixtureRow({ fixture }: { fixture: Fixture }) {
  const display = getMatchDisplayStatus(fixture);
  const formattedDate =
    display.kind === "scheduled" ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(display.date) : null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5 text-sm last:border-0">
      <span className="flex flex-1 items-center justify-end gap-2 truncate text-right text-white">
        {fixture.homeTeamName}
        <TeamLogo team={fixture.homeTeamName} size="sm" />
      </span>
      {display.kind === "finished" ? (
        <span className="shrink-0 rounded-md bg-surface px-2 py-0.5 text-xs font-bold text-white">
          {display.homeGoals} - {display.awayGoals}
        </span>
      ) : display.kind === "postponed" ? (
        <span className="shrink-0 whitespace-nowrap rounded-md border border-warning/30 px-2 py-0.5 text-xs text-warning">
          Adiada
        </span>
      ) : (
        <span className="shrink-0 rounded-md border border-border px-2 py-0.5 text-xs text-muted">
          {display.kind === "live" ? "AO VIVO" : formattedDate}
        </span>
      )}
      <span className="flex flex-1 items-center gap-2 truncate text-white">
        <TeamLogo team={fixture.awayTeamName} size="sm" />
        {fixture.awayTeamName}
      </span>
    </div>
  );
}

export function FixturesList({ fixtures }: { fixtures: Fixture[] }) {
  const rounds = groupByRound(fixtures);

  if (fixtures.length === 0) {
    return <p className="text-sm text-muted">Nenhum jogo disponível para esta competição no momento.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {rounds.map(([round, roundFixtures]) => (
        <div key={round} className="rounded-md border border-border">
          <h3 className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {round}
          </h3>
          {roundFixtures.map((fixture) => (
            <FixtureRow key={fixture.fixtureId} fixture={fixture} />
          ))}
        </div>
      ))}
    </div>
  );
}
