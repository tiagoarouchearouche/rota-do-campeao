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
    <details className="group rounded-md border border-neutral-200 text-xs dark:border-neutral-800">
      <summary className="cursor-pointer list-none px-3 py-1.5 font-medium text-neutral-500 marker:content-none dark:text-neutral-400">
        <span className="inline-flex items-center gap-1.5">
          ⚙️ Status dos dados
          <span className="text-neutral-400 transition group-open:rotate-45">+</span>
        </span>
      </summary>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-neutral-200 px-3 py-2 text-neutral-600 sm:grid-cols-3 dark:border-neutral-800 dark:text-neutral-400">
        <div>
          <dt className="text-neutral-400">Provider usado</dt>
          <dd className="font-medium">{SOURCE_LABEL[source]}</dd>
        </div>
        <div>
          <dt className="text-neutral-400">Última atualização</dt>
          <dd className="font-medium">{formattedDate}</dd>
        </div>
        <div>
          <dt className="text-neutral-400">Veio do cache?</dt>
          <dd className="font-medium">{cached ? "Sim" : "Não"}</dd>
        </div>
        <div>
          <dt className="text-neutral-400">Houve fallback para mock?</dt>
          <dd className="font-medium">{isMock ? "Sim" : "Não"}</dd>
        </div>
        {mapped !== undefined && (
          <div>
            <dt className="text-neutral-400">Competição mapeada?</dt>
            <dd className="font-medium">{mapped ? "Sim" : "Não (needs_mapping)"}</dd>
          </div>
        )}
      </dl>
    </details>
  );
}
