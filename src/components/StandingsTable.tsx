"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Trophy, ShieldAlert, TriangleAlert } from "lucide-react";
import type { Competition, TeamStanding } from "@/services/sportsData/types";
import { getZoneBand, ZONE_LEGEND, type ZoneTone } from "@/services/sportsData/calculations/classificationZones";
import { getTeamUrl } from "@/lib/teamSlug";
import { TeamLogo } from "@/components/TeamLogo";

const TONE_STYLES: Record<ZoneTone, string> = {
  title: "border-l-4 border-success bg-success/5",
  libertadores: "border-l-4 border-success bg-success/5",
  "pre-libertadores": "border-l-4 border-info bg-info/5",
  sula: "border-l-4 border-sula bg-sula/5",
  neutral: "border-l-4 border-transparent",
  relegation: "border-l-4 border-danger bg-danger/5",
};

const TONE_SWATCH: Record<ZoneTone, string> = {
  title: "bg-success",
  libertadores: "bg-success",
  "pre-libertadores": "bg-info",
  sula: "bg-sula",
  neutral: "bg-muted-2",
  relegation: "bg-danger",
};

/** Internal form letters follow the provider convention (W/D/L in English) — translate only for display. */
const FORM_LABEL_PT: Record<string, string> = { W: "V", D: "E", L: "D" };

function FormBadges({ form }: { form?: string }) {
  if (!form) return <span className="text-muted-2">—</span>;
  return (
    <div className="flex gap-0.5" aria-label={`Últimos resultados: ${form}`}>
      {form.split("").map((letter, index) => (
        <span
          key={index}
          title={letter === "W" ? "Vitória" : letter === "D" ? "Empate" : "Derrota"}
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

function ZoneIcon({ position, tone, status }: { position: number; tone: ZoneTone | null; status?: string }) {
  if (position === 1) return <Trophy size={12} className="shrink-0" aria-hidden="true" />;
  if (tone === "relegation") return <ShieldAlert size={12} className="shrink-0" aria-hidden="true" />;
  if (status === "relegation_risk") return <TriangleAlert size={12} className="shrink-0" aria-hidden="true" />;
  return null;
}

export function StandingsTable({
  standings,
  competition,
  myTeamId,
}: {
  standings: TeamStanding[];
  competition: Competition;
  myTeamId?: string | null;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const totalTeams = standings.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Desktop / tablet: full table, primeiras duas colunas fixas durante rolagem horizontal, cabeçalho sticky ao rolar a página */}
      <div className="hidden overflow-x-auto rounded-md border border-border sm:block">
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">Tabela de classificação do Brasileirão Série A</caption>
          <thead className="sticky top-0 z-20 bg-graphite text-left text-xs uppercase text-muted">
            <tr>
              <th scope="col" className="sticky left-0 z-20 bg-graphite px-3 py-2">
                #
              </th>
              <th scope="col" className="sticky left-8 z-20 bg-graphite px-3 py-2">
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
            {standings.map((team) => {
              const band = getZoneBand(team.position, totalTeams, competition);
              const tone = band?.tone ?? null;
              const isMyTeam = myTeamId === team.teamId;
              return (
                <tr
                  key={team.teamId}
                  className={`${tone ? TONE_STYLES[tone] : TONE_STYLES.neutral} border-b border-border last:border-0 ${
                    isMyTeam ? "bg-lime/10" : ""
                  }`}
                >
                  <td className="sticky left-0 z-10 bg-ink px-3 py-2 font-medium">
                    <span className="flex items-center gap-1">
                      {team.position}
                      <ZoneIcon position={team.position} tone={tone} status={team.status} />
                    </span>
                  </td>
                  <td className="sticky left-8 z-10 bg-ink px-3 py-2">
                    <Link href={getTeamUrl(team.teamName)} className="flex items-center gap-2 font-medium hover:text-lime hover:underline">
                      <TeamLogo team={team.teamName} size="sm" />
                      {team.teamName}
                      {isMyTeam && <span className="rounded-sm bg-lime px-1.5 py-0.5 text-[10px] font-bold text-ink">SEU TIME</span>}
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards com posição/time/jogos/saldo/pontos visíveis; resto atrás de um toggle */}
      <ul className="flex flex-col gap-2 sm:hidden">
        {standings.map((team) => {
          const isOpen = expanded === team.teamId;
          const band = getZoneBand(team.position, totalTeams, competition);
          const tone = band?.tone ?? null;
          const isMyTeam = myTeamId === team.teamId;
          return (
            <li
              key={team.teamId}
              className={`rounded-md border border-border ${tone ? TONE_STYLES[tone] : TONE_STYLES.neutral} ${
                isMyTeam ? "bg-lime/10" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : team.teamId)}
                aria-expanded={isOpen}
                aria-controls={`team-details-${team.teamId}`}
                className="flex w-full items-center justify-between gap-2 p-3 text-left"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface text-xs font-bold">
                    {team.position}
                  </span>
                  <TeamLogo team={team.teamName} size="sm" />
                  <span className="truncate font-semibold text-white">{team.teamName}</span>
                  <ZoneIcon position={team.position} tone={tone} status={team.status} />
                </div>
                <div className="flex shrink-0 items-center gap-2 text-muted">
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
                  <Link href={getTeamUrl(team.teamName)} className="mt-1 self-start rounded-md bg-lime px-3 py-1.5 text-xs font-bold text-ink">
                    Analisar este time
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
        {ZONE_LEGEND.map((item) => (
          <span key={item.tone} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${TONE_SWATCH[item.tone]}`} aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
