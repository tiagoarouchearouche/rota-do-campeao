import type { Competition } from "@/services/sportsData/types";

const LABELS: Record<NonNullable<Competition["status"]>, string> = {
  available: "Disponível",
  unavailable_plan: "Indisponível no plano atual",
  coming_soon: "Em breve",
  needs_mapping: "Em breve",
};

const STYLES: Record<NonNullable<Competition["status"]>, string> = {
  available: "bg-success/15 text-success",
  unavailable_plan: "bg-warning/15 text-warning",
  coming_soon: "bg-muted-2/15 text-muted-2",
  needs_mapping: "bg-muted-2/15 text-muted-2",
};

export function CompetitionStatusBadge({ competition }: { competition: Competition }) {
  const status = competition.status ?? "available";
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
