import Link from "next/link";
import type { TeamStanding } from "@/services/sportsData/types";
import { groupStandingsByGroup } from "@/services/sportsData/worldCup";

export function GroupStandings({ standings, competitionId }: { standings: TeamStanding[]; competitionId: string }) {
  const groups = groupStandingsByGroup(standings);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map(({ group, teams }) => (
        <div key={group} className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <h3 className="bg-emerald-700 px-3 py-2 text-sm font-bold text-white">{group}</h3>
          <table className="w-full text-xs">
            <thead className="bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-2 py-1.5 text-left">#</th>
                <th className="px-2 py-1.5 text-left">Seleção</th>
                <th className="px-2 py-1.5 text-center">P</th>
                <th className="px-2 py-1.5 text-center">J</th>
                <th className="px-2 py-1.5 text-center">SG</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.teamId} className="border-t border-neutral-100 dark:border-neutral-900">
                  <td className="px-2 py-1.5">{team.position}</td>
                  <td className="px-2 py-1.5">
                    <Link
                      href={`/competicao/${competitionId}/time/${team.teamId}`}
                      className="font-medium hover:underline"
                    >
                      {team.teamName}
                    </Link>
                  </td>
                  <td className="px-2 py-1.5 text-center font-semibold">{team.points}</td>
                  <td className="px-2 py-1.5 text-center">{team.played}</td>
                  <td className="px-2 py-1.5 text-center">{team.goalDifference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
