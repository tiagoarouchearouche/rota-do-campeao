import type { Competition } from "../types";

export type ZoneTone = "title" | "libertadores" | "pre-libertadores" | "sula" | "neutral" | "relegation";

export type ZoneBand = {
  tone: ZoneTone;
  label: string;
};

export const ZONE_LEGEND: { tone: ZoneTone; label: string }[] = [
  { tone: "libertadores", label: "Libertadores" },
  { tone: "pre-libertadores", label: "Pré-Libertadores" },
  { tone: "sula", label: "Sul-Americana" },
  { tone: "relegation", label: "Rebaixamento" },
];

/**
 * Brasileirão Série A has finer continental bands than the generic
 * `qualificationSpots` count used elsewhere (scenarioEngine/mockProvider): positions
 * 1-4 go straight to the Libertadores group stage, 5-6 enter the Libertadores
 * qualifying playoff, and 7-12 go to the Sul-Americana. Any other competition falls
 * back to the single generic qualification/relegation banding already used across the
 * app, so this stays safe even though the app is scoped to BSA only right now.
 */
export function getZoneBand(position: number, totalTeams: number, competition: Competition): ZoneBand | null {
  if (competition.id === "brasileirao-serie-a") {
    if (position <= 4) return { tone: "libertadores", label: "Libertadores" };
    if (position <= 6) return { tone: "pre-libertadores", label: "Pré-Libertadores" };
    if (position <= 12) return { tone: "sula", label: "Sul-Americana" };
    if (competition.hasRelegation && competition.relegationSpots && position > totalTeams - competition.relegationSpots) {
      return { tone: "relegation", label: "Rebaixamento" };
    }
    return null;
  }

  if (competition.qualificationSpots && position <= competition.qualificationSpots) {
    return { tone: "libertadores", label: "Classificação" };
  }
  if (competition.hasRelegation && competition.relegationSpots && position > totalTeams - competition.relegationSpots) {
    return { tone: "relegation", label: "Rebaixamento" };
  }
  return null;
}
