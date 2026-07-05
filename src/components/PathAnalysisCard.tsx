"use client";

import { useState } from "react";
import type { PathAnalysis } from "@/services/sportsData/types";

const RISK_STYLES: Record<PathAnalysis["riskLevel"], string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  high: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const RISK_NUMBER_COLOR: Record<PathAnalysis["riskLevel"], string> = {
  low: "text-emerald-600 dark:text-emerald-400",
  medium: "text-blue-600 dark:text-blue-400",
  high: "text-amber-600 dark:text-amber-400",
  critical: "text-red-600 dark:text-red-400",
};

const RISK_LABEL: Record<PathAnalysis["riskLevel"], string> = {
  low: "Risco baixo",
  medium: "Risco médio",
  high: "Risco alto",
  critical: "Risco crítico",
};

const TITLE_LABEL: Record<PathAnalysis["target"], string> = {
  title: "Caminho para o título",
  qualification: "Caminho para a classificação",
  avoid_relegation: "Caminho para evitar o rebaixamento",
};

export function PathAnalysisCard({ analysis }: { analysis: PathAnalysis }) {
  const [shared, setShared] = useState(false);

  async function handleShare() {
    const text = `${TITLE_LABEL[analysis.target]}: ${analysis.message}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // usuário cancelou o compartilhamento nativo — cai para copiar ao portal-clipboard abaixo
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // clipboard indisponível — sem ação adicional possível
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{TITLE_LABEL[analysis.target]}</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${RISK_STYLES[analysis.riskLevel]}`}>
          {RISK_LABEL[analysis.riskLevel]}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span className={`text-4xl font-extrabold tabular-nums ${RISK_NUMBER_COLOR[analysis.riskLevel]}`}>
          {analysis.pointsNeeded}
        </span>
        <span className="pb-1 text-sm text-neutral-500 dark:text-neutral-400">
          pontos necessários ({analysis.minimumWinsNeeded} vitórias aprox.)
        </span>
      </div>

      <p className="text-sm text-neutral-600 dark:text-neutral-400">{analysis.message}</p>

      <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-neutral-500">Pontos máx. possíveis</dt>
          <dd className="font-semibold">{analysis.maximumPossiblePoints}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Linha de corte estimada</dt>
          <dd className="font-semibold">{analysis.estimatedCutLine}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={handleShare}
        className="self-start rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        {shared ? "Copiado!" : "🔗 Compartilhar este resultado"}
      </button>
    </div>
  );
}
