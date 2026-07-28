import { CheckCircle2, AlertTriangle, CircleSlash } from "lucide-react";
import type { DataProvider } from "@/services/sportsData/types";

type DataState = "official" | "demo" | "unavailable";

function resolveState(source: DataProvider, isMock: boolean, empty: boolean): DataState {
  if (empty) return "unavailable";
  if (isMock || source === "mock") return "demo";
  return "official";
}

const CONFIG: Record<DataState, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  official: {
    label: "Dados oficiais atualizados",
    className: "bg-success/15 text-success border-success/30",
    Icon: CheckCircle2,
  },
  demo: {
    label: "Dados demonstrativos",
    className: "bg-warning/15 text-warning border-warning/30",
    Icon: AlertTriangle,
  },
  unavailable: {
    label: "Dados indisponíveis",
    className: "bg-muted-2/15 text-muted-2 border-muted-2/30",
    Icon: CircleSlash,
  },
};

/**
 * The single source of truth for "is this real" across the app — never render a
 * competing claim (like a marketing label saying "tabela real") next to this badge.
 */
export function DataSourceBadge({
  source,
  isMock,
  empty = false,
}: {
  source: DataProvider;
  isMock: boolean;
  empty?: boolean;
}) {
  const state = resolveState(source, isMock, empty);
  const { label, className, Icon } = CONFIG[state];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${className}`}>
      <Icon size={13} aria-hidden="true" />
      {label}
    </span>
  );
}
