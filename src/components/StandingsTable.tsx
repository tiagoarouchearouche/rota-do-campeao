import Link from "next/link";
import type { TeamStanding } from "@/services/sportsData/types";

const ROW_STYLES: Record<string, string> = {
  title_race: "border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20",
  qualification_zone: "border-l-4 border-blue-500 bg-blue-50/40 dark:bg-blue-950/20",
  mid_table: "border-l-4 border-transparent",
  relegation_risk: "border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
  relegation_zone: "border-l-4 border-red-500 bg-red-50/50 dark:bg-red-950/20",
};

const LEGEND: { status: string; label: string; color: string }[] = [
  { status: "title_race", label: "G4 / Título", color: "bg-emerald-500" },
  { status: "qualification_zone", label: "Classificação", color: "bg-blue-500" },
  { status: "relegation_risk", label: "Risco de rebaixamento", color: "bg-amber-500" },
  { status: "relegation_zone", label: "Rebaixamento", color: "bg-red-500" },
];

function FormBadges({ form }: { form?: string }) {
  if (!form) return <span className="text-neutral-400">—</span>;
  return (
    <div className="flex gap-0.5">
      {form.split("").map((letter, index) => (
        <span
          key={index}
          className={`flex h-4 w-4 items-center justify-center rounded-sm text-[9px] font-bold text-white ${
            letter === "W" ? "bg-emerald-500" : letter === "D" ? "bg-neutral-400" : "bg-red-500"
          }`}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}

export function StandingsTable({
  standings,
  competitionId,
}: {
  standings: TeamStanding[];
  competitionId: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Desktop / tablet: full table */}
      <div className="hidden overflow-x-auto rounded-lg border border-neutral-200 sm:block dark:border-neutral-800">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-neutral-100 text-left text-xs uppercase text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2 text-center font-bold">PTS</th>
              <th className="px-3 py-2 text-center">J</th>
              <th className="px-3 py-2 text-center">V</th>
              <th className="px-3 py-2 text-center">E</th>
              <th className="px-3 py-2 text-center">D</th>
              <th className="px-3 py-2 text-center">GP</th>
              <th className="px-3 py-2 text-center">GC</th>
              <th className="px-3 py-2 text-center">SG</th>
              <th className="px-3 py-2 text-center">%</th>
              <th className="px-3 py-2">Últimos</th>
              <th className="px-3 py-2">Próx.</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team) => (
              <tr
                key={team.teamId}
                className={`${ROW_STYLES[team.status ?? "mid_table"]} border-b border-neutral-100 last:border-0 dark:border-neutral-900`}
              >
                <td className="px-3 py-2 font-medium">{team.position}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`/competicao/${competitionId}/time/${team.teamId}`}
                    className="font-medium hover:underline"
                  >
                    {team.teamName}
                  </Link>
                </td>
                <td className="px-3 py-2 text-center font-bold">{team.points}</td>
                <td className="px-3 py-2 text-center">{team.played}</td>
                <td className="px-3 py-2 text-center">{team.wins}</td>
                <td className="px-3 py-2 text-center">{team.draws}</td>
                <td className="px-3 py-2 text-center">{team.losses}</td>
                <td className="px-3 py-2 text-center">{team.goalsFor}</td>
                <td className="px-3 py-2 text-center">{team.goalsAgainst}</td>
                <td className="px-3 py-2 text-center">{team.goalDifference}</td>
                <td className="px-3 py-2 text-center">{team.percentage ?? "—"}%</td>
                <td className="px-3 py-2">
                  <FormBadges form={team.form} />
                </td>
                <td className="px-3 py-2 text-xs whitespace-nowrap text-neutral-500">{team.nextMatch ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list */}
      <div className="flex flex-col gap-2 sm:hidden">
        {standings.map((team) => (
          <Link
            key={team.teamId}
            href={`/competicao/${competitionId}/time/${team.teamId}`}
            className={`flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800 ${ROW_STYLES[team.status ?? "mid_table"]}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold dark:bg-neutral-800">
                  {team.position}
                </span>
                <span className="font-semibold">{team.teamName}</span>
              </div>
              <span className="text-lg font-bold">{team.points} pts</span>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>
                {team.played}J · {team.wins}V {team.draws}E {team.losses}D · SG {team.goalDifference}
              </span>
              <span>{team.percentage ?? "—"}% aprov.</span>
            </div>
            <div className="flex items-center justify-between">
              <FormBadges form={team.form} />
              <span className="text-xs text-neutral-500">{team.nextMatch ?? "—"}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        {LEGEND.map((item) => (
          <span key={item.status} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
