import type { Competition } from "@/services/sportsData/types";

const LABELS: Record<NonNullable<Competition["status"]>, string> = {
  available: "Disponível",
  unavailable_plan: "Indisponível no plano atual",
  coming_soon: "Em breve",
  needs_mapping: "Em análise",
  pre_tournament: "Pré-torneio",
  no_current_data: "Sem dados no momento",
};

const STYLES: Record<NonNullable<Competition["status"]>, string> = {
  available: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  unavailable_plan: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  coming_soon: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  needs_mapping: "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  pre_tournament: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  no_current_data: "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

export function CompetitionStatusBadge({ competition }: { competition: Competition }) {
  const status = competition.status ?? "available";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
