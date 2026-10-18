"use client";

import { useMemo, useState } from "react";
import type { Fixture, TeamStanding } from "@/services/sportsData/types";
import { calculateMaximumPossiblePoints } from "@/services/sportsData/calculations/pathEngine";
import { TeamLogo } from "@/components/TeamLogo";

function ComparisonRow({ label, a, b }: { label: string; a: string | number; b: string | number }) {
  return (
    <div className="grid grid-cols-3 items-center gap-2 border-b border-border py-2 text-sm last:border-0">
      <span className="text-right font-semibold text-white">{a}</span>
      <span className="text-center text-xs uppercase text-muted-2">{label}</span>
      <span className="text-left font-semibold text-white">{b}</span>
    </div>
  );
}

function remainingGamesFor(team: TeamStanding, fixtures: Fixture[]): number {
  return fixtures.filter((f) => f.status !== "finished" && (f.homeTeamId === team.teamId || f.awayTeamId === team.teamId)).length;
}

export function TeamComparison({ standings, fixtures }: { standings: TeamStanding[]; fixtures: Fixture[] }) {
  const [teamAId, setTeamAId] = useState<string>(standings[0]?.teamId ?? "");
  const [teamBId, setTeamBId] = useState<string>(standings[1]?.teamId ?? "");

  const teamA = standings.find((t) => t.teamId === teamAId) ?? null;
  const teamB = standings.find((t) => t.teamId === teamBId) ?? null;

  const remainingA = useMemo(() => (teamA ? remainingGamesFor(teamA, fixtures) : 0), [teamA, fixtures]);
  const remainingB = useMemo(() => (teamB ? remainingGamesFor(teamB, fixtures) : 0), [teamB, fixtures]);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-bold uppercase text-white">Comparar times</h2>

      <div className="grid grid-cols-2 gap-3">
        <select
          value={teamAId}
          onChange={(event) => setTeamAId(event.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-white"
          aria-label="Time A"
        >
          {standings.map((team) => (
            <option key={team.teamId} value={team.teamId}>
              {team.teamName}
            </option>
          ))}
        </select>
        <select
          value={teamBId}
          onChange={(event) => setTeamBId(event.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-white"
          aria-label="Time B"
        >
          {standings.map((team) => (
            <option key={team.teamId} value={team.teamId}>
              {team.teamName}
            </option>
          ))}
        </select>
      </div>

      {teamA && teamB && (
        <div className="rounded-md border border-border bg-graphite p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex flex-col items-center gap-2">
              <TeamLogo team={teamA.teamName} size="lg" />
              <span className="font-display font-bold uppercase text-white">{teamA.teamName}</span>
            </div>
            <span className="font-display text-sm text-muted-2">×</span>
            <div className="flex flex-col items-center gap-2">
              <TeamLogo team={teamB.teamName} size="lg" />
              <span className="font-display font-bold uppercase text-white">{teamB.teamName}</span>
            </div>
          </div>

          <ComparisonRow label="Posição" a={`${teamA.position}º`} b={`${teamB.position}º`} />
          <ComparisonRow label="Pontos" a={teamA.points} b={teamB.points} />
          <ComparisonRow label="Jogos" a={teamA.played} b={teamB.played} />
          <ComparisonRow label="Vitórias" a={teamA.wins} b={teamB.wins} />
          <ComparisonRow label="Empates" a={teamA.draws} b={teamB.draws} />
          <ComparisonRow label="Derrotas" a={teamA.losses} b={teamB.losses} />
          <ComparisonRow label="Saldo" a={teamA.goalDifference} b={teamB.goalDifference} />
          <ComparisonRow label="Últimos 5" a={teamA.form ?? "—"} b={teamB.form ?? "—"} />
          <ComparisonRow label="Jogos restantes" a={remainingA} b={remainingB} />
          <ComparisonRow
            label="Pontos disponíveis"
            a={calculateMaximumPossiblePoints(teamA, fixtures) - teamA.points}
            b={calculateMaximumPossiblePoints(teamB, fixtures) - teamB.points}
          />
        </div>
      )}
    </section>
  );
}
