import type { DataProvider } from "@/services/sportsData/types";

const LABELS: Record<DataProvider, string> = {
  "api-football": "API-Football",
  "football-data": "football-data.org",
  mock: "Demonstração",
};

const STYLES: Record<DataProvider, string> = {
  "api-football": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  "football-data": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  mock: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

export function DataSourceBadge({ source }: { source: DataProvider }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[source]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      Fonte: {LABELS[source]}
    </span>
  );
}
