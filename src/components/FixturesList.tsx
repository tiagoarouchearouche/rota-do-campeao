import type { Fixture } from "@/services/sportsData/types";

function groupByRound(fixtures: Fixture[]): [string, Fixture[]][] {
  const groups = new Map<string, Fixture[]>();
  for (const fixture of fixtures) {
    const key = fixture.round ?? "Sem rodada";
    groups.set(key, [...(groups.get(key) ?? []), fixture]);
  }
  return Array.from(groups.entries());
}

function FixtureRow({ fixture }: { fixture: Fixture }) {
  const isFinished = fixture.status === "finished";
  const date = new Date(fixture.date);
  const formattedDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-3 py-2 text-sm last:border-0 dark:border-neutral-900">
      <span className="flex-1 truncate text-right">{fixture.homeTeamName}</span>
      {isFinished ? (
        <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-bold dark:bg-neutral-800">
          {fixture.homeGoals} - {fixture.awayGoals}
        </span>
      ) : (
        <span className="shrink-0 rounded-md border border-neutral-200 px-2 py-0.5 text-xs text-neutral-500 dark:border-neutral-700">
          {fixture.status === "live" ? "AO VIVO" : formattedDate}
        </span>
      )}
      <span className="flex-1 truncate">{fixture.awayTeamName}</span>
    </div>
  );
}

export function FixturesList({ fixtures }: { fixtures: Fixture[] }) {
  const rounds = groupByRound(fixtures);

  return (
    <div className="flex flex-col gap-4">
      {rounds.map(([round, roundFixtures]) => (
        <div key={round} className="rounded-lg border border-neutral-200 dark:border-neutral-800">
          <h3 className="border-b border-neutral-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-900 dark:text-neutral-400">
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
