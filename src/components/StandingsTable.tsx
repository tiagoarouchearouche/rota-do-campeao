"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Trophy, ShieldAlert, TriangleAlert } from "lucide-react";
import type { TeamStanding } from "@/services/sportsData/types";

const ROW_STYLES: Record<string, string> = {
  title_race: "border-l-4 border-success bg-success/5",
  qualification_zone: "border-l-4 border-blue-400 bg-blue-400/5",
  mid_table: "border-l-4 border-transparent",
  relegation_risk: "border-l-4 border-warning bg-warning/5",
  relegation_zone: "border-l-4 border-danger bg-danger/5",
};

const ZONE_ICON: Partial<Record<string, typeof Trophy>> = {
  title_race: Trophy,
  relegation_risk: TriangleAlert,
  relegation_zone: ShieldAlert,
};

const LEGEND: { status: string; label: string; className: string }[] = [
  { status: "title_race", label: "Título / classificação principal", className: "bg-success" },
  { status: "qualification_zone", label: "Classificação", className: "bg-blue-400" },
  { status: "relegation_risk", label: "Risco de rebaixamento", className: "bg-warning" },
  { status: "relegation_zone", label: "Rebaixamento", className: "bg-danger" },
];

/** Internal form letters follow the provider convention (W/D/L in English) — translate only for display. */
const FORM_LABEL_PT: Record<string, string> = { W: "V", D: "E", L: "D" };

function FormBadges({ form }: { form?: string }) {
  if (!form) return <span className="text-muted-2">—</span>;
  return (
    <div className="flex gap-0.5" aria-label={`Últimos resultados: ${form}`}>
      {form.split("").map((letter, index) => (
        <span
          key={index}
          className={`flex h-5 w-5 items-center justify-center rounded-sm text-[10px] font-bold text-ink ${
            letter === "W" ? "bg-success" : letter === "D" ? "bg-muted-2" : "bg-danger"
          }`}
        >
          {FORM_LABEL_PT[letter] ?? letter}
        </span>
      ))}
    </div>
  );
}

function ZoneIcon({ status }: { status?: string }) {
  const Icon = status ? ZONE_ICON[status] : undefined;
  if (!Icon) return null;
  return <Icon size={12} className="shrink-0" aria-hidden="true" />;
}

export function StandingsTable({
  standings,
  competitionId,
}: {
  standings: TeamStanding[];
  competitionId: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {/* Desktop / tablet: full table, primeiras duas colunas fixas durante rolagem horizontal */}
      <div className="hidden overflow-x-auto rounded-md border border-border sm:block">
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">Tabela de classificação</caption>
          <thead className="bg-graphite text-left text-xs uppercase text-muted">
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-graphite px-3 py-2">
                #
              </th>
              <th scope="col" className="sticky left-8 z-10 bg-graphite px-3 py-2">
                Time
              </th>
              <th scope="col" className="px-3 py-2 text-center font-bold">
                PTS
              </th>
              <th scope="col" className="px-3 py-2 text-center">
                J
              </th>
              <th scope="col" className="px-3 py-2 text-center">
                V
              </th>
              <th scope="col" className="px-3 py-2 text-center">
                E
              </th>
              <th scope="col" className="px-3 py-2 text-center">
                D
              </th>
              <th scope="col" className="px-3 py-2 text-center">
                GP
              </th>
              <th scope="col" className="px-3 py-2 text-center">
                GC
              </th>
              <th scope="col" className="px-3 py-2 text-center">
                SG
              </th>
              <th scope="col" className="px-3 py-2 text-center">
                %
              </th>
              <th scope="col" className="px-3 py-2">
                Últimos
              </th>
              <th scope="col" className="px-3 py-2">
                Próx.
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team) => (
              <tr key={team.teamId} className={`${ROW_STYLES[team.status ?? "mid_table"]} border-b border-border last:border-0`}>
                <td className="sticky left-0 z-10 bg-ink px-3 py-2 font-medium">
                  <span className="flex items-center gap-1">
                    {team.position}
                    <ZoneIcon status={team.status} />
                  </span>
                </td>
                <td className="sticky left-8 z-10 bg-ink px-3 py-2">
                  <Link href={`/competicao/${competitionId}/time/${team.teamId}`} className="font-medium hover:text-lime hover:underline">
                    {team.teamName}
                  </Link>
                </td>
                <td className="px-3 py-2 text-center font-bold">{team.points}</td>
                <td className="px-3 py-2 text-center text-muted">{team.played}</td>
                <td className="px-3 py-2 text-center text-muted">{team.wins}</td>
                <td className="px-3 py-2 text-center text-muted">{team.draws}</td>
                <td className="px-3 py-2 text-center text-muted">{team.losses}</td>
                <td className="px-3 py-2 text-center text-muted">{team.goalsFor}</td>
                <td className="px-3 py-2 text-center text-muted">{team.goalsAgainst}</td>
                <td className="px-3 py-2 text-center text-muted">{team.goalDifference}</td>
                <td className="px-3 py-2 text-center text-muted">{team.percentage ?? "—"}%</td>
                <td className="px-3 py-2">
                  <FormBadges form={team.form} />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-muted">{team.nextMatch ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards com posição/time/pontos/jogos/saldo visíveis; resto atrás de um toggle */}
      <ul className="flex flex-col gap-2 sm:hidden">
        {standings.map((team) => {
          const isOpen = expanded === team.teamId;
          return (
            <li key={team.teamId} className={`rounded-md border border-border ${ROW_STYLES[team.status ?? "mid_table"]}`}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : team.teamId)}
                aria-expanded={isOpen}
                aria-controls={`team-details-${team.teamId}`}
                className="flex w-full items-center justify-between gap-2 p-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface text-xs font-bold">
                    {team.position}
                  </span>
                  <span className="font-semibold text-white">{team.teamName}</span>
                  <ZoneIcon status={team.status} />
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <span className="text-xs">
                    {team.played}J · SG {team.goalDifference}
                  </span>
                  <span className="text-lg font-bold text-white">{team.points}</span>
                  <ChevronDown size={16} className={`transition ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </div>
              </button>

              {isOpen && (
                <div id={`team-details-${team.teamId}`} className="flex flex-col gap-2 border-t border-border p-3 text-xs text-muted">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      {team.wins}V {team.draws}E {team.losses}D
                    </span>
                    <span>
                      GP {team.goalsFor} · GC {team.goalsAgainst}
                    </span>
                    <span>{team.percentage ?? "—"}% de aproveitamento</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <FormBadges form={team.form} />
                    <span>{team.nextMatch ?? "Próximo jogo a definir"}</span>
                  </div>
                  <Link
                    href={`/competicao/${competitionId}/time/${team.teamId}`}
                    className="mt-1 self-start rounded-md bg-lime px-3 py-1.5 text-xs font-bold text-ink"
                  >
                    Analisar este time
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
        {LEGEND.map((item) => (
          <span key={item.status} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${item.className}`} aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
