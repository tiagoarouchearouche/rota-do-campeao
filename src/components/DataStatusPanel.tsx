import type { Competition, DataProvider } from "@/services/sportsData/types";

const SOURCE_LABEL: Record<DataProvider, string> = {
  "api-football": "API-Football",
  "football-data": "football-data.org",
  mock: "Demonstração (mock)",
};

export function DataStatusPanel({
  source,
  updatedAt,
  isMock,
  cached,
  competition,
  showTechnicalStatus,
}: {
  source: DataProvider;
  updatedAt: string;
  isMock: boolean;
  cached?: boolean;
  competition?: Competition;
  showTechnicalStatus?: boolean;
}) {
  if (!showTechnicalStatus) return null;

  const formattedDate = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(updatedAt)
  );
  const mapped = competition ? competition.status !== "needs_mapping" : undefined;

  return (
    <details className="group rounded-md border border-border text-xs">
      <summary className="cursor-pointer list-none px-3 py-1.5 font-medium text-muted marker:content-none">
        <span className="inline-flex items-center gap-1.5">
          Status técnico dos dados
          <span className="text-muted-2 transition group-open:rotate-45">+</span>
        </span>
      </summary>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border px-3 py-2 text-muted sm:grid-cols-3">
        <div>
          <dt className="text-muted-2">Provider usado</dt>
          <dd className="font-medium text-white">{SOURCE_LABEL[source]}</dd>
        </div>
        <div>
          <dt className="text-muted-2">Última atualização</dt>
          <dd className="font-medium text-white">{formattedDate}</dd>
        </div>
        <div>
          <dt className="text-muted-2">Veio do cache?</dt>
          <dd className="font-medium text-white">{cached ? "Sim" : "Não"}</dd>
        </div>
        <div>
          <dt className="text-muted-2">Houve fallback para mock?</dt>
          <dd className="font-medium text-white">{isMock ? "Sim" : "Não"}</dd>
        </div>
        {mapped !== undefined && (
          <div>
            <dt className="text-muted-2">Competição mapeada?</dt>
            <dd className="font-medium text-white">{mapped ? "Sim" : "Não (needs_mapping)"}</dd>
          </div>
        )}
      </dl>
    </details>
  );
}
