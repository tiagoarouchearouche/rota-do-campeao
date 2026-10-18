import { Flame, TriangleAlert, Globe2 } from "lucide-react";
import type { Fixture } from "@/services/sportsData/types";
import { getMatchDisplayStatus } from "@/services/sportsData/calculations/matchHelpers";
import { TeamLogo } from "@/components/TeamLogo";

export type MatchBadge = { icon: typeof Flame; label: string; tone: string } | null;

function formatDateTime(date: Date): string {
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).toUpperCase().replace(".", "");
  const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
  return `${weekday} • ${time}`;
}

export function MatchCard({ fixture, badge }: { fixture: Fixture; badge?: MatchBadge }) {
  const display = getMatchDisplayStatus(fixture);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-graphite p-4">
      {badge && (
        <span className={`inline-flex items-center gap-1.5 self-start rounded-md px-2 py-1 text-[11px] font-semibold uppercase ${badge.tone}`}>
          <badge.icon size={12} aria-hidden="true" />
          {badge.label}
        </span>
      )}

      <p className="text-xs text-muted-2">
        {display.kind === "live" ? (
          <span className="inline-flex items-center gap-1.5 text-danger">
            <span className="h-1.5 w-1.5 rounded-full bg-danger" aria-hidden="true" />
            AO VIVO
          </span>
        ) : display.kind === "postponed" ? (
          <span className="text-warning">Adiada — nova data a definir</span>
        ) : display.kind === "scheduled" ? (
          formatDateTime(display.date)
        ) : null}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
          <TeamLogo team={fixture.homeTeamName} size="md" />
          <span className="truncate text-sm font-medium text-white">{fixture.homeTeamName}</span>
        </div>

        <div className="shrink-0 px-2 text-center">
          {display.kind === "finished" || display.kind === "live" ? (
            <span className="font-display text-lg font-bold text-white">
              {fixture.homeGoals ?? 0} - {fixture.awayGoals ?? 0}
            </span>
          ) : (
            <span className="text-sm text-muted-2">×</span>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
          <TeamLogo team={fixture.awayTeamName} size="md" />
          <span className="truncate text-sm font-medium text-white">{fixture.awayTeamName}</span>
        </div>
      </div>
    </div>
  );
}

export const MATCH_BADGE_ICONS = { Flame, TriangleAlert, Globe2 };
