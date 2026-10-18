"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { TeamStanding } from "@/services/sportsData/types";
import { TeamLogo } from "@/components/TeamLogo";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function MyTeamSelector({
  standings,
  value,
  onSelect,
}: {
  standings: TeamStanding[];
  value: string | null;
  onSelect: (teamId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const inputId = useId();

  const selectedTeam = standings.find((team) => team.teamId === value) ?? null;

  const filtered = useMemo(() => {
    if (!query.trim()) return standings;
    const needle = normalize(query);
    return standings.filter((team) => normalize(team.teamName).includes(needle));
  }, [standings, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(teamId: string) {
    onSelect(teamId);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const team = filtered[activeIndex];
      if (team) select(team.teamId);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-white">
        Meu time
      </label>
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-owns={listboxId}
        aria-controls={listboxId}
        className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5"
      >
        {selectedTeam && !open && <TeamLogo team={selectedTeam.teamName} size="sm" />}
        <Search size={16} className="text-muted-2" aria-hidden="true" />
        <input
          id={inputId}
          type="text"
          role="textbox"
          aria-autocomplete="list"
          aria-activedescendant={open ? `${listboxId}-${activeIndex}` : undefined}
          placeholder={selectedTeam ? selectedTeam.teamName : "Escolher meu time"}
          value={open ? query : ""}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-sm text-white placeholder:text-muted-2 focus:outline-none"
        />
        <ChevronDown size={16} className={`shrink-0 text-muted-2 transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </div>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Times do Brasileirão Série A"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-graphite shadow-lg"
        >
          {filtered.length === 0 && <li className="px-3 py-2.5 text-sm text-muted">Nenhum time encontrado.</li>}
          {filtered.map((team, index) => (
            <li key={team.teamId} id={`${listboxId}-${index}`} role="option" aria-selected={team.teamId === value}>
              <button
                type="button"
                onClick={() => select(team.teamId)}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-surface ${
                  index === activeIndex ? "bg-surface" : ""
                }`}
              >
                <TeamLogo team={team.teamName} size="sm" />
                <span className="text-white">{team.teamName}</span>
                <span className="ml-auto text-xs text-muted-2">{team.position}º</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
