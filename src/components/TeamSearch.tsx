"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TeamSearchResult } from "@/services/sportsData/types";

const STATUS_LABEL: Record<string, string> = {
  available: "Disponível",
  unavailable_plan: "Indisponível no plano atual",
};

const FEATURED_TEAMS = ["Flamengo", "Palmeiras", "Arsenal", "Real Madrid", "Barcelona", "Bayern"];

export function TeamSearch({ variant = "hero" }: { variant?: "hero" | "compact" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TeamSearchResult[]>([]);
  const [selected, setSelected] = useState<TeamSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search-team?query=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        setResults(json.results ?? []);
        setOpen(true);
      } catch {
        // request aborted by a newer keystroke — ignore
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectTeam(team: TeamSearchResult) {
    setSelected(team);
    setQuery(team.teamName);
    setOpen(false);
  }

  const isHero = variant === "hero";

  return (
    <div ref={containerRef} className="relative flex w-full max-w-xl flex-col gap-3">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Digite o nome do seu time (ex: Flamengo, Arsenal...)"
          className={`w-full rounded-full border-0 px-5 py-3.5 text-base text-neutral-900 shadow-lg outline-none ring-2 ring-transparent focus:ring-emerald-500 ${
            isHero ? "" : "py-2.5 text-sm"
          }`}
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-neutral-400">⟳</span>
        )}

        {open && results.length > 0 && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
            {results.slice(0, 8).map((team) => (
              <button
                key={team.teamId}
                type="button"
                onClick={() => selectTeam(team)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800"
              >
                <span className="font-medium">{team.teamName}</span>
                <span className="text-xs text-neutral-500">
                  {team.competitions.length} competiç{team.competitions.length === 1 ? "ão" : "ões"}
                </span>
              </button>
            ))}
          </div>
        )}

        {open && !loading && query.trim().length >= 2 && results.length === 0 && (
          <div className="absolute z-20 mt-2 w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
            Nenhum time encontrado nas competições disponíveis.
          </div>
        )}
      </div>

      {isHero && query.trim().length === 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-emerald-100/70">Times em destaque:</span>
          {FEATURED_TEAMS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setQuery(name)}
              className="rounded-full bg-white/10 px-3 py-1 text-emerald-50 transition hover:bg-white/20"
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="rounded-xl bg-white/95 p-4 shadow-lg dark:bg-neutral-900/95">
          <p className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            {selected.teamName} está competindo em:
          </p>
          <div className="flex flex-col gap-2">
            {selected.competitions.map((c) => (
              <div
                key={c.competitionId}
                className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
              >
                <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{c.name}</span>
                {c.status === "available" ? (
                  <Link
                    href={`/competicao/${c.competitionId}/time/${selected.teamId}`}
                    className="shrink-0 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Simular nesta competição
                  </Link>
                ) : (
                  <span className="shrink-0 rounded-full bg-neutral-200 px-2.5 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
