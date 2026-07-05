"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { FixturesResponse, StandingsResponse } from "@/services/sportsData/types";
import { resolveWorldCupMode } from "@/services/sportsData/worldCup";
import { LastUpdatedInfo } from "@/components/LastUpdatedInfo";
import { RefreshDataButton } from "@/components/RefreshDataButton";
import { GroupStandings } from "@/components/GroupStandings";
import { FixturesList } from "@/components/FixturesList";
import { ShareButtons } from "@/components/ShareButtons";
import { AdSlot } from "@/components/AdSlot";

const COMPETITION_ID = "copa-do-mundo";

const MODE_COPY: Record<string, { badge: string; notice?: string }> = {
  official_data: { badge: "Fonte: football-data.org" },
  schedule_only: {
    badge: "Calendário real • tabela em simulação",
    notice: "Dados de tabela ainda não disponíveis. Simulação baseada em estrutura pré-torneio.",
  },
  simulation_only: {
    badge: "Modo simulação pré-torneio",
    notice:
      "A Copa do Mundo 2026 ainda não possui dados completos disponíveis nesta fonte. Você pode simular cenários manualmente.",
  },
};

export default function CopaDoMundo2026Page() {
  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [fixtures, setFixtures] = useState<FixturesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState("");

  const load = useCallback(async (refresh: boolean) => {
    const suffix = refresh ? "&refresh=true" : "";
    const [standingsRes, fixturesRes] = await Promise.all([
      fetch(`/api/standings?competitionId=${COMPETITION_ID}${suffix}`).then((r) => r.json()),
      fetch(`/api/fixtures?competitionId=${COMPETITION_ID}${suffix}`).then((r) => r.json()),
    ]);
    setStandings(standingsRes);
    setFixtures(fixturesRes);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShareUrl(window.location.href);
    void load(false);
  }, [load]);

  if (loading && !standings) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-neutral-500">Carregando Copa do Mundo 2026...</p>
      </main>
    );
  }

  if (!standings || !fixtures) return null;

  const mode = resolveWorldCupMode(standings.isMock, fixtures.isMock);
  const copy = MODE_COPY[mode];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← Início
        </Link>
      </div>

      <header className="flex flex-col gap-3 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 text-white">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🌎</span>
          <h1 className="text-2xl font-bold sm:text-3xl">Copa do Mundo FIFA 2026</h1>
        </div>
        <p className="text-emerald-50/90">48 seleções, 12 grupos — o maior Mundial da história.</p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-white/15 px-3 py-1 font-medium">{copy.badge}</span>
          {!standings.isMock && <LastUpdatedInfo updatedAt={standings.updatedAt} />}
          <RefreshDataButton onRefresh={() => load(true)} />
        </div>
      </header>

      {copy.notice && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          ℹ️ {copy.notice}
        </div>
      )}

      <AdSlot type="in-content" />

      {mode === "official_data" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Grupos</h2>
          <GroupStandings standings={standings.data} competitionId={COMPETITION_ID} />
        </section>
      )}

      {!fixtures.isMock && fixtures.data.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Jogos e mata-mata</h2>
          <FixturesList fixtures={fixtures.data} />
        </section>
      )}

      {fixtures.isMock && mode === "official_data" && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          ℹ️ Calendário de jogos indisponível no momento nesta fonte.
        </div>
      )}

      {mode === "simulation_only" && (
        <section className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="max-w-md text-neutral-600 dark:text-neutral-400">
            Enquanto os dados oficiais não chegam, monte sua própria previsão de campeão e compartilhe com os
            amigos.
          </p>
        </section>
      )}

      <section className="flex flex-wrap gap-3">
        <Link
          href={`/competicao/${COMPETITION_ID}?tab=simulacao`}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          🏆 Montar minha previsão
        </Link>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Compartilhar chave
        </h2>
        <ShareButtons
          shareUrl={shareUrl}
          teamName="Minha previsão"
          competitionName="Copa do Mundo FIFA 2026"
          summaryLines={["Confira minha previsão para a Copa do Mundo 2026 no Rota do Campeão!"]}
        />
      </section>

      <AdSlot type="footer" />
    </main>
  );
}
