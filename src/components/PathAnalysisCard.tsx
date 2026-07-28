"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import type { PathAnalysis } from "@/services/sportsData/types";

const RISK_STYLES: Record<PathAnalysis["riskLevel"], string> = {
  low: "bg-success/15 text-success",
  medium: "bg-blue-400/15 text-blue-300",
  high: "bg-warning/15 text-warning",
  critical: "bg-danger/15 text-danger",
};

const RISK_NUMBER_COLOR: Record<PathAnalysis["riskLevel"], string> = {
  low: "text-success",
  medium: "text-blue-300",
  high: "text-warning",
  critical: "text-danger",
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
        // usuário cancelou o compartilhamento nativo — cai para copiar ao clipboard abaixo
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
    <div className="flex flex-col gap-3 rounded-md border border-border bg-graphite p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-base font-bold text-white">{TITLE_LABEL[analysis.target]}</h3>
        <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${RISK_STYLES[analysis.riskLevel]}`}>
          {RISK_LABEL[analysis.riskLevel]}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span className={`font-display text-4xl font-bold tabular-nums ${RISK_NUMBER_COLOR[analysis.riskLevel]}`}>
          {analysis.pointsNeeded}
        </span>
        <span className="pb-1 text-sm text-muted">pontos necessários ({analysis.minimumWinsNeeded} vitórias aprox.)</span>
      </div>

      <p className="text-sm text-muted">{analysis.message}</p>

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted-2">Pontos máx. possíveis</dt>
          <dd className="font-semibold text-white">{analysis.maximumPossiblePoints}</dd>
        </div>
        <div>
          <dt className="text-muted-2">Linha de corte estimada</dt>
          <dd className="font-semibold text-white">{analysis.estimatedCutLine}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 self-start rounded-md border border-border px-3 py-1.5 text-xs font-medium text-white hover:bg-surface"
      >
        {shared ? <Check size={14} aria-hidden="true" /> : <Share2 size={14} aria-hidden="true" />}
        {shared ? "Copiado!" : "Compartilhar este resultado"}
      </button>
    </div>
  );
}
