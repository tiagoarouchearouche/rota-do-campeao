"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Search, Loader2, ShieldQuestion } from "lucide-react";
import type { TeamSearchResult } from "@/services/sportsData/types";

const STATUS_LABEL: Record<string, string> = {
  available: "Disponível",
  unavailable_plan: "Indisponível no plano atual",
};

const FEATURED_TEAMS = [
  "Flamengo",
  "Palmeiras",
  "Corinthians",
  "São Paulo",
  "Botafogo",
  "Real Madrid",
  "Barcelona",
  "Arsenal",
];

type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";

export function TeamSearch({ variant = "hero" }: { variant?: "hero" | "compact" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TeamSearchResult[]>([]);
  const [selected, setSelected] = useState<TeamSearchResult | null>(null);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const inputId = useId();

  useEffect(() => {
    if (query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await fetch(`/api/search-team?query=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("search_failed");
        const json = await res.json();
        const found: TeamSearchResult[] = Array.isArray(json?.results) ? json.results : [];
        setResults(found);
        setStatus(found.length > 0 ? "success" : "empty");
        setOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
        setStatus("error");
        setOpen(true);
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
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < results.length) {
        event.preventDefault();
        selectTeam(results[activeIndex]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const isHero = variant === "hero";

  return (
    <div ref={containerRef} className="relative flex w-full max-w-xl flex-col gap-3">
      <label htmlFor={inputId} className="sr-only">
        Digite o nome do seu time
      </label>
      <div className="relative flex items-stretch overflow-hidden rounded-md bg-white shadow-lg">
        <span className="flex items-center pl-4 text-graphite/60" aria-hidden="true">
          <Search size={20} />
        </span>
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Digite o nome do seu time"
          autoComplete="off"
          className={`min-w-0 flex-1 border-0 bg-transparent px-3 text-graphite outline-none placeholder:text-graphite/50 ${
            isHero ? "py-4 text-base" : "py-2.5 text-sm"
          }`}
        />
        <button
          type="button"
          onClick={() => setOpen(results.length > 0)}
          className="flex shrink-0 items-center gap-2 bg-lime px-5 font-bold text-ink transition hover:bg-lime-dark"
        >
          {status === "loading" ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}
          Buscar time
        </button>
      </div>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Resultados da busca"
          className="absolute top-full z-20 mt-2 w-full overflow-hidden rounded-md border border-border bg-graphite shadow-xl"
        >
          {status === "loading" && (
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-muted">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Buscando...
            </p>
          )}

          {status === "success" &&
            results.slice(0, 8).map((team, index) => (
              <button
                key={team.teamId}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                type="button"
                onClick={() => selectTeam(team)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-white transition ${
                  index === activeIndex ? "bg-surface-hover" : "hover:bg-surface"
                }`}
              >
                <span className="font-medium">{team.teamName}</span>
                <span className="text-xs text-muted-2">
                  {team.competitions.length} competiç{team.competitions.length === 1 ? "ão" : "ões"}
                </span>
              </button>
            ))}

          {status === "empty" && (
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-muted">
              <ShieldQuestion size={16} aria-hidden="true" />
              Nenhum time encontrado com esse nome nas competições disponíveis.
            </p>
          )}

          {status === "error" && (
            <p className="px-4 py-3 text-sm text-warning">
              Não foi possível buscar agora. Verifique sua conexão e tente novamente.
            </p>
          )}
        </div>
      )}

      {isHero && query.trim().length === 0 && !selected && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-2">Times em destaque:</span>
          {FEATURED_TEAMS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setQuery(name)}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-muted transition hover:border-lime hover:text-white"
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="rounded-md border border-border bg-graphite p-4">
          <p className="mb-3 text-sm font-semibold text-white">
            <span className="text-lime">{selected.teamName}</span> encontrado
            {selected.competitions.length > 0 ? " — competições disponíveis:" : ""}
          </p>
          {selected.competitions.length === 0 ? (
            <p className="text-sm text-muted">
              Não encontramos esse time em nenhuma competição disponível no momento.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {selected.competitions.map((c) => (
                <div
                  key={c.competitionId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-white">{c.name}</span>
                  {c.status === "available" ? (
                    <Link
                      href={`/competicao/${c.competitionId}/time/${selected.teamId}`}
                      className="shrink-0 rounded-md bg-lime px-3 py-1.5 text-xs font-bold text-ink hover:bg-lime-dark"
                    >
                      Analisar este time
                    </Link>
                  ) : (
                    <span className="shrink-0 rounded-md bg-ink px-2.5 py-1 text-xs text-muted-2">
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
